import { useEffect, useState, useCallback, useRef } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import SalaryStructureForm from "./SalaryStructureForm";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";
import {
  fetchSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getActledList,
  fetchSalaryTemplates,
  fetchActiveIncomeHeads,
  fetchActiveDeductionHeads,
  fetchSalaryStructureById
} from "../../../../../utils/api";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

const initialState = {
  employee_id: "",
  employee_name: "",
  grade: "",
  type: "Grade Wise",
  salary_template_id: "",
  effective_from: "",
  ctc: "",
  gross_monthly: "",
  total_income: 0,
  total_deduction: 0,
  net_salary: 0,
  revision_reason: "",
  arrear_applicable: "No",
  status: "Active",
};

const columns = [
  { key: "employee_name", label: "Employee" },
  { key: "grade_label", label: "Grade" },  // 👈 grade_label = display name, grade = raw ID
  { key: "type", label: "Type" },
  { key: "effective_from", label: "Effective From" },
  { key: "ctc", label: "CTC" },
  { key: "gross_monthly", label: "Gross/mo" },
  { key: "net_salary", label: "Net" },
  { key: "status", label: "Status" },
];

const SalaryStructure = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [incomeHeads, setIncomeHeads] = useState([]);
  const [deductionHeads, setDeductionHeads] = useState([]);

  const latestRequestId = useRef(0);
  const invalidatePendingFetches = () => { latestRequestId.current++; };

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateSalaryStructure(data.salary_structure_id, data)
        : await createSalaryStructure(data);
    },
    () => loadList(),
    tab?.appl_name || "Salary Structure"
  );

  const handleAddWrapped = () => {
    invalidatePendingFetches(); 
    handleAdd();
  };

  const handleModifyWrapped = () => {
    invalidatePendingFetches();
    handleModify();
  };

  const handleEditCancelWrapped = () => {
    invalidatePendingFetches();
    handleEditCancel();
  };

  const { options: groupOptions, loading: optionsLoading } = useGroupOptions(); 
  const loadList = useCallback(async (opts = {}) => {
    try {
      setLoading(true);
      const data = await fetchSalaryStructures();
      const rawTemplates = Array.isArray(data) ? data : data?.data || []; 
      const finalData = rawTemplates.map(template => {
        const matchingGrade = (groupOptions.grade || []).find(
          g => String(g.value) === String(template.grade)
        );
        return {
          ...template,
          grade: template.grade,
          grade_label: matchingGrade ? matchingGrade.label : template.grade,
        };
      });

      setList(finalData); 
      if (opts.selectFirst && finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load salary templates");
    } finally {
      setLoading(false);
    }
  }, [setFormData, groupOptions.grade]);

  const loadSupportingData = useCallback(async () => {
    try {
      const [empRes, tplRes, ihRes, dhRes] = await Promise.all([
        getActledList(),
        fetchSalaryTemplates(),
        fetchActiveIncomeHeads(),
        fetchActiveDeductionHeads(),
      ]);
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.data || []);
      setTemplates(Array.isArray(tplRes) ? tplRes : tplRes?.data || []);
      setIncomeHeads(Array.isArray(ihRes) ? ihRes : ihRes?.data || []);
      setDeductionHeads(Array.isArray(dhRes) ? dhRes : dhRes?.data || []);
    } catch (err) {
      alertError("Load Error", "Failed to load supporting data");
    }
  }, []);
 
  useEffect(() => {
    loadSupportingData();
  }, []);

  useEffect(() => {
    if (groupOptions.grade && groupOptions.grade.length > 0) {
      loadList({ selectFirst: true });
    }
  }, [groupOptions.grade]);

  useEffect(() => {
    if (!(showForm && mode === "view" && list.length > 0)) return;

    const row = list[currentIndex];
    if (!row?.salary_structure_id) return;
 
    if (
      formData.salary_structure_id === row.salary_structure_id &&
      (formData.incomeLines || formData.deductionLines)
    ) {
      return;
    }

    const requestId = ++latestRequestId.current;

    (async () => {
      try {
        const res = await fetchSalaryStructureById(row.salary_structure_id);
        if (requestId !== latestRequestId.current) return;
        setFormData(res?.data || row);
      } catch {
        if (requestId !== latestRequestId.current) return;
        setFormData(row);
      }
    })();
  }, [currentIndex, list, showForm, mode, setFormData, formData.salary_structure_id, formData.incomeLines, formData.deductionLines]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry") setShowForm(true);
  };

  // ── Row double-click (race-safe) ────────────────────────────────
  const handleRowSelect = async (row) => {
    const index = list.findIndex(i => i.salary_structure_id === row.salary_structure_id);
    if (index !== -1) setCurrentIndex(index);

    const requestId = ++latestRequestId.current;

    try {
      const res = await fetchSalaryStructureById(row.salary_structure_id);
      if (requestId !== latestRequestId.current) return; // ek naya click ho chuka, ye response purana hai
      handleView(res?.data || row);
    } catch {
      if (requestId !== latestRequestId.current) return;
      handleView(row);
    }
  };
 
  const handleSidebarViewPick = async (emp) => {
    const existingStructure = list.find(
      s => String(s.employee_id) === String(emp.Actled_id)
    );
    if (!existingStructure) return;

    const requestId = ++latestRequestId.current;

    try {
      const res = await fetchSalaryStructureById(existingStructure.salary_structure_id);
      if (requestId !== latestRequestId.current) return;

      handleView(res?.data || existingStructure);
      const index = list.findIndex(i => i.salary_structure_id === existingStructure.salary_structure_id);
      if (index !== -1) setCurrentIndex(index);
    } catch {
      if (requestId !== latestRequestId.current) return;
      handleView(existingStructure);
    }
  };
 
  const handleSave = async (updatedData) => {
    const response = await performSave("salary_structure_id", updatedData);
    if (response?.success) {
      await loadList(); // ab formData ko touch nahi karega

      const savedId = response.data?.salary_structure_id || updatedData.salary_structure_id;
      if (savedId) {
        const requestId = ++latestRequestId.current;
        try {
          const fullRes = await fetchSalaryStructureById(savedId);
          if (requestId !== latestRequestId.current) return; // beech mein kahin aur click ho gaya
          if (fullRes?.data) {
            setFormData(fullRes.data);
          }
        } catch (err) { 
        }
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete structure for "${row.employee_name}"?` });
    if (confirmed) {
      const res = await deleteSalaryStructure(row.salary_structure_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.salary_structure_id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} structure(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteSalaryStructure(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some structures");
    }
  };
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAddWrapped,      // 👈 changed
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <SalaryStructureForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setShowForm(false)}
          mode={mode}
          saving={saving}
          onModify={handleModifyWrapped}   
          onNewEntry={handleAddWrapped}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancelWrapped}
          activeTab="entry"
          onTabChange={handleTabChange}
          employees={employees}
          templates={templates}
          incomeHeads={incomeHeads}
          deductionHeads={deductionHeads}
          structuresList={list}
          onSidebarViewPick={handleSidebarViewPick}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            activeTab="search"
            onTabChange={handleTabChange}
            title="Salary Structure"
            data={list}
            columns={columns}
            rowKey="salary_structure_id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;

import { useEffect, useState, useCallback } from "react";
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
  employee_id:        "",
  employee_name:      "",
  grade:              "",
  type:               "Grade Wise",
  salary_template_id: "",
  effective_from:     "",
  ctc:                "",
  gross_monthly:      "",
  total_income:       0,
  total_deduction:    0,
  net_salary:         0,
  revision_reason:    "",
  arrear_applicable:  "No",
  status:             "Active",
};

const columns = [
  { key: "employee_name",     label: "Employee"       },
  { key: "grade",             label: "Grade"          },
  { key: "type",              label: "Type"           },
  { key: "effective_from",    label: "Effective From" },
  { key: "ctc",               label: "CTC"            },
  { key: "gross_monthly",     label: "Gross/mo"       },
  { key: "net_salary",        label: "Net"            },
  { key: "status",            label: "Status"         },
];

const SalaryStructure = ({ tab }) => {
  const [list, setList]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [employees, setEmployees]           = useState([]);   // All employees from Actled
  const [templates, setTemplates]           = useState([]);   // All salary templates
  const [incomeHeads, setIncomeHeads]       = useState([]);   // Master list for Manual mode
  const [deductionHeads, setDeductionHeads] = useState([]);

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

  // ── Load list ──────────────────────────────────────────────
  const { options: groupOptions, loading: optionsLoading } = useGroupOptions(); 
const formatGradeWithLabel = useCallback((gradeId) => {
  const matchingGrade = groupOptions?.grade?.find(
    g => String(g.value) === String(gradeId)
  );
  return matchingGrade ? matchingGrade.label : gradeId;
}, [groupOptions?.grade]);
const loadList = useCallback(async () => {
  try {
    setLoading(true);
    const data = await fetchSalaryStructures();
    
    const rawTemplates = Array.isArray(data) ? data : data?.data || [];
    
    const finalData = rawTemplates.map(template => {
      // Hook ki list se matching grade dhoondo
      const matchingGrade = groupOptions.grade.find(
        g => String(g.value) === String(template.grade)
      );

      return {
        ...template, 
        grade: matchingGrade ? matchingGrade.label :undefined
      };
    });

    setList(finalData);
    
    if (finalData.length > 0) {
      // Ab yahan direct Grade Name print hoga (jaise "Grade A"), ID nahi!

      
      setFormData(finalData[0]);
      setCurrentIndex(0);
    }
  } catch (err) {
    alertError("Fetch Error", "Failed to load salary templates");
  } finally {
    setLoading(false);
  }
}, [setFormData, groupOptions.grade]);
  // ── Load supporting data once ──────────────────────────────
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
    loadList();
    loadSupportingData();
  }, []);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

const handleRowSelect = async (row) => {
  const index = list.findIndex(i => i.salary_structure_id === row.salary_structure_id);
  if (index !== -1) setCurrentIndex(index);

  try {
    const res = await fetchSalaryStructureById(row.salary_structure_id);
    handleView(res?.data || row);  // ← incomeLines + deductionLines included
  } catch {
    handleView(row);  // fallback
  }
};
const handleSidebarViewPick = async (emp) => {
  const existingStructure = list.find(
    s => String(s.employee_id) === String(emp.Actled_id)
  );
  if (!existingStructure) return;
  try {
    const res = await fetchSalaryStructureById(existingStructure.salary_structure_id);
    handleView(res?.data || existingStructure);
    const index = list.findIndex(i => i.salary_structure_id === existingStructure.salary_structure_id);
    if (index !== -1) setCurrentIndex(index);
  } catch {
    handleView(existingStructure);
  }
};
  const handleSave = async (updatedData) => {
    const response = await performSave("salary_structure_id", updatedData);
    if (response?.success) {
      await loadList();
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
      onPrevRecord: () => setCurrentIndex(p => Math. max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: handleSave,
      onEsc:  () => setShowForm(false),
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
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
          employees={employees}
          templates={templates}
          incomeHeads={incomeHeads}
          deductionHeads={deductionHeads}
          structuresList={list}
           onSidebarViewPick={handleSidebarViewPick}
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

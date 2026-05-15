import { useEffect, useState, useCallback } from "react";
import Table  from "../../../../../components/Reusable/table/Table";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { confirmDelete ,alertError ,showToast} from "../../../../../components/Reusable/alert";
import SalaryTemplateForm from "./SalaryTemplateForm"; 
import {
  fetchSalaryTemplates, createSalaryTemplate, updateSalaryTemplate, deleteSalaryTemplate,
  fetchActiveIncomeHeads, fetchActiveDeductionHeads,
} from "../../../../../utils/api"; 
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  employee_name:  "",
  code:           "",
  department:     "",
  effectiveFrom:  "",
  status:         "Active",
  incomeHeads:    [],
  deductionHeads: [],
};

const columns = [
  { key: "employee_name",  label: "Name"           },
  { key: "code",           label: "Code"           },
  { key: "department",     label: "Department"     },
  { key: "effective_from", label: "Effective From" },
  { key: "status",         label: "Status"         },
];

const SalaryTemplate = ({ tab }) => {
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomeHeads, setIncomeHeads]   = useState([]);
  const [deductionHeads, setDeductionHeads] = useState([]);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateSalaryTemplate(data.salary_template_id, data)
        : await createSalaryTemplate(data);
    },
    () => loadList(),
    tab.appl_name
  );

  // ── Load template list ──────────────────────────────────────
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSalaryTemplates();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load salary templates");
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  // ── Load income + deduction heads for the form checklist ───
  const loadHeads = useCallback(async () => {
    try {
      const [ihRes, dhRes] = await Promise.all([
        fetchActiveIncomeHeads(),
        fetchActiveDeductionHeads(),
      ]);
      setIncomeHeads(Array.isArray(ihRes) ? ihRes : ihRes?.data || []);
      setDeductionHeads(Array.isArray(dhRes) ? dhRes : dhRes?.data || []);
    } catch (err) {
      alertError("Load Error", "Failed to load income/deduction heads");
    }
  }, []);

  useEffect(() => {
    loadList();
    loadHeads();
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

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.salary_template_id === row.salary_template_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("salary_template_id", updatedData);
    if (response?.success) {
      await loadList();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.employee_name}"?` });
    if (confirmed) {
      const res = await deleteSalaryTemplate(row.salary_template_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: handleSave,
      onEsc:  () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <SalaryTemplateForm
          initialData={formData}
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
          incomeHeads={incomeHeads}
          deductionHeads={deductionHeads}
          formData={formData}
          setFormData={setFormData}
         />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Salary Template Master"
            data={list}
            columns={columns}
            rowKey="salary_template_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default SalaryTemplate;
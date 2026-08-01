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
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

const initialState = {
  grade:          "",
  effective_from: "",
  status:         "Active",
  incomeHeads:    [],
  deductionHeads: [],
};

const columns = [
  { key: "grade_label",    label: "Grade"          },  
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
  const { options: groupOptions, loading: optionsLoading } = useGroupOptions();

  // BUG FIX: loadList grade options ke bina bhi chal jaata tha (race condition) —
  // isliye ab (groupOptions.grade || []) guard laga diya, aur ID milne pe match
  // na ho to raw id hi dikhega, undefined nahi (list gayab nahi hogi).
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSalaryTemplates();
      const rawTemplates = Array.isArray(data) ? data : data?.data || []; 
      const finalData = rawTemplates.map(template => {
        const matchingGrade = (groupOptions.grade || []).find(
          g => String(g.value) === String(template.grade)
        );

        return {
          ...template,
          grade: template.grade,        // 👈 ID as-is, kabhi mutate mat karo
          grade_label: matchingGrade ? matchingGrade.label : template.grade,
        };
      });

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
  }, [setFormData, groupOptions.grade]);
 
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
    loadHeads();
  }, []);

  useEffect(() => {
    if (groupOptions.grade && groupOptions.grade.length > 0) {
      loadList();
    }
  }, [groupOptions.grade]);

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
    const confirmed = await confirmDelete({ title: `Delete template for grade "${row.grade_label || row.grade}"?` });
    if (confirmed) {
      const res = await deleteSalaryTemplate(row.salary_template_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => { 
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.salary_template_id : item
      );
  
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length}  Salary Template(s)?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteSalaryTemplate(id)));
        const failed = results.filter((r) => !r?.success).length;
  
        if (failed === 0) {
          showToast({ icon: "success", title: `${ids.length} deleted` });
        } else {
          showToast({
            icon: "warning",
            title: `${ids.length - failed} deleted, ${failed} failed`,
          });
        }
        loadList();
        setShowForm(false);
      } catch (err) {
        alertError("Delete Error", "Failed to delete some templates");
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
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
         />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
           activeTab="search"
          onTabChange={handleTabChange}
            title="Salary Template Master"
            data={list}
            columns={columns}
            rowKey="salary_template_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default SalaryTemplate;

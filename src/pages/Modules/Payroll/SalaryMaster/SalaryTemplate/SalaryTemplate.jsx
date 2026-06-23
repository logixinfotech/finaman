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
  { key: "grade",          label: "Grade"          },
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
  // const loadList = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     const data = await fetchSalaryTemplates();
     
  //     const finalData = Array.isArray(data) ? data : data?.data || [];
  //     setList(finalData);
  //     console.log( finalData[0].grade)
  //     if (finalData.length > 0) {
  //       setFormData(finalData[0]);
  //       setCurrentIndex(0);
  //     }
  //   } catch (err) {
  //     alertError("Fetch Error", "Failed to load salary templates");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [setFormData]);
  const { options: groupOptions, loading: optionsLoading } = useGroupOptions();
const loadList = useCallback(async () => {
  try {
    setLoading(true);
    const data = await fetchSalaryTemplates();
    
    const rawTemplates = Array.isArray(data) ? data : data?.data || [];
    
    const finalData = rawTemplates.map(template => {
      // Hook ki list se matching grade dhoondo
      const matchingGrade = groupOptions.grade.find(
        g => String(g.value) === String(template.grade)
      );

      return {
        ...template,
        // 👇 Yahan hum 'grade' key ko hi overwrite kar rahe hain ID ke jagah Name se
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
    const confirmed = await confirmDelete({ title: `Delete template for grade "${row.grade}"?` });
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
      // FIX: was using income_head_id by mistake — should be salary_template_id
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

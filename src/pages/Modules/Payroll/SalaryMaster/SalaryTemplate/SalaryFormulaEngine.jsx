import { useEffect, useState, useCallback } from "react";
import Table  from "../../../../../components/Reusable/table/Table";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { confirmDelete ,alertError ,showToast} from "../../../../../components/Reusable/alert"; 
 import SalaryFormulaEngineForm from "./SalaryFormulaEngineForm";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";
import {
  fetchFormulaEngine, createFormula, updateFormula, deleteFormula,
  fetchSalaryTemplates, fetchActiveIncomeHeads, fetchActiveDeductionHeads,
} from "../../../../../utils/api";
 

const initialState = {
  salary_template_id: "",
  head_id:            "",
  head_type:          "",
  formula_type:       "",
  value:              "",
  effective_from:     "",
  status:             "Active",
};

const columns = [
  { key: "template_name",  label: "Template Name"  },
  { key: "head_type",      label: "Head Type"      },
  { key: "formula_type",   label: "Formula Type"   },
  { key: "value",          label: "Value"          },
  { key: "effective_from", label: "Effective From" },
  { key: "status",         label: "Status"         },
];

const SalaryFormulaEngine = ({ tab }) => {
  const [list, setList]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [templates, setTemplates]           = useState([]);   // for dropdown
  const [incomeHeads, setIncomeHeads]       = useState([]);   // for head dropdown
  const [deductionHeads, setDeductionHeads] = useState([]);   // for head dropdown

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateFormula(data.formula_id, data)
        : await createFormula(data);
    },
    () => loadList(),
    tab.appl_name
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFormulaEngine();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load formula engine");
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  const loadDropdowns = useCallback(async () => {
    try {
      const [tplRes, ihRes, dhRes] = await Promise.all([
        fetchSalaryTemplates(),
        fetchActiveIncomeHeads(),
        fetchActiveDeductionHeads(),
      ]);
      setTemplates(Array.isArray(tplRes) ? tplRes : tplRes?.data || []);
      setIncomeHeads(Array.isArray(ihRes) ? ihRes : ihRes?.data || []);
      setDeductionHeads(Array.isArray(dhRes) ? dhRes : dhRes?.data || []);
    } catch (err) {
      alertError("Load Error", "Failed to load dropdowns");
    }
  }, []);

  useEffect(() => {
    loadList();
    loadDropdowns();
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
    const index = list.findIndex(i => i.formula_id === row.formula_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("formula_id", updatedData);
    if (response?.success) await loadList();
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete this formula?` });
    if (confirmed) {
      const res = await deleteFormula(row.formula_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };
  const handleDeleteMultiple = async (selected) => {
      // Normalize: Table may pass an array of row objects OR an array of keys
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.income_head_id : item
      );
  
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length} Formula(s)?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteFormula(id)));
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
        alertError("Delete Error", "Failed to delete some income heads");
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
        <SalaryFormulaEngineForm
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
          templates={templates}
          incomeHeads={incomeHeads}
          deductionHeads={deductionHeads}
          formData={formData}
          setFormData={setFormData}
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
            title="Salary Formula Engine"
            data={list}
            columns={columns}
            rowKey="formula_id"
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

export default SalaryFormulaEngine;
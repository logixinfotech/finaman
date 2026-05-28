import { useEffect, useState, useCallback,useRef } from "react";
import Table from "../../../../../components/Reusable/table/Table"; 
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode"; 
import DeductionHeadForm from "./DeductionHeadForm";
import { fetchDeductionHeads, createDeductionHead, updateDeductionHead, deleteDeductionHead } from "../../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  name: "",
  code: "",
  type: "",
  pre_tax: "Yes",
  status: "Active",
};

const columns = [
  { key: "name",    label: "Name"     },
  { key: "code",    label: "Code"     },
  { key: "type",    label: "Type"     },
  { key: "pre_tax", label: "Pre-Tax"  },
  { key: "status",  label: "Status"   },
];

const DeductionHead = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        ? await updateDeductionHead(data.deduction_head_id, data)
        : await createDeductionHead(data);
    },
    () => loadList(),
    tab.appl_name
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDeductionHeads();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load deduction heads");
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  useEffect(() => { loadList(); }, []);

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
    const index = list.findIndex(i => i.deduction_head_id === row.deduction_head_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("deduction_head_id", updatedData);
    if (response?.success) {
      await loadList();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.name}"?` });
    if (confirmed) {
      const res = await deleteDeductionHead(row.deduction_head_id);
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
        title: `Delete ${ids.length} Deduction head(s)?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteDeductionHead(id)));
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
  const saveBtnRef = useRef(null);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: handleSave,
      onEsc:  handleEditCancel,
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <DeductionHeadForm
          initialData={formData}
          saveBtnRef={saveBtnRef}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleEditCancel}
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
          formData={formData}
          setFormData={setFormData}
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
            title="Deduction Head Master"
            data={list}
            columns={columns}
            rowKey="deduction_head_id"
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

export default DeductionHead;
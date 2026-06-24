import { useEffect, useState, useCallback, useRef } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import IncomeHeadForm from "./IncomeHeadForm";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { fetchIncomeHeads, createIncomeHead, updateIncomeHead, deleteIncomeHead } from "../../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  name: "",
  code: "",
  type: "",
  taxable: "Yes",
  status: "Active",
};

const columns = [
  { key: "name",    label: "Name"    },
  { key: "code",    label: "Code"    },
  { key: "type",    label: "Type"    },
  { key: "taxable", label: "Taxable" },
  { key: "status",  label: "Status"  },
];

const IncomeHead = ({ tab }) => {
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
        ? await updateIncomeHead(data.income_head_id, data)
        : await createIncomeHead(data);
    },
    () => loadList(),
    tab.appl_name
  );

// ✅ loadList - return finalData so handleSave can use it
const loadList = useCallback(async () => {
  try {
    setLoading(true);
    const data = await fetchIncomeHeads();
    const finalData = Array.isArray(data) ? data : data?.data || [];
    setList(finalData);
    if (finalData.length > 0) {
      setFormData(finalData[0]);
      setCurrentIndex(0);
    }
    return finalData; // ✅ YEH ADD KARO
  } catch (err) {
    alertError("Fetch Error", "Failed to load income heads");
    return [];
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
    const index = list.findIndex(i => i.income_head_id === row.income_head_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

// ✅ handleSave - fresh list se saved record dhundho
const handleSave = async (updatedData) => {
  const response = await performSave("income_head_id", updatedData);
  if (response?.success) {
    const freshList = await loadList(); // ✅ return value lo

    // Saved record ka ID: edit mein original ID, add mein server response se ID
    const savedId = updatedData.income_head_id ?? response?.data?.income_head_id;
    const newIndex = freshList.findIndex(i => i.income_head_id === savedId);

    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
      handleView(freshList[newIndex]); // ✅ Server ka fresh data view mein dikhao
    } else if (freshList.length > 0) {
      // Fallback: naya record usually last mein hoga
      const lastIndex = freshList.length - 1;
      setCurrentIndex(lastIndex);
      handleView(freshList[lastIndex]);
    }
  }
};
  // Single delete (used by the form)
  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.name}"?` });
    if (confirmed) {
      const res = await deleteIncomeHead(row.income_head_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  // Multiple delete (used by the Table)
  const handleDeleteMultiple = async (selected) => {
    // Normalize: Table may pass an array of row objects OR an array of keys
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.income_head_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} income head(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteIncomeHead(id)));
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
      onEsc:  () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <IncomeHeadForm
          initialData={formData}
          onSave={handleSave}
          saveBtnRef={saveBtnRef}
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
          formData={formData}
          setFormData={setFormData}
           onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
          activeTab="search"
          onTabChange={handleTabChange}
            title="Income Head Master"
            data={list}
            columns={columns}
            rowKey="income_head_id"
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

export default IncomeHead;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ShiftMasterForm from "./ShiftMasterForm"; 
import { fetchShifts, deleteShift, createShift, updateShift } from "../../../../utils/api";  
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  shift_id: null,
  shift_name: "",
  start_time: "",
  end_time: "",
  grace_in_minutes: 0,
  grace_out_minutes: 0,
  full_day_hours: 8.0,
  half_day_hours: 4.0,
  is_night_shift: 0,
};

const columns = [
  { key: "shift_name", label: "Shift Name" },
  { key: "start_time", label: "Start Time" },
  { key: "end_time", label: "End Time" },
  { key: "full_day_hours", label: "Hours" },
];

const ShiftMaster = ({ tab }) => {
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
      return isEdit ? await updateShift(data.shift_id, data) : await createShift(data);
    },
    () => loadShifts(), 
    tab.appl_name
  );
// ShiftMaster.jsx ke loadShifts function ko aise update karein:
const loadShifts = useCallback(async () => {
  try {
    setLoading(true);
    const data = await fetchShifts();
    const finalData = Array.isArray(data) ? data : data?.data || [];
    setList(finalData); 
    if (finalData.length > 0) {
      setFormData(finalData[0]);
      setCurrentIndex(0);
    }
  } catch (err) {
    alertError("Fetch Error", "Failed to load shifts");
  } finally {
    setLoading(false);
  }
}, [setFormData]);

  useEffect(() => { loadShifts(); }, []);

  // Record change logic
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.shift_id === row.shift_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

const handleSave = async (updatedData) => { 
  const response = await performSave("shift_id", updatedData); 
  if (response?.success) { 
    await loadShifts();
  }
};

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete Shift "${row.shift_name}"?` });
    if (confirmed) {
      const res = await deleteShift(row.shift_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadShifts();
        setShowForm(false);
      }
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ShiftMasterForm
          initialData={formData} // Hook's formData
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
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
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Shift Master List"
            data={list}
            columns={columns}
            rowKey="shift_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ShiftMaster;
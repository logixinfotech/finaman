import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ShiftMasterForm from "./ShiftMasterForm";
import { fetchShifts, deleteShift, createShift, updateShift } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  shift_name: "",
  start_time: "",
  end_time: "",
  grace_in_minutes: "",
  grace_out_minutes: "",
  full_day_hours: "",
  half_day_hours: "",
  is_night_shift: 0,
};

const columns = [
  { key: "shift_name", label: "Shift Name" },
  { key: "start_time", label: "Start Time" }, // Must match the key in API JSON
  { key: "end_time", label: "End Time" },
  {
    key: "full_day_hours",
    label: "Hours",
    render: (row) => {
      const val = parseFloat(row.full_day_hours);
      if (!val) return "—";
      const hrs = Math.floor(val);
      const mins = Math.round((val - hrs) * 60);
      return mins > 0 ? `${hrs} hrs ${mins} min` : `${hrs} hrs`;
    }
  },
  {
    key: "attendance_rule_name",
    label: "Attendance Rule",
    render: (row) => row.attendance_rule_name || "Standard (Default)"
  },
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
    console.log("Deleting ID:", row.shift_id); // Verify this isn't undefined
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

  const handleDeleteMultiple = async (selected) => {
    // Normalize: Table may pass an array of row objects OR an array of keys
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.shift_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} shift(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteShift(id)));
      const failed = results.filter((r) => !r?.success).length;

      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadShifts();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some shifts");
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
          initialData={formData}
          formData={formData}
          setFormData={setFormData}
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
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
            activeTab={"search"}
            onTabChange={handleTabChange}
            title="Shift Master"
            data={list}
            columns={columns}
            onDeleteMultiple={handleDeleteMultiple}
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
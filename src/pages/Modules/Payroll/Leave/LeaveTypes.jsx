import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import LeaveTypeForm from "./LeaveTypeForm";
import { confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "../../../../utils/api";

const initialState = {
  leave_type_id: null,
  leave_code: "",
  leave_name: "",
  max_days: "",
  description: "",
  applicable: "All", // Default value
};

const columns = [
  { key: "leave_code", label: "Code" },
  { key: "leave_name", label: "Leave Name" },
  { key: "max_days", label: "Max Days" },
  { key: "applicable", label: "Applicable To" },
  { key: "description", label: "Description" },
];

const LeaveTypes = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeaveTypes();
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data) =>
      data.leave_type_id
        ? await updateLeaveType(data.leave_type_id, data)
        : await createLeaveType(data),
    loadData,
    tab.appl_name
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.leave_type_id === row.leave_type_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    if (!updatedData.leave_name || !updatedData.leave_code) {
      showToast({ icon: "error", title: "Code and Name are required" });
      return;
    }

    const response = await performSave("leave_type_id", updatedData);
    if (response?.success) {
      showToast({ icon: "success", title: "Leave Type Saved" });
      await loadData();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Leave Type "${row.leave_name}"?`
    });
    if (!confirmed) return;
    await deleteLeaveType(row.leave_type_id);
    showToast({ icon: "success", title: "Deleted" });
    loadData();
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: () => handleSave(formData),
      onEsc: () => setShowForm(false),
    });
  }, [list, formData, handleAdd, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <LeaveTypeForm
          initialData={formData}
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
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Leave Type List"
            data={list}
            columns={columns}
            rowKey="leave_type_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;
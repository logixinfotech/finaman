import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import AttendanceRegularizationForm from "./AttendanceRegularizationForm";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getAttendRegular, createAttendRegular, updateAttendRegular, deleteAttendRegular } from "../../../../utils/api";


const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA");
};

const formatTime = (time) => {
  if (!time) return "";
  if (typeof time === "string" && time.includes(":") && time.length <= 5) {
    return time;
  }

  const d = new Date(time);
  if (isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const initialState = {
  request_id: null,
  employee_id: "",
  employee_name: "",
  attendance_date: "",
  requested_in_time: "",
  requested_out_time: "",
  reason: "",
};

const columns = [
  { key: "employee_name", label: "Employee" },

  {
    key: "attendance_date",
    label: "Date",
    render: (row) => formatDate(row.attendance_date),
  },

  {
    key: "requested_in_time",
    label: "Req. In",
    render: (row) => formatTime(row.requested_in_time),
  },

  {
    key: "requested_out_time",
    label: "Req. Out",
    render: (row) => formatTime(row.requested_out_time),
  },

  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
];

const AttendanceRegularization = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchAttendanceList = async () => {
  setLoading(true);
  const response = await getAttendRegular(); 
  if (Array.isArray(response)) {
  setList(response);
}
else if (response?.success) {
  setList(response.data || []);
}
  setLoading(false);
};

  const {
    mode, formData, setFormData, showForm, setShowForm,
    saving, handleEditCancel, handleView, handleAdd, handleModify, performSave, rights: originalRights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      if (isEdit) {
        return await updateAttendRegular(
          data.request_id,
          data
        );
      }
      return await createAttendRegular(data);
    },
    fetchAttendanceList,
    tab.appl_name
  );

  useEffect(() => {
    fetchAttendanceList();
}, []);
 
  const rights = { ...originalRights, add: 1, edit: 1, delete: 1, view: 1 };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.request_id === row.request_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

const handleSave = async (updatedData) => {
  const response =
    await performSave("request_id", updatedData);

  if (response?.success) {

    showToast({
      icon: "success",
      title: "Request Submitted"
    });

    const refreshed =
      await getAttendRegular();

    if (Array.isArray(refreshed)) {
  setList(refreshed);
}
else if (refreshed?.success) {
  setList(refreshed.data || []);
}

    setShowForm(false);
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

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
        title: `Delete this attendance request?`
    });
    if (!confirmed) return;

    await deleteAttendRegular(row.request_id);
    showToast({ icon: "success", title: "Deleted" });
    fetchAttendanceList();
    setShowForm(false);
};

  return (
    <div className="h-full w-full">
      {showForm ? (
        <AttendanceRegularizationForm
          initialData={formData}
          setParentFormData={setFormData}
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
          onTabChange={(t) => t === "search" && setShowForm(false)}
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Attendance Regularization List"
            data={list}
            columns={columns}
            rowKey="request_id"
            loading={loading}
            onAdd={handleAdd} // Forcefully showing Add button
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default AttendanceRegularization;
// import { useEffect, useState, useCallback } from "react";
// import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
// import Table from "../../../../components/Reusable/table/Table";
// import AttendanceRegularizationForm from "./AttendanceRegularizationForm";
// import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
// import { setERPHandlers } from "../../../../utils/erpShortcuts";
// import { getAttendRegular, createAttendRegular, updateAttendRegular, deleteAttendRegular } from "../../../../utils/api";


// const formatDate = (date) => {
//   if (!date) return "";
//   return new Date(date).toLocaleDateString("en-CA");
// };

// const formatTime = (time) => {
//   if (!time) return "";
//   if (typeof time === "string" && time.includes(":") && time.length <= 5) {
//     return time;
//   }

//   const d = new Date(time);
//   if (isNaN(d.getTime())) {
//     return "";
//   }
//   return d.toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//   });
// };

// const initialState = {
//   request_id: null,
//   employee_id: "",
//   employee_name: "",
//   attendance_date: "",
//   requested_in_time: "",
//   requested_out_time: "",
//   reason: "",
// };

// const columns = [
//   { key: "employee_name", label: "Employee" },

//   {
//     key: "attendance_date",
//     label: "Date",
//     render: (row) => formatDate(row.attendance_date),
//   },

//   {
//     key: "requested_in_time",
//     label: "Req. In",
//     render: (row) => formatTime(row.requested_in_time),
//   },

//   {
//     key: "requested_out_time",
//     label: "Req. Out",
//     render: (row) => formatTime(row.requested_out_time),
//   },

//   { key: "reason", label: "Reason" },
//   { key: "status", label: "Status" },
// ];

// const AttendanceRegularization = ({ tab }) => {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const fetchAttendanceList = async () => {
//   setLoading(true);
//   const response = await getAttendRegular(); 
//   if (Array.isArray(response)) {
//   setList(response);
// }
// else if (response?.success) {
//   setList(response.data || []);
// }
//   setLoading(false);
// };

//   const {
//     mode, formData, setFormData, showForm, setShowForm,
//     saving, handleEditCancel, handleView, handleAdd, handleModify, performSave, rights: originalRights
//   } = useERPMode(
//     initialState,
//     async (data, isEdit) => {
//       if (isEdit) {
//         return await updateAttendRegular(
//           data.request_id,
//           data
//         );
//       }
//       return await createAttendRegular(data);
//     },
//     fetchAttendanceList,
//     tab.appl_name
//   );

//   useEffect(() => {
//     fetchAttendanceList();
// }, []);
 
//   const rights = { ...originalRights, add: 1, edit: 1, delete: 1, view: 1 };

//   const handleRowSelect = (row) => {
//     const index = list.findIndex(item => item.request_id === row.request_id);
//     if (index !== -1) setCurrentIndex(index);
//     handleView(row);
//   };

// const handleSave = async (updatedData) => {
//   const response =
//     await performSave("request_id", updatedData);

//   if (response?.success) {

//     showToast({
//       icon: "success",
//       title: "Request Submitted"
//     });

//     const refreshed =
//       await getAttendRegular();

//     if (Array.isArray(refreshed)) {
//   setList(refreshed);
// }
// else if (refreshed?.success) {
//   setList(refreshed.data || []);
// }

//     setShowForm(false);
//   }
// };

//   useEffect(() => {
//     setERPHandlers({
//       onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
//       onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
//       onNew: handleAdd,
//       onSave: handleSave,
//       onEsc: () => setShowForm(false),
//     });
//   }, [list, handleAdd, handleSave, setShowForm]);

//   const handleDelete = async (row) => {
//     const confirmed = await confirmDelete({
//         title: `Delete this attendance request?`
//     });
//     if (!confirmed) return;

//     await deleteAttendRegular(row.request_id);
//     showToast({ icon: "success", title: "Deleted" });
//     fetchAttendanceList();
//     setShowForm(false);
// };
// const handleDeleteMultiple = async (selected) => {
//       const ids = (selected || []).map((item) =>
//         typeof item === "object" ? item.request_id : item
//       );
//       if (ids.length === 0) return;
  
//       const confirmed = await confirmDelete({ title: `Delete ${ids.length} record(s)?` });
//       if (!confirmed) return;
  
//       try {
//         const results = await Promise.all(ids.map((id) => deleteAttendRegular(id)));
//         const failed = results.filter((r) => !r?.success).length;
//         if (failed === 0) {
//           showToast({ icon: "success", title: `${ids.length} deleted` });
//         } else {
//           showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
//         }
//       fetchAttendanceList();
//         setShowForm(false);
//       } catch (err) {
//         alertError("Delete Error", "Failed to delete some TDS records");
//       }
//     };

//   return (
//     <div className="h-full w-full">
//       {showForm ? (
//         <AttendanceRegularizationForm
//           initialData={formData}
//           setParentFormData={setFormData}
//           onSave={handleSave}
//           onDelete={handleDelete}
//           onCancel={() => setShowForm(false)}
//           mode={mode}
//           saving={saving}
//           onModify={handleModify}
//           onNewEntry={handleAdd}
//           currentRecord={list.length > 0 ? currentIndex + 1 : 0}
//           totalRecords={list.length}
//           rights={rights}
//           onEditCancel={handleEditCancel}
//           activeTab="entry"
//           onTabChange={(t) => t === "search" && setShowForm(false)}
//         />
//       ) : (
//         <div className="p-4 bg-slate-50 h-full">
//           <Table
//             title="Attendance Regularization List"
//             data={list}
//             onDeleteMultiple={handleDeleteMultiple}
//             columns={columns}
//             rowKey="request_id"
//             loading={loading}
//             onAdd={handleAdd} // Forcefully showing Add button
//             onRowDoubleClick={handleRowSelect}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default AttendanceRegularization;
import { useEffect, useState, useCallback, useRef } from "react";
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

const processApiResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  } else if (response?.success) {
    return response.data || [];
  }
  return [];
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

  const fetchAttendanceList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAttendRegular();
      setList(processApiResponse(response));
    } catch (err) {
      alertError("Fetch Error", "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode, formData, setFormData, showForm, setShowForm,
    saving, handleEditCancel, handleView, handleAdd, handleModify, performSave, rights: originalRights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      if (isEdit) {
        return await updateAttendRegular(data.request_id, data);
      }
      return await createAttendRegular(data);
    },
    fetchAttendanceList,
    tab.appl_name
  );

  useEffect(() => {
    fetchAttendanceList();
  }, [fetchAttendanceList]);

  const rights = { ...originalRights, add: 1, edit: 1, delete: 1, view: 1 };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.request_id === row.request_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  // Fixed handleSave to merge frontend employee_name with backend response
  const handleSave = useCallback(async (updatedData) => {
    const dataToSave = updatedData || formData;
    const response = await performSave("request_id", dataToSave);

    if (response?.success) {
      showToast({
        icon: "success",
        title: "Request Saved Successfully"
      });

      const refreshed = await getAttendRegular();
      const latestList = processApiResponse(refreshed);
      setList(latestList);

      const savedId = response.data?.request_id || dataToSave.request_id;
      const fetchedRecord = latestList.find(item => item.request_id === savedId) || response.data;

      // Merge data so employee_name is safely preserved even if the API omitted it
      const savedRecord = {
        ...dataToSave,
        ...fetchedRecord,
        employee_name: fetchedRecord?.employee_name || dataToSave.employee_name || formData.employee_name
      };

      const newIndex = latestList.findIndex(item => item.request_id === savedId);
      if (newIndex !== -1) setCurrentIndex(newIndex);
      
      // Load the merged data cleanly into View Mode
      handleView(savedRecord);
    }
  }, [formData, performSave, handleView]);

  const shortcutStateRef = useRef({});
  shortcutStateRef.current = { list, currentIndex, handleAdd, handleSave, setShowForm, handleView };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => {
        const { list, currentIndex, handleView } = shortcutStateRef.current;
        const nextIdx = Math.min(currentIndex + 1, list.length - 1);
        if (list[nextIdx]) {
          setCurrentIndex(nextIdx);
          handleView(list[nextIdx]);
        }
      },
      onPrevRecord: () => {
        const { list, currentIndex, handleView } = shortcutStateRef.current;
        const prevIdx = Math.max(currentIndex - 1, 0);
        if (list[prevIdx]) {
          setCurrentIndex(prevIdx);
          handleView(list[prevIdx]);
        }
      },
      onNew: () => shortcutStateRef.current.handleAdd(),
      onSave: () => shortcutStateRef.current.handleSave(),
      onEsc: () => shortcutStateRef.current.setShowForm(false),
    });
  }, []);

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

    const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };
  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.request_id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} record(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteAttendRegular(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      fetchAttendanceList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some attendance records");
    }
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
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
           activeTab={"search"}
                  onTabChange={handleTabChange}

            title="Attendance Regularization"
            data={list}
            onDeleteMultiple={handleDeleteMultiple}
            columns={columns}
            rowKey="request_id"
            loading={loading}
            onAdd={handleAdd}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default AttendanceRegularization;
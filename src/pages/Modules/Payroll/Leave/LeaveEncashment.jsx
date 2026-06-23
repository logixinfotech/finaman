// import { useEffect, useState, useCallback } from "react";
// import { useERPMode }  from "../../../../components/Reusable/form/useFormMode";
// import Table           from "../../../../components/Reusable/table/Table";
// import LeaveEncashmentForm from "./LeaveEncashmentForm";
// import { confirmDelete, showToast } from "../../../../components/Reusable/alert";
// import { setERPHandlers }          from "../../../../utils/erpShortcuts";
// import {
//   getLeaveEncashments, createLeaveEncashment,
//   updateLeaveEncashment, deleteLeaveEncashment,
// } from "../../../../utils/api";

// const initialState = {
//   encashment_id:   null,
//   employee_id:     null,
//   employee_name:   "",
//   leave_type_id:   "",
//   leave_name:      "",
//   financial_year:  String(new Date().getFullYear()),
//   days_encashed:   "",
//   rate_per_day:    "",
//   total_amount:    "",
//   encashment_date: "",
//   status:          "Pending",
//   remarks:         "",
//   paid_in_payroll: false,
// };

// const columns = [
//   { key: "employee_name",  label: "Employee"       },
//   { key: "leave_name",     label: "Leave Type"     },
//   { key: "financial_year", label: "Year"           },
//   { key: "days_encashed",  label: "Days Encashed"  },
//   { key: "rate_per_day",   label: "Rate/Day"       },
//   { key: "total_amount",   label: "Total Amount",
//     render: row => row.total_amount
//       ? `₹ ${parseFloat(row.total_amount).toLocaleString("en-IN")}` : "—"
//   },
//   { key: "encashment_date", label: "Date",
//     render: row => row.encashment_date
//       ? new Date(row.encashment_date).toLocaleDateString() : "—"
//   },
//   { key: "status",          label: "Status",
//     render: row => (
//       <span className={`px-2 py-1 text-xs rounded-full font-medium ${
//         row.status === "Paid"     ? "bg-green-100 text-green-700"
//         : row.status === "Approved" ? "bg-blue-100 text-blue-700"
//         : "bg-yellow-100 text-yellow-700"
//       }`}>{row.status}</span>
//     )
//   },
//   { key: "paid_in_payroll", label: "In Payroll",
//     render: row => row.paid_in_payroll
//       ? <span className="text-green-600 font-medium">✓ Yes</span>
//       : <span className="text-gray-400">No</span>
//   },
// ];

// const LeaveEncashment = ({ tab }) => {
//   const [list, setList]                 = useState([]);
//   const [loading, setLoading]           = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await getLeaveEncashments();
//       setList(res?.data || []);
//     } catch (err) { console.error(err); }
//     finally { setLoading(false); }
//   }, []);

//   const { mode, formData, setFormData, showForm, setShowForm, saving,
//     handleEditCancel, handleView, handleAdd, handleModify, performSave, rights,
//   } = useERPMode(
//     initialState,
//     async (data) => data.encashment_id
//       ? await updateLeaveEncashment(data.encashment_id, data)
//       : await createLeaveEncashment(data),
//     loadData, tab?.appl_name
//   );

//   useEffect(() => { loadData(); }, []);

//   const handleTabChange = t => {
//     if (t === "search") setShowForm(false);
//     if (t === "entry")  setShowForm(true);
//   };

// const handleRowSelect = row => {
//   const index = list.findIndex(i => i.encashment_id === row.encashment_id);
//   if (index !== -1) {
//     setCurrentIndex(index);
//     handleView(row);   
//   }
//   setShowForm(true);
// };

//  const handleSave = async (updatedData = formData) => {
//   if (!updatedData.employee_id)  { showToast({ icon: "error", title: "Please select Employee" });   return; }
//   if (!updatedData.leave_type_id){ showToast({ icon: "error", title: "Please select Leave Type" }); return; }
//   if (!updatedData.days_encashed){ showToast({ icon: "error", title: "Enter Days to Encash" });     return; }
  
//   const response = await performSave("encashment_id", updatedData);
  
//   if (response?.success) {
//     showToast({ icon: "success", title: "Encashment saved & balance updated" });
    
//     // ✅ Fresh list lo aur matching record se handleView call karo
//     const freshRes = await getLeaveEncashments();
//     const freshList = freshRes?.data || [];
//     setList(freshList);
    
//     const savedId = updatedData.encashment_id;
//     const freshRecord = savedId
//       ? freshList.find(r => r.encashment_id === savedId)
//       : freshList[freshList.length - 1];
    
//     if (freshRecord) {
//       handleView(freshRecord);  // ✅ employee_name aur leave_name fresh record mein hoga
//     }
//   }
// };

//   const handleDelete = async row => {
//     const confirmed = await confirmDelete({
//       title: `Delete encashment for "${row.employee_name}"?`
//     });
//     if (!confirmed) return;
//     await deleteLeaveEncashment(row.encashment_id);
//     showToast({ icon: "success", title: "Deleted" });
//     setShowForm(false);
//     loadData();
//   };

//   useEffect(() => {
//     setERPHandlers({
//       onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
//       onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
//       onNew: handleAdd, onSave: handleSave, onEsc: () => setShowForm(false),
//     });
//   }, [list, handleAdd, handleSave, setShowForm]);

//   return (
//     <div className="h-full w-full">
//       {showForm ? (
//         <LeaveEncashmentForm
//           initialData={formData} setFormData={setFormData}
//           onSave={handleSave} onCancel={() => setShowForm(false)}
//           onDelete={handleDelete} mode={mode} saving={saving}
//           onModify={handleModify} onNewEntry={handleAdd}
//           currentRecord={list.length > 0 ? currentIndex + 1 : 0}
//           totalRecords={list.length} rights={rights}
//           onEditCancel={handleEditCancel} activeTab="entry" onTabChange={handleTabChange}
//         />
//       ) : (
//         <div className="p-4 bg-slate-50 h-full">
//           <Table title="Leave Encashment Entry" data={list} columns={columns}
//             rowKey="encashment_id" loading={loading}
//             onAdd={rights?.add === 1 ? handleAdd : null}
//             onRowDoubleClick={handleRowSelect} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeaveEncashment;
import { useEffect, useState, useCallback } from "react";
import { useERPMode }  from "../../../../components/Reusable/form/useFormMode";
import Table           from "../../../../components/Reusable/table/Table";
import LeaveEncashmentForm from "./LeaveEncashmentForm";
import { alertError, confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers }          from "../../../../utils/erpShortcuts";
import {
  getLeaveEncashments, createLeaveEncashment,
  updateLeaveEncashment, deleteLeaveEncashment,
} from "../../../../utils/api";

const initialState = {
  encashment_id:   null,
  employee_id:     null,
  employee_name:   "",
  leave_type_id:   "",
  leave_name:      "",
  financial_year:  String(new Date().getFullYear()),
  days_encashed:   "",
  rate_per_day:    "",
  total_amount:    "",
  encashment_date: "",
  status:          "Pending",
  remarks:         "",
  paid_in_payroll: false,
};

const columns = [
  { key: "employee_name",  label: "Employee"      },
  { key: "leave_name",     label: "Leave Type"    },
  { key: "financial_year", label: "Year"          },
  { key: "days_encashed",  label: "Days Encashed" },
  { key: "rate_per_day",   label: "Rate/Day"      },
  { key: "total_amount",   label: "Total Amount",
    render: row => row.total_amount
      ? `₹ ${parseFloat(row.total_amount).toLocaleString("en-IN")}` : "—"
  },
  { key: "encashment_date", label: "Date",
    render: row => row.encashment_date
      ? new Date(row.encashment_date).toLocaleDateString() : "—"
  },
  { key: "status", label: "Status",
    render: row => (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        row.status === "Paid"       ? "bg-green-100 text-green-700"
        : row.status === "Approved" ? "bg-blue-100 text-blue-700"
        : "bg-yellow-100 text-yellow-700"
      }`}>{row.status}</span>
    )
  },
  { key: "paid_in_payroll", label: "In Payroll",
    render: row => row.paid_in_payroll
      ? <span className="text-green-600 font-medium">✓ Yes</span>
      : <span className="text-gray-400">No</span>
  },
];

const LeaveEncashment = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode, formData, setFormData,
    showForm, setShowForm, saving,
    handleEditCancel, handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data) => data.encashment_id
      ? await updateLeaveEncashment(data.encashment_id, data)
      : await createLeaveEncashment(data),
    () => {}, // ✅ empty — handleSave controls reload
    tab?.appl_name
  );

  // ✅ returns fresh list — handleSave uses it
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeaveEncashments();
      const finalData = res?.data || [];
      setList(finalData);
      return finalData; // ✅ handleSave needs this
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  // next/prev navigation sync
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = t => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = row => {
    const index = list.findIndex(i => i.encashment_id === row.encashment_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
  };

  // ✅ same clean pattern — fresh list se sahi record dhundho
  const handleSave = async (updatedData = formData) => {
    if (!updatedData.employee_id)   { showToast({ icon: "error", title: "Please select Employee" });   return; }
    if (!updatedData.leave_type_id) { showToast({ icon: "error", title: "Please select Leave Type" }); return; }
    if (!updatedData.days_encashed) { showToast({ icon: "error", title: "Enter Days to Encash" });     return; }

    const dataToSave = {
      ...updatedData,
      encashment_id: updatedData.encashment_id ?? formData.encashment_id,
    };

    const response = await performSave("encashment_id", dataToSave);

    if (response?.success) {
      showToast({ icon: "success", title: "Encashment saved & balance updated" });

      const freshList = await loadData(); // ✅ fresh list lo

      // pehle encashment_id se dhundho
      let newIndex = freshList.findIndex(
        r => r.encashment_id === dataToSave.encashment_id
      );

      // naya record — employee_id + leave_type_id se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex(
          r => r.employee_id === dataToSave.employee_id
            && r.leave_type_id === dataToSave.leave_type_id
        );
      }

      // fallback — last record
      if (newIndex === -1 && freshList.length > 0) {
        newIndex = freshList.length - 1;
      }

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] }); // ✅ server ka fresh data (employee_name, leave_name sab)
      }
    }
  };

  const handleDelete = async row => {
    const confirmed = await confirmDelete({
      title: `Delete encashment for "${row.employee_name}"?`,
    });
    if (!confirmed) return;
    await deleteLeaveEncashment(row.encashment_id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false);
    loadData();
  };
   const handleDeleteMultiple = async (selected) => {
      // Normalize: Table may pass an array of row objects OR an array of keys
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.employee_name : item
      );
  
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length} leave(s)?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteLeaveEncashment(id)));
        const failed = results.filter((r) => !r?.success).length;
  
        if (failed === 0) {
          showToast({ icon: "success", title: `${ids.length} deleted` });
        } else {
          showToast({
            icon: "warning",
            title: `${ids.length - failed} deleted, ${failed} failed`,
          });
        }
        loadData();
        setShowForm(false);
      } catch (err) {
        alertError("Delete Error", "Failed to delete some leaves");
      }
    };
  

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: () => handleSave(formData),
      onEsc:  () => setShowForm(false),
    });
  }, [list, handleAdd, formData, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <LeaveEncashmentForm
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
          onDeleteMultiple={handleDeleteMultiple}
          activeTab="search"
          onTabChange={handleTabChange}
            title="Leave Encashment Entry"
            data={list}
            columns={columns}
            rowKey="encashment_id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default LeaveEncashment;
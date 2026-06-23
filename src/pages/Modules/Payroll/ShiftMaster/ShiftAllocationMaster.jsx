// import { useEffect, useState, useCallback } from "react";
// import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
// import Table from "../../../../components/Reusable/table/Table";
// import ShiftAllocationForm from "./ShiftAllocationForm"; 
// import { fetchAllocations, deleteAllocation, createAllocation, updateAllocation } from "../../../../utils/api";  
// import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
// import { setERPHandlers } from "../../../../utils/erpShortcuts";

// const initialState = {
//   allocation_id: null,
//   employee_id: "",
//   employee_name: "",
//   shift_id: "",
//   shift_name: "",
//   allocation_from:"",
//   allocation_to: "",
//   remarks: "",

// };

// const columns = [
//   { key: "employee_name", label: "Employee Name" },
//   { key: "shift_name", label: "Shift Name" },
//   { key: "allocation_from", label: "From Date" },
//   { key: "allocation_to", label: "To Date" },

// ];

// const ShiftAllocation = ({ tab }) => {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const {
//     mode,
//     formData, setFormData,
//     showForm, setShowForm,
//     saving, handleEditCancel,
//     handleView, handleAdd, handleModify, performSave, rights
//   } = useERPMode(
//     initialState,
//     async (data, isEdit) => {
//       // Backend expects employee_id as INT and others as UUID
//       return isEdit 
//         ? await updateAllocation(data.allocation_id, data) 
//         : await createAllocation(data);
//     },
//     () => loadAllocations(),
//     tab.appl_name
//   );

//  const loadAllocations = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await fetchAllocations();
      
//       // 🔥 DEBUG 1: Yahan check karo ki backend actual mein kya bhej raha hai


//       // Smart extraction: Agar backend kisi aur key me data bhej raha ho
//       let finalData = [];
//       if (Array.isArray(response)) {
//         finalData = response;
//       } else if (Array.isArray(response?.data)) {
//         finalData = response.data;
//       } else if (Array.isArray(response?.data?.data)) {
//         finalData = response.data.data; // Aksar Axios me nested hota hai
//       } else if (Array.isArray(response?.result)) {
//         finalData = response.result;
//       }

//       // 🔥 DEBUG 2: Table ko dene ke liye kya data nikla
//       console.log("2. Extracted Final Data:", finalData);

//       const displayData = finalData.map(item => ({
//         ...item,
//         status_text: item.is_approved ? "Approved" : "Pending"
//       }));

//       setList(displayData);
//       if (displayData.length > 0) {
//         setFormData(displayData[0]);
//         setCurrentIndex(0);
//       }
//     } catch (err) {
//       console.error("Fetch Error API Phat gayi:", err);
//       alertError("Fetch Error", "Failed to load shift allocations");
//     } finally {
//       setLoading(false);
//     }
//   }, [setFormData]); // 

//   // 🔥 FIX: useEffect mein dependency add ki taaki warning na aaye aur data properly fetch ho
//   useEffect(() => { 
//     loadAllocations(); 
//   }, [loadAllocations]);
 
//   const handleSave = async (updatedData) => {
//   const response = await performSave("allocation_id", updatedData);
//   if (response?.success) {
//     const freshList = await loadAllocations(); // ✅ return value lo

//     // Saved record ka ID: edit mein original ID, add mein server response se ID
//     const savedId = updatedData.allocation_id ?? response?.data?.allocation_id;
//     const newIndex = freshList.findIndex(i => i.income_head_id === savedId);

//     if (newIndex !== -1) {
//       setCurrentIndex(newIndex);
//       handleView(freshList[newIndex]); // ✅ Server ka fresh data view mein dikhao
//     } else if (freshList.length > 0) {
//       // Fallback: naya record usually last mein hoga
//       const lastIndex = freshList.length - 1;
//       setCurrentIndex(lastIndex);
//       handleView(freshList[lastIndex]);
//     }
//   }
// };

//   useEffect(() => { loadAllocations(); }, []); 
  
//   useEffect(() => {
//     if (showForm && mode === "view" && list.length > 0) {
//       setFormData(list[currentIndex]);
//     }
//   }, [currentIndex, list, showForm, mode, setFormData]);

//   const handleTabChange = (targetTab) => {
//     if (targetTab === "search") setShowForm(false);
//     if (targetTab === "entry") setShowForm(true);
//   };

//   const handleRowSelect = (row) => {
//     const index = list.findIndex(item => item.allocation_id === row.allocation_id);
//     if (index !== -1) setCurrentIndex(index);
//     handleView(row);
//   };

 
//   const handleDelete = async (row) => {
//     const confirmed = await confirmDelete({ title: `Delete allocation for "${row.employee_name}"?` });
//     if (confirmed) {
//       const res = await deleteAllocation(row.allocation_id);
//       if (res.success) {
//         showToast({ icon: "success", title: "Allocation Removed" });
//         loadAllocations();
//         setShowForm(false);
//       }
//     }
//   };
//    const handleDeleteMultiple = async (selected) => {
//       // Normalize: Table may pass an array of row objects OR an array of keys
//       const ids = (selected || []).map((item) =>
//         typeof item === "object" ? item.employee_name : item
//       );
  
//       if (ids.length === 0) return;
  
//       const confirmed = await confirmDelete({
//         title: `Delete ${ids.length} Shift(s)?`,
//       });
//       if (!confirmed) return;
  
//       try {
//         const results = await Promise.all(ids.map((id) => deleteAllocation(id)));
//         const failed = results.filter((r) => !r?.success).length;
  
//         if (failed === 0) {
//           showToast({ icon: "success", title: `${ids.length} deleted` });
//         } else {
//           showToast({
//             icon: "warning",
//             title: `${ids.length - failed} deleted, ${failed} failed`,
//           });
//         }
//         loadAllocations();
//         setShowForm(false);
//       } catch (err) {
//         alertError("Delete Error", "Failed to delete some Shifts");
//       }
//     };

//   useEffect(() => {
//     setERPHandlers({
//       onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
//       onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
//       onNew: handleAdd,
//       onSave: handleSave,
//       onEsc: () => setShowForm(false),
//     });
//   }, [list, handleAdd, handleSave, setShowForm]);

//   return (
//     <div className="h-full w-full">
//       {showForm ? (
//         <ShiftAllocationForm
//           initialData={formData} 
//           localData={formData}
//           setLocalData={setFormData}
//           onSave={handleSave}
//           onCancel={() => setShowForm(false)}
//           onDelete={handleDelete}
//           mode={mode}
//           saving={saving}
//           onModify={handleModify}
//           onNewEntry={handleAdd}
//           currentRecord={list.length > 0 ? currentIndex + 1 : 0}
//           totalRecords={list.length}
//           rights={rights}
//           onEditCancel={handleEditCancel}
//           activeTab="entry"
//           onTabChange={handleTabChange}
//             onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
//   onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}

//         />
//       ) : (
//         <div className="bg-slate-50 h-full">
//           <Table
//             title="Employee Shift Allocations"
//              activeTab={"search"}
//               onTabChange={handleTabChange}
//             data={list}
//             onDeleteMultiple={handleDeleteMultiple}
//             columns={columns}
//             rowKey="allocation_id"
//             loading={loading}
//             onAdd={rights.add === 1 ? handleAdd : null}
//             onRowDoubleClick={handleRowSelect}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ShiftAllocation;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ShiftAllocationForm from "./ShiftAllocationForm";
import { fetchAllocations, deleteAllocation, createAllocation, updateAllocation } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  allocation_id: null,
  employee_id: "",
  employee_name: "",
  shift_id: "",
  shift_name: "",
  allocation_from: "",
  allocation_to: "",
  remarks: "",
};

const columns = [
  { key: "employee_name",   label: "Employee Name" },
  { key: "shift_name",      label: "Shift Name"    },
  { key: "allocation_from", label: "From Date"     },
  { key: "allocation_to",   label: "To Date"       },
];

const ShiftAllocation = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(true);
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
        ? await updateAllocation(data.allocation_id, data)
        : await createAllocation(data);
    },
    () => {}, // ✅ BUG FIX: empty — handleSave khud reload + view control karta hai
    tab.appl_name
  );

  // ✅ BUG FIX: setFormData(displayData[0]) hataya — yeh har save/reload pe form ko
  // pehle record pe reset kar deta tha, isliye save ke baad purana/galat record dikhta tha
  // ✅ BUG FIX: ab return karta hai — handleSave ko fresh list chahiye
  const loadAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAllocations();

      let finalData = [];
      if (Array.isArray(response)) {
        finalData = response;
      } else if (Array.isArray(response?.data)) {
        finalData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        finalData = response.data.data;
      } else if (Array.isArray(response?.result)) {
        finalData = response.result;
      }

      const displayData = finalData.map(item => ({
        ...item,
        status_text: item.is_approved ? "Approved" : "Pending",
      }));

      setList(displayData);
      return displayData; // ✅ handleSave needs this
    } catch (err) {
      console.error("Fetch Error:", err);
      alertError("Fetch Error", "Failed to load shift allocations");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ BUG FIX: duplicate useEffect(() => { loadAllocations(); }, []) tha — ek hata diya
  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  // ✅ BUG FIX: findIndex mein i.income_head_id tha — IncomeHead se copy-paste hua tha,
  // yahan allocation_id hona chahiye
  const handleSave = async (updatedData) => {
    const dataToSave = {
      ...updatedData,
      allocation_id: updatedData.allocation_id ?? formData.allocation_id,
    };

    const response = await performSave("allocation_id", dataToSave);

    if (response?.success) {
      const freshList = await loadAllocations();

      // pehle allocation_id se dhundho
      let newIndex = freshList.findIndex(i => i.allocation_id === dataToSave.allocation_id);

      // naya record — employee_id + shift_id + allocation_from se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex(
          i => i.employee_id === dataToSave.employee_id
            && i.shift_id === dataToSave.shift_id
            && i.allocation_from === dataToSave.allocation_from
        );
      }

      if (newIndex === -1 && freshList.length > 0) {
        newIndex = freshList.length - 1;
      }

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] }); // ✅ server ka fresh data
      }
    }
  };

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry")  setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.allocation_id === row.allocation_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete allocation for "${row.employee_name}"?` });
    if (confirmed) {
      const res = await deleteAllocation(row.allocation_id);
      if (res.success) {
        showToast({ icon: "success", title: "Allocation Removed" });
        loadAllocations();
        setShowForm(false);
      }
    }
  };

  // ✅ BUG FIX: item.employee_name tha ID ki jagah — delete API ko name bhej rahe the
  // jo backend mein definitely fail hoga ya galat record delete karega
  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.allocation_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} Shift(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteAllocation(id)));
      const failed = results.filter((r) => !r?.success).length;

      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadAllocations();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some Shifts");
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
        <ShiftAllocationForm
          initialData={formData}
          localData={formData}
          setLocalData={setFormData}
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
        <div className="bg-slate-50 h-full">
          <Table
            title="Employee Shift Allocations"
            activeTab={"search"}
            onTabChange={handleTabChange}
            data={list}
            onDeleteMultiple={handleDeleteMultiple}
            columns={columns}
            rowKey="allocation_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ShiftAllocation;
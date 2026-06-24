// import { useEffect, useState, useCallback } from "react";
// import Table from "../Reusable/table/Table";
// import HolidayMasterForm from "./HolidayMasterForm";
// import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../utils/api";
// import { confirmDelete, showToast, alertError } from "../Reusable/alert";
// import { setERPHandlers } from "../../utils/erpShortcuts";
// import { useERPMode } from "../Reusable/form/useFormMode";
// import ERPPrintPreview from "../Reusable/ERPPrintPreview";

// const initialState = {
//   id: null,
//   date: "",
//   weekly_off: "",
//   purpose: "",
//   remarks: "",
// };

// const columns = [
//   { key: "date", label: "Date" },
//   { key: "purpose", label: "Purpose" },
//   { key: "remarks", label: "Remarks" },
// ];
// const holidayPrintSections = [
//   {
//     type: "fields",
//     title: "Holiday Details",
//     fields: [
//       { label: "Date", key: "date" },
//       { label: "Purpose", key: "purpose" },
//       { label: "Remarks", key: "remarks" },
//       { label: "Weekly Off", key: "weekly_off" },
//       { label: "Off Code", key: "offcode" }
//     ]
//   }
// ];
// const HolidayMaster = ({ tab }) => {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [totalRecords, setTotalRecords] = useState(0);  
// const [showPreview, setShowPreview] = useState(false);
//   const [printData, setPrintData] = useState(null); 
//   const onSuccess = () => {
//     loadData();
//     setShowForm(false);
//   };

//   const {
//     mode,
//     formData,
//     setFormData,
//     showForm,
//     setShowForm,
//     saving,
//     handleView,
//     handleAdd,
//     canPrint,
//     handleModify,
//     performSave,
//     rights = {},
//     handleEditCancel,
//   } = useERPMode(
//     initialState,
//     async (data, isEdit) => { 
//       return isEdit ? await updateHoliday(data.id, data) : await createHoliday(data);
//     },
//     onSuccess, 
//     tab?.appl_name
//   );
 
//   const loadData = useCallback(async (search = "") => {
//     try { 
//       const response = await fetchHolidays(); 
        
//       if (Array.isArray(response)) {
//         setList(response);
//         setTotalRecords(response.length);  
//       } else {
//         setList([]);
//       }
//     } catch (err) {
//       alertError("Error", "Failed to load holiday data");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // Row Selection Sync
//   useEffect(() => {
//     if (showForm && mode === "view" && list.length > 0) {
//       setFormData(list[currentIndex]);
//     }
//   }, [currentIndex, list, showForm, mode]);

//   const handleRowSelect = (row) => {
//     const index = list.findIndex((i) => i.id === row.id);
//     if (index !== -1) setCurrentIndex(index);
//     handleView(row);
//   };

//   // ✅ Save Logic with explicit Validation
//   const handleSave = async () => {
//     if (!formData.date || !formData.purpose) {
//       alertError("Validation", "Date and Purpose are required");
//       return;
//     }

//     const res = await performSave("id"); // "id" matches H_id in your backend mapping
//     if (res?.success) {
//       showToast({ icon: "success", title: "Holiday Saved Successfully" });
//       // onSuccess handle refresh via useERPMode
//     }
//   };
// const handlePrint = (row) => {
//     setPrintData(row || formData);
//     setShowPreview(true);
//   };
//   const handleDelete = async (row) => {
//     const confirm = await confirmDelete({
//       title: `Delete holiday on ${row.date}?`,
//     });

//     if (confirm) {
//       const res = await deleteHoliday(row.id);
//       if (res?.success) {
//         showToast({ icon: "success", title: "Deleted Successfully" });
//         loadData();
//         setShowForm(false);
//       }
//     }
//   };
//    const handleDeleteMultiple = async (selected) => {
//       // Normalize: Table may pass an array of row objects OR an array of keys
//       const ids = (selected || []).map((item) =>
//         typeof item === "object" ? item.income_head_id : item
//       );
  
//       if (ids.length === 0) return;
  
//       const confirmed = await confirmDelete({
//         title: `Delete ${ids.length} Holidays(s)?`,
//       });
//       if (!confirmed) return;
  
//       try {
//         const results = await Promise.all(ids.map((id) => deleteHoliday(id)));
//         const failed = results.filter((r) => !r?.success).length;
  
//         if (failed === 0) {
//           showToast({ icon: "success", title: `${ids.length} deleted` });
//         } else {
//           showToast({
//             icon: "warning",
//             title: `${ids.length - failed} deleted, ${failed} failed`,
//           });
//         }
//         loadData()
//         setShowForm(false);
//       } catch (err) {
//         alertError("Delete Error", "Failed to delete some income heads");
//       }
//     };
  

// useEffect(() => {
//     setERPHandlers({
//       onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
//       onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
//       onNew: () => (rights?.add === 1) && handleAdd(),
//       onSave: handleSave,
//       onPrint: handlePrint, // Shortcut for printing
//       onEsc: () => {
//         if (showPreview) setShowPreview(false);
//         else setShowForm(false);
//       },
//     });
//   }, [list, rights, handleAdd, handleSave, showPreview]);
// return (
//     <div className="h-full w-full">
//       {showPreview ? (
//         /* 🖨️ Print Preview Render */
//         <ERPPrintPreview
//           title="Holiday Details"
//           data={printData}
//           sections={holidayPrintSections}
//           logo="/finaman-logo.png" // Aapka logo path
//           onBack={() => setShowPreview(false)}
//         />
//       ) : showForm ? (
//         <HolidayMasterForm
//           formData={formData}
//           setFormData={setFormData}
//           onSave={handleSave}
//           onEditCancel={handleEditCancel}
//           onCancel={() => setShowForm(false)}
//           onDelete={handleDelete}
//           onPrint={handlePrint} // Form ko pass karein
//           mode={mode}
//           saving={saving}
//           canPrint={canPrint} // Permission pass karein
//           onModify={handleModify}
//           onNewEntry={handleAdd}
//           currentRecord={currentIndex + 1}
//           totalRecords={list.length}
//           rights={rights}
//         />
//       ) : (
//         <Table
//           title="Holiday Master"
//           data={list}
//           columns={columns}
//           rowKey="id"
//           loading={loading}
//           onAdd={rights?.add === 1 ? handleAdd : null}
//           onRowDoubleClick={handleRowSelect}
//           onSearch={(val) => loadData(val)} 
//           onDeleteMultiple={handleDeleteMultiple}
//         />
//       )}
//     </div>
//   );
// };

// export default HolidayMaster;
import { useEffect, useState, useCallback, useRef } from "react";
import Table from "../Reusable/table/Table";
import HolidayMasterForm from "./HolidayMasterForm";
import { useERPMode } from "../Reusable/form/useFormMode";
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../utils/api";
import { confirmDelete, showToast, alertError } from "../Reusable/alert";
import { setERPHandlers } from "../../utils/erpShortcuts";
import ERPPrintPreview from "../Reusable/ERPPrintPreview";

const initialState = {
  id: null,
  date: "",
  weekly_off: "",
  purpose: "",
  remarks: "",
};

const columns = [
  { key: "date",    label: "Date"    },
  { key: "purpose", label: "Purpose" },
  { key: "remarks", label: "Remarks" },
];

const holidayPrintSections = [
  {
    type: "fields",
    title: "Holiday Details",
    fields: [
      { label: "Date",       key: "date"       },
      { label: "Purpose",    key: "purpose"    },
      { label: "Remarks",    key: "remarks"    },
      { label: "Weekly Off", key: "weekly_off" },
      { label: "Off Code",   key: "offcode"    },
    ],
  },
];

const HolidayMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [pageSize,     setPageSize]     = useState(20); // ✅ pageSize state

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
    canPrint,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateHoliday(data.id, data)
        : await createHoliday(data);
    },
    () => loadList(),
    tab.appl_name
  );
  const loadList = useCallback(async (search = "", size) => {
    try {
      setLoading(true);
      const currentSize = size ?? pageSize;
      const data = await fetchHolidays(search, currentSize);
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      return finalData;
    } catch (err) {
      alertError("Fetch Error", "Failed to load holidays");
      return [];
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    loadList("", newSize);
  };
 

  useEffect(() => { loadList(); }, []);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    // updatedData.id null aa raha tha — formData se directly lo
    const dataToSave = { ...updatedData, id: updatedData.id ?? formData.id };
    const response = await performSave("id", dataToSave);

    if (response?.success) {
      const freshList = await loadList();

      // Pehle id se dhundho
      let newIndex = freshList.findIndex(i => i.id === dataToSave.id);

      // id nahi mila (naya record) — date + purpose se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex(
          i => i.date === dataToSave.date && i.purpose === dataToSave.purpose
        );
      }

      // Ab bhi nahi mila — last record dikhao (naya add hua hoga)
      if (newIndex === -1 && freshList.length > 0) {
        newIndex = 0; // freshList sorted by date desc, naya record top pe hoga
      }

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] }); // server ka bilkul fresh data
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete holiday on "${row.date}"?` });
    if (confirmed) {
      const res = await deleteHoliday(row.id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };
  const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} holiday(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteHoliday(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some holidays");
    }
  };

  const handlePrint = (row) => {
    setPrintData(row || formData);
    setShowPreview(true);
  };

  const saveBtnRef = useRef(null);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: () => handleSave(formData),
      onPrint: handlePrint,
      onEsc: () => {
        if (showPreview) setShowPreview(false);
        else setShowForm(false);
      },
    });
  }, [list, handleAdd, formData, showPreview, setShowForm]);

  return (
    <div className="h-full w-full">
      {showPreview ? (
        <ERPPrintPreview
          title="Holiday Details"
          data={printData}
          sections={holidayPrintSections}
          logo="/finaman-logo.png"
          onBack={() => setShowPreview(false)}
        />
      ) : showForm ? (
        <HolidayMasterForm
          formData={formData}
          activeTab={showForm ? "entry" : "search"}
          onTabChange={handleTabChange}
          setFormData={setFormData}
          onSave={handleSave}
          saveBtnRef={saveBtnRef}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onCancel={() => setShowForm(false)}
          mode={mode}
          saving={saving}
          canPrint={canPrint}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
          onEditCancel={handleEditCancel}
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            activeTab="search" 
            onTabChange={handleTabChange}
            title="Holiday Master"
            data={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
            pageSize={pageSize}
            onPageChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default HolidayMaster;
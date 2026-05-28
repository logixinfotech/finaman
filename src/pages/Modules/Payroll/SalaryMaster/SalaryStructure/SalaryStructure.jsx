// import { useEffect, useState, useCallback } from "react";
// import Table from "../../../../../components/Reusable/table/Table";
// import SalaryStructureForm from "./SalaryStructureForm";
// import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
// // Apni actual APIs yahan import kijiye
// import { fetchSalaryStructures, createSalaryStructure, updateSalaryStructure, deleteSalaryStructure } from "../../../../../utils/api"; 
// import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
// import { setERPHandlers } from "../../../../../utils/erpShortcuts";

// const initialState = {
//   employee_id: "",
//   effective_from: "",
//   template_id: "",
//   ctc: "",
//   basic_percent: "40",
//   hra_percent: "20",
//   gross_monthly: "",
//   revision_reason: "",
//   arrear_applicable: "No",
//   status: "Active",
// };

// // Main List view columns (as per image)
// const columns = [
//   { key: "employee_name",  label: "Employee name" },
//   { key: "effective_from", label: "Effective from" },
//   { key: "ctc",            label: "CTC", render: (val) => `₹${val}` },
//   { key: "gross_monthly",  label: "Gross/mo", render: (val) => `₹${val}` },
//   { key: "template_name",  label: "Template" },
//   { 
//     key: "status", 
//     label: "Status",
//     render: (val) => (
//       <span className={val === 'Active' ? 'text-green-600 font-medium' : 'text-gray-400'}>{val}</span>
//     )
//   },
// ];

// const SalaryStructure = ({ tab }) => {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [historyData, setHistoryData] = useState([]); // State for history table

//   const {
//     mode,
//     formData, setFormData,
//     showForm, setShowForm,
//     saving, handleEditCancel,
//     handleView, handleAdd, handleModify, performSave, rights
//   } = useERPMode(
//     initialState,
//     async (data, isEdit) => {
//       return isEdit
//         ? await updateSalaryStructure(data.salary_structure_id, data)
//         : await createSalaryStructure(data);
//     },
//     () => loadList(),
//     tab?.appl_name || "Salary Structure Entry"
//   );

//   const loadList = useCallback(async () => {
//     try {
//       setLoading(true);
//       // Dummy mock data based on your screenshot for visual testing
//       const mockData = [
//         {
//           salary_structure_id: 1,
//           employee_id: "Rahul Sharma",
//           employee_name: "Rahul Sharma",
//           effective_from: "2026-05-01",
//           ctc: "600000",
//           gross_monthly: "50000",
//           basic_percent: "40",
//           hra_percent: "20",
//           template_id: "Grade A Template",
//           template_name: "Grade A",
//           revision_reason: "Annual increment",
//           arrear_applicable: "Yes",
//           status: "Active"
//         },
//         {
//           salary_structure_id: 2,
//           employee_id: "Priya Mehta",
//           employee_name: "Priya Mehta",
//           effective_from: "2025-04-01",
//           ctc: "480000",
//           gross_monthly: "40000",
//           basic_percent: "40",
//           hra_percent: "20",
//           template_id: "Grade B Template",
//           template_name: "Grade B",
//           revision_reason: "Joining",
//           arrear_applicable: "No",
//           status: "Active"
//         }
//       ];
//       // Replace with actual API call: const data = await fetchSalaryStructures();
      
//       setList(mockData);
//       if (mockData.length > 0 && !showForm) {
//         setFormData(mockData[0]);
//         setCurrentIndex(0);
//       }
//     } catch (err) {
//       alertError("Fetch Error", "Failed to load salary structures");
//     } finally {
//       setLoading(false);
//     }
//   }, [setFormData, showForm]);

//   useEffect(() => { loadList(); }, [loadList]);

//   // Fetch History data when specific row is viewed/clicked
//   useEffect(() => {
//     if (showForm && formData.employee_id) {
//       // API call to fetch history: GET /salary-structure/:employee_id/history
//       // Mocking history data for now based on screenshot
//       setHistoryData([
//         {
//           effective_from: "01 May 2026",
//           ctc: "6,00,000",
//           basic_percent: "40",
//           gross_monthly: "50,000",
//           revision_reason: "Annual increment",
//           arrear_applicable: "Yes",
//           status: "Active"
//         },
//         {
//           effective_from: "01 Apr 2025",
//           ctc: "5,40,000",
//           basic_percent: "40",
//           gross_monthly: "45,000",
//           revision_reason: "Joining",
//           arrear_applicable: "No",
//           status: "Old"
//         }
//       ]);
//     }
//   }, [formData.employee_id, showForm]);

//   useEffect(() => {
//     if (showForm && mode === "view" && list.length > 0) {
//       setFormData(list[currentIndex]);
//     }
//   }, [currentIndex, list, showForm, mode, setFormData]);

//   const handleTabChange = (t) => {
//     if (t === "search") setShowForm(false);
//     if (t === "entry")  setShowForm(true);
//   };

//   const handleRowSelect = (row) => {
//     const index = list.findIndex(i => i.salary_structure_id === row.salary_structure_id);
//     if (index !== -1) setCurrentIndex(index);
//     handleView(row);
//   };

//   const handleSave = async (updatedData) => {
//     const response = await performSave("salary_structure_id", updatedData);
//     if (response?.success) {
//       await loadList();
//     }
//   };

//   const handleDelete = async (row) => {
//     const confirmed = await confirmDelete({ title: `Delete record for "${row.employee_name}"?` });
//     if (confirmed) {
//       const res = await deleteSalaryStructure(row.salary_structure_id);
//       if (res.success) {
//         showToast({ icon: "success", title: "Deleted successfully" });
//         loadList();
//         setShowForm(false);
//       }
//     }
//   };

//   const handleDeleteMultiple = async (selected) => {
//     const ids = (selected || []).map((item) =>
//       typeof item === "object" ? item.salary_structure_id : item
//     );

//     if (ids.length === 0) return;

//     const confirmed = await confirmDelete({
//       title: `Delete ${ids.length} record(s)?`,
//     });
//     if (!confirmed) return;

//     try {
//       const results = await Promise.all(ids.map((id) => deleteSalaryStructure(id)));
//       const failed = results.filter((r) => !r?.success).length;

//       if (failed === 0) {
//         showToast({ icon: "success", title: `${ids.length} records deleted` });
//       } else {
//         showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
//       }
//       loadList();
//       setShowForm(false);
//     } catch (err) {
//       alertError("Delete Error", "Failed to delete selected records");
//     }
//   };

//   useEffect(() => {
//     setERPHandlers({
//       onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
//       onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
//       onNew:  handleAdd,
//       onSave: () => document.querySelector("button[type='submit']")?.click(),
//       onEsc:  () => setShowForm(false),
//     });
//   }, [list, handleAdd, setShowForm]);

//   return (
//     <div className="h-full w-full bg-[#eef1f6] p-2 md:p-4 font-sans">
//       {showForm ? (
//         <SalaryStructureForm
//           formData={formData}
//           setFormData={setFormData}
//           historyData={historyData}
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
//           onTabChange={handleTabChange}
//         />
//       ) : (
//         <div className="bg-white h-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           <Table
//             title="Salary Structure"
//             data={list}
//             columns={columns}
//             rowKey="salary_structure_id"
//             loading={loading}
//             onAdd={rights?.add === 1 ? handleAdd : null}
//             onRowDoubleClick={handleRowSelect}
//             onDeleteMultiple={handleDeleteMultiple}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default SalaryStructure;
import { useEffect, useState, useCallback } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import SalaryStructureForm from "./SalaryStructureForm";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

// ─── DUMMY DATABASE & MOCK APIs ──────────────────────────────────────────────
let mockDB = [
  {
    salary_structure_id: 1,
    employee_id: "Rahul Sharma",
    employee_name: "Rahul Sharma",
    effective_from: "2026-05-01",
    ctc: "600000",
    gross_monthly: "50000",
    basic_percent: "40",
    hra_percent: "20",
    template_id: "Grade A Template",
    template_name: "Grade A",
    revision_reason: "Annual increment",
    arrear_applicable: "Yes",
    status: "Active"
  },
  {
    salary_structure_id: 2,
    employee_id: "Priya Mehta",
    employee_name: "Priya Mehta",
    effective_from: "2025-04-01",
    ctc: "480000",
    gross_monthly: "40000",
    basic_percent: "40",
    hra_percent: "20",
    template_id: "Grade B Template",
    template_name: "Grade B",
    revision_reason: "Joining",
    arrear_applicable: "No",
    status: "Active"
  }
];

const fetchSalaryStructures = async () => [...mockDB];

const createSalaryStructure = async (data) => {
  const newRecord = { 
    ...data, 
    salary_structure_id: Date.now(),
    employee_name: data.employee_id, // For display in table
    template_name: data.template_id?.replace(" Template", "") || "N/A"
  };
  mockDB = [newRecord, ...mockDB];
  return { success: true, data: newRecord };
};

const updateSalaryStructure = async (id, data) => {
  mockDB = mockDB.map(item => item.salary_structure_id === id ? { 
    ...item, 
    ...data,
    employee_name: data.employee_id,
    template_name: data.template_id?.replace(" Template", "") || "N/A"
  } : item);
  return { success: true };
};

const deleteSalaryStructure = async (id) => {
  mockDB = mockDB.filter(item => item.salary_structure_id !== id);
  return { success: true };
};
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  employee_id: "",
  effective_from: "",
  template_id: "",
  ctc: "",
  basic_percent: "40",
  hra_percent: "20",
  gross_monthly: "",
  revision_reason: "",
  arrear_applicable: "No",
  status: "Active",
};
// NAYA COLUMNS ARRAY (Safe & Simple):
const columns = [
  { key: "employee_name",  label: "Employee name" },
  { key: "effective_from", label: "Effective from" },
  { key: "ctc",            label: "CTC" },
  { key: "gross_monthly",  label: "Gross/mo" },
  { key: "template_name",  label: "Template" },
  { key: "status",         label: "Status" },
];

const SalaryStructure = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyData, setHistoryData] = useState([]);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      // Using our dummy APIs here
      return isEdit
        ? await updateSalaryStructure(data.salary_structure_id, data)
        : await createSalaryStructure(data);
    },
    () => loadList(),
    tab?.appl_name || "Salary Structure Entry"
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSalaryStructures(); // Dummy fetch
      setList(data);
      if (data.length > 0 && !showForm) {
        setFormData(data[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load salary structures");
    } finally {
      setLoading(false);
    }
  }, [setFormData, showForm]);

  useEffect(() => { loadList(); }, [loadList]);

  // Mocking History Data based on Employee Selection
  useEffect(() => {
    if (showForm && formData.employee_id) {
      if (formData.employee_id === "Rahul Sharma") {
        setHistoryData([
          { effective_from: "01 May 2026", ctc: "6,00,000", basic_percent: "40", gross_monthly: "50,000", revision_reason: "Annual increment", arrear_applicable: "Yes", status: "Active" },
          { effective_from: "01 Apr 2025", ctc: "5,40,000", basic_percent: "40", gross_monthly: "45,000", revision_reason: "Joining", arrear_applicable: "No", status: "Old" }
        ]);
      } else {
        setHistoryData([
          { effective_from: "01 Apr 2025", ctc: "4,80,000", basic_percent: "40", gross_monthly: "40,000", revision_reason: "Joining", arrear_applicable: "No", status: "Active" }
        ]);
      }
    } else {
      setHistoryData([]); // Empty for new entries
    }
  }, [formData.employee_id, showForm]);

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
    const index = list.findIndex(i => i.salary_structure_id === row.salary_structure_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("salary_structure_id", updatedData);
    if (response?.success) {
      await loadList();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete record for "${row.employee_name}"?` });
    if (confirmed) {
      const res = await deleteSalaryStructure(row.salary_structure_id); // Dummy delete
      if (res.success) {
        showToast({ icon: "success", title: "Deleted successfully" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.salary_structure_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} record(s)?` });
    if (!confirmed) return;

    try {
      await Promise.all(ids.map((id) => deleteSalaryStructure(id)));
      showToast({ icon: "success", title: `${ids.length} records deleted` });
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete selected records");
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: () => document.querySelector("button[type='submit']")?.click(),
      onEsc:  () => setShowForm(false),
    });
  }, [list, handleAdd, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <SalaryStructureForm
          formData={formData}
          setFormData={setFormData}
          historyData={historyData}
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
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            title="Salary Structure"
            data={list}
            columns={columns}
            rowKey="salary_structure_id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;
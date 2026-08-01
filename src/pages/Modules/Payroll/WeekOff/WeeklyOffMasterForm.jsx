// import React, { useState, useCallback, useEffect, useRef } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../components/Reusable/input/Date";
// import { focusFirstInput, handleERPEnterNavigation, handleERPBackspaceNavigation } from "../../../../utils/erpShortcuts";
// import { getActledList } from "../../../../utils/api";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const daysOfWeek = [
//   "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
// ];

// // ── Multi-select Employee Dropdown ─────────────────────────────────────────
// const EmployeeMultiSelect = ({ employees, selectedIds, onChange, disabled, error }) => {
//   const [open, setOpen] = useState(false);
//   const [search, setSearch] = useState("");
//   const ref = useRef(null);

//   useEffect(() => {
//     const handler = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const filtered = employees.filter(e =>
//     e.Led_name?.toLowerCase().includes(search.toLowerCase()) ||
//     e.Led_code?.toLowerCase().includes(search.toLowerCase())
//   );

//   const allSelected = selectedIds.length === employees.length && employees.length > 0;
//   const someSelected = selectedIds.length > 0 && !allSelected;

//   const toggleAll = () => {
//     if (allSelected) onChange([]);
//     else onChange(employees.map(e => e.Actled_id));
//   };

//   const toggleOne = (id) => {
//     if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
//     else onChange([...selectedIds, id]);
//   };

//   // Label logic replace karo:
//   const label = selectedIds.length === 0
//     ? "Select Employees"
//     : selectedIds.length === employees.length
//       ? `All Employees (${employees.length})`
//       : selectedIds.length <= 10
//         ? selectedIds.map(id => {
//           const emp = employees.find(e => e.Actled_id === id);
//           return emp?.full_name || emp?.Led_name;
//         }).filter(Boolean).join(", ")
//         : `${selectedIds.length} employees selected`;

//   return (
//     <div ref={ref} style={{ position: "relative", width: "100%" }}>
//       {/* Trigger */}
//       <div
//         onClick={() => !disabled && setOpen(p => !p)}
//         style={{
//           minHeight: 32,           // ✅ fixed height nahi — grow karne do
//           border: `1px solid ${error ? "#ef4444" : open ? "#3b82f6" : "#d1d5db"}`,
//           borderRadius: 6,
//           padding: "4px 10px",    // ✅ vertical padding
//           cursor: disabled ? "not-allowed" : "pointer",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//           gap: 8,
//           background: disabled ? "#eef1f6" : "#fff",
//           fontFamily: FONT,
//           boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
//           transition: "border-color .15s",
//         }}
//       >
//         <span style={{
//           fontSize: 13,
//           color: selectedIds.length === 0 ? "#9ca3af" : "#1f2937",
//           fontWeight: selectedIds.length > 0 ? 500 : 400,
//           whiteSpace: "normal",    // ✅ wrap allow karo
//           wordBreak: "break-word",
//           lineHeight: 1.5,
//           flex: 1,
//         }}>
//           {label}
//         </span>
//         <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
//           style={{
//             color: "#9ca3af", flexShrink: 0,
//             transform: open ? "rotate(180deg)" : "none", transition: "transform .15s"
//           }}>
//           <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
//         </svg>
//       </div>

//       {/* Dropdown */}
//       {open && (
//         <div style={{
//           position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
//           zIndex: 999, background: "#fff", border: "1px solid #e5e7eb",
//           borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
//           maxHeight: 280, display: "flex", flexDirection: "column",
//           fontFamily: FONT,
//         }}>
//           {/* Search */}
//           <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f2f6" }}>
//             <input
//               autoFocus
//               placeholder="Search employee..."
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               style={{
//                 width: "100%", height: 28, border: "1px solid #e5e7eb",
//                 borderRadius: 6, padding: "0 8px", fontSize: 12, outline: "none",
//                 background: "#f9fafb", fontFamily: FONT, boxSizing: "border-box",
//               }}
//             />
//           </div>

//           {/* Select All */}
//           <div
//             onClick={toggleAll}
//             style={{
//               display: "flex", alignItems: "center", gap: 10,
//               padding: "8px 12px", cursor: "pointer",
//               borderBottom: "1px solid #f0f2f6",
//               background: allSelected ? "#EAF3DE" : "#fafbff",
//             }}
//           >
//             <div style={{
//               width: 16, height: 16, borderRadius: 4, flexShrink: 0,
//               border: `2px solid ${allSelected || someSelected ? "#185FA5" : "#d1d5db"}`,
//               background: allSelected ? "#185FA5" : "#fff",
//               display: "flex", alignItems: "center", justifyContent: "center",
//             }}>
//               {allSelected && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
//               {someSelected && <span style={{ color: "#185FA5", fontSize: 11, lineHeight: 1, fontWeight: 900 }}>—</span>}
//             </div>
//             <span style={{ fontSize: 13, fontWeight: 600, color: "#185FA5" }}>
//               Select All ({employees.length})
//             </span>
//           </div>

//           {/* List */}
//           <div style={{ overflowY: "auto", flex: 1 }}>
//             {filtered.length === 0 ? (
//               <div style={{ padding: "12px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
//                 No employees found
//               </div>
//             ) : filtered.map(emp => {
//               const checked = selectedIds.includes(emp.Actled_id);
//               return (
//                 <div
//                   key={emp.Actled_id}
//                   onClick={() => toggleOne(emp.Actled_id)}
//                   style={{
//                     display: "flex", alignItems: "center", gap: 10,
//                     padding: "7px 12px", cursor: "pointer",
//                     background: checked ? "#f0f6ff" : "#fff",
//                     borderBottom: "0.5px solid #f5f6fa",
//                     transition: "background .1s",
//                   }}
//                 >
//                   <div style={{
//                     width: 16, height: 16, borderRadius: 4, flexShrink: 0,
//                     border: `2px solid ${checked ? "#185FA5" : "#d1d5db"}`,
//                     background: checked ? "#185FA5" : "#fff",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                   }}>
//                     {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
//                   </div>
//                   <div style={{ minWidth: 0 }}>
//                     <span style={{ fontSize: 13, color: "#1f2937", fontWeight: checked ? 500 : 400 }}>
//                       {emp.full_name || emp.Led_name}
//                     </span>
//                     <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>
//                       {emp.Led_code}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Footer */}
//           <div style={{
//             padding: "6px 12px", borderTop: "1px solid #f0f2f6",
//             background: "#f9fafb", display: "flex", justifyContent: "space-between",
//             alignItems: "center",
//           }}>
//             <span style={{ fontSize: 11, color: "#6b7280" }}>
//               {selectedIds.length} of {employees.length} selected
//             </span>
//             <button
//               onClick={() => setOpen(false)}
//               style={{
//                 height: 24, padding: "0 10px", borderRadius: 5, border: "none",
//                 background: "#185FA5", color: "#E6F1FB", fontSize: 11,
//                 fontWeight: 600, cursor: "pointer",
//               }}
//             >
//               Done
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ── Main Form ──────────────────────────────────────────────────────────────
// const WeeklyOffMasterForm = ({
//   mode = "view",
//   onSave,
//   onCancel,
//   onDelete,
//   onEditCancel,
//   saving,
//   onModify,
//   onNewEntry,
//   currentRecord,
//   totalRecords,
//   setFormData,
//   rights,
//   activeTab = "entry",
//   onTabChange,
//   initialData = {},
//   onPrevRecord, onNextRecord,
// }) => {
//   const [localData, setLocalData] = useState(initialData);
//   const [errors, setErrors] = useState({});
//   const formRef = useRef(null);
//   const saveBtnRef = useRef(null);
//   const [employees, setEmployees] = useState([]);
//   const [employeeNames, setEmployeeNames] = useState([]);

//   // Multi-select state — array of Actled_id
//   const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";
//   const isAddMode = mode === "add";

//   useEffect(() => {
//     if (isAddMode || isEditMode) focusFirstInput(formRef);
//   }, [isAddMode, isEditMode]);

//   useEffect(() => {
//     const fetchEmployees = async () => {
//       try {
//         const data = await getActledList();
//         console.log("First employee:", data[0]); // ← ADD — dekho full_name hai?
//         setEmployees(data);
//         setEmployeeNames(data.map(emp => (emp.full_name || emp.Led_name)?.trim()));
//       } catch (err) {
//         console.error("Failed to fetch employees:", err);
//       }
//     };
//     fetchEmployees();
//   }, []);

//   useEffect(() => {
//     if (!initialData || Object.keys(initialData).length === 0) return;
//     const employee = initialData.employee_name ||
//       employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.full_name ||
//       employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.Led_name || "";
//     const formattedData = {
//       ...initialData,
//       employee_name: employee,
//       effective_from: initialData.effective_from ? initialData.effective_from.split("T")[0] : "",
//       effective_to: initialData.effective_to ? initialData.effective_to.split("T")[0] : "",
//     };
//     if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
//       setLocalData(formattedData);
//       setFormData(formattedData);
//     }
//     // View mode — single employee select
//     if (initialData.employee_id) {
//       setSelectedEmployeeIds([Number(initialData.employee_id)]);
//     }
//   }, [initialData, employees]);

//   // Add mode — reset selection
//   useEffect(() => {
//     if (isAddMode) setSelectedEmployeeIds([]);
//   }, [isAddMode]);

//   const handleKeyDown = useCallback(
//     (e) => {
//       handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
//       handleERPBackspaceNavigation(e, formRef, isViewMode);
//     },
//     [isViewMode]
//   );

//   const handleChange = (field, value) => {
//     const updatedData = { ...localData, [field]: value };
//     setLocalData(updatedData);
//     setFormData(updatedData);
//     setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
//   };

//   const getInputClass = (isDisabled, fieldName) =>
//     `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
//     } ${isDisabled
//       ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
//       : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
//     }`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;

//     const newErrors = {};
//     if (!selectedEmployeeIds.length) newErrors.employee_ids = "Please select at least one employee";
//     if (!localData.day_of_week) newErrors.day_of_week = "Required";
//     if (!localData.effective_from) newErrors.effective_from = "Required";

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     // Pass bulk data to parent
//     onSave?.({
//       ...localData,
//       employee_ids: selectedEmployeeIds,     // ✅ array for bulk save
//       employee_id: selectedEmployeeIds[0],   // ✅ single for compatibility
//     });
//   }, [localData, selectedEmployeeIds, onSave, isViewMode]);

//   return (
//     <div className="w-full h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
//       style={{ fontFamily: FONT }}>
//       <ERPHeader
//         title="Week Off Master"
//         isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
//         activeTab={activeTab} onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//         currentIndex={currentRecord} totalRecords={totalRecords}
//         onPrevRecord={onPrevRecord} onNextRecord={onNextRecord}
//       />

//       <div className="flex-1 p-4 overflow-y-auto flex justify-center">
//         <div ref={formRef} className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-visible">
//           <div className="p-5 flex flex-col gap-5">

//             {/* Row 1 — Employee + Weekly Off Day */}
//             <div className="flex items-start gap-6">

//               {/* Employee */}
//               <div className="flex items-start gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 120, paddingTop: 4, flexShrink: 0 }}>
//                   Employee <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <EmployeeMultiSelect
//                     employees={employees}
//                     selectedIds={selectedEmployeeIds}
//                     onChange={setSelectedEmployeeIds}
//                     disabled={isViewMode}
//                     error={!!errors.employee_ids}
//                   />
//                   {errors.employee_ids && (
//                     <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.employee_ids}</p>
//                   )}

//                 </div>
//               </div>

//               {/* Weekly Off Day */}
//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 110, flexShrink: 0 }}>
//                   Weekly Off <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <ERPAutocomplete
//                     data-auto
//                     options={daysOfWeek}
//                     value={localData.day_of_week || ""}
//                     onChange={(val) => handleChange("day_of_week", val)}
//                     className={getInputClass(isViewMode, "day_of_week")}
//                     disabled={isViewMode}
//                     onKeyDown={handleKeyDown}
//                   />
//                   {errors.day_of_week && (
//                     <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</p>
//                   )}
//                 </div>
//               </div>

//             </div>

//             {/* Row 2 — Effective From + Effective To */}
//             <div className="flex items-center gap-6">

//               {/* Effective From */}
//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 120, flexShrink: 0 }}>
//                   Effective From <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <ERPDateInput
//                     value={localData.effective_from || ""}
//                     disabled={isViewMode}
//                     onChange={(val) => handleChange("effective_from", val)}
//                     className={getInputClass(isViewMode, "effective_from")}
//                     onKeyDown={handleKeyDown}
//                   />
//                   {errors.effective_from && (
//                     <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</p>
//                   )}
//                 </div>
//               </div>

//               {/* Effective To */}
//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 110, flexShrink: 0 }}>
//                   Effective To
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <ERPDateInput
//                     value={localData.effective_to || ""}
//                     disabled={isViewMode}
//                     minDate={localData.effective_from}
//                     onChange={(val) => handleChange("effective_to", val)}
//                     className={getInputClass(isViewMode, "effective_to")}
//                     onKeyDown={handleKeyDown}
//                   />
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
//         saveBtnRef={saveBtnRef} saving={saving}
//         handleSubmit={handleValidateAndSave}
//         onModify={onModify}
//         onDelete={() => onDelete && onDelete(localData)}
//         onCancel={onCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default WeeklyOffMasterForm;
import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { focusFirstInput, handleERPEnterNavigation, handleERPBackspaceNavigation } from "../../../../utils/erpShortcuts";
import { getActledList } from "../../../../utils/api";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

// ── Multi-select Employee Dropdown ─────────────────────────────────────────
const EmployeeMultiSelect = ({ employees, selectedIds, onChange, disabled, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = employees.filter(e =>
    e.Led_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.Led_code?.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = selectedIds.length === employees.length && employees.length > 0;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange(employees.map(e => e.Actled_id));
  };

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };

  // Label logic replace karo:
  const label = selectedIds.length === 0
    ? "Select Employees"
    : selectedIds.length === employees.length
      ? `All Employees (${employees.length})`
      : selectedIds.length <= 10
        ? selectedIds.map(id => {
          const emp = employees.find(e => e.Actled_id === id);
          return emp?.full_name || emp?.Led_name;
        }).filter(Boolean).join(", ")
        : `${selectedIds.length} employees selected`;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          minHeight: 32,           // ✅ fixed height nahi — grow karne do
          border: `1px solid ${error ? "#ef4444" : open ? "#3b82f6" : "#d1d5db"}`,
          borderRadius: 6,
          padding: "4px 10px",    // ✅ vertical padding
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8,
          background: disabled ? "#eef1f6" : "#fff",
          fontFamily: FONT,
          boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
          transition: "border-color .15s",
        }}
      >
        <span style={{
          fontSize: 13,
          color: selectedIds.length === 0 ? "#9ca3af" : "#1f2937",
          fontWeight: selectedIds.length > 0 ? 500 : 400,
          whiteSpace: "normal",    // ✅ wrap allow karo
          wordBreak: "break-word",
          lineHeight: 1.5,
          flex: 1,
        }}>
          {label}
        </span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
          style={{
            color: "#9ca3af", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none", transition: "transform .15s"
          }}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 999, background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          maxHeight: 280, display: "flex", flexDirection: "column",
          fontFamily: FONT,
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f2f6" }}>
            <input
              autoFocus
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", height: 28, border: "1px solid #e5e7eb",
                borderRadius: 6, padding: "0 8px", fontSize: 12, outline: "none",
                background: "#f9fafb", fontFamily: FONT, boxSizing: "border-box",
              }}
            />
          </div>

          {/* Select All */}
          <div
            onClick={toggleAll}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", cursor: "pointer",
              borderBottom: "1px solid #f0f2f6",
              background: allSelected ? "#EAF3DE" : "#fafbff",
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${allSelected || someSelected ? "#185FA5" : "#d1d5db"}`,
              background: allSelected ? "#185FA5" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {allSelected && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
              {someSelected && <span style={{ color: "#185FA5", fontSize: 11, lineHeight: 1, fontWeight: 900 }}>—</span>}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#185FA5" }}>
              Select All ({employees.length})
            </span>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                No employees found
              </div>
            ) : filtered.map(emp => {
              const checked = selectedIds.includes(emp.Actled_id);
              return (
                <div
                  key={emp.Actled_id}
                  onClick={() => toggleOne(emp.Actled_id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 12px", cursor: "pointer",
                    background: checked ? "#f0f6ff" : "#fff",
                    borderBottom: "0.5px solid #f5f6fa",
                    transition: "background .1s",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? "#185FA5" : "#d1d5db"}`,
                    background: checked ? "#185FA5" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: "#1f2937", fontWeight: checked ? 500 : 400 }}>
                      {emp.full_name || emp.Led_name}
                    </span>
                    <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>
                      {emp.Led_code}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "6px 12px", borderTop: "1px solid #f0f2f6",
            background: "#f9fafb", display: "flex", justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {selectedIds.length} of {employees.length} selected
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                height: 24, padding: "0 10px", borderRadius: 5, border: "none",
                background: "#185FA5", color: "#E6F1FB", fontSize: 11,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Form ──────────────────────────────────────────────────────────────
const WeeklyOffMasterForm = ({
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  setFormData,
  rights,
  activeTab = "entry",
  onTabChange,
  initialData = {},
  onPrevRecord, onNextRecord,
}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const saveBtnRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);

  // Multi-select state — array of Actled_id
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  useEffect(() => {
    if (isAddMode || isEditMode) focusFirstInput(formRef);
  }, [isAddMode, isEditMode]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        console.log("First employee:", data[0]); // ← ADD — dekho full_name hai?
        setEmployees(data);
        setEmployeeNames(data.map(emp => (emp.full_name || emp.Led_name)?.trim()));
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    const employee = initialData.employee_name ||
      employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.full_name ||
      employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.Led_name || "";
    const formattedData = {
      ...initialData,
      employee_name: employee,
      effective_from: initialData.effective_from ? initialData.effective_from.split("T")[0] : "",
      effective_to: initialData.effective_to ? initialData.effective_to.split("T")[0] : "",
    };
    if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
      setLocalData(formattedData);
      setFormData(formattedData);
    }
    // View mode — single employee select
    if (initialData.employee_id) {
      setSelectedEmployeeIds([Number(initialData.employee_id)]);
    }
  }, [initialData, employees]);

  // Add mode — reset selection
  useEffect(() => {
    if (isAddMode) setSelectedEmployeeIds([]);
  }, [isAddMode]);

  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    },
    [isViewMode]
  );

  const handleChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    setFormData(updatedData);
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    const newErrors = {};
    if (!selectedEmployeeIds.length) newErrors.employee_ids = "Please select at least one employee";
    if (!localData.day_of_week) newErrors.day_of_week = "Required";
    if (!localData.effective_from) newErrors.effective_from = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass bulk data to parent
    onSave?.({
      ...localData,
      employee_ids: selectedEmployeeIds,     // ✅ array for bulk save
      employee_id: selectedEmployeeIds[0],   // ✅ single for compatibility
    });
  }, [localData, selectedEmployeeIds, onSave, isViewMode]);

  return (
    <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}>
      <ERPHeader
        title="Week Off Master"
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        activeTab={activeTab} onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord} totalRecords={totalRecords}
        onPrevRecord={onPrevRecord} onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div ref={formRef} className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-visible">
          <div className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-5">

            {/* Row 1 — Employee + Weekly Off Day */}
            <div className="flex items-start gap-2 sm:gap-6">

              {/* Employee */}
              <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[120px] shrink-0" style={{ color: "#1f2937", paddingTop: 4 }}>
                  Employee <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <EmployeeMultiSelect
                    employees={employees}
                    selectedIds={selectedEmployeeIds}
                    onChange={setSelectedEmployeeIds}
                    disabled={isViewMode}
                    error={!!errors.employee_ids}
                  />
                  {errors.employee_ids && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{errors.employee_ids}</p>
                  )}

                </div>
              </div>

              {/* Weekly Off Day */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[60px] sm:w-[110px] shrink-0" style={{ color: "#1f2937" }}>
                  Weekly Off <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <ERPAutocomplete
                    data-auto
                    options={daysOfWeek}
                    value={localData.day_of_week || ""}
                    onChange={(val) => handleChange("day_of_week", val)}
                    className={getInputClass(isViewMode, "day_of_week")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                  {errors.day_of_week && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</p>
                  )}
                </div>
              </div>

            </div>

            {/* Row 2 — Effective From + Effective To */}
            <div className="flex items-center gap-2 sm:gap-6">

              {/* Effective From */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[120px] shrink-0" style={{ color: "#1f2937" }}>
                  Effective From <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <ERPDateInput
                    value={localData.effective_from || ""}
                    disabled={isViewMode}
                    onChange={(val) => handleChange("effective_from", val)}
                    className={getInputClass(isViewMode, "effective_from")}
                    onKeyDown={handleKeyDown}
                  />
                  {errors.effective_from && (
                    <p style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</p>
                  )}
                </div>
              </div>

              {/* Effective To */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[55px] sm:w-[110px] shrink-0" style={{ color: "#1f2937" }}>
                  Effective To
                </label>
                <div style={{ flex: 1 }}>
                  <ERPDateInput
                    value={localData.effective_to || ""}
                    disabled={isViewMode}
                    minDate={localData.effective_from}
                    onChange={(val) => handleChange("effective_to", val)}
                    className={getInputClass(isViewMode, "effective_to")}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        saveBtnRef={saveBtnRef} saving={saving}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default WeeklyOffMasterForm;
// import React, { useState, useCallback, useEffect, useRef } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import { getActledList, fetchShifts } from "../../../../utils/api";
// import DateInput from "../../../../components/Reusable/input/Date";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// // ── Reusable Multi-Select Employee Dropdown ────────────────────────────────
// const EmployeeMultiSelect = ({ employees, selectedIds, onChange, disabled, error }) => {
//   const [open, setOpen] = useState(false);
//   const [search, setSearch] = useState("");
//   const ref = useRef(null);

//   useEffect(() => {
//     const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   const filtered = employees.filter(e =>
//     e.Led_name?.toLowerCase().includes(search.toLowerCase()) ||
//     e.Led_code?.toLowerCase().includes(search.toLowerCase())
//   );

//   const allSelected = selectedIds.length === employees.length && employees.length > 0;
//   const someSelected = selectedIds.length > 0 && !allSelected;

//   const toggleAll = () => onChange(allSelected ? [] : employees.map(e => e.Actled_id));
//   const toggleOne = (id) => onChange(
//     selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
//   );

//   const label = selectedIds.length === 0
//     ? "Select Employees"
//     : selectedIds.length === employees.length
//       ? `All Employees (${employees.length})`
//       : selectedIds.length <= 10
//   ? selectedIds.map(id => {
//       const emp = employees.find(e => e.Actled_id === id);
//       return emp?.full_name || emp?.Led_name;
//     }).filter(Boolean).join(", ")
//   : `${selectedIds.length} employees selected`;

//   const CheckBox = ({ checked, indeterminate }) => (
//     <div style={{
//       width: 16, height: 16, borderRadius: 4, flexShrink: 0,
//       border: `2px solid ${checked || indeterminate ? "#185FA5" : "#d1d5db"}`,
//       background: checked ? "#185FA5" : "#fff",
//       display: "flex", alignItems: "center", justifyContent: "center",
//     }}>
//       {checked && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
//       {indeterminate && !checked && <span style={{ color: "#185FA5", fontSize: 11, fontWeight: 900 }}>—</span>}
//     </div>
//   );

//   return (
//     <div ref={ref} style={{ position: "relative", width: "100%" }}>
//       <div onClick={() => !disabled && setOpen(p => !p)} style={{
//         minHeight: 32, border: `1px solid ${error ? "#ef4444" : open ? "#3b82f6" : "#d1d5db"}`,
//         borderRadius: 6, padding: "4px 10px", cursor: disabled ? "not-allowed" : "pointer",
//         display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
//         background: disabled ? "#eef1f6" : "#fff", fontFamily: FONT,
//         boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
//       }}>
//         <span style={{
//           fontSize: 13, color: selectedIds.length === 0 ? "#9ca3af" : "#1f2937",
//           fontWeight: selectedIds.length > 0 ? 500 : 400,
//           whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.5, flex: 1,
//         }}>{label}</span>
//         <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
//           style={{ color: "#9ca3af", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
//           <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
//         </svg>
//       </div>

//       {open && (
//         <div style={{
//           position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
//           background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
//           boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280,
//           display: "flex", flexDirection: "column", fontFamily: FONT,
//         }}>
//           <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f2f6" }}>
//             <input autoFocus placeholder="Search employee..." value={search}
//               onChange={e => setSearch(e.target.value)}
//               style={{
//                 width: "100%", height: 28, border: "1px solid #e5e7eb", borderRadius: 6,
//                 padding: "0 8px", fontSize: 12, outline: "none", background: "#f9fafb",
//                 fontFamily: FONT, boxSizing: "border-box",
//               }} />
//           </div>

//           <div onClick={toggleAll} style={{
//             display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
//             cursor: "pointer", borderBottom: "1px solid #f0f2f6",
//             background: allSelected ? "#EAF3DE" : "#fafbff",
//           }}>
//             <CheckBox checked={allSelected} indeterminate={someSelected} />
//             <span style={{ fontSize: 13, fontWeight: 600, color: "#185FA5" }}>
//               Select All ({employees.length})
//             </span>
//           </div>

//           <div style={{ overflowY: "auto", flex: 1 }}>
//             {filtered.length === 0
//               ? <div style={{ padding: 12, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No employees found</div>
//               : filtered.map(emp => {
//                 const checked = selectedIds.includes(emp.Actled_id);
//                 return (
//                   <div key={emp.Actled_id} onClick={() => toggleOne(emp.Actled_id)} style={{
//                     display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
//                     cursor: "pointer", background: checked ? "#f0f6ff" : "#fff",
//                     borderBottom: "0.5px solid #f5f6fa",
//                   }}>
//                     <CheckBox checked={checked} />
//                     <div>
//                       <span style={{ fontSize: 13, color: "#1f2937", fontWeight: checked ? 500 : 400 }}>
//                         {emp.full_name || emp.Led_name}
//                       </span>
//                       <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>{emp.Led_code}</span>
//                     </div>
//                   </div>
//                 );
//               })}
//           </div>

//           <div style={{
//             padding: "6px 12px", borderTop: "1px solid #f0f2f6", background: "#f9fafb",
//             display: "flex", justifyContent: "space-between", alignItems: "center",
//           }}>
//             <span style={{ fontSize: 11, color: "#6b7280" }}>{selectedIds.length} of {employees.length} selected</span>
//             <button onClick={() => setOpen(false)} style={{
//               height: 24, padding: "0 10px", borderRadius: 5, border: "none",
//               background: "#185FA5", color: "#E6F1FB", fontSize: 11, fontWeight: 600, cursor: "pointer",
//             }}>Done</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ── Main Form ──────────────────────────────────────────────────────────────
// const ShiftAllocationForm = ({
//   mode = "view",
//   onSave, onCancel, onDelete, onEditCancel,
//   saving, onModify, onNewEntry,
//   currentRecord, totalRecords, rights,
//   activeTab = "entry", onTabChange,
//   initialData = {}, localData, setLocalData,
//   onPrevRecord, onNextRecord,
// }) => {
//   const [errors, setErrors] = useState({});
//   const [employees, setEmployees] = useState([]);
//   const [shifts, setShifts] = useState([]);
//   const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";
//   const isAddMode = mode === "add";

//   useEffect(() => {
//     (async () => {
//       try {
//         const [empData, shiftData] = await Promise.all([getActledList(), fetchShifts()]);
//         const empList = Array.isArray(empData) ? empData : empData?.data || [];
//         setEmployees(empList);
//         setShifts(Array.isArray(shiftData) ? shiftData : shiftData?.data || []);
//       } catch (err) { console.error(err); }
//     })();
//   }, []);

//   useEffect(() => {
//     if (!initialData?.allocation_id && !initialData?.employee_id) return;
//     setLocalData({
//       ...initialData,
//       allocation_from: initialData.allocation_from ? initialData.allocation_from.split("T")[0] : "",
//       allocation_to: initialData.allocation_to ? initialData.allocation_to.split("T")[0] : "",
//     });
//     if (initialData.employee_id) setSelectedEmployeeIds([Number(initialData.employee_id)]);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [initialData?.allocation_id, initialData?.employee_id, employees.length, shifts.length]);

//   useEffect(() => { if (isAddMode) setSelectedEmployeeIds([]); }, [isAddMode]);

//   const handleChange = (field, value) => {
//     let u = { ...localData };
//     if (field === "shift_name") {
//       const sh = shifts.find(s => s.shift_name?.trim() === value?.trim());
//       u.shift_name = value;
//       u.shift_id = sh ? sh.shift_id : null;
//     } else {
//       u[field] = value;
//     }
//     setLocalData(u);
//     setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
//   };

//   const getInputClass = (dis, field) =>
//     `w-full h-[30px] px-2 text-[16px] border rounded-md outline-none transition-colors
//     ${errors[field] ? "border-red-500" : "border-gray-300"}
//     ${dis ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     const errs = {};
//     if (!selectedEmployeeIds.length) errs.employee_ids = "Please select at least one employee";
//     if (!localData.shift_id) errs.shift_id = "Required";
//     if (!localData.allocation_from) errs.allocation_from = "Required";
//     if (!localData.allocation_to) errs.allocation_to = "Required";

//     if (Object.keys(errs).length) { setErrors(errs); return; }

//     onSave?.({ ...localData, employee_ids: selectedEmployeeIds, employee_id: selectedEmployeeIds[0] });
//   }, [localData, selectedEmployeeIds, onSave, isViewMode]);

//   const handleKeyDown = useCallback((e) => {
//     if (isViewMode) return;
//     const container = document.getElementById("allocation-form-container");
//     if (!container) return;
//     const els = Array.from(container.querySelectorAll("input:not([disabled]),select:not([disabled]),textarea:not([disabled])"));
//     const idx = els.indexOf(e.target);
//     if (e.key === "Enter") {
//       e.preventDefault();
//       if (idx < els.length - 1) els[idx + 1].focus();
//     }
//     if (e.shiftKey && e.key === "Backspace" && idx > 0) { e.preventDefault(); els[idx - 1].focus(); }
//   }, [isViewMode]);

//   return (
//     <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden"
//       style={{ fontFamily: FONT }}>
//       <ERPHeader
//         title="Employee Shift Allocations"
//         isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
//         activeTab={activeTab} onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//         currentIndex={currentRecord} totalRecords={totalRecords}
//         onPrevRecord={onPrevRecord} onNextRecord={onNextRecord}
//       />

//       <div className="flex-1 p-4 overflow-y-auto flex justify-center">
//         <div id="allocation-form-container"
//           className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md">
//           <div className="p-4 flex flex-col gap-4">

//             {/* Row 1 — Employee + Shift */}
//             <div className="flex gap-4">
//               {/* Employee multi-select */}
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
//                   {errors.employee_ids && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.employee_ids}</p>}

//                 </div>
//               </div>

//               {/* Shift */}
//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 110, flexShrink: 0 }}>
//                   Assign Shift <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <ERPAutocomplete
//                     options={shifts.map(s => s.shift_name?.trim())}
//                     value={localData.shift_name || ""}
//                     disabled={isViewMode}
//                     onChange={val => handleChange("shift_name", val)}
//                     onKeyDown={handleKeyDown}
//                     className={getInputClass(isViewMode, "shift_id")}
//                   />
//                   {errors.shift_id && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Row 2 — From + To Date */}
//             <div className="flex gap-4">
//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 120, flexShrink: 0 }}>
//                   From Date <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <DateInput
//                     value={localData.allocation_from || ""}
//                     disabled={isViewMode}
//                     onChange={val => handleChange("allocation_from", val)}
//                     onKeyDown={handleKeyDown}
//                     className={getInputClass(isViewMode, "allocation_from")}
//                   />
//                   {errors.allocation_from && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
//                 </div>
//               </div>

//               <div className="flex items-center gap-2 flex-1">
//                 <label style={{ fontSize: 15, color: "#1f2937", width: 110, flexShrink: 0 }}>
//                   To Date <span style={{ color: "#ef4444" }}>*</span>
//                 </label>
//                 <div style={{ flex: 1 }}>
//                   <DateInput
//                     value={localData.allocation_to || ""}
//                     disabled={isViewMode}
//                     minDate={localData.allocation_from}
//                     onChange={val => handleChange("allocation_to", val)}
//                     onKeyDown={handleKeyDown}
//                     className={getInputClass(isViewMode, "allocation_to")}
//                   />
//                   {errors.allocation_to && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Row 3 — Remarks */}
//             <div className="flex items-start gap-2">
//               <label style={{ fontSize: 15, color: "#1f2937", width: 120, paddingTop: 4, flexShrink: 0 }}>Remarks</label>
//               <textarea
//                 value={localData.remarks || ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("remarks", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Enter remarks"
//                 className={`${getInputClass(isViewMode, "remarks")} h-[40px] py-2`}
//                 style={{ flex: 1, resize: "none" }}
//               />
//             </div>


//           </div>
//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
//         saving={saving} handleSubmit={handleValidateAndSave}
//         onModify={onModify} onDelete={() => onDelete?.(localData)}
//         onCancel={onCancel} onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry} rights={rights}
//       />
//     </div>
//   );
// };

// export default ShiftAllocationForm;
import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, fetchShifts } from "../../../../utils/api";
import DateInput from "../../../../components/Reusable/input/Date";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// ── Reusable Multi-Select Employee Dropdown ────────────────────────────────
const EmployeeMultiSelect = ({ employees, selectedIds, onChange, disabled, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = employees.filter(e =>
    e.Led_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.Led_code?.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = selectedIds.length === employees.length && employees.length > 0;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => onChange(allSelected ? [] : employees.map(e => e.Actled_id));
  const toggleOne = (id) => onChange(
    selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
  );

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

  const CheckBox = ({ checked, indeterminate }) => (
    <div style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      border: `2px solid ${checked || indeterminate ? "#185FA5" : "#d1d5db"}`,
      background: checked ? "#185FA5" : "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {checked && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      {indeterminate && !checked && <span style={{ color: "#185FA5", fontSize: 11, fontWeight: 900 }}>—</span>}
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => !disabled && setOpen(p => !p)} style={{
        minHeight: 32, border: `1px solid ${error ? "#ef4444" : open ? "#3b82f6" : "#d1d5db"}`,
        borderRadius: 6, padding: "4px 10px", cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        background: disabled ? "#eef1f6" : "#fff", fontFamily: FONT,
        boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
      }}>
        <span style={{
          fontSize: 13, color: selectedIds.length === 0 ? "#9ca3af" : "#1f2937",
          fontWeight: selectedIds.length > 0 ? 500 : 400,
          whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.5, flex: 1,
        }}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
          style={{ color: "#9ca3af", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280,
          display: "flex", flexDirection: "column", fontFamily: FONT,
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f2f6" }}>
            <input autoFocus placeholder="Search employee..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", height: 28, border: "1px solid #e5e7eb", borderRadius: 6,
                padding: "0 8px", fontSize: 12, outline: "none", background: "#f9fafb",
                fontFamily: FONT, boxSizing: "border-box",
              }} />
          </div>

          <div onClick={toggleAll} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            cursor: "pointer", borderBottom: "1px solid #f0f2f6",
            background: allSelected ? "#EAF3DE" : "#fafbff",
          }}>
            <CheckBox checked={allSelected} indeterminate={someSelected} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#185FA5" }}>
              Select All ({employees.length})
            </span>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0
              ? <div style={{ padding: 12, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No employees found</div>
              : filtered.map(emp => {
                const checked = selectedIds.includes(emp.Actled_id);
                return (
                  <div key={emp.Actled_id} onClick={() => toggleOne(emp.Actled_id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
                    cursor: "pointer", background: checked ? "#f0f6ff" : "#fff",
                    borderBottom: "0.5px solid #f5f6fa",
                  }}>
                    <CheckBox checked={checked} />
                    <div>
                      <span style={{ fontSize: 13, color: "#1f2937", fontWeight: checked ? 500 : 400 }}>
                        {emp.full_name || emp.Led_name}
                      </span>
                      <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>{emp.Led_code}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div style={{
            padding: "6px 12px", borderTop: "1px solid #f0f2f6", background: "#f9fafb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{selectedIds.length} of {employees.length} selected</span>
            <button onClick={() => setOpen(false)} style={{
              height: 24, padding: "0 10px", borderRadius: 5, border: "none",
              background: "#185FA5", color: "#E6F1FB", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Form ──────────────────────────────────────────────────────────────
const ShiftAllocationForm = ({
  mode = "view",
  onSave, onCancel, onDelete, onEditCancel,
  saving, onModify, onNewEntry,
  currentRecord, totalRecords, rights,
  activeTab = "entry", onTabChange,
  initialData = {}, localData, setLocalData,
  onPrevRecord, onNextRecord,
}) => {
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  useEffect(() => {
    (async () => {
      try {
        const [empData, shiftData] = await Promise.all([getActledList(), fetchShifts()]);
        const empList = Array.isArray(empData) ? empData : empData?.data || [];
        setEmployees(empList);
        setShifts(Array.isArray(shiftData) ? shiftData : shiftData?.data || []);
      } catch (err) { console.error(err); }
    })();
  }, []);

  useEffect(() => {
    if (!initialData?.allocation_id && !initialData?.employee_id) return;
    setLocalData({
      ...initialData,
      allocation_from: initialData.allocation_from ? initialData.allocation_from.split("T")[0] : "",
      allocation_to: initialData.allocation_to ? initialData.allocation_to.split("T")[0] : "",
    });
    if (initialData.employee_id) setSelectedEmployeeIds([Number(initialData.employee_id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.allocation_id, initialData?.employee_id, employees.length, shifts.length]);

  useEffect(() => { if (isAddMode) setSelectedEmployeeIds([]); }, [isAddMode]);

  const handleChange = (field, value) => {
    let u = { ...localData };
    if (field === "shift_name") {
      const sh = shifts.find(s => s.shift_name?.trim() === value?.trim());
      u.shift_name = value;
      u.shift_id = sh ? sh.shift_id : null;
    } else {
      u[field] = value;
    }
    setLocalData(u);
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const getInputClass = (dis, field) =>
    `w-full h-[30px] px-2 text-[16px] border rounded-md outline-none transition-colors
    ${errors[field] ? "border-red-500" : "border-gray-300"}
    ${dis ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const errs = {};
    if (!selectedEmployeeIds.length) errs.employee_ids = "Please select at least one employee";
    if (!localData.shift_id) errs.shift_id = "Required";
    if (!localData.allocation_from) errs.allocation_from = "Required";
    if (!localData.allocation_to) errs.allocation_to = "Required";

    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave?.({ ...localData, employee_ids: selectedEmployeeIds, employee_id: selectedEmployeeIds[0] });
  }, [localData, selectedEmployeeIds, onSave, isViewMode]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("allocation-form-container");
    if (!container) return;
    const els = Array.from(container.querySelectorAll("input:not([disabled]),select:not([disabled]),textarea:not([disabled])"));
    const idx = els.indexOf(e.target);
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx < els.length - 1) els[idx + 1].focus();
    }
    if (e.shiftKey && e.key === "Backspace" && idx > 0) { e.preventDefault(); els[idx - 1].focus(); }
  }, [isViewMode]);

  return (
    <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ fontFamily: FONT }}>
      <ERPHeader
        title="Employee Shift Allocations"
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        activeTab={activeTab} onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord} totalRecords={totalRecords}
        onPrevRecord={onPrevRecord} onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div id="allocation-form-container"
          className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md">
          <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">

            {/* Row 1 — Employee + Shift */}
            <div className="flex gap-2 sm:gap-4">
              {/* Employee multi-select */}
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
                  {errors.employee_ids && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.employee_ids}</p>}

                </div>
              </div>

              {/* Shift */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[60px] sm:w-[110px] shrink-0" style={{ color: "#1f2937" }}>
                  Assign Shift <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <ERPAutocomplete
                    options={shifts.map(s => s.shift_name?.trim())}
                    value={localData.shift_name || ""}
                    disabled={isViewMode}
                    onChange={val => handleChange("shift_name", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "shift_id")}
                  />
                  {errors.shift_id && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
                </div>
              </div>
            </div>

            {/* Row 2 — From + To Date */}
            <div className="flex gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[120px] shrink-0" style={{ color: "#1f2937" }}>
                  From Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <DateInput
                    value={localData.allocation_from || ""}
                    disabled={isViewMode}
                    onChange={val => handleChange("allocation_from", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "allocation_from")}
                  />
                  {errors.allocation_from && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <label className="text-[13px] sm:text-[15px] w-[55px] sm:w-[110px] shrink-0" style={{ color: "#1f2937" }}>
                  To Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ flex: 1 }}>
                  <DateInput
                    value={localData.allocation_to || ""}
                    disabled={isViewMode}
                    minDate={localData.allocation_from}
                    onChange={val => handleChange("allocation_to", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "allocation_to")}
                  />
                  {errors.allocation_to && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Required</p>}
                </div>
              </div>
            </div>

            {/* Row 3 — Remarks */}
            <div className="flex items-start gap-1.5 sm:gap-2">
              <label className="text-[13px] sm:text-[15px] w-[70px] sm:w-[120px] shrink-0" style={{ color: "#1f2937", paddingTop: 4 }}>Remarks</label>
              <textarea
                value={localData.remarks || ""}
                disabled={isViewMode}
                onChange={e => handleChange("remarks", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter remarks"
                className={`${getInputClass(isViewMode, "remarks")} h-[40px] py-2`}
                style={{ flex: 1, resize: "none" }}
              />
            </div>


          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        saving={saving} handleSubmit={handleValidateAndSave}
        onModify={onModify} onDelete={() => onDelete?.(localData)}
        onCancel={onCancel} onEditCancel={onEditCancel}
        onNewEntry={onNewEntry} rights={rights}
      />
    </div>
  );
};

export default ShiftAllocationForm;
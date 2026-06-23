// import React, { useState, useCallback, useEffect } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../components/Reusable/input/Date";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const STATE_OPTIONS = [
//   "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
//   "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
//   "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
//   "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
//   "Uttar Pradesh", "Uttarakhand", "West Bengal",
// ];

// const FREQUENCY_OPTIONS = ["Monthly", "HalfYearly", "Annual"];

// // HalfYearly ke liye Jun+Dec, Annual ke liye Dec — helper
// const FREQUENCY_MONTH_HINTS = {
//   Monthly:     "Har mahine",
//   HalfYearly:  "Jun, Dec",
//   Annual:      "Dec",
// };

// const LWFMasterForm = ({
//   mode = "view",
//   onSave,
//   formData,
//   setFormData,
//   onCancel,
//   onDelete,
//   onEditCancel,
//   saving,
//   onModify,
//   onNewEntry,
//   currentRecord,
//   totalRecords,
//   rights,
//   activeTab = "entry",
//   onTabChange = () => {},
//   initialData = {},
// }) => {
//   const [errors, setErrors]     = useState({});

//   const isViewMode = mode === "view";
//   const isAddMode  = mode === "add";
//   const isEditMode = mode === "edit";

//   const requiredFields = ["name", "state_code", "employee_rate", "employer_rate", "frequency"];

//   useEffect(() => { setFormData(initialData); }, [initialData]);

//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const firstInput = document.querySelector("#lwf-form-container input:not([disabled])");
//         if (firstInput) firstInput.focus();
//       }, 150);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
//     }
//   };

//   // Frequency change hone pe deduction_months auto-suggest
//   const handleFrequencyChange = (val) => {
//     handleChange("frequency", val);
//     if (val === "HalfYearly") handleChange("deduction_months", "Jun,Dec");
//     else if (val === "Annual") handleChange("deduction_months", "Dec");
//     else handleChange("deduction_months", "");
//   };
// const getInputClass = (isDisabled, fieldName) =>
//     [
//       "h-[30px] px-2 text-[15px]",
//       "border rounded-md outline-none transition-colors",
//       errors[fieldName] ? "border-red-500" : "border-gray-300",
//       isDisabled
//         ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
//         : "bg-white text-gray-900 focus:border-blue-300 focus:ring-1 focus:ring-blue-500",
//     ].join(" ");
//   // const getInputClass = (disabled, field) =>
//   //   `h-[30px] px-2 text-[15px] border rounded-md ${
//   //     errors[field] ? "border-red-500" : "border-gray-300"
//   //   } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     let newErrors = {};
//     let firstEmpty = null;
//     requiredFields.forEach(field => {
//       if (!formData[field] && formData[field] !== 0) {
//         newErrors[field] = "Required";
//         if (!firstEmpty) firstEmpty = field;
//       }
//     });
//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       setTimeout(() => {
//         const el = document.querySelector(`[name="${firstEmpty}"]`);
//         if (el) el.focus();
//       }, 50);
//       return;
//     }
//     onSave && onSave(formData);
//   }, [formData, isViewMode, onSave]);

//   const handleKeyDown = useCallback((e) => {
//     if (isViewMode) return;
//     const container = document.getElementById("lwf-form-container");
//     if (!container) return;

//     const elements = Array.from(
//       container.querySelectorAll("[data-auto], input, textarea, select, button")
//     )
//     .filter(el => !el.disabled && el.offsetParent !== null)
//     .sort((a, b) => {
//       const aRect = a.getBoundingClientRect();
//       const bRect = b.getBoundingClientRect();
//       if (Math.abs(aRect.top - bRect.top) > 5) return aRect.top - bRect.top;
//       return aRect.left - bRect.left;
//     });

//     const index = elements.indexOf(e.target);

//     if (e.key === "Enter") {
//       e.preventDefault();
//       e.stopPropagation();
//       if (index < elements.length - 1) {
//         elements[index + 1].focus();
//       } else {
//         const saveBtn = document.querySelector("#save");
//         if (saveBtn) saveBtn.focus();
//       }
//     }

//     if (e.key === "Backspace") {
//       const el = e.target;
//       const isText = el.tagName === "INPUT" && ["text", "number", "search"].includes(el.type);
//       let shouldGoBack = false;
//       if (isText) {
//         const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
//         if (el.value === "" || atStart) shouldGoBack = true;
//       }
//       if (shouldGoBack && index > 0) {
//         e.preventDefault();
//         let prev = index - 1;
//         while (prev >= 0) {
//           const prevEl = elements[prev];
//           if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
//             prevEl.focus();
//             if (prevEl.tagName === "INPUT" && typeof prevEl.setSelectionRange === "function") {
//               const len = prevEl.value?.length || 0;
//               try { prevEl.setSelectionRange(len, len); } catch {}
//             }
//             break;
//           }
//           prev--;
//         }
//       }
//     }

//     if (e.key === " " && e.target.dataset.toggle === "status") {
//       e.preventDefault();
//       handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
//     }
//   }, [isViewMode, formData]);

//   return (
//     <div
//       className="w-full max-w-[700px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="LABOUR WELFARE FUND MASTER"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
//         <div
//           id="lwf-form-container"
//           className="w-full bg-white border rounded-md p-4 flex flex-col gap-4"
//         >

//           {/* Row 1 — Name + State */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="name"
//                 value={formData.name || ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("name", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. LWF Maharashtra"
//                 className={`${getInputClass(isViewMode, "name")} flex-1`}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 State <span className="text-red-500">*</span>
//               </label>
//               <ERPAutocomplete
//                 data-auto
//                 options={STATE_OPTIONS}
//                 value={formData.state_code || ""}
//                 onChange={val => handleChange("state_code", val)}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "state_code")} flex-1`}
//               />
//             </div>
//           </div>

//           {/* Row 2 — Employee Contribution + Employer Contribution */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 Employee (₹) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="employee_rate"
//                 type="number"
//                 min="0"
//                 value={formData.employee_rate ?? ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("employee_rate", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. 6"
//                 className={`${getInputClass(isViewMode, "employee_rate")} w-[170px]`}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 Employer (₹) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="employer_rate"
//                 type="number"
//                 min="0"
//                 value={formData.employer_rate ?? ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("employer_rate", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. 12"
//                 className={`${getInputClass(isViewMode, "employer_rate")} w-[170px]`}
//               />
//             </div>
//           </div>

//           {/* Row 3 — Frequency + Deduction Months */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 Frequency <span className="text-red-500">*</span>
//               </label>
//               <ERPAutocomplete
//                 data-auto
//                 options={FREQUENCY_OPTIONS}
//                 value={formData.frequency || "Monthly"}
//                 onChange={handleFrequencyChange}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "frequency")} w-[170px]`}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">Deduction Months</label>
//               <input
//                 name="deduction_months"
//                 type="text"
//                 value={formData.deduction_months || ""}
//                 disabled={isViewMode || formData.frequency === "Monthly"}
//                 onChange={e => handleChange("deduction_months", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder={FREQUENCY_MONTH_HINTS[formData.frequency] || "e.g. Jun,Dec"}
//                 className={`${getInputClass(
//                   isViewMode || formData.frequency === "Monthly",
//                   "deduction_months"
//                 )} w-[170px]`}
//               />
//             </div>
//           </div>

//           {/* Row 4 — Applicable From + Status */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">Applicable From</label>
//               <ERPDateInput
//                 value={formData.applicable_from || ""}
//                 disabled={isViewMode}
//                 onChange={value => handleChange("applicable_from", value)}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "applicable_from")} flex-1`}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">Status</label>
//               <div
//                 tabIndex={0}
//                 data-auto
//                 data-toggle="status"
//                 onKeyDown={handleKeyDown}
//                 onClick={() =>
//                   !isViewMode &&
//                   handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
//                 }
//                 className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
//                   formData.status === "Active" ? "bg-green-500" : "bg-gray-400"
//                 }`}
//               >
//                 <div className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
//                   formData.status === "Active" ? "translate-x-[20px]" : ""
//                 }`} />
//               </div>
//               <span className="ml-[12px] text-sm">{formData.status || "Active"}</span>
//             </div>
//           </div>

//           {/* Info box */}
//           <div className="flex items-center gap-3">
//             <label className="w-[150px] text-gray-400 text-[12px]">LWF info</label>
//             <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1">
//               {formData.state_code || "State"} — Employee ₹{formData.employee_rate || 0} + Employer ₹{formData.employer_rate || 0}
//               {" "}= Total ₹{(parseFloat(formData.employee_rate) || 0) + (parseFloat(formData.employer_rate) || 0)}
//               {" "}| {formData.frequency || "Monthly"}
//               {formData.deduction_months ? ` (${formData.deduction_months})` : ""}
//             </div>
//           </div>

//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         saving={saving}
//         handleSubmit={handleValidateAndSave}
//         onModify={onModify}
//         onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default LWFMasterForm;

import React, { useState, useCallback, useEffect,useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const STATE_OPTIONS = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const FREQUENCY_OPTIONS = ["Monthly", "HalfYearly", "Annual"];

const FREQUENCY_MONTH_HINTS = {
  Monthly:     "Har mahine",
  HalfYearly:  "Jun, Dec",
  Annual:      "Dec",
};

const LWFMasterForm = ({
  mode = "view",
  onSave,
  formData,
  setFormData,
  onCancel,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  rights,
  activeTab = "entry",
  onTabChange = () => {},
  initialData = {},
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode  = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = ["name", "state_code", "employee_rate", "employer_rate", "frequency"];

  useEffect(() => { setFormData(initialData); }, [initialData]);
 const saveBtnRef=useRef(null)
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput = document.querySelector("#lwf-form-container input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const handleFrequencyChange = (val) => {
    handleChange("frequency", val);
    if (val === "HalfYearly") handleChange("deduction_months", "Jun,Dec");
    else if (val === "Annual") handleChange("deduction_months", "Dec");
    else handleChange("deduction_months", "");
  };

  const getInputClass = (isDisabled, fieldName) =>
    [
      "h-[30px] px-2 text-[15px]",
      "border rounded-md outline-none transition-colors",
      errors[fieldName] ? "border-red-500" : "border-gray-300",
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-300 focus:ring-1 focus:ring-blue-500",
    ].join(" ");

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    let firstEmpty = null;
    requiredFields.forEach(field => {
      if (!formData[field] && formData[field] !== 0) {
        newErrors[field] = "Required";
        if (!firstEmpty) firstEmpty = field;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstEmpty}"]`);
        if (el) el.focus();
      }, 50);
      return;
    }
    onSave && onSave(formData);
  }, [formData, isViewMode, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("lwf-form-container");
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll("[data-auto], input, textarea, select, button")
    )
    .filter(el => !el.disabled && el.offsetParent !== null)
    .sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      if (Math.abs(aRect.top - bRect.top) > 5) return aRect.top - bRect.top;
      return aRect.left - bRect.left;
    });

    const index = elements.indexOf(e.target);

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        saveBtnRef?.current?.focus();
      }
    }

    // ✅ FIX 1: Backspace on status toggle → seedha pichle element pe jao
    if (e.key === "Backspace") {
      const el = e.target;
      const isText = el.tagName === "INPUT" && ["text", "number", "search"].includes(el.type);
      const isToggle = el.dataset?.toggle === "status"; // ✅ status div check

      let shouldGoBack = false;

      if (isToggle) {
        shouldGoBack = true; // ✅ status pe Backspace → hamesha back
      } else if (isText) {
        const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
        if (el.value === "" || atStart) shouldGoBack = true;
      }

      if (shouldGoBack && index > 0) {
        e.preventDefault();
        let prev = index - 1;
        while (prev >= 0) {
          const prevEl = elements[prev];
          if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
            prevEl.focus();
            if (prevEl.tagName === "INPUT" && typeof prevEl.setSelectionRange === "function") {
              const len = prevEl.value?.length || 0;
              try { prevEl.setSelectionRange(len, len); } catch {}
            }
            break;
          }
          prev--;
        }
      }
    }

    if (e.key === " " && e.target.dataset.toggle === "status") {
      e.preventDefault();
      handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
    }
  }, [isViewMode, formData]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="LABOUR WELFARE FUND MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
        <div
          id="lwf-form-container"
          className="w-full bg-white border rounded-md p-4 flex flex-col gap-4"
        >

          {/* Row 1 — Name + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name || ""}
                disabled={isViewMode}
                onChange={e => handleChange("name", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. LWF Maharashtra"
                className={`${getInputClass(isViewMode, "name")} flex-1`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                State <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                options={STATE_OPTIONS}
                value={formData.state_code || ""}
                onChange={val => handleChange("state_code", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "state_code")} flex-1`}
              />
            </div>
          </div>

          {/* Row 2 — Employee Contribution + Employer Contribution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                Employee (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="employee_rate"
                type="number"
                min="0"
                value={formData.employee_rate ?? ""}
                disabled={isViewMode}
                onChange={e => handleChange("employee_rate", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 6"
                className={`${getInputClass(isViewMode, "employee_rate")} w-[170px]`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                Employer (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="employer_rate"
                type="number"
                min="0"
                value={formData.employer_rate ?? ""}
                disabled={isViewMode}
                onChange={e => handleChange("employer_rate", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 12"
                className={`${getInputClass(isViewMode, "employer_rate")} w-[170px]`}
              />
            </div>
          </div>

          {/* Row 3 — Frequency + Deduction Months */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                Frequency <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                options={FREQUENCY_OPTIONS}
                value={formData.frequency || ""}
                onChange={handleFrequencyChange}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "frequency")} w-[170px]`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[150px]">Deduction Months</label>
              <input
                name="deduction_months"
                type="text"
                value={formData.deduction_months || ""}
                disabled={isViewMode || formData.frequency === "Monthly"}
                onChange={e => handleChange("deduction_months", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={FREQUENCY_MONTH_HINTS[formData.frequency] || "e.g. Jun,Dec"}
                className={`${getInputClass(
                  isViewMode || formData.frequency === "Monthly",
                  "deduction_months"
                )} w-[170px]`}
              />
            </div>
          </div>

          {/* Row 4 — Applicable From + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">Applicable From</label>
              <ERPDateInput
                value={formData.applicable_from || ""}
                disabled={isViewMode}
                onChange={value => handleChange("applicable_from", value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "applicable_from")} flex-1`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[150px]">Status</label>

              {/* ✅ FIX 2: blue focus ring, outline-none, view mode mein tabIndex -1 */}
              <div
                tabIndex={isViewMode ? -1 : 0}
                data-auto
                data-toggle="status"
                onKeyDown={handleKeyDown}
                onClick={() =>
                  !isViewMode &&
                  handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
                }
                className={[
                  "w-[42px] h-[22px] flex items-center rounded-full p-[2px] transition-colors",
                  "outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
                  isViewMode ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  formData.status === "Active" ? "bg-green-500" : "bg-gray-400",
                ].join(" ")}
              >
                <div className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                  formData.status === "Active" ? "translate-x-[20px]" : ""
                }`} />
              </div>
              <span className="ml-[12px] text-sm text-gray-700">
                {formData.status || "Active"}
              </span>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-center gap-3">
            <label className="w-[150px] text-gray-400 text-[12px]">LWF info</label>
            <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1">
              {formData.state_code || "State"} — Employee ₹{formData.employee_rate || 0} + Employer ₹{formData.employer_rate || 0}
              {" "}= Total ₹{(parseFloat(formData.employee_rate) || 0) + (parseFloat(formData.employer_rate) || 0)}
              {" "}| {formData.frequency || "Monthly"}
              {formData.deduction_months ? ` (${formData.deduction_months})` : ""}
            </div>
          </div>

        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        saveBtnRef={saveBtnRef}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default LWFMasterForm;
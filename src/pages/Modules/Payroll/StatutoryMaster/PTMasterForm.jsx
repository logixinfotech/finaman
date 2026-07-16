// import React, { useState, useCallback, useEffect } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../components/Reusable/input/Date";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// // Indian states list
// const STATE_OPTIONS = [
//   "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
//   "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
//   "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
//   "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
//   "Uttar Pradesh", "Uttarakhand", "West Bengal",
// ];

// const PTMasterForm = ({
//   mode = "view",
//   formData,
//   setFormData,
//   onSave,
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

//   const requiredFields = ["name", "state_code", "fixed_amount"];

//   useEffect(() => { setFormData(initialData); }, [initialData]);

//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const firstInput = document.querySelector("#pt-form-container input:not([disabled])");
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

//   const getInputClass = (disabled, field) =>
//     `h-[30px] px-2 text-[15px] border rounded-md ${
//       errors[field] ? "border-red-500" : "border-gray-300"
//     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

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
//     const container = document.getElementById("pt-form-container");
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
//         const saveBtn = document.querySelector("[save]");
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
//         title="PROFESSIONAL TAX MASTER"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
//         <div
//           id="pt-form-container"
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
//                 placeholder="e.g. PT Maharashtra"
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

//           {/* Row 2 — Salary From + Salary To */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">Salary From (₹)</label>
//               <input
//                 name="salary_from"
//                 type="number"
//                 min="0"
//                 value={formData.salary_from ?? ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("salary_from", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. 0"
//                 className={`${getInputClass(isViewMode, "salary_from")} w-[170px]`}
//               />
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">Salary To (₹)</label>
//               <input
//                 name="salary_to"
//                 type="number"
//                 min="0"
//                 value={formData.salary_to ?? ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("salary_to", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. 10000"
//                 className={`${getInputClass(isViewMode, "salary_to")} w-[170px]`}
//               />
//             </div>
//           </div>

//           {/* Row 3 — PT Amount + Applicable From */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[150px]">
//                 PT Amount (₹) <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="fixed_amount"
//                 type="number"
//                 min="0"
//                 value={formData.fixed_amount ?? ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("fixed_amount", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="e.g. 200"
//                 className={`${getInputClass(isViewMode, "fixed_amount")} w-[170px]`}
//               />
//             </div>

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
//           </div>

//           {/* Row 4 — Status + Info */}
//           <div className="grid grid-cols-2 gap-4">
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

//             {/* Info box */}
//             <div className="flex items-center gap-3">
//               <label className="w-[150px] text-gray-400 text-[12px]">PT info</label>
//               <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1">
//                 {formData.state_code || "State"} — Salary ₹{formData.salary_from || 0}
//                 {" "}to ₹{formData.salary_to || "∞"} → PT ₹{formData.fixed_amount || 0}/month
//               </div>
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

// export default PTMasterForm;
import React, { useState, useCallback, useEffect, useRef } from "react";
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

const PTMasterForm = ({
  mode = "view",
  formData,
  setFormData,
  onSave,
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
  initialData = {},onPrevRecord,onNextRecord
}) => {
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const savebtnRef=useRef(null)
  const isViewMode = mode === "view";
  const isAddMode  = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = ["name", "state_code", "fixed_amount"];

  useEffect(() => { setFormData(initialData); }, [initialData]);

  useEffect(() => {
    if ((isAddMode || isEditMode) && formRef.current) {
      setTimeout(() => {
        const firstInput = formRef.current.querySelector("input:not([disabled])");
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

  // ✅ FIXED: Added 'outline-none' and explicit blue focus rings to override browser defaults
  const getInputClass = (disabled, field) =>
    `h-[30px] px-2 text-[15px] border rounded-md outline-none transition-all ${
      errors[field] ? "border-red-500 animate-pulse" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

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
        if (formRef.current) {
          const targetEl = formRef.current.querySelector(`.field-${firstEmpty}`);
          if (targetEl) {
            if (targetEl.tagName !== "INPUT" && targetEl.tagName !== "SELECT" && targetEl.tagName !== "TEXTAREA") {
              const innerInput = targetEl.querySelector("input, select, textarea, [tabindex='0']");
              if (innerInput) {
                innerInput.focus();
                if (typeof innerInput.select === "function") innerInput.select();
              }
            } else {
              targetEl.focus();
              if (typeof targetEl.select === "function") targetEl.select();
            }
          }
        }
      }, 50);
      return;
    }
    onSave && onSave(formData);
  }, [formData, isViewMode, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = formRef.current;
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll("[data-auto], input, textarea, select, [tabindex='0']")
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
        savebtnRef?.current?.focus();
      }
    }

    if (e.shiftKey&&e.key === "Backspace") {
      const el = e.target;
      let shouldGoBack = true;
      const isText = el.tagName === "INPUT" && ["text", "number", "search"].includes(el.type);
      
      if (isText) {
        let atStart = false;
        try {
          if (typeof el.selectionStart === "number") {
            atStart = el.selectionStart === 0 && el.selectionEnd === 0;
          }
        } catch (err) {
          atStart = el.value === "";
        }
        if (el.value === "" || atStart) shouldGoBack = true;
      } 
      else if (el.dataset.toggle === "status" || el.dataset.auto !== undefined || el.getAttribute('tabindex') === '0') {
        shouldGoBack = true;
      }

      if (shouldGoBack ) {
        e.preventDefault();
        let prev = index - 1;
        while (prev >= 0) {
          const prevEl = elements[prev];
          if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
            prevEl.focus();
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
      className="w-full  h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Proffesional Tax Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
          currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
        <div
          ref={formRef}
          id="pt-form-container"
          className="w-full bg-white border max-w-[750px] mx-auto rounded-md p-4 flex flex-col gap-4"
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
                placeholder="e.g. PT Maharashtra"
                className={`${getInputClass(isViewMode, "name")} field-name flex-1 max-w-[170px]`}
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
                className={`${getInputClass(isViewMode, "state_code")} field-state_code flex-1`}
              />
            </div>
          </div>

          {/* Row 2 — Salary From + Salary To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">Salary From (₹)</label>
              <input
                name="salary_from"
                type="number"
                min="0"
                value={formData.salary_from ?? ""}
                disabled={isViewMode}
                onChange={e => handleChange("salary_from", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 0"
                className={`${getInputClass(isViewMode, "salary_from")} field-salary_from w-[170px]`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[145px]">Salary To (₹)</label>
              <input
                name="salary_to"
                type="number"
                min="0"
                value={formData.salary_to ?? ""}
                disabled={isViewMode}
                onChange={e => handleChange("salary_to", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 10000"
                className={`${getInputClass(isViewMode, "salary_to")} field-salary_to max-w-[190px]`}
              />
            </div>
          </div>

          {/* Row 3 — PT Amount + Applicable From */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">
                PT Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="fixed_amount"
                type="number"
                min="0"
                value={formData.fixed_amount ?? ""}
                disabled={isViewMode}
                onChange={e => handleChange("fixed_amount", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 200"
                className={`${getInputClass(isViewMode, "fixed_amount")} field-fixed_amount w-[170px]`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[260px]">Applicable From</label>
              <ERPDateInput
                value={formData.applicable_from || ""}
                disabled={isViewMode}
                onChange={value => handleChange("applicable_from", value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "applicable_from")} max-w-[190px] field-applicable_from flex-1`}
              />
            </div>
          </div>

          {/* Row 4 — Status + Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[150px]">Status</label>
              <div
                tabIndex={0}
                data-auto
                data-toggle="status"
                onKeyDown={handleKeyDown}
                onClick={() =>
                  !isViewMode &&
                  handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
                }
                className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 ${
                  formData.status === "Active" ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                  formData.status === "Active" ? "translate-x-[20px]" : ""
                }`} />
              </div>
              <span className="ml-[12px] text-sm">{formData.status || "Active"}</span>
            </div>

            {/* Info box */}
            <div className="flex items-center gap-3">
              <label className="w-[150px] text-gray-400 text-[12px]">PT info</label>
              <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1">
                {formData.state_code || "State"} — Salary ₹{formData.salary_from || 0}
                {" "}to ₹{formData.salary_to || "∞"} → PT ₹{formData.fixed_amount || 0}/month
              </div>
            </div>
          </div>

        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        saveBtnRef={savebtnRef}
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

export default PTMasterForm;
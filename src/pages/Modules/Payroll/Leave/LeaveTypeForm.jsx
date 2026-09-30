// import React, { useState, useEffect, useCallback, useRef } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import { focusFirstInput, handleERPBackspaceNavigation, handleERPEnterNavigation } from "../../../../utils/erpShortcuts";

// const LeaveTypeForm = ({
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
//   onPrevRecord,onNextRecord


// }) => {
//   const [localData, setLocalData] = useState(initialData);
//   const [errors, setErrors] = useState({});
//   const formRef = useRef(null);
//   const saveBtnRef=useRef(null)
//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";
//   const isAddMode = mode === "add";
//   const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

//   const requiredFields = ["leave_code", "leave_name", "max_days"];

//   useEffect(() => { setLocalData(initialData); }, [initialData]);

//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       focusFirstInput(formRef);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     const updated = { ...localData, [field]: value };
//     setLocalData(updated);
//     setFormData(updated);
//     if (errors[field]) {
//       setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
//     }
//   };

//   const getInputClass = (isDisabled, fieldName) =>
//     `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
//      ${errors[fieldName] ? "border-red-500 animate-pulse" : "border-gray-300"}
//      ${isDisabled
//        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
//        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

//   // Fixed: Validation error hone par invalid field par automatic focus chala jayega
//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     const newErrors = {};
    
//     requiredFields.forEach(f => {
//       if (!localData[f] || localData[f].toString().trim() === "")
//         newErrors[f] = "Required";
//     });

//     if (Object.keys(newErrors).length > 0) { 
//       setErrors(newErrors); 

//       // Pehla field dhundo jisme error hai
//       const firstErrorField = requiredFields.find(f => newErrors[f]);
      
//       if (firstErrorField && formRef.current) {
//         // Name attribute ki madad se input element ko find karke focus karo
//         const inputEl = formRef.current.querySelector(`[name="${firstErrorField}"]`);
//         if (inputEl) {
//           inputEl.focus();
//           // Agar input text h to select bhi ho jaye clear experience k liye
//           if (typeof inputEl.select === "function") inputEl.select();
//         }
//       }
//       return; 
//     }
    
//     if (onSave) onSave(localData);
//   }, [localData, onSave, isViewMode]);

//   const handleKeyDown = useCallback((e) => {
//     handleERPBackspaceNavigation(   e,
//       formRef,
//       isViewMode,)
//     handleERPEnterNavigation(
//       e,
//       formRef,
//       isViewMode,
//       saveBtnRef
//     );
//   }, [isViewMode]);

//   return (
//     <div
//       id="leave-type-form-container"
//       className="w-full  h-[calc(100vh-100px)]
//                  bg-[#eef1f6] flex flex-col overflow-hidden"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="Leave Type"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//           currentIndex={currentRecord}      // 👈
//         totalRecords={totalRecords}        // 👈
//         onPrevRecord={onPrevRecord}        // 👈
//         onNextRecord={onNextRecord}  
//       />

//       <div className="flex-1 p-4 overflow-y-auto max-w-[750px] mx-auto flex justify-center">
//         <div
//           ref={formRef}
//           className="w-full max-w-[850px] h-fit bg-white border border-slate-200
//                      shadow-sm rounded-md p-5 grid grid-cols-1 gap-y-4"
//         >

//           {/* Row 1: Leave Code + Max Days */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1 flex flex-col sm:flex-row items-start gap-1">
//               <label className="text-[15px] w-[130px] shrink-0">
//                 Leave Code <span className="text-red-500">*</span>
//               </label>
//               <div className="flex-1 w-full">
//                 <input
//                   name="leave_code"
//                   className={getInputClass(isViewMode, "leave_code")}
//                   value={localData.leave_code || ""}
//                   onChange={(e) => handleChange("leave_code", e.target.value.toUpperCase())}
//                   onKeyDown={handleKeyDown}
//                   disabled={isViewMode}
//                   placeholder="e.g. CL, SL"
//                 />
//                 {errors.leave_code && (
//                   <p className="text-[11px] text-red-500 mt-0.5">{errors.leave_code}</p>
//                 )}
//               </div>
//             </div>

//             <div className="flex-1 flex flex-col sm:flex-row items-start gap-1">
//               <label className="text-[15px] w-[130px] shrink-0">
//                 Max Days <span className="text-red-500">*</span>
//               </label>
//               <div className="flex-1 w-full">
//                 <input
//                   type="number"
//                   name="max_days"
//                   className={getInputClass(isViewMode, "max_days")}
//                   value={localData.max_days || ""}
//                   onChange={(e) => handleChange("max_days", e.target.value)}
//                   onKeyDown={handleKeyDown}
//                   disabled={isViewMode}
//                    placeholder="yearly"
//                 />
//                 {errors.max_days && (
//                   <p className="text-[11px] text-red-500 mt-0.5">{errors.max_days}</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Row 2: Leave Name + Applicable To */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1 flex flex-col sm:flex-row items-start gap-1">
//               <label className="text-[15px] w-[130px] shrink-0">
//                 Leave Name <span className="text-red-500">*</span>
//               </label>
//               <div className="flex-1 w-full">
//                 <input
//                   name="leave_name"
//                   className={getInputClass(isViewMode, "leave_name")}
//                   value={localData.leave_name || ""}
//                   onChange={(e) => handleChange("leave_name", e.target.value)}
//                   onKeyDown={handleKeyDown}
//                   disabled={isViewMode}
//                 />
//                 {errors.leave_name && (
//                   <p className="text-[11px] text-red-500 mt-0.5">{errors.leave_name}</p>
//                 )}
//               </div>
//             </div>

//             <div className="flex-1 flex flex-col sm:flex-row items-start gap-1">
//               <label className="text-[15px] w-[130px] shrink-0">Applicable To</label>
//               <div className="flex-1 w-full">
//                 <ERPAutocomplete
//                   value={localData.applicable || ""}
//                   options={["All", "Male", "Female"]}
//                   onChange={(val) => handleChange("applicable", val)}
//                   disabled={isViewMode}
//                   onKeyDown={handleKeyDown}
//                   className={getInputClass(isViewMode, "applicable")}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Row 3: Description — textarea */}
//           <div className="flex flex-col sm:flex-row items-start gap-2">
//             <label className="text-[15px] w-[130px] pt-1 shrink-0">Description</label>
//             <div className="flex-1 w-full">
//               <textarea
//                 name="description"
//                 className={`${getInputClass(isViewMode, "description")} h-[80px] py-2 resize-none`}
//                 value={localData.description || ""}
//                 onChange={(e) => handleChange("description", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 disabled={isViewMode}
//                 placeholder="Enter leave rules or details... (Shift+Enter for new line)"
//               />
//               {!isViewMode && (
//                 <p className="text-[10px] text-slate-400 mt-0.5">
//                   Shift + Enter for new line · Enter to go to Save
//                 </p>
//               )}
//             </div>
//           </div>

//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         saving={saving}
//         saveBtnRef={saveBtnRef}
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

// export default LeaveTypeForm;
import React, { useState, useEffect, useCallback, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { focusFirstInput, handleERPBackspaceNavigation, handleERPEnterNavigation } from "../../../../utils/erpShortcuts";

const LeaveTypeForm = ({
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
  onPrevRecord,onNextRecord


}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const saveBtnRef=useRef(null)
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = ["leave_code", "leave_name", "max_days"];

  useEffect(() => { setLocalData(initialData); }, [initialData]);

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    setFormData(updated);
    if (errors[field]) {
      setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
    }
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
     ${errors[fieldName] ? "border-red-500 animate-pulse" : "border-gray-300"}
     ${isDisabled
       ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
       : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

  // Fixed: Validation error hone par invalid field par automatic focus chala jayega
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    
    requiredFields.forEach(f => {
      if (!localData[f] || localData[f].toString().trim() === "")
        newErrors[f] = "Required";
    });

    if (Object.keys(newErrors).length > 0) { 
      setErrors(newErrors); 

      // Pehla field dhundo jisme error hai
      const firstErrorField = requiredFields.find(f => newErrors[f]);
      
      if (firstErrorField && formRef.current) {
        // Name attribute ki madad se input element ko find karke focus karo
        const inputEl = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        if (inputEl) {
          inputEl.focus();
          // Agar input text h to select bhi ho jaye clear experience k liye
          if (typeof inputEl.select === "function") inputEl.select();
        }
      }
      return; 
    }
    
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  const handleKeyDown = useCallback((e) => {
    handleERPBackspaceNavigation(   e,
      formRef,
      isViewMode,)
    handleERPEnterNavigation(
      e,
      formRef,
      isViewMode,
      saveBtnRef
    );
  }, [isViewMode]);

  return (
    <div
      id="leave-type-form-container"
      className="w-full h-full sm:h-[calc(100vh-100px)]
                 bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Leave Type"
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

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto max-w-[750px] mx-auto flex justify-center">
        <div
          ref={formRef}
          className="w-full max-w-[850px] h-fit bg-white border border-slate-200
                     shadow-sm rounded-md p-3 sm:p-5 grid grid-cols-1 gap-y-3 sm:gap-y-4"
        >

          {/* Row 1: Leave Code + Max Days */}
          <div className="flex flex-row gap-2 sm:gap-4">
            <div className="flex-1 flex flex-row items-start gap-1">
              <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] shrink-0">
                Leave Code <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full">
                <input
                  name="leave_code"
                  className={getInputClass(isViewMode, "leave_code")}
                  value={localData.leave_code || ""}
                  onChange={(e) => handleChange("leave_code", e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                  placeholder="e.g. CL, SL"
                />
                {errors.leave_code && (
                  <p className="text-[11px] text-red-500 mt-0.5">{errors.leave_code}</p>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-row items-start gap-1">
              <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] shrink-0">
                Max Days <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full">
                <input
                  type="number"
                  name="max_days"
                  className={getInputClass(isViewMode, "max_days")}
                  value={localData.max_days || ""}
                  onChange={(e) => handleChange("max_days", e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                   placeholder="yearly"
                />
                {errors.max_days && (
                  <p className="text-[11px] text-red-500 mt-0.5">{errors.max_days}</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Leave Name + Applicable To */}
          <div className="flex flex-row gap-2 sm:gap-4">
            <div className="flex-1 flex flex-row items-start gap-1">
              <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] shrink-0">
                Leave Name <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full">
                <input
                  name="leave_name"
                  className={getInputClass(isViewMode, "leave_name")}
                  value={localData.leave_name || ""}
                  onChange={(e) => handleChange("leave_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                />
                {errors.leave_name && (
                  <p className="text-[11px] text-red-500 mt-0.5">{errors.leave_name}</p>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-row items-start gap-1">
              <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] shrink-0">Applicable To</label>
              <div className="flex-1 w-full">
                <ERPAutocomplete
                  value={localData.applicable || ""}
                  options={["All", "Male", "Female"]}
                  onChange={(val) => handleChange("applicable", val)}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "applicable")}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Is Paid Checkbox */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2">
            <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] shrink-0">Paid Leave</label>
            <div className="flex-1 w-full flex items-center gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is_paid"
                  checked={localData.is_paid === true || localData.is_paid === 1 || localData.is_paid === "1" || localData.is_paid === undefined}
                  onChange={(e) => handleChange("is_paid", e.target.checked ? 1 : 0)}
                  disabled={isViewMode}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-[13.5px] font-medium text-gray-800">
                  Is Paid Leave
                </span>
              </label>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                (Paid leave counts as payable working day in salary processing; unpaid leave is treated as Loss of Pay)
              </span>
            </div>
          </div>

          {/* Row 4: Description — textarea */}
          <div className="flex flex-row items-start gap-1.5 sm:gap-2">
            <label className="text-[13px] sm:text-[15px] w-[65px] sm:w-[130px] pt-1 shrink-0">Description</label>
            <div className="flex-1 w-full">
              <textarea
                name="description"
                className={`${getInputClass(isViewMode, "description")} h-[80px] py-2 resize-none`}
                value={localData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode}
                placeholder="Enter leave rules or details... (Shift+Enter for new line)"
              />
              {!isViewMode && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Shift + Enter for new line · Enter to go to Save
                </p>
              )}
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
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default LeaveTypeForm;
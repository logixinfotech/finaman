// // import React, { useState, useEffect, useCallback ,useRef} from "react";
// // import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// // import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// // import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

// //   const requiredFields = ["name", "code", "type"];
  
// // const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// // const IncomeHeadForm = ({
// //   mode = "view",
// //   onSave,
// //   onCancel,
// //   onDelete,
// //   onEditCancel,
// //   saving,
// //   onModify,
// //   onNewEntry,
// //   currentRecord,
// //   totalRecords,
// //   rights,
// //   activeTab = "entry",
// //   onTabChange = () => {},
// //   formData,
// //   setFormData,
// //   saveBtnRef
// // }) => { const [errors, setErrors] = useState({});

// //   const isViewMode = mode === "view";
// //   const isAddMode = mode === "add";
// //   const isEditMode = mode === "edit";
// //   const handleChange = (field, value) => {
// //     setFormData(prev => ({ ...prev, [field]: value }));

// //     if (errors[field]) {
// //       setErrors(prev => {
// //         const e = { ...prev };
// //         delete e[field];
// //         return e;
// //       });
// //     }
// //   };
// //   const firstInputRef = useRef(null);
// //   useEffect(() => {
// //   if (!isViewMode && firstInputRef.current) {
// //     firstInputRef.current.focus();
// //   }
// // }, [isViewMode]);

// //   const getInputClass = (disabled, field) =>
// //     `h-[30px] px-2 text-[15px] border rounded-md ${
// //       errors[field] ? "border-red-500" : "border-gray-300"
// //     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`; 
// //   const handleValidateAndSave = useCallback(() => {
// //     if (isViewMode) return;

// //     let newErrors = {};
// //     let firstEmpty = null;

// //     requiredFields.forEach(field => {
// //       if (!formData[field]) {
// //         newErrors[field] = "Required";
// //         if (!firstEmpty) firstEmpty = field;
// //       }
// //     });

// //     if (Object.keys(newErrors).length > 0) {
// //       setErrors(newErrors);

// //       setTimeout(() => {
// //         const el = document.querySelector(`[name="${firstEmpty}"]`);
// //         if (el) el.focus();
// //       }, 50);

// //       return;
// //     }

// //     onSave && onSave(formData);
// //   }, [formData, isViewMode, onSave]); 
// //   const handleKeyDown = useCallback((e) => {
// //     if (isViewMode) return;

// //     const container = document.getElementById("income-form-container");
// //     if (!container) return;

// //     const elements = Array.from(
// //       container.querySelectorAll(
// //         "[data-focus], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
// //       )
// //     ).filter(el => !el.disabled);

// //     const index = elements.findIndex(el => el.contains(e.target));
// //     if (e.key === "Enter") {
// //       e.preventDefault();

// //       if (index < elements.length - 1) {
// //         elements[index + 1].focus();
// //       } else {
// //          saveBtnRef.current?.focus();
// //       }
// //     }
 
// //     if (e.key === "Backspace") {
// //       let shouldGoBack = false;

// //       if (e.target.tagName === "INPUT") {
// //         const isEmpty = e.target.value === "";
// //         const atStart =
// //           e.target.selectionStart === 0 && e.target.selectionEnd === 0;

// //         if (isEmpty || atStart) shouldGoBack = true;
// //       }

// //       if (e.target.dataset.auto) shouldGoBack = true;
// //       if (e.target.dataset.toggle === "status") shouldGoBack = true;

// //       if (shouldGoBack && index > 0) {
// //         e.preventDefault();
// //         elements[index - 1].focus();
// //       }
// //     }
 
// //     if (e.key === " " && e.target.dataset.toggle === "status") {
// //       e.preventDefault();
// //       handleChange(
// //         "status",
// //         formData.status === "Active" ? "Inactive" : "Active"
// //       );
// //     }

// //   }, [formData, isViewMode, handleValidateAndSave]);

// //   return (
// //     <div
// //       className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
// //       style={{ fontFamily: FONT }}
// //     >

// //       <ERPHeader
// //         title="INCOME HEAD ENTRY"
// //         isAddMode={isAddMode}
// //         isEditMode={isEditMode}
// //         isViewMode={isViewMode}
// //         activeTab={activeTab}
// //         onTabChange={onTabChange}
// //         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
// //       />

// //       <div className="flex-1 p-4 flex justify-center items-start">
// //         <div
// //           id="income-form-container"
// //           className="w-full max-w-[800px] bg-white border rounded-md p-4"
// //         > 
// //           <div className="grid grid-cols-3 gap-6">

// //             <div className="col-span-2 flex items-center gap-2">
// //               <label className="w-[75px]">
// //                 Name <span className="text-red-500">*</span>
// //               </label>
// //               <input
// //                 ref={firstInputRef}
// //                 name="name"
// //                 value={formData.name || ""}
// //                 disabled={isViewMode}
// //                 onChange={e => handleChange("name", e.target.value)}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "name")} flex-1`}
// //               />
// //             </div>

// //             <div className="flex items-center gap-2">
// //               <label className="w-[60px]">
// //                 Code <span className="text-red-500">*</span>
// //               </label>
// //               <input
// //                 name="code"
// //                 value={formData.code || ""}
// //                 disabled={isViewMode}
// //                 onChange={e => handleChange("code", e.target.value)}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "code")} w-[100px]`}
// //               />
// //             </div>

// //           </div> 
// //           <div className="grid grid-cols-3 gap-7 mt-4">

// //             <div className="flex items-center gap-2">
// //               <label className="w-[130px]">
// //                 Type <span className="text-red-500">*</span>
// //               </label>
// //               <ERPAutocomplete
// //                 data-auto
// //                 value={formData.type || ""}
// //                 options={["Fixed", "Variable"]}
// //                 onChange={(val) => handleChange("type", val)}
// //                 disabled={isViewMode}
// //                 onKeyDown={handleKeyDown}
// //                 className={getInputClass(isViewMode, "type")}
// //               />
// //             </div>

// //             <div className="flex items-center gap-2">
// //               <label className="w-[55px]">Taxable</label>
// //               <ERPAutocomplete
// //                 data-auto
// //                 value={formData.taxable ?? "Yes"}
// //                 options={["Yes", "No"]}
// //                 onChange={(val) => handleChange("taxable", val)}
// //                 disabled={isViewMode}
// //                 onKeyDown={handleKeyDown}
// //                 className={getInputClass(isViewMode, "taxable")}
// //               />
// //             </div>

// //             <div className="flex items-center gap-5">
// //               <label className="w-[50px]">Status</label>

// //               <div
// //                 tabIndex={0}
// //                 data-toggle="status"
// //                 role="switch"
// //                 data-focus="status"
// //                 onKeyDown={handleKeyDown}
// //                 onClick={() =>
// //                   !isViewMode &&
// //                   handleChange(
// //                     "status",
// //                     formData.status === "Active" ? "Inactive" : "Active"
// //                   )
// //                 }
// //                 className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px]
// //                   ${formData.status === "Active" ? "bg-green-500" : "bg-gray-400"}
// //                 `}
// //               >
// //                 <div
// //                   className={`h-[18px] w-[18px] bg-white rounded-full transition-all
// //                     ${formData.status === "Active" ? "translate-x-[20px]" : ""}
// //                   `}
// //                 />
// //               </div>

// //               <span className="text-sm">{formData.status || "Active"}</span>
// //             </div>

// //           </div>

// //         </div>
// //       </div>

// //       <ERPFooter
// //         isAddMode={isAddMode}
// //         isEditMode={isEditMode}
// //         isViewMode={isViewMode}
// //         saving={saving}
// //        saveBtnRef={saveBtnRef}
// //         handleSubmit={handleValidateAndSave}
// //         onModify={onModify}
// //         onDelete={() => onDelete && onDelete(formData)}
// //         onCancel={onCancel}
// //         onEditCancel={onEditCancel}
// //         onNewEntry={onNewEntry}
// //         rights={rights}
// //       />
// //     </div>
// //   );
// // };

// // export default IncomeHeadForm;
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

// const requiredFields = ["name", "code", "type"];

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const IncomeHeadForm = ({
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
//   rights,
//   activeTab = "entry",
//   onTabChange = () => {},
//   formData,
//   setFormData,
//   saveBtnRef
// }) => {
//   const [errors, setErrors] = useState({});

//   const isViewMode = mode === "view";
//   const isAddMode = mode === "add";
//   const isEditMode = mode === "edit";
  
//   const handleChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));

//     if (errors[field]) {
//       setErrors(prev => {
//         const e = { ...prev };
//         delete e[field];
//         return e;
//       });
//     }
//   };

//   const firstInputRef = useRef(null);
  
//   useEffect(() => {
//     if (!isViewMode && firstInputRef.current) {
//       firstInputRef.current.focus();
//     }
//   }, [isViewMode]);

//   const getInputClass = (disabled, field) =>
//     `h-[30px] px-2 text-[15px] border rounded-md ${
//       errors[field] ? "border-red-500" : "border-gray-300"
//     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`; 

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;

//     let newErrors = {};
//     let firstEmpty = null;

//     requiredFields.forEach(field => {
//       if (!formData[field]) {
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

//     const container = document.getElementById("income-form-container");
//     if (!container) return;

//    const elements = Array.from(
//   container.querySelectorAll(
//     "input:not([disabled]), [tabindex='0'], [data-auto]"
//   )
// ).filter(el => !el.disabled);

// const index = elements.indexOf(e.target);
//     if (e.key === "Enter") {
//       e.preventDefault();

//       if (index < elements.length - 1) {
//         elements[index + 1].focus();
//       } else {
//         const btn=document.querySelector("#save");
//         if(btn){
//           btn.focus();
//         }
//       }
//     }

//     if (e.key === "Backspace") {
//       let shouldGoBack = false;

//       if (e.target.tagName === "INPUT") {
//         const isEmpty = e.target.value === "";
//         const atStart =
//           e.target.selectionStart === 0 && e.target.selectionEnd === 0;

//         if (isEmpty || atStart) shouldGoBack = true;
//       }

//       if (e.target.dataset.auto) shouldGoBack = true;
//       if (e.target.dataset.toggle === "status") shouldGoBack = true;

//       if (shouldGoBack && index > 0) {
//         e.preventDefault();
//         elements[index - 1].focus();
//       }
//     }

//     if (e.key === " " && e.target.dataset.toggle === "status") {
//       e.preventDefault();
//       handleChange(
//         "status",
//         formData.status === "Active" ? "Inactive" : "Active"
//       );
//     }

//   }, [formData, isViewMode, handleValidateAndSave]);

//   return (
//     <div
//       className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="INCOME HEAD ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       {/* Overflow-x-auto mobile ke scroll ke liye. Justify-start mobile par left edge se start karega, sm:justify-center desktop par center rakhega. */}
//       <div className="flex-1 p-4 overflow-x-auto flex justify-start sm:justify-center items-start">
//         <div
//           id="income-form-container"
//           /* min-w-[650px] sirf mobile pe form ko 650px pe lock karega jisse wo scroll ho, sm:min-w-0 laptop pe is lock ko hata dega taaki original code ki tarah bina scrollbar ke chale. */
//           className="w-full min-w-[650px] sm:min-w-0 max-w-[800px] bg-white border rounded-md p-4"
//         > 
//           <div className="grid grid-cols-3 gap-6">

//             <div className="col-span-2 flex items-center gap-2">
//               <label className="w-[75px]">
//                 Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 ref={firstInputRef}
//                 name="name"
//                 value={formData.name || ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("name", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "name")} flex-1`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[60px]">
//                 Code <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="code"
//                 value={formData.code || ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("code", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "code")} w-[100px]`}
//               />
//             </div>

//           </div> 
          
//           <div className="grid grid-cols-3 gap-7 mt-4">

//             <div className="flex items-center gap-2">
//               <label className="w-[130px]">
//                 Type <span className="text-red-500">*</span>
//               </label>
//               <ERPAutocomplete
//                 data-auto
//                 value={formData.type || ""}
//                 options={["Fixed", "Variable"]}
//                 onChange={(val) => handleChange("type", val)}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "type")}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[55px]">Taxable</label>
//               <ERPAutocomplete
//                 data-auto
//                 value={formData.taxable ?? "Yes"}
//                 options={["Yes", "No"]}
//                 onChange={(val) => handleChange("taxable", val)}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "taxable")}
//               />
//             </div>

//             <div className="flex items-center gap-5">
//               <label className="w-[50px]">Status</label>

//               <div
//                 tabIndex={0}
//                data-toggle="status"
//                 role="switch"
//                 onKeyDown={handleKeyDown}
//                 onClick={() =>
//                   !isViewMode &&
//                   handleChange(
//                     "status",
//                     formData.status === "Active" ? "Inactive" : "Active"
//                   )
//                 }
//                 className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px]
//                   ${formData.status === "Active" ? "bg-green-500" : "bg-gray-400"}
//                 `}
//               >
//                 <div
//                   className={`h-[18px] w-[18px] bg-white rounded-full transition-all
//                     ${formData.status === "Active" ? "translate-x-[20px]" : ""}
//                   `}
//                 />
//               </div>

//               <span className="text-sm">{formData.status || "Active"}</span>
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
//         onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default IncomeHeadForm;
import React, { useState, useEffect, useCallback, useRef } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

const requiredFields = ["name", "code", "type"];
const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const IncomeHeadForm = ({
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
  rights,
  activeTab = "entry",
  onTabChange = () => {},
  formData,
  setFormData,
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  const firstInputRef = useRef(null);
  
  useEffect(() => {
    if (!isViewMode && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isViewMode]);

  const getInputClass = (disabled, field) =>
    `h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"} w-full`; 

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    let firstEmpty = null;

    requiredFields.forEach(field => {
      if (!formData[field]) {
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
    const container = document.getElementById("income-form-container");
    if (!container) return;
    const elements = Array.from(
      container.querySelectorAll(
        "[data-focus], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
      )
    ).filter(el => !el.disabled);

    const index = elements.findIndex(el => el.contains(e.target));
    if (e.key === "Enter") {
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
      else {
         const buttons = Array.from(document.querySelectorAll("button"));
              const saveBtn = buttons.find((btn) =>
                btn.textContent.toLowerCase().includes("save")||btn.textContent.toLowerCase().includes("update")
              );
              if (saveBtn) {
                saveBtn.focus();
              } 
      }
    }
    if (e.key === "Backspace") {
      let shouldGoBack = false;
      if (e.target.tagName === "INPUT") {
        if (e.target.value === "" || (e.target.selectionStart === 0 && e.target.selectionEnd === 0)) shouldGoBack = true;
      }
      if (e.target.dataset.auto || e.target.dataset.toggle === "status") shouldGoBack = true;
      if (shouldGoBack && index > 0) { e.preventDefault(); elements[index - 1].focus(); }
    }
    if (e.key === " " && e.target.dataset.toggle === "status") {
      e.preventDefault();
      handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
    }
  }, [formData, isViewMode, handleValidateAndSave]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-full md:h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="INCOME HEAD ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        <div
          id="income-form-container"
          className="w-full bg-white border rounded-md p-4 md:p-6"
        > 
          {/* Row 1: Name and Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                name="name"
                value={formData.name || ""}
                disabled={isViewMode}
                onChange={e => handleChange("name", e.target.value)}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "name")}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                value={formData.code || ""}
                disabled={isViewMode}
                onChange={e => handleChange("code", e.target.value)}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "code")}
              />
            </div>
          </div> 
          
          {/* Row 2: Type, Taxable, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap mr-2">
                Type <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                value={formData.type || ""}
                options={["Fixed", "Variable"]}
                onChange={(val) => handleChange("type", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "type")}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Taxable</label>
              <ERPAutocomplete
                data-auto
                value={formData.taxable ?? "Yes"}
                options={["Yes", "No"]}
                onChange={(val) => handleChange("taxable", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "taxable")}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Status</label>
              <ERPAutocomplete
                value={formData.status || ""}
                options={["Active", "Inactive"]}
                onChange={(val) => handleChange("status", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "status")}
              />
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
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

export default IncomeHeadForm;
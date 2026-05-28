// import React, { useState, useEffect, useCallback } from "react";
// import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const DeductionHeadForm = ({
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
//   formData,
//   setFormData,
//   onTabChange = () => {},
//   initialData = {},
// }) => {
//   const [errors, setErrors] = useState({});

//   const isViewMode = mode === "view";
//   const isAddMode = mode === "add";
//   const isEditMode = mode === "edit";

//   const requiredFields = ["name", "code", "type"];

//   // Logic remains identical to your provided code
//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const firstInput = document.querySelector("#deduction-form-container input:not([disabled])");
//         if (firstInput) firstInput.focus();
//       }, 150);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors((prev) => {
//         const e = { ...prev };
//         delete e[field];
//         return e;
//       });
//     }
//   };

//   // Responsive Input Class: w-full for mobile, specific height changes
//   const getInputClass = (disabled, field) =>
//     `h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md w-full ${
//       errors[field] ? "border-red-500" : "border-gray-300"
//     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     let newErrors = {};
//     let firstEmpty = null;

//     requiredFields.forEach((field) => {
//       if (!formData[field]) {
//         newErrors[field] = "Required";
//         if (!firstEmpty) firstEmpty = field;
//       }
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       setTimeout(() => {
//         const container = document.getElementById("deduction-form-container");
//         if (!container) return;
//         const el = container.querySelector(`[name="${firstEmpty}"]`) || container.querySelector(`[data-field="${firstEmpty}"] input`) || container.querySelector(`[data-field="${firstEmpty}"]`);
//         if (el) {
//           el.focus();
//           if (el.tagName === "INPUT") {
//             const len = el.value?.length || 0;
//             try { el.setSelectionRange(len, len); } catch {}
//           }
//         }
//       }, 50);
//       return;
//     }
//     onSave && onSave(formData);
//   }, [formData, isViewMode, onSave]);

//   const handleKeyDown = useCallback((e) => {
//     if (isViewMode) return;
//     const container = document.getElementById("deduction-form-container");
//     if (!container) return;
//     const elements = Array.from(container.querySelectorAll("input:not([disabled]), [tabindex='0'], [data-auto]")).filter((el) => !el.disabled);
//     const index = elements.indexOf(e.target);

//     if (e.key === "Enter") {
//       e.preventDefault();
//       if (index < elements.length - 1) elements[index + 1].focus();
//       else {
//  const buttons = Array.from(document.querySelectorAll("button"));
//               const saveBtn = buttons.find((btn) =>
//                 btn.textContent.toLowerCase().includes("save")||btn.textContent.toLowerCase().includes("update")
//               );
//               if (saveBtn) {
//                 saveBtn.focus();
//               } 
//       }
//     }
//     if (e.key === "Backspace") {
//       let shouldGoBack = false;
//       if (e.target.tagName === "INPUT") {
//         const isEmpty = e.target.value === "";
//         const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
//         if (isEmpty || atStart) shouldGoBack = true;
//       }
//       if (e.target.dataset.auto || e.target.dataset.toggle === "status") shouldGoBack = true;
//       if (shouldGoBack && index > 0) {
//         e.preventDefault();
//         elements[index - 1].focus();
//       }
//     }
//     if (e.key === " " && e.target.dataset.toggle === "status") {
//       e.preventDefault();
//       handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
//     }
//   }, [formData, isViewMode, handleValidateAndSave,]);

//   return (
//     <div className="w-full max-w-[700px] mx-auto h-full md:h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>
//       <ERPHeader
//         title="DEDUCTION HEAD ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 p-2 md:p-4 overflow-y-auto">
//         <div id="deduction-form-container" className="w-full bg-white border rounded-md p-4">
          
//           {/* ROW 1: Name and Code */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             <div className="md:col-span-2 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
//               <label className="text-sm font-medium whitespace-nowrap">
//                 Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="name"
//                 value={formData.name || ""}
//                 disabled={isViewMode}
//                 onChange={(e) => handleChange("name", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "name")}
//               />
//             </div>

//             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
//               <label className="text-sm font-medium whitespace-nowrap">
//                 Code <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="code"
//                 value={formData.code || ""}
//                 disabled={isViewMode}
//                 onChange={(e) => handleChange("code", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "code")}
//               />
//             </div>
//           </div>

//           {/* ROW 2: Type, Pre-Tax, Status */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
//               <label className="text-sm font-medium whitespace-nowrap mr-2">
//                 Type <span className="text-red-500">*</span>
//               </label>
//               <ERPAutocomplete
//                 data-auto
//                 value={formData.type || ""}
//                 options={["Fixed", "Variable", "Percentage"]}
//                 onChange={(val) => handleChange("type", val)}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "type")}
//               />
//             </div>

//             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
//               <label className="text-sm font-medium whitespace-nowrap">Pre-Tax</label>
//               <ERPAutocomplete
//                 data-auto
//                 value={formData.preTax ?? "Yes"}
//                 options={["Yes", "No"]}
//                 onChange={(val) => handleChange("preTax", val)}
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(isViewMode, "preTax")}
//               />
//             </div>

//             <div className="flex flex-row items-center gap-4 mt-2 md:mt-0">
//               <label className="text-sm font-medium whitespace-nowrap">Status</label>
//               <div
//                 tabIndex={0}
//                 data-toggle="status"
//                 onKeyDown={handleKeyDown}
//                 onClick={() => !isViewMode && handleChange("status", formData.status === "Active" ? "Inactive" : "Active")}
//                 className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${formData.status === "Active" ? "bg-green-500" : "bg-gray-400"}`}
//               >
//                 <div className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${formData.status === "Active" ? "translate-x-[20px]" : ""}`} />
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
//         handleSubmit={handleValidateAndSave}
//         onModify={onModify}
//         onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onEditCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default DeductionHeadForm;
import React, { useState, useEffect, useCallback } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const DeductionHeadForm = ({
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
  formData,
  setFormData,
  onTabChange = () => {},
  initialData = {},
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = ["name", "code", "type"];

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput = document.querySelector("#deduction-form-container input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  const getInputClass = (disabled, field) =>
    `h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md w-full ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    let firstEmpty = null;

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "Required";
        if (!firstEmpty) firstEmpty = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        const container = document.getElementById("deduction-form-container");
        if (!container) return;
        const el = container.querySelector(`[name="${firstEmpty}"]`) || container.querySelector(`[data-field="${firstEmpty}"] input`) || container.querySelector(`[data-field="${firstEmpty}"]`);
        if (el) {
          el.focus();
          if (el.tagName === "INPUT") {
            const len = el.value?.length || 0;
            try { el.setSelectionRange(len, len); } catch {}
          }
        }
      }, 50);
      return;
    }
    onSave && onSave(formData);
  }, [formData, isViewMode, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("deduction-form-container");
    if (!container) return;
    
    // Ab chuki sab kuch input/dropdown hai, hum bas sabhi active inputs ko uthayenge
    const elements = Array.from(container.querySelectorAll("input:not([disabled])"));
    const index = elements.indexOf(e.target);

    if (e.key === "Enter") {
      e.preventDefault();
      
      // Agar list ka aakhiri element nahi hai, to next input pe jao
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      } 
      // Agar list ke ekdum end (Status Dropdown) pe khade ho, to seedha Save button pe jao
      else if (index === elements.length - 1) {
        const buttons = Array.from(document.querySelectorAll("button"));
        const saveBtn = buttons.find((btn) =>
          btn.textContent.toLowerCase().includes("save") || btn.textContent.toLowerCase().includes("update")
        );
        if (saveBtn) {
          saveBtn.focus();
        } 
      }
    }
    
    if (e.key === "Backspace") {
      let shouldGoBack = false;
      if (e.target.tagName === "INPUT") {
        const isEmpty = e.target.value === "";
        const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
        if (isEmpty || atStart) shouldGoBack = true;
      }
      
      if (shouldGoBack && index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }
  }, [formData, isViewMode, handleValidateAndSave]);

  return (
    <div className="w-full max-w-[700px] mx-auto h-full md:h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="DEDUCTION HEAD ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        <div id="deduction-form-container" className="w-full bg-white border rounded-md p-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("name", e.target.value)}
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
                onChange={(e) => handleChange("code", e.target.value)}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "code")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap mr-2">
                Type <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                value={formData.type || ""}
                options={["Fixed", "Variable", "Percentage"]}
                onChange={(val) => handleChange("type", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "type")}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Pre-Tax</label>
              <ERPAutocomplete
                value={formData.preTax ?? "Yes"}
                options={["Yes", "No"]}
                onChange={(val) => handleChange("preTax", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "preTax")}
              />
            </div>

            {/* Toggle hata kar yahan ERPAutocomplete lagaya gaya hai */}
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
        onCancel={onEditCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default DeductionHeadForm;
//  import React, { useState, useRef, useEffect } from "react";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import { focusSaveOrUpdateButton } from "../../../../utils/erpShortcuts";
// import ERPAutoComplete from "../../../../components/Reusable/input/ERPAutocomplete";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
// const inputClass = "h-[30px] px-2 text-[13px] border border-gray-300 rounded-md bg-white focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed";
// const labelClass = "text-[12px] font-medium text-gray-600 w-[120px]";
// const errorText = "text-[10px] text-red-500 mt-0.5";
// const PAD_NAME_OPTIONS = ["Entries", "Reports", "Utility"];

// const ITEM_TYPE_MAP = { M: "Menu", S: "Sub Menu", R: "Report" };
// const ITEM_TYPE_OPTIONS = Object.values(ITEM_TYPE_MAP);

// const APPL_TYPE_MAP = { F: "Form", P: "Program", A: "Application" };
// const APPL_TYPE_OPTIONS = Object.values(APPL_TYPE_MAP);

// const MENU_HIDE_MAP = { N: "No (Visible)", Y: "Yes (Hidden)" };
// const MENU_HIDE_OPTIONS = Object.values(MENU_HIDE_MAP);

// const codeFromLabel = (map, label) =>
//   Object.keys(map).find((code) => map[code] === label) || "";

// const PAD_TYPE_MAP = { Entries: "1", Reports: "2", Utility: "3" };

// const MenuMasterForm = ({
//   mode, modules, groups = [],formData, setFormData, onSave, onCancel,
//   saving, onDelete, onModify, onEditCancel, rights,
//   currentRecord, totalRecords, activeTab, onTabChange, onNewEntry, onPrevRecord,
//   onNextRecord,
// }) => {
//   const isView = mode === "view";
//   const isEdit = mode === "edit";
//   const isAdd = mode === "add";

//   const fieldDisabled = (fieldName) => {
//     if (isView) return true;
//     if (isEdit && (fieldName === "masmod_id" || fieldName === "pad_name")) return true;
//     return false;
//   };

//   const saveBtnRef = useRef(null);
//   const [errors, setErrors] = useState({});
//   const containerRef = useRef(null);

//   // ---- LOCAL TEXT STATE (ye typing ko free rehne deta hai) ----
//   const [moduleText, setModuleText] = useState("");
//   const [groupText, setGroupText] = useState("");
//   const [itemTypeText, setItemTypeText] = useState("");
//   const [applTypeText, setApplTypeText] = useState("");
//   const [hideText, setHideText] = useState("");

//   // Jab formData bahar se change ho (edit/view load, record navigate),
//   // tab hi local text ko sync karo — typing ke dauraan overwrite mat karo
// useEffect(() => {
//     const mod = modules.find((m) => m.masmod_id === formData.masmod_id);
//     setModuleText(mod?.mod_name || "");
//     const grp = groups.find((g) => g.grp_id === formData.grp_id);
//     setGroupText(grp?.grp_name || "");                // 👈
//     setItemTypeText(ITEM_TYPE_MAP[formData.item_type] || "");
//     setApplTypeText(APPL_TYPE_MAP[formData.appl_type] || "");
//     setHideText(MENU_HIDE_MAP[formData.menu_hide || "N"] || "");
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [formData.masmod_id, formData.grp_id, formData.item_type, formData.appl_type, formData.menu_hide, modules, groups]);

//   useEffect(() => {
//     if (!isView) {
//       setTimeout(() => {
//         const firstInput = containerRef.current?.querySelector("input:not([disabled]), select:not([disabled])");
//         firstInput?.focus();
//       }, 150);
//     }
//   }, [mode]);

//  const handleKeyDown = (e) => {
//   if (isView) return;

//   const elements = Array.from(
//     containerRef.current.querySelectorAll(
//       "input:not([disabled]), select:not([disabled]), button:not([disabled])"
//     )
//   );
//   const index = elements.indexOf(e.target);

//   if (e.key === "Enter") {
//     e.preventDefault();
//     if (index > -1 && index < elements.length - 1) {
//       elements[index + 1].focus();
//     } else {
//       focusSaveOrUpdateButton(saveBtnRef);
//     }
//     return;
//   }

//   // Shift + Backspace -> hamesha pichle field pe focus jump, content se farak nahi
//   if (e.shiftKey && e.key === "Backspace") {
//     e.preventDefault();
//     if (index > 0) {
//       elements[index - 1].focus();
//     }
//     return;
//   }
// };

//   const handleChange = (field, value) => {
//     setFormData({ ...formData, [field]: value });
//     if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
//   };

//  const handlePadChange = (val) => {
//     setFormData({ ...formData, pad_name: val, pad_type: PAD_TYPE_MAP[val] || "1", grp_id: null });
//     if (errors.pad_name) setErrors((p) => ({ ...p, pad_name: null }));
//   };

//   // ---- MODULE: typed text local, sirf match milne pe formData update ----
//   const handleModuleChange = (typedValue) => {
//     setModuleText(typedValue || "");
//     const picked = modules.find((m) => m.mod_name === typedValue);
//     if (picked) {
//       setFormData({ ...formData, masmod_id: picked.masmod_id, grp_id: null });   // 👈
//       if (errors.masmod_id) setErrors((p) => ({ ...p, masmod_id: null }));
//     } else if (typedValue === "") {
//       setFormData({ ...formData, masmod_id: "", grp_id: null });                 // 👈
//     }
//   };

//   const handleItemTypeChange = (typedValue) => {
//     setItemTypeText(typedValue || "");
//     const code = codeFromLabel(ITEM_TYPE_MAP, typedValue);
//     if (code) handleChange("item_type", code);
//   };

//   const handleApplTypeChange = (typedValue) => {
//     setApplTypeText(typedValue || "");
//     const code = codeFromLabel(APPL_TYPE_MAP, typedValue);
//     if (code) handleChange("appl_type", code);
//   };

//   const handleHideChange = (typedValue) => {
//     setHideText(typedValue || "");
//     const code = codeFromLabel(MENU_HIDE_MAP, typedValue);
//     if (code) handleChange("menu_hide", code);
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.masmod_id) newErrors.masmod_id = "Required";
//     if (!formData.pad_name) newErrors.pad_name = "Required";
//     if (!formData.bar_name) newErrors.bar_name = "Required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = () => {
//     if (!validateForm()) return;
//     onSave();
//   };


//   const groupList = groups.filter(
//     (g) => g.masmod_id === formData.masmod_id && g.pad_type === (formData.pad_type || "1")
//   );

//   const handleGroupChange = (typedValue) => {
//     setGroupText(typedValue || "");
//     const picked = groupList.find((g) => g.grp_name === typedValue);
//     if (picked) setFormData({ ...formData, grp_id: picked.grp_id });
//     else if (typedValue === "") setFormData({ ...formData, grp_id: null });
//   };



//   const moduleOptions = modules.map((m) => m.mod_name);

//   return (
//        <div className="w-full h-full  sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>


//       <ERPHeader
//         title="Menu Master"
//         isAddMode={isAdd}
//         isEditMode={isEdit && !isView}
//         isViewMode={isView}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//         currentIndex={currentRecord}
//         totalRecords={totalRecords}
//         onPrevRecord={onPrevRecord}
//         onNextRecord={onNextRecord}
//       />

//       <div className="flex-1 p-4 flex justify-center items-start overflow-y-auto">
//         <div ref={containerRef} className="w-full max-w-[750px] mx-auto bg-white border rounded-lg p-6 shadow-sm">

//           <div className="grid grid-cols-2 gap-x-8 gap-y-4">
//             {/* Module Select */}
//             <div className="flex flex-col">
//               <div className="flex items-center">
//                 <label className={labelClass}>Module <span className="text-red-500">*</span></label>
//                 <ERPAutoComplete
//                   disabled={fieldDisabled("masmod_id")}
//                   className={`${inputClass} flex-1 ${errors.masmod_id ? "border-red-500" : ""}`}
//                   value={moduleText}
//                   onChange={handleModuleChange}
//                   onKeyDown={handleKeyDown}
//                   options={moduleOptions}
//                 />
//               </div>
//               {errors.masmod_id && <p className={`${errorText} ml-[120px]`}>{errors.masmod_id}</p>}
//             </div>

//             {/* Pad Name Select */}
//             <div className="flex flex-col">
//               <div className="flex items-center">
//                 <label className={labelClass}>Pad Name <span className="text-red-500">*</span></label>
//                 <ERPAutoComplete
//                   disabled={fieldDisabled("pad_name")}
//                   className={`${inputClass} flex-1 ${errors.pad_name ? "border-red-500" : ""}`}
//                   value={formData.pad_name || ""}
//                   onChange={handlePadChange}
//                   onKeyDown={handleKeyDown}
//                   options={PAD_NAME_OPTIONS}
//                 />
//               </div>
//               {errors.pad_name && <p className={`${errorText} ml-[120px]`}>{errors.pad_name}</p>}
//             </div>

          
//             {/* Group Name */}
//                <div className="flex items-center">
//                 <label className={labelClass}>Group Name</label>
//                 <ERPAutoComplete
//                   disabled={isView || !formData.masmod_id}
//                   className={`${inputClass} flex-1`}
//                   value={groupText}
//                   onChange={handleGroupChange}
//                   onKeyDown={handleKeyDown}
//                   options={groupList.map((g) => g.grp_name)}
//                   placeholder={formData.masmod_id ? "Select group" : "Select module first"}
//                 />
//               </div>
            

//             <div className="flex items-center">
//               <label className={labelClass}>Icon Name</label>
//               <input
//                 disabled={isView}
//                 className={`${inputClass} flex-1 max-w-[195px]`}
//                 value={formData.icon_name || ""}
//                 placeholder="e.g. FaUsers"
//                 onChange={(e) => handleChange("icon_name", e.target.value)}
//                 onKeyDown={handleKeyDown}
//               />
//             </div>
            

//             <div className="flex items-center">
//               <label className={labelClass}>Item Type</label>
//               <ERPAutoComplete
//                 disabled={isView}
//                 className={`${inputClass} flex-1`}
//                 value={itemTypeText}
//                 onChange={handleItemTypeChange}
//                 onKeyDown={handleKeyDown}
//                 options={ITEM_TYPE_OPTIONS}
//               />
//             </div>

//             <div className="flex items-center">
//               <label className={labelClass}>Application Type</label>
//               <ERPAutoComplete
//                 disabled={isView}
//                 className={`${inputClass} flex-1`}
//                 value={applTypeText}
//                 onChange={handleApplTypeChange}
//                 onKeyDown={handleKeyDown}
//                 options={APPL_TYPE_OPTIONS}
//               />
//             </div>

//             <div className="flex flex-col col-span-2">
//               <div className="flex items-center">
//                 <label className={labelClass}>Menu Name <span className="text-red-500">*</span></label>
//                 <input
//                   disabled={isView}
//                   className={`${inputClass} flex-1 ${errors.bar_name ? "border-red-500" : ""}`}
//                   value={formData.bar_name || ""}
//                   onChange={(e) => handleChange("bar_name", e.target.value)}
//                   onKeyDown={handleKeyDown}
//                 />
//               </div>
//               {errors.bar_name && <p className={`${errorText} ml-[120px]`}>{errors.bar_name}</p>}
//             </div>

//             <div className="flex items-center col-span-2">
//               <label className={labelClass}>File Name</label>
//               <input
//                 disabled={isView}
//                 className={`${inputClass} flex-1`}
//                 value={formData.appl_name || ""}
//                 placeholder="e.g. UserMasterPage"
//                 onChange={(e) => handleChange("appl_name", e.target.value)}
//                 onKeyDown={handleKeyDown}
//               />
//             </div>

//             <div className="flex items-center col-span-2">
//               <label className={labelClass}>Parameters</label>
//               <input
//                 disabled={isView}
//                 className={`${inputClass} flex-1`}
//                 value={formData.appl_para || ""}
//                 onChange={(e) => handleChange("appl_para", e.target.value)}
//                 onKeyDown={handleKeyDown}
//               />
//             </div>
            

//             <div className="flex items-center">
//               <label className={labelClass}>Is Hidden?</label>
//               <ERPAutoComplete
//                 disabled={isView}
//                 className={`${inputClass} flex-1`}
//                 value={hideText}
//                 onChange={handleHideChange}
//                 onKeyDown={handleKeyDown}
//                 options={MENU_HIDE_OPTIONS}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAdd}
//         isEditMode={isEdit && !isView}
//         isViewMode={isView}
//         saving={saving}
//         saveBtnRef={saveBtnRef}
//         handleSubmit={handleSubmit}
//         onModify={rights.mod === 1 ? onModify : null}
//         onDelete={rights.del === 1 ? onDelete : null}
//         onEditCancel={onEditCancel}
//         onCancel={onCancel}
//         formData={formData}
//         rights={rights}
//         onNewEntry={onNewEntry}
//       />
//     </div>
//   );
// };

// export default MenuMasterForm;
import React, { useState, useRef, useEffect } from "react";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import { focusSaveOrUpdateButton } from "../../../../utils/erpShortcuts";
import ERPAutoComplete from "../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const inputClass = "h-[30px] px-2 text-[13px] border border-gray-300 rounded-md bg-white focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed";
// Mobile-first: label stacks full-width above the field, then reverts to the
// original fixed 120px inline layout from the `sm` breakpoint up (desktop unchanged).
const labelClass = "text-[12px] font-medium text-gray-600 w-full sm:w-[120px] mb-1 sm:mb-0";
// Wraps a label + field pair. Stacks vertically on mobile, stays inline (as before) on sm+.
const fieldRowClass = "flex flex-col sm:flex-row sm:items-center";
const errorText = "text-[10px] text-red-500 mt-0.5";
// Error text used to be indented to align under the input (ml-[120px]) which only
// makes sense in the inline desktop layout; on mobile (stacked) it should hug the left edge.
const errorMlClass = "ml-0 sm:ml-[120px]";
const PAD_NAME_OPTIONS = ["Entries", "Reports", "Utility"];

const ITEM_TYPE_MAP = { M: "Menu", S: "Sub Menu", R: "Report" };
const ITEM_TYPE_OPTIONS = Object.values(ITEM_TYPE_MAP);

const APPL_TYPE_MAP = { F: "Form", P: "Program", A: "Application" };
const APPL_TYPE_OPTIONS = Object.values(APPL_TYPE_MAP);

const MENU_HIDE_MAP = { N: "No (Visible)", Y: "Yes (Hidden)" };
const MENU_HIDE_OPTIONS = Object.values(MENU_HIDE_MAP);

const codeFromLabel = (map, label) =>
  Object.keys(map).find((code) => map[code] === label) || "";

const PAD_TYPE_MAP = { Entries: "1", Reports: "2", Utility: "3" };

const MenuMasterForm = ({
  mode, modules, groups = [],formData, setFormData, onSave, onCancel,
  saving, onDelete, onModify, onEditCancel, rights,
  currentRecord, totalRecords, activeTab, onTabChange, onNewEntry, onPrevRecord,
  onNextRecord,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const fieldDisabled = (fieldName) => {
    if (isView) return true;
    if (isEdit && (fieldName === "masmod_id" || fieldName === "pad_name")) return true;
    return false;
  };

  const saveBtnRef = useRef(null);
  const [errors, setErrors] = useState({});
  const containerRef = useRef(null);

  // ---- LOCAL TEXT STATE (ye typing ko free rehne deta hai) ----
  const [moduleText, setModuleText] = useState("");
  const [groupText, setGroupText] = useState("");
  const [itemTypeText, setItemTypeText] = useState("");
  const [applTypeText, setApplTypeText] = useState("");
  const [hideText, setHideText] = useState("");

  // Jab formData bahar se change ho (edit/view load, record navigate),
  // tab hi local text ko sync karo — typing ke dauraan overwrite mat karo
useEffect(() => {
    const mod = modules.find((m) => m.masmod_id === formData.masmod_id);
    setModuleText(mod?.mod_name || "");
    const grp = groups.find((g) => g.grp_id === formData.grp_id);
    setGroupText(grp?.grp_name || "");                // 👈
    setItemTypeText(ITEM_TYPE_MAP[formData.item_type] || "");
    setApplTypeText(APPL_TYPE_MAP[formData.appl_type] || "");
    setHideText(MENU_HIDE_MAP[formData.menu_hide || "N"] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.masmod_id, formData.grp_id, formData.item_type, formData.appl_type, formData.menu_hide, modules, groups]);

  useEffect(() => {
    if (!isView) {
      setTimeout(() => {
        const firstInput = containerRef.current?.querySelector("input:not([disabled]), select:not([disabled])");
        firstInput?.focus();
      }, 150);
    }
  }, [mode]);

 const handleKeyDown = (e) => {
  if (isView) return;

  const elements = Array.from(
    containerRef.current.querySelectorAll(
      "input:not([disabled]), select:not([disabled]), button:not([disabled]):not([tabindex='-1'])"
    )
  );
  const index = elements.indexOf(e.target);

  if (e.key === "Enter") {
    e.preventDefault();
    if (index > -1 && index < elements.length - 1) {
      elements[index + 1].focus();
    } else {
      focusSaveOrUpdateButton(saveBtnRef);
    }
    return;
  }

  // Shift + Backspace -> hamesha pichle field pe focus jump, content se farak nahi
  if (e.shiftKey && e.key === "Backspace") {
    e.preventDefault();
    if (index > 0) {
      elements[index - 1].focus();
    }
    return;
  }
};

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

 const handlePadChange = (val) => {
    setFormData({ ...formData, pad_name: val, pad_type: PAD_TYPE_MAP[val] || "1", grp_id: null });
    if (errors.pad_name) setErrors((p) => ({ ...p, pad_name: null }));
  };

  // ---- MODULE: typed text local, sirf match milne pe formData update ----
  const handleModuleChange = (typedValue) => {
    setModuleText(typedValue || "");
    const picked = modules.find((m) => m.mod_name === typedValue);
    if (picked) {
      setFormData({ ...formData, masmod_id: picked.masmod_id, grp_id: null });   // 👈
      if (errors.masmod_id) setErrors((p) => ({ ...p, masmod_id: null }));
    } else if (typedValue === "") {
      setFormData({ ...formData, masmod_id: "", grp_id: null });                 // 👈
    }
  };

  const handleItemTypeChange = (typedValue) => {
    setItemTypeText(typedValue || "");
    const code = codeFromLabel(ITEM_TYPE_MAP, typedValue);
    if (code) handleChange("item_type", code);
  };

  const handleApplTypeChange = (typedValue) => {
    setApplTypeText(typedValue || "");
    const code = codeFromLabel(APPL_TYPE_MAP, typedValue);
    if (code) handleChange("appl_type", code);
  };

  const handleHideChange = (typedValue) => {
    setHideText(typedValue || "");
    const code = codeFromLabel(MENU_HIDE_MAP, typedValue);
    if (code) handleChange("menu_hide", code);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.masmod_id) newErrors.masmod_id = "Required";
    if (!formData.pad_name) newErrors.pad_name = "Required";
    if (!formData.bar_name) newErrors.bar_name = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };


  const groupList = groups.filter(
    (g) => g.masmod_id === formData.masmod_id && g.pad_type === (formData.pad_type || "1")
  );

  const handleGroupChange = (typedValue) => {
    setGroupText(typedValue || "");
    const picked = groupList.find((g) => g.grp_name === typedValue);
    if (picked) setFormData({ ...formData, grp_id: picked.grp_id });
    else if (typedValue === "") setFormData({ ...formData, grp_id: null });
  };



  const moduleOptions = modules.map((m) => m.mod_name);

  return (
       <div className="w-full h-full  sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>


      <ERPHeader
        title="Menu Master"
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 sm:p-4 flex justify-center items-start overflow-y-auto">
        <div ref={containerRef} className="w-full max-w-[750px] mx-auto bg-white border rounded-lg p-4 sm:p-6 shadow-sm">

          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8 gap-y-3 sm:gap-y-4">
            {/* Module Select */}
            <div className="flex flex-col">
              <div className={fieldRowClass}>
                <label className={labelClass}>Module <span className="text-red-500">*</span></label>
                <ERPAutoComplete
                  disabled={fieldDisabled("masmod_id")}
                  className={`${inputClass} w-full sm:flex-1 ${errors.masmod_id ? "border-red-500" : ""}`}
                  value={moduleText}
                  onChange={handleModuleChange}
                  onKeyDown={handleKeyDown}
                  options={moduleOptions}
                />
              </div>
              {errors.masmod_id && <p className={`${errorText} ${errorMlClass}`}>{errors.masmod_id}</p>}
            </div>

            {/* Pad Name Select */}
            <div className="flex flex-col">
              <div className={fieldRowClass}>
                <label className={labelClass}>Pad Name <span className="text-red-500">*</span></label>
                <ERPAutoComplete
                  disabled={fieldDisabled("pad_name")}
                  className={`${inputClass} w-full sm:flex-1 ${errors.pad_name ? "border-red-500" : ""}`}
                  value={formData.pad_name || ""}
                  onChange={handlePadChange}
                  onKeyDown={handleKeyDown}
                  options={PAD_NAME_OPTIONS}
                />
              </div>
              {errors.pad_name && <p className={`${errorText} ${errorMlClass}`}>{errors.pad_name}</p>}
            </div>

          
            {/* Group Name */}
               <div className={fieldRowClass}>
                <label className={labelClass}>Group Name</label>
                <ERPAutoComplete
                  disabled={isView || !formData.masmod_id}
                  className={`${inputClass} w-full sm:flex-1`}
                  value={groupText}
                  onChange={handleGroupChange}
                  onKeyDown={handleKeyDown}
                  options={groupList.map((g) => g.grp_name)}
                  placeholder={formData.masmod_id ? "Select group" : "Select module first"}
                />
              </div>
            

            <div className={fieldRowClass}>
              <label className={labelClass}>Icon Name</label>
              <input
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1 sm:max-w-[195px]`}
                value={formData.icon_name || ""}
                placeholder="e.g. FaUsers"
                onChange={(e) => handleChange("icon_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            

            <div className={fieldRowClass}>
              <label className={labelClass}>Item Type</label>
              <ERPAutoComplete
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1`}
                value={itemTypeText}
                onChange={handleItemTypeChange}
                onKeyDown={handleKeyDown}
                options={ITEM_TYPE_OPTIONS}
              />
            </div>

            <div className={fieldRowClass}>
              <label className={labelClass}>Application Type</label>
              <ERPAutoComplete
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1`}
                value={applTypeText}
                onChange={handleApplTypeChange}
                onKeyDown={handleKeyDown}
                options={APPL_TYPE_OPTIONS}
              />
            </div>

            <div className="flex flex-col col-span-2">
              <div className={fieldRowClass}>
                <label className={labelClass}>Menu Name <span className="text-red-500">*</span></label>
                <input
                  disabled={isView}
                  className={`${inputClass} w-full sm:flex-1 ${errors.bar_name ? "border-red-500" : ""}`}
                  value={formData.bar_name || ""}
                  onChange={(e) => handleChange("bar_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {errors.bar_name && <p className={`${errorText} ${errorMlClass}`}>{errors.bar_name}</p>}
            </div>

            <div className={`${fieldRowClass} col-span-2`}>
              <label className={labelClass}>File Name</label>
              <input
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1`}
                value={formData.appl_name || ""}
                placeholder="e.g. UserMasterPage"
                onChange={(e) => handleChange("appl_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className={`${fieldRowClass} col-span-2`}>
              <label className={labelClass}>Parameters</label>
              <input
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1`}
                value={formData.appl_para || ""}
                onChange={(e) => handleChange("appl_para", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            

            <div className={fieldRowClass}>
              <label className={labelClass}>Is Hidden?</label>
              <ERPAutoComplete
                disabled={isView}
                className={`${inputClass} w-full sm:flex-1`}
                value={hideText}
                onChange={handleHideChange}
                onKeyDown={handleKeyDown}
                options={MENU_HIDE_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        saving={saving}
        saveBtnRef={saveBtnRef}
        handleSubmit={handleSubmit}
        onModify={rights.mod === 1 ? onModify : null}
        onDelete={rights.del === 1 ? onDelete : null}
        onEditCancel={onEditCancel}
        onCancel={onCancel}
        formData={formData}
        rights={rights}
        onNewEntry={onNewEntry}
      />
    </div>
  );
};

export default MenuMasterForm;
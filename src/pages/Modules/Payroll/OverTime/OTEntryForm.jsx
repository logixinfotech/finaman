// import React, { useState, useCallback, useEffect, useRef } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import { focusFirstInput, handleERPEnterNavigation,focusFirstError, handleERPBackspaceNavigation } from "../../../../utils/erpShortcuts";
// import { fetchGrades } from "../../../../utils/api";

// const OTEntryForm = ({
//   formData,
//   setFormData,
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
//   onTabChange,
//   initialData = {}
//   ,onPrevRecord,onNextRecord
// }) => {
//   const [errors, setErrors] = useState({});
//   const [gradeList, setGradeList] = useState([]);
//   const formRef = useRef(null);
//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";
//   const isAddMode = mode === "add";
//   const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
//   const requiredFields = ["grade_id", "applicable_day_type", "min_hours_required", "ot_multiplier"];
//   const saveBtnRef=useRef(null)
//   const fieldIndexMap = {
//   grade_id:   0,
//   min_hours_required:1,
// ot_multiplier:2,
// applicable_day_type:3,
// };


//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       focusFirstInput(formRef);
//     }
//   }, [isAddMode, isEditMode]);

//   useEffect(() => {
//     const loadGrades = async () => {
//       try {
//         const res = await fetchGrades();
//         const data = res?.data || res || [];
//         setGradeList(Array.isArray(data) ? data : []);
//       } catch (e) {
//         console.error("Grade fetch failed", e);
//       }
//     };
//     loadGrades();
//   }, []);

// const handleChange = (field, value) => {
//   if (["min_hours_required", "max_hours_allowed", "ot_multiplier"].includes(field)) {
//     value = value === "" ? "" : parseFloat(value);
//   }

//   setFormData((prev) => ({
//     ...prev,
//     [field]: value
//   }));

//   if (errors[field]) {
//     setErrors((prev) => ({
//       ...prev,
//       [field]: null
//     }));
//   }
// };
//  const getInputClass = (isDisabled, fieldName) =>
//   [
//     "w-full h-[31px] px-2 text-[16px]",
//     "border rounded-md outline-none transition-colors",
//     errors[fieldName] ? "border-red-500" : "border-gray-300",
//     isDisabled
//       ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
//       : "bg-white text-gray-900 focus:border-blue-300 focus:ring-1 focus:ring-blue-500",
//   ].join(" ");
//  const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     const newErrors = {};

//     requiredFields.forEach(field => {
//       if (!formData[field] || formData[field].toString().trim() === "") {
//         newErrors[field] = "Required";
//       }
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       // ✅ Error wali exact field pe focus
//       focusFirstError(formRef, newErrors, requiredFields, fieldIndexMap);
//       return;
//     }

//     if (onSave) onSave(formData);
//   }, [formData, onSave, isViewMode]);


//   const handleKeyDown = useCallback((e) => {
//     handleERPBackspaceNavigation(e, formRef, isViewMode);
//     handleERPEnterNavigation(
//       e,
//       formRef,
//       isViewMode,
//       saveBtnRef

//     );
//   }, [isViewMode]);


//   return (
//     <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
//       <ERPHeader
//         title="OT MASTER"
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

//       <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
//         <div ref={formRef} id="ot-form-container" className="w-full max-w-[800px] h-fit bg-white shadow-sm rounded-md border border-slate-200 overflow-visible relative">
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 relative">

//               {/* Left Column Group */}

//               <div className="space-y-4">

//                 {/* Grade Field - ADD THIS BLOCK */}
//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[15px] w-[80px] tracking-wide">
//                     Grade <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex-1">
//                     <ERPAutocomplete
//                       data-auto
//                       value={
//                         gradeList.find(g => Number(g.group_id) === Number(formData.grade_id))?.group_name || ""
//                       }
//                       options={gradeList.map(g => g.group_name)}
//                       onChange={(val) => {
//                         const selected = gradeList.find(g => g.group_name === val);
//                         setFormData(prev => ({
//                           ...prev,
//                            grade_id: Number(selected?.group_id) || null,
//                         }));
//                       }}
//                       disabled={isViewMode}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "grade_id")}
//                     />

//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[15px] w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Min Hours </label>
//                   <div className="flex-1">
//                     <input
//                       type="number"
//                       step="0.01"
//                       name="min_hours_required"
//                       placeholder="0.00"
//                       value={formData.min_hours_required ?? ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("min_hours_required", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={`${getInputClass(isViewMode, "min_hours_required")}`}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[15px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Multiplier <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <input
//                       type="number"
//                       step="0.01"
//                       name="ot_multiplier"
//                       placeholder="1.0"
//                       value={formData.ot_multiplier ?? ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("ot_multiplier", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={`${getInputClass(isViewMode, "ot_multiplier")}`}
//                     />
//                   </div>
//                 </div>



//               </div>



//               {/* Right Column Group */}
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[15px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Day Type <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <ERPAutocomplete
//                       data-auto
//                       value={formData.applicable_day_type || ""}
//                       options={["Day OT", "Holiday OT", "Weekoff OT"]}
//                       onChange={(val) => handleChange("applicable_day_type", val)}
//                       disabled={isViewMode}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "applicable_day_type")}
//                     />
//                   </div>
//                 </div>


//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[15px] w-[80px]  tracking-wide group-focus-within:text-blue-600 transition-colors">Max Hours</label>
//                   <div className="flex-1">
//                     <input
//                       type="number"
//                       step="0.01"
//                       name="max_hours_allowed"
//                       placeholder="None"
//                       value={formData.max_hours_allowed ?? ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("max_hours_allowed", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={`${getInputClass(isViewMode, "max_hours_allowed")}`}
//                     />
//                   </div>
//                 </div>
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

// export default OTEntryForm;
import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { focusFirstInput, focusFirstError } from "../../../../utils/erpShortcuts";
import { fetchGrades } from "../../../../utils/api";

const OTEntryForm = ({
  formData,
  setFormData,
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
  onTabChange,
  initialData = {},
  onPrevRecord,
  onNextRecord
}) => {
  const [errors, setErrors] = useState({});
  const [gradeList, setGradeList] = useState([]);
  const [gradeInput, setGradeInput] = useState("");
  
  const formRef = useRef(null);
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const requiredFields = ["grade_id", "applicable_day_type", "min_hours_required", "ot_multiplier"];
  const saveBtnRef = useRef(null);
  
  const fieldIndexMap = {
    grade_id: 0,
    applicable_day_type: 1,
    min_hours_required: 2,
    max_hours_allowed: 3,
    ot_multiplier: 4
  };

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  useEffect(() => {
    const loadGrades = async () => {
      try {
        const res = await fetchGrades();
        const data = res?.data || res || [];
        setGradeList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Grade fetch failed", e);
      }
    };
    loadGrades();
  }, []);

  useEffect(() => {
    const currentGrade = gradeList.find(g => Number(g.group_id) === Number(formData.grade_id));
    setGradeInput(currentGrade ? currentGrade.group_name : "");
  }, [formData.grade_id, gradeList]);

  const handleChange = (field, value) => {
    if (["min_hours_required", "max_hours_allowed", "ot_multiplier"].includes(field)) {
      value = value === "" ? "" : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const getInputClass = (isDisabled, fieldName) =>
    [
      "w-full h-[31px] px-2 text-[16px]",
      "border rounded-md outline-none transition-colors",
      errors[fieldName] ? "border-red-500" : "border-gray-300",
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-300 focus:ring-1 focus:ring-blue-500",
    ].join(" ");

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = "Required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      focusFirstError(formRef, newErrors, requiredFields, fieldIndexMap);
      return;
    }

    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode]);

  // Sidewise (Left-To-Right) Keyboard Navigation Control
  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = formRef.current;
    if (!container) return;

    // DOM order linear array extraction (Row structure se perfect mapping)
    const elements = Array.from(
      container.querySelectorAll("[data-auto], input:not([type='hidden']), textarea, select, [tabindex='0']")
    ).filter(el => !el.disabled && el.offsetParent !== null);

    const index = elements.indexOf(e.target);

    // 1. Enter Key -> Forward Sidewise (Left to Right)
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (index !== -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        saveBtnRef?.current?.focus();
      }
      return;
    }

    // 2. Backspace Key -> Smart Control (Delete single character first, then move backward)
    if (e.shiftKey&&e.key === "Backspace") {
      const el = e.target;
      let shouldGoBack = true;

      // Autocomplete ya direct selections me pure value ko flush / back track karein
      if (el.dataset.auto !== undefined || el.getAttribute('role') === 'combobox') {
        if (!el.value || el.value === "") {
          shouldGoBack = true;
        }
      } else {
        // Standard Text/Number Inputs validation
        try {
          if (typeof el.selectionStart === "number") {
            // Agar cursor zero position par hai ya input empty hai tabhi back jump karega
            shouldGoBack = el.selectionStart === 0 && el.selectionEnd === 0;
          } else if (!el.value || el.value === "") {
            shouldGoBack = true;
          }
        } catch (err) {
          if (!el.value || el.value === "") shouldGoBack = true;
        }
      }

     
        e.preventDefault();
        e.stopPropagation();
        elements[index - 1].focus();
      
    }
  }, [isViewMode]);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="OT MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        <div ref={formRef} id="ot-form-container" className="w-full max-w-[800px] h-fit bg-white shadow-sm rounded-md border border-slate-200 overflow-visible relative">
          <div className="p-6">
            
            {/* DOM Div Structural Alignment Fix: Left-to-Right Row grid architecture */}
            <div className="space-y-4">
              
              {/* ROW 1: Grade (Left) & Day Type (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <ERPAutocomplete
                      data-auto
                      value={gradeInput}
                      options={gradeList.map(g => g.group_name)}
                      onInputChange={(val) => {
                        setGradeInput(val || "");
                        const selected = gradeList.find(g => g.group_name === val);
                        setFormData(prev => ({
                          ...prev,
                          grade_id: selected ? Number(selected.group_id) : null
                        }));
                      }}
                      onChange={(val) => {
                        setGradeInput(val || "");
                        const selected = gradeList.find(g => g.group_name === val);
                        setFormData(prev => ({
                          ...prev,
                          grade_id: selected ? Number(selected.group_id) : null
                        }));
                      }}
                      disabled={isViewMode}
                      onKeyDown={handleKeyDown}
                      className={getInputClass(isViewMode, "grade_id")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide">Day Type <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <ERPAutocomplete
                      data-auto
                      value={formData.applicable_day_type || ""}
                      options={["Day OT", "Holiday OT", "Weekoff OT"]}
                      onChange={(val) => handleChange("applicable_day_type", val)}
                      disabled={isViewMode}
                      onKeyDown={handleKeyDown}
                      className={getInputClass(isViewMode, "applicable_day_type")}
                    />
                  </div>
                </div>
              </div>

              {/* ROW 2: Min Hours (Left) & Max Hours (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide">Min Hours </label>
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      name="min_hours_required"
                      placeholder="0.00"
                      value={formData.min_hours_required ?? ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("min_hours_required", e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`${getInputClass(isViewMode, "min_hours_required")}`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide">Max Hours</label>
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      name="max_hours_allowed"
                      placeholder="None"
                      value={formData.max_hours_allowed ?? ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("max_hours_allowed", e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`${getInputClass(isViewMode, "max_hours_allowed")}`}
                    />
                  </div>
                </div>
              </div>

              {/* ROW 3: Multiplier (Left) & Blank Space Alignment (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide">Multiplier <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      name="ot_multiplier"
                      placeholder="1.0"
                      value={formData.ot_multiplier ?? ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("ot_multiplier", e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`${getInputClass(isViewMode, "ot_multiplier")}`}
                    />
                  </div>
                </div>
                {/* Visual Alignment Counter-part empty div block */}
                <div className="hidden md:block w-[80px]"></div>
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

export default OTEntryForm;
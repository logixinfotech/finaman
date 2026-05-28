import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";

const ShiftMasterForm = ({
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
  formData,
  setFormData,
  initialData = {}
}) => {
 
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
   const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

 const requiredFields = ["shift_name", "start_time", "end_time"];
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]); 
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("shift-form-container");
        const firstInput = container?.querySelector("input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[30px] px-2 text-[16px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    let firstEmptyField = null;

    for (const field of requiredFields) {
      let val = formData[field];
      if (!val || val.toString().trim() === "") {
        newErrors[field] = "Required";
        if (!firstEmptyField) firstEmptyField = field;
      }
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        if (firstEmptyField) {
          const targetInput = document.querySelector(`input[name="${firstEmptyField}"]:not([disabled])`);
          if (targetInput) targetInput.focus();
        }
      }, 50);
      return;
    }
    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode, requiredFields]);

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      const container = document.getElementById("shift-form-container");
      if (!container) return;

      const focusableElements = Array.from(
        container.querySelectorAll("input:not([disabled]), textarea:not([disabled])")
      );
      const index = focusableElements.indexOf(e.target);

      if (e.key === "Enter") {
        e.preventDefault();
        if (index > -1) {
          if (index < focusableElements.length - 1) {
            focusableElements[index + 1].focus();
          } else {
            const allButtons = Array.from(document.querySelectorAll("button"));
            const saveBtn = allButtons.find((btn) =>
              btn.textContent.toLowerCase().includes("save") && !btn.disabled
            );
            if (saveBtn) saveBtn.focus();
            else handleValidateAndSave();
          }
        }
      }

      if (e.key === "Backspace") {
        const target = e.target;
        const targetType = target.type;
        let shouldJumpBack = false;

        if (targetType === "time") {
          if (target.value === "" && !target.validity.badInput) {
            shouldJumpBack = true;
          }
        } else if (targetType === "number") {
          if (target.value === "") shouldJumpBack = true;
        } else if (targetType === "checkbox") {
          shouldJumpBack = false;
        } else {
          if (target.selectionStart === 0 && target.selectionEnd === 0) {
            shouldJumpBack = true;
          }
        }

        if (shouldJumpBack && index > 0) {
          e.preventDefault();
          const prevField = focusableElements[index - 1];
          prevField.focus();

          setTimeout(() => {
            if (prevField.setSelectionRange && prevField.type === "text") {
              const len = prevField.value?.length || 0;
              prevField.setSelectionRange(len, len);
            }
          }, 0);
        }
      }
    },
    [isViewMode, handleValidateAndSave]
  );
  

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="SHIFT ENTRY "
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div id="shift-form-container" className="w-full max-w-[800px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
          <div className="p-3 grid grid-cols-1 gap-y-3">
            {/* Shift Name */}
            <div className="flex flex-col sm:flex-row items-center px-1">
              <label className="text-black-800 text-[15px] w-[100px] shrink-0">Shift Name <span className="text-red-500">*</span></label>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  name="shift_name"  
                  value={formData.shift_name || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("shift_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "shift_name")}
                />
              </div>
            </div>

            {/* Start & End Time */}
            <div className="flex flex-col sm:flex-row sm:gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[100px] shrink-0">Start Time <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full">
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("start_time", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "start_time")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] shrink-0">End Time <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full">
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("end_time", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "end_time")}
                  />
                </div>
              </div>
            </div>

            {/* Grace Mins */}
            <div className="flex flex-col sm:flex-row sm:gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1">
                <label className="text-black-800 text-[15px]  w-[100px] shrink-0">Grace In</label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    name="grace_in_minutes"
                    value={formData.grace_in_minutes || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("grace_in_minutes", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "grace_in_minutes")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px]  sm:w-[100px] shrink-0">Grace Out</label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    name="grace_out_minutes"
                    value={formData.grace_out_minutes || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("grace_out_minutes", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "grace_out_minutes")}
                  />
                </div>
              </div>
            </div>

            {/* Day Hours */}
            <div className="flex flex-col sm:flex-row sm:gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[100px] shrink-0">Full Day Hrs</label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    step="0.01"
                    name="full_day_hours"
                    value={formData.full_day_hours || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("full_day_hours", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "full_day_hours")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] shrink-0">Half Day Hrs</label>
                <div className="flex-1 w-full">
                  <input
                    type="number"
                    step="0.01"
                    name="half_day_hours"
                    value={formData.half_day_hours || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("half_day_hours", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "half_day_hours")}
                  />
                </div>
              </div>
            </div>

            {/* Night Shift Checkbox */}
            <div className="flex items-center px-1 mt-1">
              <label className="text-black-800 text-[15px] w-[100px] shrink-0 cursor-pointer" htmlFor="is_night_shift">Night Shift</label>
              <input
                type="checkbox"
                id="is_night_shift"
                name="is_night_shift"
                checked={!!formData.is_night_shift}
                disabled={isViewMode}
                onChange={(e) => handleChange("is_night_shift", e.target.checked ? 1 : 0)}
                onKeyDown={handleKeyDown}
                className="w-4 h-4 cursor-pointer"
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

export default ShiftMasterForm;
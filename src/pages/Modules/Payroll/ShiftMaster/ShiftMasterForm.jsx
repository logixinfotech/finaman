import React, { useState, useCallback, useEffect, useRef } from "react";
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
  , onPrevRecord, onNextRecord
}) => {

  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = ["shift_name", "start_time", "end_time"];

  // Only reset formData when initialData's actual content changes —
  // not every time a new (but identical) {} reference is passed in from the parent.
  const initialDataRef = useRef(null);
  useEffect(() => {
    const serialized = JSON.stringify(initialData);
    if (serialized !== initialDataRef.current) {
      initialDataRef.current = serialized;
      setFormData(initialData);
    }
  }, [initialData, setFormData]);

  // Calculates Full Day Hrs from Start Time & End Time.
  // Handles overnight/night shifts where end_time is on the next day.
  const calculateFullDayHours = useCallback((start, end) => {
    if (!start || !end) return "";

    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    if (
      Number.isNaN(startH) ||
      Number.isNaN(startM) ||
      Number.isNaN(endH) ||
      Number.isNaN(endM)
    ) {
      return "";
    }

    let startTotalMins = startH * 60 + startM;
    let endTotalMins = endH * 60 + endM;

    // If end time is at/before start time, assume it rolls over to the next day
    if (endTotalMins <= startTotalMins) {
      endTotalMins += 24 * 60;
    }

    const diffTotalMins = endTotalMins - startTotalMins;
    const hrs = Math.floor(diffTotalMins / 60);
    const mins = diffTotalMins % 60;
    return `${hrs}hr${mins}min`;
  }, []);

  // Returns "AM" or "PM" for a given "HH:MM" (24-hr) time string
  const getAmPm = useCallback((time) => {
    if (!time) return "";
    const [h] = time.split(":").map(Number);
    if (Number.isNaN(h)) return "";
    return h >= 12 ? "PM" : "AM";
  }, []);
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("shift-form-container");
        const firstInput = container?.querySelector("input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);
  const saveBtnRef = useRef(null)

  // const handleChange = (field, value) => {
  //   setFormData((prev) => {
  //     const updated = { ...prev, [field]: value };

  //     // Whenever Start Time or End Time changes, recalculate Full Day Hrs
  //     // in the SAME update — no separate effect, no timing/race issues.
  //     if (field === "start_time" || field === "end_time") {
  //       const newStart = field === "start_time" ? value : prev.start_time;
  //       const newEnd = field === "end_time" ? value : prev.end_time;
  //       updated.full_day_hours = calculateFullDayHours(newStart, newEnd);
  //     }

  //     return updated;
  //   });
  //   if (errors[field]) {
  //     setErrors((prev) => {
  //       const newErrs = { ...prev };
  //       delete newErrs[field];
  //       return newErrs;
  //     });
  //   }
  // };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      // Checkbox mapping ko normalise karein
      const updatedValue = field === "is_night_shift" ? (value ? 1 : 0) : value;
      const updated = { ...prev, [field]: updatedValue };

      if (field === "start_time" || field === "end_time") {
        const newStart = field === "start_time" ? value : prev.start_time;
        const newEnd = field === "end_time" ? value : prev.end_time;
        updated.full_day_hours = calculateFullDayHours(newStart, newEnd);
      }
      return updated;
    });
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
            saveBtnRef?.current?.focus();
          }
        }
      }

      if (e.shiftKey && e.key === "Backspace") {
        const target = e.target;
        const targetType = target.type;
        let shouldJumpBack = true;

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

        if (shouldJumpBack) {
          // Always block the default character-delete when shift+backspace is pressed
          e.preventDefault();

          // If there's no previous field (e.g. we're on the first field),
          // do nothing at all — no navigation, no value change, no error.
          if (index <= 0) return;

          const prevField = focusableElements[index - 1];
          if (!prevField) return;

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
    <div className="w-full h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="Shift Master"
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

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div id="shift-form-container" className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
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
                <div className="flex-1 w-full flex items-center gap-2">
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("start_time", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "start_time")}
                  />
                  <span className="w-9 shrink-0 text-[13px] font-medium text-gray-500">
                    {getAmPm(formData.start_time)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] shrink-0">End Time <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full flex items-center gap-2">
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("end_time", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "end_time")}
                  />
                  <span className="w-9 shrink-0 text-[13px] font-medium text-gray-500">
                    {getAmPm(formData.end_time)}
                  </span>
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
                    placeholder="In Minutes"
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
                    placeholder="In Minutes"
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
                    type="text"
                    name="full_day_hours"
                    // 🛠️ YAHAN CHANGE HAI: Agar data numeric decimal (10.8) hai, toh use format karein, 
                    // warna agar string calculation chal rahi hai toh direct chalne dein.
                    value={
                      formData.full_day_hours && !isNaN(formData.full_day_hours)
                        ? `${Math.floor(formData.full_day_hours)}hr ${Math.round((formData.full_day_hours % 1) * 60)}min`
                        : formData.full_day_hours || ""
                    }
                    disabled
                    readOnly
                    title="Auto-calculated from Start Time and End Time"
                    className={getInputClass(true, "full_day_hours")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] shrink-0">Half Day Hrs</label>
                <div className="flex-1 w-full">
                  <input
                    type={isViewMode ? "text" : "number"}
                    step="0.5"
                    name="half_day_hours"
                    value={isViewMode
                      ? (() => {
                        const val = parseFloat(formData.half_day_hours);
                        if (!val) return "";
                        const hrs = Math.floor(val);
                        const mins = Math.round((val - hrs) * 60);
                        return mins > 0 ? `${hrs}hr ${mins}min` : `${hrs}hr`;
                      })()
                      : formData.half_day_hours || ""
                    }
                    disabled={isViewMode}
                    onChange={e => handleChange("half_day_hours", e.target.value)}
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
        saveBtnRef={saveBtnRef}
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
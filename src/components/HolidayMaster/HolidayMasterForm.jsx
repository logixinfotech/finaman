import React, { useState, useRef, useCallback, useEffect } from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../components/Reusable/input/Date";
import ERPAutocomplete from "../Reusable/input/ERPAutocomplete";

const HOLIDAY_TYPE_OPTIONS = ["National", "Festival", "Restricted"];

const HolidayMasterForm = ({
  formData = {},
  setFormData,
  onPrevRecord,
  onNextRecord,
  onSave,
  activeTab = "entry",
  onTabChange,
  onCancel,
  onDelete,
  onEditCancel,
  mode,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  rights,
}) => {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const [errors, setErrors] = useState({});
  const requiredFields = ["date", "purpose"]; // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("holiday-form-container");
        const firstInput = container?.querySelector("input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    let updated = { ...formData, [field]: value };
    if (field === "holiday_type_code") {
      updated.is_restricted = value === "Restricted" ? 1 : 0;
    }
    setFormData(updated);
    if (errors[field]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };
  const saveBtnRef = useRef(null);
  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[30px] px-2 text-[15px] border rounded-md outline-none transition-colors ${
      errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    let newErrors = {};
    let firstEmptyField = null;

    for (const field of requiredFields) {
      let val = formData[field];
      let isEmpty = !val || val.toString().trim() === "";

      if (field === "date" && val && typeof val === "string") {
        const cleanVal = val.replace(/[^a-zA-Z0-9]/g, "").trim();
        if (cleanVal === "") {
          isEmpty = true;
        }
      }

      if (isEmpty) {
        newErrors[field] = "Required";
        if (!firstEmptyField) firstEmptyField = field;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      setTimeout(() => {
        let targetInput = null;

        if (firstEmptyField === "date") {
          const dateWrapper = document.getElementById("date-input-wrapper");
          if (dateWrapper) {
            targetInput = dateWrapper.querySelector("input:not([disabled])");
          }
        } else if (firstEmptyField === "purpose") {
          targetInput = document.querySelector(
            'input[name="purpose"]:not([disabled])',
          );
        }

        if (targetInput) targetInput.focus();
      }, 50);

      return;
    }

    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode, requiredFields]);

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      const container = document.getElementById("holiday-form-container");
      if (!container) return;

      const focusableElements = Array.from(
        container.querySelectorAll(
          "input:not([disabled]), textarea:not([disabled])",
        ),
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
        e.preventDefault();
        const prevField = focusableElements[index - 1];
        if (prevField) {
          prevField.focus();
          setTimeout(() => {
            if (prevField.setSelectionRange) {
              const len = prevField.value?.length || 0;
              prevField.setSelectionRange(len, len);
            }
          }, 0);
        }
      }
    },
    [isViewMode, handleValidateAndSave], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const currentHolidayType = formData.holiday_type_code || (formData.is_restricted ? "Restricted" : "Festival");

  return (
    <div
      className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Holiday Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div
          id="holiday-form-container"
          className="w-full max-w-[750px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-visible"
        >
          <div className="p-3 sm:p-5 grid grid-cols-1 gap-y-3 sm:gap-y-4">
            {/* Row 1: Date + Holiday Type */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
              <div
                id="date-input-wrapper"
                className="flex flex-row items-center px-1 flex-1"
              >
                <label className="text-gray-800 text-[14px] w-[80px] shrink-0">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="flex-1">
                  <ERPDateInput
                    value={formData.date || ""}
                    onChange={(val) => handleChange("date", val)}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "date")}
                  />
                </div>
              </div>

              <div className="flex flex-row items-center px-1 flex-1">
                <label className="text-gray-800 text-[14px] w-[95px] shrink-0">
                  Holiday Type
                </label>
                <div className="flex-1">
                  <ERPAutocomplete
                    options={HOLIDAY_TYPE_OPTIONS}
                    value={currentHolidayType}
                    onChange={(val) => handleChange("holiday_type_code", val)}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "holiday_type_code")}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Purpose */}
            <div className="flex flex-row items-center px-1 w-full">
              <label className="text-gray-800 text-[14px] w-[80px] shrink-0">
                Purpose <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "purpose")}
                  placeholder="Enter holiday purpose (e.g. Independence Day, Diwali, Eid)"
                />
              </div>
            </div>

            {/* Row 3: Remarks */}
            <div className="flex flex-col sm:flex-row items-start px-1 w-full">
              <label className="text-gray-800 text-[14px] w-[80px] shrink-0 mt-1">
                Remarks
              </label>
              <div className="flex-1 w-full">
                <textarea
                  rows="2"
                  value={formData.remarks || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "remarks")} h-[40px] py-2`}
                  placeholder="Enter additional remarks"
                />
              </div>
            </div>

            {/* Restricted Holiday Info Banner */}
            {currentHolidayType === "Restricted" && (
              <div className="mx-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-[12px] text-amber-800 flex items-center gap-2">
                <span className="font-bold">ℹ️ Restricted Holiday:</span>
                <span>The office remains open. Eligible employees can apply for this date using their 2-day yearly RH balance.</span>
              </div>
            )}
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

export default HolidayMasterForm;

import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";

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
  initialData = {}
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const requiredFields = ["applicable_day_type", "min_hours_required", "ot_multiplier"];

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("ot-form-container");
        const firstInput = container?.querySelector("input:not([disabled]), select:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    if (["min_hours_required", "max_hours_allowed", "ot_multiplier"].includes(field)) {
      value = value === "" ? "" : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const getInputClass = (isDisabled, fieldName) =>
    [
      "w-full h-[27px] px-1.5 text-[13px]",
      "border rounded-[2px] outline-none transition-colors",
      errors[fieldName] ? "border-red-500" : "border-gray-300",
      isDisabled
        ? "bg-[#eef1f6] text-gray-400 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100",
    ].join(" ");

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    let firstEmptyField = null;

    for (const field of requiredFields) {
      let val = formData[field];
      if (val === undefined || val === null || val.toString().trim() === "") {
        newErrors[field] = "Required";
        if (!firstEmptyField) firstEmptyField = field;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode, requiredFields]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("ot-form-container");
    const focusableElements = Array.from(
      container.querySelectorAll("input:not([disabled]), select:not([disabled])")
    );
    const index = focusableElements.indexOf(e.target);

    if (e.key === "Enter") {
      e.preventDefault();
      if (index > -1 && index < focusableElements.length - 1) {
        focusableElements[index + 1].focus();
      } else {
        handleValidateAndSave();
      }
    }
  }, [isViewMode, handleValidateAndSave]);


  return (
    <div className="w-full max-w-[600px] mx-auto h-[calc(100vh-140px)] bg-[#f3f4f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="OT MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        <div id="ot-form-container" className="w-full  rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 relative">

              {/* Left Column Group */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                  <label className="text-slate-900 text-[13px] w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Min Hours <span className="text-red-500">*</span></label>
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
                      className={`${getInputClass(isViewMode, "min_hours_required")} h-[27px] !rounded-[6px] shadow-sm border-slate-300 focus:ring-2 focus:ring-blue-100`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-900 text-[13px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Day Type <span className="text-red-500">*</span></label>
                  <div className="flex-1">
                    <select
                      name="applicable_day_type"
                      value={formData.applicable_day_type || ""}
                      disabled={isViewMode}
                      onChange={(e) => handleChange("applicable_day_type", e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`${getInputClass(isViewMode, "applicable_day_type")} h-[27px] !rounded-[4px] shadow-sm border-slate-300 focus:ring-2 focus:ring-blue-100`}
                    >
                      <option value="">Select Day Type</option>
                      <option value="Day OT">Day OT</option>
                      <option value="Holiday OT">Holiday OT</option>
                      <option value="Weekoff OT">Weekoff OT</option>
                    </select>
                  </div>
                </div>               
              </div>

              {/* Vertical Divider (Hidden on Mobile) */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-100"></div>

              {/* Right Column Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-slate-900 text-[13px] w-[80px]  tracking-wide group-focus-within:text-blue-600 transition-colors">Max Hours</label>
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
                      className={`${getInputClass(isViewMode, "max_hours_allowed")} h-[27px] !rounded-[4px] shadow-sm border-slate-300 focus:ring-2 focus:ring-blue-100`}
                    />
                  </div>
                </div>


                <div className="flex items-center gap-2">
                  <label className="text-slate-900 text-[13px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Multiplier <span className="text-red-500">*</span></label>
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
                      className={`${getInputClass(isViewMode, "ot_multiplier")} h-[27px] !rounded-[4px] shadow-sm border-slate-300 focus:ring-2 focus:ring-blue-100`}
                    />
                  </div>
                </div>
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
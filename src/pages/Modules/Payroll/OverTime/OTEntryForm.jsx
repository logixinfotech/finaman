import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { focusFirstInput, handleERPEnterNavigation } from "../../../../utils/erpShortcuts";

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
  const formRef = useRef(null);
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const requiredFields = ["applicable_day_type", "min_hours_required", "ot_multiplier"];

useEffect(() => {
  if (isAddMode || isEditMode) {
    focusFirstInput(formRef);
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
      "w-full h-[31px] px-2 text-[16px]",
      "border rounded-md outline-none transition-colors",
      errors[fieldName] ? "border-red-500" : "border-gray-300",
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
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
  handleERPEnterNavigation(
    e,
    formRef,
    isViewMode
  );}, [isViewMode]);


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
      />

      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        <div ref={formRef} id="ot-form-container" className="w-full max-w-[800px] h-fit bg-white shadow-sm rounded-md border border-slate-200 overflow-visible relative">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 relative">

              {/* Left Column Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Min Hours </label>
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
                  <label className="text-black-800 text-[15px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Day Type <span className="text-red-500">*</span></label>
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



              {/* Right Column Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px] w-[80px]  tracking-wide group-focus-within:text-blue-600 transition-colors">Max Hours</label>
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


                <div className="flex items-center gap-2">
                  <label className="text-black-800 text-[15px]  w-[80px] tracking-wide group-focus-within:text-blue-600 transition-colors">Multiplier <span className="text-red-500">*</span></label>
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
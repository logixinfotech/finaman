
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  onTabChange = () => { },
  initialData = {}, onPrevRecord, onNextRecord
}) => {
  const [errors, setErrors] = useState({});
  const saveBtnRef = useRef(null)
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

  const getInputClass = (disabled, field) => {
    const base = "h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md outline-none transition-all w-full";
    const state = disabled
      ? "bg-gray-100 cursor-not-allowed border-gray-200"
      : "bg-white";
    const border = errors[field]
      ? "border-red-500"
      : "border-gray-300";
    const focus = !disabled
      ? "focus:border-blue-50 focus:ring-1 focus:ring-[#1a56db]"
      : "";
    return `${base} ${state} ${border} ${focus}`;
  };
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
            try { el.setSelectionRange(len, len); } catch { }
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
    const elements = Array.from(container.querySelectorAll("input:not([disabled])"));
    const index = elements.indexOf(e.target);
    if (e.key === "Enter") {
      e.preventDefault();
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
      else if (index === elements.length - 1) {
        saveBtnRef?.current?.focus();
      }
    }
    if (e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      elements[index - 1].focus();
    }
  }, [formData, isViewMode, handleValidateAndSave]);

  return (
    <div className="w-full  h-full md:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="Deduction Head Master"
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

      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        <div id="deduction-form-container" className="w-full bg-white border rounded-md p-3 md:p-4 mx-auto max-w-[750px]">
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="col-span-2 flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap">
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
            <div className="flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap">
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
          <div className="grid grid-cols-4 gap-.5 md:gap-4">
            <div className="flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap mr-2">
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
            <div className="flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap">Pre-Tax</label>
              <ERPAutocomplete
                value={formData.preTax ?? "Yes"}
                options={["Yes", "No"]}
                onChange={(val) => handleChange("preTax", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "preTax")}
              />
            </div>
            <div className="flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap">Status</label>
              <ERPAutocomplete
                value={formData.status || ""}
                options={["Active", "Inactive"]}
                onChange={(val) => handleChange("status", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "status")}
              />
            </div>
            <div className="col-span-1 flex flex-row items-center gap-0.5 md:gap-2">
              <label className="text-[10px] md:text-sm font-medium whitespace-nowrap">
                Max Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                name="max_amount"
                value={formData.max_amount ?? ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("max_amount", e.target.value)}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "max_amount")}
              />
            </div>
          </div>
        </div>
      </div>
      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saveBtnRef={saveBtnRef}
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
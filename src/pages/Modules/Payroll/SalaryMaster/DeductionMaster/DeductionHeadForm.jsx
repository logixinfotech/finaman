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
        const firstInput = document.querySelector(
          "#deduction-form-container input:not([disabled])"
        );
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

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

  const getInputClass = (disabled, field) =>
    `h-[30px] px-2 text-[15px] border rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

  // 🔥 VALIDATION (SAME)
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
  useEffect(() => {
    if (mode === "add" || mode === "edit") {
      const timer = setTimeout(() => {
        const container = document.getElementById("deduction-form-container");
        if (!container) return;        const firstInput = container.querySelector(
          'input:not([disabled]), [tabindex="0"]:not([disabled])'
        );

        if (firstInput) {
          firstInput.focus();
          
          if (firstInput.tagName === "INPUT" && firstInput.type === "text") {
            const val = firstInput.value || "";
            firstInput.setSelectionRange(val.length, val.length);
          }
        }
      }, 150); 

      return () => clearTimeout(timer);
    }
  }, [mode]);  

  // 🔥 KEYBOARD NAVIGATION (EXACT SAME)
  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;

    const container = document.getElementById("deduction-form-container");
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll(
        "input:not([disabled]), [tabindex='0'], [data-auto]"
      )
    ).filter(el => !el.disabled);

    const index = elements.indexOf(e.target);

    // ✅ ENTER → NEXT / SAVE
    if (e.key === "Enter") {
      e.preventDefault();

      if (index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        const saveBtn = document.querySelector("#save")||document.querySelector("#update")
         

        if (saveBtn) saveBtn.focus();
      }
    }

    // ✅ BACKSPACE → PREVIOUS
    if (e.key === "Backspace") {
      let shouldGoBack = false;

      if (e.target.tagName === "INPUT") {
        const isEmpty = e.target.value === "";
        const atStart =
          e.target.selectionStart === 0 && e.target.selectionEnd === 0;

        if (isEmpty || atStart) shouldGoBack = true;
      }

      if (e.target.dataset.auto) shouldGoBack = true;
      if (e.target.dataset.toggle === "status") shouldGoBack = true;

      if (shouldGoBack && index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }

    // ✅ SPACE → TOGGLE STATUS
    if (e.key === " " && e.target.dataset.toggle === "status") {
      e.preventDefault();
      handleChange(
        "status",
        formData.status === "Active" ? "Inactive" : "Active"
      );
    }

  }, [formData, isViewMode, handleValidateAndSave]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >

      <ERPHeader
        title="DEDUCTION HEAD ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 flex justify-center items-start">
        <div
          id="deduction-form-container"
          className="w-full max-w-[800px] bg-white border rounded-md p-4"
        >

          {/* ROW 1 */}
          <div className="grid grid-cols-3 gap-6">

            <div className="col-span-2 flex items-center gap-2">
              <label className="w-[75px]">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name || ""}
                disabled={isViewMode}
                onChange={e => handleChange("name", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "name")} flex-1`}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-[60px]">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                value={formData.code || ""}
                disabled={isViewMode}
                onChange={e => handleChange("code", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "code")} w-[100px]`}
              />
            </div>

          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-3 gap-7 mt-4">

            <div className="flex items-center gap-2">
              <label className="w-[130px]">
                Type <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                value={formData.type || ""}
                options={["Fixed", "Variable", "Percentage"]}
                onChange={(val) => handleChange("type", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "type")}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-[90px]">Pre-Tax</label>
              <ERPAutocomplete
                data-auto
                value={formData.preTax ?? "Yes"}
                options={["Yes", "No"]}
                onChange={(val) => handleChange("preTax", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "preTax")}
              />
            </div>

            <div className="flex items-center gap-5">
              <label className="w-[50px]">Status</label>

              <div
                tabIndex={0}
                data-toggle="status"
                onKeyDown={handleKeyDown}
                onClick={() =>
                  !isViewMode &&
                  handleChange(
                    "status",
                    formData.status === "Active" ? "Inactive" : "Active"
                  )
                }
                className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px]
                  ${formData.status === "Active" ? "bg-green-500" : "bg-gray-400"}
                `}
              >
                <div
                  className={`h-[18px] w-[18px] bg-white rounded-full transition-all
                    ${formData.status === "Active" ? "translate-x-[20px]" : ""}
                  `}
                />
              </div>

              <span className="text-sm">{formData.status || "Active"}</span>
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
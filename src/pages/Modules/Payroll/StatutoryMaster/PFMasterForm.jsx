import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const PFMasterForm = ({
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
    onTabChange = () => {},
    formData,
    setFormData
  }) => {

    const [errors, setErrors]     = useState({});

    const isViewMode = mode === "view";
    const isAddMode  = mode === "add";
    const isEditMode = mode === "edit";

    const requiredFields = ["name"];

   

    useEffect(() => {
      if (isAddMode || isEditMode) {
        setTimeout(() => {
          const firstInput = document.querySelector("#pf-form-container input:not([disabled])");
          if (firstInput) firstInput.focus();
        }, 150);
      }
    }, [isAddMode, isEditMode]);

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
      }
    };

    const handleEmployerRateChange = (val) => {
      const rate = parseFloat(val) || 0;
      handleChange("employer_rate", val);
      const eps = Math.min(8.33, rate);
      const epf = Math.max(0, parseFloat((rate - eps).toFixed(2)));
      handleChange("eps_rate", eps);
      handleChange("epf_rate", epf);
    };

    const getInputClass = (disabled, field) =>
      `h-[30px] px-2 text-[15px] border rounded-md ${
        errors[field] ? "border-red-500" : "border-gray-300"
      } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

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

    const handleKeyDown = useCallback((e) => {
      if (isViewMode) return;
      const container = document.getElementById("pf-form-container");
      if (!container) return;

      const elements = Array.from(
        container.querySelectorAll("[data-auto], input, textarea, select, button")
      )
      .filter(el => !el.disabled && el.offsetParent !== null)
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        if (Math.abs(aRect.top - bRect.top) > 5) return aRect.top - bRect.top;
        return aRect.left - bRect.left;
      });

      const index = elements.indexOf(e.target);

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else {
          const saveBtn = document.querySelector("[save]");
          if (saveBtn) saveBtn.focus();
        }
      }

      if (e.key === "Backspace") {
        const el = e.target;
        const isText = el.tagName === "INPUT" && ["text","number","search"].includes(el.type);
        let shouldGoBack = false;
        if (isText) {
          const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
          if (el.value === "" || atStart) shouldGoBack = true;
        }
        if (shouldGoBack && index > 0) {
          e.preventDefault();
          let prev = index - 1;
          while (prev >= 0) {
            const prevEl = elements[prev];
            if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
              prevEl.focus();
              if (prevEl.tagName === "INPUT" && typeof prevEl.setSelectionRange === "function") {
                const len = prevEl.value?.length || 0;
                try { prevEl.setSelectionRange(len, len); } catch {}
              }
              break;
            }
            prev--;
          }
        }
      }

      if (e.key === " " && e.target.dataset.toggle === "status") {
        e.preventDefault();
        handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
      }
    }, [isViewMode, formData]);

    return (
      <div
        className="w-full max-w-[700px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
        style={{ fontFamily: FONT }}
      >
        <ERPHeader
          title="PF MASTER ENTRY"
          isAddMode={isAddMode}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          activeTab={activeTab}
          onTabChange={onTabChange}
          rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        />

        <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
          <div
            id="pf-form-container"
            className="w-full bg-white border rounded-md p-4 flex flex-col gap-4"
          >

            {/* Row 1 — Name + Applicable From */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-[150px]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name || ""}
                  disabled={isViewMode}
                  onChange={e => handleChange("name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Standard PF"
                  className={`${getInputClass(isViewMode, "name")} flex-1`}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[150px]">Applicable From</label>
                <ERPDateInput
                  value={formData.applicable_from || ""}
                  disabled={isViewMode}
                  onChange={value => handleChange("applicable_from", value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "applicable_from")} flex-1`}
                />
              </div>
            </div>

            {/* Row 2 — Employee Rate + Employer Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-[150px]">Employee Rate %</label>
                <input
                  name="employee_rate"
                  type="number"
                  min="0" max="100" step="0.01"
                  value={formData.employee_rate ?? 12}
                  disabled={isViewMode}
                  onChange={e => handleChange("employee_rate", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "employee_rate")} w-[170px]`}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[150px]">Employer Rate %</label>
                <input
                  name="employer_rate"
                  type="number"
                  min="0" max="100" step="0.01"
                  value={formData.employer_rate ?? 12}
                  disabled={isViewMode}
                  onChange={e => handleEmployerRateChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "employer_rate")} w-[170px]`}
                />
              </div>
            </div>

            {/* Row 3 — EPS Rate + EPF Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-[150px] text-gray-500">EPS Rate %</label>
                <input
                  name="eps_rate"
                  type="number"
                  step="0.01"
                  value={formData.eps_rate ?? 8.33}
                  disabled={isViewMode}
                  onChange={e => handleChange("eps_rate", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "eps_rate")} w-[170px]`}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[150px] text-gray-500">EPF Rate %</label>
                <input
                  name="epf_rate"
                  type="number"
                  step="0.01"
                  value={formData.epf_rate ?? 3.67}
                  disabled={isViewMode}
                  onChange={e => handleChange("epf_rate", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "epf_rate")} w-[170px]`}
                />
              </div>
            </div>

            {/* Row 4 — Wage Ceiling + Apply Ceiling */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-[150px]">Wage Ceiling (₹)</label>
                <input
                  name="wage_ceiling"
                  type="number"
                  min="0"
                  value={formData.wage_ceiling ?? 15000}
                  disabled={isViewMode}
                  onChange={e => handleChange("wage_ceiling", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "wage_ceiling")} w-[170px]`}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[150px]">Apply Ceiling</label>
                <ERPAutocomplete
                  data-auto
                  options={["Yes", "No"]}
                  value={formData.apply_ceiling || "Yes"}
                  onChange={val => handleChange("apply_ceiling", val)}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "apply_ceiling")} w-[170px]`}
                />
              </div>
            </div>

            {/* Row 5 — Status + Info box */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-[150px]">Status</label>
                <div
                  tabIndex={0}
                  data-auto
                  data-toggle="status"
                  onKeyDown={handleKeyDown}
                  onClick={() =>
                    !isViewMode &&
                    handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
                  }
                  className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
                    formData.status === "Active" ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  <div className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                    formData.status === "Active" ? "translate-x-[20px]" : ""
                  }`} />
                </div>
                <span className="ml-[12px] text-sm">{formData.status || "Active"}</span>
              </div>

              {/* Info box — same col width as other fields */}
              <div className="flex items-center gap-3">
                <label className="w-[150px] text-gray-400 text-[12px]">Split info</label>
                <div className="text-[12px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1">
                  Employer {formData.employer_rate || 12}% →
                  EPS {formData.eps_rate ?? 8.33}% + EPF {formData.epf_rate ?? 3.67}%
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

export default PFMasterForm;
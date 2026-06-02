  
import { useCallback, useEffect, useState } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm" ;
import ERPDateInput from "../../../../../components/Reusable/input/Date";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const formulaTypeMap = {
  "Fixed":      "fixed",
  "% of Basic": "pct_basic",
  "% of Gross": "pct_gross",
  "% of CTC":   "pct_ctc",
};

const formulaTypeReverseMap = {
  "fixed":     "Fixed",
  "pct_basic": "% of Basic",
  "pct_gross": "% of Gross",
  "pct_ctc":   "% of CTC",
};

const SalaryFormulaEngineForm = ({
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
    
    templates = [],
    incomeHeads = [],
    deductionHeads = [],
    formData,
    setFormData
    
}) => {
    
    const [errors, setErrors] = useState({});

    const isViewMode = mode === "view";
    const isAddMode  = mode === "add";
    const isEditMode = mode === "edit";

    const requiredFields = ["salary_template_id", "head_id", "head_type", "formula_type", "value"]; 
    useEffect(() => {
        if (isAddMode || isEditMode) {
            setTimeout(() => {
                const firstInput = document.querySelector(
                    "#formula-engine-form-container input:not([disabled])"
                );
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

    // ── Template dropdown ──────────────────────────────────────
    const templateOptions = templates.map(t => t.employee_name?.trim()).filter(Boolean);

    const handleTemplateChange = (selectedName) => {
        const found = templates.find(t => t.employee_name?.trim() === selectedName);
        handleChange("salary_template_id", found ? found.salary_template_id : "");
        handleChange("template_name", selectedName);
    };

    // ── Head type change → clear head selection ────────────────
    const handleHeadTypeChange = (val) => {
        handleChange("head_type", val === "Income" ? "income" : "deduction");
        handleChange("head_type_display", val);
        // Clear head when type changes
        handleChange("head_id", "");
        handleChange("head_name", "");
    };

    // ── Head dropdown changes based on head_type ───────────────
    const currentHeads = formData.head_type === "income" ? incomeHeads : deductionHeads;
    const headPkKey    = formData.head_type === "income" ? "income_head_id" : "deduction_head_id";
    const headOptions  = currentHeads.map(h => h.name?.trim()).filter(Boolean);

    const handleHeadChange = (selectedName) => {
        const found = currentHeads.find(h => h.name?.trim() === selectedName);
        handleChange("head_id",   found ? found[headPkKey] : "");
        handleChange("head_name", selectedName);
    };

    // ── Formula type change ────────────────────────────────────
    const handleFormulaTypeChange = (val) => {
        handleChange("formula_type",         formulaTypeMap[val] || val);
        handleChange("formula_type_display", val);
    };

    // ── Value label/placeholder based on formula type ──────────
    const isFixed        = formData.formula_type === "fixed";
    const valueLabel     = isFixed ? "Amount (₹)" : "Percentage (%)";
    const valuePlaceholder = isFixed ? "e.g. 5000" : "e.g. 40";

    // 👉 FIXED HEIGHT FOR MOBILE: h-[38px] for mobile, sm:h-[30px] for desktop
    const getInputClass = (disabled, field) =>
        `h-[38px] sm:h-[30px] px-2 text-[15px] border rounded-md ${
            errors[field] ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

    // ── Validation + save ──────────────────────────────────────
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
        const payload = {
            formula_id:         formData.formula_id,
            salary_template_id: formData.salary_template_id,
            head_id:            formData.head_id,
            head_type:          formData.head_type,          // "income" / "deduction"
            formula_type:       formData.formula_type,       // "fixed" / "pct_basic" etc
            value:              parseFloat(formData.value),
            effective_from:     formData.effective_from || null,
            status:             formData.status || "Active",
        };

        onSave && onSave(payload);
    }, [formData, isViewMode, onSave]);

    // ── Keyboard navigation (exact same as SalaryTemplateForm) ─
    const handleKeyDown = useCallback((e) => {
        if (isViewMode) return;

        const container = document.getElementById("formula-engine-form-container");
        if (!container) return;

        const elements = Array.from(
            container.querySelectorAll("[data-auto], input, textarea, select, button")
        )
        .filter(el => !el.disabled && el.offsetParent !== null)
        .sort((a, b) => {
            const aRect = a.getBoundingClientRect();
            const bRect = b.getBoundingClientRect();
             
            if (Math.abs(aRect.top - bRect.top) > 18) {
                return aRect.top - bRect.top;
            }
            return aRect.left - bRect.left;
        });

        const index = elements.indexOf(e.target);

       if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else { 
          let submitBtn = document.querySelector("#save")||document.querySelector("#update");
          
        
          if (submitBtn) {
            submitBtn.focus();
          }
        }
      }

        if (e.key === "Backspace") {
            const el = e.target;
            const tag = el.tagName;
            const isTextInput = tag === "INPUT" && ["text","search","password","tel","url"].includes(el.type);
            const isTextarea  = tag === "TEXTAREA";
            const canCheckCursor = isTextInput || isTextarea;
            let shouldGoBack = false;

            if (canCheckCursor) {
                const value = el.value || "";
                let atStart = false;
                try { atStart = el.selectionStart === 0 && el.selectionEnd === 0; } catch { atStart = true; }
                if (value === "" || atStart) shouldGoBack = true;
            } else {
                if (!el.value || el.value === "") shouldGoBack = true;
            }

            if (shouldGoBack && index > 0) {
                e.preventDefault();
                let prevIndex = index - 1;
                while (prevIndex >= 0) {
                    const prevEl = elements[prevIndex];
                    if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
                        prevEl.focus();
                        if (prevEl.tagName === "INPUT" && typeof prevEl.setSelectionRange === "function") {
                            const len = prevEl.value?.length || 0;
                            try { prevEl.setSelectionRange(len, len); } catch {}
                        }
                        break;
                    }
                    prevIndex--;
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
                title="SALARY FORMULA ENGINE ENTRY"
                isAddMode={isAddMode}
                isEditMode={isEditMode}
                isViewMode={isViewMode}
                activeTab={activeTab}
                onTabChange={onTabChange}
                rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
            />

            <div className="flex-1 p-4 overflow-y-auto flex justify-start sm:justify-center items-start w-full">
                <div
                    id="formula-engine-form-container"
                    className="w-full max-w-[800px] bg-white border rounded-md p-4 flex flex-col gap-4"
                > 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <label className="w-full sm:w-[150px]">
                                Template <span className="text-red-500">*</span>
                            </label>
                            <ERPAutocomplete
                                data-auto
                                options={templateOptions}
                                value={formData.template_name || ""}
                                onChange={handleTemplateChange}
                                onKeyDown={handleKeyDown}
                                disabled={isViewMode}
                                className={`${getInputClass(isViewMode, "salary_template_id")} w-full sm:flex-1`}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <label className="w-full sm:w-[120px]">
                                Head type <span className="text-red-500">*</span>
                            </label>
                            <ERPAutocomplete
                                data-auto
                                options={["Income", "Deduction"]}
                                value={formData.head_type_display || (formData.head_type === "income" ? "Income" : formData.head_type === "deduction" ? "Deduction" : "")}
                                onChange={handleHeadTypeChange}
                                onKeyDown={handleKeyDown}
                                disabled={isViewMode}
                                className={`${getInputClass(isViewMode, "head_type")} w-full sm:flex-1`}
                            />
                        </div>

                    </div>

                    {/* Row 2 — Head Name + Formula Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <label className="w-full sm:w-[150px]">
                                Head name <span className="text-red-500">*</span>
                            </label>
                            <ERPAutocomplete
                                data-auto
                                options={headOptions}
                                value={formData.head_name || ""}
                                onChange={handleHeadChange}
                                onKeyDown={handleKeyDown}
                                disabled={isViewMode || !formData.head_type}
                                className={`${getInputClass(isViewMode || !formData.head_type, "head_id")} w-full sm:flex-1`}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <label className="w-full sm:w-[120px]">
                                Formula type <span className="text-red-500">*</span>
                            </label>
                            <ERPAutocomplete
                                data-auto
                                options={["Fixed", "% of Basic", "% of Gross", "% of CTC"]}
                                value={formData.formula_type_display || ""}
                                onChange={handleFormulaTypeChange}
                                onKeyDown={handleKeyDown}
                                disabled={isViewMode}
                                className={`${getInputClass(isViewMode, "formula_type")} w-full sm:flex-1`}
                            />
                        </div>
                    </div> 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <label className="w-full sm:w-[140px]">
                                {valueLabel} <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="value"
                                type="number"
                                min="0"
                                value={formData.value || ""}
                                disabled={isViewMode}
                                onChange={e => handleChange("value", e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={valuePlaceholder}
                                className={`${getInputClass(isViewMode, "value")} w-full sm:w-[170px] `}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <label className="w-full sm:w-[210px]">Effective from</label>
                            <ERPDateInput
                                value={formData.effective_from || ""}
                                disabled={isViewMode}
                                onChange={value => handleChange("effective_from", value)}
                                onKeyDown={handleKeyDown}
                                className={`${getInputClass(isViewMode, "effective_from")} w-full sm:flex-1`}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                            <label className="w-full sm:w-[150px]">Status</label>
                            <div className="flex items-center">
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
                                <span className="ml-[20px] text-sm">{formData.status || "Active"}</span>
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

export default SalaryFormulaEngineForm;
 
import { useCallback, useEffect, useState } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";
import ERPDateInput from "../../../../../components/Reusable/input/Date";
const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const SalaryTemplateForm = ({
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
  setFormData,
  incomeHeads = [],
  deductionHeads = [],
  isEmbedded,
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = ["grade"];
  const { options } = useGroupOptions();

  // Auto-focus first field on add/edit
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput = document.querySelector(
          "#salary-template-form-container input:not([disabled])",
        );
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

  const toggleIncomeHead = (head) => {
    if (isViewMode) return;
    const current = formData.incomeHeads || [];
    const exists = current.find(
      (h) => h.income_head_id === head.income_head_id,
    );
    const updated = exists
      ? current.filter((h) => h.income_head_id !== head.income_head_id)
      : [...current, { ...head, percentage: "", formula_type: "" }];
    handleChange("incomeHeads", updated);
  };

  const toggleDeductionHead = (head) => {
    if (isViewMode) return;
    const current = formData.deductionHeads || [];
    const exists = current.find(
      (h) => h.deduction_head_id === head.deduction_head_id,
    );
    const updated = exists
      ? current.filter((h) => h.deduction_head_id !== head.deduction_head_id)
      : [...current, { ...head, percentage: "", formula_type: "" }];
    handleChange("deductionHeads", updated);
  };

  // Update both fields (percentage + formula_type) for selected heads
  const updateHeadData = (type, id, field, value) => {
    const stateField = type === "income" ? "incomeHeads" : "deductionHeads";
    const pkKey = type === "income" ? "income_head_id" : "deduction_head_id";
    const current = formData[stateField] || [];
    handleChange(
      stateField,
      current.map((h) => (h[pkKey] === id ? { ...h, [field]: value } : h)),
    );
  };

    const getInputClass = (disabled, field) => {
  // 1. Base styles (jo hamesha rahengi)
  const base = "h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md outline-none transition-all w-full";
  
  // 2. State specific styles (error ya disabled)
  const state = disabled 
    ? "bg-gray-100 cursor-not-allowed border-gray-200" 
    : "bg-white";
    
  // 3. Border color (Default vs Error)
  const border = errors[field] 
    ? "border-red-500" 
    : "border-gray-300";

  // 4. Focus style (Sirf us element par jise click kiya hai)
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
        const el = document.querySelector(`[name="${firstEmpty}"]`);
        if (el) el.focus();
      }, 50);
      return;
    }
    onSave && onSave(formData);
  }, [formData, isViewMode, onSave, requiredFields]);

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      const container = document.getElementById(
        "salary-template-form-container",
      );
      if (!container) return;

      const elements = Array.from(
        container.querySelectorAll(
          "[data-auto], input, textarea, select, button",
        ),
      )
        .filter((el) => !el.disabled && el.offsetParent !== null)
        .sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();

          // 🔥 vertical priority (top to bottom)
          if (Math.abs(aRect.top - bRect.top) > 18) { 
            return aRect.top - bRect.top;
          }

          // 🔥 same row → left to right
          return aRect.left - bRect.left;
        });

      const index = elements.indexOf(e.target);

      // ✅ ENTER → ONLY MOVE
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else {
          // 🔥 LAST FIELD → SAVE BUTTON FOCUS
          let submitBtn =
            document.querySelector("#save") || document.querySelector("#update");

          if (submitBtn) {
            submitBtn.focus();
          }
        }
      }
      if (e.key === "Backspace") {
        const el = e.target;
        const tag = el.tagName;
        const type = el.type;

        let shouldGoBack = false;

        if (tag === "INPUT" || tag === "TEXTAREA") {
          if (type === "checkbox" || type === "radio") {
            shouldGoBack = true;
          } else {
            if (!el.value || el.value === "") {
              shouldGoBack = true;
            }
          }
        } else if (tag === "SELECT" || tag === "DIV") {
          shouldGoBack = true;
        }

        if (shouldGoBack && index > 0) {
          e.preventDefault(); 

          let prevIndex = index - 1;

          while (prevIndex >= 0) {
            const prevEl = elements[prevIndex];

            if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
              prevEl.focus();

              if (
                prevEl.tagName === "INPUT" &&
                (prevEl.type === "text" ||
                  prevEl.type === "search" ||
                  prevEl.type === "url" ||
                  prevEl.type === "tel") &&
                typeof prevEl.setSelectionRange === "function"
              ) {
                const len = prevEl.value?.length || 0;
                try {
                  prevEl.setSelectionRange(len, len);
                } catch {}
              }

              break;
            }

            prevIndex--;
          }
        }
      }
    },
    [isViewMode],
  );
  console.log(isEmbedded);

  const selectedIncomeIds = new Set(
    (formData.incomeHeads || []).map((h) => h.income_head_id),
  );
  const selectedDeductionIds = new Set(
    (formData.deductionHeads || []).map((h) => h.deduction_head_id),
  );

  return (
    <div
      className="w-full max-w-[1300px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
    
      {!isEmbedded&&(<ERPHeader
        title="SALARY TEMPLATE ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />)}

      <div className="flex-1  overflow-y-auto flex justify-start lg:justify-center items-start w-full">
        <div
          id="salary-template-form-container"
          className="w-full bg-white border rounded-md p-3 sm:p-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <label className="sm:w-[70px]">
                Grade <span className="text-red-500">*</span>
              </label>
   <ERPAutocomplete
  data-auto
  name="grade"
  options={(options.grade || []).map((g) => g.label)}  // show names ✅

  // ✅ stored ID → resolve display name
  value={
    options.grade?.find((g) => g.value === formData.grade)?.label 
    || formData.grade 
    || ""
  }

  onChange={(selectedName) => {
    // ✅ picked name → find ID → store ID
    const matched = options.grade?.find((g) => g.label === selectedName);
    handleChange("grade", matched ? matched.value : selectedName);
  }}

  onKeyDown={handleKeyDown}
  className={`${getInputClass(isViewMode, "grade")} w-full sm:flex-1`}
  disabled={isViewMode}
/>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[180px]">Effective From</label>
              <ERPDateInput
                value={formData.effective_from || ""}
onChange={(value) => handleChange("effective_from", value)}
                disabled={isViewMode} 
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "effectiveFrom")} w-[120px] flex-1`}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <label className="sm:w-[80px]">Status</label>
              <div
                tabIndex={0}
                data-auto
                onKeyDown={(e) => {
                  handleKeyDown(e); 
                  if (!isViewMode && e.key === " ") {
                    e.preventDefault();
                    handleChange(
                      "status",
                      formData.status === "Active" ? "Inactive" : "Active",
                    );
                  }
                }}
                onClick={() =>
                  !isViewMode &&
                  handleChange(
                    "status",
                    formData.status === "Active" ? "Inactive" : "Active",
                  )
                }
                className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
                  formData.status === "Active" ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                <div
                  className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                    formData.status === "Active" ? "translate-x-[20px]" : ""
                  }`}
                />
              </div>
              <span className="text-sm ml-[18px]">
                {formData.status || "Active"}
              </span>
            </div>
          </div>

          <hr className="border-gray-200" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ================= EARNINGS ================= */}
            <div className="bg-white border rounded-lg">
              <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                <span className="text-gray-600 font-semibold text-sm">
                  Earnings (income heads)
                </span>
                <span className="text-xs text-gray-500">
                  {selectedIncomeIds.size} selected
                </span>
              </div>

              <div className="max-h-[49vh] overflow-y-auto">
                {incomeHeads.map((head) => {
                  const isSelected = selectedIncomeIds.has(head.income_head_id);
                  const selectedHead = (formData.incomeHeads || []).find(
                    (h) => h.income_head_id === head.income_head_id,
                  );

                  return (
                    <div
                      key={head.income_head_id}
                      onClick={() => {
                        if (!isViewMode) toggleIncomeHead(head);
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2 border-b 
                                  ${isViewMode ? "cursor-not-allowed" : "cursor-pointer"} 
                                  ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          data-auto
                          type="checkbox"
                          checked={isSelected}
                          disabled={isViewMode}
                          onChange={() => toggleIncomeHead(head)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={handleKeyDown}
                          className={`shrink-0 ${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />

                        <div className="text-sm sm:text-base font-medium text-gray-700 truncate">
                          {head.name}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span
                          className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full
                           ${
                             head.type === "Fixed"
                               ? "bg-green-100 text-green-600"
                               : "bg-yellow-100 text-yellow-600"
                           }`}
                        >
                          {head.type.toLowerCase()}
                        </span>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <select
                              data-auto
                              disabled={isViewMode}
                              value={selectedHead?.formula_type || ""}
                              onChange={(e) =>
                                updateHeadData(
                                  "income",
                                  head.income_head_id,
                                  "formula_type",
                                  e.target.value
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleKeyDown}
                              className={`h-[26px] px-1 text-xs border rounded transition-all w-[80px] sm:w-[90px]
                                ${
                                  isViewMode
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                }`}
                            >
                              <option value="" disabled>
                                Formula
                              </option>
                              <option value="Fixed">Fixed</option>
                              <option value="% of Basic">% of Basic</option>
                              <option value="% of CTC">% of CTC</option>
                            </select>

                            <input
                              data-auto
                              type="number"
                              min="0"
                              max={selectedHead?.formula_type === "Fixed" ? undefined : 100}
                              disabled={isViewMode}
                              value={selectedHead?.percentage || ""}
                              onChange={(e) =>
                                updateHeadData(
                                  "income",
                                  head.income_head_id,
                                  "percentage",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleKeyDown}
                              placeholder={selectedHead?.formula_type === "Fixed" ? "Amt" : "%"}
                              className={`w-[60px] sm:w-[80px] h-[26px] px-2 text-xs border rounded
                                     ${
                                       isViewMode
                                         ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                         : "bg-white border-gray-300 focus:border-blue-500"
                                     }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= DEDUCTIONS ================= */}
            <div className="bg-white border rounded-lg">
              <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                <span className="text-gray-500 font-semibold text-sm">
                  Deductions
                </span>
                <span className="text-xs text-gray-500">
                  {selectedDeductionIds.size} selected
                </span>
              </div>

              <div className="max-h-[49vh] overflow-y-auto">
                {deductionHeads.map((head) => {
                  const isSelected = selectedDeductionIds.has(
                    head.deduction_head_id,
                  );
                  const selectedHead = (formData.deductionHeads || []).find(
                    (h) => h.deduction_head_id === head.deduction_head_id,
                  );

                  return (
                    <div
                      key={head.deduction_head_id}
                      onClick={() => {
                        if (!isViewMode) toggleDeductionHead(head);
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2 border-b 
                       ${isViewMode ? "cursor-not-allowed" : "cursor-pointer"} 
                       ${isSelected ? "bg-red-50" : "hover:bg-gray-50"}`}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          data-auto
                          type="checkbox"
                          checked={isSelected}
                          disabled={isViewMode}
                          onChange={() => toggleDeductionHead(head)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={handleKeyDown}
                          className={`shrink-0 ${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />

                        <div className="text-sm sm:text-base font-medium text-gray-700 truncate">
                          {head.name}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span
                          className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full
            ${
              head.type === "Fixed"
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
                        >
                          {head.type.toLowerCase()}
                        </span>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <select
                              data-auto
                              disabled={isViewMode}
                              value={selectedHead?.formula_type || ""}
                              onChange={(e) =>
                                updateHeadData(
                                  "deduction",
                                  head.deduction_head_id,
                                  "formula_type",
                                  e.target.value
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleKeyDown}
                              className={`h-[26px] px-1 text-xs border rounded transition-all w-[80px] sm:w-[90px]
                                ${
                                  isViewMode
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                    : "bg-white border-red-300 focus:border-blue-500"
                                }`}
                            >
                              <option value="" disabled>
                                Formula
                              </option>
                              <option value="Fixed">Fixed</option>
                              <option value="% of Basic">% of Basic</option>
                              <option value="% of Gross">% of Gross</option>
                            </select>

                            <input
                              data-auto
                              type="number"
                              min="0"
                              max={selectedHead?.formula_type === "Fixed" ? undefined : 100}
                              disabled={isViewMode}
                              value={selectedHead?.percentage || ""}
                              onChange={(e) =>
                                updateHeadData(
                                  "deduction",
                                  head.deduction_head_id,
                                  "percentage",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleKeyDown}
                              placeholder={selectedHead?.formula_type === "Fixed" ? "Amt" : "%"}
                              className={`w-[60px] sm:w-[80px] h-[26px] px-2 text-xs border rounded transition-all
                                      ${
                                        isViewMode
                                          ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                          : "bg-white border-red-300 focus:border-blue-500"
                                      }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

export default SalaryTemplateForm;

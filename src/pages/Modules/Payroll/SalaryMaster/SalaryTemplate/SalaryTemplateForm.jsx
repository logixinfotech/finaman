import { useCallback, useEffect, useState } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import { fetchUserGroupsByType, getActledList } from "../../../../../utils/api";
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
}) => {
 
  const [errors, setErrors] = useState({});
  const [employeeNames, setEmployeeNames] = useState([]);
  const [department, setDepartment] = useState([]);

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = ["employee_name", "code"];

 

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

  // Load employee name dropdown
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const empData = await getActledList();
        const empList = Array.isArray(empData) ? empData : empData?.data || [];
        const dept = await fetchUserGroupsByType("DEP");
        setDepartment(dept.data || []);
        setEmployeeNames(empList.map((emp) => emp.Led_name?.trim()));
      } catch (err) {
        console.error("Failed to fetch employee list:", err);
      }
    };
    loadDropdowns();
  }, []);

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

  const depOptions = Array.isArray(department)
    ? department.map((d) => d.group_name?.trim())
    : [];
  const toggleIncomeHead = (head) => {
    if (isViewMode) return;
    const current = formData.incomeHeads || [];
    const exists = current.find(
      (h) => h.income_head_id === head.income_head_id,
    );
    const updated = exists
      ? current.filter((h) => h.income_head_id !== head.income_head_id)
      : [...current, { ...head, percentage: "" }];
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
      : [...current, { ...head, percentage: "" }];
    handleChange("deductionHeads", updated);
  };

  const updatePct = (type, id, value) => {
    const field = type === "income" ? "incomeHeads" : "deductionHeads";
    const pkKey = type === "income" ? "income_head_id" : "deduction_head_id";
    const current = formData[field] || [];
    handleChange(
      field,
      current.map((h) => (h[pkKey] === id ? { ...h, percentage: value } : h)),
    );
  };

  const getInputClass = (disabled, field) =>
    `h-[30px] px-2 text-[16px] border rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

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
  }, [formData, isViewMode, onSave]);
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
          if (Math.abs(aRect.top - bRect.top) > 5) {
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
          const saveBtn = document.querySelector("[save]");
          if (saveBtn) {
            saveBtn.focus();
          }
        }
      }
      // ✅ BACKSPACE → previous (if empty)
      if (e.key === "Backspace") {
        const el = e.target;
        const tag = el.tagName;

        const isTextInput =
          tag === "INPUT" &&
          (el.type === "text" ||
            el.type === "search" ||
            el.type === "password" ||
            el.type === "tel" ||
            el.type === "url");

        const isTextarea = tag === "TEXTAREA";

        const canCheckCursor = isTextInput || isTextarea;

        let shouldGoBack = false;

        if (canCheckCursor) {
          const value = el.value || "";

          let atStart = false;
          try {
            atStart = el.selectionStart === 0 && el.selectionEnd === 0;
          } catch {
            atStart = true; // fallback safe
          }

          if (value === "" || atStart) {
            shouldGoBack = true;
          }
        } else {
          // number input / other elements
          if (!el.value || el.value === "") {
            shouldGoBack = true;
          }
        }

        if (shouldGoBack && index > 0) {
          e.preventDefault();

          let prevIndex = index - 1;

          while (prevIndex >= 0) {
            const prevEl = elements[prevIndex];

            if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
              prevEl.focus();

              // cursor end pe set only for text inputs
              if (
                prevEl.tagName === "INPUT" &&
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
      <ERPHeader
        title="SALARY TEMPLATE ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
        <div
          id="salary-template-form-container"
          className="w-full bg-white border rounded-md p-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[70px]">
                Name <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                options={employeeNames}
                value={formData.employee_name || ""}
                onChange={(val) => handleChange("employee_name", val)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "employee_name")} flex-1`}
                disabled={isViewMode}
              />
            </div>
            <div className="flex items-center ml-[29px] gap-3">
              <label className="w-[60px]">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                value={formData.code || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("code", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "code")}  w-[120px]`}
              />
            </div>

            <div className="flex items-center ">
              <label className="w-[120px]">Department</label>
              <ERPAutocomplete
                data-auto
                value={formData.department || ""}
                options={depOptions} // Use the new array here
                onChange={(val) => handleChange("department", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "department")} w-[155px]`}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-[180px]">Effective From</label>
              <ERPDateInput
                value={formData.effectiveFrom || ""}
                disabled={isViewMode}
                onChange={(value) => handleChange("effectiveFrom", value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "effectiveFrom")} w-[120px] flex-1`}
              />
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center  gap-3">
              <label className="w-[80px]">Status</label>
              <div
                tabIndex={0}
                data-auto
                onKeyDown={(e) => {
                  handleKeyDown(e);

                  // ✅ ONLY SPACE toggle karega
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
          <div className="grid grid-cols-2 gap-4">
            {/* ================= EARNINGS ================= */}
            <div className="bg-white border rounded-lg">
              {/* Header */}
              <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                <span className="text-gray-600 font-semibold text-sm">
                  Earnings (income heads)
                </span>
                <span className="text-xs text-gray-500">
                  {selectedIncomeIds.size} selected
                </span>
              </div>

              <div className="max-h-[270px] overflow-y-auto">
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
                      className={`flex items-center justify-between px-3 py-2 border-b 
                                  ${isViewMode ? "cursor-not-allowed" : "cursor-pointer"} 
                                  ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-2">
                        <input
                          data-auto
                          type="checkbox"
                          checked={isSelected}
                          disabled={isViewMode}
                          onChange={() => toggleIncomeHead(head)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={handleKeyDown}
                          className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />

                        <div className="text-base  md:text-base 2xl:text-lg font-medium text-gray-700">
                          {head.name}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full
                           ${
                             head.type === "Fixed"
                               ? "bg-green-100 text-green-600"
                               : "bg-yellow-100 text-yellow-600"
                           }`}
                        >
                          {head.type.toLowerCase()}
                        </span>

                        {isSelected && (
                          <input
                            data-auto
                            type="number"
                            min="0"
                            max="100"
                            disabled={isViewMode}
                            value={selectedHead?.percentage || ""}
                            onChange={(e) =>
                              updatePct(
                                "income",
                                head.income_head_id,
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={handleKeyDown}
                            placeholder="%"
                            className={`w-[90px] h-[26px] px-2 text-xs border rounded
                               [field-sizing:content] min-w-[90px] max-w-[180px] w-auto flex-none justify-self-start
                                     ${
                                       isViewMode
                                         ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                         : "bg-white border-gray-300 focus:border-blue-500"
                                     }`}
                          />
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

              <div className="max-h-[270px] overflow-y-auto">
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
                      className={`flex items-center justify-between px-3 py-2 border-b 
                       ${isViewMode ? "cursor-not-allowed" : "cursor-pointer"} 
                       ${isSelected ? "bg-red-50" : "hover:bg-gray-50"}`}
                    >
                      {/* LEFT */}
                      <div className="flex items-center gap-2">
                        <input
                          data-auto
                          type="checkbox"
                          checked={isSelected}
                          disabled={isViewMode}
                          onChange={() => toggleDeductionHead(head)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={handleKeyDown}
                          className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />

                        <div className="text-base  md:text-base 2xl:text-lg  font-medium text-gray-700">
                          {head.name}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full
            ${
              head.type === "Fixed"
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
                        >
                          {head.type.toLowerCase()}
                        </span>

                        {isSelected && (
                          <input
                            data-auto
                            type="number"
                            min="0"
                            disabled={isViewMode}
                            value={selectedHead?.percentage || ""}
                            onChange={(e) =>
                              updatePct(
                                "deduction",
                                head.deduction_head_id,
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={handleKeyDown}
                            placeholder={head.type === "Fixed" ? "Amt" : "%"}
                         
                            className={`h-[26px] px-2 text-xs border rounded transition-all
                                      [field-sizing:content] min-w-[90px] max-w-[180px] w-auto flex-none justify-self-start
                                      ${
                                       isViewMode
                                      ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                                          : "bg-white border-red-300 focus:border-blue-500"
                                         }`}
                            
                          />
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

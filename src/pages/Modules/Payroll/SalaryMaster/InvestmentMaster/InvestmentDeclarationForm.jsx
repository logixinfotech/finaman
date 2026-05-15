import React, {
  useState,
  useCallback,
  useEffect,
} from "react";

import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const financialYearOptions = [
  "2024-25",
  "2025-26",
  "2026-27",
];

const declarationTypeOptions = [
  "80C",
  "80D",
  "HRA",
  "LTA",
  "Other",
];

const proofOptions = ["Yes", "No"];

const employeeOptions = [
  {
    Actled_id: 1,
    Led_name: "Rahul Sharma",
  },
  {
    Actled_id: 2,
    Led_name: "Amit Verma",
  },
  {
    Actled_id: 3,
    Led_name: "Neha Singh",
  },
];

const InvestmentDeclarationForm = ({
  mode = "add",
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
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    investment_declaration_id: "",

    employee_id: "",
    employee_name: "",

    financial_year: "",

    declaration_type: "",

    investment_name: "",

    declared_amount: "",

    proof_submitted: "No",

    status: "Active",
  });

  const [errors, setErrors] =
    useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  

  const requiredFields = [
    "employee_name",
    "financial_year",
    "declaration_type",
    "investment_name",
    "declared_amount",
  ];
 
  useEffect(() => {
    if (initialData) {
      setFormData({
        investment_declaration_id:
          initialData.investment_declaration_id ||
          "",

        employee_id:
          initialData.employee_id || "",

        employee_name:
          initialData.employee_name || "",

        financial_year:
          initialData.financial_year || "",

        declaration_type:
          initialData.declaration_type || "",

        investment_name:
          initialData.investment_name || "",

        declared_amount:
          initialData.declared_amount || "",

        proof_submitted:
          initialData.proof_submitted ||
          "No",

        status:
          initialData.status || "Active",
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput =
          document.querySelector(
            "#investment-form-container input:not([disabled])"
          );

        if (firstInput)
          firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  const getInputClass = (
    disabled,
    field
  ) =>
    `h-[30px] px-2 text-[15px] border rounded-md ${
      errors[field]
        ? "border-red-500"
        : "border-gray-300"
    } ${
      disabled
        ? "bg-gray-100 cursor-not-allowed"
        : "bg-white focus:border-blue-500"
    }`;

  const handleValidateAndSave =
    useCallback(() => {
      if (isViewMode) return;

      let newErrors = {};
      let firstEmpty = null;

      requiredFields.forEach((field) => {
        if (!formData[field]) {
          newErrors[field] = "Required";

          if (!firstEmpty)
            firstEmpty = field;
        }
      });

      if (
        Object.keys(newErrors).length > 0
      ) {
        setErrors(newErrors);

        setTimeout(() => {
          const el =
            document.querySelector(
              `[name="${firstEmpty}"]`
            );

          if (el) el.focus();
        }, 50);

        return;
      }

      console.log(
        "SAVE DATA :",
        formData
      );

      onSave && onSave(formData);
    }, [formData, isViewMode, onSave]);

const handleKeyDown = useCallback(
  (e) => {
    if (isViewMode) return;

    const container = document.getElementById("investment-form-container");
    if (!container) return;

    // 1. Saare focusable elements ko sahi order mein sort karein (with 18px tolerance)
    const elements = Array.from(
      container.querySelectorAll("input, textarea, select, button, [tabindex='0'], [data-auto]")
    )
      .filter((el) => !el.disabled && el.offsetParent !== null)
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();

        // 18px tolerance taaki input aur toggle ek hi row mein maane jayein
        if (Math.abs(aRect.top - bRect.top) > 18) {
          return aRect.top - bRect.top;
        }
        return aRect.left - bRect.left;
      });

    const currentIndex = elements.indexOf(e.target);

    // =====================
    // ENTER → NEXT FIELD OR SAVE
    // =====================
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (currentIndex < elements.length - 1) {
        // Agle field par jao
        elements[currentIndex + 1].focus();
      } else {
        // 🔥 LAST FIELD → SAVE BUTTON
        // Pehle ID se dhoondho, phir text se (taaki miss na ho)
        let saveBtn = document.querySelector("#save") || document.querySelector("#save-btn");
        
        if (!saveBtn) {
          saveBtn = Array.from(document.querySelectorAll("button")).find(
            (btn) => btn.innerText?.toLowerCase().includes("save") || btn.innerText?.toLowerCase().includes("update")
          );
        }

        if (saveBtn) saveBtn.focus();
      }
    }

    // =====================
    // BACKSPACE → PREVIOUS FIELD
    // =====================
    if (e.key === "Backspace") {
      const el = e.target;
      const isInput = el.tagName === "INPUT" || el.tagName === "TEXTAREA";
      const isToggleOrSelect = el.dataset.toggle === "status" || el.tagName === "SELECT" || el.hasAttribute('data-auto');
      const value = el.value || "";

      let shouldGoBack = false;

      // Agar input khali hai ya koi toggle/dropdown element hai
      if ((isInput && value === "") || isToggleOrSelect) {
        shouldGoBack = true;
      }

      if (shouldGoBack && currentIndex > 0) {
        e.preventDefault();
        const prevField = elements[currentIndex - 1];
        prevField.focus();

        // Cursor ko text ke end mein le jane ke liye
        if (prevField.tagName === "INPUT" && typeof prevField.setSelectionRange === "function") {
          const len = prevField.value?.length || 0;
          try {
            prevField.setSelectionRange(len, len);
          } catch {}
        }
      }
    }

    // =====================
    // SPACE → TOGGLE STATUS
    // =====================
    if (e.key === " " && e.target.dataset.toggle === "status") {
      e.preventDefault();
      handleChange(
        "status",
        formData.status === "Active" ? "Inactive" : "Active"
      );
    }
  },
  [isViewMode, formData, handleChange]
);
  return (
    <div
      className="w-full max-w-[850px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
      style={{
        fontFamily: FONT,
      }}
    >
      <ERPHeader
        title="INVESTMENT DECLARATION ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${
          currentRecord || 1
        } / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center items-start">
        <div
          id="investment-form-container"
          className="w-full bg-white border rounded-md p-4 flex flex-col gap-4"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Employee Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <ERPAutocomplete
                data-auto
                options={employeeOptions.map(
                  (e) => e.Led_name
                )}
                value={
                  formData.employee_name ||
                  ""
                }
                disabled={isViewMode}
                onChange={(val) => {
                  const selectedEmployee =
                    employeeOptions.find(
                      (e) =>
                        e.Led_name ===
                        val
                    );

                  handleChange(
                    "employee_name",
                    val || ""
                  );

                  handleChange(
                    "employee_id",
                    selectedEmployee?.Actled_id ||
                      ""
                  );
                }}
                onKeyDown={
                  handleKeyDown
                }
                className={`${getInputClass(
                  isViewMode,
                  "employee_name"
                )} flex-1`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Financial Year{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <ERPAutocomplete
                data-auto
                options={
                  financialYearOptions
                }
                value={
                  formData.financial_year ||
                  ""
                }
                disabled={isViewMode}
                onChange={(val) =>
                  handleChange(
                    "financial_year",
                    val
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                className={`${getInputClass(
                  isViewMode,
                  "financial_year"
                )} flex-1`}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Declaration Type{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <ERPAutocomplete
                data-auto
                options={
                  declarationTypeOptions
                }
                value={
                  formData.declaration_type ||
                  ""
                }
                disabled={isViewMode}
                onChange={(val) =>
                  handleChange(
                    "declaration_type",
                    val
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                className={`${getInputClass(
                  isViewMode,
                  "declaration_type"
                )} flex-1`}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Investment Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                name="investment_name"
                value={
                  formData.investment_name ||
                  ""
                }
                disabled={isViewMode}
                onChange={(e) =>
                  handleChange(
                    "investment_name",
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="e.g. LIC, PPF, ELSS"
                className={`${getInputClass(
                  isViewMode,
                  "investment_name"
                )} flex-1`}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Declared Amount{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

             <input
  name="declared_amount"
  type="text"
  inputMode="numeric"
  value={formData.declared_amount || ""}
  disabled={isViewMode}
  onChange={(e) => {
    const val = e.target.value;

    // allow only numbers
    if (/^\d*$/.test(val)) {
      handleChange("declared_amount", val);
    }
  }}
  onKeyDown={handleKeyDown}
  className={`${getInputClass(isViewMode, "declared_amount")} w-[200px]`}
/>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Proof Submitted
              </label>

              <ERPAutocomplete
                data-auto
                options={proofOptions}
                value={
                  formData.proof_submitted ||
                  ""
                }
                disabled={isViewMode}
                onChange={(val) =>
                  handleChange(
                    "proof_submitted",
                    val
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                className={`${getInputClass(
                  isViewMode,
                  "proof_submitted"
                )} w-[200px]`}
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="w-[170px]">
                Status
              </label>

              <div
                tabIndex={0}
                data-auto
                data-toggle="status"
                onKeyDown={
                  handleKeyDown
                }
                onClick={() =>
                  !isViewMode &&
                  handleChange(
                    "status",
                    formData.status ===
                      "Active"
                      ? "Inactive"
                      : "Active"
                  )
                }
                className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
                  formData.status ===
                  "Active"
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              >
                <div
                  className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                    formData.status ===
                    "Active"
                      ? "translate-x-[20px]"
                      : ""
                  }`}
                />
              </div>

              <span className="ml-[12px] text-sm">
                {formData.status ||
                  "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        handleSubmit={
          handleValidateAndSave
        }
        onModify={onModify}
        onDelete={() =>
          onDelete &&
          onDelete(formData)
        }
        onCancel={onCancel}
        onEditCancel={
          onEditCancel
        }
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default InvestmentDeclarationForm;
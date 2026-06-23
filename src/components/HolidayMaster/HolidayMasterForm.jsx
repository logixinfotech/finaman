import React, { useState,useRef, useCallback, useEffect } from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../components/Reusable/input/Date";
import { handleERPBackspaceNavigation, handleERPEnterNavigation } from "../../utils/erpShortcuts";
import { User } from "lucide-react";

const HolidayMasterForm = ({
  formData = {},
  setFormData,
  onSave,
  activeTab    = "entry",
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
  const requiredFields = ["date", "purpose"];

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };
  const formRef=useRef(null);
  const saveBtnRef=useRef(null);
  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[30px] px-2 text-[16px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled
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

      // Special check: Agar date me "/" ya "_" jaise mask characters aa rahe hain toh usko bhi empty mano
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

      // Better Focus Logic: Use wrapper IDs or names
      setTimeout(() => {
        let targetInput = null;

        if (firstEmptyField === "date") {
          const dateWrapper = document.getElementById("date-input-wrapper");
          if (dateWrapper) {
            targetInput = dateWrapper.querySelector("input:not([disabled])");
          }
        } else if (firstEmptyField === "purpose") {
          targetInput = document.querySelector('input[name="purpose"]:not([disabled])');
        }

        if (targetInput) targetInput.focus();
      }, 50); // Minor delay ensures DOM is ready

      return; // Stop execution yahi par, aage save nahi hoga
    }

    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode, requiredFields]);

  // const handleKeyDown = useCallback(
  //   (e) => {
  //     if (isViewMode) return;

  //     const container = document.getElementById("holiday-form-container");
  //     if (!container) return;

  //     const focusableElements = Array.from(
  //       container.querySelectorAll("input:not([disabled]), textarea:not([disabled])")
  //     );
  //     const index = focusableElements.indexOf(e.target);

  //     if (e.key === "Enter") {
  //       e.preventDefault();
  //       if (index > -1) {
  //         if (index < focusableElements.length - 1) {
  //           focusableElements[index + 1].focus();
  //         } else {
  //           const allButtons = Array.from(document.querySelectorAll("button"));
  //           const saveBtn = allButtons.find((btn) =>
  //             btn.textContent.toLowerCase().includes("save") || btn.textContent.toLowerCase().includes("update")&&!btn.disabled
  //           );

  //           if (saveBtn) {
  //             saveBtn.focus();
  //           } 
  //         }
  //       }
  //     }

  //     if (e.key === "Backspace") {
  //       const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;

  //       if (isAtStart && index > 0) {
  //         e.preventDefault();
  //         const prevField = focusableElements[index - 1];
  //         prevField.focus();

  //         setTimeout(() => {
  //           if (prevField.setSelectionRange) {
  //             const len = prevField.value?.length || 0;
  //             prevField.setSelectionRange(len, len);
  //           }
  //         }, 0);
  //       }
  //     }
  //   },
  //   [isViewMode, handleValidateAndSave]
  // );
   const handleKeyDown = useCallback((e) => {
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    }, [isViewMode]);
  

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
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
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div id="holiday-form-container" className="w-full max-w-[800px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
          <div className="p-3 grid grid-cols-1 gap-y-3">
            {/* DATE FIELD - Added ID wrapper for reliable focusing */}
            <div className="flex flex-col sm:flex-row sm:gap-4 w-full">
            <div id="date-input-wrapper" className="flex flex-col sm:flex-row items-center px-1 w-full">
              <label className="text-black-800 text-[15px] w-[80px] shrink-0">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 max-w-[120px]">
                <ERPDateInput
                  value={formData.date || ""}
                  onChange={(val) => handleChange("date", val)}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "date")}
                />
              </div>
            </div>

            {/* PURPOSE FIELD - Added name prop */}
            <div className="flex flex-col sm:flex-row items-center px-1 w-full">
              <label className="text-black-800 text-[15px] sm:w-[80px] shrink-0">
                Purpose <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "purpose")}
                  placeholder="Enter holiday purpose"
                />
              </div>
            </div>
            </div>

            

            {/* REMARKS FIELD */}
            <div className="flex flex-col sm:flex-row items-start px-1 w-full">
              <label className="text-black-800 text-[15px] w-[80px] shrink-0 mt-1">
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
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        saveBtnRef={saveBtnRef        }
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
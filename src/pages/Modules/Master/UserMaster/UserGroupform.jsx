import React, { useCallback, useMemo, useEffect, useState } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPSettings from "../../../../components/Reusable/ERPSettings";

const UserGroupForm = ({
  nameLabel,
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
  onDelete,
  mode,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  rights,
  onEditCancel,
  activeTab = "entry",
  onTabChange,
   showSettingsTab = false,
}) => {
  const isViewMode  = mode === "view";
  const isAddMode   = mode === "add";
  const isEditMode  = mode === "edit";
  const isSettings  = activeTab === "settings"; 
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  useEffect(() => {
    if ((isAddMode || isEditMode) && !isSettings) {
      setTimeout(() => {
        const container = document.getElementById("usergroup-form-container");
        const firstInput = container?.querySelector("input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode, isSettings]);

  const styles = useMemo(() => ({
    input: `w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors ${
      isViewMode
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`,
  }), [isViewMode]);
const [nameError, setNameError] = useState(false);
const getInputStyle = useCallback((hasError = false) => {
    return `w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors ${
      isViewMode
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : hasError
        ? "bg-white text-gray-900 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
        : "bg-white text-gray-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;
  }, [isViewMode]);
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    if (!formData.group_name?.trim()) {
      setNameError(true)
      const firstInput = document.querySelector('input[placeholder*="group"]');
      firstInput?.focus();
      return;
    }
    setFormData(false)
    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode]);
 

const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("usergroup-form-container");
    const elements = Array.from(
      container.querySelectorAll("input:not([disabled]), textarea:not([disabled])")
    );
    const index = elements.indexOf(e.target);

    if (e.key === "Enter") {
      // Shift + Enter in textarea ki wajah se next line banegi
      if (e.target.tagName === "TEXTAREA" && e.shiftKey) {
        return;
      }
      
      e.preventDefault();
      
      // Normal Enter dabane par next element focus hoga, aur Textarea par Enter dabane se Save button focus hoga
      if (index < elements.length - 1 && e.target.tagName !== "TEXTAREA") {
        elements[index + 1].focus();
      }else {
              const buttons = Array.from(document.querySelectorAll("button"));
              const saveBtn = buttons.find((btn) =>
                btn.textContent.toLowerCase().includes("save")||btn.textContent.toLowerCase().includes("update")
              );
              if (saveBtn) {
                saveBtn.focus();
              } 
            }
    }

    if (e.key === "Backspace") {
      if ((!e.target.value || e.target.selectionStart === 0) && index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }
  }, [isViewMode, handleValidateAndSave]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto bg-white rounded-xl shadow-lg border flex flex-col min-h-[calc(100vh-160px)] overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      {/* Header always visible — tabs live here */}
      <ERPHeader
        title={title || "USER GROUP MASTER"}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showSettingsTab={showSettingsTab}
        rightContent={
          isSettings ? null : `${currentRecord || 1} / ${totalRecords || 1}`
        }
      />

      {/* ── Body swaps based on active tab ── */}
      {isSettings ? (

        // ── SETTINGS PANEL ─────────────────────────────────────
        <ERPSettings
          applName={title || "USER GROUP MASTER"}
          onCancel={() => onTabChange("entry")}
          onSave={(savedSettings) => {
            // persist to API here if needed
            console.log("Settings saved:", savedSettings);
            onTabChange("entry");
          }}
        />

      ) : (

        // ── ENTRY FORM ─────────────────────────────────────────
        <>
          <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
            <div
              id="usergroup-form-container"
              className="w-full max-w-[800px] h-fit bg-white p-6 rounded-md border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 gap-4"
            >
              {/* Group Name */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                  {nameLabel || "Group Name"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className={getInputStyle(nameError)}
                  value={formData.group_name || ""}
                  onChange={(e) =>{
                    setNameError(false);
                    setFormData({ ...formData, group_name: e.target.value.toUpperCase() })
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                  placeholder="Enter group name"
                />
              </div>

              {/* Remarks */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4 px-1">
                <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] mt-2 shrink-0 whitespace-nowrap">
                  Remarks
                </label>
                <textarea
                  className={`${styles.input} h-[40px] py-2`}
                  value={formData.remarks || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                  placeholder="Enter remarks"
                />
              </div>
            </div>
          </div>

          {/* Footer only shown when NOT in settings */}
          <ERPFooter
            isAddMode={isAddMode}
            isViewMode={isViewMode}
            isEditMode={isEditMode}
            saving={saving}
            handleSubmit={handleValidateAndSave}
            onModify={onModify}
            onDelete={() => onDelete(formData)}
            onNewEntry={onNewEntry}
            onCancel={onCancel}
            onEditCancel={onEditCancel}
            rights={rights}
          />
        </>
      )}
    </div>
  );
};

export default UserGroupForm;
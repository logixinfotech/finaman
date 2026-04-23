import React, { useCallback, useMemo, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";

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
  activeTab = "entry", // Added
  onTabChange,         // Added
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const requiredFields = ["group_name"];
 
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("usergroup-form-container");
        const firstInput = container?.querySelector("input:not([disabled])");
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const styles = useMemo(() => ({
    input: `w-full h-[30px] px-2 text-xs rounded border outline-none transition-all ${
      isViewMode ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white border-gray-300 focus:border-blue-500"
    }`,
  }), [isViewMode]);

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    if (!formData.group_name?.trim()) {
      const firstInput = document.querySelector('input[placeholder*="group"]');
      firstInput?.focus();
      return;
    }
    if (onSave) onSave(formData);
  }, [formData, onSave, isViewMode]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("usergroup-form-container");
    const elements = Array.from(container.querySelectorAll("input:not([disabled]), textarea:not([disabled])"));
    const index = elements.indexOf(e.target);

    if (e.key === "Enter") { 
      if (e.target.tagName === "TEXTAREA") return; 
      
      e.preventDefault();
      if (index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        handleValidateAndSave();
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
    <div className="w-full max-w-[700px] mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-150px)] overflow-hidden">
      <ERPHeader
        title={title || "USER GROUP MASTER"}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab} // Now passed
        onTabChange={onTabChange} // Now passed
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <div id="usergroup-form-container" className="bg-white p-6 rounded-lg border shadow-sm grid grid-cols-1 gap-4 w-full">
          {/* Group Name */}
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <label className="w-32 text-[12px] font-bold text-gray-500 uppercase shrink-0">
              {nameLabel || "Group Name"} <span className="text-red-500">*</span>
            </label>
            <input
              className={styles.input}
              value={formData.group_name || ""}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value.toUpperCase() })}
              onKeyDown={handleKeyDown}
              disabled={isViewMode}
              placeholder="Enter group name"
            />
          </div>

          {/* Remarks */}
          <div className="flex items-start gap-4 w-full max-w-2xl">
            <label className="w-32 text-[12px] font-bold text-gray-500 uppercase mt-2 shrink-0">Remarks</label>
            <textarea
              className={`${styles.input} h-20 py-2`}
              value={formData.remarks || ""}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              onKeyDown={handleKeyDown}
              disabled={isViewMode}
              placeholder="Enter remarks"
            />
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default UserGroupForm;
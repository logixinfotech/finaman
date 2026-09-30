import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

export const RECRUITMENT_SUBMENUS = [
  { key: "JOB_VACANCY", name: "Job Vacancy Entry" },
  { key: "JD_MASTER", name: "Job Description Master" },
  { key: "SKILL_MASTER", name: "Skill Master" },
  { key: "JOB_VACANCY_APPROVAL", name: "Job Vacancy Approval" },
  { key: "CANDIDATE_MASTER", name: "Candidate Registration" },
];

const RecruitmentPrefixSettingForm = ({
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
  onPrevRecord,
  onNextRecord,
  rights,
  activeTab = "entry",
  onTabChange = () => { },
  formData,
  setFormData,
  existingList = [],
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const saveBtnRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!isViewMode && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isViewMode, mode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Submenu options for dropdown
  // In Add Mode: Hide submenus that already have a prefix setting configured
  const availableSubmenus = useMemo(() => {
    if (isAddMode) {
      const configuredKeys = new Set(
        existingList.map((r) => r.submenu_key).filter(Boolean)
      );
      return RECRUITMENT_SUBMENUS.filter((s) => !configuredKeys.has(s.key));
    }
    return RECRUITMENT_SUBMENUS;
  }, [isAddMode, existingList]);

  const handleSubmenuSelect = (selectedName) => {
    const found = RECRUITMENT_SUBMENUS.find((s) => s.name === selectedName);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        submenu_key: found.key,
        submenu_name: found.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        submenu_key: "",
        submenu_name: selectedName || "",
      }));
    }
    if (errors.submenu_name || errors.submenu_key) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.submenu_name;
        delete next.submenu_key;
        return next;
      });
    }
  };

  const handlePrefixChange = (rawVal) => {
    // Auto-uppercase and filter to letters/digits only (max 10 chars)
    const cleaned = (rawVal || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    handleChange("prefix", cleaned);
  };

  const getInputClass = (disabled, field) => {
    const base = "h-[35px] md:h-[30px] px-2 text-[13px] border rounded-md outline-none transition-all w-full";
    const state = disabled
      ? "bg-gray-100 cursor-not-allowed border-gray-200 text-gray-600"
      : "bg-white text-gray-800";

    const border = errors[field]
      ? "border-red-500 ring-1 ring-red-400"
      : "border-gray-300";
    const focus = !disabled
      ? "focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      : "";

    return `${base} ${state} ${border} ${focus}`;
  };

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    if (!formData.submenu_key || !formData.submenu_name) {
      newErrors.submenu_name = "Submenu is required";
    }

    if (!formData.prefix?.trim()) {
      newErrors.prefix = "Prefix is required";
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.prefix.trim())) {
      newErrors.prefix = "Letters and digits only (max 10 chars)";
    }

    // Client-side uniqueness check on prefix against other existing records
    if (formData.prefix?.trim()) {
      const targetPrefix = formData.prefix.trim().toUpperCase();
      const duplicatePrefix = existingList.find((r) => {
        const isCurrent =
          formData.prefix_id && r.prefix_id === formData.prefix_id;
        return !isCurrent && r.prefix?.trim().toUpperCase() === targetPrefix;
      });
      if (duplicatePrefix) {
        newErrors.prefix = `Prefix "${targetPrefix}" is already used for ${duplicatePrefix.submenu_name}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      requestAnimationFrame(() => {
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) el.focus();
      });
      return;
    }

    onSave && onSave(formData);
  }, [formData, isViewMode, onSave, existingList]);

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;
      const container = document.getElementById("prefix-form-container");
      if (!container) return;

      const elements = Array.from(
        container.querySelectorAll(
          "[data-focus], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
        )
      ).filter((el) => !el.disabled);

      const index = elements.findIndex((el) => el.contains(e.target));
      if (e.key === "Enter") {
        e.preventDefault();
        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else {
          saveBtnRef?.current?.focus();
        }
      }
      if (e.shiftKey && e.key === "Backspace") {
        let shouldGoBack = true;
        if (e.target.tagName === "INPUT") {
          if (
            e.target.value === "" ||
            (e.target.selectionStart === 0 && e.target.selectionEnd === 0)
          )
            shouldGoBack = true;
        }
        if (shouldGoBack && index > 0) {
          e.preventDefault();
          elements[index - 1].focus();
        }
      }
    },
    [isViewMode]
  );

  return (
    <div
      className="w-full h-full md:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Recruitment Prefix Setting"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        <div
          id="prefix-form-container"
          className="w-full bg-white max-w-[750px] mx-auto border rounded-md p-4 md:p-6 shadow-xs"
        >
          <div className="mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wide">
              Document Code Prefix Configuration
            </h3>
            {formData.submenu_key && (
              <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Key: {formData.submenu_key}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* 1. Submenu Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] md:text-xs font-semibold text-gray-700">
                Submenu <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                name="submenu_name"
                value={formData.submenu_name || ""}
                options={availableSubmenus.map((s) => s.name)}
                onChange={handleSubmenuSelect}
                disabled={isViewMode || isEditMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode || isEditMode, "submenu_name")}
                placeholder="Select Submenu"
              />
              {errors.submenu_name && (
                <span className="text-[10px] text-red-500 font-medium">{errors.submenu_name}</span>
              )}
            </div>

            {/* 2. Prefix Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] md:text-xs font-semibold text-gray-700">
                Prefix <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                name="prefix"
                value={formData.prefix || ""}
                disabled={isViewMode}
                onChange={(e) => handlePrefixChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. VAC, JD, SKL"
                maxLength={10}
                className={getInputClass(isViewMode, "prefix")}
              />
              {errors.prefix && (
                <span className="text-[10px] text-red-500 font-medium">{errors.prefix}</span>
              )}
            </div>

            {/* 3. Status Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] md:text-xs font-semibold text-gray-700">
                Status
              </label>
              <ERPAutocomplete
                name="status"
                value={formData.status || "Active"}
                options={["Active", "Inactive"]}
                onChange={(val) => handleChange("status", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={getInputClass(isViewMode, "status")}
              />
            </div>
          </div>

          {/* Example preview callout */}
          {formData.prefix && (
            <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
              <span>
                Generated Code Format Preview:
              </span>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
                {formData.submenu_key === "JOB_VACANCY"
                  ? `${formData.prefix}-${new Date().getFullYear()}-0001`
                  : `${formData.prefix}-001`}
              </span>
            </div>
          )}
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
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default RecruitmentPrefixSettingForm;

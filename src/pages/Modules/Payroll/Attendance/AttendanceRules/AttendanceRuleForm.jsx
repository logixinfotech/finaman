import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import { focusFirstInput, handleERPBackspaceNavigation, handleERPEnterNavigation } from "../../../../../utils/erpShortcuts";

const defaultTiers = [
  { code: "L1", name: "Late 1", mins: 15 },
  { code: "L2", name: "Late 2", mins: 15 },
];

const AttendanceRuleForm = ({
  formData = {},
  setFormData,
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
  onTabChange,
  initialData = {},
  onPrevRecord,
  onNextRecord
}) => {
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const saveBtnRef = useRef(null);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = ["rule_name"];

  const getParsedTiers = useCallback((rawTiers) => {
    if (!rawTiers) return defaultTiers;
    if (Array.isArray(rawTiers)) return rawTiers;
    try {
      const parsed = JSON.parse(rawTiers);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTiers;
    } catch {
      return defaultTiers;
    }
  }, []);

  const [tiers, setTiers] = useState(() => getParsedTiers(formData?.late_tiers || initialData?.late_tiers));

  useEffect(() => {
    setTiers(getParsedTiers(formData?.late_tiers || initialData?.late_tiers));
  }, [formData?.late_tiers, initialData?.late_tiers, getParsedTiers]);

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleTierChange = (index, field, value) => {
    const nextTiers = [...tiers];
    nextTiers[index] = {
      ...nextTiers[index],
      [field]: field === "mins" ? (parseInt(value, 10) || 0) : value,
    };
    setTiers(nextTiers);
    setFormData((prev) => ({
      ...prev,
      late_tiers: JSON.stringify(nextTiers),
    }));
  };

  const handleAddTier = () => {
    const nextIdx = tiers.length + 1;
    const nextTiers = [
      ...tiers,
      { code: `L${nextIdx}`, name: `Late ${nextIdx}`, mins: 15 },
    ];
    setTiers(nextTiers);
    setFormData((prev) => ({
      ...prev,
      late_tiers: JSON.stringify(nextTiers),
    }));
  };

  const handleRemoveTier = (index) => {
    if (tiers.length <= 1) return;
    const nextTiers = tiers.filter((_, idx) => idx !== index);
    setTiers(nextTiers);
    setFormData((prev) => ({
      ...prev,
      late_tiers: JSON.stringify(nextTiers),
    }));
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[14px] border rounded-md outline-none transition-colors ${
      errors[fieldName] ? "border-red-500 animate-pulse" : "border-gray-300"
    } ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    requiredFields.forEach((f) => {
      if (!formData[f] || formData[f].toString().trim() === "") {
        newErrors[f] = "Required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = requiredFields.find((f) => newErrors[f]);
      if (firstField && formRef.current) {
        const inputEl = formRef.current.querySelector(`[name="${firstField}"]`);
        inputEl?.focus();
      }
      return;
    }

    const payload = {
      ...formData,
      late_tiers: JSON.stringify(tiers),
    };

    if (onSave) onSave(payload);
  }, [formData, onSave, isViewMode, tiers]);

  const handleKeyDown = useCallback(
    (e) => {
      handleERPBackspaceNavigation(e, formRef, isViewMode);
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
    },
    [isViewMode]
  );

  return (
    <div
      id="attendance-rule-form-container"
      className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Attendance Rule Master"
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

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto max-w-[780px] mx-auto w-full flex justify-center">
        <div
          ref={formRef}
          className="w-full h-fit bg-white border border-slate-200 shadow-sm rounded-md p-3 sm:p-5 grid grid-cols-1 gap-y-4"
        >
          {/* Row 1: Rule Name */}
          <div className="flex flex-row items-center gap-2">
            <label className="text-[13px] sm:text-[15px] font-medium text-gray-800 w-[95px] sm:w-[130px] shrink-0">
              Rule Name <span className="text-red-500">*</span>
            </label>
            <div className="flex-1 w-full">
              <input
                name="rule_name"
                className={getInputClass(isViewMode, "rule_name")}
                value={formData.rule_name || ""}
                onChange={(e) => handleChange("rule_name", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode}
                placeholder="e.g. Standard Attendance Rule"
              />
              {errors.rule_name && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.rule_name}</p>
              )}
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="flex flex-row items-start gap-2">
            <label className="text-[13px] sm:text-[15px] font-medium text-gray-800 w-[95px] sm:w-[130px] pt-1 shrink-0">
              Description
            </label>
            <div className="flex-1 w-full">
              <input
                name="description"
                className={getInputClass(isViewMode, "description")}
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode}
                placeholder="Brief description of rules"
              />
            </div>
          </div>

          {/* Row 3: Dynamic Late Tiers Config Card */}
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-semibold text-gray-800">
                  Late Tiers (After Shift Grace Time)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Each tier calculates minutes sequentially after Shift Grace Time & preceding tiers.
                </p>
              </div>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-2.5 py-1 text-[12px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                >
                  + Add Late Tier
                </button>
              )}
            </div>

            {/* Tiers List */}
            <div className="overflow-x-auto mt-1 border border-slate-200 rounded bg-white">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[12px]">
                  <tr>
                    <th className="py-1.5 px-3 w-[60px]">Tier</th>
                    <th className="py-1.5 px-3 w-[100px]">Code</th>
                    <th className="py-1.5 px-3">Label Name</th>
                    <th className="py-1.5 px-3 w-[150px]">Duration (Mins)</th>
                    {!isViewMode && <th className="py-1.5 px-3 w-[50px] text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-1.5 px-3 text-slate-500 font-medium text-[12px]">
                        #{idx + 1}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tier.code || ""}
                          onChange={(e) => handleTierChange(idx, "code", e.target.value.toUpperCase())}
                          disabled={isViewMode}
                          className="w-full h-[28px] px-2 text-[13px] border border-gray-200 rounded outline-none font-bold text-gray-800 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tier.name || ""}
                          onChange={(e) => handleTierChange(idx, "name", e.target.value)}
                          disabled={isViewMode}
                          className="w-full h-[28px] px-2 text-[13px] border border-gray-200 rounded outline-none text-gray-800 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={tier.mins || ""}
                            onChange={(e) => handleTierChange(idx, "mins", e.target.value)}
                            disabled={isViewMode}
                            className="w-20 h-[28px] px-2 text-[13px] border border-gray-200 rounded outline-none text-gray-800 disabled:bg-gray-100"
                          />
                          <span className="text-[11px] text-slate-500">mins</span>
                        </div>
                      </td>
                      {!isViewMode && (
                        <td className="py-1.5 px-2 text-center">
                          {tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTier(idx)}
                              title="Delete Tier"
                              className="text-red-500 hover:text-red-700 p-1 text-[13px] font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Timeline preview badge */}
            <div className="mt-1.5 p-2 bg-blue-50/70 border border-blue-100 rounded text-[11.5px] text-blue-900 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-blue-950">Timeline Rule:</span>
              <span>On-Time Cutoff (Grace In)</span>
              {tiers.map((t, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="text-slate-400">➔</span>
                  <span className="px-1.5 py-0.5 bg-white border border-blue-200 rounded font-semibold text-blue-700">
                    +{t.mins || 0}m ({t.code})
                  </span>
                </span>
              ))}
              <span className="text-slate-400">➔</span>
              <span className="text-slate-600">Then Shift Half-Day cutoff</span>
            </div>
          </div>

          {/* Row 4: Active Checkbox */}
          <div className="flex flex-row items-center gap-2 px-1">
            <label className="text-[13px] sm:text-[15px] font-medium text-gray-800 w-[95px] sm:w-[130px] shrink-0">
              Status
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active === true || formData.is_active === 1 || formData.is_active === "1" || formData.is_active === undefined}
                onChange={(e) => handleChange("is_active", e.target.checked ? 1 : 0)}
                disabled={isViewMode}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-[13.5px] font-medium text-gray-800">
                Active Rule
              </span>
            </label>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        saveBtnRef={saveBtnRef}
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

export default AttendanceRuleForm;

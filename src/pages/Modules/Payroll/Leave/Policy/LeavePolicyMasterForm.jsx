import React, { useState, useEffect, useCallback } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPTabBar from "../../../../../components/Reusable/form/ERPTabBar";
import FieldRenderer from "../../../../../components/Reusable/form/FieldRenderer";
import SectionCard, { FormField, formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import { getLeaveTypes, fetchUserGroupsByType } from "../../../../../utils/api";
import { showToast } from "../../../../../components/Reusable/alert";
import { IDENTIFICATION_SECTION, RULE_TABS } from "./leavePolicyConfig";
import LeavePolicyTenureSlabs from "./LeavePolicyTenureSlabs";
import LeavePolicyPreviewModal from "./LeavePolicyPreviewModal";
import { FaMagic } from "react-icons/fa";
import { CalendarCheck } from "lucide-react";

// Display value for a config field (see leavePolicyConfig.jsx)
const getFieldValue = (f, data, ctx) => {
  if (f.get) return f.get(data, ctx);
  const raw = data[f.key];
  if (f.bool) {
    const b = raw === undefined || raw === null ? !!f.default : !!raw;
    return b ? "Yes" : "No";
  }
  const v = raw ?? f.default ?? "";
  return f.int ? String(v) : v;
};

// Stored value for a config field; undefined means "ignore this change"
const toStoredValue = (f, v, data, ctx) => {
  if (f.set) return f.set(v, data, ctx);
  if (f.bool) return v === "Yes";
  if (f.int) return parseInt(v, 10);
  return v;
};

const LeavePolicyMasterForm = ({
  mode = "view",
  initialData = {},
  onSave,
  onCancel,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord = 1,
  totalRecords = 1,
  setFormData,
  rights,
  activeTab = "entry",
  onTabChange,
}) => {
  const [localData, setLocalData] = useState(initialData || {});
  const [errors, setErrors] = useState({});
  const [currentRuleTab, setCurrentRuleTab] = useState("credit");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const ctx = { leaveTypes, departments };

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [ltRes, deptRes] = await Promise.all([
          getLeaveTypes(),
          fetchUserGroupsByType("DEP"),
        ]);
        setLeaveTypes(ltRes?.data || []);
        setDepartments(deptRes?.data || []);
      } catch (err) {
        console.error("Error loading master data in Policy Form:", err);
      }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    setLocalData(initialData);
  }, [initialData]);

  const handleChange = (field, value) => {
    const updated = { ...localData, [field]: value };

    // Auto calculate days_per_period if annual quota or accrual method changed
    if (field === "annual_quota" || field === "accrual_method") {
      const quota = parseFloat(field === "annual_quota" ? value : updated.annual_quota) || 0;
      const method = field === "accrual_method" ? value : updated.accrual_method;

      let periods = 12;
      if (method === "Quarterly") periods = 4;
      else if (method === "Half-Yearly") periods = 2;
      else if (method === "Annual" || method === "FrontLoaded") periods = 1;

      updated.days_per_period = (quota / periods).toFixed(2);
    }

    setLocalData(updated);
    if (setFormData) setFormData(updated);
    setErrors((prev) => {
      const c = { ...prev };
      delete c[field];
      return c;
    });
  };

  // ── Validate & Save ────────────────────────────────────────────────────────
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    if (!localData.policy_code || String(localData.policy_code).trim() === "") {
      newErrors.policy_code = "Policy Code is required";
    }
    if (!localData.policy_name || String(localData.policy_name).trim() === "") {
      newErrors.policy_name = "Policy Name is required";
    }
    if (!localData.leave_type_id) {
      newErrors.leave_type_id = "Leave Type is required";
    }
    if (!localData.effective_from) {
      newErrors.effective_from = "Effective From date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({ icon: "error", title: "Please fill all required fields." });
      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  // ── Config-driven rendering ────────────────────────────────────────────────
  const renderField = (f) => {
    const enabled = f.enabledWhen ? f.enabledWhen(localData) : true;
    const disabled = isViewMode || !enabled;
    const options = typeof f.options === "function" ? f.options(ctx) : f.options;
    return (
      <FormField
        key={f.key}
        label={f.label}
        required={f.required}
        hint={f.hint}
        error={errors[f.key]}
        muted={!enabled}
        className={f.className}
      >
        <FieldRenderer
          fieldObj={{ ...f, options }}
          value={getFieldValue(f, localData, ctx)}
          disabled={disabled}
          error={errors[f.key]}
          onChange={(v) => {
            const stored = toStoredValue(f, v, localData, ctx);
            if (stored !== undefined) handleChange(f.key, stored);
          }}
          inputClassName={formInputClass(disabled, errors[f.key])}
        />
      </FormField>
    );
  };

  const renderSection = (s) => {
    if (s.custom === "tenure_slabs") {
      return (
        <LeavePolicyTenureSlabs
          key={s.title}
          section={s}
          formData={localData}
          onChange={handleChange}
          isViewMode={isViewMode}
        />
      );
    }
    return (
      <SectionCard
        key={s.title}
        title={s.title}
        icon={s.icon}
        theme={s.theme}
        className={s.className}
        bodyClassName={s.bodyClassName}
      >
        {s.fields.map(renderField)}
      </SectionCard>
    );
  };

  const activeRuleTab = RULE_TABS.find((t) => t.id === currentRuleTab) || RULE_TABS[0];

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-[#eef1f8]">
      {/* ── Standard ERP Header ── */}
      <ERPHeader
        title="LEAVE POLICY MASTER"
        TitleIcon={CalendarCheck}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
      />

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-[8px] flex flex-col gap-[8px]">
        {renderSection(IDENTIFICATION_SECTION)}

        {/* ── Rule Group Tabs ── */}
        <div className="flex flex-col bg-white border border-[#dde1ea] rounded-[6px] shadow-sm">
          <ERPTabBar
            tabs={RULE_TABS}
            activeTab={currentRuleTab}
            onChange={setCurrentRuleTab}
            className="rounded-t-[6px]"
            rightContent={
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 h-[28px] px-3 text-xs font-semibold text-[#9333ea] bg-[#faf5ff] border border-[#e9d5ff] rounded-md hover:bg-[#f3e8ff] whitespace-nowrap"
              >
                <FaMagic className="text-[11px]" /> <span className="hidden sm:inline">Preview Simulation</span>
              </button>
            }
          />
          <div className="p-[8px] bg-[#eef1f8] rounded-b-[6px] grid grid-cols-1 lg:grid-cols-2 gap-[8px] items-stretch">
            {activeRuleTab.sections.map(renderSection)}
          </div>
        </div>
      </div>

      {/* ── Standard ERP Footer Toolbar ── */}
      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={saving}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onEditCancel={onEditCancel}
        onDelete={onDelete ? () => onDelete(localData) : null}
        onCancel={onCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />

      {showPreviewModal && (
        <LeavePolicyPreviewModal policy={localData} onClose={() => setShowPreviewModal(false)} />
      )}
    </div>
  );
};

export default LeavePolicyMasterForm;

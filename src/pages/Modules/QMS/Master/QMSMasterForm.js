 
import React, { useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPSettings from "../../../../components/Reusable/ERPSettings";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchUserGroupsByType } from "../../../../utils/api";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const resolveTarget = (el) => {
  if (!el) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return el;
  return (
    el.querySelector(
      "input:not([disabled]):not([type='hidden']):not([type='file']), " +
      "select:not([disabled]), " +
      "textarea:not([disabled])",
    ) ?? el
  );
};

const getFocusableTargets = (container) => {
  if (!container) return [];
  const raw = Array.from(
    container.querySelectorAll(
      "input:not([disabled]):not([type='hidden']):not([type='file']), " +
      "select:not([disabled]), " +
      "textarea:not([disabled]), " +
      "[tabindex='0']:not([tabindex='-1'])",
    ),
  );
  const seen = new Set();
  const targets = [];
  for (const el of raw) {
    const target = resolveTarget(el);
    if (target && !seen.has(target)) {
      seen.add(target);
      targets.push(target);
    }
  }
  return targets;
};

// 👇 QMS ke saare masters ke liye generic form — remarks NAHI hai (QMS tables me column hi nahi)
const QMSMasterForm = ({
  nameLabel,
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
  onDelete,
  mode,
  onPrevRecord,
  onNextRecord,
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
  showActive = false,
  // Generic extra fields — har master apna label/key de sakta hai
  extraFields = [],   // [{ key: "code", label: "Equipment Code" }, ...]
  settingsConfig = [],
  settingsDefaults = {},
  onSettingsSave,
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isSettings = activeTab === "settings";

  const containerRef = useRef(null);
  const formDataRef = useRef(formData);
  const [groupOptions, setGroupOptions] = React.useState({});

  useEffect(() => {
    const groupTypes = [...new Set(
      (extraFields || []).filter((f) => f.type === "dropdown" && f.groupType).map((f) => f.groupType)
    )];
    groupTypes.forEach(async (gt) => {
      if (groupOptions[gt]) return; // already loaded
      try {
        const data = await fetchUserGroupsByType(gt);
        const rows = Array.isArray(data) ? data : data?.data || [];
        const names = rows.map((r) => r.group_name).filter(Boolean);
        setGroupOptions((prev) => ({ ...prev, [gt]: names }));
      } catch (err) {
        console.error(`Failed to load options for group type ${gt}`, err);
      }
    });
  }, [extraFields]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const [nameError, setNameError] = React.useState(false);
  useEffect(() => {
    if ((isAddMode || isEditMode) && !isSettings) {
      const timer = setTimeout(() => {
        const targets = getFocusableTargets(containerRef.current);
        if (targets.length > 0) targets[0].focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAddMode, isEditMode, isSettings]);

  const getInputStyle = useCallback(
    (hasError = false) => {
      if (isViewMode) {
        return "w-full h-[42px] lg:h-[30px] px-3 lg:px-2 text-[15px] lg:text-[14px] rounded-xl lg:rounded-md border outline-none transition-colors bg-[#eef1f6] text-gray-500 cursor-not-allowed border-slate-200";
      }
      if (hasError) {
        return "w-full h-[42px] lg:h-[30px] px-3 lg:px-2 text-[15px] lg:text-[14px] rounded-xl lg:rounded-md border outline-none transition-colors bg-white text-gray-900 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200";
      }
      return "w-full h-[42px] lg:h-[30px] px-3 lg:px-2 text-[15px] lg:text-[14px] rounded-xl lg:rounded-md border outline-none transition-colors bg-white text-gray-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
    },
    [isViewMode],
  );

  const saveBtnRef = useRef(null);
  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;
      const targets = getFocusableTargets(containerRef.current);
      if (targets.length === 0) return;
      const active = resolveTarget(e.target) ?? e.target;
      const index = targets.indexOf(active);

      if (e.key === "Enter") {
        if (active.tagName.toLowerCase() === "textarea") {
          if (!e.shiftKey) { e.preventDefault(); saveBtnRef?.current?.focus(); }
          return;
        }
        e.preventDefault();
        if (index !== -1 && index < targets.length - 1) targets[index + 1].focus();
        else saveBtnRef?.current?.focus();
      }
      if (e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        targets[index - 1]?.focus();
      }
    },
    [isViewMode],
  );

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const data = formDataRef.current;
    if (!data.group_name?.trim()) {
      setNameError(true);
      const targets = getFocusableTargets(containerRef.current);
      if (targets.length > 0) targets[0].focus();
      return;
    }
    setNameError(false);
    if (onSave) onSave(data);
  }, [isViewMode, onSave]);

  return (
    <div
      className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title={title || "QMS Master"}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showSettingsTab={showSettingsTab}
        rightContent={isSettings ? null : `${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      {isSettings ? (
        <ERPSettings
          applName={title || "QMS MASTER"}
          config={settingsConfig}
          initialValues={settingsDefaults}
          onSave={async (values) => {
            await onSettingsSave?.(values);
            onTabChange("entry");
          }}
          onCancel={() => onTabChange("entry")}
          onRestore={() => { }}
        />
      ) : (
        <>
          {/*
            min-w-[750px] used to be unconditional, which forced a 750px-wide
            box on phones too and caused horizontal scrolling. It's now
            sm:min-w-[750px] so mobile is free to shrink to full width while
            the desktop/tablet layout (>=640px) is completely unchanged.
          */}
          {/*
            min-w-[750px] used to be unconditional, which forced a 750px-wide
            box on phones too and caused horizontal scrolling. It's now
            lg:min-w-[750px] — aligned with the same lg breakpoint where field
            rows switch from stacked to inline — so mobile/tablet can shrink
            to full width while desktop (>=1024px) is completely unchanged.
          */}
          <div className="flex-1 p-3 lg:p-4 overflow-y-auto min-w-[450px] lg:min-w-[750px] mx-auto flex justify-center">
            <div
              id="qms-master-form-container"
              ref={containerRef}
              className="w-full max-w-[850px] h-fit bg-white border border-slate-200
                     shadow-sm rounded-2xl lg:rounded-md p-4 lg:p-5 grid grid-cols-1 gap-y-1 lg:gap-y-4"
            >
              {/* Name field — har master ke liye common */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 w-full px-1 py-3 lg:py-0 border-b border-gray-100 lg:border-0 last:border-b-0">
                <label className="text-gray-500 text-[12px] font-semibold uppercase tracking-wide lg:text-black-800 lg:text-[15px] lg:font-normal lg:normal-case lg:tracking-normal lg:min-w-[140px] shrink-0 lg:whitespace-nowrap">
                  {nameLabel || "Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  className={getInputStyle(nameError)}
                  value={formData.group_name || ""}
                  onChange={(e) => {
                    setNameError(false);
                    setFormData({ ...formData, group_name: e.target.value });
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                  placeholder={`Enter ${(nameLabel || "name").toLowerCase()}`}
                />
                {nameError && (
                  <span className="text-red-500 text-[12px] mt-1 lg:mt-0 lg:ml-1 whitespace-nowrap">
                    {nameLabel || "Name"} is required
                  </span>
                )}
              </div>

              {/* Generic extra fields — config se aate hain, entity ke hisaab se alag-alag */}
              {extraFields.map((f) => {
                if (f.type === "dropdown") {
                  return (
                    <div key={f.key} className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 w-full px-1 py-3 lg:py-0 border-b border-gray-100 lg:border-0 last:border-b-0">
                      <label className="text-gray-500 text-[12px] font-semibold uppercase tracking-wide lg:text-black-800 lg:text-[15px] lg:font-normal lg:normal-case lg:tracking-normal lg:min-w-[140px] shrink-0 lg:whitespace-nowrap">
                        {f.label}
                      </label>
                      <ERPAutocomplete
                        className={`${getInputStyle(false)} lg:min-w-[435px]`}
                        value={formData[f.key] || ""}
                        options={groupOptions[f.groupType] || []}
                        onChange={(val) => setFormData({ ...formData, [f.key]: val })}
                        onKeyDown={handleKeyDown}
                        disabled={isViewMode}
                      />
                    </div>
                  );
                }

                if (f.type === "code") {
                  // Auto-generated field — kabhi bhi manually type nahi karega, sirf display
                  return (
                    <div key={f.key} className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 w-full px-1 py-3 lg:py-0 border-b border-gray-100 lg:border-0 last:border-b-0">
                      <label className="text-gray-500 text-[12px] font-semibold uppercase tracking-wide lg:text-black-800 lg:text-[15px] lg:font-normal lg:normal-case lg:tracking-normal lg:min-w-[140px] shrink-0 lg:whitespace-nowrap">
                        {f.label}
                      </label>
                      <input
                        className={getInputStyle(false)}
                        value={formData[f.key] || ""}
                        disabled
                        readOnly
                      />
                    </div>
                  );
                }

                // default: plain text (jaise Supplier Type)
                return (
                  <div key={f.key} className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 w-full px-1 py-3 lg:py-0 border-b border-gray-100 lg:border-0 last:border-b-0">
                    <label className="text-gray-500 text-[12px] font-semibold uppercase tracking-wide lg:text-black-800 lg:text-[15px] lg:font-normal lg:normal-case lg:tracking-normal lg:min-w-[140px] shrink-0 lg:whitespace-nowrap">
                      {f.label}
                    </label>
                    <input
                      className={getInputStyle(false)}
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      onKeyDown={handleKeyDown}
                      disabled={isViewMode}
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <ERPFooter
            isAddMode={isAddMode}
            isViewMode={isViewMode}
            isEditMode={isEditMode}
            saving={saving}
            saveBtnRef={saveBtnRef}
            handleSubmit={handleValidateAndSave}
            onModify={onModify}
            onDelete={() => onDelete && onDelete(formData)}
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

export default QMSMasterForm;
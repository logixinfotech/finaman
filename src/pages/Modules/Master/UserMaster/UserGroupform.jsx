import React, { useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPSettings from "../../../../components/Reusable/ERPSettings";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

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

const UserGroupForm = ({
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
  showCategory = false,
  showActive = false,
  showDesignation = false,
  // naye props (component signature me add karo)
  showExtraField = false,
  extraFieldKey = "extra_field",
  extraFieldLabel = "Extra Field",
  showExtraField2 = false,
  extraField2Key = "extra_field2",
  extraField2Label = "Extra Field 2",
  showGstContact = false,
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const isSettings = activeTab === "settings";

  const containerRef = useRef(null);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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
        return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-[#eef1f6] text-gray-500 cursor-not-allowed border-slate-200";
      }
      if (hasError) {
        return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-white text-gray-900 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200";
      }
      return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-white text-gray-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
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

      // ── Enter ─────────────────────────────────────────────────────────────
      if (e.key === "Enter") {
        if (active.tagName.toLowerCase() === "textarea") {
          if (!e.shiftKey) {
            e.preventDefault();
            saveBtnRef?.current?.focus();
          }
          return;
        }

        e.preventDefault();

        if (index !== -1 && index < targets.length - 1) {
          targets[index + 1].focus();
        } else {
          // Last field → focus Save/Update button
          saveBtnRef?.current?.focus();
        }
      }
      if (e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        targets[index - 1].focus();
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full  sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title={title || "User Group Master"}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showSettingsTab={showSettingsTab}
        rightContent={
          isSettings ? null : `${currentRecord || 1} / ${totalRecords || 1}`
        }
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      {isSettings ? (
        <ERPSettings
          applName={title || "USER GROUP MASTER"}
          onCancel={() => onTabChange("entry")}
          onSave={(savedSettings) => {
            onTabChange("entry");
          }}
        />
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto min-w-[450px] lg:min-w-[750px] mx-auto flex justify-center">
            <div
              id="usergroup-form-container"
              ref={containerRef}
              className="w-full max-w-[850px] h-fit bg-white border border-slate-200
                     shadow-sm rounded-md p-5 grid grid-cols-1 gap-y-4"
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
                  onChange={(e) => {
                    setNameError(false);
                    setFormData({ ...formData, group_name: e.target.value });
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isViewMode}
                  placeholder="Enter group name"
                />
                {nameError && (
                  <span className="text-red-500 text-[12px] mt-1 lg:mt-0 lg:ml-1 whitespace-nowrap">
                    Group Name is required
                  </span>
                )}
              </div>

              {showCategory && (
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                  <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                    Category
                  </label>
                  <ERPAutocomplete
                    className={`${getInputStyle(false)} lg:min-w-[435px]`}
                    value={formData.category || ""}
                    onChange={(val) =>
                      setFormData({ ...formData, category: val })
                    }
                    onKeyDown={handleKeyDown}
                    disabled={isViewMode}
                    options={[
                      "Identity Documents",
                      "Educational Documents",
                      "Employment Documents",
                      "Financial / Other",
                    ]}
                  />
                </div>
              )}
              {showGstContact && (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                    <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                      GST No.
                    </label>
                    <input
                      className={getInputStyle(false)}
                      value={formData.gst_no || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, gst_no: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      disabled={isViewMode}
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                    <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                      Contact No.
                    </label>
                    <input
                      className={getInputStyle(false)}
                      value={formData.contact_no || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_no: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      disabled={isViewMode}
                      placeholder="Enter contact number"
                    />
                  </div>
                </>
              )}
              {showDesignation && (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                    <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                      Designation
                    </label>
                    <input
                      className={getInputStyle(false)}
                      value={formData.designation || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                      onKeyDown={handleKeyDown}
                      disabled={isViewMode}
                      placeholder="Enter designation"
                    />
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                    <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                      Department
                    </label>
                    <input
                      className={getInputStyle(false)}
                      value={formData.Department || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, Department: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      disabled={isViewMode}
                      placeholder="Enter department"
                    />
                  </div>
                </>
              )}

              {/* Generic Extra Field 1 — Code/GradeClass/SupplierType jaisi single-value fields ke liye */}
              {showExtraField && (
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                  <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                    {extraFieldLabel}
                  </label>
                  <input
                    className={getInputStyle(false)}
                    value={formData[extraFieldKey] || ""}
                    onChange={(e) => setFormData({ ...formData, [extraFieldKey]: e.target.value })}
                    onKeyDown={handleKeyDown}
                    disabled={isViewMode}
                    placeholder={`Enter ${extraFieldLabel.toLowerCase()}`}
                  />
                </div>
              )}

              {/* Generic Extra Field 2 — Personnel ke Department jaisi doosri field ke liye */}
              {showExtraField2 && (
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full px-1">
                  <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] shrink-0 whitespace-nowrap">
                    {extraField2Label}
                  </label>
                  <input
                    className={getInputStyle(false)}
                    value={formData[extraField2Key] || ""}
                    onChange={(e) => setFormData({ ...formData, [extraField2Key]: e.target.value })}
                    onKeyDown={handleKeyDown}
                    disabled={isViewMode}
                    placeholder={`Enter ${extraField2Label.toLowerCase()}`}
                  />
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4 px-1">
                <label className="text-black-800 text-[15px] min-w-[120px] sm:min-w-[140px] mt-2 shrink-0 whitespace-nowrap">
                  Remarks
                </label>
                <textarea
                  className={`${getInputStyle(false)} !h-[60px] py-2`}
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

export default UserGroupForm;

import React, { useCallback, useMemo, useEffect, useRef } from "react";
import ERPHeader   from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter   from "../../../../components/Reusable/form/FooterForm";
import ERPSettings from "../../../../components/Reusable/ERPSettings";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

// ─────────────────────────────────────────────────────────────────────────────
//  BUG FIXES
//  ─────────────────────────────────────────────────────────────────────────────
//  BUG-10  Auto-focus useEffect used document.getElementById which races against
//          mount timing; isSettings was missing from the dep array so the effect
//          didn't re-run when switching from settings → entry, leaving focus
//          nowhere. Fixed: use a containerRef (React ref, always in sync) and
//          add isSettings to deps. Timer cleaned up on unmount.
//
//  BUG-11  handleKeyDown built its elements list with only
//          "input:not([disabled]), textarea:not([disabled])".
//          ERPAutocomplete renders <div tabindex="0"><input .../></div>; the
//          internal <input> IS captured by the selector (correct), but when
//          showCategory=true the autocomplete input could appear before or
//          after the text inputs in DOM order depending on the component's
//          internal markup — the list ordering was unreliable. Fixed: collect
//          all focusable candidates with a unified ordered selector and resolve
//          the deepest real <input> before focusing (same pattern as the fix
//          in ERPFormBuilder).
//
//  BUG-12  Backspace edge case: selectionStart > 0 means cursor is mid-text —
//          don't navigate. Also selectionStart === null (e.g. on a textarea with
//          a range selection) was not handled. Fixed with explicit null check.
//
//  BUG-13  handleValidateAndSave focused the first error field via the fragile
//          selector querySelector('input[placeholder*="group"]'). If the
//          placeholder text ever changes or is translated the focus silently
//          fails. Fixed: use containerRef to find the first <input> inside
//          the container — same element, zero coupling to placeholder text.
//
//  BUG-14  Two separate style utilities existed: a `styles` useMemo object and
//          a `getInputStyle` useCallback. The textarea used `styles.input` which
//          can never reflect error state (it takes no argument). Removed `styles`;
//          everything now goes through `getInputStyle`. Textarea receives
//          the `hasError` flag if needed in the future.
//
//  BUG-15  onSave prop from the parent was recreated on every parent render
//          (not memoised at the parent), causing handleValidateAndSave to
//          recreate on every render and forcing ERPFooter to re-render.
//          Can't fix the parent prop stability here, but removed formData from
//          the useCallback dep by reading it through a ref — stable closure,
//          zero stale-data risk.
//
//  FEAT-F1  After save the page calls handleView(freshList[record]) which sets
//           mode → "view" and formData to the authoritative server record.
//           No extra work needed in the form itself; the form correctly renders
//           in view mode with whatever formData is passed in.
//
//  FEAT-F2  Auto-focus: on entering add or edit mode, first focusable field in
//           the container receives focus. Uses containerRef — reliable, no race.
//
//  FEAT-F3  Backspace on an empty (or cursor-at-start) field navigates to the
//           previous focusable field. Implemented in handleKeyDown.
// ─────────────────────────────────────────────────────────────────────────────

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Given any element matched by querySelector (could be a wrapper div from
 * ERPAutocomplete), resolve the innermost real interactive element.
 * Prefers native <input>/<select>/<textarea> over a tabindex wrapper.
 */
const resolveTarget = (el) => {
  if (!el) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return el;
  // Wrapper div — look for a native input inside it first
  return (
    el.querySelector(
      "input:not([disabled]):not([type='hidden']):not([type='file']), " +
      "select:not([disabled]), " +
      "textarea:not([disabled])"
    ) ?? el   // fall back to el itself if nothing native found
  );
};

/**
 * Return an ordered list of all focusable field elements inside a container.
 * Collects native inputs + tabindex wrappers, then deduplicates so that
 * an ERPAutocomplete's wrapper div and its internal <input> don't both appear.
 * The resolved target (real input) is what we operate on.
 */
const getFocusableTargets = (container) => {
  if (!container) return [];

  const raw = Array.from(
    container.querySelectorAll(
      "input:not([disabled]):not([type='hidden']):not([type='file']), " +
      "select:not([disabled]), " +
      "textarea:not([disabled]), " +
      "[tabindex='0']:not([tabindex='-1'])"
    )
  );

  // Deduplicate: if a wrapper div and the input inside it both appear, keep only
  // the input (resolveTarget of the wrapper = the input, so they map to the same el)
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

// ── component ─────────────────────────────────────────────────────────────────

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
  activeTab    = "entry",
  onTabChange,
  showSettingsTab = false,
  showCategory    = false,
}) => {
  const isViewMode = mode === "view";
  const isAddMode  = mode === "add";
  const isEditMode = mode === "edit";
  const isSettings = activeTab === "settings";

  // BUG-10 FIX: use a ref for the container — always in sync with the DOM
  const containerRef = useRef(null);

  // BUG-15 FIX: read formData through a ref in the save handler so the
  // useCallback never goes stale even when formData changes rapidly
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // ── validation error state ─────────────────────────────────────────────────
  // Kept as a simple boolean since there's only one required field.
  // Extend to an errors object if more required fields are added.
  const [nameError, setNameError] = React.useState(false);

  // ── FEAT-F2: auto-focus on mode change ────────────────────────────────────
  // BUG-10 FIX: added isSettings to deps; uses containerRef (not getElementById)
  useEffect(() => {
    if ((isAddMode || isEditMode) && !isSettings) {
      const timer = setTimeout(() => {
        const targets = getFocusableTargets(containerRef.current);
        if (targets.length > 0) targets[0].focus();
      }, 150);
      return () => clearTimeout(timer);   // clean up if mode changes mid-flight
    }
  }, [isAddMode, isEditMode, isSettings]);

  // ── style helper (BUG-14 FIX: single source of truth) ────────────────────
  const getInputStyle = useCallback((hasError = false) => {
    if (isViewMode) {
      return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-[#eef1f6] text-gray-500 cursor-not-allowed border-slate-200";
    }
    if (hasError) {
      return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-white text-gray-900 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200";
    }
    return "w-full h-[30px] px-2 text-[14px] rounded-md border outline-none transition-colors bg-white text-gray-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
  }, [isViewMode]);
  const saveBtnRef=useRef(null)

  // ── keyboard navigation ───────────────────────────────────────────────────
  // BUG-11 FIX: unified focusable list via getFocusableTargets (handles ERPAutocomplete)
  // FEAT-F3: Backspace on empty / cursor-at-start → previous field
  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;

    const targets = getFocusableTargets(containerRef.current);
    if (targets.length === 0) return;

    // resolveTarget: e.target might be the wrapper div (if fired on it) or the
    // real input — normalise to what is actually in the targets list
    const active  = resolveTarget(e.target) ?? e.target;
    const index   = targets.indexOf(active);

    // ── Enter ─────────────────────────────────────────────────────────────
    if (e.key === "Enter") {
      // Textarea: only intercept plain Enter (Shift+Enter = new line)
      if (active.tagName.toLowerCase() === "textarea") {
        if (!e.shiftKey) {
          // from textarea, Enter → save button
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

    // ── Backspace (FEAT-F3) ────────────────────────────────────────────────
    // Navigate to previous field only when the field is effectively empty:
    //   • value is empty string, OR
    //   • cursor is at position 0 (beginning of text, nothing to delete to the left)
    // BUG-12 FIX: guard selectionStart === null (e.g. certain browser/input combos)
    if (e.key === "Backspace" && index > 0) {
      const cursorAtStart =
        active.selectionStart !== null
          ? active.selectionStart === 0
          : false;
      const isEmpty = !active.value;

      if (isEmpty || cursorAtStart) {
        e.preventDefault();
        targets[index - 1].focus();
      }
      // else: let the browser handle normal character deletion
    }
  }, [isViewMode]);

  // ── save with validation ──────────────────────────────────────────────────
  // BUG-13 FIX: use containerRef instead of fragile placeholder selector
  // BUG-15 FIX: read latest formData via ref so dep array only needs onSave
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const data = formDataRef.current;

    if (!data.group_name?.trim()) {
      setNameError(true);
      // Focus the first input in the container — always the Group Name field
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
      className="w-full max-w-[700px] mx-auto bg-white rounded-xl shadow-lg border flex flex-col min-h-[calc(100vh-160px)] overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      {/* Header — tabs live here, always visible */}
      <ERPHeader
        title={title || "User Group Master"}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showSettingsTab={showSettingsTab}
        rightContent={isSettings ? null : `${currentRecord || 1} / ${totalRecords || 1}`}
      />

      {/* Body: settings panel OR entry form */}
      {isSettings ? (

        // ── SETTINGS PANEL ────────────────────────────────────────────────
        <ERPSettings
          applName={title || "USER GROUP MASTER"}
          onCancel={() => onTabChange("entry")}
          onSave={(savedSettings) => {
            console.log("Settings saved:", savedSettings);
            onTabChange("entry");
          }}
        />

      ) : (

        // ── ENTRY FORM ────────────────────────────────────────────────────
        <>
          <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
            <div
              id="usergroup-form-container"
              ref={containerRef}
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
                  onChange={(e) => {
                    setNameError(false);
                    setFormData({ ...formData, group_name: e.target.value.toUpperCase() });
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

              {/* Category — only for DOC type */}
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

              {/* Remarks */}
              {/* BUG-14 FIX: uses getInputStyle instead of the removed styles.input */}
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

          {/* Footer — only when NOT in settings */}
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
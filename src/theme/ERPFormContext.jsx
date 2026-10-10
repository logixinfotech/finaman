// context/ERPFormContext.jsx
import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";

const ERPFormMetaContext = createContext(null);
const ERPFormDataContext = createContext(null);

export const useERPFormMeta = () => {
  const ctx = useContext(ERPFormMetaContext);
  if (!ctx) throw new Error("useERPFormMeta must be used inside ERPFormProvider");
  return ctx;
};

export const useERPFormData = () => {
  const ctx = useContext(ERPFormDataContext);
  if (!ctx) throw new Error("useERPFormData must be used inside ERPFormProvider");
  return ctx;
};

export function ERPFormProvider({ children, ...props }) {
  const {
    title,subtitle, configs, getHeaderStyle, TabIcon, getInitials = (str = "") => str.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "—",
    sidebarName, sidebarSub,TitleIcon, sidebarConfig = {}, completedTabs = [],
    tabs = [], tabStage = {}, fieldGroups = {}, customTabs = {}, tabLabels = {},
    formData = {}, setFormData,
    requiredFields = [], widthConfig = {},
    mode, saving, rights, canPrint,
    onSave, onCancel, onDelete, onModify, onNewEntry, onPrint, onEditCancel,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    showSettingsTab = false, hideSidebar = false, hideTabBar = false,
    activeTab: externalFormTab, onTabChange: onFormTabChange,
    headerActiveTab, onHeaderTabChange,
    settingsConfig = [], settingsDefaults = {}, onSettingsSave,
    cleanAndSliceField, validateSingleField,
    workflowConfig = null,
    currentUserRole = null,
    currentUserName = null,
    onSignedSave = null,
    onSaveDraft = null,
    alwaysSignTabs = [],
    stageHistory = null,
    rightSidebarConfig = null,
    savedFormData = null,
    moduleKey = null,
    recordHistory = null,
  } = props;

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const [headerTab, setHeaderTab] = useState("entry");
  const effectiveHeaderTab = headerActiveTab ?? headerTab;
  const [internalFormTab, setInternalFormTab] = useState(tabs[0] ?? "");
  const activeTab = externalFormTab ?? internalFormTab;

  const setActiveTab = useCallback((t) => {
    setInternalFormTab(t);
    onFormTabChange?.(t);
  }, [onFormTabChange]);

  const handleHeaderTabChange = useCallback((t) => {
    setHeaderTab(t);
    onHeaderTabChange?.(t);
  }, [onHeaderTabChange]);

useEffect(() => {
  if (!tabs.length) return;
  const stageNow = workflowConfig?.wf ? workflowConfig.wf.indexOf(formData?.Status) : -1;
  const turnTab = tabs.find((t) => tabStage[t] === stageNow) || tabs[0];
  if (mode === "add" || mode === "edit" || mode === "view") {   // 🔧 "view" add kiya
    if (onFormTabChange) onFormTabChange(turnTab);
    else setInternalFormTab(turnTab);
  }
}, [mode, tabs, tabStage, workflowConfig, formData?.Status, formData?.Id, onFormTabChange]);   // 🔧 formData?.Id add kiya

  const saveBtnRef = useRef(null);
  const formDataRef = useRef(formData);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMounted = useRef(true);
  const skipAutoFocusRef = useRef(false);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [errors, setErrors] = useState({});
  const [focusedEmailField, setFocusedEmailField] = useState(null);

  const handleChange = useCallback((field, value, fieldObj) => {
    const processedValue = cleanAndSliceField ? cleanAndSliceField(field, value) : value;
    let updated = { ...formDataRef.current, [field]: processedValue };
    if (fieldObj?.onChange) updated = fieldObj.onChange(processedValue, updated);
    setFormData(updated);

    if (validateSingleField) {
      const errorMsg = validateSingleField(field, processedValue);
      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) next[field] = errorMsg; else delete next[field];
        return next;
      });
    } else if (errors[field]) {
      setErrors((prev) => { const c = { ...prev }; delete c[field]; return c; });
    }
  }, [setFormData, errors, cleanAndSliceField, validateSingleField]);
  // ── 🆕 SAVE DRAFT (auto + manual) ───────────────────────────────────
  const [draftStatus, setDraftStatus] = useState(null); // null | 'saving' | 'saved'
  const [savingDraft, setSavingDraft] = useState(false);  // button ke liye separate loading
  const draftTimerRef = useRef(null);
  const skipNextAutoSaveRef = useRef(true);

  useEffect(() => {
    skipNextAutoSaveRef.current = true;
    setDraftStatus(null);
  }, [mode, formData.Id]);

  const runSaveDraft = useCallback(async () => {
    if (!onSaveDraft) return;
    try {
      setDraftStatus('saving');
      await onSaveDraft(formDataRef.current);
      if (isMounted.current) setDraftStatus('saved');
    } catch (err) {
      console.error('Save draft failed:', err);
      if (isMounted.current) setDraftStatus(null);
    }
  }, [onSaveDraft]);

  // auto-save — 5 sec debounce
  // useEffect(() => {
  //   if (skipNextAutoSaveRef.current) { skipNextAutoSaveRef.current = false; return; }
  //   if (!onSaveDraft || isViewMode || !(isAddMode || isEditMode)) return;
  //   if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  //   draftTimerRef.current = setTimeout(runSaveDraft, 5000);
  //   return () => clearTimeout(draftTimerRef.current);
  // }, [formData, onSaveDraft, isViewMode, isAddMode, isEditMode, runSaveDraft]);

  // manual button — turant save, timer cancel
  const handleSaveDraftClick = useCallback(async () => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    setSavingDraft(true);
    await runSaveDraft();
    setSavingDraft(false);
  }, [runSaveDraft]);
  // ─────────────────────────────────────────────────────────────────
  const norm = (v) => String(v ?? '').trim().toLowerCase();

 const currentStage = workflowConfig?.wf
  ? workflowConfig.wf.indexOf(formData?.Status)
  : -1;
const myTurnTab = tabs.find((t) => tabStage[t] === currentStage) || null;   // 🆕

  const isAdminRole = ['admin', 'administrator', 'superadmin', 'super admin']
    .includes(norm(currentUserRole));

  const matchRole = useCallback((secRole) => {
    if (isAdminRole) return true;
    const roles = Array.isArray(secRole) ? secRole : [secRole];
    return roles.some((r) => norm(r) === norm(currentUserRole));
  }, [currentUserRole, isAdminRole]);

  const hasVal = (src, k) => String(src?.[k] ?? '').trim() !== '';

  const isRecordClosed = !!workflowConfig?.closedStates?.includes(formData?.Status);



  // LOCK ke liye — sirf SAVED data dekho, live typing nahi.
  // requiredKeys khali ho to section kabhi apne aap lock na ho.
  const isSecSaved = useCallback((sec) => {
    if (isAddMode) return false;                    // 🆕 naya record kabhi "saved" nahi
    if (!savedFormData?.Id) return false;           // 🆕 record hi nahi hai
    const keys = sec.requiredKeys || [];
    if (keys.length === 0) return false;
    return keys.every((k) => hasVal(savedFormData, k));
  }, [savedFormData, isAddMode]);

  // STAGE ADVANCE ke liye — live formData dekho (save + advance ek saath hota hai).
  // khali requiredKeys wala section stage ko block na kare.
  const isSecComplete = useCallback((sec) => {
    const keys = sec.requiredKeys || [];
    if (keys.length === 0) return true;
    return keys.every((k) => hasVal(formData, k));
  }, [formData]);

  const currentStageSections = useMemo(
    () => (workflowConfig?.sections || []).filter((s) => s.stage === currentStage),
    [workflowConfig, currentStage]
  );

  const isStageComplete = useMemo(
    () => currentStageSections.length > 0 && currentStageSections.every(isSecComplete),
    [currentStageSections, isSecComplete]
  );

  const stagePendingSections = useMemo(
    () => currentStageSections
      .filter((s) => !isSecComplete(s))
      .map((s) => ({ key: s.key, role: s.role })),
    [currentStageSections, isSecComplete]
  );
  const sectionAccess = useMemo(() => {
    if (!workflowConfig?.sections?.length) return null;

    // is stage me kitne alag role hain?
    const rolesAtStage = new Set(
      (workflowConfig.sections || [])
        .filter((s) => s.stage === currentStage)
        .map((s) => norm(Array.isArray(s.role) ? s.role[0] : s.role))
    );
    const multiRoleStage = rolesAtStage.size > 1;

    const map = {};
    workflowConfig.sections.forEach((sec) => {
      const isPast = sec.stage < currentStage;
      const isActive = sec.stage === currentStage;
      const mine = matchRole(sec.role);
      const saved = isSecSaved(sec);

      let state;
      if (isPast) state = 'done';
      // lock sirf tab jab stage me DO role hon aur doosre ka intezaar ho
      else if (isActive && saved && multiRoleStage && !isStageComplete) state = 'done';
      else if (isActive && mine) state = 'editable';
      else if (isActive) state = 'pending';
      else state = 'locked';

      map[sec.key] = { state, role: sec.role };
    });
    return map;
  }, [workflowConfig, currentStage, matchRole, isSecSaved, isStageComplete]);


  // sirf apne editable sections ke required keys — locked section ke fields
  // user bhar hi nahi sakta, unpe validation atkegi nahi
  const myRequiredKeys = useMemo(() => {
    if (!workflowConfig?.sections?.length) return requiredFields || [];
    const mine = currentStageSections.filter((s) => matchRole(s.role));
    if (!mine.length) return [];
    return [...new Set(mine.flatMap((s) => s.requiredKeys || []))];
  }, [workflowConfig, currentStageSections, matchRole, requiredFields]);

  // 🆕 skip rules ke hisaab se agla stage
  const shouldSkipStage = useCallback((idx) => {
    const rule = workflowConfig?.stageSkip?.[idx];
    if (!rule) return false;
    return norm(formData?.[rule.field]) === norm(rule.equals);
  }, [workflowConfig, formData]);

  const nextStage = useMemo(() => {
    if (!workflowConfig?.wf || currentStage < 0) return null;
    const lastIdx = workflowConfig.wf.length - 1;
    let i = currentStage + 1;
    while (i < lastIdx && shouldSkipStage(i)) i++;
    return i <= lastIdx ? workflowConfig.wf[i] : null;
  }, [workflowConfig, currentStage, shouldSkipStage]);

  // sidebar ke liye — kaunse stage skip ho rahe hain
  const skippedStages = useMemo(() => {
    if (!workflowConfig?.wf) return [];
    return workflowConfig.wf.map((_, i) => i).filter((i) => shouldSkipStage(i));
  }, [workflowConfig, shouldSkipStage]);

  // 🆕 jin stages ka skip-rule true hai, unke corresponding tabs ki list
const skippedTabs = useMemo(
  () => tabs.filter((t) => skippedStages.includes(tabStage[t])),
  [tabs, tabStage, skippedStages]
);

// 🆕 Tab labels — sirf visible tabs ginte hue renumber
const tabDisplayLabels = useMemo(() => {
  const visible = tabs.filter((t) => !skippedTabs.includes(t));
  const map = {};
  visible.forEach((t, i) => {
    const raw = tabLabels?.[t] || t;
    map[t] = `${i + 1}. ${String(raw).replace(/^\d+\.\s*/, '')}`;
  });
  return map;
}, [tabs, skippedTabs, tabLabels]);

// 🆕 Section headers — saari visible tabs ke saare sections, tab-order mein, flat list banake renumber
const sectionDisplayTitle = useMemo(() => {
  const titles = [];
  tabs.forEach((t) => {
    if (skippedTabs.includes(t)) return;
    const group = fieldGroups[t];
    if (Array.isArray(group)) {
      group.forEach((row) => (row || []).forEach(([title]) => titles.push(title)));
    } else if (group && typeof group === 'object') {
      Object.keys(group).forEach((title) => titles.push(title));
    }
  });
  const map = {};
  titles.forEach((title, i) => {
    map[title] = `${i + 1}. ${String(title).replace(/^\d+\.\s*/, '')}`;
  });
  return map;
}, [tabs, skippedTabs, fieldGroups]);

  // 🆕 skippedStages ke BAAD — TDZ error se bachne ke liye
  const workflowSidebarData = workflowConfig?.wf
    ? { stages: workflowConfig.wf, currentStage, isClosed: isRecordClosed, skippedStages }
    : null;

  // stage index -> us stage ke roles (sidebar me "Pending — QA Head" dikhane ke liye)
  const stageRoles = useMemo(() => {
    const map = {};
    (workflowConfig?.sections || []).forEach((sec) => {
      if (!map[sec.stage]) map[sec.stage] = [];
      const roles = Array.isArray(sec.role) ? sec.role : [sec.role];
      roles.forEach((r) => { if (r && !map[sec.stage].includes(r)) map[sec.stage].push(r); });
    });
    return map;
  }, [workflowConfig]);

  const isMyTurn = currentStageSections.some((sec) => matchRole(sec.role));

  // 1. compute
  const canReject = useMemo(() => {
    if (!workflowConfig || isAddMode || isRecordClosed) return false;
    if (!formData?.Id) return false;                                      // 🆕 saved record hi reject ho
    if (workflowConfig.allowReject === false) return false;
    if (String(formData?.Status || '').toLowerCase() === 'rejected') return false;
    const allowed = workflowConfig.rejectableStages;
    if (allowed && !allowed.includes(currentStage)) return false;
    return isMyTurn;
  }, [workflowConfig, isAddMode, isRecordClosed, currentStage, isMyTurn, formData?.Status, formData?.Id]);

  const canDeleteNow = useMemo(() => {
  if (!workflowConfig?.sections?.length) return true;   // masters — hamesha allowed
  if (isAddMode || isRecordClosed) return false;
  return currentStage === 0;   // sirf pehli stage par delete allowed
}, [workflowConfig, isAddMode, isRecordClosed, currentStage]);

  // 🆕 naya record sirf stage 0 ka role bana sakta hai
  const canAddNew = useMemo(() => {
    if (!workflowConfig?.sections?.length) return true;   // masters — hamesha allowed
    if (isAdminRole) return true;
    const stage0Roles = workflowConfig.sections
      .filter((s) => s.stage === 0)
      .flatMap((s) => (Array.isArray(s.role) ? s.role : [s.role]))
      .map(norm);
    return stage0Roles.includes(norm(currentUserRole));
  }, [workflowConfig, isAdminRole, currentUserRole]);

  // sectionTitle -> fields[] (dono fieldGroups formats handle)
  const sectionFieldMap = useMemo(() => {
    const map = {};
    Object.values(fieldGroups || {}).forEach((group) => {
      if (Array.isArray(group)) {
        group.forEach((row) => (row || []).forEach(([t, f]) => { map[t] = f; }));
      } else if (group && typeof group === 'object') {
        Object.entries(group).forEach(([t, f]) => { map[t] = f; });
      }
    });
    return map;
  }, [fieldGroups]);

 const completionPercentage = useMemo(() => {
  if (isRecordClosed && formData?.Status !== "Rejected") return 100;   // 🔧 Rejected ko exclude kiya

  const allSections = workflowConfig?.sections || [];
  const keys = allSections.length
    ? [...new Set(allSections.flatMap((sec) =>
      (sectionFieldMap[sec.key] || [])
        .filter((f) => f.key && !f.disabled
          && f.type !== 'row-break' && f.type !== 'section-divider'
          && (!f.showIf || f.showIf(formData)))
        .map((f) => f.key)
    ))]
    : (requiredFields || []);

  if (!keys.length) return 0;
  const filled = keys.filter((k) => hasVal(formData, k)).length;
  return Math.round((filled / keys.length) * 100);
}, [isRecordClosed, workflowConfig, sectionFieldMap, requiredFields, formData]);
  // ────────────────────────────────────────────────────────────────────

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const photoKey = sidebarConfig.photoFieldKey || "logo";
    const reader = new FileReader();
    reader.onload = () => handleChange(photoKey, reader.result);
    reader.onerror = () => console.error("Failed to read file for upload");
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleChange, sidebarConfig.photoFieldKey]);

  const handleDomainSelect = useCallback((fieldKey, domain, fieldObj) => {
    const currentVal = formData[fieldKey] || "";
    const baseText = currentVal.includes("@") ? currentVal.split("@")[0] : currentVal;
    handleChange(fieldKey, `${baseText}${domain}`, fieldObj);
  }, [formData, handleChange]);

  const validateForm = useCallback((data) => {
    const errs = {};
    myRequiredKeys.forEach((key) => {
      if (String(data?.[key] ?? '').trim() === '') errs[key] = "This field is required";
    });
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  }, [myRequiredKeys]);

  const metaValue = useMemo(() => ({
    title,subtitle, configs, getHeaderStyle, TabIcon,TitleIcon, getInitials,
    sidebarName, sidebarSub, sidebarConfig, completedTabs,
    tabs, tabLabels, fieldGroups, customTabs, requiredFields, widthConfig,
    mode, isViewMode, isAddMode, isEditMode, saving, rights, canPrint,
    onSave, onCancel, onDelete, onModify, onNewEntry, onPrint, onEditCancel,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    showSettingsTab, hideSidebar, hideTabBar, skippedStages, skippedTabs, tabDisplayLabels, sectionDisplayTitle,
    activeTab, setActiveTab, effectiveHeaderTab, handleHeaderTabChange,
    settingsConfig, settingsDefaults, onSettingsSave,
    saveBtnRef, scrollContainerRef, fileInputRef, isMounted, skipAutoFocusRef,
    handleFileChange, validateForm,
    sectionAccess, workflowSidebarData, nextStage, isMyTurn, canReject, canDeleteNow, onSignedSave, completionPercentage, alwaysSignTabs, stageHistory, currentUserRole, currentUserName, 
    isStageComplete, stagePendingSections, currentStage, myTurnTab, savedFormData, isRecordClosed, myRequiredKeys, stageRoles, draftStatus, savingDraft, handleSaveDraftClick, rightSidebarConfig, moduleKey, recordHistory, canAddNew,
  }), [
    title,subtitle, configs, getHeaderStyle, TabIcon,TitleIcon, getInitials,
    sidebarName, sidebarSub, sidebarConfig, completedTabs,
    tabs, tabLabels, fieldGroups, customTabs, requiredFields, widthConfig,
    mode, isViewMode, isAddMode, isEditMode, saving, rights, canPrint,
    onSave, onCancel, onDelete, onModify, onNewEntry, onPrint, onEditCancel,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    showSettingsTab, hideSidebar, hideTabBar, skippedStages, skippedTabs, tabDisplayLabels, sectionDisplayTitle,
    activeTab, setActiveTab, effectiveHeaderTab, handleHeaderTabChange,
    settingsConfig, settingsDefaults, onSettingsSave,
    handleFileChange, validateForm,
    sectionAccess, workflowSidebarData, nextStage, isMyTurn, canReject, canDeleteNow, onSignedSave, completionPercentage, alwaysSignTabs, stageHistory, currentUserRole, currentUserName, 
    isStageComplete, stagePendingSections, currentStage, myTurnTab, savedFormData, isRecordClosed, myRequiredKeys, stageRoles, draftStatus, savingDraft, handleSaveDraftClick, rightSidebarConfig, moduleKey, recordHistory, canAddNew,

  ]);
  const dataValue = useMemo(() => ({
    formData, formDataRef, errors, setErrors,
    handleChange, handleDomainSelect,
    focusedEmailField, setFocusedEmailField,
  }), [formData, errors, handleChange, handleDomainSelect, focusedEmailField]);

  return (
    <ERPFormMetaContext.Provider value={metaValue}>
      <ERPFormDataContext.Provider value={dataValue}>
        {children}
      </ERPFormDataContext.Provider>
    </ERPFormMetaContext.Provider>
  );
}

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
    title, configs, getHeaderStyle, TabIcon, getInitials = (str = "") => str.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "—",
    sidebarName, sidebarSub, sidebarConfig = {}, completedTabs = [],
    tabs = [], fieldGroups = {}, customTabs = {},
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
    onSignedSave = null,
    alwaysSignTabs = [],       // 🆕 in tabs pe role match na ho tab bhi sign maango
    stageHistory = null,       // 🆕 (req #3 ke liye) 
    stageEntered = null,
     savedFormData = null,
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
    if (mode === "add" && tabs.length > 0) {
      if (onFormTabChange) onFormTabChange(tabs[0]);
      else setInternalFormTab(tabs[0]);
    }
  }, [mode, tabs, onFormTabChange]);

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

 // ── 🆕 WORKFLOW SECTION ACCESS ────────────────────────────────────────
// ── 🆕 WORKFLOW SECTION ACCESS ────────────────────────────────────────
  const norm = (v) => String(v ?? '').trim().toLowerCase();

  const currentStage = workflowConfig?.wf
    ? workflowConfig.wf.indexOf(formData?.Status)
    : -1;

  const isAdminRole = ['admin', 'administrator', 'superadmin', 'super admin']
    .includes(norm(currentUserRole));

  const matchRole = useCallback((secRole) => {
    if (isAdminRole) return true;
    const roles = Array.isArray(secRole) ? secRole : [secRole];
    return roles.some((r) => norm(r) === norm(currentUserRole));
  }, [currentUserRole, isAdminRole]);

  const hasVal = (src, k) => String(src?.[k] ?? '').trim() !== '';

 const isRecordClosed = !!workflowConfig?.closedStates?.includes(formData?.Status);

  const workflowSidebarData = workflowConfig?.wf
    ? { stages: workflowConfig.wf, currentStage, isClosed: isRecordClosed }
    : null;

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
    const map = {};
    workflowConfig.sections.forEach((sec) => {
      const isPast   = sec.stage < currentStage;
      const isActive = sec.stage === currentStage;
      const mine     = matchRole(sec.role);
      const saved    = isSecSaved(sec);          // DB me bhara hua hai?

      let state;
      if (isPast)                  state = 'done';       // ✓ sign ho chuka
      else if (isActive && saved)  state = 'done';       // ✓ is dept ne bhar diya
      else if (isActive && mine)   state = 'editable';   // ✏ Your turn
      else if (isActive)           state = 'pending';    // ⏳ doosre dept ka turn
      else                         state = 'locked';     // 🔒 aane wala stage

      map[sec.key] = { state, role: sec.role };
    });
    return map;
  }, [workflowConfig, currentStage, matchRole, isSecSaved]);

 
// sirf apne editable sections ke required keys — locked section ke fields
  // user bhar hi nahi sakta, unpe validation atkegi nahi
  const myRequiredKeys = useMemo(() => {
    if (!workflowConfig?.sections?.length) return requiredFields || [];
    const mine = currentStageSections.filter((s) => matchRole(s.role));
    if (!mine.length) return [];
    return [...new Set(mine.flatMap((s) => s.requiredKeys || []))];
  }, [workflowConfig, currentStageSections, matchRole, requiredFields]);

  const nextStage =
    workflowConfig?.wf && currentStage >= 0 && currentStage + 1 < workflowConfig.wf.length
      ? workflowConfig.wf[currentStage + 1]
      : null;

  const isMyTurn = currentStageSections.some((sec) => matchRole(sec.role));

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
    if (isRecordClosed) return 100;

    const keys = currentStageSections.length
      ? [...new Set(currentStageSections.flatMap((sec) =>
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
  }, [isRecordClosed, currentStageSections, sectionFieldMap, requiredFields, formData]);
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
    title, configs, getHeaderStyle, TabIcon, getInitials,
    sidebarName, sidebarSub, sidebarConfig, completedTabs,
    tabs, fieldGroups, customTabs, requiredFields, widthConfig,
    mode, isViewMode, isAddMode, isEditMode, saving, rights, canPrint,
    onSave, onCancel, onDelete, onModify, onNewEntry, onPrint, onEditCancel,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    showSettingsTab, hideSidebar, hideTabBar,
    activeTab, setActiveTab, effectiveHeaderTab, handleHeaderTabChange,
    settingsConfig, settingsDefaults, onSettingsSave,
    saveBtnRef, scrollContainerRef, fileInputRef, isMounted, skipAutoFocusRef,
    handleFileChange, validateForm,
    sectionAccess, workflowSidebarData, nextStage, isMyTurn, onSignedSave, completionPercentage, alwaysSignTabs, stageHistory, 
    isStageComplete, stagePendingSections, currentStage, savedFormData,isRecordClosed ,myRequiredKeys, stageEntered,  
  }), [
    title, configs, getHeaderStyle, TabIcon, getInitials,
    sidebarName, sidebarSub, sidebarConfig, completedTabs,
    tabs, fieldGroups, customTabs, requiredFields, widthConfig,
    mode, isViewMode, isAddMode, isEditMode, saving, rights, canPrint,
    onSave, onCancel, onDelete, onModify, onNewEntry, onPrint, onEditCancel,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    showSettingsTab, hideSidebar, hideTabBar,
    activeTab, setActiveTab, effectiveHeaderTab, handleHeaderTabChange,
    settingsConfig, settingsDefaults, onSettingsSave,
    handleFileChange, validateForm,
    sectionAccess, workflowSidebarData, nextStage, isMyTurn, onSignedSave, completionPercentage, alwaysSignTabs, stageHistory, 
    isStageComplete, stagePendingSections, currentStage, savedFormData,isRecordClosed ,myRequiredKeys, stageEntered,  

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

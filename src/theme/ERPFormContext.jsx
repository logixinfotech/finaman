// context/ERPFormContext.jsx
import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── two separate contexts, one file ──
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
    title, configs, getHeaderStyle, TabIcon, getInitials,
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
    requiredFields.forEach((key) => {
      const val = data[key];
      if (val === undefined || val === null || String(val).trim() === "") {
        errs[key] = "This field is required";
      }
    });
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  }, [requiredFields]);

  // ── LOW-FREQUENCY: never changes on keystroke ──
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
  ]);

  // ── HIGH-FREQUENCY: changes on every keystroke ──
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
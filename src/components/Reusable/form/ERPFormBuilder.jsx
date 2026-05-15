import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ERPHeader from "./HeaderForm";
import ERPFooter from "./FooterForm";
import { FaUser, FaBuilding, FaFileAlt, FaMoneyBill, FaCamera } from "react-icons/fa";
import FieldRenderer from "./FieldRenderer";
import {
  initERPShortcuts,
  setERPHandlers,
  setERPGlobalLoading
} from '../../../utils/erpShortcuts';
import ERPSettings from "../ERPSettings";
const TabIcon = ({ tab, isActive }) => {
  const t = (tab ?? "").toLowerCase();
  const cls = `w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`;
  if (t.includes("basic") || t.includes("general"))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  if (t.includes("legal") || t.includes("compliance"))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (t.includes("bank") || t.includes("finance"))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M7 10V7a5 5 0 0110 0v3" /></svg>;
  if (t.includes("address") || t.includes("contact"))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>;
  if (t.includes("tax"))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 14l6-6m-5 1a1 1 0 100-2 1 1 0 000 2zm5 5a1 1 0 100-2 1 1 0 000 2z" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
  return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" /></svg>;
};

const ERPFormBuilder = ({
  title,
  sidebarName,
  sidebarSub,
  pinnedFields = [],
  tabs = [],
  fieldGroups = {},
  customTabs = {},
  formData = {},
  setFormData,
  validateForm,
  requiredFields = [],
  widthConfig = {},
  mode,
  saving,
  rights,
  canPrint,
  onSave,
  onCancel,
  onDelete,
  onModify,
  onNewEntry,
  onPrint,
  onEditCancel,
  currentRecord,
  totalRecords,
  activeTab: externalFormTab,
  onTabChange: onFormTabChange,
  headerActiveTab, onHeaderTabChange, settingsConfig = [],          // ← add
  settingsDefaults = {},        // ← add
  onSettingsSave,
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const [headerTab, setHeaderTab] = useState("entry");
  const [internalFormTab, setInternalFormTab] = useState(tabs[0] ?? "");
  const activeTab = externalFormTab ?? internalFormTab;

  const [errors, setErrors] = useState({});
  const formDataRef = useRef(formData);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleLogoClick = () => {
    if (!isViewMode) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if ((isAddMode || isEditMode) && scrollContainerRef.current) {
      const firstInput = scrollContainerRef.current.querySelector(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (firstInput) firstInput.focus();
    }
  }, [mode, activeTab]);

  const setActiveTab = useCallback(
    (t) => {
      setInternalFormTab(t);
      onFormTabChange?.(t);
    },
    [onFormTabChange]
  );
  const handleHeaderTabChange = useCallback(
    (t) => {
      setHeaderTab(t);
      onHeaderTabChange?.(t);
    },
    [onHeaderTabChange]
  );

  const handleChange = useCallback(
    (field, value, fieldObj) => {
      let updated = { ...formDataRef.current, [field]: value };
      const n = field.toLowerCase();

      if (n.includes("mobile") || n.includes("phone") || n.includes("pin")) {
        updated[field] = value.toString().replace(/\D/g, "").slice(0, 10);
      } else if (n.includes("pan") || n.includes("gstin")) {
        updated[field] = value.toString().toUpperCase();
      }

      if (fieldObj?.onChange) updated = fieldObj.onChange(value, updated);
      setFormData(updated);

      if (errors[field]) {
        setErrors((prev) => {
          const c = { ...prev };
          delete c[field];
          return c;
        });
      }
    },
    [setFormData, errors]
  );

  const handleSave = useCallback(() => {
    if (!validateForm) return onSave(formDataRef.current);
    const { isValid, errors: errs, firstErrorTab } = validateForm(formDataRef.current, fieldGroups);
    if (!isValid) {
      setErrors(errs);
      if (firstErrorTab) setActiveTab(firstErrorTab);
      return;
    }
    onSave(formDataRef.current);
  }, [onSave, validateForm, fieldGroups, setActiveTab]);

  const renderFieldRow = (fieldObj) => {
    const key = fieldObj.key;
    const label = fieldObj.label ?? key;
    const nameStr = label.toLowerCase();
    const isFullWidth =
      nameStr.includes("company name") ||
      nameStr.includes("employee name") ||
      nameStr.includes("address") ||
      nameStr.includes("email") ||
      nameStr.includes("website") ||
      fieldObj.type === "textarea";

    const customInputWidth = widthConfig[label] || widthConfig[key];

    return (
      <div
        key={key}
        className={`flex flex-col sm:flex-row items-start sm:items-center px-1 text-[14px] flex-grow ${isFullWidth ? "w-full" : "w-full sm:w-[49%]"
          }`}
      >
        <label className="text-slate-800 px-1 sm:min-w-[100px] flex-shrink-0 leading-tight mb-1 sm:mb-0 flex items-center font-medium text-[13px]">
          {label}
          {requiredFields.includes(key) && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className={`flex min-w-0 ${customInputWidth ? customInputWidth : "flex-1"} px-1 w-full relative`}>
          <FieldRenderer
            fieldObj={fieldObj}
            value={formData[key] ?? ""}
            disabled={isViewMode}
            onChange={(val) => handleChange(key, val, fieldObj)}
            error={errors[key]}
          />
          {errors[key] && (
            <div className="absolute left-1 top-full mt-0.5 z-50">
              <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                {errors[key]}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  useEffect(() => {
    setERPGlobalLoading(saving);
  }, [saving]);

  useEffect(() => {
    const cleanup = initERPShortcuts();
    setERPHandlers({
      onSave: () => {
        if (mode === "add" || mode === "edit") handleSave();
      },
      onAdd: () => {
        if (mode === "view") onNewEntry?.();
      },
      onModify: () => {
        if (mode === "view") onModify?.();
      },
      onCancel: () => {
        if (mode === "edit") onEditCancel?.();
        else onCancel?.();
      },
      onDelete: () => {
        if (mode === "view") onDelete?.(formData);
      },
      onPrint: () => onPrint?.(formData),
      onBackspaceNavigation: true
    });

    return () => {
      cleanup();
    };
  }, [mode, formData, onSave, onModify, onCancel]);
  const displayName = formData[sidebarName] || "New Entry";

  return (
    <div
      className="w-full h-full sm:h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ background: isViewMode ? "#eef1f6" : "#ffffff" }}
    >
      <ERPHeader
        title={title.toUpperCase()}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={headerActiveTab}
        onTabChange={handleHeaderTabChange}
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
      />
      {headerActiveTab === "settings" ? (

        <ERPSettings
          applName={title}
          config={settingsConfig}
          initialValues={settingsDefaults}
          onSave={(values) => {
            onSettingsSave?.(values);
            handleHeaderTabChange("entry");
          }}
          onCancel={() => handleHeaderTabChange("entry")}
          onRestore={() => { }}
        />

      ) : (
        <>
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="w-full bg-white border-b border-slate-300 flex flex-col shrink-0 relative z-20">

              <div className="bg-[#f1f5f9] h-14 flex items-center px-3 sm:px-4 relative border-b border-slate-200">
                <div className="absolute top-2 left-3 sm:left-4 z-10">
                  <div
                    onClick={handleLogoClick}
                    className={`w-16 h-16 bg-white rounded-lg p-1 shadow-lg border border-slate-300 relative group overflow-hidden ${!isViewMode ? 'cursor-pointer hover:border-blue-500 transition-all' : ''}`}
                  >
                    <div className="w-full h-full bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border border-slate-100">
                      {formData.logo ? (
                        <img
                          src={
                            typeof formData.logo === 'string' && formData.logo.startsWith('data:')
                              ? formData.logo
                              : `${window.location.origin}${formData.logo}`
                          }
                          className="w-full h-full object-contain"
                          alt="Logo"
                        />
                      ) : (
                        <FaUser className="text-2xl text-slate-300" />
                      )}
                    </div>

                    {/* Camera Overlay on Hover */}
                    {!isViewMode && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaCamera className="text-white text-xl" />
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between w-full ml-[76px] sm:ml-20">

                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2 sm:pr-4">
                    <h2 className="text-[14px] sm:text-[16px] font-bold text-slate-800 leading-none truncate uppercase">
                      {displayName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="h-8 w-[1px] bg-slate-300 hidden md:block"></div>

                    <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all border whitespace-nowrap ${isActive
                              ? "bg-[#0f172a] text-white border-[#0f172a] shadow-md"
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm"
                              }`}
                          >
                            <TabIcon tab={tab} isActive={isActive} />
                            <span className="hidden xs:inline sm:inline">{tab}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>

              <div className="h-6 bg-white w-full" />
            </div>
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white p-2 sm:p-3"
            >
              {pinnedFields.length > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-8 gap-y-3 sm:gap-y-4">
                    {pinnedFields.map((fieldObj) => {
                      const key = fieldObj.key;
                      const label = fieldObj.label ?? key;

                      const isNameField = key.toLowerCase().includes("name");

                      const customInputWidth =
                        widthConfig[label] ||
                        widthConfig[key] ||
                        (isNameField ? "w-56 sm:w-80" : "w-36 sm:w-48");

                      return (
                        <div key={key} className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <label className="text-slate-600 text-[12px] sm:text-[13px] flex-shrink-0 font-bold uppercase tracking-tight whitespace-nowrap">
                            {label}
                            {requiredFields.includes(key) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>

                          <div className={`${customInputWidth} relative`}>
                            <FieldRenderer
                              fieldObj={fieldObj}
                              value={formData[key] ?? ""}
                              disabled={isViewMode}
                              onChange={(val) => handleChange(key, val, fieldObj)}
                              error={errors[key]}
                            />
                            {errors[key] && (
                              <div className="absolute left-0 top-full mt-0.5 z-50">
                                <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                                  {errors[key]}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div id={`tab-content-${activeTab}`}>
                {customTabs[activeTab] ? (
                  customTabs[activeTab]
                ) : (
                  <div className="columns-1 xl:columns-2 gap-3">
                    {Object.entries(fieldGroups[activeTab] || {}).map(
                      ([secTitle, fields]) => (
                        <div
                          key={secTitle}
                          className="mb-3 break-inside-avoid border border-[#e2e5ea] rounded shadow-sm inline-block w-full bg-white"
                        >
                          <div className="text-[12px] font-black text-slate-700 px-3 py-2 border-b bg-[#f8f9fb] uppercase tracking-widest">
                            {secTitle}
                          </div>

                          <div className="p-3 flex flex-wrap gap-x-2 gap-y-4">
                            {fields.map(renderFieldRow)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <ERPFooter
              isAddMode={isAddMode}
              isViewMode={isViewMode}
              isEditMode={isEditMode}
              saving={saving}
              rights={rights}
              handleSubmit={handleSave}
              onModify={onModify}
              onCancel={onCancel}
              onNewEntry={onNewEntry}
              onPrint={() => onPrint?.(formData)}
              onEditCancel={onEditCancel}
              onDelete={() => onDelete?.(formData)}
              canPrint={canPrint}
            />
          </div>
        </>
      )}

    </div>

  );
};

export default ERPFormBuilder;
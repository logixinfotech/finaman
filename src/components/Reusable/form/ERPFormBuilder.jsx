import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ERPHeader from "./HeaderForm";
import ERPFooter from "./FooterForm";
import { FaUser, FaBuilding, FaFileAlt, FaMoneyBill } from "react-icons/fa";
import FieldRenderer from "./FieldRenderer"; 

const TabIcon = memo(({ tab, isActive }) => {
  const baseClass = "inline mr-1.5 text-[14px]";
  const colorClass = isActive
    ? "text-white"
    : tab === "basic"
      ? "text-blue-500"
      : tab === "organization"
        ? "text-orange-500"
        : tab === "documents"
          ? "text-emerald-500"
          : "text-indigo-500";

  if (tab === "basic") return <FaUser className={`${baseClass} ${colorClass}`} />;
  if (tab === "organization") return <FaBuilding className={`${baseClass} ${colorClass}`} />;
  if (tab === "documents") return <FaFileAlt className={`${baseClass} ${colorClass}`} />;
  return <FaMoneyBill className={`${baseClass} ${colorClass}`} />;
});

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
  onHeaderTabChange,
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const [headerTab, setHeaderTab] = useState("entry");
  const [internalFormTab, setInternalFormTab] = useState(tabs[0] ?? "");
  const activeTab = externalFormTab ?? internalFormTab;
  
  const [errors, setErrors] = useState({});
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const setActiveTab = useCallback((t) => {
    setInternalFormTab(t);
    onFormTabChange?.(t);
  }, [onFormTabChange]);

  const handleHeaderTabChange = useCallback((t) => {
    setHeaderTab(t);
    onHeaderTabChange?.(t);
  }, [onHeaderTabChange]);

  const handleChange = useCallback((field, value, fieldObj) => {
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
      setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
    }
  }, [setFormData, errors]);

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
        className={`flex flex-col sm:flex-row items-start sm:items-center px-1 text-[15px] flex-grow ${
          isFullWidth ? "w-full" : "w-[49%]"
        }`}
      >
        <label className="text-slate-800 px-1 sm:min-w-[100px] flex-shrink-0 leading-tight mb-1 sm:mb-0 flex items-center font-medium">
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

  const displayName = formData[sidebarName] || "New Entry";
  const displaySub = formData[sidebarSub] || "";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#eef1f6]">
      <ERPHeader
        title={title.toUpperCase()}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={headerTab}
        onTabChange={handleHeaderTabChange}
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
      />
 
<div className="w-full bg-white border-b border-slate-300 flex flex-col shrink-0 relative">
  
  {/* The Main Action Strip - Single Row with Space Distribution */}
  <div className="bg-[#f1f5f9] h-14 flex items-center px-4 relative border-b border-slate-200">
    
    {/* 1. Floating Photo Box */}
    <div className="absolute top-2 left-4 z-10">
      <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-lg border border-slate-300">
        <div className="w-full h-full bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border border-slate-100">
          {formData.photo_url ? (
            <img src={formData.photo_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <FaUser className="text-2xl text-slate-300" />
          )}
        </div>
      </div>
    </div>
 
    <div className="flex items-center justify-between w-full ml-20">
      
      {/* Name & Mode Badge - Expanded to take available space */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        <h2 className="text-[16px] font-bold text-slate-800 leading-none truncate">
          {displayName || "NEW ENTRY"}
        </h2>
        <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase border border-slate-300 shrink-0">
          {mode}
        </span>
      </div>

      {/* Navigation Tabs - Shifted to the Corner */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Divider only visible when there's space */}
        <div className="h-8 w-[1px] bg-slate-300 hidden md:block"></div>

        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all border ${
                  isActive 
                    ? "bg-[#0f172a] text-white border-[#0f172a] shadow-md" 
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                }`}
              >
                <TabIcon tab={tab} isActive={isActive} />
                <span>{tab}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  </div>
 
  <div className="h-6 bg-white w-full" />
</div> 
      <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden bg-white">
 {/* Pinned Section - Forced to One Row */}
{pinnedFields.length > 0 && (
  <div className="mb-4 p-3 bg-blue-50/50 border border-dashed border-blue-200 rounded-lg">
    <div className="flex flex-nowrap items-center gap-x-6 overflow-x-auto no-scrollbar">
      {pinnedFields.map((fieldObj) => {
        const key = fieldObj.key;
        const label = fieldObj.label ?? key;
        const customInputWidth = widthConfig[label] || widthConfig[key];

        return (
          <div key={key} className="flex items-center gap-2 shrink-0">
            <label className="text-slate-800 text-[15px] flex-shrink-0 font-medium whitespace-nowrap">
              {label}
              {requiredFields.includes(key) && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className={`${customInputWidth ? customInputWidth : "w-48"} relative`}>
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
          {customTabs[activeTab] ? customTabs[activeTab] : (
            <div className="columns-1 xl:columns-2 gap-3">
              {Object.entries(fieldGroups[activeTab] || {}).map(([secTitle, fields]) => (
                <div key={secTitle} className="mb-3 break-inside-avoid border border-[#e2e5ea] rounded shadow-sm inline-block w-full bg-white">
                  <div className="text-[13px] font-bold text-slate-700 px-3 py-1.5 border-b bg-[#f8f9fb] uppercase tracking-wide">
                    {secTitle}
                  </div>
                  <div className="p-3 flex flex-wrap gap-x-2 gap-y-4">
                    {fields.map(renderFieldRow)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
  );
};

export default ERPFormBuilder;
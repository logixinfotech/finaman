 
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ERPHeader from "./HeaderForm";
import ERPFooter from "./FooterForm";
import FieldRenderer from "./FieldRenderer";
import ERPSettings from "../ERPSettings";
import config from "../../../config";
import {
  initERPShortcuts,
  setERPHandlers,
  setERPGlobalLoading
} from '../../../utils/erpShortcuts';
import { configs, getHeaderStyle, TabIcon, getInitials, widthConfig } from "../../../pages/Modules/MainMenu/CompanyMaster/companyValidation";

import {
  FaUser, FaBuilding, FaFileAlt, FaCloudUploadAlt,
  FaCalendarAlt, FaPhoneAlt, FaIdCard, FaRegUser, 
  FaGraduationCap, FaUsers, FaExclamationCircle, FaMapMarkerAlt, FaHome, 
  FaShieldAlt, FaMoneyBillWave, FaCube, FaCreditCard
} from "react-icons/fa";
 
const getGridConfig = (title) => {
  return configs[title] || "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
};

const ERPFormBuilder = ({
  title,
  sidebarName,
    onNextRecord,
  sidebarSub, 
  sidebarConfig = {}, 
  completedTabs = [], 
  pinnedFields = [],
  tabs = [],
  fieldGroups = {},
  customTabs = {},
  formData = {},
  setFormData,
   onPrevRecord,
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
  showSettingsTab = false, 
  activeTab: externalFormTab,
  onTabChange: onFormTabChange,
  headerActiveTab, 
  onHeaderTabChange, 
  settingsConfig = [],         
  settingsDefaults = {},        
  onSettingsSave,
  cleanAndSliceField,
  validateSingleField 
}) => {
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const saveBtnRef=useRef(null)
  const [headerTab, setHeaderTab] = useState("entry");
  const [internalFormTab, setInternalFormTab] = useState(tabs[0] ?? "");
  const activeTab = externalFormTab ?? internalFormTab;

  const [errors, setErrors] = useState({});
  const formDataRef = useRef(formData);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const isMounted = useRef(true); 
  const skipAutoFocusRef = useRef(false);

  const [focusedEmailField, setFocusedEmailField] = useState(null);

  const [is2XL, setIs2XL] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1536 : false
  );

  useEffect(() => {
    isMounted.current = true;
    const handleResize = () => setIs2XL(window.innerWidth >= 1536);
    window.addEventListener("resize", handleResize);
    return () => {
      isMounted.current = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
 
  useEffect(() => {
    if ((isAddMode || isEditMode) && scrollContainerRef.current) {
      const timeoutId = setTimeout(() => {
        if (!isMounted.current) return; 
         
        if (skipAutoFocusRef.current) {
          skipAutoFocusRef.current = false;
          return;
        }

        const container = document.getElementById(`tab-content-${activeTab}`);
        if (container) {
          const firstInput = container.querySelector('input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled])');
          if (firstInput) firstInput.focus();
        }
      }, 50);
      return () => clearTimeout(timeoutId); 
    }
  }, [mode, activeTab, isAddMode, isEditMode]);

  const setActiveTab = useCallback((t) => {
    setInternalFormTab(t);
    onFormTabChange?.(t);
  }, [onFormTabChange]);

  const handleHeaderTabChange = useCallback((t) => {
    setHeaderTab(t);
    onHeaderTabChange?.(t);
  }, [onHeaderTabChange]);

  const handleChange = useCallback((field, value, fieldObj) => {
    const processedValue = cleanAndSliceField ? cleanAndSliceField(field, value) : value;
    let updated = { ...formDataRef.current, [field]: processedValue };

    if (fieldObj?.onChange) {
      updated = fieldObj.onChange(processedValue, updated);
    }
    
    setFormData(updated);

    if (validateSingleField) {
      const errorMsg = validateSingleField(field, processedValue);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (errorMsg) {
          newErrors[field] = errorMsg; 
        } else {
          delete newErrors[field]; 
        }
        return newErrors;
      });
    } else {
      if (errors[field]) {
        setErrors((prev) => {
          const c = { ...prev };
          delete c[field];
          return c;
        });
      }
    }
  }, [setFormData, errors, cleanAndSliceField, validateSingleField]);

  useEffect(() => {
    if (mode === "add" && tabs.length > 0) {
      if (onFormTabChange) {
        onFormTabChange(tabs[0]);
      } else {
        setInternalFormTab(tabs[0]);
      }
    }
  }, [mode, tabs, onFormTabChange]);
const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const photoKey = sidebarConfig.photoFieldKey || "logo";

  const reader = new FileReader();
  reader.onload = () => {
    handleChange(photoKey, reader.result); // "data:image/png;base64,...."
  };
  reader.onerror = () => {
    console.error("Failed to read file for upload");
  };
  reader.readAsDataURL(file);

  if (fileInputRef.current) fileInputRef.current.value = "";
};

  const handleDomainSelect = (fieldKey, domain, fieldObj) => {
    const currentVal = formData[fieldKey] || "";
    const baseText = currentVal.includes("@") ? currentVal.split("@")[0] : currentVal;
    handleChange(fieldKey, `${baseText}${domain}`, fieldObj);
  };

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    
    const targetTag = e.target.tagName.toLowerCase();
    
    if (e.key === "Enter") {
      if (targetTag === 'button' || targetTag === 'textarea' || e.target.type === 'file') return;
      e.preventDefault();
      
      const container = document.getElementById(`tab-content-${activeTab}`);
      if (!container) return;
      
      const fieldContainers = Array.from(container.querySelectorAll('[id^="field-container-"]'));
      const currentContainer = e.target.closest('[id^="field-container-"]');
      
      if (currentContainer) {
        const currentIndex = fieldContainers.indexOf(currentContainer);

        if (currentIndex > -1 && currentIndex < fieldContainers.length - 1) {
          const nextContainer = fieldContainers[currentIndex + 1];
          const nextInput = nextContainer.querySelector('input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
          
          if (nextInput) {
            setTimeout(() => {
              nextInput.focus();
            }, 10);
          }
        } else if (currentIndex === fieldContainers.length - 1) {
          const currentTabIndex = tabs.indexOf(activeTab);
          if (currentTabIndex > -1 && currentTabIndex < tabs.length - 1) {
            setActiveTab(tabs[currentTabIndex + 1]);
          } else {
            setTimeout(() => {
              const footer = document.getElementById('erp-footer-container');
              if (footer) {
                saveBtnRef?.current?.focus();
              }
            }, 10);
          }
        }
      }
    }

    if (e.key === "Backspace") {
      if (targetTag === 'textarea') return;

      const isEmpty = e.target.value === undefined || e.target.value === "" || e.target.value === null;

      if (isEmpty) {
        e.preventDefault();

        const container = document.getElementById(`tab-content-${activeTab}`);
        if (!container) return;

        const fieldContainers = Array.from(container.querySelectorAll('[id^="field-container-"]'));
        const currentContainer = e.target.closest('[id^="field-container-"]');

        if (currentContainer) {
          const currentIndex = fieldContainers.indexOf(currentContainer);

          if (currentIndex > 0) {
            const prevContainer = fieldContainers[currentIndex - 1];
            const prevInput = prevContainer.querySelector('input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
            
            if (prevInput) {
              setTimeout(() => {
                prevInput.focus();
                
                if (prevInput.setSelectionRange && prevInput.value) {
                  const len = prevInput.value.length;
                  prevInput.setSelectionRange(len, len);
                }
              }, 10);
            }
          } 
          else if (currentIndex === 0) {
            const currentTabIndex = tabs.indexOf(activeTab);
            if (currentTabIndex > 0) {
              const prevTabName = tabs[currentTabIndex - 1];
              setActiveTab(prevTabName);

              setTimeout(() => {
                const prevTabContainer = document.getElementById(`tab-content-${prevTabName}`);
                if (prevTabContainer) {
                  const prevTabFields = Array.from(prevTabContainer.querySelectorAll('[id^="field-container-"]'));
                  if (prevTabFields.length > 0) {
                    const lastFieldOfPrevTab = prevTabFields[prevTabFields.length - 1];
                    const lastInput = lastFieldOfPrevTab.querySelector('input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
                    if (lastInput) {
                      lastInput.focus();
                    }
                  }
                }
              }, 50);
            }
          }
        }
      }
    }
  }, [activeTab, isViewMode, tabs, setActiveTab]);

  const handleSave = useCallback(() => {
    if (!validateForm) return onSave(formDataRef.current);

    const { isValid, errors: errs } = validateForm(formDataRef.current, fieldGroups);

    if (!isValid) {
      setErrors(errs);
      const errorFields = Object.keys(errs);

      let targetField = null;
      let targetTab = null;

      const tabErrorMap = {};
      tabs.forEach(tabKey => {
        tabErrorMap[tabKey] = [];
        if (fieldGroups[tabKey]) {
          const fieldsInTab = Object.values(fieldGroups[tabKey])
            .filter(Boolean)
            .flatMap(group => (Array.isArray(group) ? group : []))
            .map(f => f?.key)
            .filter(Boolean);

          fieldsInTab.forEach(fKey => {
            if (errorFields.includes(fKey)) {
              tabErrorMap[tabKey].push(fKey);
            }
          });
        }
      });

      errorFields.forEach(ef => {
        const isFound = tabs.some(t => tabErrorMap[t]?.includes(ef));
        if (!isFound && tabs.length > 0) {
          if (!tabErrorMap[tabs[0]]) tabErrorMap[tabs[0]] = [];
          tabErrorMap[tabs[0]].push(ef);
        }
      });

      if (tabErrorMap[activeTab] && tabErrorMap[activeTab].length > 0) {
        targetTab = activeTab;
        const currentTabErrs = tabErrorMap[activeTab];

        const activeElement = document.activeElement;
        const currentFocusedContainer = activeElement?.closest('[id^="field-container-"]');

        if (currentFocusedContainer) {
          const currentFocusedKey = currentFocusedContainer.id.replace('field-container-', '');
          const currentIndexInErrors = currentTabErrs.indexOf(currentFocusedKey);

          if (currentIndexInErrors !== -1 && currentIndexInErrors < currentTabErrs.length - 1) {
            targetField = currentTabErrs[currentIndexInErrors + 1];
          } else {
            targetField = currentTabErrs[0];
          }
        } else {
          targetField = currentTabErrs[0];
        }
      } else {
        for (let i = 0; i < tabs.length; i++) {
          const t = tabs[i];
          if (tabErrorMap[t] && tabErrorMap[t].length > 0) {
            targetTab = t;
            targetField = tabErrorMap[t][0]; 
            break;
          }
        }
      }
 
      if (targetTab && targetTab !== activeTab) {
        skipAutoFocusRef.current = true;
        setActiveTab(targetTab);
      }

      const tryFocus = (fieldToFocus, attempts = 0) => {
  if (!isMounted.current || attempts > 12) return;

  const errorContainer = document.getElementById(`field-container-${fieldToFocus}`);

  if (errorContainer) {
    // 1. पूरे विंडो को डिस्टर्ब होने से बचाने के लिए block: 'nearest' या 'inline' का प्रयोग करें
    // या फिर scrollIntoViewOptions को पूरी तरह से कस्टमाइज़ करें
    errorContainer.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest', 
      inline: 'nearest' 
    });

  
    if (scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elementTop = errorContainer.getBoundingClientRect().top;
      // अगर एलिमेंट कंटेनर से बाहर है, तो केवल कंटेनर का scrollTop चेंज करें
      if (elementTop < containerTop || elementTop > (containerTop + scrollContainerRef.current.clientHeight)) {
        scrollContainerRef.current.scrollTop = 
          errorContainer.offsetTop - scrollContainerRef.current.offsetTop - 10;
      }
    }

    setTimeout(() => {
      const errorInput = errorContainer.querySelector(
        'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      );
      if (errorInput) {
        errorInput.focus();
      }
    }, 30);
  } else {
    setTimeout(() => tryFocus(fieldToFocus, attempts + 1), 40);
  }
};

      if (targetField) {
        tryFocus(targetField);
      }

      return;
    }

    onSave(formDataRef.current);
  }, [onSave, validateForm, fieldGroups, setActiveTab, activeTab, tabs]);

 const renderFieldRow = (fieldObj, index = 0) => {
    const key = fieldObj.key;
    const label = fieldObj.label ?? key;
    const nameStr = label.toLowerCase();
    
    let colSpanClass = "col-span-1"; 
    if (nameStr.includes("address line") || (nameStr.includes("name") && !nameStr.includes("first") && !nameStr.includes("last")) || nameStr.includes("remarks") || fieldObj.type === "textarea") {
      colSpanClass = "col-span-2";
    } else if (nameStr.includes("email") || nameStr.includes("bank name") || nameStr.includes("qualification")) {
      colSpanClass = "col-span-1 sm:col-span-2";
    }

    if (widthConfig[label] || widthConfig[key]) {
      colSpanClass = widthConfig[label] || widthConfig[key];
    }

    const isEmailInput = fieldObj.type === "email" || nameStr.includes("email")||nameStr.includes("alt email");
    const emailValue = formData[key] ?? "";
    const isEmailFocused = focusedEmailField === key; 
    const showEmailSuggestions = isEmailFocused && isEmailInput && emailValue.length > 0 && 
      !emailValue.match(/@(gmail\.com|yahoo\.com|outlook\.com)$/i);

    const zIndexStyle = { zIndex: isEmailFocused ? 9999 : 50 - index };

    return (
      <div 
        key={key} 
        id={`field-container-${key}`} 
        style={zIndexStyle}
        className={`flex flex-col gap-[3px] w-full relative overflow-visible ${colSpanClass}`}
      >
        <label className="text-[#1e293b] font-semibold text-[12px] tracking-[0.1px] flex items-center mb-[2px]">
          {label}
          {requiredFields.includes(key) && <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">*</span>}
        </label>

        <div 
          className="w-full relative flex flex-col overflow-visible"
          onFocusCapture={() => {
            if (isEmailInput && !isViewMode) setFocusedEmailField(key);
          }}
          onBlurCapture={() => {
            if (isEmailInput) setTimeout(() => setFocusedEmailField(null), 250);
          }}
        >
          <FieldRenderer
            fieldObj={fieldObj}
            value={formData[key] ?? ""}
            disabled={isViewMode}
            onChange={(val) => handleChange(key, val, fieldObj)}
            error={errors[key]}
            className={`w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] ${
              isViewMode ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default" : "text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]"
            }`}
          />
 
          {isEmailInput && showEmailSuggestions && (
            <div className="flex gap-1.5 mt-1 bg-white p-1 rounded border border-[#c8d2e4] w-max shadow-md z-[99999] absolute top-[100%] left-0">
              {["@gmail.com", "@yahoo.com", "@outlook.com"].map((domain) => {
                const parts = emailValue.split('@');
                if (parts.length > 1 && parts[1] && !domain.startsWith(`@${parts[1].toLowerCase()}`)) {
                  return null; 
                }
                return (
                  <button
                    key={domain}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation();
                      handleDomainSelect(key, domain, fieldObj);
                    }}
                    className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-[#1a56db] hover:text-white text-slate-700 border border-slate-200 rounded transition-colors cursor-pointer"
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          )} 
          {errors[key] && !showEmailSuggestions && (
            <div className="absolute left-0 top-[100%] z-[40] mt-[2px] pointer-events-none">
              <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium pointer-events-auto">
                {errors[key]}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCard = ([title, fields], isLast, globalIndex = 0) => {
    const headerStyle = getHeaderStyle(title);
    
    return (
      <div 
        key={title} 
        style={{ zIndex: 100 - globalIndex }}
        className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm shrink-0 relative overflow-visible ${isLast ? 'flex-1' : ''}`}
      >
        <div className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between border-b ${headerStyle.border} ${headerStyle.barBg} rounded-t-[5px]`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${headerStyle.iconBg}`}>
              {headerStyle.icon}
            </div>
            <h3 className={`text-[11.5px] font-bold uppercase tracking-[0.4px] ${headerStyle.text}`}>
              {title}
            </h3>
          </div>
        </div>
        <div className={`p-[14px] grid ${getGridConfig(title)} gap-x-[12px] gap-y-[5px] content-start items-start flex-1 overflow-visible`}>
          {(fields || []).map((fieldObj, index) => {
            if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;
            if (fieldObj.type === "section-divider") {
              return (
                <div key={`${fieldObj.label}-${index}`} className="col-span-full mt-2 mb-1 flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[#64748b]">
                    <span className="text-[11px] font-bold uppercase tracking-[0.5px]">{fieldObj.label}</span>
                  </div>
                  <div className="flex-1 h-px bg-[#dde1ea]"></div>
                </div>
              );
            }
            return renderFieldRow(fieldObj, index);
          })}
        </div>
      </div>
    );
  };

  useEffect(() => { setERPGlobalLoading(saving); }, [saving]);

  useEffect(() => {
    const cleanup = initERPShortcuts();
    setERPHandlers({
      onSave: () => { if (mode === "add" || mode === "edit") handleSave(); },
      onAdd: () => { if (mode === "view") onNewEntry?.(); },
      onModify: () => { if (mode === "view") onModify?.(); },
      onCancel: () => { if (mode === "edit") onEditCancel?.(); else onCancel?.(); },
      onDelete: () => { if (mode === "view") onDelete?.(formData); },
      onPrint: () => onPrint?.(formData),
      onBackspaceNavigation: true
    });
    return () => cleanup();
  }, [mode, formData, handleSave, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry]);

  const displayTitle = formData[sidebarName] || "New Entry";
  const displaySubtitle = formData[sidebarSub] || "—";
const rawPhoto = sidebarConfig.photoUrl || formData.photo_url || formData.logo;

console.log("DEBUG rawPhoto:", rawPhoto, "| type:", typeof rawPhoto);

const displayPhoto = (rawPhoto && typeof rawPhoto === "string")
  ? (rawPhoto.startsWith("data:") || rawPhoto.startsWith("http") || rawPhoto.startsWith("blob:")
      ? rawPhoto
      : `${config.apiUrl}${rawPhoto}`)
  : null;

  return (
    <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f8] flex flex-col overflow-hidden font-['Segoe_UI',system-ui,Arial,sans-serif] text-[13px] text-[#0f172a] leading-[1.4]">
      
      <ERPHeader
        title={title}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={headerActiveTab}
        onTabChange={handleHeaderTabChange}
        showSettingsTab={showSettingsTab} 
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
         currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
      />

      {headerActiveTab === "settings" ? (
        <ERPSettings
          applName={title}
          config={settingsConfig}
          initialValues={settingsDefaults}
          onSave={(values) => { onSettingsSave?.(values); handleHeaderTabChange("entry"); }}
          onCancel={() => handleHeaderTabChange("entry")}
          onRestore={() => { }}
        />
      ) : (
        <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
          
          {/* SIDEBAR */}
          <div className="w-full md:w-[220px] bg-white border-r border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 scrollbar-hide z-10">
            <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-[18px] px-3 flex flex-col items-center">
              <div 
                className="relative z-10 cursor-pointer w-[88px] h-[88px] rounded-full bg-[#dde3ef] border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden group" 
                onClick={() => !isViewMode && fileInputRef.current?.click()}
              >
                {displayPhoto ? (
                  <img src={displayPhoto} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-[28px] font-bold text-[#8a9ab5] tracking-wider">{getInitials(displayTitle)}</span>
                )}
                
                {!isViewMode && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaCloudUploadAlt className="text-white text-xl" />
                  </div>
                )}
              </div>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

              <h2 className="text-[15px] font-bold text-[#0f2137] text-center mt-2.5 truncate w-full px-1">{displayTitle}</h2>
              <h4 className="text-[10.5px] font-semibold text-[#718096] text-center mt-0.5 tracking-[0.4px] truncate w-full"> {displaySubtitle}</h4>

              {!isViewMode && (
                <button onClick={() => fileInputRef.current?.click()} className="mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max">
                  <FaCloudUploadAlt className="text-[13px]" /> Upload Image
                </button>
              )}
            </div>

            <div className="p-3 flex flex-col flex-1 bg-white">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[12px] font-bold text-[#374151]">Completion</h3>
                  <span className="text-[13px] font-bold text-[#059669]">{sidebarConfig.completionPercentage || 0}%</span>
                </div>
                <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-[#059669] h-1.5 rounded-full transition-all" style={{ width: `${sidebarConfig.completionPercentage || 0}%` }}></div>
                </div>
              </div>

              <hr className="border-[#dde1ea] mb-3" />

              {sidebarConfig.quickInfo && sidebarConfig.quickInfo.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">Quick Info</h3>
                  <div className="space-y-1.5">
                    {sidebarConfig.quickInfo.map((info, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-[#f0f2f7] pb-1 last:border-0 last:pb-0">
                        <span className="flex items-center gap-1.5 text-[#718096] text-[11px]">
                          {info.icon || <FaFileAlt className="text-[9px]" />} {info.label}
                        </span>
                        <span className="text-[#1a202c] font-bold text-[11px] truncate max-w-[100px]" title={info.value}>
                          {info.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div> 
          <div className="flex-1 flex flex-col min-h-0 bg-[#eef1f8] overflow-visible"> 
            <div className="flex items-end gap-0 px-[16px] bg-white border-b-2 border-[#e1e7f2] shrink-0 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const isCompleted = completedTabs.includes(tab);
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-[6px] px-[16px] pt-[10px] pb-[9px] text-[12px] font-semibold cursor-pointer border-b-2 mb-[-2px] transition-all duration-150 whitespace-nowrap outline-none ${
                      isActive 
                        ? "text-[#1a56db] border-[#1a56db]" 
                        : "text-[#64748b] border-transparent hover:text-[#334155] hover:border-[#c4cfe4]"
                    }`}
                  >
                    <div className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center ${
                      isActive ? "bg-[#eef3fd]" : "bg-transparent"
                    }`}>
                      <TabIcon tab={tab} />
                    </div>
                    
                    <span className="capitalize">{tab.replace(/_/g, " ")}</span>
                    
                    {isCompleted && (
                      <div className="w-[16px] h-[16px] rounded-[8px] bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center ml-1">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
 
            <div 
               id={`tab-content-${activeTab}`} 
               ref={scrollContainerRef}
               className="flex-1 p-[8px] overflow-y-auto overflow-x-hidden min-h-0 flex flex-col"
               onKeyDown={handleKeyDown}
            >
              {customTabs[activeTab] ? (
                customTabs[activeTab]
              ) : (
                (() => {
                  const entries = Object.entries(fieldGroups[activeTab] || {});
                  const leftCol = [];
                  const rightCol = [];

                  entries.forEach(([secTitle, fields], index) => {
                    const cardItem = { data: [secTitle, fields], globalIndex: index };
                    if (index % 2 === 0) leftCol.push(cardItem);
                    else rightCol.push(cardItem);
                  });

                  return (
                    <div className="flex flex-col lg:flex-row gap-[8px] flex-1 items-stretch overflow-visible">
                      <div className="flex-1 flex flex-col gap-[8px] min-w-0 overflow-visible">
                        {leftCol.map((item, index) => renderCard(item.data, index === leftCol.length - 1, item.globalIndex))}
                      </div>

                      {rightCol.length > 0 && (
                        <div className="flex-1 flex flex-col gap-[8px] min-w-0 overflow-visible">
                          {rightCol.map((item, index) => renderCard(item.data, index === rightCol.length - 1, item.globalIndex))}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
 
      <div id="erp-footer-container">
        <ERPFooter
          isAddMode={isAddMode}
          isViewMode={isViewMode}
          isEditMode={isEditMode}
          saving={saving}
          saveBtnRef={saveBtnRef}
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
  
    </div>
  );
};

export default ERPFormBuilder;
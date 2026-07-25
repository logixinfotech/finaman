
import React, { useState, useEffect, useRef, useCallback } from "react";
import ERPFormBuilder from "../../../../components/Reusable/form/ERPFormBuilder";
import { fieldGroups ,sidebarConfig , validateFullForm, widthConfig ,requiredFields,cleanAndSliceField, configs, getHeaderStyle, TabIcon, getInitials ,validateSingleField} from "./companyValidation";
import { fetchCountries, fetchStates } from "../../../../utils/api"; 
import { COMPANY_SETTINGS_CONFIG, COMPANY_SETTINGS_DEFAULTS } from './companySettingsConfig';


 
const tabs = Object.keys(fieldGroups);  


const CompanyMasterEntry = ({
  formData,
  setFormData,
  mode,
  onSave,
  onCancel,
  onDelete,
  onModify,
  onNewEntry,
 onPrevRecord,
  onNextRecord,
  onPrint,
  onEditCancel,
  currentRecord,
  totalRecords,
  rights,
  saving,
  canPrint,
  activeTab,
    headerActiveTab, 
  onFormTabChange,
  onHeaderTabChange,
  showSettingsTab = false,
}) => {
  const isViewMode = mode === "view";
  const [localTab, setLocalTab] = useState(activeTab ?? tabs[0]);
  const [countryNames, setCountryNames] = useState([]);
  const [stateNames, setStateNames] = useState([]);

  useEffect(() => {
    if (activeTab && activeTab !== localTab) setLocalTab(activeTab);
  }, [activeTab]);

  const handleTabChange = useCallback((t) => {
    setLocalTab(t);
    onFormTabChange?.(t);
  }, [onFormTabChange]);

  useEffect(() => {
    fetchCountries()
      .then((data) => {
        const countries = (data || []).map((c) => c?.LED_NAME || "").filter(Boolean);
        setCountryNames(countries);
      })
      .catch((err) => console.error("Failed to fetch countries:", err));
  }, []);

  useEffect(() => {
    fetchStates()
      .then((data) => {
        const states = (data || []).map((s) => s?.state || "").filter(Boolean);
        setStateNames(states);
      })
      .catch((err) => console.error("Failed to fetch states:", err));
  }, []);

  const wrapperRef = useRef(null);

const handleKeyDown = useCallback((e) => {
  if (isViewMode) return;
  if (e.key !== "Enter") return;
  if (e.target.tagName.toLowerCase() === "textarea" && !e.shiftKey) return;
  
  e.preventDefault();

  const container = wrapperRef.current;
  if (!container) return;
 
  const isFirstTab = localTab === tabs[0]; 
  let focusable = [];
  
  if (isFirstTab) { 
    const pinnedSection = container.querySelector("#pinned-section");
    const tabContent = container.querySelector(`#tab-content-${localTab}`);
    
    const pinnedInputs = pinnedSection ? Array.from(pinnedSection.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')) : [];
    const tabInputs = tabContent ? Array.from(tabContent.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')) : [];
    
    focusable = [...pinnedInputs, ...tabInputs];
  } else {
    // ONLY collect inputs from the current tab's content div
    const tabContent = container.querySelector(`#tab-content-${localTab}`);
    focusable = tabContent ? Array.from(tabContent.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')) : [];
  }

  const idx = focusable.indexOf(document.activeElement);

  if (idx > -1 && idx < focusable.length - 1) {
    // Normal move to next input
    focusable[idx + 1]?.focus();
  } else {
    // End of this tab's sequence -> Move to NEXT tab
    const tabIdx = tabs.indexOf(localTab);
    if (tabIdx < tabs.length - 1) {
      const nextTab = tabs[tabIdx + 1];
      handleTabChange(nextTab);
      
      // Delay focus until React renders the next tab's content
      setTimeout(() => {
        const nextScope = container.querySelector(`#tab-content-${nextTab}`);
        const first = nextScope?.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        first?.focus();
      }, 150);
    } else {
      // Last tab finished -> go to save button
      document.getElementById("erp-save-btn")?.focus();
    }
  }
}, [isViewMode, localTab, handleTabChange, tabs]);

  const addressFields = fieldGroups?.basic?.Address || [];
  const countryField = addressFields.find((f) => f.key === "country");
  const stateField = addressFields.find((f) => f.key === "state");
  if (countryField) countryField.options = countryNames;
  if (stateField) stateField.options = stateNames;

  return (
    <div
      ref={wrapperRef}
      className="h-full min-h-0 flex flex-col overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      <ERPFormBuilder
        title="Company Master"
        currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
        sidebarName="company_name"
        sidebarSub="business_type"
        sidebarIcon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 21V9h6v12M3 9l9-6 9 6" />
          </svg>
        }
        tabs={tabs}
        fieldGroups={fieldGroups}
        sidebarConfig={sidebarConfig(formData)}
        configs={configs}
        getHeaderStyle={getHeaderStyle}
        TabIcon={TabIcon}
        getInitials={getInitials}
        twoColumn={true}
        customTabs={{}}
        formData={formData}
        setFormData={setFormData}
        validateForm={validateFullForm}
        widthConfig={widthConfig}
        requiredFields={requiredFields}
        mode={mode}
        headerActiveTab={headerActiveTab}
        saving={saving}
        rights={rights}
        canPrint={canPrint}
        cleanAndSliceField={cleanAndSliceField}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        onModify={onModify}
        onNewEntry={onNewEntry}
        validateSingleField={validateSingleField}
        onPrint={onPrint}
        onEditCancel={onEditCancel}
        currentRecord={currentRecord}
        totalRecords={totalRecords}
        activeTab={localTab}
        showSettingsTab={showSettingsTab} 
        onTabChange={handleTabChange}
        onHeaderTabChange={onHeaderTabChange}
        settingsConfig={COMPANY_SETTINGS_CONFIG}    // ← add
        settingsDefaults={COMPANY_SETTINGS_DEFAULTS} // ← add
        onSettingsSave={async (values) => { 
        }}
      />
    </div>
  );
};

export default CompanyMasterEntry;
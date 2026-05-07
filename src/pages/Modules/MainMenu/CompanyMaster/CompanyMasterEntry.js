 
import React from "react";
import ERPFormBuilder from "../../../../components/Reusable/form/ERPFormBuilder";
import { fieldGroups, validateFullForm } from "./companyValidation";

const tabs = Object.keys(fieldGroups);

const pinnedFields = [
  { key: "company_name", label: "Company Name", type: "text" },
  { key: "trade_name",   label: "Trade Name",   type: "text" },
  { key: "business_type", label: "Business Type", type: "select", options: ["Manufacturing", "Trading", "Service", "Retail", "Multi Business"] }
];

const widthConfig = {
 "Account Number": "w-[200px]", 
  "Email": "w-full",
  "GSTIN":          "w-[175px]",
  "PAN Number":     "w-[115px]",
  "TAN Number":     "w-[115px]",
  "CIN Number":     "w-[185px]",
  "IFSC Code":      "w-[115px]",
  "Account Number": "w-[160px]",
  "MICR Code":      "w-[100px]",
  "SWIFT Code":     "w-[115px]",
  "UPI ID":         "w-[150px]", 
  "FY From":        "w-[130px]",
  "FY To":          "w-[130px]",
  "Valid From":     "w-[130px]",
  "Valid To":       "w-[130px]", 
  "PIN Code":       "w-[80px]",
  "Phone":          "w-[145px]",
  "Alt. Phone":     "w-[145px]",
  "City":           "w-[110px]",
  "Full Address":   "w-full",
  "Bank Address":   "w-full",
  "Email":          "w-full",
  "Alt. Email":     "w-full",
  "Website":        "w-full",
};

const requiredFields = ["company_name", "business_type", "email_address"];

const CompanyMasterEntry = ({
  formData, setFormData, mode,
  onSave, onCancel, onDelete, onModify,
  onNewEntry, onPrint, onEditCancel,
  currentRecord, totalRecords,
  rights, saving, canPrint,
  activeTab,        // form section tab  (basic/legal/…) from page's formTab state
  onFormTabChange,  // updates page's formTab state
  onHeaderTabChange,// updates page's handleTabChange (entry/search)
}) => (
  <ERPFormBuilder
    title="Company Master"
    sidebarName="company_name"
    sidebarSub="business_type"
    sidebarIcon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 21V9h6v12M3 9l9-6 9 6"/>
      </svg>
    }
    tabs={tabs}
    fieldGroups={fieldGroups}
    pinnedFields={pinnedFields}
    twoColumn={true}
    customTabs={{}}
    formData={formData}
    setFormData={setFormData}
    validateForm={validateFullForm}
    widthConfig={widthConfig}
    requiredFields={requiredFields}
    mode={mode}
    saving={saving}
    rights={rights}
    canPrint={canPrint}
    onSave={onSave}
    onCancel={onCancel}
    onDelete={onDelete}
    onModify={onModify}
    onNewEntry={onNewEntry}
    onPrint={onPrint}
    onEditCancel={onEditCancel}
    currentRecord={currentRecord}
    totalRecords={totalRecords}
    activeTab={activeTab}           // sidebar section tab
    onTabChange={onFormTabChange}   // sidebar tab change handler
    onHeaderTabChange={onHeaderTabChange} // header entry/search handler
  />
);

export default CompanyMasterEntry;
import { useState, useRef, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchCountries, fetchStates } from "../../../../utils/api";
import { validateSingleField, validateFullForm, fieldLabels } from './companyValidation';
const fieldGroups = {
  basic: {
    "Registration Info": ["fin_year_from", "fin_year_to"],
    "Address": ["business_address", "city", "state", "country", "postal_code"],
  },
  legal: {
    "Tax Identifiers": ["gst_type", "gstin_number", "pan_number", "cin_number", "tan_no"],
    "Other Licenses": ["iec_code", "msme_no"],
    "Drug Licenses": ["drug_lic_no", "drug_valid_from", "drug_valid_to"],
    "Food Safety (FSSAI)": ["fssai_no", "fssai_from", "fssai_to"],
    "Manufacturing": ["mfg_lic_no", "mfg_from", "mfg_to"]
  },
  bank: {
    "Primary Bank Details": ["bank_name", "bank_account_number", "bank_ifsc_code", "branch_name", "account_type"],
    "Additional Info": ["bank_address", "swift_code", "upi_id", "micr_code"]
  },
  contact: {
    "Communication": ["phone_number", "email_address", "website_url"],
    "Primary Contact": ["contact_person", "designation", "alt_phone", "alt_email"],
  },
  tax: {
    "Tax Configuration": ["default_gst_rate", "default_tax_type", "tds_applicable", "tcs_applicable", "tax_method"]
  },
  system: {
    "Preferences": ["default_language", "date_format", "number_format"],
    "Maintenance": ["fy_lock", "auto_backup", "company_status"]
  }
};
const labelClass = "text-[10px] font-bold text-gray-500 uppercase mb-1 block tracking-tight";
const tabs = ["basic", "legal", "bank", "contact", "tax", "system"];
const businessTypes = ["Manufacturing", "Trading", "Service", "Retail", "Multi Business"];

const CompanyMasterForm = ({
  formData, setFormData, onSave, onCancel, saving, onDelete, mode,
  canPrint, onPrint, onModify, onNewEntry, onEditCancel, currentRecord, totalRecords, rights
}) => {
  const isAddMode = mode === "add";
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const inputRefs = useRef({ basic: [], legal: [], bank: [], contact: [], tax: [], system: [] });

  const setInputRef = (tab) => (el) => {
    if (el && !inputRefs.current[tab].includes(el)) {
      inputRefs.current[tab].push(el);
    }
  };
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const countryData = await fetchCountries();  
        const stateData = await fetchStates();
        setCountries(countryData.map(c => c.LED_NAME.trim()));
        setStates(stateData.map(s => s.state.trim()));
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchDropdownData();
  }, [])
  useEffect(() => {
    if (isAddMode) {
      setTimeout(() => { inputRefs.current.basic[0]?.focus(); }, 100);
    }
  }, [isAddMode]);

  const focusNextInput = (current) => {
    const elements = inputRefs.current[activeTab];
    const index = elements.indexOf(current);

    if (index > -1 && index < elements.length - 1) {
      elements[index + 1].focus();
    } else {
      const idx = tabs.indexOf(activeTab);
      if (idx < tabs.length - 1) {
        const nextTab = tabs[idx + 1];
        setActiveTab(nextTab);
        setTimeout(() => { inputRefs.current[nextTab][0]?.focus(); }, 150);
      } else {
        document.getElementById("erp-save-btn")?.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (isViewMode) return;
    if (e.key === "Enter") {
      if (e.target.tagName.toLowerCase() === "textarea" && e.shiftKey) return;
      e.preventDefault();
      focusNextInput(e.target);
    }
  };

  const handleChange = (field, value) => {
    const error = validateSingleField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    if (field === "fin_year_from" && value) {
      const startDate = new Date(value);
      if (!isNaN(startDate)) {
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(startDate.getDate() - 1);

        const fyStart = value;
        const fyEnd = endDate.toISOString().split('T')[0];

        setFormData(prev => ({
          ...prev,
          fin_year_from: fyStart,
          fin_year_to: fyEnd
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalSave = () => {
    const { isValid, errors: fullErrors, firstErrorTab } = validateFullForm(formData, fieldGroups);

    if (!isValid) {
      setErrors(fullErrors);
      if (firstErrorTab) setActiveTab(firstErrorTab);
      return;
    }
    onSave();
  };

  const inputClass = `w-full h-[30px] px-2 text-xs rounded border transition-all duration-200 ${isViewMode
    ? "bg-gray-100 text-gray-500 border-gray-200"
    : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const renderField = (field, tabName) => {
    const isDateField = field.includes("date") || field.includes("from") || field.includes("to");
    const error = errors[field];
    const dynamicClass = `${inputClass} ${error ? "border-red-500 focus:ring-red-100 bg-red-50" : ""}`;

    let inputNode;

    if (["tds_applicable", "tcs_applicable", "fy_lock", "auto_backup"].includes(field)) {
      inputNode = (
        <select
          className={dynamicClass}
          value={formData[field] === true ? "Yes" : formData[field] === false ? "No" : ""}
          onChange={(e) => {
            const val = e.target.value === "Yes" ? true : e.target.value === "No" ? false : null;
            handleChange(field, val);
          }}
          disabled={isViewMode}
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    } else if (isDateField) {
      inputNode = (
        <ERPDateInput
          value={formData[field]}
          onChange={(val) => handleChange(field, val)}
          className={dynamicClass}
          disabled={isViewMode}
          ref={setInputRef(tabName)}
        />
      );
    } else if (field === "business_address" || field === "bank_address") {
      inputNode = (
        <textarea
          ref={setInputRef(tabName)}
          disabled={isViewMode}
          className={`${dynamicClass} h-[52px] py-1 resize-none`}
          value={formData[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
        />
      );
    } 
    else if (field === "country") {
      inputNode = (
        <ERPAutocomplete
          options={countries}
          value={formData[field] || ""}
          onChange={(val) => handleChange(field, val)}
          className={dynamicClass}
          disabled={isViewMode}
          onKeyDown={handleKeyDown}
          ref={setInputRef(tabName)}
        />
      );
    } else if (field === "state") {
      inputNode = (
        <ERPAutocomplete
          options={states}
          value={formData[field] || ""}
          onChange={(val) => handleChange(field, val)}
          className={dynamicClass}
          disabled={isViewMode}
          onKeyDown={handleKeyDown}
          ref={setInputRef(tabName)}
        />
      );
    } else {
      inputNode = (
        <input
          type="text"
          ref={setInputRef(tabName)}
          disabled={isViewMode}
          className={dynamicClass}
          value={formData[field] || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
        />
      );
    } 
    return (
      <div className="flex flex-col">
        {inputNode}
        {error && <span className="text-[9px] text-red-500 font-bold mt-0.5 ml-1">{error}</span>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <ERPHeader
        title="Company Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        rightContent={`${currentRecord} / ${totalRecords}`}
      />

      <div className="flex flex-col flex-1 bg-gray-50 min-h-0">
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                ref={setInputRef("basic")}
                disabled={isViewMode}
                className={`${inputClass} ${errors.company_name ? "border-red-400 bg-red-40" : ""}`}
                value={formData.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {errors.company_name && <span className="text-[9px] text-red-500 font-bold">{errors.company_name}</span>}
            </div>

            <div>
              <label className={labelClass}>Business Type</label>
              <ERPAutocomplete
                value={formData.business_type}
                options={businessTypes}
                onChange={(val) => handleChange("business_type", val)}
                className={`${inputClass} ${errors.business_type ? "border-red-400 bg-red-40" : ""}`}
                disabled={isViewMode}
              />
              {errors.business_type && (
                <span className="text-[9px] text-red-500 font-bold">{errors.business_type}</span>
              )}
            </div>

            <div>
              <label className={labelClass}>Trade Name</label>
              <input
                ref={setInputRef("basic")}
                disabled={isViewMode}
                className={inputClass}
                value={formData.trade_name || ""}
                onChange={(e) => handleChange("trade_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border">
              <div className="relative group shrink-0">
                <div className="w-8 h-8 rounded border bg-white flex items-center justify-center overflow-hidden">
                  {formData.logo ? (
                    <img
                      src={
                        typeof formData.logo === "string" &&
                          formData.logo.startsWith("data:image")
                          ? formData.logo
                          : `${process.env.REACT_APP_API_URL}${formData.logo}`
                      }
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[8px] text-gray-400 font-bold">NA</span>
                  )}
                </div>
                {!isViewMode && (
                  <label className="absolute inset-0 bg-blue-600/80 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition rounded">
                    UP
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            handleChange("logo", reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-gray-600 truncate">Company Logo</span>
                <span className="text-[8px] text-gray-400">Max 500kb</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-2 bg-white border-b sticky top-[64px] z-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === tab
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-500 hover:bg-slate-100"
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {Object.entries(fieldGroups[activeTab]).map(([groupTitle, fields]) => (
            <fieldset
              key={groupTitle}
              className="border border-gray-200 rounded-xl px-4 py-4 bg-white shadow-sm hover:shadow-xl transition-all duration-200"
            >
              <legend
                className="text-[10px] font-medium tracking-tight uppercase px-3 py-0.5 rounded shadow-sm text-white ml-2"
                style={{ background: "var(--bg-active, #2563eb)" }}
              >
                {groupTitle}
              </legend>
              <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-x-4 gap-y-2">
                {fields.map((field) => (
                  <div key={field} className={field === "business_address" || field === "bank_address" ? "md:col-span-2" : ""}>
                    <label className={labelClass}>{fieldLabels[field] || field}</label>
                    {renderField(field, activeTab)}
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isViewMode={isViewMode}
        isEditMode={isEditMode}
        onEditCancel={onEditCancel}
        saving={saving}
        handleSubmit={handleFinalSave}
        rights={rights} // Pass the rights object here
        onModify={rights?.edit === 1 ? onModify : null}
        onDelete={rights?.delete === 1 ? () => onDelete(formData) : null}
        onPrint={() => onPrint(formData)}
        onCancel={onCancel}
        formData={formData}
        canPrint={canPrint}
        onNewEntry={onNewEntry}
        showPrevious={false}
        showNext={false}
      />
    </div>
  );
};

export default CompanyMasterForm;
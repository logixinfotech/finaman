import { useState, useRef } from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../components/Reusable/ERPAutocomplete";
const fTabMap = {
  gstin: "legal",
  pan_no: "legal",
  cin_no: "legal",
  bank_name: "bank",
  account_no: "bank",
  ifsc_code: "bank",
  phone: "contact",
  email: "contact",
  website: "contact",
};

const tabs = ["basic", "legal", "bank", "contact"];

const businessTypes = [
  "Manufacturing",
  "Trading",
  "Service",
  "Retail",
  "Multi Business"
];
const CompanyMasterForm = ({ formData, setFormData, onSave, onCancel, saving, onDelete, mode, canPrint,
  onPrint, onModify, onNewEntry }) => {
  const isAddMode = mode === "add";
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState({});

  const inputRefs = useRef([]);
  inputRefs.current = [];

  const setInputRef = (el) => {
    if (el && !inputRefs.current.includes(el)) inputRefs.current.push(el);
  };

  const focusNextInput = (current) => {
    const index = inputRefs.current.indexOf(current);
    if (index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    } else {
      handleNext();
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    const tag = e.target.tagName.toLowerCase();

    if (e.key === "Enter") {
      if (tag === "textarea" && e.shiftKey) return;
      e.preventDefault();
      focusNextInput(e.target);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusNextInput(e.target);
    }
  };
  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });
  const requiredFields = ["company_name"];

const validateForm = () => {
  const newErrors = {};
  requiredFields.forEach((field) => {
    if (!formData[field] || formData[field].trim() === "") {
      newErrors[field] = "Required";
    }
  });

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors); 
    if (newErrors.company_name) setActiveTab("basic");
    return false;
  }
  return true;
};

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };

  const handleNext = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
  };

  const handlePrevious = () => {
    const idx = tabs.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabs[idx - 1]);
  };
  

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm focus:border-[var(--sidebar-accent-bg)] focus:ring-2 focus:ring-[var(--sidebar-accent-bg)/20] outline-none transition";
  const labelClass = "text-[10px] font-semibold text-gray-500 tracking-wide uppercase";
  const errorText = "text-[10px] text-red-500 mt-1";

  return (
    <div
      className="
      w-full
      max-w-7xl mx-auto
      bg-white
      rounded-2xl
      shadow-xl
      border border-slate-200
      flex flex-col
      min-h-[calc(100vh-160px)]
    "
    >
      <ERPHeader
        title="Company Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
      />

      <fieldset disabled={isViewMode} className="flex flex-col flex-1">
        <div className="p-5 bg-gray-50 border-b border-gray-200">
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                ref={setInputRef}
                className={`${inputClass} ${errors.company_name ? "border-red-500" : ""
                  }`}
                value={formData.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}

              />
              {errors.company_name && (
                <p className={errorText}>{errors.company_name}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Business Type</label>
              <ERPAutocomplete
                value={formData.business_type}
                options={businessTypes}
                onChange={(val) => handleChange("business_type", val)}
                 onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label className={labelClass}>Short Name</label>
              <input
                ref={setInputRef}
                className={inputClass}
                value={formData.short_name || ""}
                onChange={(e) => handleChange("short_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>

        <div className="w-full border-b border-gray-300 bg-gray-200">
          <div className="grid grid-cols-4 text-xs font-medium">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-1.5 text-xs font-medium transition-all duration-200 ${isActive
                      ? "bg-white text-gray-900 border-b-2"
                      : "bg-gray-200 text-gray-600 hover:text-gray-900"
                    }`}
                  style={isActive ? { borderColor: "var(--bg-active)" } : {}}
                >
                  {tab.toUpperCase()}

                  {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-5 bg-gray-50 flex-1 overflow-y-auto">
          {activeTab === "basic" && (
            <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

              <div>
                <label className={labelClass}>FY From</label>
                <input
                  ref={setInputRef}
                  type="date"
                  className={inputClass}
                  value={formData.fin_year_from || ""}
                  onChange={(e) =>
                    handleChange("fin_year_from", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className={labelClass}>FY To</label>
                <input
                  ref={setInputRef}
                  type="date"
                  className={inputClass}
                  value={formData.fin_year_to || ""}
                  onChange={(e) =>
                    handleChange("fin_year_to", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="xl:col-span-2 md:col-span-2 col-span-1">
                <label className={labelClass}>Registered Address</label>
                <textarea
                  ref={setInputRef}
                  className={`${inputClass} h-16`}
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  ref={setInputRef}
                  className={inputClass}
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className={labelClass}>State</label>
                <input
                  ref={setInputRef}
                  className={inputClass}
                  value={formData.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <input
                  ref={setInputRef}
                  className={inputClass}
                  value={formData.country || ""}
                  onChange={(e) => handleChange("country", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {["legal", "bank", "contact"].map(
            (tabName) =>
              activeTab === tabName && (
                <div
                  key={tabName}
                  className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4"
                >
                  {Object.keys(fTabMap)
                    .filter((f) => fTabMap[f] === tabName)
                    .map((field) => (
                      <div key={field}>
                        <label className={labelClass}>
                          {field.replace(/_/g, " ").toUpperCase()}
                        </label>

                        <input
                          ref={setInputRef}
                          className={inputClass}
                          value={formData[field] || ""}
                          onChange={(e) =>
                            handleChange(field, e.target.value)
                          }
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                    ))}
                </div>
              )
          )}
        </div>
      </fieldset>
      <ERPFooter
        isAddMode={isAddMode}
        isViewMode={isViewMode}
        isEditMode={isEditMode}
        saving={saving}
        handleSubmit={handleSubmit}
        onModify={onModify}
        onDelete={() => onDelete(formData)}
        onPrint={() => onPrint(formData)}
        onCancel={onCancel}
        formData={formData}
        canPrint={canPrint}
        onNewEntry={onNewEntry}
        showPrevious={activeTab !== "basic"}
        showNext={activeTab !== "contact"}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  );
};

export default CompanyMasterForm;
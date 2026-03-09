import { useState } from "react";
import {
  AddButton,
  UpdateButton,
  CancelButton,
} from "../../components/Reusable/ActionButon";

const CompanyMasterForm = ({
  formData,
  setFormData,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!formData.company_id;
  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState({});

  const tabs = ["basic", "legal", "bank", "contact"];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const requiredFields = ["company_name", "company_code"];

  const validateForm = () => {
    let newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };

  const handleNext = () => {
    const index = tabs.indexOf(activeTab);
    if (index < tabs.length - 1) {
      setActiveTab(tabs[index + 1]);
    }
  };

  const handlePrevious = () => {
    const index = tabs.indexOf(activeTab);
    if (index > 0) {
      setActiveTab(tabs[index - 1]);
    }
  };

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition";

  const labelClass =
    "text-[10px] font-semibold text-gray-500 tracking-wide uppercase";

  const errorText = "text-[10px] text-red-500 mt-1";

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-t-xl flex justify-between items-center">
        <h2 className="text-sm font-semibold tracking-wide">
          COMPANY MASTER
        </h2>
        <span className="text-[11px] opacity-90">
          {isEditMode ? "EDIT MODE" : "NEW ENTRY"}
        </span>
      </div>

      {/* TOP BASIC FIELDS */}
      <div className="p-5 bg-gray-50 border-b border-gray-200">
        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

          <div>
            <label className={labelClass}>Company Name *</label>
            <input
              className={`${inputClass} ${
                errors.company_name ? "border-red-500" : ""
              }`}
              value={formData.company_name || ""}
              onChange={(e) =>
                handleChange("company_name", e.target.value)
              }
            />
            {errors.company_name && (
              <p className={errorText}>{errors.company_name}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Company Code *</label>
            <input
              className={`${inputClass} ${
                errors.company_code ? "border-red-500" : ""
              }`}
              value={formData.company_code || ""}
              onChange={(e) =>
                handleChange("company_code", e.target.value)
              }
            />
            {errors.company_code && (
              <p className={errorText}>{errors.company_code}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Business Type</label>
            <select
              className={inputClass}
              value={formData.business_type || ""}
              onChange={(e) =>
                handleChange("business_type", e.target.value)
              }
            >
              <option value="">Select</option>
              <option>Manufacturing</option>
              <option>Trading</option>
              <option>Service</option>
              <option>Retail</option>
              <option>Multi Business</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Short Name</label>
            <input
              className={inputClass}
              value={formData.short_name || ""}
              onChange={(e) =>
                handleChange("short_name", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* MODERN FULL WIDTH TABS */}
      <div className="w-full border-b bg-white">
        <div className="grid grid-cols-4 text-xs font-medium">

          {tabs.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-3 transition-all
                ${
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.toUpperCase()}

                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}

        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="p-5 bg-gray-50">

        {activeTab === "basic" && (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

            <div>
              <label className={labelClass}>FY From</label>
              <input
                type="date"
                className={inputClass}
                value={formData.fin_year_from || ""}
                onChange={(e) =>
                  handleChange("fin_year_from", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>FY To</label>
              <input
                type="date"
                className={inputClass}
                value={formData.fin_year_to || ""}
                onChange={(e) =>
                  handleChange("fin_year_to", e.target.value)
                }
              />
            </div>

 <div className="xl:col-span-2 md:col-span-2 col-span-1">
  <label className={labelClass}>Registered Address</label>
  <textarea
    className={`${inputClass} h-16`}
    value={formData.address || ""}
    onChange={(e) => handleChange("address", e.target.value)}
  />
</div>

            <div>
              <label className={labelClass}>City</label>
              <input
                className={inputClass}
                value={formData.city || ""}
                onChange={(e) =>
                  handleChange("city", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>State</label>
              <input
                className={inputClass}
                value={formData.state || ""}
                onChange={(e) =>
                  handleChange("state", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Country</label>
              <input
                className={inputClass}
                value={formData.country || ""}
                onChange={(e) =>
                  handleChange("country", e.target.value)
                }
              />
            </div>

          </div>
        )}

        {/* LEGAL */}
        {activeTab === "legal" && (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

            <div>
              <label className={labelClass}>GSTIN</label>
              <input
                className={inputClass}
                value={formData.gstin || ""}
                onChange={(e) =>
                  handleChange("gstin", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>PAN No</label>
              <input
                className={inputClass}
                value={formData.pan_no || ""}
                onChange={(e) =>
                  handleChange("pan_no", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>CIN No</label>
              <input
                className={inputClass}
                value={formData.cin_no || ""}
                onChange={(e) =>
                  handleChange("cin_no", e.target.value)
                }
              />
            </div>

          </div>
        )}

        {/* BANK */}
        {activeTab === "bank" && (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

            <div>
              <label className={labelClass}>Bank Name</label>
              <input
                className={inputClass}
                value={formData.bank_name || ""}
                onChange={(e) =>
                  handleChange("bank_name", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Account Number</label>
              <input
                className={inputClass}
                value={formData.account_no || ""}
                onChange={(e) =>
                  handleChange("account_no", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>IFSC Code</label>
              <input
                className={inputClass}
                value={formData.ifsc_code || ""}
                onChange={(e) =>
                  handleChange("ifsc_code", e.target.value)
                }
              />
            </div>

          </div>
        )}

        {/* CONTACT */}
        {activeTab === "contact" && (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                value={formData.phone || ""}
                onChange={(e) =>
                  handleChange("phone", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={formData.email || ""}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Website</label>
              <input
                className={inputClass}
                value={formData.website || ""}
                onChange={(e) =>
                  handleChange("website", e.target.value)
                }
              />
            </div>

          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-between items-center mt-6">

          {activeTab !== "basic" && (
            <button
              onClick={handlePrevious}
              className="px-4 py-1 text-xs bg-gray-200 rounded-md"
            >
              ← Previous
            </button>
          )}

          {activeTab !== "contact" ? (
            <button
              onClick={handleNext}
              className="ml-auto px-4 py-1 text-xs bg-blue-600 text-white rounded-md"
            >
              Next →
            </button>
          ) : (
            <div className="flex gap-3 ml-auto">
              {isEditMode ? (
                <UpdateButton onClick={handleSubmit} />
              ) : (
                <AddButton onClick={handleSubmit} />
              )}
              <CancelButton onClick={onCancel} />
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CompanyMasterForm;
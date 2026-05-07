export const VALIDATION_RULES = {
  business_type: { required: true, message: "Select Business Type" },
  company_name: { required: true, message: "Company Name is required" },
  email_address: { 
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
    message: "Invalid email" 
  },
  phone_number: { pattern: /^[6-9]\d{9}$/, message: "10-digit mobile required" },
  gstin_number: { 
    pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 
    message: "Invalid GSTIN" 
  },
  pan_number: { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN" },
  bank_ifsc_code: { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC" },
  postal_code: { pattern: /^[1-9][0-9]{5}$/, message: "Invalid 6-digit PIN" }
};
 
export const fieldGroups = {
  basic: {
      
  
      "Financial Info": [ 
      { key: "fin_year_from", label: "Fin  Year From", type: "date" },
      { key: "fin_year_to", label: "Fin  Year To", type: "date" }
    ],

    "Address": [
      { key: "business_address", label: "Full Address", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "select" },
      { key: "country", label: "Country", type: "select" },
      { key: "postal_code", label: "PIN Code", type: "text" }
    ],  
      "Communication": [
      { key: "phone_number", label: "Phone", type: "text" },
      { key: "email_address", label: "Email", type: "text" },
      { key: "website_url", label: "Website", type: "text" }
    ],

    "Contact Person": [
      { key: "contact_person", label: "Contact Person", type: "text" },
      { key: "designation", label: "Designation", type: "text" }
    ]
  },

  legal: {
    "Tax Identifiers": [
      { key: "gst_type", label: "GST Type", type: "text" },
      { key: "gstin_number", label: "GSTIN", type: "text" },
      { key: "pan_number", label: "PAN", type: "text" },
      { key: "cin_number", label: "CIN", type: "text" },
      { key: "tan_no", label: "TAN", type: "text" }
    ],

    "Licenses": [
      { key: "iec_code", label: "IEC Code", type: "text" },
      { key: "msme_no", label: "MSME No", type: "text" }
    ],

    "Compliance": [
      { key: "fssai_no", label: "FSSAI No", type: "text" },
      { key: "fssai_from", label: "Valid From", type: "date" },
      { key: "fssai_to", label: "Valid To", type: "date" }
    ]
  },

  bank: {
    "Bank Details": [
      { key: "bank_name", label: "Bank Name", type: "text" },
      { key: "bank_account_number", label: "Account No", type: "text" },
      { key: "bank_ifsc_code", label: "IFSC", type: "text" },
      { key: "branch_name", label: "Branch", type: "text" },
      { key: "account_type", label: "Account Type", type: "text" }
    ],

    "Other": [
      { key: "upi_id", label: "UPI ID", type: "text" },
      { key: "swift_code", label: "SWIFT", type: "text" },
      { key: "micr_code", label: "MICR", type: "text" }
    ]
  },
 
  tax: {
    "Tax Settings": [
      { key: "default_gst_rate", label: "Default GST", type: "text" },
      { key: "tds_applicable", label: "TDS Applicable", type: "select", options: ["Yes", "No"] },
      { key: "tcs_applicable", label: "TCS Applicable", type: "select", options: ["Yes", "No"] }
    ]
  },

  system: {
    "System Settings": [
      { key: "default_language", label: "Language", type: "text" },
      { key: "date_format", label: "Date Format", type: "text" },
      { key: "company_status", label: "Status", type: "text" }
    ]
  }
};

export const fieldLabels = {
  company_name: "Company Name", business_type: "Business Type", trade_name: "Trade Name",
  business_address: "Full Address", city: "City", state: "State", country: "Country",
  postal_code: "PIN/Postal Code", phone_number: "Phone", email_address: "Email", website_url: "Website",
  fin_year_from: "Financial Year From", fin_year_to: "Financial Year To",
  gstin_number: "GSTIN", pan_number: "PAN Number", cin_number: "CIN Number",
  gst_type: "GST Type", tan_no: "TAN Number", iec_code: "IEC Code", msme_no: "MSME Number",
  drug_lic_no: "Drug LIC No", drug_valid_from: "Valid From", drug_valid_to: "Valid To",
  fssai_no: "FSSAI No", fssai_from: "Valid From", fssai_to: "Valid To",
  mfg_lic_no: "MFG LIC No", mfg_from: "Valid From", mfg_to: "Valid To",
  bank_name: "Bank Name", bank_account_number: "Account Number", bank_ifsc_code: "IFSC Code",
  branch_name: "Branch Name", account_type: "Account Type", bank_address: "Bank Address",
  swift_code: "SWIFT Code", upi_id: "UPI ID", micr_code: "MICR Code",
  contact_person: "Contact Person Name", designation: "Designation",
  alt_phone: "Alternate Phone", alt_email: "Alternate Email",
  default_gst_rate: "Default GST Rate", default_tax_type: "Default Tax Type",
  tds_applicable: "TDS Applicable", tcs_applicable: "TCS Applicable", tax_method: "Tax Calculation Method",
  default_language: "Default Language", date_format: "Date Format", number_format: "Number Format",
  fy_lock: "Financial Year Lock", auto_backup: "Auto Backup", company_status: "Status"
};

export const validateSingleField = (field, value) => {
  const rule = VALIDATION_RULES[field];
  if (!rule) return "";
  const val = value?.toString().trim() || "";
  if (rule.required && !val) return rule.message;
  if (rule.pattern && val && !rule.pattern.test(val)) return rule.message;
  return "";
};

export const validateFullForm = (formData, groups) => {
  let errors = {};
  let firstErrorTab = null;
  ["company_name", "business_type"].forEach(f => {
    const err = validateSingleField(f, formData[f]);
    if (err) { errors[f] = err; if (!firstErrorTab) firstErrorTab = "basic"; }
  });
  for (const [tab, sections] of Object.entries(groups)) {
    Object.values(sections).flat().forEach(field => {
      const err = validateSingleField(field, formData[field]);
      if (err) { errors[field] = err; if (!firstErrorTab) firstErrorTab = tab; }
    });
  }
  return { isValid: Object.keys(errors).length === 0, errors, firstErrorTab };
};


 

export const VALIDATION_RULES = {
business_type: { required: true, message: "Please select a Business Type" },
  company_name: { required: true, message: "Company Name is required" },
  email_address: { 
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
    message: "Invalid email format" 
  },
  phone_number: { 
    pattern: /^[6-9]\d{9}$/, 
    message: "10-digit mobile number required" 
  },
  gstin_number: { 
    pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 
    message: "Invalid GSTIN format" 
  },
  pan_number: { 
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 
    message: "Invalid PAN (e.g., ABCDE1234F)" 
  },
  bank_ifsc_code: { 
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, 
    message: "Invalid IFSC (e.g., SBIN0001234)" 
  },
  postal_code: { 
    pattern: /^[1-9][0-9]{5}$/, 
    message: "Invalid 6-digit PIN" 
  }
};
 
export const validateSingleField = (field, value) => {
  const rule = VALIDATION_RULES[field];
  if (!rule) return "";

  const trimmedValue = value?.toString().trim() || "";

  if (rule.required && !trimmedValue) {
    return rule.message;
  }

  if (rule.pattern && trimmedValue && !rule.pattern.test(trimmedValue)) {
    return rule.message;
  }

  return "";
}; 
export const validateFullForm = (formData, fieldGroups) => {
  let errors = {};
  let firstErrorTab = null;
const globalFields = ["company_name", "business_type"];
  globalFields.forEach(field => {
    const error = validateSingleField(field, formData[field]);
    if (error) {
      errors[field] = error;
      // If header has error, we stay on 'basic' tab by default
      if (!firstErrorTab) firstErrorTab = "basic"; 
    }
  });
  for (const [tabName, groups] of Object.entries(fieldGroups)) {
    const allFieldsInTab = Object.values(groups).flat();
    
    for (const field of allFieldsInTab) {
      const error = validateSingleField(field, formData[field]);
      if (error) {
        errors[field] = error;
        if (!firstErrorTab) firstErrorTab = tabName;
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, firstErrorTab };
};

export const fieldLabels = {
  company_name: "Company Name", business_type: "Business Type", trade_name: "Trade Name",
  business_address: "Full Address", city: "City", state: "State", country: "Country",
  postal_code: "PIN/Postal Code", phone_number: "Phone", email_address: "Email", website_url: "Website",
  fin_year_from: "Financial Year From", fin_year_to: "Financial Year To",
  gstin_number: "GSTIN", pan_number: "PAN Number", cin_number: "CIN Number",
  gst_type: "GST Type", tan_no: "TAN Number",
  iec_code: "IEC Code", msme_no: "MSME Number",
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
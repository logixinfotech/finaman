 

import React, { memo } from "react";
import {
  FaBuilding, FaPhoneAlt, FaIdCard, FaCertificate, FaMapMarkerAlt, 
  FaCreditCard, FaMoneyBillWave, FaCogs, FaFileAlt, FaEnvelope, FaGlobe,FaShieldAlt
} from "react-icons/fa";
 
export const TabIcon = memo(({ tab }) => {
  const t = (tab || "").toLowerCase();
  const baseClass = "text-[15px]";
  if (t.includes("basic") || t.includes("personal")) return <FaBuilding className={baseClass} />;
  if (t.includes("legal") || t.includes("compliance")) return <FaShieldAlt className={baseClass} />;
  if (t.includes("bank") || t.includes("finance")) return <FaCreditCard className={baseClass} />;
  if (t.includes("system") || t.includes("settings")) return <FaCogs className={baseClass} />;
  if (t.includes("address")) return <FaMapMarkerAlt className={baseClass} />;
  if (t.includes("document")) return <FaFileAlt className={baseClass} />;
  return <FaFileAlt className={baseClass} />;
});

export const getInitials = (name) => {
  if (!name || name === "New Entry") return "NA";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// ==========================================
// 2. GRID CONFIGURATION (Per Section)
// ==========================================
export const configs = {
  "Basic Info": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-2",
  "Financial Info": "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-2",
  "Communication": "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4",
  "Address": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
  "Contact Person": "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-2",
  "Tax Identifiers": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
  "Licenses": "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-2",
  "Compliance": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3",
  "Bank Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-5",
  "Digital & International": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3",
  "Tax Settings": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3",
  "System Settings": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3",
};

// ==========================================
// 3. HEADER STYLES (Colors & Icons)
// ==========================================
export const getHeaderStyle = (title) => {
  const t = (title || "").toLowerCase();
  
  if (t.includes("basic") || t.includes("company")) return { icon: <FaBuilding />, barBg: "bg-[#eff6ff]", iconBg: "bg-[#2563eb]/15 text-[#2563eb]", text: "text-[#0f2137]", border: "border-[#bfdbfe]" };
  if (t.includes("communication") || t.includes("contact")) return { icon: <FaPhoneAlt />, barBg: "bg-[#e6f7f4]", iconBg: "bg-[#0d9488]/15 text-[#0d9488]", text: "text-[#0f2137]", border: "border-[#b2e3da]" };
  if (t.includes("tax") || t.includes("identifiers")) return { icon: <FaIdCard />, barBg: "bg-[#f3e8ff]", iconBg: "bg-[#7c3aed]/15 text-[#7c3aed]", text: "text-[#0f2137]", border: "border-[#d4b8f5]" };
  if (t.includes("license") || t.includes("compliance")) return { icon: <FaCertificate />, barBg: "bg-[#fff1f2]", iconBg: "bg-[#f43f5e]/15 text-[#e11d48]", text: "text-[#0f2137]", border: "border-[#fecdd3]" };
  if (t.includes("address")) return { icon: <FaMapMarkerAlt />, barBg: "bg-[#fff7ed]", iconBg: "bg-[#f97316]/15 text-[#f97316]", text: "text-[#0f2137]", border: "border-[#ffedd5]" };
  if (t.includes("bank") || t.includes("digital")) return { icon: <FaCreditCard />, barBg: "bg-[#e0f2fe]", iconBg: "bg-[#0284c7]/15 text-[#0284c7]", text: "text-[#0f2137]", border: "border-[#7dd3fc]" };
  if (t.includes("financial")) return { icon: <FaMoneyBillWave />, barBg: "bg-[#ecfdf5]", iconBg: "bg-[#10b981]/15 text-[#059669]", text: "text-[#0f2137]", border: "border-[#a7f3d0]" };
  if (t.includes("system")) return { icon: <FaCogs />, barBg: "bg-[#fefce8]", iconBg: "bg-[#eab308]/20 text-[#d97706]", text: "text-[#0f2137]", border: "border-[#fef08a]" };
  
  return { icon: <FaFileAlt />, barBg: "bg-[#eef1f7]", iconBg: "bg-[#64748b]/15 text-[#475569]", text: "text-[#0f2137]", border: "border-[#dde1ea]" };
};

// ==========================================
// 4. VALIDATION & STRICTOR LENGTH RULES (Real-time slicing boundaries)
// ==========================================
export const STRICT_LENGTHS = {
  phone_number: 10,
  alt_phone: 10,
  postal_code: 6,
  pan_number: 10,
  gstin_number: 15,
  bank_ifsc_code: 11,
  micr_code: 9,
  aadhaar_number: 12 // Future proof fallback
};

export const VALIDATION_RULES = {
  business_type: { required: true, message: "Select Business Type" },
  company_name: { required: true, message: "Company Name is required" },
  email_address: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "Invalid email structure"
  },
  phone_number: {  pattern: /^[6-9]\d{9}$/, message: "Valid 10-digit phone required" },
  alt_phone: { pattern: /^[6-9]\d{9}$/, message: "Valid 10-digit alt phone required" },
  gstin_number: {

    pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/,
    message: "Invalid GSTIN format"
  },
  pan_number: {  pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid 10-char PAN format" },
  bank_ifsc_code: { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid 11-char IFSC layout" },
  postal_code: {  pattern: /^[1-9][0-9]{5}$/, message: "Valid 6-digit PIN code required" },
  bank_account_number: { pattern: /^\d{9,18}$/, message: "Account number should be 9-18 digits" }
};

// Real-time cleaner to clean syntax and cut off string index instantly inside form builders
export const cleanAndSliceField = (key, rawValue) => {
  if (rawValue === undefined || rawValue === null) return "";
  let valueStr = rawValue.toString();
  const lowerKey = key.toLowerCase();

  // 1. Force digits extraction only
  if (lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("postal") || lowerKey.includes("pin") || lowerKey.includes("micr") || lowerKey.includes("aadhaar")) {
    valueStr = valueStr.replace(/\D/g, "");
  }
  // 2. Force UpperCase identifiers
  else if (lowerKey==="pan"|| lowerKey.includes("gstin") || lowerKey.includes("ifsc") || lowerKey.includes("cin") || lowerKey.includes("tan") || lowerKey.includes("swift")) {
    valueStr = valueStr.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  // 3. Strict Slice enforcement boundary check
  if (STRICT_LENGTHS[key]) {
    valueStr = valueStr.slice(0, STRICT_LENGTHS[key]);
  }
  return valueStr;
};
const formatDate = (date) =>
  date ? String(date).split("T")[0] : "—";
// ==========================================
// 5. FIELD GROUPS (Tabs & Sections)
// ==========================================
export const sidebarConfig = (data = {}) => {
  return {
    photoFieldKey: "logo",
    completionPercentage: calculateCompanyProgress(data),
    
    quickInfo: [
      {
  label: "Financial Year From",
  value: formatDate(data.fin_year_from),
  icon: <FaMoneyBillWave className="text-[10px] text-blue-500" />
},
{
  label: "Financial Year To",
  value: formatDate(data.fin_year_to),
  icon: <FaMoneyBillWave className="text-[10px] text-blue-500" />
},
      { label: "GSTIN", value: data.gstin_number || "—", icon: <FaBuilding className="text-[10px] text-blue-500" /> },
      { label: "PAN", value: data.pan_number || "—", icon: <FaIdCard className="text-[10px] text-amber-500" /> },
      { label: "Email", value: data.email_address || "—", icon: <FaEnvelope className="text-[10px] text-emerald-500" /> },
      { label: "State", value: data.state || "—", icon: <FaGlobe className="text-[10px] text-indigo-500" /> }
    ]
  };
};

const calculateCompanyProgress = (data) => {
  const fieldsToCheck = ["company_name", "business_type", "email_address", "gstin_number", "pan_number", "postal_code"];
  const filled = fieldsToCheck.filter(field => !!data[field]).length;
  return Math.round((filled / fieldsToCheck.length) * 100);
};

export const fieldGroups = {
  basic: {
    "Basic Info": [
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "trade_name", label: "Trade Name", type: "text" },
      { key: "business_type", label: "Business Type", type: "select", options: ["Manufacturing", "Trading", "Service", "Retail", "Multi Business"] },
    ],
    "Financial Info": [
      {
        key: "fin_year_from",
        label: "Fin Year From",
        type: "date",
        onChange: (value, current) => {
          if (!value) return current;
          const [year, month, day] = value.split("-").map(Number);
          const fromDate = new Date(year, month - 1, day);
          if (isNaN(fromDate)) return current;
          
          const toDate = new Date(year + 1, month - 1, day - 1);
          const ymDString = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dateVal = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dateVal}`;
          };

          return {
            ...current,
            fin_year_from: value,
            fin_year_to: ymDString(toDate),
          };
        },
      },
      { 
        key: "fin_year_to", 
        label: "Fin Year To", 
        type: "date",
        getMinDate: (formData) => formData.fin_year_from || "" 
      },
      { key: "fy_lock", label: "Lock Financial Year", type: "select", options: ["Yes", "No"] },  
    ],
    "Communication": [
      { key: "phone_number", label: "Phone", type: "text" },
      { key: "alt_phone", label: "Alt. Phone", type: "text" },
      { key: "email_address", label: "Email", type: "text" },
      { key: "alt_email", label: "Alt. Email", type: "text" },  
      { key: "website_url", label: "Website", type: "text" },
    ],
    "Address": [
      { key: "business_address", label: "Full Address", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "postal_code", label: "PIN Code", type: "text" },
      { key: "state", label: "State", type: "select" },
      { key: "country", label: "Country", type: "select" },
    ],
    "Contact Person": [
      { key: "contact_person", label: "Contact Person", type: "text" },
      { key: "designation", label: "Designation", type: "text" },
    ],
  },
  legal: {
    "Tax Identifiers": [
      { key: "gst_type", label: "GST Type", type: "select", options: ["Regular", "Composition", "Unregistered", "SEZ"] },
      { key: "gstin_number", label: "GSTIN", type: "text" },
      { key: "pan_number", label: "PAN", type: "text" },
      { key: "cin_number", label: "CIN", type: "text" },
      { key: "tan_no", label: "TAN", type: "text" },
    ],
    "Licenses": [
      { key: "iec_code", label: "IEC Code", type: "text" },
      { key: "msme_no", label: "MSME No", type: "text" },
    ],
    "Compliance": [
      { key: "fssai_no", label: "FSSAI No", type: "text" },
      { key: "fssai_from", label: "Valid From (FSSAI)", type: "date" },
      { 
        key: "fssai_to", 
        label: "Valid To (FSSAI)", 
        type: "date",
        getMinDate: (formData) => formData.fssai_from || "" // FSSAI From se pehle ki date disabled
      },
      { key: "drug_lic_no", label: "Drug Lic No", type: "text" },  
      { key: "drug_valid_from", label: "Valid From (Drug)", type: "date" },  
      { 
        key: "drug_valid_to", 
        label: "Valid To (Drug)", 
        type: "date",
        getMinDate: (formData) => formData.drug_valid_from || "" // Drug From se pehle ki date disabled
      },  
      { key: "mfg_lic_no", label: "Mfg Lic No", type: "text" },  
      { key: "mfg_from", label: "Valid From (Mfg)", type: "date" },  
      { 
        key: "mfg_to", 
        label: "Valid To (Mfg)", 
        type: "date",
        getMinDate: (formData) => formData.mfg_from || "" // Mfg From se pehle ki date disabled
      },  
    ],
  },
  bank: {
    "Bank Details": [
      { key: "bank_name", label: "Bank Name", type: "text" },
      { key: "branch_name", label: "Branch", type: "text" },
      { key: "bank_address", label: "Bank Address", type: "text" },  
      { key: "bank_account_number", label: "Account No", type: "text" },
      { key: "account_type", label: "Account Type", type: "select", options: ["Savings", "Current", "Cash Credit", "OD"] },
      { key: "bank_ifsc_code", label: "IFSC", type: "text" },
    ],
    "Digital & International": [
      { key: "upi_id", label: "UPI ID", type: "text" },
      { key: "swift_code", label: "SWIFT", type: "text" },
      { key: "micr_code", label: "MICR", type: "text" },
    ],
    "Tax Settings": [
      { key: "default_gst_rate", label: "Default GST", type: "select", options: ["0%", "5%", "12%", "18%", "28%"] },
      { key: "default_tax_type", label: "Default Tax Type", type: "select", options: ["Inclusive", "Exclusive"] },  
      { key: "tax_method", label: "Tax Method", type: "text" },  
      { key: "tds_applicable", label: "TDS Applicable", type: "select", options: ["Yes", "No"] },
      { key: "tcs_applicable", label: "TCS Applicable", type: "select", options: ["Yes", "No"] },
    ],
  },
};
// ==========================================
// 6. WIDTH CONFIGURATION
// ==========================================
export const widthConfig = {
  "Full Address": "col-span-full",
  "Company Name": "col-span-3",
  "Trade Name": "col-span-1",
  "Email": "col-span-1 sm:col-span-2",
  "Website": "col-span-1 sm:col-span-2",
  "Bank Name": "col-span-1 sm:col-span-2",
  "Account No": "col-span-1 sm:col-span-2",
  "GSTIN": "col-span-1 sm:col-span-2",
  "CIN": "col-span-1 sm:col-span-2",
  "Business Type": "col-span-1",
  "Phone": "col-span-1",
  "Alt. Phone": "col-span-1",
  "City": "col-span-1",
  "State": "col-span-1",
  "Country": "col-span-1",
  "PIN Code": "col-span-1",
  "Contact Person": "col-span-1",
  "Designation": "col-span-1",
  "Fin Year From": "col-span-1",
  "Fin Year To": "col-span-1",
  "PAN": "col-span-1",
  "TAN": "col-span-1",
  "IFSC": "col-span-1",
  "MICR": "col-span-1",
  "SWIFT": "col-span-1",
  "UPI ID": "col-span-1",
  "Branch": "col-span-1",
  "Account Type": "col-span-1",
};

// ==========================================
// 7. VALIDATION LOGIC
// ==========================================
export const validateSingleField = (field, value) => {
  const rule = VALIDATION_RULES[field];
  if (!rule) return "";
  const val = value?.toString().trim() || "";
  if (rule.required && !val) return rule.message;
  if (rule.pattern && val && !rule.pattern.test(val)) return rule.message;
  return "";
};
export const requiredFields = ["company_name", "business_type", "phone_number"];

export const validateFullForm = (formData, groups) => {
  let errors = {};
  let firstErrorTab = null;

  // 1. Basic Required Fields Verification
  requiredFields.forEach(f => {
    const err = validateSingleField(f, formData[f]);
    if (err) { 
      errors[f] = err; 
      if (!firstErrorTab) firstErrorTab = "basic"; 
    }
  });

  // 2. All Date Range Validations Array Map
  const datePairs = [
    { from: "fin_year_from", to: "fin_year_to", msg: "Fin Year To cannot be earlier than From date", tab: "basic" },
    { from: "fssai_from", to: "fssai_to", msg: "FSSAI Valid To cannot be earlier than From date", tab: "legal" },
    { from: "drug_valid_from", to: "drug_valid_to", msg: "Drug Valid To cannot be earlier than From date", tab: "legal" },
    { from: "mfg_from", to: "mfg_to", msg: "Manufacturing Valid To cannot be earlier than From date", tab: "legal" }
  ];

  datePairs.forEach(({ from, to, msg, tab }) => {
    if (formData[from] && formData[to]) {
      const fromDate = new Date(formData[from]);
      const toDate = new Date(formData[to]);
      if (toDate < fromDate) {
        errors[to] = msg;
        if (!firstErrorTab) firstErrorTab = tab;
      }
    }
  });

  // 3. Iterating all dynamic tabs for other standard validations
  for (const [tab, sections] of Object.entries(groups)) {
    Object.values(sections).flat().forEach(field => {
      if (errors[field.key]) return; // Pehle se check fail ho chuka hai toh ignore
      
      const err = validateSingleField(field.key, formData[field.key]);
      if (err) { 
        errors[field.key] = err; 
        if (!firstErrorTab) firstErrorTab = tab; 
      }
    });
  }
  
  return { isValid: Object.keys(errors).length === 0, errors, firstErrorTab };
};
export const COMPANY_SETTINGS_CONFIG = [
  {
    section: "Financial",
    rows: [
      { label: "Auto-calculate financial year end from start date",
        controls: [{ type: "checkbox", key: "autoFinYear" }] },
      { label: "Default GST rate",
        controls: [{ type: "select", key: "defaultGstRate",
          options: ["0%", "5%", "12%", "18%", "28%"] }] },
      { label: "TDS applicable by default",
        controls: [{ type: "select", key: "tdsDefault", options: ["Yes", "No"] }] },
      { label: "TCS applicable by default",
        controls: [{ type: "select", key: "tcsDefault", options: ["Yes", "No"] }] },
    ]
  },
  {
    section: "Display",
    rows: [
      { label: "Show FSSAI compliance fields",
        controls: [{ type: "checkbox", key: "showFssai" }] },
      { label: "Show MSME / IEC license fields",
        controls: [{ type: "checkbox", key: "showLicenses" }] },
      { label: "Show SWIFT / MICR bank fields",
        controls: [{ type: "checkbox", key: "showIntlBank" }] },
      { label: "Show UPI ID field",
        controls: [{ type: "checkbox", key: "showUpi" }] },
      { label: "Show CIN number field",
        controls: [{ type: "checkbox", key: "showCin" }] },
      { label: "Show alternate phone field",
        controls: [{ type: "checkbox", key: "showAltPhone" }] },
    ]
  },
  {
    section: "Validation rules",
    rows: [
      { label: "GSTIN format validation (15-char)",
        controls: [{ type: "checkbox", key: "validateGstin" }] },
      { label: "PAN format validation (AAAAA0000A)",
        controls: [{ type: "checkbox", key: "validatePan" }] },
      { label: "IFSC format validation",
        controls: [{ type: "checkbox", key: "validateIfsc" }] },
      { label: "PIN code must be 6 digits",
        controls: [{ type: "checkbox", key: "validatePin" }] },
      { label: "Email format validation",
        controls: [{ type: "checkbox", key: "validateEmail" }] },
      { label: "Phone must be 10 digits",
        controls: [{ type: "checkbox", key: "validatePhone" }] },
    ]
  },
  {
    section: "System",
    rows: [
      { label: "Default date format",
        controls: [{ type: "select", key: "dateFormat",
          options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] }] },
      { label: "Default language",
        controls: [{ type: "select", key: "language",
          options: ["English", "Hindi", "Marathi", "Gujarati"] }] },
      { label: "Default company status on creation",
        controls: [{ type: "select", key: "defaultStatus",
          options: ["Active", "Inactive"] }] },
    ]
  },
];

export const COMPANY_SETTINGS_DEFAULTS = {
  autoFinYear:   true,
  defaultGstRate: "18%",
  tdsDefault:    "No",
  tcsDefault:    "No",
  showFssai:     true,
  showLicenses:  true,
  showIntlBank:  false,
  showUpi:       true,
  showCin:       true,
  showAltPhone:  true,
  validateGstin: true,
  validatePan:   true,
  validateIfsc:  true,
  validatePin:   true,
  validateEmail: true,
  validatePhone: true,
  dateFormat:    "DD/MM/YYYY",
  language:      "English",
  defaultStatus: "Active",
};
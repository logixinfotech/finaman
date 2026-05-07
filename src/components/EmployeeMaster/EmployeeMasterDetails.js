export const tabs = ["basic", "organization", "documents" ]; 
export const labelClass =
  "text-[10px] font-bold text-gray-500 uppercase mb-1 block tracking-tight";

export const fieldGroups = {
  basic: {
    "Personal Information": [
      { key: "Title", label: "Title", type: "select", options: ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."] },
      { key: "Gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
      { key: "First Name", label: "First Name", type: "text" },
      { key: "Last Name", label: "Last Name", type: "text" },
      { key: "DOB", label: "DOB", type: "date" },
      
    ],
    "Educational Details": [
      { key: "Qualification", label: "Qualification", type: "text" },
      { key: "Professional", label: "Professional", type: "text" }
    ],
    "Family Info": [
      { key: "Mother", label: "Mother's Name", type: "text" },
      { key: "Father", label: "Father's Name", type: "text" },
      { key: "Married", label: "Married", type: "select", options: ["Yes", "No"] },
      { key: "Aniversary", label: "Aniversary", type: "date", showIf: (data) => data["Married"] === "Yes" },
      { key: "Spouse", label: "Spouse", type: "text", showIf: (data) => data["Married"] === "Yes" },
    ],
    "Contact Details": [
      { key: "Mobile No", label: "Mobile No", type: "text" },
      { key: "Email Id", label: "Email Id", type: "text" }
    ],
    "KYC Details": [
      { key: "Driving Licence No", label: "DL No", type: "text" },
      { key: "Adhar Card No", label: "Aadhaar No", type: "text" },
      { key: "Voter Id", label: "Voter Id", type: "text" },
      { key: "Pan No", label: "Pan No", type: "text" },
      { key: "Passport", label: "Passport", type: "text" }
    ],
    "Emergency Contact Details": [
      { key: "Basic_Emerg_Contact Person", label: "Contact Person", type: "text" },
      { key: "Basic_Emerg_Relation", label: "Relation", type: "text" },
      { key: "Basic_Emerg_Mobile No", label: "Mobile No", type: "text" },

    ],
    "Correspondence Address": [
      { key: "C_Adress Line", label: "Address Line", type: "text" },
      { key: "C_City", label: "City", type: "text" },
      { key: "C_District", label: "District", type: "text" },
      { key: "C_Pin Code", label: "Pin Code", type: "text" },
      { key: "C_State", label: "State", type: "text" }
    ],
    "Permanent Address": [
      { key: "Same as Correspondence", label: "Same as Correspondence", type: "checkbox" },
      { key: "P_Adress Line", label: "Address Line", type: "text" },
      { key: "P_City", label: "City", type: "text" },
      { key: "P_District", label: "District", type: "text" },
      { key: "P_Pin Code", label: "Pin Code", type: "text" },
      { key: "P_State", label: "State", type: "text" }
    ],
    "Bank Details": [
      { key: "Bank Name", label: "Bank Name", type: "text" },
       { key: "Bank Ifsc", label: "Bank Ifsc", type: "text" },
      { key: "Bank Address", label: "Bank Address", type: "text" },
     
      { key: "Bank Account", label: "Bank Account", type: "text" }
    ]
  },
  organization: {
    "Employment": [
      { key: "Employee Type", label: "Emp. Type", type: "text" },
      { key: "Employee Code", label: "Emp. Code", type: "text" },
      { key: "Punch Card No", label: "Punch Card No", type: "text" }, 
      { key: "Confirm Date", label: "Confirm Date", type: "date" },
      { key: "Grade", label: "Grade", type: "select" },
      { key: "Division", label: "Division", type: "select" },
      { key: "Branch", label: "Branch", type: "text" },
      { key: "Department", label: "Department", type: "select"},
      { key: "Designation", label: "Designation", type: "select"},
      { key: "Reporting to", label: "Reporting to", type: "select" }
    ],
     "Dates And Status": [
      { key: "Status Join Date", label: "Join Date", type: "date" },
      { key: "Status Leaving Date", label: "Leaving Date", type: "date" },
      { key: "Status Reason", label: "Reason", type: "text" }
    ],
    "PF Details": [
      { key: "EPF Number", label: "EPF Number", type: "text" },
      { key: "PF Join Date", label: "Join Date", type: "date" },
      { key: "PF Leaving Date", label: "PF Leaving Date", type: "date" },
      { key: "PF Reason", label: "Reason", type: "text" },
      { key: "EDLI Number", label: "EDLI Number", type: "text" },
      { key: "ESIC Number", label: "ESIC Number", type: "text" },
      { key: "EDLI Join Date", label: "Join Date", type: "date" },

      { key: "Gratuity Number", label: "Gratuity Number", type: "number" }
    ],
   
     "Earnings": [
      { key: "Basic Salary", label: "Basic Salary", type: "number" },
      { key: "HRA", label: "HRA", type: "text" },
      { key: "DA", label: "DA", type: "text" },
      { key: "Conveyance", label: "Conveyance", type: "text" },
      { key: "Medical", label: "Medical", type: "text" },
      { key: "Special allowance", label: "Special allowance", type: "text" }
    ],
    "Deductions": [
      { key: "PF", label: "PF", type: "text" },
      { key: "ESI", label: "ESI", type: "text" },
      { key: "Professional Tax", label: "Professional Tax", type: "text" },
      { key: "TDS", label: "TDS", type: "number" }
    ],
    "Employer Contribution": [
      { key: "Employer PF", label: "Employer PF", type: "text" },
      { key: "Employer ESI", label: "Employer ESI", type: "text" }
    ],
    "Other": [
      { key: "Leave allow", label: "Leave allow", type: "leave-selector" },
      { key: "Remarks", label: "Remarks", type: "text" },
      
      { key: "Applicable for", label: "Applicable for", type: "text" }
    ]
  },
  emergency: {
    Contact: [
      { key: "Emerg_Contact person", label: "Contact person", type: "text" },
      { key: "Emerg_Relation", label: "Relation", type: "text" },
      { key: "Emerg_Mobile", label: "Mobile", type: "text" }
    ]
  },
   
};
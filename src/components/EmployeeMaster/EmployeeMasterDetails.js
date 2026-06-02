// export const tabs = ["basic", "organization", "documents" ]; 
// export const labelClass =
//   "text-[10px] font-bold text-gray-500 uppercase mb-1 block tracking-tight";

// export const fieldGroups = {
//   basic: {
//     "Personal Information": [
//       { key: "Title", label: "Title", type: "select", options: ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."] },
    
//       { key: "First Name", label: "First Name", type: "text" },
//       { key: "Last Name", label: "Last Name", type: "text" },
//         { key: "Gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
//       { key: "DOB", label: "DOB", type: "date" },
      
//     ],
//     "Educational Details": [
//       { key: "Qualification", label: "Qualification", type: "text" },
//       { key: "Professional", label: "Professional", type: "text" }
//     ],
//     "Family Info": [
//       { key: "Mother", label: "Mother's Name", type: "text" },
//       { key: "Father", label: "Father's Name", type: "text" },
//       { key: "Married", label: "Married", type: "select", options: ["Yes", "No"] },
//       { key: "Aniversary", label: "Aniversary", type: "date", showIf: (data) => data["Married"] === "Yes" },
//       { key: "Spouse", label: "Spouse", type: "text", showIf: (data) => data["Married"] === "Yes" },
//     ],
//     "Contact Details": [
//       { key: "Mobile No", label: "Mobile No", type: "text" },
//       { key: "Email Id", label: "Email Id", type: "text" }
//     ],
//     "KYC Details": [
//       { key: "Driving Licence No", label: "DL No", type: "text" },
//       { key: "Adhar Card No", label: "Aadhaar No", type: "text" },
//       { key: "Voter Id", label: "Voter Id", type: "text" },
//       { key: "Pan No", label: "Pan No", type: "text" },
//       { key: "Passport", label: "Passport", type: "text" }
//     ],
//     "Emergency Contact Details": [
//       { key: "Basic_Emerg_Contact Person", label: "Contact Person", type: "text" },
//       { key: "Basic_Emerg_Relation", label: "Relation", type: "text" },
//       { key: "Basic_Emerg_Mobile No", label: "Mobile No", type: "text" },

//     ],
//     "Correspondence Address": [
//       { key: "C_Adress Line", label: "Address Line", type: "text" },
//       { key: "C_City", label: "City", type: "text" },
//       { key: "C_District", label: "District", type: "text" },
//       { key: "C_Pin Code", label: "Pin Code", type: "text" },
//       { key: "C_State", label: "State", type: "text" }
//     ],
//     "Permanent Address": [
//       { key: "Same as Correspondence", label: "Same as Correspondence", type: "checkbox" },
//       { key: "P_Adress Line", label: "Address Line", type: "text" },
//       { key: "P_City", label: "City", type: "text" },
//       { key: "P_District", label: "District", type: "text" },
//       { key: "P_Pin Code", label: "Pin Code", type: "text" },
//       { key: "P_State", label: "State", type: "text" }
//     ],
//     "Bank Details": [
//       { key: "Bank Name", label: "Bank Name", type: "text" },
//        { key: "Bank Ifsc", label: "Bank Ifsc", type: "text" },
//       { key: "Bank Address", label: "Bank Address", type: "text" },
     
//       { key: "Bank Account", label: "Bank Account", type: "text" }
//     ]
//   },
//   organization: {
//     "Employment": [
//       { key: "Employee Type", label: "Emp. Type", type: "text" },
//       { key: "Employee Code", label: "Emp. Code", type: "text" },
//       { key: "Punch Card No", label: "Punch Card No", type: "text" }, 
//       { key: "Confirm Date", label: "Confirm Date", type: "date" },
//       { key: "Grade", label: "Grade", type: "select" },
//       { key: "Division", label: "Division", type: "select" },
//       { key: "Branch", label: "Branch", type: "text" },
//       { key: "Department", label: "Department", type: "select"},
//       { key: "Designation", label: "Designation", type: "select"},
//       { key: "Reporting to", label: "Reporting to", type: "select" }
//     ],
//      "Dates And Status": [
//       { key: "Status Join Date", label: "Join Date", type: "date" },
//       { key: "Status Leaving Date", label: "Leaving Date", type: "date" },
//       { key: "Status Reason", label: "Reason", type: "text" }
//     ],
//     "PF Details": [
//       { key: "EPF Number", label: "EPF Number", type: "text" },
//       { key: "PF Join Date", label: "Join Date", type: "date" },
//       { key: "PF Leaving Date", label: "PF Leaving Date", type: "date" },
//       { key: "PF Reason", label: "Reason", type: "text" },
//       { key: "EDLI Number", label: "EDLI Number", type: "text" },
//       { key: "ESIC Number", label: "ESIC Number", type: "text" },
//       { key: "EDLI Join Date", label: "Join Date", type: "date" },

//       { key: "Gratuity Number", label: "Gratuity Number", type: "number" }
//     ],
   
//      "Earnings": [
//       { key: "Basic Salary", label: "Basic Salary", type: "number" },
//       { key: "HRA", label: "HRA", type: "text" },
//       { key: "DA", label: "DA", type: "text" },
//       { key: "Conveyance", label: "Conveyance", type: "text" },
//       { key: "Medical", label: "Medical", type: "text" },
//       { key: "Special allowance", label: "Special allowance", type: "text" }
//     ],
//     "Deductions": [
//       { key: "PF", label: "PF", type: "text" },
//       { key: "ESI", label: "ESI", type: "text" },
//       { key: "Professional Tax", label: "Professional Tax", type: "text" },
//       { key: "TDS", label: "TDS", type: "number" }
//     ],
//     "Employer Contribution": [
//       { key: "Employer PF", label: "Employer PF", type: "text" },
//       { key: "Employer ESI", label: "Employer ESI", type: "text" }
//     ],
//     "Other": [
//       { key: "Leave allow", label: "Leave allow", type: "leave-selector" },
//       { key: "Remarks", label: "Remarks", type: "text" },
      
//       { key: "Applicable for", label: "Applicable for", type: "text" }
//     ]
//   },
//   emergency: {
//     Contact: [
//       { key: "Emerg_Contact person", label: "Contact person", type: "text" },
//       { key: "Emerg_Relation", label: "Relation", type: "text" },
//       { key: "Emerg_Mobile", label: "Mobile", type: "text" }
//     ]
//   },
   
// };
export const tabs = [
  "personal_and_contact",
  "organization",
  "address",
  "bank_and_payroll",
  "documents"
];



export const fieldGroups = {
  personal_and_contact: {
    "Personal Information": [
      { key: "Employee ID", label: "Employee ID", type: "text", readOnly: true },
      { key: "Title", label: "Title", type: "select", options: ["Mr", "Mrs", "Ms", "Dr", "Er"] },
      { key: "First Name", label: "First Name", type: "text" },
      
      { key: "Last Name", label: "Last Name", type: "text" },
      { key: "Gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
      { key: "Date of Birth", label: "Date of Birth", type: "date" },
      { key: "Blood Group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { key: "Nationality", label: "Nationality", type: "select", options: ["Indian", "Other"] },
      { key: "Religion", label: "Religion", type: "select", options: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"] },
      { key: "Category", label: "Category", type: "select", options: ["General", "OBC", "SC", "ST"] },
          { key: "Mother's Name", label: "Mother's Name", type: "text" },
      { key: "Father's / Guardian's Name", label: "Father's / Guardian's Name", type: "text" },
        { key: "Marital Status", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] }
      ,
      { key: "Spouse Name", label: "Spouse Name", type: "text", showIf: (data) => data["Marital Status"] === "Married" },
      { key: "Anniversary Date", label: "Anniversary Date", type: "date", showIf: (data) => data["Marital Status"] === "Married" },
  
    ],
   
  

  

    "Educational Details": [
      { key: "Qualification", label: "Qualification", type: "select", options: ["Below 10th", "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Doctorate"] },
      { key: "Professional Qualification", label: "Professional Qualification", type: "text" },
      { key: "Specialization", label: "Specialization", type: "text" }
    ],
    "Contact Details": [
      { key: "Mobile No", label: "Mobile No", type: "tel" },
      { key: "Alternate Mobile", label: "Alternate Mobile", type: "tel" },
      { key: "Personal Email", label: "Personal Email", type: "email" },
      { key: "Work Email", label: "Work Email", type: "email" },
      { key: "Phone (Residence)", label: "Phone (Residence)", type: "tel" },
      { key: "Phone Extension", label: "Phone Extension", type: "tel" }
    ],
    "KYC Details": [
      { key: "PAN Number", label: "PAN Number", type: "text" },
      { key: "Aadhaar No", label: "Aadhaar No", type: "text" },
      { key: "Voter ID", label: "Voter ID", type: "text" },
      { key: "Driving Licence", label: "Driving Licence", type: "text" },
      { key: "Passport No", label: "Passport No", type: "text" },
      { key: "Passport Expiry", label: "Passport Expiry", type: "date" }
    ],
    "Emergency Contact": [
      { key: "Emerg_Contact Person", label: "Contact Person", type: "text" },
      { key: "Emerg_Relationship", label: "Relationship", type: "select", options: ["Brother", "Sister", "Father", "Mother", "Spouse", "Friend", "Other"] },
      { key: "Emerg_Mobile No", label: "Mobile No", type: "tel" },
      { key: "Emerg_Alternate No", label: "Alternate No", type: "tel" }
    ]
  },
  organization: {
    "Employment Details": [
      { key: "Department", label: "Department", type: "select", options: ["Information Technology", "Finance & Accounts", "Human Resources", "Operations", "Sales & Marketing", "Production", "Purchase", "Quality"] },
      { key: "Designation", label: "Designation", type: "select", options: ["Software Engineer", "Senior Engineer", "Team Lead", "Manager", "Senior Manager", "Deputy Manager", "Director"] },
      { key: "Grade / Level", label: "Grade / Level", type: "select", options: ["L1 — Junior", "L2 — Mid", "L3 — Senior", "L4 — Lead", "L5 — Principal"] },
      { key: "Branch / Location", label: "Branch / Location", type: "select", options: ["Noida — Head Office", "Mumbai", "Delhi", "Pune", "Bangalore"] },
      { key: "Cost Centre", label: "Cost Centre", type: "text" },
      { key: "Reporting Manager", label: "Reporting Manager", type: "text" },
      { key: "Employment Type", label: "Employment Type", type: "select", options: ["Full Time", "Part Time", "Contract", "Consultant", "Intern"] },
      { key: "Work Shift", label: "Work Shift", type: "select", options: ["General (9-6)", "Morning", "Evening", "Night", "Flexible"] },
      { key: "Work Location Type", label: "Work Location Type", type: "select", options: ["Office", "Work From Home", "Hybrid", "Field"] },
      { key: "Employee Category", label: "Employee Category", type: "select", options: ["Permanent", "Probation", "Trainee", "Contractual"] }
    ],
    "Joining & Tenure": [
      { key: "Joining Date", label: "Joining Date", type: "date" },
      { key: "Confirmation Date", label: "Confirmation Date", type: "date" },
      { key: "Probation Period", label: "Probation Period", type: "select", options: ["3 Months", "6 Months", "1 Year", "NA"] },
      { key: "Notice Period", label: "Notice Period", type: "select", options: ["30 Days", "60 Days", "90 Days", "NA"] },
      { key: "Previous Experience", label: "Previous Experience", type: "text" },
      { key: "Total Experience", label: "Total Experience", type: "text", readOnly: true }
    ],
    "Previous Employment": [
      { key: "Previous Company", label: "Previous Company", type: "text" },
      { key: "Last Designation", label: "Last Designation", type: "text" },
      { key: "Last CTC", label: "Last CTC (₹ LPA)", type: "text" },
      { key: "Reason for Leaving", label: "Reason for Leaving", type: "select", options: ["Better Opportunity", "Higher Studies", "Personal", "Relocation", "Layoff"] },
      { key: "PF Account (Previous)", label: "PF Account (Previous)", type: "text" },
      { key: "UAN Number", label: "UAN Number", type: "text" }
    ]
  },
  address: {
    "Correspondence Address": [
      { key: "C_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "C_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "C_City", label: "City", type: "text" },
      { key: "C_District", label: "District", type: "text" },
      { key: "C_Pin Code", label: "Pin Code", type: "text" },
      { key: "C_State", label: "State", type: "select", options: ["gorakhpur", "Maharashtra", "Delhi", "Gujarat", "Uttar Pradesh", "Karnataka", "Tamil Nadu", "Rajasthan", "Madhya Pradesh"] },
      { key: "C_Country", label: "Country", type: "select", options: ["India", "Other"] }
    ],
    "Permanent Address": [
      { key: "Same as Correspondence", label: "Same as Correspondence Address", type: "checkbox" },
      { key: "P_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "P_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "P_City", label: "City", type: "text" },
      { key: "P_District", label: "District", type: "text" },
      { key: "P_Pin Code", label: "Pin Code", type: "text" },
      { key: "P_State", label: "State", type: "select", options: ["MH", "Maharashtra", "Delhi", "Uttar Pradesh"] },
      { key: "P_Country", label: "Country", type: "select", options: ["India", "Other"] }
    ]
  },
  bank_and_payroll: {
    "Bank Details": [
      { key: "Bank Name", label: "Bank Name", type: "text" },
      { key: "IFSC Code", label: "IFSC Code", type: "text" },
      { key: "Account Number", label: "Account Number", type: "text" },
      { key: "Account Type", label: "Account Type", type: "select", options: ["Savings", "Current", "Salary"] },
      { key: "Account Holder Name", label: "Account Holder Name", type: "text" },
      { key: "Branch Name", label: "Branch Name", type: "text" },
      { key: "MICR Code", label: "MICR Code", type: "text" }
    ],
    "Statutory Details": [
      { key: "PF Number", label: "PF Number", type: "text" },
      { key: "UAN", label: "UAN", type: "text" },
      { key: "ESI Number", label: "ESI Number", type: "text" },
      { key: "PT State", label: "PT State", type: "select", options: ["Maharashtra", "Karnataka", "Andhra Pradesh", "Telangana", "Gujarat"] },
      { key: "PF Applicable", label: "PF Applicable", type: "select", options: ["Yes", "No"] },
      { key: "ESI Applicable", label: "ESI Applicable", type: "select", options: ["Yes", "No"] },
      { key: "Gratuity Eligible", label: "Gratuity Eligible", type: "select", options: ["Yes", "No"] },
      { key: "TDS Category", label: "TDS Category", type: "select", options: ["Salaried", "Non-Salaried", "Exempt"] }
    ],
    "Salary Details": [
      { key: "CTC", label: "CTC (₹ per annum)", type: "text" },
      { key: "Basic", label: "Basic (₹ per month)", type: "text" },
      { key: "HRA", label: "HRA (₹ per month)", type: "text" },
      { key: "Special Allowance", label: "Special Allowance", type: "text" },
      { key: "Salary Effective Date", label: "Salary Effective Date", type: "date" }
    ]
  },
  documents: {
    "Document Repository": [
      { key: "Aadhaar Card", label: "Aadhaar Card Upload", type: "file" },
      { key: "PAN Card", label: "PAN Card Upload", type: "file" },
      { key: "Offer Letter", label: "Offer Letter Upload", type: "file" }
    ]
  }
};
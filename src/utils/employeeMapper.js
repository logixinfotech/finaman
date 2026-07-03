export const employeeFieldMap = {
  // --- Personal Information ---
  "Title": "Title",
  "Gender": "Gender",
  "First Name": "Led_name",
  "Last Name": "Led_alias",
  "Date of Birth": "Dob",
  "Blood Group": "Blood",
  "Religion": "Religion",

  // --- Family Info ---
  "Father's / Guardian's Name": "F_name",
  "Mother's Name": "M_name",
  "Anniversary Date": "Doa",
  "Spouse Name": "Spouse",

  // --- Educational Details ---
  "Qualification": "E_qua",
  "Professional Qualification": "P_qua",

  // --- Contact Details ---
  "Mobile No": "Mobile",
  "Personal Email": "Email",
  "Phone (Residence)": "Phone_residence",

  // --- Emergency Contact Details ---
  "Emerg_Contact Person": "Person",
  "Emerg_Relationship": "Relation",
  "Emerg_Mobile No": "Phone",
  "Emerg_Alternate No": "Alt_phone",

  // --- KYC Details ---
  "Driving Licence": "Driving",
  "Aadhaar No": "Aadhar",
  "Voter ID": "Voter",
  "PAN Number": "Pan_no",
  "Passport No": "Passport",

  // --- Correspondence Address ---
  "C_Address Line 1": "Add1",
  "C_City": "City",
  "C_District": "Area",
  "C_Pin Code": "Pin",
  "C_State": "State",

  // --- Permanent Address ---
  "P_Address Line 1": "Padd1",
  "P_City": "Pcity",
  "P_District": "Parea",
  "P_Pin Code": "Ppin",
  "P_State": "Pstate",

  // --- Bank Details ---
  "Bank Name": "Bank_name",
  "IFSC Code": "Bank_ifsc",
  "Branch Name": "Bank_add",
  "Account Number": "Bank_acc",

  // --- Employment / Organization ---
  "Employment Type": "Emp_type",
  "Employee ID": "Led_code",
  "Grade / Level": "Op_id1",
  "Division": "Op_id2",
  "Branch / Location": "Branch_location",
  "Department": "Op_id3",
  "Designation": "Op_id5",
  "Reporting Manager": "Op_id6",
  "Status": "Approved",


  // --- Joining & Status ---
  "Joining Date": "Doj",
  "Confirmation Date": "Doc",
  "Status Leaving Date": "Dol",
  "Status Reason": "Led_rsn",

  // --- PF / ESIC Details ---
  "PF Number": "Epf_no",
  "ESI Number": "Esic_no",

  // --- Salary & Payroll ---
  "Basic": "Pay_amt",
  "Remarks": "Pay_rmks",

  // --- Leave ---
  "Leave allow names": "leave_san",

  // --- Personal (nayi columns) ---
  "Middle Name": "Middle_name",
  "Nationality": "Nationality",
  "Category": "Category",
  "No. of Children": "No_of_children",
  "Passport Expiry": "Passport_expiry",
  "Specialization": "Specialization",

  // --- Contact (nayi columns) ---
  "Alternate Mobile": "Alt_mobile",
  "Work Email": "Work_email",
  "Phone Extension": "Phone_ext",
  // "Phone (Residence)": "Alt_phone",   // Phone se alag column ab

  // --- Address (nayi columns) ---
  "C_Address Line 2": "C_Address2",
  "C_Country": "C_Country",
  "P_Address Line 2": "P_Address2",
  "P_Country": "P_Country",

  // --- Organization (nayi columns) ---
  "Cost Centre": "Cost_centre",
  "Work Shift": "Work_shift",
  "Work Location Type": "Work_loc_type",
  "Employee Category": "Emp_category",
  "Probation Period": "Probation_period",
  "Notice Period": "Notice_period",

  // --- Previous Employment (nayi columns) ---
  "Previous Company": "Prev_company",
  "Last Designation": "Last_desig",
  "Last CTC": "Last_ctc",
  "Reason for Leaving": "Reason_leaving",
  "PF Account": "Pf_account_prev",

  // --- Bank Details (nayi columns) ---
  "Account Type": "Account_type",
  "Holder Name": "Holder_name",
  "MICR Code": "Micr_code",

  // --- Salary Details (nayi columns) ---
  "CTC": "Ctc",
  "HRA": "Hra",
  "Special Allowance": "Special_allow",
  "Salary Effective Date": "Salary_eff_date",

  // --- Statutory (nayi columns) ---
  "UAN": "Uan",
  "PT State": "Pt_state",
  "PF Applicable": "Pf_applicable",
  "ESI Applicable": "Esi_applicable",
  "Gratuity": "Gratuity",
  "TDS Category": "Tds_category",

  // --- Joining & Tenure (nayi columns) ---
  "Previous Experience": "Prev_exp",
  "Total Experience": "Total_exp",
};



export const transformToBackend = (data) => {
  const result = {};

  Object.keys(data).forEach((key) => {

    const dbKey = employeeFieldMap[key];

    if (dbKey) {

      // ✅ Leave names array → string
      if (key === "Leave allow names") {

        result[dbKey] = Array.isArray(data[key])
          ? data[key].join(",")
          : "";
      }

      else {

        result[dbKey] = data[key];
      }
    }
  });

  return result;
};
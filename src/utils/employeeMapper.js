export const employeeFieldMap = {
  // --- Personal Information ---
  "Title": "Title",
  "Gender": "Gender",
  "First Name": "Led_name",
  "Last Name": "Led_alias",
  "DOB": "Dob",
  "Blood Group": "Blood",
  "Religion": "Religion",

  // --- Family Info ---
  "Father": "F_name",
  "Mother": "M_name",
  // "Married": "Is_bill",
  "Aniversary": "Doa",
  "Spouse": "Spouse",

  // --- Educational Details ---
  "Qualification": "E_qua",
  "Professional": "P_qua",

  // --- Contact Details ---
  "Mobile No": "Mobile",
  "Email Id": "Email",

  // --- Emergency Contact Details ---
  "Basic_Emerg_Contact Person": "Person",
  "Basic_Emerg_Relation": "Relation",
  "Basic_Emerg_Mobile No": "Phone",

  // --- KYC Details ---
  "Driving Licence No": "Driving",
  "Adhar Card No": "Aadhar",
  "Voter Id": "Voter",
  "Pan No": "Pan_no",
  "Passport": "Passport",

  // --- Correspondence Address ---
  "C_Adress Line": "Add1",
  "C_City": "City",
  "C_District": "Area",
  "C_Pin Code": "Pin",
  "C_State": "State",

  // --- Permanent Address ---
  "P_Adress Line": "Padd1",
  "P_City": "Pcity",
  "P_District": "Parea",
  "P_Pin Code": "Ppin",
  "P_State": "Pstate",

  // --- Bank Details ---
  "Bank Name": "Bank_name",
  "Bank Ifsc": "Bank_ifsc",
  "Bank Address": "Bank_add",
  "Bank Account": "Bank_acc",

  // --- Employment / Organization ---
  "Employee Type": "Emp_type",
  "Employee Code": "Led_code",
  "Punch Card No": "Punch_no",
  // "Joining Date": "Doj",
  "Confirm Date": "Doc",
  "Grade": "Op_id1",
  "Division": "Op_id2",
  "Department": "Op_id3",
  "Branch": "Op_id4",
  "Designation": "Op_id5",
  "Reporting to": "Op_id6",

  // --- PF / ESIC Details ---
  "EPF Number": "Epf_no",
  "PF Join Date": "Doepf",
  "PF Leaving Date": "Dolepf",
  "PF Reason": "Epf_rsn",
  "EDLI Number": "Edli_no",
  "ESIC Number": "Esic_no",
  "EDLI Join Date": "Dojesic",
  "Gratuity Number": "Gratuity",

  // --- Status & Dates ---
  "Status Join Date": "Doj",
  "Status Leaving Date": "Dol",
  "Status Reason": "Led_rsn",

  // --- Earnings & Deductions ---
  "Basic Salary": "Pay_amt",
  "TDS": "Is_tds",
  "Remarks": "Pay_rmks",
  "Leave allow names": "leave_san",// Or specific field if designated
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
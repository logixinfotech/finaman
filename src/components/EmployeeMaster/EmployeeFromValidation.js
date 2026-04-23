export const validateSingleField = (fieldName, value) => {
  const valStr = value ? String(value).trim() : "";
  const nameStr = fieldName.toLowerCase();

  
  const isRequiredField = 
    nameStr.includes("first name") || 
    nameStr === "mobile no" || 
    nameStr === "email id" || 
    nameStr === "department";

  if (valStr === "") {
    if (isRequiredField) {
      return "This field is required";
    }
    return null;}
  if (nameStr.includes("first name") || nameStr.includes("contact person") || nameStr.includes("father") || nameStr.includes("mother")) {
    if (!/^[A-Za-z\s]+$/.test(valStr)) {
      return "Name must contain only alphabets";
    }
    if (valStr.length < 3) {
      return "Name must be at least 3 characters";
    }
  }


  if (nameStr === "dob") {
    const dobDate = new Date(valStr);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return "Employee must be at least 18 years old";
    }
  }
  
  
  else if (nameStr.includes("aadhaar") || nameStr.includes("adhar")) {
    if (!/^\d{12}$/.test(valStr)) {
      return "Aadhaar must be exactly 12 digits";
    }
  }

 
  else if (nameStr.includes("mobile") || nameStr.includes("phone")) {
    if (!/^[6-9]\d{9}$/.test(valStr)) {
      return "Enter valid 10-digit mobile number (starts with 6-9)";
    }
  }
  

  else if (nameStr.includes("email")) {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(valStr)) {
      return "Enter a valid email address";
    }
  }
  

  else if (nameStr.includes("pin code") || nameStr === "pin") {
    if (!/^[1-9][0-9]{5}$/.test(valStr)) {
      return "PIN code must be exactly 6 digits";
    }
  }
  

  else if (nameStr.includes("voter id")) {
    if (!/^[A-Z]{3}[0-9]{7}$/i.test(valStr)) {
       return "Invalid Voter ID format (e.g., ABC1234567)";
    }
  }


  else if (nameStr.includes("pan no") || nameStr === "pan card") {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(valStr)) {
      return "Invalid PAN format (e.g., ABCDE1234F)";
    }
  }
  

  else if (nameStr.includes("bank ifsc") || nameStr.includes("ifsc")) {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(valStr)) {
      return "Invalid IFSC format (e.g., SBIN0123456)";
    }
  }

  else if (nameStr.includes("bank account") || nameStr.includes("account no")) {
    if (!/^\d{9,18}$/.test(valStr)) {
      return "Account number must be between 9 and 18 digits";
    }
  }
  

  else if (
    nameStr.includes("salary") || 
    nameStr === "hra" || 
    nameStr === "da" || 
    nameStr === "pf" || 
    nameStr === "tds" ||
    nameStr === "conveyance" ||
    nameStr === "medical"
  ) {
    if (isNaN(valStr) || Number(valStr) < 0) {
      return "Must be a valid positive number";
    }
  }

  return null; 
};


export const validateEmployeeForm = (formData, fieldGroups) => {
  const errors = {};
  let firstErrorTab = "basic";
  let hasFoundFirstError = false;

  const markError = (key, msg, tab = "basic") => {
    if (!errors[key]) { 
      errors[key] = msg;
    }
    if (!hasFoundFirstError) {
      firstErrorTab = tab;
      hasFoundFirstError = true;
    }
  };


 const firstName = formData["First Name"];

if (!firstName || firstName.trim() === "") {
  markError("First Name", "First Name is required", "basic");
} else if (firstName.trim().length < 3) {
  markError("First Name", "Name must be at least 3 characters", "basic");
} else if (!/^[A-Za-z\s]+$/.test(firstName.trim())) {
  markError("First Name", "Name must contain only alphabets", "basic");
}

  if (fieldGroups) {
    for (const [tabKey, groups] of Object.entries(fieldGroups)) {
      for (const [groupTitle, fields] of Object.entries(groups)) {
        if (Array.isArray(fields)) {
          for (const fieldObj of fields) {
            

            if (fieldObj.showIf && !fieldObj.showIf(formData)) {
              continue;
            }

            const fieldKey = fieldObj.key;
            const errorMsg = validateSingleField(fieldKey, formData[fieldKey]);
            
            if (errorMsg) {
              markError(fieldKey, errorMsg, tabKey);
            }
          }
        }
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors, firstErrorTab };
};
import { text } from "@fortawesome/fontawesome-svg-core";
import { useState, useEffect, forwardRef } from "react";

const ERPDateInput = forwardRef(({
  value,
  onChange,
  className,
  disabled
}, ref) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleInputChange = (e) => {
    let val = e.target.value; 
    val = val.replace(/[^0-9-]/g, ""); 
    const isDeleting = val.length < inputValue.length;

    // 3. Auto-dash Logic
    if (!isDeleting) { 
      if (val.length === 2 && !val.includes("-")) {
        val = val + "-";
      }   
      else if (val.length === 5 && val.split("-").length === 2) {
        val = val + "-";
      }
    }
 
    if (val.length <= 10) {
      setInputValue(val);
    }
  };

  const handleBlur = () => {
    if (!inputValue) return;

    const today = new Date();
    let day, month, year;
    const parts = inputValue.split("-");

    // Logic to handle shorthand entry (e.g., typing just "25" and blurring)
    if (parts.length === 1 && parts[0]) {
      day = parts[0];
      month = today.getMonth() + 1;
      year = today.getFullYear();
    } else if (parts.length === 2) {
      day = parts[0];
      month = parts[1];
      year = today.getFullYear();
    } else if (parts.length === 3) {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    }

    // Ensure we have valid numbers before formatting
    if (day && month && year) {
      const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setInputValue(formatted);
      if (onChange) onChange(formatted);
    }
  };

  return (
    <input
      ref={ref}   
      type="text"
      value={inputValue}
      placeholder="DD-MM-YYYY"
      onChange={handleInputChange}
      onBlur={handleBlur}
   
     className={`${className} placeholder:text-[11px]`}
      disabled={disabled}
    />
  );
});

export default ERPDateInput;
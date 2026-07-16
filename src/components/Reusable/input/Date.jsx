 
import React, { useState, useEffect, forwardRef } from "react";
 
const parseDateValue = (val) => {
  if (!val) return null;
  const datePart = val.includes("T") ? val.split("T")[0] : val;
  if (!datePart.includes("-")) return null;

  const parts = datePart.split("-");
  if (parts.length !== 3) return null;

  let y, m, d;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    // DD-MM-YYYY
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  }

  if (!y || !m || !d) return null;

  const dateObj = new Date(y, m - 1, d);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

const ERPDateInput = forwardRef(({
  value,
  onKeyDown,
  onChange,
  className = "",
  disabled = false,
  error = false,
  minDate = null,            // pass the "From" field's value here when this is the "To" field
  maxDate = null,            // pass the "To" field's value here when this is the "From" field
  minDateLabel = "From date",
  maxDateLabel = "To date",
}, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid Date");

  const formatToUI = (val) => {
    if (!val) return "";
    // Strip time/timezone if present (handles "2026-04-01T00:00:00.000Z" → "2026-04-01")
    const datePart = val.includes("T") ? val.split("T")[0] : val;
    if (!datePart.includes("-")) return datePart;
    const parts = datePart.split("-");
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return datePart;
  };

  useEffect(() => {
    setInputValue(formatToUI(value));
  }, [value]);

  const handleInputChange = (e) => {
    let val = e.target.value;
    val = val.replace(/[^0-9-]/g, "");
    const isDeleting = val.length < inputValue.length;
    if (!isDeleting) {
      if (val.length === 2 && !val.includes("-")) val = val + "-";
      else if (val.length === 5 && val.split("-").length === 2) val = val + "-";
    }
    if (val.length <= 10) {
      setInputValue(val);
      setIsInvalid(false); // Reset error while typing
    }
  };

  const validateAndFormat = () => {
    if (!inputValue) {
      setIsInvalid(false);
      if (onChange) onChange("");
      return;
    }
    const today = new Date();
    let d, m, y;
    const parts = inputValue.split("-");
    // Extract parts with defaults
    d = parseInt(parts[0], 10);
    m = parts[1] ? parseInt(parts[1], 10) : today.getMonth() + 1;
    y = parts[2] ? parts[2] : today.getFullYear().toString();
    // Fix 2-digit year
    if (y.length === 2) y = "20" + y;
    y = parseInt(y, 10);

    // --- VALIDATION LOGIC ---
    const dateCheck = new Date(y, m - 1, d);

    // Check if Month is 1-12, and if the Date object actually matches the input
    // (JS Date auto-rolls "Jan 32" to "Feb 01", so we check if d/m/y stayed the same)
    const isValid =
      m >= 1 && m <= 12 &&
      dateCheck.getFullYear() === y &&
      dateCheck.getMonth() === m - 1 &&
      dateCheck.getDate() === d &&
      y > 1900 && y < 2100; // Basic year range check

    if (!isValid) {
      setIsInvalid(true);
      setErrorMessage("Invalid Date");
      return;
    }

    // --- RANGE VALIDATION (From / To) ---
    dateCheck.setHours(0, 0, 0, 0);

    if (minDate) {
      const minDateObj = parseDateValue(minDate);
      if (minDateObj && dateCheck < minDateObj) {
        setIsInvalid(true);
        setErrorMessage(`Date cannot be before ${minDateLabel}`);
        return;
      }
    }

    if (maxDate) {
      const maxDateObj = parseDateValue(maxDate);
      if (maxDateObj && dateCheck > maxDateObj) {
        setIsInvalid(true);
        setErrorMessage(`Date cannot be after ${maxDateLabel}`);
        return;
      }
    }

    setIsInvalid(false);
    const finalDay = String(d).padStart(2, "0");
    const finalMonth = String(m).padStart(2, "0");

    const uiFormat = `${finalDay}-${finalMonth}-${y}`;
    const dbFormat = `${y}-${finalMonth}-${finalDay}`;
    setInputValue(uiFormat);
    if (onChange) onChange(dbFormat);
  };

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type="text"
        value={inputValue}
        placeholder="DD-MM-YYYY"
        onChange={handleInputChange}
        onBlur={validateAndFormat}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={`
          h-9 w-full px-3 py-1.5 
          text-[10px]  border rounded-md shadow-sm
          transition-all duration-200 outline-none
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-slate-800"}
          ${(isInvalid || error) 
            ? " focus:ring-2 focus:ring-red-500/20" 
            : "border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}
          ${className}
        `}
      />
      {isInvalid && (
       <div className="absolute left-0 top-[100%] z-50 mt-[2px]">
                      <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium">
                      {errorMessage}
                      </div>
                    </div>
      )}
    </div>
  );
});

export default ERPDateInput; 
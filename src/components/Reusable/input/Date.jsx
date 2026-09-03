import React, { useState, useEffect, forwardRef, useRef } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";

const parseDateValue = (val) => {
  if (!val) return null;
  const datePart = val.includes("T") ? val.split("T")[0] : val;
  if (!datePart.includes("-")) return null;

  const parts = datePart.split("-");
  if (parts.length !== 3) return null;

  let y, m, d;
  if (parts[0].length === 4) {
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
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
  minDate = null,           
  maxDate = null,
  minDateLabel = "From date",
  maxDateLabel = "To date",
}, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid Date");

  // ✅ ADDED: hidden native date input ke liye ref
  const hiddenDateRef = useRef(null);

  const formatToUI = (val) => {
    if (!val) return "";
    const datePart = val.includes("T") ? val.split("T")[0] : val;
    if (!datePart.includes("-")) return datePart;
    const parts = datePart.split("-");
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return datePart;
  };

  // ✅ ADDED: DD-MM-YYYY -> YYYY-MM-DD (native input ke liye chahiye)
  const formatToNative = (val) => {
    if (!val) return "";
    const datePart = val.includes("T") ? val.split("T")[0] : val;
    if (!datePart.includes("-")) return "";
    const parts = datePart.split("-");
    if (parts[0].length === 4) return datePart; // already YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
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
      setIsInvalid(false); 
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
    d = parseInt(parts[0], 10);
    m = parts[1] ? parseInt(parts[1], 10) : today.getMonth() + 1;
    y = parts[2] ? parts[2] : today.getFullYear().toString();
    // Fix 2-digit year
    if (y.length === 2) y = "20" + y;
    y = parseInt(y, 10);

 
    const dateCheck = new Date(y, m - 1, d);

    const isValid =
      m >= 1 && m <= 12 &&
      dateCheck.getFullYear() === y &&
      dateCheck.getMonth() === m - 1 &&
      dateCheck.getDate() === d &&
      y > 1900 && y < 2100; 

    if (!isValid) {
      setIsInvalid(true);
      setErrorMessage("Invalid Date");
      return;
    }

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

  // ✅ ADDED: calendar se date pick hone par
  const handleNativeDateChange = (e) => {
    const nativeVal = e.target.value; // YYYY-MM-DD
    if (!nativeVal) return;
    const [y, m, d] = nativeVal.split("-");
    const uiFormat = `${d}-${m}-${y}`;
    setInputValue(uiFormat);
    // seedha validateAndFormat wala flow trigger karne ke liye onChange call
    if (onChange) onChange(nativeVal);
  };

  // ✅ ADDED: icon click par native picker kholna
  const openCalendar = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      if (hiddenDateRef.current.showPicker) {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.click();
      }
    }
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
          h-9 w-full px-3 py-1.5 pr-8
          text-[10px]  border rounded-md shadow-sm
          transition-all duration-200 outline-none
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-slate-800"}
          ${(isInvalid || error) 
            ? " focus:ring-2 focus:ring-red-500/20" 
            : "border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}
          ${className}
        `}
      />

      {/* ✅ ADDED: Calendar icon button */}
     
        <button
          type="button"
          tabIndex={-1}
          onClick={openCalendar}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <FaRegCalendarAlt className="text-[13px]" />
        </button>
   

      {/* ✅ ADDED: Hidden native date input jo actual picker kholega */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={formatToNative(inputValue)}
        onChange={handleNativeDateChange}
        disabled={disabled}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
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
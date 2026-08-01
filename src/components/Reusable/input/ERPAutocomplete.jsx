import { useState, useRef, useEffect } from "react";
const ERPAutocomplete = ({
  value,
  onChange,
  options = [],
  placeholder = "",
  onKeyDown,
  className = "",
  disabled = false, 
  showAddIfNoMatch = false, // Kept for backward compatibility
  addLabel = "Add New",
  onAddClick
}) => {
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShow(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
const toggleDropdown = () => {
  if (disabled) return;
  if (show) {
    setShow(false);
    setHighlightIndex(-1);
  } else {
    setFiltered(options);
    setShow(true);
  }
};
  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (!val) {
      setFiltered(options);
      setShow(true);
      return;
    } 
    const lowerVal = val.toLowerCase();
    const startsWithMatch = options.filter((opt) =>
      opt.toLowerCase().startsWith(lowerVal)
    );
    const containsMatch = options.filter(
      (opt) =>
        opt.toLowerCase().includes(lowerVal) &&
        !opt.toLowerCase().startsWith(lowerVal)
    );
    setFiltered([...startsWithMatch, ...containsMatch]);
    setShow(true);
    setHighlightIndex(-1);
  };
  const selectOption = (opt) => {
    onChange(opt);
    setShow(false);
    setHighlightIndex(-1);
  };
  const handleKey = (e) => {
    if (e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      if (onKeyDown) onKeyDown(e); // 🔥 delegate to parent navigation
      return;
    }
    if (!show) {
      if (onKeyDown) onKeyDown(e);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev
      );
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
    if (e.key === "Enter") {
      if (highlightIndex >= 0) {
        e.preventDefault();
        selectOption(filtered[highlightIndex]);
      } else if (filtered.length === 1) {
        e.preventDefault();
        selectOption(filtered[0]);
      } else {
        // 🔥 THE FIX: Close the dropdown before moving focus
        setShow(false);
        setHighlightIndex(-1);
        if (onKeyDown) onKeyDown(e); // This moves focus to the next input
      }
    }
    if (e.key === "Escape") {
      setShow(false);
    }
  };
  return (
    <div ref={wrapperRef} className="relative">
      <input
        className={`w-full pr-7 ${className}`}
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => {
          setFiltered(options);
          setShow(true);
        }}
        onKeyDown={handleKey}
      />
<button
  type="button"
  tabIndex={-1}
  disabled={disabled}
  onMouseDown={(e) => {
    e.preventDefault(); // prevent input blur before toggle
    toggleDropdown();
  }}
  className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center ${
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
  }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`text-gray-500 transition-transform duration-150 ${
      show ? "rotate-180" : ""
    }`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</button>
      {show && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow max-h-52 overflow-auto text-xs">
          
          {filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <div
                key={i}
                className={`px-3 py-1 cursor-pointer ${
                  i === highlightIndex
                    ? "bg-blue-400 text-white"
                    : "hover:bg-gray-100"
                }`}
                onMouseDown={() => selectOption(opt)}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">
              No results found
            </div>
          )}  
          {onAddClick && !disabled && (
            <div
              className="px-3 py-2 border-t text-blue-600 font-medium cursor-pointer hover:bg-blue-50 sticky bottom-0 bg-white"
              onMouseDown={(e) => {
                e.preventDefault(); 
                if (onAddClick) onAddClick(value);
              }}
            >
              + {addLabel} {value ? `"${value}"` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ERPAutocomplete;
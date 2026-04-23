import { useState, useRef, useEffect } from "react";

const ERPAutocomplete = ({
  value,
  onChange,
  options = [],
  placeholder = "",
  onKeyDown,
  className = "",
  disabled = false, 
  showAddIfNoMatch = false,
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
      }
    }
    if (e.key === "Escape") {
      setShow(false);
    }
  };
  return (
    <div ref={wrapperRef} className="relative">
      <input
        className={`w-full ${className}`}
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

      {show && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow max-h-52 overflow-auto text-xs">
 
          {filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <div
                key={i}
                className={`px-3 py-1 cursor-pointer ${
                  i === highlightIndex
                    ? "bg-blue-100"
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
          {showAddIfNoMatch &&
            value &&
            filtered.length === 0 &&
            !disabled && (
              <div
                className="px-3 py-2 border-t text-blue-600 font-medium cursor-pointer hover:bg-blue-50"
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  if (onAddClick) onAddClick(value);
                }}
              >
                + {addLabel} "{value}"
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ERPAutocomplete;
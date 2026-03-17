import { useState, useRef, useEffect } from "react";

const ERPAutocomplete = ({
  value,
  onChange,
  options = [],
  placeholder = "",
  onKeyDown,
}) => {
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const wrapperRef = useRef(null);

  // close dropdown when clicking outside
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

    const match = options.filter((opt) =>
      opt.toLowerCase().includes(val.toLowerCase())
    );

    setFiltered(match);
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
      }
    }

    if (e.key === "Escape") {
      setShow(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
        value={value || ""}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => {
          setFiltered(options);
          setShow(true);
        }}
        onKeyDown={handleKey}
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border rounded shadow max-h-40 overflow-auto text-xs">
          {filtered.map((opt, i) => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ERPAutocomplete;
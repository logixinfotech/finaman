import React from "react";
import ERPDateInput from "../input/Date";
import ERPAutocomplete from "../input/ERPAutocomplete";

const FieldRenderer = ({
  fieldObj,
  value,
  onChange,
  disabled,
  error,
  onKeyDown,  
}) => {
  const { type = "text", options = [] } = fieldObj; 
  const getInputClass = (isDisabled) =>
    `w-full h-[32px] px-2 text-[16px] border border-gray-300 rounded-md outline-none transition-all ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const baseClass = getInputClass(disabled);

  switch (type) {
    case "date":
      return (
        <ERPDateInput
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={baseClass}
          onKeyDown={onKeyDown}
        />
      );

    case "select":
      return (
        <ERPAutocomplete
          options={options}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={baseClass}
        />
      );

    case "checkbox":
      return (
        <div className="flex items-center h-[26px] w-full px-1">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            onKeyDown={onKeyDown}
          />
        </div>
      );

    case "textarea":
      return (
        <textarea
          className={`${baseClass} min-h-[60px] py-1`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onKeyDown={onKeyDown}
        />
      );

    default:
      return (
        <input
          className={baseClass}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onKeyDown={onKeyDown}
          style={{ whiteSpace: "nowrap" }}
        />
      );
  }
};

export default FieldRenderer;
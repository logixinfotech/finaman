import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import ERPDateInput from "../input/Date";
import ERPAutocomplete from "../input/ERPAutocomplete";
import MultiSelectField from "../../../pages/Modules/QMS/Components/MultiSelectField";


const DynamicSelect = ({ fieldObj, value, disabled, onChange, formData,error }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const dependsOnValue = fieldObj.dependsOn ? (formData?.[fieldObj.dependsOn] ?? "") : "__READY__";

  useEffect(() => {
    if (!fieldObj.fetchOptions) return;
    if (fieldObj.dependsOn && !dependsOnValue) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const param = fieldObj.dependsOn ? dependsOnValue : undefined;
    fieldObj.fetchOptions(param)
      .then((data) => {
        if (cancelled) return;
        setOptions(
          data.map((d) =>
            typeof d === "string"
              ? { value: d, label: d }
              : { value: d.value ?? d.id ?? d.code, label: d.label ?? d.name }
          )
        );
      })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [dependsOnValue]);

     const baseClass = `w-full h-[32px] px-2 text-[16px] border rounded-md outline-none transition-all ${
    disabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed border-gray-300"
      : error
        ? "bg-white text-gray-900 border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-red-100" // 🆕
        : "bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
  }`;
return (
    <select
      value={value ?? ""}
      disabled={disabled || loading}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
    >
      <option value="">
        {loading ? "Loading…" : `Select ${fieldObj.label ?? ""}`}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
};

 const AutoGrowTextarea = ({ value, onChange, disabled, onKeyDown, error }) => { // 🆕 error yahan add karo
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 60)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={`w-full px-2 py-1.5 text-[13px] border rounded-md outline-none transition-all resize-y overflow-hidden ${
        disabled
          ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
          : error
            ? "bg-white text-slate-800 border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-red-100" // 🆕
            : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      }`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      onKeyDown={onKeyDown}
      style={{ minHeight: "60px" }}
    />
  );
};

const FieldRenderer = ({
  fieldObj,
  value,
  onChange,
  minDate,
  minDateLabel,
  disabled,
  error,
  onKeyDown,
  formData,
  inputClassName, // optional: overrides the default input styling (opt-in, existing callers unaffected)
}) => {
  const { type = "text" } = fieldObj;
  const inputProps = fieldObj.inputProps || {}; // optional: extra native attrs e.g. { type: "number", step: "0.5", placeholder }

  const getInputClass = (disabled, error) =>
    `w-full h-[28px] px-2 text-[13px] border rounded-md outline-none transition-all ${
      disabled
        ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
        : error
          ? "bg-white text-slate-800 border-[#dc2626] focus:border-[#dc2626] focus:ring-1 focus:ring-red-100" // 🆕 error state
          : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
    }`;

  const baseClass = inputClassName ?? getInputClass(disabled, error);

  switch (type) {
    // Plain <select> for fixed lists; options may be strings or { value, label }
    case "native-select":
      return (
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={baseClass}
        >
          {(fieldObj.options || []).map((o) => {
            const opt = typeof o === "object" ? o : { value: o, label: o };
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      );

    case "dynamic-select":
      return (
        <DynamicSelect
          fieldObj={fieldObj}
          value={value}
          disabled={disabled}
          onChange={onChange}
          formData={formData}
          error={error}
        />
      );

    case "date":
      return (
        <ERPDateInput
          value={value ?? ""}
          onChange={onChange}
          minDate={minDate}
          minDateLabel={minDateLabel}
          disabled={disabled}
          error={error}
          className={baseClass}
          onKeyDown={onKeyDown}
        />
      );

    case "select":
      return (
        <ERPAutocomplete
          options={fieldObj.options || []}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          error={error}
          placeholder={inputProps.placeholder}
          className={baseClass}
        />
      );

    case "multiselect":
      return (
        <MultiSelectField
          options={fieldObj.options || []}
          value={value}
          error={error}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "checkbox":
      return (
        <div className={`flex items-center h-[26px] w-full px-1 border rounded-md ${
      error ? "border-[#dc2626]" : "border-transparent" // 🆕 checkbox ke around border
    }`}>
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer accent-slate-700"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            onKeyDown={onKeyDown}
          />
        </div>
      );

    case "textarea": {
      return <AutoGrowTextarea
        value={value}
        error={error}
        onChange={onChange}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />;
    }

    default:
      return (
        <input
          {...inputProps}
          className={baseClass}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onKeyDown={onKeyDown}
          style={{ whiteSpace: "nowrap" }}
        />
      );
  }
};

export default FieldRenderer;

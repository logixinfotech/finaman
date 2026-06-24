import React,{useState, useEffect} from "react";
import ERPDateInput from "../input/Date";
import ERPAutocomplete from "../input/ERPAutocomplete";


const DynamicSelect = ({ fieldObj, value, disabled, onChange, formData }) => {
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

  const baseClass = `w-full h-[32px] px-2 text-[16px] border border-gray-300 rounded-md outline-none transition-all ${
    disabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
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
}) => {
  const { type = "text" } = fieldObj;

  const getInputClass = (disabled) =>
    `w-full h-[28px] px-2 text-[13px] border rounded-md outline-none transition-all ${
      disabled
        ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
        : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
    }`;

  const baseClass = getInputClass(disabled);

  switch (type) {
    case "dynamic-select":
      return (
        <DynamicSelect
          fieldObj={fieldObj}
          value={value}
          disabled={disabled}
          onChange={onChange}
          formData={formData}
        />
      );

    case "date":
      return (
        <ERPDateInput
          value={value || ""}
          onChange={onChange}
          minDate={minDate}
          minDateLabel={minDateLabel}
          disabled={disabled}
          className={baseClass}
          onKeyDown={onKeyDown}
        />
      );

    case "select":
      return (
        <ERPAutocomplete
          options={fieldObj.options || []}
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
            className="w-4 h-4 cursor-pointer accent-slate-700"
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
          className={`w-full px-2 py-1.5 text-[13px] border rounded-md outline-none transition-all min-h-[60px] resize-y ${
            disabled
              ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          }`}
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

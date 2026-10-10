import React, { useState, useEffect } from "react";
import { Settings2, RotateCcw, Check, AlertCircle } from "lucide-react";

// ── Controls (unchanged) ──

export const CheckboxCtrl = ({ value, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!value}
    onClick={() => onChange(!value)}
    className={`relative w-[38px] h-[22px] rounded-full transition-colors duration-200 shrink-0 ${
      value ? "bg-blue-600" : "bg-slate-200"
    }`}
  >
    <span
      className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
        value ? "translate-x-[16px]" : "translate-x-0"
      }`}
    />
  </button>
);

const NumberCtrl = ({ value, onChange, width = "70px", suffix }) => (
  <div className="flex items-center gap-1.5">
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-[30px] border border-slate-200 rounded-md text-right text-[12.5px] px-2 bg-white text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-[70px] sm:w-auto"
      style={{ maxWidth: width }}
    />
    {suffix && <span className="text-[11.5px] text-slate-400 font-medium whitespace-nowrap">{suffix}</span>}
  </div>
);

const SelectCtrl = ({ value, onChange, options, width = "160px" }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    className="h-[30px] border border-slate-200 rounded-md text-[12.5px] px-2 bg-white text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[110px]"
    style={{ maxWidth: width }}
  >
    {options.map((opt) => (
      <option key={opt.value ?? opt} value={opt.value ?? opt}>
        {opt.label ?? opt}
      </option>
    ))}
  </select>
);

const DateCtrl = ({ value, onChange }) => (
  <input
    type="date"
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    className="h-[30px] border border-slate-200 rounded-md text-[12.5px] px-2 bg-white text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
  />
);

const TextCtrl = ({ value, onChange, width = "180px", placeholder = "" }) => (
  <input
    type="text"
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-[30px] border border-slate-200 rounded-md text-[12.5px] px-2.5 bg-white text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-[120px]"
    style={{ maxWidth: width }}
  />
);

// ── Row ──

const SettingRow = ({ row, values, onChange }) => {
  const renderCtrl = (ctrl) => {
    const val = values[ctrl.key];
    const change = (v) => onChange(ctrl.key, v);
    switch (ctrl.type) {
      case "checkbox": return <CheckboxCtrl key={ctrl.key} value={val} onChange={change} />;
      case "number":   return <NumberCtrl  key={ctrl.key} value={val} onChange={change} width={ctrl.width} suffix={ctrl.suffix} />;
      case "select":   return <SelectCtrl  key={ctrl.key} value={val} onChange={change} options={ctrl.options} width={ctrl.width} />;
      case "date":     return <DateCtrl    key={ctrl.key} value={val} onChange={change} />;
      case "text":     return <TextCtrl    key={ctrl.key} value={val} onChange={change} width={ctrl.width} placeholder={ctrl.placeholder} />;
      default:         return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-4 py-[11px] border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <div className="flex-1 min-w-0">
        <span className={`text-[12.5px] leading-snug ${row.bold ? "font-semibold text-slate-800" : "text-slate-600"}`}>
          {row.label}
        </span>
        {row.description && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{row.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {row.controls.map((ctrl) => renderCtrl(ctrl))}
      </div>
    </div>
  );
};

// ── Section card ──

const SettingSection = ({ section, values, onChange }) => {
  const rows = section.rows || [];
  const mid = Math.ceil(rows.length / 2);
  const leftRows = rows.slice(0, mid);
  const rightRows = rows.slice(mid);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      {section.section && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">
            {section.section}
          </span>
        </div>
      )}
      <div className={`grid ${rightRows.length > 0 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"} xl:divide-x divide-slate-100`}>
        <div>{leftRows.map((row, i) => <SettingRow key={row.controls[0]?.key ?? i} row={row} values={values} onChange={onChange} />)}</div>
        {rightRows.length > 0 && (
          <div>{rightRows.map((row, i) => <SettingRow key={row.controls[0]?.key ?? i} row={row} values={values} onChange={onChange} />)}</div>
        )}
      </div>
    </div>
  );
};

// ── Main component ──

const ERPSettings = ({
  applName = "Module",
  config = [],
  initialValues = {},
  onSave,
  onCancel,
  onRestore,
   hideFooter = false, onChange 
}) => {
  const [values, setValues] = useState(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDirty) setValues(initialValues);
  }, [initialValues, isDirty]);

  const handleChange = (key, value) => {
    setValues((prev) => { const next = { ...prev, [key]: value }; onChange?.(next); return next; });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(values);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = () => {
    setValues(initialValues);
    setIsDirty(false);
    onRestore?.();
  };

  const isEmpty = !config || config.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#eef1f8] w-full h-full" style={{ fontFamily: "'Segoe UI', system-ui, Arial, sans-serif" }}> 
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Settings2 size={32} strokeWidth={1.2} />
            <span className="text-[12.5px]">No configurable settings for this module.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4 w-full">
            {config.map((section, si) => (
              <SettingSection key={section.section ?? si} section={section} values={values} onChange={handleChange} />
            ))}
          </div>
        )}
      </div>

{!hideFooter && (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-4 sm:px-6 py-2.5 bg-white border-t border-slate-200 shrink-0">
        <span className="text-[11px] text-slate-400">
          {isDirty ? "You have unsaved changes" : "All changes saved"}
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          {onRestore && (
            <button
              onClick={handleRestore}
              disabled={!isDirty}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={12} /> <span className="hidden sm:inline">Restore defaults</span>
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto sm:ml-0"
          >
            <Check size={12} /> {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
       )}
    </div>
  );
};

export default ERPSettings;
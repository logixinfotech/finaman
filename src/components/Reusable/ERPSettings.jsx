import React, { useState } from "react";

// ─────────────────────────────────────────────
// FIELD RENDERERS
// ─────────────────────────────────────────────

const CheckboxCtrl = ({ value, onChange }) => (
  <input
    type="checkbox"
    checked={!!value}
    onChange={e => onChange(e.target.checked)}
    className="w-[15px] h-[15px] rounded accent-blue-500 cursor-pointer shrink-0"
  />
);

const NumberCtrl = ({ value, onChange, width = "54px", suffix }) => (
  <div className="flex items-center gap-1">
    <input
      type="number"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="h-[24px] border border-gray-200 rounded text-right text-[12px] px-1.5 bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      style={{ width }}
    />
    {suffix && <span className="text-[11px] text-gray-400">{suffix}</span>}
  </div>
);

const SelectCtrl = ({ value, onChange, options, width = "140px" }) => (
  <select
    value={value ?? ""}
    onChange={e => onChange(e.target.value)}
    className="h-[24px] border border-gray-200 rounded text-[12px] px-1.5 bg-white text-gray-800 outline-none focus:border-blue-400"
    style={{ maxWidth: width }}
  >
    {options.map(opt => (
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
    onChange={e => onChange(e.target.value)}
    className="h-[24px] border border-gray-200 rounded text-[12px] px-1.5 bg-white text-gray-800 outline-none focus:border-blue-400"
  />
);

const TextCtrl = ({ value, onChange, width = "140px", placeholder = "" }) => (
  <input
    type="text"
    value={value ?? ""}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-[24px] border border-gray-200 rounded text-[12px] px-1.5 bg-white text-gray-800 outline-none focus:border-blue-400"
    style={{ width }}
  />
);

// ─────────────────────────────────────────────
// SINGLE ROW
// Each row = { key, label, bold?, controls: [...] }
// controls: [{ type, key, ...props }, ...]
// ─────────────────────────────────────────────

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
    <div className={`
      flex items-center justify-between px-3.5 min-h-[34px]
      border-b border-gray-100 gap-2.5 last:border-0
      hover:bg-gray-50 transition-colors
    `}>
      <span className={`text-[12.5px] leading-snug py-1.5 flex-1 ${
        row.bold ? "font-medium text-gray-800" : "text-gray-500"
      }`}>
        {row.label}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {row.controls.map(ctrl => renderCtrl(ctrl))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────

const SectionLabel = ({ title }) => (
  <div className="text-[10px] font-medium tracking-[0.16em] uppercase text-gray-400 bg-gray-50 px-3.5 py-1.5 border-y border-gray-100">
    {title}
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

/**
 * ERPSettings — reusable settings panel
 *
 * Props:
 *   applName   — module display name (shown in header)
 *   config     — array of sections (see CONFIG SHAPE below)
 *   onSave     — (values) => void
 *   onCancel   — () => void
 *   onRestore  — () => void  (optional)
 *
 * CONFIG SHAPE:
 * [
 *   {
 *     section: "General",          // section label (falsy = no label)
 *     rows: [
 *       {
 *         key: "allowTaxMod",       // unique key (used when section has 1 col)
 *         label: "Allow mod of tax details for GST",
 *         bold: false,              // optional bold label
 *         controls: [
 *           { type: "checkbox", key: "allowTaxMod" },
 *           { type: "number",   key: "taxPct", width: "54px", suffix: "%" },
 *           { type: "select",   key: "itemType", options: ["Finish Goods","Trading"] },
 *           { type: "date",     key: "effectiveDate" },
 *           { type: "text",     key: "ledgerName", width: "140px" },
 *         ]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 *
 * LAYOUT: rows are split into two columns automatically.
 * Each section's rows array is split in half — left col gets rows[0..half], right gets rows[half..end].
 * For a single-column section, just put all rows in rows[] — they still split naturally.
 */
const ERPSettings = ({
  applName = "Module",
  config = [],
  initialValues = {},
  onSave,
  onCancel,
  onRestore,
}) => {
  const [values, setValues] = useState(initialValues);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (onSave) onSave(values);
  };

  const handleRestore = () => {
    setValues(initialValues);
    if (onRestore) onRestore();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ fontFamily: "'Inter','Tahoma',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-gray-400">
          Settings
        </span>
        <span className="text-[11px] text-gray-300 italic">{applName}</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {config.map((section, si) => (
          <div key={si}>
            {section.section && <SectionLabel title={section.section} />}

            {/* Two-column split */}
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              {/* Left col — first half of rows */}
              <div className="divide-y divide-gray-100">
                {section.rows
                  .slice(0, Math.ceil(section.rows.length / 2))
                  .map(row => (
                    <SettingRow key={row.controls[0]?.key} row={row} values={values} onChange={handleChange} />
                  ))
                }
              </div>
              {/* Right col — second half */}
              <div className="divide-y divide-gray-100">
                {section.rows
                  .slice(Math.ceil(section.rows.length / 2))
                  .map(row => (
                    <SettingRow key={row.controls[0]?.key} row={row} values={values} onChange={handleChange} />
                  ))
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <span className="text-[11px] text-gray-300 italic">Changes apply on next session load</span>
        <div className="flex gap-2">
          {onRestore && (
            <button
              onClick={handleRestore}
              className="px-3 py-1 text-[12px] text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              Restore defaults
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-1 text-[12px] text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-[12px] text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ERPSettings;
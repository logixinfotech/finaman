import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { Btn, Field, erp, isVisible, validateDraft } from "../LogbookUi";
import { SPAN, SRC_LABEL, spanOf, limitText } from "./model";

/* Live entry form exactly as the operator will see it. Nothing here is saved. */
export default function PreviewForm({ columns, entrySign }) {
  const [v, setV] = useState({}); const [errs, setErrs] = useState({}); const [checked, setChecked] = useState(false);
  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); setErrs((p) => { const n = { ...p }; delete n[k]; return n; }); setChecked(false); };
  const oor = (c) => { if (c.type !== "number" || v[c.key] === "" || v[c.key] == null) return false; const n = Number(v[c.key]); return (c.min != null && n < c.min) || (c.max != null && n > c.max); };
  const vis = columns.filter((c) => isVisible(c, v));
  if (!columns.length) return <div className="p-6 text-center text-[12.5px] text-[#94a3b8]">Add fields to see the entry form.</div>;
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3 text-[12px] text-[#5b6b85]"><FaIcons.FaInfoCircle className="text-[#1a56db]" /> Try it — conditional fields appear and disappear, limits and time rules are checked exactly like in the register.</div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-3">
        {vis.map((c) => (
          <Field key={c._id || c.key} label={c.label || c.key} required={c.required} className={SPAN[spanOf(c)]}>
            {c.type === "select" ? (
              <select className={erp.input} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)}>
                <option value="">Select…</option>
                {c.source ? <option>{SRC_LABEL[c.source]} — sample value</option> : (c.options || []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : c.type === "textarea" ? <textarea rows={2} className={`${erp.input} !h-auto py-1`} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
              : (
                <div className="relative">
                  <input className={`${erp.input} ${oor(c) ? "!border-amber-400 !bg-amber-50" : ""} ${errs[c.key] ? "!border-[#dc2626]" : ""}`} type={c.type === "time" ? "time" : c.type === "date" ? "date" : c.type === "number" ? "number" : "text"} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
                  {c.unit && <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] text-[#64748b] pointer-events-none">{c.unit}</span>}
                </div>
              )}
            {oor(c) && <div className="text-[11px] font-semibold text-amber-600"><FaIcons.FaExclamationTriangle className="inline -mt-0.5 mr-1" size={10} />Out of limit ({limitText(c)}) — will be flagged</div>}
            {errs[c.key] && <div className="text-[11px] font-semibold text-[#dc2626]">{errs[c.key]}</div>}
            {c.helpText && !errs[c.key] && <div className="text-[11px] text-[#64748b]">{c.helpText}</div>}
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#eef1f8]">
        <Btn kind="primary" onClick={() => { const e = validateDraft(vis, v); setErrs(e); setChecked(Object.keys(e).length === 0); }}><FaIcons.FaClipboardCheck size={11} /> Validate entry</Btn>
        <Btn onClick={() => { setV({}); setErrs({}); setChecked(false); }}>Clear</Btn>
        {checked && <span className="text-[12px] font-semibold text-emerald-600"><FaIcons.FaCheckCircle className="inline -mt-0.5 mr-1" />Entry is valid.{entrySign ? " The operator would now e-sign it." : ""}</span>}
      </div>
    </div>
  );
}
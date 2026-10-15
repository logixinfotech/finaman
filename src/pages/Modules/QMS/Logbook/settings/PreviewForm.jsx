import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { isVisible, validateDraft } from "../LogbookUi";
import { SPAN, SRC_LABEL, spanOf, limitText, durationOf, ruleHit, RULE_ACTIONS } from "./model";
import { Button, Label, inp, area } from "./ui";

/* Live entry form exactly as the operator gets it: conditional fields, auto time spent, limits and rules */
const outside = (c, v, lo, hi) => v !== "" && v != null && Number.isFinite(Number(v)) && ((c[lo] != null && Number(v) < c[lo]) || (c[hi] != null && Number(v) > c[hi]));
const ACTION = Object.fromEntries(RULE_ACTIONS);

export default function PreviewForm({ columns, entrySign, rules = [] }) {
  const [raw, setRaw] = useState({}); const [errs, setErrs] = useState({}); const [checked, setChecked] = useState(false);
  const v = useMemo(() => {   // add calculated values
    const o = { ...raw };
    columns.filter((c) => c.type === "duration").forEach((c) => { o[c.key] = durationOf(c, o); });
    return o;
  }, [raw, columns]);
  const set = (k, val) => { setRaw((p) => ({ ...p, [k]: val })); setErrs((p) => { const n = { ...p }; delete n[k]; return n; }); setChecked(false); };
  const vis = columns.filter((c) => isVisible(c, v));
  const fired = (rules || []).filter((r) => r.enabled !== false).map((r) => ({ r, c: columns.find((c) => c.key === r.field) })).filter(({ r, c }) => c && isVisible(c, v) && ruleHit(r, c, v[r.field]));
  if (!columns.length) return <div className="p-8 text-center text-[13px] text-[#9ca3af]">Add fields to see the entry form.</div>;

  return (
    <div className="p-5">
      <div className="grid grid-cols-4 gap-x-4 gap-y-4">
        {vis.map((c) => {
          const act = outside(c, v[c.key], "min", "max"); const alert = !act && outside(c, v[c.key], "alertMin", "alertMax");
          return (
            <div key={c._id || c.key} className={SPAN[spanOf(c)]}>
              <Label required={c.required}>{c.label || c.key}</Label>
              {c.type === "select" ? (
                <select className={inp} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)}>
                  <option value="">Select…</option>
                  {c.source ? <option>{SRC_LABEL[c.source]} — sample</option> : (c.options || []).map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : c.type === "textarea" ? <textarea rows={2} className={area} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
                : (
                  <div className="relative">
                    <input className={`${inp} ${c.unit ? "pr-[46px]" : ""} ${act ? "!border-[#f87171] !bg-[#fef2f2]" : alert ? "!border-[#fbbf24] !bg-[#fffbeb]" : ""} ${errs[c.key] ? "!border-[#dc2626]" : ""}`}
                      type={c.type === "time" ? "time" : c.type === "date" ? "date" : c.type === "number" ? "number" : "text"}
                      readOnly={c.type === "duration"} placeholder={c.type === "duration" ? "calculated" : ""}
                      value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
                    {c.unit && <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#6b7280] pointer-events-none">{c.unit}</span>}
                  </div>
                )}
              {act && <div className="mt-1 text-[12px] font-semibold text-[#b91c1c]">Out of action limit ({limitText(c)})</div>}
              {alert && <div className="mt-1 text-[12px] font-semibold text-[#b45309]">Beyond alert limit ({c.alertMin ?? "…"}–{c.alertMax ?? "…"})</div>}
              {errs[c.key] && <div className="mt-1 text-[12px] font-semibold text-[#dc2626]">{errs[c.key]}</div>}
              {c.helpText && !errs[c.key] && !act && !alert && <div className="mt-1 text-[12px] text-[#6b7280]">{c.helpText}</div>}
            </div>
          );
        })}
      </div>

      {fired.length > 0 && (
        <div className="mt-4 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-4 py-2.5">
          <div className="text-[12px] font-semibold text-[#78350f] mb-1">Rules triggered</div>
          {fired.map(({ r, c }) => <div key={r.id} className="text-[13px] text-[#78350f]">• {c.label}: {r.action === "notify" ? `Notify ${r.role || "a role"}` : ACTION[r.action]}</div>)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#f3f4f6]">
        <Button kind="primary" icon={FaIcons.FaCheck} onClick={() => { const e = validateDraft(vis, v); setErrs(e); setChecked(Object.keys(e).length === 0); }}>Validate entry</Button>
        <Button onClick={() => { setRaw({}); setErrs({}); setChecked(false); }}>Clear</Button>
        {checked && <span className="text-[13px] font-semibold text-[#047857]"><FaIcons.FaCheckCircle className="inline -mt-0.5 mr-1.5" />Entry is valid.{entrySign ? " The operator would now e-sign it." : ""}</span>}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { RULE_ACTIONS, opsFor, needsValue, ruleHit, uid, SRC_LABEL, durationOf } from "./model";
import { Card, Toggle, Badge, Button, Empty, FieldBox, inpSm } from "./ui";

/* ═══════════════════════════════════════════════════════════════════════
   Rules & alerts — "When <field> <condition> [value] then <action> [role / remarks field]"
   Left: rules (+ suggestions) · Right: live tester
   ═══════════════════════════════════════════════════════════════════════ */

const ACTION_HELP = {
  block: "Entry cannot be saved", remarks: "Entry needs remarks first", notify: "Saved · role is alerted",
  deviation: "Saved · deviation required", flag: "Saved · flagged for QA review",
};
const isNum = (c) => c && (c.type === "number" || c.type === "duration");

export default function RulesTab({ ed, editing, roleOpts }) {
  const d = ed.draft; const cols = d.columns; const rules = d.rules || [];
  const [tryVals, setTryVals] = useState({});
  const textCols = cols.filter((c) => c.type === "text" || c.type === "textarea");
  const remarksKey = (textCols.find((c) => /remark|comment/i.test(`${c.key} ${c.label}`)) || textCols[0])?.key || "";

  const setRules = (fn) => ed.apply((p) => ({ ...p, rules: fn(p.rules || []) }));
  const patch = (id, ch) => setRules((rs) => rs.map((r) => {
    if (r.id !== id) return r;
    const n = { ...r, ...ch };
    if (ch.field) { const ops = opsFor(cols.find((c) => c.key === ch.field)).map((o) => o[0]); if (!ops.includes(n.op)) n.op = ops[0]; n.value = ""; }
    if (ch.action === "remarks" && !n.target) n.target = remarksKey;
    return n;
  }));
  const add = (rule) => setRules((rs) => [...rs, { id: uid(), enabled: true, ...rule }]);
  const addBlank = () => { const f = cols.find(isNum) || cols[0]; if (f) add({ field: f.key, op: opsFor(f)[0][0], value: "", action: "flag" }); };
  const remove = (id) => setRules((rs) => rs.filter((r) => r.id !== id));

  /* suggestions from the fields' own limits and Yes/No questions */
  const suggestions = useMemo(() => {
    const has = (f, op) => rules.some((r) => r.field === f && r.op === op);
    const out = [];
    cols.forEach((c) => {
      if (isNum(c) && (c.min != null || c.max != null) && !has(c.key, "beyondAction")) out.push({ t: `${c.label} beyond action limit → raise a deviation`, r: { field: c.key, op: "beyondAction", action: "deviation" } });
      if (isNum(c) && (c.alertMin != null || c.alertMax != null) && !has(c.key, "beyondAlert") && remarksKey) out.push({ t: `${c.label} beyond alert limit → remarks mandatory`, r: { field: c.key, op: "beyondAlert", action: "remarks", target: remarksKey } });
      if (c.type === "select" && (c.options || []).includes("No") && !has(c.key, "equals")) out.push({ t: `${c.label} is “No” → block the entry`, r: { field: c.key, op: "equals", value: "No", action: "block" } });
      if (c.type === "select" && (c.options || []).includes("Fail") && !has(c.key, "equals")) out.push({ t: `${c.label} is “Fail” → raise a deviation`, r: { field: c.key, op: "equals", value: "Fail", action: "deviation" } });
    });
    return out.slice(0, 4);
  }, [cols, rules, remarksKey]);

  const testVals = useMemo(() => { const o = { ...tryVals }; cols.filter((c) => c.type === "duration").forEach((c) => { o[c.key] = durationOf(c, o); }); return o; }, [tryVals, cols]);
  const fired = (r) => { const c = cols.find((x) => x.key === r.field); return r.enabled !== false && !!c && ruleHit(r, c, testVals[r.field]); };
  const testCols = useMemo(() => {
    const keys = new Set(rules.map((r) => r.field));
    cols.filter((c) => c.type === "duration" && keys.has(c.key)).forEach((c) => { keys.add(c.fromField); keys.add(c.toField); });
    return cols.filter((c) => keys.has(c.key) && c.type !== "duration");
  }, [cols, rules]);
  const outcome = rules.filter(fired);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <Card title="Rules & alerts" desc="Checked every time an entry is saved. Use them to stop wrong entries, demand an explanation, alert QA or start a deviation."
        right={editing && <Button kind="primary" icon={FaIcons.FaPlus} onClick={addBlank} disabled={!cols.length}>Add rule</Button>} bodyClass="p-5 flex flex-col gap-3">

        {editing && suggestions.length > 0 && (
          <div className="rounded-[8px] border border-dashed border-[#d1d5db] px-4 py-3">
            <div className="text-[12px] font-semibold text-[#374151] mb-2"><FaIcons.FaLightbulb size={11} className="inline -mt-0.5 mr-1.5 text-[#f59e0b]" />Suggested from your fields</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => <button key={s.t} type="button" onClick={() => add(s.r)} className="h-[28px] px-3 rounded-[14px] border border-[#e5e7eb] bg-white text-[12px] text-[#374151] hover:border-[#1a56db] hover:text-[#1a56db]"><FaIcons.FaPlus size={8} className="inline -mt-0.5 mr-1.5" />{s.t}</button>)}
            </div>
          </div>
        )}

        {rules.length === 0 && <Empty icon={FaIcons.FaBolt} title="No rules yet">Example — when Temperature is beyond action limit, raise a deviation.</Empty>}

        {rules.map((r, idx) => {
          const col = cols.find((c) => c.key === r.field);
          const on = fired(r); const off = r.enabled === false;
          const noLimits = (r.op === "beyondAction" && col && col.min == null && col.max == null) || (r.op === "beyondAlert" && col && col.alertMin == null && col.alertMax == null);
          return (
            <div key={r.id} className={`rounded-[8px] border transition-colors ${on ? "border-[#fbbf24] bg-[#fffdf5]" : "border-[#e5e7eb] bg-white"} ${off ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2 px-4 pt-3">
                <span className="w-[22px] h-[22px] rounded-full bg-[#f3f4f6] text-[11px] font-semibold text-[#4b5563] flex items-center justify-center">{idx + 1}</span>
                <span className="text-[12px] text-[#6b7280]">{ACTION_HELP[r.action]}</span>
                {on && <Badge tone="amber">Triggered in test</Badge>}
                <div className="ml-auto flex items-center gap-2">
                  <span className="w-[42px]"><Toggle small checked={!off} disabled={!editing} onChange={(v) => patch(r.id, { enabled: v })} /></span>
                  {editing && <button type="button" title="Delete rule" onClick={() => remove(r.id)} className="w-[28px] h-[28px] rounded-[6px] text-[#9ca3af] hover:bg-[#fef2f2] hover:text-[#b91c1c] flex items-center justify-center"><FaIcons.FaTrashAlt size={11} /></button>}
                </div>
              </div>
              <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2 gap-y-2 items-center px-4 pt-2.5 pb-3">
                <span className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#6b7280]">When</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select className={`${inpSm} !w-[190px]`} disabled={!editing} value={r.field} onChange={(e) => patch(r.id, { field: e.target.value })}>
                    {cols.map((c) => <option key={c._id} value={c.key}>{c.label}</option>)}
                  </select>
                  <select className={`${inpSm} !w-[200px]`} disabled={!editing} value={r.op} onChange={(e) => patch(r.id, { op: e.target.value })}>
                    {opsFor(col).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {needsValue(r.op) && (col?.type === "select" && !col.source && col.options?.length
                    ? <select className={`${inpSm} !w-[140px]`} disabled={!editing} value={r.value ?? ""} onChange={(e) => patch(r.id, { value: e.target.value })}><option value="">value…</option>{col.options.map((o) => <option key={o}>{o}</option>)}</select>
                    : <input className={`${inpSm} !w-[120px]`} disabled={!editing} type={isNum(col) ? "number" : "text"} placeholder="value" value={r.value ?? ""} onChange={(e) => patch(r.id, { value: e.target.value })} />)}
                  {isNum(col) && (r.op === "beyondAction" || r.op === "beyondAlert") && !noLimits && (
                    <span className="text-[12px] text-[#6b7280]">({r.op === "beyondAlert" ? `${col.alertMin ?? "…"}–${col.alertMax ?? "…"}` : `${col.min ?? "…"}–${col.max ?? "…"}`}{col.unit ? ` ${col.unit}` : ""})</span>)}
                </div>
                <span className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#6b7280]">Then</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select className={`${inpSm} !w-[200px]`} disabled={!editing} value={r.action} onChange={(e) => patch(r.id, { action: e.target.value })}>
                    {RULE_ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {r.action === "notify" && (
                    <select className={`${inpSm} !w-[170px]`} disabled={!editing} value={r.role || ""} onChange={(e) => patch(r.id, { role: e.target.value })}>
                      <option value="">Role…</option>{roleOpts.map((o) => <option key={o.role} value={o.role}>{o.role}</option>)}
                    </select>)}
                  {r.action === "remarks" && (
                    <select className={`${inpSm} !w-[170px]`} disabled={!editing} value={r.target || ""} onChange={(e) => patch(r.id, { target: e.target.value })}>
                      <option value="">Remarks field…</option>{textCols.map((c) => <option key={c._id} value={c.key}>{c.label}</option>)}
                    </select>)}
                </div>
                {(r.action === "block" || r.action === "remarks") && <>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#6b7280]">Show</span>
                  <input className={`${inpSm} max-w-[580px]`} disabled={!editing} placeholder="Message to the operator (optional) — e.g. Gowning not OK: do not enter the area." value={r.message || ""} onChange={(e) => patch(r.id, { message: e.target.value })} />
                </>}
              </div>
              {noLimits && <div className="px-4 pb-3 -mt-1 text-[12px] text-[#b45309]"><FaIcons.FaExclamationTriangle size={10} className="inline -mt-0.5 mr-1.5" />“{col.label}” has no {r.op === "beyondAlert" ? "alert" : "action"} limits — set them in Form builder or this rule never fires.</div>}
            </div>
          );
        })}
      </Card>

      <aside className="xl:sticky xl:top-0 flex flex-col gap-4">
        <Card title="Test rules" desc="Type values the way an operator would." bodyClass="p-5 flex flex-col gap-3">
          {testCols.length === 0 ? <div className="text-[13px] text-[#9ca3af]">Add a rule to test it here.</div> : testCols.map((c) => (
            <FieldBox key={c._id} label={`${c.label}${c.unit ? ` (${c.unit})` : ""}`}>
              {c.type === "select"
                ? <select className={inpSm} value={tryVals[c.key] || ""} onChange={(e) => setTryVals((v) => ({ ...v, [c.key]: e.target.value }))}><option value="">—</option>{c.source ? <option>{SRC_LABEL[c.source]} sample</option> : (c.options || []).map((o) => <option key={o}>{o}</option>)}</select>
                : <input className={inpSm} type={c.type === "number" ? "number" : c.type === "time" ? "time" : c.type === "date" ? "date" : "text"} value={tryVals[c.key] || ""} onChange={(e) => setTryVals((v) => ({ ...v, [c.key]: e.target.value }))} />}
            </FieldBox>
          ))}
          {cols.filter((c) => c.type === "duration" && testVals[c.key]).map((c) => <div key={c._id} className="text-[12px] text-[#0f766e]">{c.label}: <b>{testVals[c.key]} {c.unit || "min"}</b> (calculated)</div>)}
        </Card>
        {testCols.length > 0 && (
          <Card title="Result" bodyClass="p-5">
            {outcome.length === 0 ? <div className="flex items-center gap-2 text-[13px] text-[#047857]"><FaIcons.FaCheckCircle size={13} /> Entry would be saved normally.</div>
              : <div className="flex flex-col gap-2">{outcome.map((r) => {
                const c = cols.find((x) => x.key === r.field);
                const tone = r.action === "block" ? "text-[#b91c1c]" : r.action === "remarks" ? "text-[#b45309]" : "text-[#1d4ed8]";
                return <div key={r.id} className={`text-[13px] ${tone}`}><b>{RULE_ACTIONS.find((a) => a[0] === r.action)?.[1]}{r.action === "notify" && r.role ? ` (${r.role})` : ""}</b><div className="text-[12px] text-[#6b7280]">because {c?.label} {opsFor(c).find((o) => o[0] === r.op)?.[1]}{needsValue(r.op) ? ` ${r.value}` : ""}</div></div>;
              })}</div>}
          </Card>
        )}
      </aside>
    </div>
  );
}

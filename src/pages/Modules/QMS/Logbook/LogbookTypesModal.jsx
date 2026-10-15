import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../components/Reusable/alert";
import { saveLogbookType, resetLogbookType, createLogbookType, getRoleOptions } from "../Utils/LogbookAPI";
import { Modal, Btn, Kbd, Pill, Field, SearchBox, erp, isVisible, validateDraft } from "./LogbookUi";

/* ═══════════════════════════════════════════════════════════════════════
   Logbook Type Builder — pharma / GMP edition
   • 3-pane designer: field palette · WYSIWYG canvas (drag & drop) · inspector
   • Conditional fields, number limits (OOL flag), master-data dropdowns
   • Document control (Doc No., SOP ref, revision), change-reason + diff on save
   • Live interactive preview · ALCOA+ compliance check · undo/redo · JSON import/export
   ═══════════════════════════════════════════════════════════════════════ */

const REF_TYPES = ["equipment", "instrument", "area", "general"];
const CATEGORIES = ["Equipment", "Instrument", "Area", "General"];
const SOURCES = ["product", "personnel", "equipment", "instrument", "area"];
const SRC_LABEL = { product: "Product", personnel: "Personnel", equipment: "Equipment", instrument: "Instrument", area: "Area" };
const NEW_KEY = "__new__";
const PAL_MIME = "application/x-logbook-palette";
const SPAN = { 1: "col-span-4 md:col-span-1", 2: "col-span-4 md:col-span-2", 3: "col-span-4 md:col-span-3", 4: "col-span-4" };
const spanOf = (c) => c.span || (c.type === "textarea" ? 2 : 1);

const TYPE_META = {
  text: { label: "Text", icon: FaIcons.FaFont, color: "#475569" },
  textarea: { label: "Long text", icon: FaIcons.FaAlignLeft, color: "#475569" },
  number: { label: "Number", icon: FaIcons.FaHashtag, color: "#0e7490" },
  select: { label: "Dropdown", icon: FaIcons.FaListUl, color: "#7c3aed" },
  time: { label: "Time", icon: FaIcons.FaClock, color: "#d97706" },
  date: { label: "Date", icon: FaIcons.FaCalendarAlt, color: "#059669" },
};
const CAT_ICON = { Equipment: FaIcons.FaCogs, Instrument: FaIcons.FaMicroscope, Area: FaIcons.FaMapMarkerAlt, General: FaIcons.FaClipboardList };

/** Palette. `make()` returns one or more column templates. "@prev" in showIf.field = first inserted column. */
const PALETTE = [
  { group: "Basic", items: [
    { id: "text", label: "Text", icon: FaIcons.FaFont, make: () => [{ label: "Text field", type: "text" }] },
    { id: "textarea", label: "Long text", icon: FaIcons.FaAlignLeft, make: () => [{ label: "Description", type: "textarea" }] },
    { id: "number", label: "Number", icon: FaIcons.FaHashtag, make: () => [{ label: "Reading", type: "number" }] },
    { id: "date", label: "Date", icon: FaIcons.FaCalendarAlt, make: () => [{ label: "Date", type: "date" }] },
    { id: "time", label: "Time", icon: FaIcons.FaClock, make: () => [{ label: "Time", type: "time" }] },
  ] },
  { group: "Choice", items: [
    { id: "dropdown", label: "Dropdown", icon: FaIcons.FaListUl, make: () => [{ label: "Dropdown", type: "select", options: ["Option 1", "Option 2"] }] },
    { id: "yesno", label: "Yes / No", icon: FaIcons.FaToggleOn, make: () => [{ label: "Yes / No", type: "select", options: ["Yes", "No"] }] },
    { id: "passfail", label: "Pass / Fail", icon: FaIcons.FaCheckCircle, make: () => [{ label: "Result", type: "select", options: ["Pass", "Fail"] }] },
    { id: "okno", label: "OK / Not OK", icon: FaIcons.FaCheck, make: () => [{ label: "Condition", type: "select", options: ["OK", "Not OK"] }] },
  ] },
  { group: "Master data", items: [
    { id: "m_product", label: "Product", icon: FaIcons.FaBox, make: () => [{ label: "Product", type: "select", source: "product" }] },
    { id: "m_personnel", label: "Person", icon: FaIcons.FaUser, make: () => [{ label: "Person", type: "select", source: "personnel" }] },
    { id: "m_equipment", label: "Equipment", icon: FaIcons.FaCog, make: () => [{ label: "Equipment", type: "select", source: "equipment" }] },
    { id: "m_instrument", label: "Instrument", icon: FaIcons.FaMicroscope, make: () => [{ label: "Instrument", type: "select", source: "instrument" }] },
    { id: "m_area", label: "Area", icon: FaIcons.FaMapMarkerAlt, make: () => [{ label: "Area", type: "select", source: "area" }] },
  ] },
  { group: "Pharma blocks", items: [
    { id: "b_batch", label: "Batch No.", icon: FaIcons.FaBarcode, make: () => [{ label: "Batch No.", type: "text", required: true }] },
    { id: "b_range", label: "Start + End time", icon: FaIcons.FaHourglassHalf, make: () => [{ label: "Start", type: "time", required: true }, { label: "End", type: "time", required: true }] },
    { id: "b_limit", label: "Within limit + action", icon: FaIcons.FaExclamationTriangle, make: () => [
      { label: "Within limit", type: "select", options: ["Yes", "No"], required: true },
      { label: "Action taken", type: "text", showIf: { field: "@prev", equals: "No" } }] },
    { id: "b_remarks", label: "Remarks", icon: FaIcons.FaCommentDots, make: () => [{ label: "Remarks", type: "text" }] },
  ] },
];
const ITEMS = Object.fromEntries(PALETTE.flatMap((g) => g.items).map((i) => [i.id, i]));

/* ── helpers ───────────────────────────────────────────────────────────── */
const sig = (o) => JSON.stringify(o);
const uid = (() => { let n = 0; return () => `c${Date.now().toString(36)}${(n++).toString(36)}`; })();
const toKey = (label) => {
  const k = String(label || "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return /^[A-Za-z]/.test(k) ? k.slice(0, 50) : k ? `F${k}`.slice(0, 50) : "";
};
const uniqueKey = (base, cols) => {
  const used = new Set(cols.map((c) => c.key));
  let k = base || "Field"; let n = 2;
  while (used.has(k)) k = `${base || "Field"}${n++}`;
  return k;
};
const tidy = (c) => {
  const o = { ...c };
  Object.keys(o).forEach((k) => { if (o[k] === undefined || (o[k] === "" && k !== "label" && k !== "key")) delete o[k]; });
  if (!o.required) delete o.required;
  if (o.type !== "select") { delete o.options; delete o.source; }
  if (o.source) delete o.options;
  if (o.type !== "number") { delete o.min; delete o.max; delete o.unit; }
  if (o.min !== undefined && Number.isNaN(Number(o.min))) delete o.min;
  if (o.max !== undefined && Number.isNaN(Number(o.max))) delete o.max;
  if (o.showIf && !o.showIf.field) delete o.showIf;
  if (o.span === (o.type === "textarea" ? 2 : 1)) delete o.span;
  return o;
};
const clean = (d) => ({ ...d, columns: d.columns.map(({ _id, _auto, ...c }) => c) });
const blankType = () => ({
  key: NEW_KEY, name: "", category: "General", refType: "general", entrySign: true, endTimeKey: "", lateAfterMinutes: 30,
  verifyRequired: true, entryRoles: [], verifyRoles: [], docNo: "", sopRef: "", description: "", revision: 1,
  columns: [{ key: "Remarks", label: "Remarks", type: "text" }], isCustom: true, isCustomized: false, standard: null,
});
const toDraft = (t) => ({
  name: t.name || "", category: t.category || "General", refType: t.refType || "general", entrySign: !!t.entrySign,
  endTimeKey: t.endTimeKey || "", lateAfterMinutes: t.lateAfterMinutes || 30,
  docNo: t.docNo || "", sopRef: t.sopRef || "", description: t.description || "",
  verifyRequired: !!t.verifyRequired, entryRoles: [...(t.entryRoles || [])], verifyRoles: [...(t.verifyRoles || [])],
  columns: (t.columns || []).map((c) => ({ ...c, _id: uid() })),
});
const buildCols = (item, existing) => {
  const out = []; const all = [...existing];
  item.make().forEach((p) => {
    const col = { ...p, _id: uid(), _auto: true };
    col.key = uniqueKey(toKey(col.label), all);
    all.push(col); out.push(col);
  });
  out.forEach((c) => { if (c.showIf?.field === "@prev") c.showIf = { ...c.showIf, field: out[0].key }; });
  return out;
};
const yn = (v) => (v === true ? "Yes" : v === false ? "No" : v || "—");
const FIELD_LABEL = { name: "Name", category: "Category", refType: "Issued against", docNo: "Document No.", sopRef: "SOP reference", description: "Purpose", entrySign: "e-Sign every entry", endTimeKey: "Late-entry field", lateAfterMinutes: "Late after (min)", verifyRequired: "Verification required" };
const diffSummary = (orig, now) => {
  const a = clean(orig), b = clean(now); const out = [];
  const ak = new Map(a.columns.map((c) => [c.key, c])); const bk = new Map(b.columns.map((c) => [c.key, c]));
  b.columns.forEach((c) => { if (!ak.has(c.key)) out.push({ k: "add", t: `Added field “${c.label}” (${c.key})` }); else if (sig(ak.get(c.key)) !== sig(c)) out.push({ k: "mod", t: `Changed field “${c.label}”` }); });
  a.columns.forEach((c) => { if (!bk.has(c.key)) out.push({ k: "del", t: `Removed field “${c.label}” (${c.key})` }); });
  if (a.columns.map((c) => c.key).filter((k) => bk.has(k)).join() !== b.columns.map((c) => c.key).filter((k) => ak.has(k)).join()) out.push({ k: "mod", t: "Field order changed" });
  Object.keys(FIELD_LABEL).forEach((k) => { if (a[k] !== b[k]) out.push({ k: "mod", t: `${FIELD_LABEL[k]}: ${yn(a[k])} → ${yn(b[k])}` }); });
  if (sig(a.entryRoles) !== sig(b.entryRoles)) out.push({ k: "mod", t: `Who can add entries: ${a.entryRoles.join(", ") || "any"} → ${b.entryRoles.join(", ") || "any"}` });
  if (sig(a.verifyRoles) !== sig(b.verifyRoles)) out.push({ k: "mod", t: `Who can verify: ${a.verifyRoles.join(", ") || "any"} → ${b.verifyRoles.join(", ") || "any"}` });
  return out;
};

/** GMP / ALCOA+ guidance checks. errors block saving; everything else is advice. */
function analyse(d, { isNew, isCustom, roleOpts }) {
  const E = [], W = [], I = [], O = [];
  const cols = d.columns; const keys = new Set();
  const users = (r) => roleOpts.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
  if ((isNew || isCustom) && !d.name.trim()) E.push({ t: "Type name is required." });
  if (!cols.length) E.push({ t: "Add at least one field." });
  cols.forEach((c, i) => {
    const nm = c.label || c.key || `Field ${i + 1}`;
    if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(c.key || "")) E.push({ t: `“${nm}”: key must start with a letter and contain only letters, numbers or _.` });
    if (keys.has(c.key)) E.push({ t: `Duplicate key “${c.key}”.` });
    keys.add(c.key);
    if (!String(c.label || "").trim()) E.push({ t: `Field ${i + 1} has no label.` });
    if (c.type === "select" && !c.source && !(c.options || []).length) E.push({ t: `Dropdown “${nm}” needs options or a master list.` });
    if (c.type === "number" && c.min != null && c.max != null && Number(c.min) > Number(c.max)) E.push({ t: `“${nm}”: minimum is greater than maximum.` });
    if (c.showIf?.field) {
      if (c.showIf.field === c.key || !cols.some((x) => x.key === c.showIf.field)) E.push({ t: `“${nm}”: “show if” points to a missing field.` });
      else if (c.showIf.equals == null && c.showIf.notEquals == null) E.push({ t: `“${nm}”: choose the value for “show if”.` });
    }
  });
  if (d.endTimeKey && !cols.some((c) => c.key === d.endTimeKey && c.type === "time")) E.push({ t: "Late-entry field must be one of the time fields." });

  if (!cols.some((c) => c.required)) W.push({ t: "No mandatory fields — an operator could save a blank entry.", tag: "Complete" });
  else O.push({ t: `${cols.filter((c) => c.required).length} mandatory field(s) defined.`, tag: "Complete" });
  if (!cols.some((c) => c.type === "time")) W.push({ t: "No time field. Record the actual time of the activity.", tag: "Contemporaneous" });
  else if (!d.endTimeKey) W.push({ t: "Late-entry check is off. Choose a time field under Details & workflow.", tag: "Contemporaneous" });
  else O.push({ t: `Late-entry check active on “${d.endTimeKey}” (> ${d.lateAfterMinutes || 30} min).`, tag: "Contemporaneous" });
  if (!d.entrySign) W.push({ t: "e-Signature per entry is off — entries are attributed by login only.", tag: "Attributable" });
  else O.push({ t: "Every entry is e-signed (name, role, timestamp).", tag: "Attributable" });
  if (!d.verifyRequired) W.push({ t: "No second-person verification. Acceptable only for low-risk records.", tag: "Accurate" });
  else {
    O.push({ t: "Second-person verification required; self-verification is blocked.", tag: "Accurate" });
    if (!d.verifyRoles.length) W.push({ t: "Any user (except the author) can verify. Restrict to QA / Head roles.", tag: "Accurate" });
    if (d.entryRoles.some((r) => d.verifyRoles.map((x) => x.toLowerCase()).includes(r.toLowerCase()))) I.push({ t: "Same user group can enter and verify. The system still blocks the same person from doing both.", tag: "Accurate" });
  }
  [...new Set([...d.entryRoles, ...(d.verifyRequired ? d.verifyRoles : [])])].forEach((r) => { if (users(r) === 0) W.push({ t: `User group “${r}” has no active users.`, tag: "Access" }); });
  const noLimit = cols.filter((c) => c.type === "number" && c.min == null && c.max == null);
  if (noLimit.length) I.push({ t: `No limits set for: ${noLimit.map((c) => c.label).join(", ")}. Limits let the system flag out-of-limit readings.`, tag: "Accurate" });
  if (!d.docNo.trim() && !d.sopRef.trim()) I.push({ t: "Document No. / SOP reference not set. Add them for controlled-document traceability.", tag: "Traceability" });
  else O.push({ t: "Document control reference present.", tag: "Traceability" });
  if (!cols.some((c) => /remark|comment/i.test(`${c.key} ${c.label}`))) I.push({ t: "No remarks field. Operators need a place to explain deviations.", tag: "Complete" });
  return { errors: E, warns: W, infos: I, oks: O };
}

/* ── small UI atoms ────────────────────────────────────────────────────── */
const inputS = `${erp.input} !h-[30px] !text-[13px] !px-[8px]`;
const Panel = ({ title, icon: Icon, right, children, bodyClass = "p-3.5", className = "" }) => (
  <div className={`${erp.card} overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[#e3e9f4] bg-gradient-to-r from-[#f4f7fc] to-white">
      {Icon && <span className="w-[22px] h-[22px] rounded-[5px] bg-[#e8edf7] text-[#1a56db] flex items-center justify-center shrink-0"><Icon size={11} /></span>}
      <h3 className="text-[12px] font-bold uppercase tracking-[0.4px] text-[#1e293b]">{title}</h3>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
    <div className={bodyClass}>{children}</div>
  </div>
);
const TypeChip = ({ type, size = 22 }) => {
  const m = TYPE_META[type] || TYPE_META.text; const I = m.icon;
  return <span className="rounded-[5px] flex items-center justify-center shrink-0" style={{ width: size, height: size, color: m.color, background: `${m.color}1f` }}><I size={size * 0.46} /></span>;
};
const Toggle = ({ checked, onChange, disabled, label, hint }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left w-full disabled:opacity-60 disabled:cursor-default">
    <span className={`mt-0.5 w-9 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-[#1a56db]" : "bg-[#cbd5e1]"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </span>
    <span><span className="block text-[13px] font-semibold text-[#1e293b]">{label}</span>{hint && <span className="block text-[11.5px] text-[#5b6b85] leading-snug">{hint}</span>}</span>
  </button>
);
const Seg = ({ value, options, onChange, disabled }) => (
  <div className="inline-flex rounded-[5px] border-[1.5px] border-[#c8d2e4] overflow-hidden bg-white">
    {options.map((o) => (
      <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
        className={`px-2.5 h-[26px] text-[11.5px] font-semibold border-r border-[#e3e9f4] last:border-0 disabled:cursor-default ${value === o.v ? "bg-[#1a56db] text-white" : "text-[#475569] hover:bg-[#f4f7fc]"}`}>{o.l}</button>
    ))}
  </div>
);
function ChipsEditor({ value, onChange, disabled }) {
  const [t, setT] = useState("");
  const add = (raw) => { const parts = String(raw).split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (!parts.length) return; onChange([...new Set([...value, ...parts])]); setT(""); };
  return (
    <div className="border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] p-1.5">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((o) => (
          <span key={o} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b21b6] text-[11.5px] font-medium">{o}
            {!disabled && <button type="button" onClick={() => onChange(value.filter((x) => x !== o))} className="hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
          </span>
        ))}
        {!value.length && <span className="text-[11.5px] text-[#94a3b8] px-1">No options yet</span>}
      </div>
      {!disabled && <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Type option, press Enter" className={inputS}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} onBlur={() => add(t)} onPaste={(e) => { const x = e.clipboardData.getData("text"); if (/[,\n]/.test(x)) { e.preventDefault(); add(x); } }} />}
    </div>
  );
}
function RolePicker({ value, options, onChange, disabled }) {
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.role.toLowerCase().includes(q.toLowerCase()));
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className={`border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] p-2 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
        {value.length === 0 && <span className="text-[12px] text-[#94a3b8]">Any logged-in user</span>}
        {value.map((r) => {
          const c = options.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
          return (
            <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${c === 0 ? "border-red-300 bg-red-50 text-red-700" : "border-[#c8d2e4] bg-white text-[#1e293b]"}`}>
              {r} <span className="text-[10px] opacity-70">{c}</span>
              {!disabled && <button type="button" onClick={() => toggle(r)} className="ml-0.5 text-[#94a3b8] hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
            </span>
          );
        })}
      </div>
      {!disabled && (<>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user group…" className={inputS} />
        <div className="max-h-28 overflow-y-auto mt-1">
          {list.map((o) => (
            <button key={o.role} type="button" onClick={() => toggle(o.role)} className="w-full flex items-center gap-2 px-1.5 py-1 text-left text-[12.5px] hover:bg-[#f4f7fc]">
              <span className={`w-3 h-3 rounded border ${value.includes(o.role) ? "bg-[#1a56db] border-[#1a56db]" : "border-[#c8d2e4]"}`} />
              <span className="flex-1 truncate">{o.role}</span><span className={`text-[10px] ${o.userCount ? "text-[#94a3b8]" : "text-[#dc2626] font-semibold"}`}>{o.userCount}</span>
            </button>
          ))}
          {list.length === 0 && <div className="text-[12px] text-[#94a3b8] px-1.5 py-2">No user group found</div>}
        </div>
      </>)}
    </div>
  );
}

/* ── canvas card helpers ───────────────────────────────────────────────── */
function Faux({ c }) {
  const base = "h-[26px] rounded-[4px] border border-[#e2e8f4] bg-[#f6f8fc] px-2 flex items-center justify-between gap-2 text-[11.5px] text-[#94a3b8] overflow-hidden whitespace-nowrap";
  if (c.type === "textarea") return <div className={`${base} !h-[46px] !items-start pt-1`}>Long text…</div>;
  if (c.type === "select") return <div className={base}><span className="truncate">{c.source ? `${SRC_LABEL[c.source] || c.source} master list` : (c.options || []).slice(0, 3).join(" · ") || "No options"}</span><FaIcons.FaChevronDown size={8} /></div>;
  if (c.type === "time") return <div className={base}><span>HH:mm</span><FaIcons.FaClock size={9} /></div>;
  if (c.type === "date") return <div className={base}><span>dd-mm-yyyy</span><FaIcons.FaCalendarAlt size={9} /></div>;
  if (c.type === "number") return <div className={base}><span>0.00</span>{c.unit && <span className="font-semibold text-[#64748b]">{c.unit}</span>}</div>;
  return <div className={base}>Text…</div>;
}
const limitText = (c) => (c.min != null || c.max != null ? `${c.min ?? "…"}–${c.max ?? "…"}${c.unit ? ` ${c.unit}` : ""}` : "");

/* ── inspector (right pane) ────────────────────────────────────────────── */
function Inspector({ col, cols, editing, locked, onPatch, onRemove, onDuplicate }) {
  if (!col) return <div className="p-6 text-center text-[12.5px] text-[#94a3b8]"><FaIcons.FaMousePointer className="mx-auto mb-2" size={18} />Select a field on the canvas to edit its properties.</div>;
  const ctrl = cols.filter((c) => c._id !== col._id);
  const ctrlCol = cols.find((c) => c.key === col.showIf?.field);
  const op = col.showIf?.notEquals != null ? "notEquals" : "equals";
  const val = col.showIf?.[op] ?? "";
  const setIf = (patch) => {
    const field = patch.field ?? col.showIf?.field ?? "";
    if (!field) return onPatch({ showIf: undefined });
    const o = patch.op ?? op; const v = patch.val ?? val;
    onPatch({ showIf: v === "" ? { field } : { field, [o]: v } });
  };
  const L = ({ children }) => <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">{children}</div>;
  return (
    <div className="p-3.5 flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <TypeChip type={col.type} size={26} />
        <div className="min-w-0"><div className="text-[13px] font-bold text-[#1e293b] truncate">{col.label || "Untitled field"}</div><div className="text-[11px] text-[#5b6b85]">{TYPE_META[col.type]?.label}{locked ? " · saved field" : ""}</div></div>
      </div>
      <div><L>Label</L><input className={inputS} disabled={!editing} value={col.label || ""} onChange={(e) => onPatch({ label: e.target.value }, true)} /></div>
      <div>
        <L>Key {locked && <FaIcons.FaLock size={8} className="inline ml-1 -mt-0.5" />}</L>
        <input className={`${inputS} font-mono`} disabled={!editing || locked} value={col.key || ""} onChange={(e) => onPatch({ key: e.target.value.replace(/[^A-Za-z0-9_]/g, ""), _auto: false }, true)} />
        <div className="text-[10.5px] text-[#94a3b8] mt-0.5">{locked ? "Locked — earlier entries are stored under this key." : col._auto ? "Generated from the label." : "Custom key."}</div>
      </div>
      <div>
        <L>Field type</L>
        {locked ? <div className="text-[12.5px] text-[#475569]">{TYPE_META[col.type]?.label} <span className="text-[#94a3b8]">(locked)</span></div>
          : <select className={inputS} disabled={!editing} value={col.type} onChange={(e) => onPatch({ type: e.target.value, ...(e.target.value === "select" && !col.options && !col.source ? { options: ["Option 1", "Option 2"] } : {}) })}>
            {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>}
      </div>
      <div><L>Help text</L><input className={inputS} disabled={!editing} placeholder="Shown under the field to guide the operator" value={col.helpText || ""} onChange={(e) => onPatch({ helpText: e.target.value }, true)} /></div>
      <Toggle checked={!!col.required} disabled={!editing} onChange={(v) => onPatch({ required: v })} label="Mandatory" hint="Entry cannot be saved while empty." />

      {col.type === "number" && (
        <div>
          <L>Unit &amp; acceptable limits</L>
          <div className="grid grid-cols-3 gap-1.5">
            <input className={inputS} disabled={!editing} placeholder="Unit (°C)" value={col.unit || ""} onChange={(e) => onPatch({ unit: e.target.value }, true)} />
            <input className={inputS} type="number" disabled={!editing} placeholder="Min" value={col.min ?? ""} onChange={(e) => onPatch({ min: e.target.value === "" ? undefined : Number(e.target.value) }, true)} />
            <input className={inputS} type="number" disabled={!editing} placeholder="Max" value={col.max ?? ""} onChange={(e) => onPatch({ max: e.target.value === "" ? undefined : Number(e.target.value) }, true)} />
          </div>
          <div className="text-[10.5px] text-[#94a3b8] mt-1 leading-snug">A reading outside the limits is still recorded (never blocked) but flagged out-of-limit in the audit trail.</div>
        </div>
      )}

      {col.type === "select" && (
        <div>
          <L>Choices come from</L>
          <select className={`${inputS} mb-1.5`} disabled={!editing} value={col.source || ""} onChange={(e) => onPatch({ source: e.target.value || undefined, options: e.target.value ? undefined : (col.options?.length ? col.options : ["Option 1", "Option 2"]) })}>
            <option value="">Custom list</option>
            {SOURCES.map((s) => <option key={s} value={s}>{SRC_LABEL[s]} master</option>)}
          </select>
          {!col.source && <ChipsEditor value={Array.isArray(col.options) ? col.options : []} disabled={!editing} onChange={(v) => onPatch({ options: v })} />}
        </div>
      )}

      <div>
        <L>Width on form</L>
        <Seg disabled={!editing} value={spanOf(col)} onChange={(v) => onPatch({ span: v })} options={[{ v: 1, l: "¼" }, { v: 2, l: "½" }, { v: 3, l: "¾" }, { v: 4, l: "Full" }]} />
      </div>

      <div className="rounded-[6px] border border-[#e3e9f4] bg-[#fbfcfe] p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1.5"><FaIcons.FaCodeBranch size={10} /> Show this field only if</div>
        <select className={`${inputS} mb-1.5`} disabled={!editing} value={col.showIf?.field || ""} onChange={(e) => setIf({ field: e.target.value, val: "" })}>
          <option value="">Always visible</option>
          {ctrl.map((c) => <option key={c._id} value={c.key}>{c.label || c.key}</option>)}
        </select>
        {col.showIf?.field && (
          <div className="flex gap-1.5">
            <select className={`${inputS} !w-[78px]`} disabled={!editing} value={op} onChange={(e) => setIf({ op: e.target.value })}><option value="equals">is</option><option value="notEquals">is not</option></select>
            {ctrlCol?.type === "select" && Array.isArray(ctrlCol.options) && ctrlCol.options.length
              ? <select className={inputS} disabled={!editing} value={val} onChange={(e) => setIf({ val: e.target.value })}><option value="">Select value…</option>{ctrlCol.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
              : <input className={inputS} disabled={!editing} placeholder="value" value={val} onChange={(e) => setIf({ val: e.target.value })} />}
          </div>
        )}
      </div>

      {editing && (
        <div className="flex gap-2 pt-1 border-t border-[#eef1f8]">
          <Btn className="!h-[28px] !text-[11.5px]" onClick={onDuplicate}><FaIcons.FaCopy size={10} /> Duplicate</Btn>
          <Btn kind="danger" className="!h-[28px] !text-[11.5px] ml-auto" onClick={onRemove}><FaIcons.FaTrash size={10} /> Remove</Btn>
        </div>
      )}
    </div>
  );
}

/* ── interactive preview ───────────────────────────────────────────────── */
function PreviewForm({ columns }) {
  const [v, setV] = useState({}); const [errs, setErrs] = useState({}); const [checked, setChecked] = useState(false);
  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); setErrs((p) => { const n = { ...p }; delete n[k]; return n; }); setChecked(false); };
  const oor = (c) => { if (c.type !== "number" || v[c.key] === "" || v[c.key] == null) return false; const n = Number(v[c.key]); return (c.min != null && n < c.min) || (c.max != null && n > c.max); };
  const vis = columns.filter((c) => isVisible(c, v));
  if (!columns.length) return <div className="p-6 text-center text-[12.5px] text-[#94a3b8]">Add fields to see the entry form.</div>;
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3 text-[12px] text-[#5b6b85]"><FaIcons.FaInfoCircle className="text-[#1a56db]" /> This is how operators will see the entry form. Try it — conditional fields appear and disappear, limits are checked.</div>
      <div className="grid grid-cols-4 gap-x-3 gap-y-3">
        {vis.map((c) => (
          <Field key={c._id} label={c.label || c.key} required={c.required} className={SPAN[spanOf(c)]}>
            {c.type === "select" ? (
              <select className={erp.input} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)}>
                <option value="">Select…</option>
                {c.source ? <option>{SRC_LABEL[c.source]} — sample value</option> : (c.options || []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : c.type === "textarea" ? <textarea rows={2} className={`${erp.input} !h-auto py-1`} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
              : (
                <div className="relative">
                  <input className={`${erp.input} ${oor(c) ? "!border-amber-400 !bg-amber-50" : ""}`} type={c.type === "time" ? "time" : c.type === "date" ? "date" : c.type === "number" ? "number" : "text"} value={v[c.key] || ""} onChange={(e) => set(c.key, e.target.value)} />
                  {c.unit && <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] text-[#64748b] pointer-events-none">{c.unit}</span>}
                </div>
              )}
            {oor(c) && <div className="text-[11px] font-semibold text-amber-600"><FaIcons.FaExclamationTriangle className="inline -mt-0.5 mr-1" size={10} />Out of limit ({limitText(c)}) — will be flagged</div>}
            {errs[c.key] && <div className="text-[11px] font-semibold text-[#dc2626]">{errs[c.key]}</div>}
            {c.helpText && !errs[c.key] && <div className="text-[11px] text-[#64748b]">{c.helpText}</div>}
          </Field>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#eef1f8]">
        <Btn kind="primary" onClick={() => { const e = validateDraft(vis, v); setErrs(e); setChecked(Object.keys(e).length === 0); }}><FaIcons.FaClipboardCheck size={11} /> Validate entry</Btn>
        <Btn onClick={() => { setV({}); setErrs({}); setChecked(false); }}>Clear</Btn>
        {checked && <span className="text-[12px] font-semibold text-emerald-600"><FaIcons.FaCheckCircle className="inline -mt-0.5 mr-1" />All mandatory fields are valid.</span>}
      </div>
    </div>
  );
}

/* ── change-reason dialog (saving an existing type) ────────────────────── */
function ReasonDialog({ diff, rev, saving, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); e.preventDefault(); onCancel(); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onCancel]);
  const ok = reason.trim().length >= 5;
  const ic = { add: ["text-emerald-600", FaIcons.FaPlus], mod: ["text-[#1a56db]", FaIcons.FaPen], del: ["text-[#dc2626]", FaIcons.FaTrash] };
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/55 p-4">
      <div className="w-full max-w-lg bg-white rounded-[8px] shadow-2xl border border-[#c8d4e8] overflow-hidden">
        <div className="px-4 py-3 bg-[#e8edf7] border-b border-[#c8d4e8] flex items-center gap-2">
          <FaIcons.FaShieldAlt className="text-[#1a56db]" />
          <div className="text-[13px] font-bold text-[#1e293b]">Confirm change · Rev {rev} → Rev {rev + 1}</div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">What will change ({diff.length})</div>
            <div className="max-h-40 overflow-y-auto rounded-[5px] border border-[#e3e9f4] divide-y divide-[#eef1f8]">
              {diff.map((d, i) => { const [cls, I] = ic[d.k]; return <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 text-[12.5px] text-[#1e293b]"><I size={9} className={`mt-1 shrink-0 ${cls}`} />{d.t}</div>; })}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">Reason for change <span className="text-[#dc2626]">*</span></div>
            <textarea autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Added batch number column as per SOP QA-014 rev 3 / CC-2026-031" className={`${erp.input} !h-auto py-1.5`} />
            <div className="text-[11px] text-[#64748b] mt-1">Saved in the audit trail with your user ID, role, date &amp; time. Existing registers pick up the new layout immediately; old entries keep their data.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#dde1ea] justify-end">
          <Btn onClick={onCancel} disabled={saving}>Cancel <Kbd>Esc</Kbd></Btn>
          <Btn kind="primary" disabled={!ok || saving} onClick={() => onConfirm(reason.trim())}>{saving ? "Saving…" : "Confirm & save"}</Btn>
        </div>
      </div>
    </div>, document.body);
}

/* ── type list row ─────────────────────────────────────────────────────── */
function TypeRow({ t, active, label, onPick }) {
  const CI = CAT_ICON[t.category] || FaIcons.FaClipboardList;
  return (
    <button type="button" onClick={() => onPick(t.key)} className={`w-full text-left px-3 py-2 border-b border-[#eef1f8] last:border-0 flex items-start gap-2.5 ${active ? "bg-[#e8edf7] border-l-[3px] border-l-[#1a56db]" : "hover:bg-[#f4f7fc]"}`}>
      <span className={`mt-0.5 w-[24px] h-[24px] rounded-[5px] flex items-center justify-center shrink-0 ${active ? "bg-[#1a56db] text-white" : "bg-[#eef2fa] text-[#5b6b85]"}`}><CI size={11} /></span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-semibold truncate ${active ? "text-[#1a56db]" : "text-[#1e293b]"}`}>{label}</span>
        <span className="text-[11px] text-[#5b6b85] flex items-center gap-1.5 mt-0.5 flex-wrap">
          {t.category} · {t.columns.length} fields
          {t.key === NEW_KEY ? <Pill tone="amber">Unsaved</Pill> : t.isCustom ? <Pill tone="blue">Custom</Pill> : t.isCustomized ? <Pill tone="blue">Rev {t.revision || 2}</Pill> : null}
        </span>
      </span>
    </button>
  );
}

/* ═══════════════════════════════ MAIN ════════════════════════════════════ */
export default function LogbookTypesModal({ types, onClose, onSaved }) {
  const [sel, setSel] = useState(types[0]?.key || "");
  const [newType, setNewType] = useState(null);
  const [roleOpts, setRoleOpts] = useState([]);
  const [draft, setDraftState] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("design");
  const [selId, setSelId] = useState(null);
  const [drag, setDrag] = useState({ idx: null, pal: null });
  const [ind, setInd] = useState(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const fileRef = useRef(null);
  const draftRef = useRef(null);
  const hist = useRef({ past: [], future: [], t: 0 });
  const act = useRef({});

  const list = useMemo(() => (newType ? [newType, ...types] : types), [types, newType]);
  const type = useMemo(() => list.find((t) => t.key === sel) || null, [list, sel]);
  const isNew = type?.key === NEW_KEY;
  const isCustom = !!type?.isCustom;
  const headerEditable = isNew || isCustom;
  const orig = useMemo(() => (type ? toDraft(type) : null), [type]);
  const lockedKeys = useMemo(() => (isNew || !type ? new Set() : new Set((type.columns || []).map((c) => c.key))), [type, isNew]);

  /* draft + undo/redo */
  const put = (n) => { draftRef.current = n; setDraftState(n); };
  const apply = useCallback((fn, merge = false) => {
    const p = draftRef.current; if (!p) return;
    const n = fn(p); if (n === p) return;
    const h = hist.current; const now = Date.now();
    if (!(merge && now - h.t < 800 && h.past.length)) { h.past.push(p); if (h.past.length > 60) h.past.shift(); }
    h.t = now; h.future = [];
    put(n);
  }, []);
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(draftRef.current); put(h.past.pop()); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(draftRef.current); put(h.future.pop()); };

  useEffect(() => { getRoleOptions().then((r) => setRoleOpts(r?.data || [])).catch(() => { }); }, []);
  useEffect(() => {
    if (!type) return;
    const d = toDraft(type);
    hist.current = { past: [], future: [], t: 0 };
    put(d);
    setSelId(d.columns[0]?._id || null);
    setEditing(isNew || isCustom || type.isCustomized);
    setTab("design");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isNew, isCustom]);

  const dirty = useMemo(() => !!orig && !!draft && sig(clean(draft)) !== sig(clean(orig)), [orig, draft]);
  const analysis = useMemo(() => (draft ? analyse(draft, { isNew, isCustom, roleOpts }) : null), [draft, isNew, isCustom, roleOpts]);

  const match = (t) => !q.trim() || t.key === NEW_KEY || `${t.name} ${t.category} ${t.refType}`.toLowerCase().includes(q.trim().toLowerCase());
  const standardGroup = list.filter((t) => !t.isCustom && match(t));
  const customGroup = list.filter((t) => t.isCustom && t.key !== NEW_KEY && match(t));

  /* guards */
  const safeClose = () => { if (dirty && !window.confirm("You have unsaved changes. Close and discard them?")) return; onClose(); };
  const pickType = (k) => { if (k === sel) return; if (dirty && !window.confirm("Discard unsaved changes to this type?")) return; if (newType && k !== NEW_KEY) setNewType(null); setSel(k); };
  const startNew = () => { if (dirty && !window.confirm("Discard unsaved changes to this type?")) return; setNewType(blankType()); setSel(NEW_KEY); };
  const cancelNew = () => { setNewType(null); setSel(types[0]?.key || ""); };

  /* column operations */
  const setD = (patch, merge) => apply((p) => ({ ...p, ...patch }), merge);
  const setCol = (id, patch, merge = false) => apply((p) => {
    const old = p.columns.find((c) => c._id === id); if (!old) return p;
    const next = tidy({ ...old, ...patch });
    if (patch.label !== undefined && old._auto && !lockedKeys.has(old.key)) {
      const nk = toKey(patch.label);
      if (nk) next.key = uniqueKey(nk, p.columns.filter((c) => c._id !== id));
    }
    let cols = p.columns.map((c) => (c._id === id ? next : c));
    let endTimeKey = p.endTimeKey;
    if (next.key !== old.key) {
      cols = cols.map((c) => (c.showIf?.field === old.key ? { ...c, showIf: { ...c.showIf, field: next.key } } : c));
      if (endTimeKey === old.key) endTimeKey = next.key;
    }
    if (old.type === "time" && next.type !== "time" && endTimeKey === old.key) endTimeKey = "";
    return { ...p, columns: cols, endTimeKey };
  }, merge);
  const insertItem = (at, item) => {
    const nc = buildCols(item, draftRef.current.columns);
    apply((p) => { const cols = [...p.columns]; cols.splice(Math.min(Math.max(at, 0), cols.length), 0, ...nc); return { ...p, columns: cols }; });
    setSelId(nc[0]._id);
  };
  const moveCol = (from, to) => apply((p) => {
    if (from == null || to == null || from === to || to === from + 1) return p;
    const cols = [...p.columns]; const [it] = cols.splice(from, 1); cols.splice(to > from ? to - 1 : to, 0, it);
    return { ...p, columns: cols };
  });
  const moveBy = (i, d) => apply((p) => {
    const j = i + d; if (j < 0 || j >= p.columns.length) return p;
    const cols = [...p.columns]; [cols[i], cols[j]] = [cols[j], cols[i]]; return { ...p, columns: cols };
  });
  const removeCol = (id) => {
    const cols = draftRef.current.columns; const i = cols.findIndex((c) => c._id === id); const c = cols[i]; if (!c) return;
    if (lockedKeys.has(c.key) && !window.confirm(`“${c.label}” already exists in saved entries.\n\nRemoving it hides it from the register; old data stays in the record. Continue?`)) return;
    apply((p) => ({ ...p, columns: p.columns.filter((x) => x._id !== id), endTimeKey: p.endTimeKey === c.key ? "" : p.endTimeKey }));
    setSelId((cols[i + 1] || cols[i - 1])?._id || null);
  };
  const dupCol = (id) => {
    const cols = draftRef.current.columns; const i = cols.findIndex((c) => c._id === id); const s = cols[i]; if (!s) return;
    const copy = { ...s, _id: uid(), _auto: true, label: `${s.label} (copy)`, key: uniqueKey(toKey(`${s.label} copy`), cols) };
    apply((p) => { const cc = [...p.columns]; cc.splice(i + 1, 0, copy); return { ...p, columns: cc }; });
    setSelId(copy._id);
  };
  const addFromPalette = (item) => { if (!editing) return; const i = draftRef.current.columns.findIndex((c) => c._id === selId); insertItem(i >= 0 ? i + 1 : draftRef.current.columns.length, item); };
  const removeSel = () => { if (selId) removeCol(selId); };

  /* drag & drop */
  const endDrag = () => { setDrag({ idx: null, pal: null }); setInd(null); };
  const onCardOver = (e, i, c) => {
    if (!editing) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = drag.pal ? "copy" : "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = spanOf(c) === 4 ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
    const pos = after ? "after" : "before";
    if (!ind || ind.i !== i || ind.pos !== pos) setInd({ i, pos });
  };
  const onCanvasDrop = (e) => {
    if (!editing) return; e.preventDefault();
    const len = draftRef.current.columns.length;
    const at = ind ? (ind.pos === "after" ? ind.i + 1 : ind.i) : len;
    const palId = e.dataTransfer.getData(PAL_MIME) || drag.pal;
    if (palId && ITEMS[palId]) insertItem(at, ITEMS[palId]); else if (drag.idx != null) moveCol(drag.idx, at);
    endDrag();
  };

  /* import / export / copy-from */
  const exportJson = () => {
    const d = clean(draft);
    const blob = new Blob([JSON.stringify({ format: "logbook-type/1", name: d.name, category: d.category, refType: d.refType, columns: d.columns }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${(d.name || type.key).replace(/\W+/g, "_")}.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  const importJson = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result));
        if (!Array.isArray(j.columns) || !j.columns.length) throw new Error("No fields found in this file.");
        if (draftRef.current.columns.length > 1 && !window.confirm("Replace the current fields with the imported ones?")) return;
        const cols = j.columns.map((c) => tidy({ ...c, _id: uid() }));
        apply((p) => ({ ...p, columns: cols })); setSelId(cols[0]._id);
        showToast({ icon: "success", title: `${cols.length} fields imported` });
      } catch (e) { alertError("Import failed", e.message); }
    };
    r.readAsText(file); if (fileRef.current) fileRef.current.value = "";
  };
  const copyFrom = (k) => {
    const src = types.find((t) => t.key === k); if (!src) return;
    if (draftRef.current.columns.length > 1 && !window.confirm(`Replace current fields with the fields of “${src.name}”?`)) return;
    const cols = (src.columns || []).map((c) => ({ ...c, _id: uid() }));
    apply((p) => ({ ...p, columns: cols, endTimeKey: src.endTimeKey || "", ...(p.refType === "general" ? { refType: src.refType } : {}) })); setSelId(cols[0]?._id || null);
  };

  /* save / reset */
  const buildPayload = (reason) => {
    const d = clean(draft);
    return { ...d, endTimeKey: d.endTimeKey || null, lateAfterMinutes: Number(d.lateAfterMinutes) || 30, changeReason: reason || undefined };
  };
  const doSave = async (reason) => {
    setSaving(true);
    try {
      const res = isNew ? await createLogbookType(buildPayload("")) : await saveLogbookType(type.key, buildPayload(reason));
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: isNew ? `Type "${draft.name}" created` : `${type.name} saved` });
      setReasonOpen(false);
      if (isNew) { setNewType(null); setSel(res?.typeKey || ""); }
      onSaved?.();
    } catch (e) { alertError("Save failed", e?.message || "Could not save."); }
    finally { setSaving(false); }
  };
  const requestSave = () => {
    if (!draft || !editing || saving) return;
    if (analysis.errors.length) { setTab("check"); alertError("Fix these before saving", analysis.errors.slice(0, 4).map((e) => e.t).join("\n")); return; }
    if (isNew) doSave(""); else if (dirty) setReasonOpen(true);
  };
  const resetOrDelete = async () => {
    const msg = isCustom ? `Delete custom type "${type.name}"? Only possible if no register uses it.` : `Reset "${type.name}" to the standard definition for this company?`;
    if (!window.confirm(msg)) return;
    setSaving(true);
    try {
      const res = await resetLogbookType(type.key);
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: isCustom ? "Custom type deleted" : "Standard definition restored" });
      if (isCustom) setSel(types.find((t) => !t.isCustom)?.key || "");
      onSaved?.();
    } catch (e) { alertError(isCustom ? "Delete failed" : "Reset failed", e?.message || "Could not complete."); }
    finally { setSaving(false); }
  };

  /* keyboard: Ctrl+S save · Ctrl+Z / Ctrl+Y undo/redo · Del remove field */
  act.current = { requestSave, undo, redo, removeSel, editing, tab, reasonOpen };
  useEffect(() => {
    const h = (e) => {
      const a = act.current; if (a.reasonOpen || !a.editing) return;
      const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      const inField = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "");
      if (mod && k === "s") { e.preventDefault(); a.requestSave(); }
      else if (mod && k === "z" && !inField) { e.preventDefault(); e.shiftKey ? a.redo() : a.undo(); }
      else if (mod && k === "y" && !inField) { e.preventDefault(); a.redo(); }
      else if (e.key === "Delete" && !inField && a.tab === "design") a.removeSel();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* derived for render */
  const cols = draft?.columns || [];
  const selIdx = cols.findIndex((c) => c._id === selId);
  const selCol = selIdx >= 0 ? cols[selIdx] : null;
  const timeCols = cols.filter((c) => c.type === "time");
  const rev = type?.revision || 1;
  const nErr = analysis?.errors.length || 0; const nWarn = analysis?.warns.length || 0;
  const TABS = [
    { k: "design", l: "Design", i: FaIcons.FaPencilRuler || FaIcons.FaPen },
    { k: "details", l: "Details & workflow", i: FaIcons.FaSlidersH },
    { k: "preview", l: "Preview", i: FaIcons.FaEye },
    { k: "check", l: "Compliance check", i: FaIcons.FaShieldAlt, badge: nErr || nWarn || 0, bad: nErr > 0 },
  ];

  return (
    <Modal title="Logbook Types" subtitle="Design the entry form, verification workflow and access for every logbook in this company." icon={FaIcons.FaListAlt} width="max-w-[1400px] w-[98vw]" onClose={safeClose}
      footer={<>
        <span className="text-[11.5px] text-[#5b6b85]">
          {isNew ? "New type — not saved yet" : !editing ? "Standard definition in use" : dirty ? <b className="text-amber-600">Unsaved changes</b> : isCustom ? "Company-defined type" : type?.isCustomized ? `Customised for this company · Rev ${rev}` : "No changes"}
          {editing && <span className="ml-3 hidden md:inline text-[#94a3b8]">Ctrl+S save · Ctrl+Z undo · Del remove field</span>}
        </span>
        <div className="ml-auto flex gap-2">
          {isNew && <Btn onClick={cancelNew} disabled={saving}>Discard new type</Btn>}
          {!isNew && (isCustom || type?.isCustomized) && <Btn kind="danger" onClick={resetOrDelete} disabled={saving}>{isCustom ? "Delete type" : "Reset to standard"}</Btn>}
          <Btn onClick={safeClose} disabled={saving}>Close <Kbd>Esc</Kbd></Btn>
          {editing && <Btn kind="primary" onClick={requestSave} disabled={(!dirty && !isNew) || saving}><FaIcons.FaSave size={11} /> {saving ? "Saving…" : isNew ? "Create type" : "Review & save"}</Btn>}
        </div>
      </>}>
      <div className="flex flex-col lg:grid lg:grid-cols-[250px_minmax(0,1fr)] gap-[10px]">
        {/* ── left: type list ── */}
        <div className={`${erp.card} flex flex-col overflow-hidden lg:self-start`}>
          <div className="flex items-center gap-[6px] p-[8px] border-b border-[#dde1ea] bg-[#f4f7fc]">
            <SearchBox value={q} onChange={setQ} placeholder="Search type" className="flex-1" />
            <Btn kind="primary" className="!h-[30px] !px-[10px]" onClick={startNew} disabled={!!newType} title="Create a company-defined type"><FaIcons.FaPlus size={10} /> New</Btn>
          </div>
          <div className="max-h-[220px] lg:max-h-[72vh] overflow-y-auto">
            {newType && <TypeRow t={newType} active={sel === NEW_KEY} label={draft && sel === NEW_KEY ? (draft.name || "New type…") : "New type…"} onPick={pickType} />}
            {customGroup.length > 0 && <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] bg-[#f4f7fc] border-b border-[#eef1f8]">Company types · {customGroup.length}</div>}
            {customGroup.map((t) => <TypeRow key={t.key} t={t} active={sel === t.key} label={t.name} onPick={pickType} />)}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] bg-[#f4f7fc] border-b border-[#eef1f8]">Standard types · {standardGroup.length}</div>
            {standardGroup.map((t) => <TypeRow key={t.key} t={t} active={sel === t.key} label={t.name} onPick={pickType} />)}
            {standardGroup.length + customGroup.length === 0 && !newType && <div className="px-3 py-4 text-[12px] text-[#94a3b8] text-center">No type matches "{q}"</div>}
          </div>
        </div>

        {/* ── right: builder ── */}
        {type && draft && (
          <div className="min-w-0 flex flex-col gap-[10px]">
            {/* header card */}
            <div className={`${erp.card} overflow-hidden`}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#0f2a5c] via-[#16418f] to-[#1a56db] text-white">
                <span className="w-[38px] h-[38px] rounded-[8px] bg-white/15 flex items-center justify-center shrink-0">{(() => { const CI = CAT_ICON[draft.category] || FaIcons.FaClipboardList; return <CI size={17} />; })()}</span>
                <div className="min-w-0">
                  <div className="text-[16px] font-bold leading-tight truncate">{isNew ? (draft.name || "New logbook type") : type.name}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-white/15">{draft.category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/15">Issued against {draft.refType}</span>
                    {!isNew && <span className="px-2 py-0.5 rounded-full bg-white/15">Rev {rev}</span>}
                    {draft.docNo && <span className="px-2 py-0.5 rounded-full bg-white/15">{draft.docNo}</span>}
                    {draft.sopRef && <span className="px-2 py-0.5 rounded-full bg-white/15">SOP {draft.sopRef}</span>}
                    {!editing && <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-[#3b2a00] font-semibold">Standard · read-only</span>}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {editing && <>
                    <button type="button" onClick={undo} disabled={!hist.current.past.length} title="Undo (Ctrl+Z)" className="h-[30px] w-[30px] rounded-[5px] bg-white/15 hover:bg-white/25 disabled:opacity-35 flex items-center justify-center"><FaIcons.FaUndo size={11} /></button>
                    <button type="button" onClick={redo} disabled={!hist.current.future.length} title="Redo (Ctrl+Y)" className="h-[30px] w-[30px] rounded-[5px] bg-white/15 hover:bg-white/25 disabled:opacity-35 flex items-center justify-center"><FaIcons.FaRedo size={11} /></button>
                  </>}
                  {!editing && <button type="button" onClick={() => setEditing(true)} className="h-[32px] px-3 rounded-[5px] bg-white text-[#16418f] text-[12.5px] font-bold hover:bg-[#eef3ff] flex items-center gap-2"><FaIcons.FaPen size={10} /> Customise for this company</button>}
                </div>
              </div>
              <div className={erp.tabBar}>
                {TABS.map((t) => (
                  <button key={t.k} type="button" onClick={() => setTab(t.k)} className={`${erp.tab} ${tab === t.k ? erp.tabOn : erp.tabOff}`}>
                    <t.i size={11} /> {t.l}
                    {t.badge > 0 && <span className={`ml-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9.5px] font-bold flex items-center justify-center text-white ${t.bad ? "bg-[#dc2626]" : "bg-amber-500"}`}>{t.badge}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ═════ DESIGN ═════ */}
            {tab === "design" && (
              <div className="grid xl:grid-cols-[minmax(0,1fr)_310px] gap-[10px] items-start">
                <div className="min-w-0 flex flex-col gap-[10px]">
                  {editing && (
                    <Panel title="Field library" icon={FaIcons.FaThLarge} bodyClass="p-3 flex flex-col gap-2.5"
                      right={<span className="text-[11px] text-[#5b6b85] hidden md:inline">Drag onto the form · or click to add after the selected field</span>}>
                      {PALETTE.map((g) => (
                        <div key={g.group} className="flex flex-wrap items-center gap-1.5">
                          <span className="w-[88px] text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85]">{g.group}</span>
                          {g.items.map((p) => (
                            <button key={p.id} type="button" draggable onClick={() => addFromPalette(p)}
                              onDragStart={(e) => { e.dataTransfer.setData(PAL_MIME, p.id); e.dataTransfer.effectAllowed = "copy"; setDrag({ idx: null, pal: p.id }); }} onDragEnd={endDrag}
                              className="inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-[5px] border-[1.5px] border-[#d5dcea] bg-white text-[12px] font-semibold text-[#1e293b] cursor-grab active:cursor-grabbing hover:border-[#1a56db] hover:text-[#1a56db] hover:bg-[#f4f8ff] select-none">
                              <p.icon size={11} /> {p.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </Panel>
                  )}

                  <Panel title="Entry form layout" icon={FaIcons.FaThList} bodyClass="p-0"
                    right={<>
                      <span className="text-[11px] text-[#5b6b85]">{cols.length} field{cols.length === 1 ? "" : "s"}</span>
                      {editing && isNew && (
                        <select className={`${inputS} !w-[170px] !h-[26px]`} value="" onChange={(e) => e.target.value && copyFrom(e.target.value)}>
                          <option value="">Copy fields from…</option>
                          {types.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                        </select>
                      )}
                      <Btn className="!h-[26px] !px-[8px] !text-[11.5px]" onClick={exportJson} title="Download field definition as JSON"><FaIcons.FaFileExport size={10} /> Export</Btn>
                      {editing && <Btn className="!h-[26px] !px-[8px] !text-[11.5px]" onClick={() => fileRef.current?.click()} title="Load fields from a JSON file"><FaIcons.FaFileImport size={10} /> Import</Btn>}
                      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
                    </>}>
                    <div className="px-3 py-1.5 border-b border-[#eef1f8] bg-[#fbfcfe] flex flex-wrap items-center gap-1.5 text-[11px] text-[#5b6b85]">
                      <FaIcons.FaLock size={9} /> Always added by the system:
                      {["Sr", "Date-time", "Done by", "Verified by", "Status"].map((s) => <span key={s} className="px-1.5 py-0.5 rounded bg-[#eef2fa] text-[#64748b] font-medium">{s}</span>)}
                    </div>
                    <div className="p-3 grid grid-cols-4 gap-2.5 min-h-[160px] bg-[#f7f9fd] bg-[radial-gradient(#dbe3f0_1px,transparent_1px)] [background-size:14px_14px]"
                      onDragOver={(e) => { if (editing) e.preventDefault(); }} onDrop={onCanvasDrop}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInd(null); }}>
                      {cols.map((c, i) => {
                        const on = c._id === selId; const locked = lockedKeys.has(c.key);
                        const vert = spanOf(c) === 4;
                        const mark = ind && ind.i === i && drag.idx !== i ? (ind.pos === "after" ? (vert ? "[box-shadow:0_4px_0_0_#1a56db]" : "[box-shadow:5px_0_0_0_#1a56db]") : (vert ? "[box-shadow:0_-4px_0_0_#1a56db]" : "[box-shadow:-5px_0_0_0_#1a56db]")) : "";
                        return (
                          <div key={c._id} draggable={editing} onClick={() => setSelId(c._id)}
                            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.key); setDrag({ idx: i, pal: null }); }} onDragEnd={endDrag}
                            onDragOver={(e) => onCardOver(e, i, c)}
                            className={`group relative rounded-[7px] border-[1.5px] bg-white p-2.5 transition-colors ${editing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${SPAN[spanOf(c)]} ${on ? "border-[#1a56db] ring-[3px] ring-[#1a56db]/15" : "border-[#d5dcea] hover:border-[#9fb3d6]"} ${drag.idx === i ? "opacity-40" : ""} ${mark}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <TypeChip type={c.type} size={20} />
                              <span className="text-[12.5px] font-semibold text-[#0f172a] truncate">{c.label || <i className="text-[#94a3b8]">Untitled</i>}</span>
                              {c.required && <span className="text-[#dc2626] text-[13px] leading-none -ml-1">*</span>}
                              {editing && <FaIcons.FaGripVertical size={11} className="ml-auto text-[#b6c2d8] group-hover:text-[#1a56db] shrink-0" />}
                            </div>
                            <Faux c={c} />
                            <div className="flex flex-wrap items-center gap-1 mt-1.5 text-[10.5px]">
                              <span className="font-mono text-[#94a3b8]">{c.key}</span>
                              {locked && <span title="Saved field — key & type locked" className="text-[#94a3b8]"><FaIcons.FaLock size={8} /></span>}
                              {c.showIf?.field && <span title={`Shown if ${c.showIf.field} ${c.showIf.notEquals != null ? "is not" : "is"} ${c.showIf.equals ?? c.showIf.notEquals ?? "…"}`} className="inline-flex items-center gap-1 px-1.5 rounded bg-sky-50 text-sky-700 font-semibold"><FaIcons.FaCodeBranch size={8} />if {c.showIf.field}</span>}
                              {limitText(c) && <span className="px-1.5 rounded bg-amber-50 text-amber-700 font-semibold">{limitText(c)}</span>}
                            </div>
                            {editing && on && (
                              <div className="absolute -top-2.5 right-2 flex items-center gap-0.5 rounded-[5px] bg-[#1a56db] text-white shadow px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                <button type="button" title="Move earlier" disabled={i === 0} onClick={() => moveBy(i, -1)} className="p-1 disabled:opacity-30"><FaIcons.FaChevronLeft size={9} /></button>
                                <button type="button" title="Move later" disabled={i === cols.length - 1} onClick={() => moveBy(i, 1)} className="p-1 disabled:opacity-30"><FaIcons.FaChevronRight size={9} /></button>
                                <button type="button" title="Duplicate" onClick={() => dupCol(c._id)} className="p-1"><FaIcons.FaCopy size={9} /></button>
                                <button type="button" title="Remove" onClick={() => removeCol(c._id)} className="p-1 hover:text-red-200"><FaIcons.FaTrash size={9} /></button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {editing && (
                        <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!ind || ind.i !== cols.length) setInd({ i: cols.length, pos: "before" }); }}
                          className={`col-span-4 rounded-[7px] border-2 border-dashed px-3 py-4 text-center text-[12px] transition-colors ${ind && ind.i === cols.length ? "border-[#1a56db] bg-[#e8f0ff] text-[#1a56db]" : "border-[#c8d4e8] text-[#7b8aa5]"}`}>
                          {cols.length ? "Drop here to add at the end" : "This form is empty — drag a field from the library, or click one to add it"}
                        </div>
                      )}
                    </div>
                  </Panel>
                  {editing && <div className="text-[11.5px] text-[#5b6b85] px-1">Removing a field never deletes old entries — their data stays in the record. Keys and types of saved fields are locked so earlier entries stay readable.</div>}
                </div>

                <div className="xl:sticky xl:top-2">
                  <Panel title="Field properties" icon={FaIcons.FaSlidersH} bodyClass="p-0">
                    <Inspector col={selCol} cols={cols} editing={editing} locked={selCol ? lockedKeys.has(selCol.key) : false}
                      onPatch={(patch, merge) => selCol && setCol(selCol._id, patch, merge)} onRemove={() => selCol && removeCol(selCol._id)} onDuplicate={() => selCol && dupCol(selCol._id)} />
                  </Panel>
                </div>
              </div>
            )}

            {/* ═════ DETAILS & WORKFLOW ═════ */}
            {tab === "details" && (
              <div className="grid lg:grid-cols-2 gap-[10px] items-start">
                <Panel title="Document control" icon={FaIcons.FaFileAlt} bodyClass="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Type name" required className="sm:col-span-2">
                    <input className={erp.input} disabled={!editing || !headerEditable} value={draft.name} placeholder="e.g. Cold room temperature log" onChange={(e) => setD({ name: e.target.value }, true)} />
                  </Field>
                  <Field label="Category">
                    <select className={erp.input} disabled={!editing || !headerEditable} value={draft.category} onChange={(e) => setD({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                  </Field>
                  <Field label="Register issued against" required>
                    <select className={erp.input} disabled={!editing || !isNew} value={draft.refType} onChange={(e) => setD({ refType: e.target.value })}>{REF_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
                  </Field>
                  <Field label="Document / format No."><input className={erp.input} disabled={!editing} value={draft.docNo} placeholder="e.g. QA/FRM/014" onChange={(e) => setD({ docNo: e.target.value }, true)} /></Field>
                  <Field label="SOP reference"><input className={erp.input} disabled={!editing} value={draft.sopRef} placeholder="e.g. SOP/QA/021" onChange={(e) => setD({ sopRef: e.target.value }, true)} /></Field>
                  <Field label="Purpose / instructions" className="sm:col-span-2">
                    <textarea rows={3} className={`${erp.input} !h-auto py-1.5`} disabled={!editing} value={draft.description} placeholder="Short description of what this logbook records and when." onChange={(e) => setD({ description: e.target.value }, true)} />
                  </Field>
                  {!isNew && (
                    <div className="sm:col-span-2 rounded-[6px] bg-[#f4f7fc] border border-[#e3e9f4] px-3 py-2 text-[12px] text-[#475569] flex items-center gap-2">
                      <FaIcons.FaHistory className="text-[#1a56db]" />
                      <span><b>Revision {rev}</b>{type.lastChangeReason ? <> — last change: “{type.lastChangeReason}”</> : " — standard definition"}</span>
                    </div>
                  )}
                </Panel>

                <div className="flex flex-col gap-[10px]">
                  <Panel title="Entry & signature" icon={FaIcons.FaSignature || FaIcons.FaPen} bodyClass="p-3.5 flex flex-col gap-3.5">
                    <Toggle checked={draft.entrySign} disabled={!editing} onChange={(v) => setD({ entrySign: v })} label="e-Signature on every entry" hint="Operator confirms each entry by typing their name; name, role and time are stored." />
                    <Toggle checked={draft.verifyRequired} disabled={!editing} onChange={(v) => setD({ verifyRequired: v })} label="Second-person verification" hint="Entries stay “Entered” until a different person verifies and e-signs. The author can never verify their own entry." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#eef1f8]">
                      <Field label="Late-entry check on">
                        <select className={erp.input} disabled={!editing} value={draft.endTimeKey} onChange={(e) => setD({ endTimeKey: e.target.value })}>
                          <option value="">Off</option>
                          {timeCols.map((c) => <option key={c._id} value={c.key}>{c.label} ({c.key})</option>)}
                        </select>
                      </Field>
                      <Field label="Flag as late after (minutes)">
                        <input type="number" min={1} max={1440} className={erp.input} disabled={!editing || !draft.endTimeKey} value={draft.lateAfterMinutes} onChange={(e) => setD({ lateAfterMinutes: e.target.value === "" ? "" : Number(e.target.value) }, true)} />
                      </Field>
                      <div className="sm:col-span-2 text-[11.5px] text-[#5b6b85] -mt-1">Entries recorded later than this after the selected time are marked “late entry” in the register and reports.</div>
                    </div>
                  </Panel>
                  <Panel title="Access control" icon={FaIcons.FaUsers} bodyClass="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Who can add entries"><RolePicker value={draft.entryRoles} options={roleOpts} disabled={!editing} onChange={(v) => setD({ entryRoles: v })} /></Field>
                    <Field label="Who can verify"><RolePicker value={draft.verifyRoles} options={roleOpts} disabled={!editing || !draft.verifyRequired} onChange={(v) => setD({ verifyRoles: v })} /></Field>
                  </Panel>
                </div>
              </div>
            )}

            {/* ═════ PREVIEW ═════ */}
            {tab === "preview" && (
              <Panel title="Entry form preview" icon={FaIcons.FaEye} bodyClass="p-0"
                right={<span className="text-[11px] text-[#5b6b85]">Nothing here is saved</span>}>
                <PreviewForm columns={cols} />
              </Panel>
            )}

            {/* ═════ COMPLIANCE CHECK ═════ */}
            {tab === "check" && analysis && (
              <Panel title="Compliance check · ALCOA+" icon={FaIcons.FaShieldAlt} bodyClass="p-3.5 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2.5">
                  {[["Blocking", nErr, "text-[#dc2626] bg-red-50 border-red-200"], ["Warnings", nWarn, "text-amber-600 bg-amber-50 border-amber-200"], ["Passed", analysis.oks.length, "text-emerald-600 bg-emerald-50 border-emerald-200"]].map(([l, n, c]) => (
                    <div key={l} className={`rounded-[7px] border px-3 py-2 ${c}`}><div className="text-[22px] font-bold leading-none">{n}</div><div className="text-[11px] font-semibold mt-1">{l}</div></div>
                  ))}
                </div>
                <div className="rounded-[7px] border border-[#e3e9f4] divide-y divide-[#eef1f8]">
                  {[["errors", FaIcons.FaTimesCircle, "text-[#dc2626]"], ["warns", FaIcons.FaExclamationTriangle, "text-amber-500"], ["infos", FaIcons.FaInfoCircle, "text-[#1a56db]"], ["oks", FaIcons.FaCheckCircle, "text-emerald-500"]].flatMap(([k, I, cls]) =>
                    analysis[k].map((r, i) => (
                      <div key={`${k}${i}`} className="flex items-start gap-2.5 px-3 py-2 text-[12.5px] text-[#1e293b]">
                        <I size={13} className={`mt-0.5 shrink-0 ${cls}`} />
                        <span className="flex-1">{r.t}</span>
                        {r.tag && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#eef2fa] text-[#5b6b85] whitespace-nowrap">{r.tag}</span>}
                      </div>
                    )))}
                </div>
                <div className="text-[11.5px] text-[#64748b]">Guidance against ALCOA+ data-integrity principles (attributable, legible, contemporaneous, original, accurate, complete). Blocking items must be fixed before saving; warnings are for your QA to judge. This is not a substitute for your validation and change-control process.</div>
              </Panel>
            )}
          </div>
        )}
      </div>

      {reasonOpen && <ReasonDialog diff={diffSummary(orig, draft)} rev={rev} saving={saving} onCancel={() => setReasonOpen(false)} onConfirm={doSave} />}
    </Modal>
  );
}
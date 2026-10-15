import * as FaIcons from "react-icons/fa";

/* ═══════════════════════════════════════════════════════════════════════
   Logbook template designer — data model (no React here)
   ═══════════════════════════════════════════════════════════════════════ */

export const REF_TYPES = ["equipment", "instrument", "area", "general"];
export const CATEGORIES = ["Equipment", "Instrument", "Area", "General"];
export const SOURCES = ["product", "personnel", "equipment", "instrument", "area"];
export const SRC_LABEL = { product: "Product", personnel: "Personnel", equipment: "Equipment", instrument: "Instrument", area: "Area" };
export const NEW_KEY = "__new__";
export const PAL_MIME = "application/x-logbook-palette";
export const SPAN = { 1: "col-span-4 md:col-span-1", 2: "col-span-4 md:col-span-2", 3: "col-span-4 md:col-span-3", 4: "col-span-4" };
export const spanOf = (c) => c.span || (c.type === "textarea" ? 2 : 1);

/** Template lifecycle — label + pill tone (LogbookUi Pill) */
export const TPL_STATUS = {
  Draft: { l: "Draft", tone: "amber" },
  InReview: { l: "In review", tone: "blue" },
  Effective: { l: "Effective", tone: "green" },
  Superseded: { l: "Superseded", tone: "gray" },
  Discarded: { l: "Discarded", tone: "gray" },
  Retired: { l: "Retired", tone: "red" },
};

export const TYPE_META = {
  text: { label: "Text", icon: FaIcons.FaFont, color: "#475569" },
  textarea: { label: "Long text", icon: FaIcons.FaAlignLeft, color: "#475569" },
  number: { label: "Number", icon: FaIcons.FaHashtag, color: "#0e7490" },
  select: { label: "Dropdown", icon: FaIcons.FaListUl, color: "#7c3aed" },
  time: { label: "Time", icon: FaIcons.FaClock, color: "#d97706" },
  date: { label: "Date", icon: FaIcons.FaCalendarAlt, color: "#059669" },
};
export const CAT_ICON = { Equipment: FaIcons.FaCogs, Instrument: FaIcons.FaMicroscope, Area: FaIcons.FaMapMarkerAlt, General: FaIcons.FaClipboardList };

/** Field library. `make()` returns one or more column templates. "@prev" = first column inserted by the same block. */
export const PALETTE = [
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
  { group: "GMP blocks", items: [
    { id: "b_batch", label: "Batch No.", icon: FaIcons.FaBarcode, make: () => [{ label: "Batch No.", type: "text", required: true }] },
    { id: "b_range", label: "Start + End time", icon: FaIcons.FaHourglassHalf, make: () => [
      { label: "Start", type: "time", required: true }, { label: "End", type: "time", required: true, afterField: "@prev" }] },
    { id: "b_limit", label: "Within limit + action", icon: FaIcons.FaExclamationTriangle, make: () => [
      { label: "Within limit", type: "select", options: ["Yes", "No"], required: true },
      { label: "Action taken", type: "text", required: true, showIf: { field: "@prev", equals: "No" } }] },
    { id: "b_reading", label: "Reading with limits", icon: FaIcons.FaThermometerHalf, make: () => [
      { label: "Temperature", type: "number", unit: "°C", min: 2, max: 8, required: true }] },
    { id: "b_remarks", label: "Remarks", icon: FaIcons.FaCommentDots, make: () => [{ label: "Remarks", type: "text" }] },
  ] },
];
export const ITEMS = Object.fromEntries(PALETTE.flatMap((g) => g.items).map((i) => [i.id, i]));

/* ── helpers ───────────────────────────────────────────────────────────── */
export const sig = (o) => JSON.stringify(o);
export const uid = (() => { let n = 0; return () => `c${Date.now().toString(36)}${(n++).toString(36)}`; })();
export const toKey = (label) => {
  const k = String(label || "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return /^[A-Za-z]/.test(k) ? k.slice(0, 50) : k ? `F${k}`.slice(0, 50) : "";
};
export const uniqueKey = (base, cols) => {
  const used = new Set(cols.map((c) => c.key));
  let k = base || "Field"; let n = 2;
  while (used.has(k)) k = `${base || "Field"}${n++}`;
  return k;
};
/** Drop properties that do not apply to the column's type */
export const tidy = (c) => {
  const o = { ...c };
  Object.keys(o).forEach((k) => { if (o[k] === undefined || (o[k] === "" && k !== "label" && k !== "key")) delete o[k]; });
  if (!o.required) delete o.required;
  if (o.type !== "select") { delete o.options; delete o.source; }
  if (o.source) delete o.options;
  if (o.type !== "number") { delete o.min; delete o.max; delete o.unit; }
  if (o.type !== "time" && o.type !== "date") delete o.afterField;
  if (o.min !== undefined && Number.isNaN(Number(o.min))) delete o.min;
  if (o.max !== undefined && Number.isNaN(Number(o.max))) delete o.max;
  if (o.showIf && !o.showIf.field) delete o.showIf;
  if (o.span === (o.type === "textarea" ? 2 : 1)) delete o.span;
  return o;
};

/** API definition ⇄ editable draft (columns get a stable _id for React + drag & drop) */
export const toDraft = (d = {}) => ({
  name: d.name || "", category: d.category || "General", refType: d.refType || "general",
  entrySign: !!d.entrySign, endTimeKey: d.endTimeKey || "", lateAfterMinutes: d.lateAfterMinutes || 30,
  docNo: d.docNo || "", sopRef: d.sopRef || "", description: d.description || "",
  verifyRequired: !!d.verifyRequired, entryRoles: [...(d.entryRoles || [])], verifyRoles: [...(d.verifyRoles || [])],
  columns: (d.columns || []).map((c) => ({ ...c, _id: uid() })),
});
export const toDefinition = (d) => ({
  ...d,
  endTimeKey: d.endTimeKey || null,
  lateAfterMinutes: Number(d.lateAfterMinutes) || 30,
  verifyRoles: d.verifyRequired ? d.verifyRoles : [],
  columns: d.columns.map(({ _id, _auto, ...c }) => tidy(c)),
});
export const blankDefinition = () => ({
  name: "", category: "General", refType: "general", entrySign: true, endTimeKey: null, lateAfterMinutes: 30,
  verifyRequired: true, entryRoles: [], verifyRoles: [], docNo: "", sopRef: "", description: "",
  columns: [{ key: "Remarks", label: "Remarks", type: "text" }],
});
/** Comparable signature of a draft (ignores _id / _auto / property order inside a column) */
export const draftSig = (d) => (d ? sig(toDefinition(d)) : "");

export const buildCols = (item, existing) => {
  const out = []; const all = [...existing];
  item.make().forEach((p) => {
    const col = { ...p, _id: uid(), _auto: true };
    col.key = uniqueKey(toKey(col.label), all);
    all.push(col); out.push(col);
  });
  out.forEach((c) => {
    if (c.showIf?.field === "@prev") c.showIf = { ...c.showIf, field: out[0].key };
    if (c.afterField === "@prev") c.afterField = out[0].key;
  });
  return out;
};
export const limitText = (c) => (c.min != null || c.max != null ? `${c.min ?? "…"}–${c.max ?? "…"}${c.unit ? ` ${c.unit}` : ""}` : "");

/* ── diff between two definitions (approval screen, history compare) ───── */
const yn = (v) => (v === true ? "Yes" : v === false ? "No" : v === null || v === "" || v === undefined ? "—" : String(v));
const FIELD_LABEL = { name: "Name", category: "Category", refType: "Issued against", docNo: "Document No.", sopRef: "SOP reference", description: "Purpose", entrySign: "e-Sign every entry", endTimeKey: "Late-entry field", lateAfterMinutes: "Late after (min)", verifyRequired: "Verification required" };
const COL_PROPS = { label: "label", type: "type", required: "mandatory", options: "options", source: "master list", unit: "unit", min: "min", max: "max", showIf: "show-if", afterField: "must not be before", helpText: "help text", span: "width" };
const fmtProp = (v) => (Array.isArray(v) ? v.join(", ") : v && typeof v === "object" ? `${v.field} ${v.notEquals != null ? "≠" : "="} ${v.equals ?? v.notEquals}` : yn(v));

/** a / b are API definitions (or null). Returns [{ k: add|mod|del, t }] */
export function diffDefinitions(a, b) {
  const out = [];
  const A = a || { columns: [] }; const B = b || { columns: [] };
  const ak = new Map(A.columns.map((c) => [c.key, c])); const bk = new Map(B.columns.map((c) => [c.key, c]));
  B.columns.forEach((c) => {
    const o = ak.get(c.key);
    if (!o) { out.push({ k: "add", t: `Added field “${c.label}” (${c.key}, ${c.type}${c.required ? ", mandatory" : ""})` }); return; }
    const ch = Object.keys(COL_PROPS).filter((p) => sig(o[p] ?? null) !== sig(c[p] ?? null))
      .map((p) => `${COL_PROPS[p]}: ${fmtProp(o[p])} → ${fmtProp(c[p])}`);
    if (ch.length) out.push({ k: "mod", t: `Field “${c.label}”: ${ch.join("; ")}` });
  });
  A.columns.forEach((c) => { if (!bk.has(c.key)) out.push({ k: "del", t: `Removed field “${c.label}” (${c.key}) — old entries keep their data` }); });
  const common = (x, y) => x.columns.map((c) => c.key).filter((k) => (x === A ? bk : ak).has(k)).join();
  if (a && common(A, B) !== common(B, A)) out.push({ k: "mod", t: "Field order changed" });
  if (a) {
    Object.keys(FIELD_LABEL).forEach((k) => { if (sig(A[k] ?? null) !== sig(B[k] ?? null)) out.push({ k: "mod", t: `${FIELD_LABEL[k]}: ${yn(A[k])} → ${yn(B[k])}` }); });
    const roles = (r) => (r || []).join(", ") || "any user";
    if (sig(A.entryRoles) !== sig(B.entryRoles)) out.push({ k: "mod", t: `Who can add entries: ${roles(A.entryRoles)} → ${roles(B.entryRoles)}` });
    if (sig(A.verifyRoles) !== sig(B.verifyRoles)) out.push({ k: "mod", t: `Who can verify: ${roles(A.verifyRoles)} → ${roles(B.verifyRoles)}` });
  }
  return out;
}

/* ── GMP / ALCOA+ guidance. errors block saving; everything else is advice ── */
export function analyse(d, { roleOpts = [] } = {}) {
  const E = [], W = [], I = [], O = [];
  const cols = d.columns; const keys = new Set();
  const users = (r) => roleOpts.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
  if (!d.name.trim()) E.push({ t: "Template name is required." });
  if (!cols.length) E.push({ t: "Add at least one field." });
  cols.forEach((c, i) => {
    const nm = c.label || c.key || `Field ${i + 1}`;
    if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(c.key || "")) E.push({ t: `“${nm}”: key must start with a letter and contain only letters, numbers or _.`, id: c._id });
    if (keys.has(c.key)) E.push({ t: `Duplicate key “${c.key}”.`, id: c._id });
    keys.add(c.key);
    if (!String(c.label || "").trim()) E.push({ t: `Field ${i + 1} has no label.`, id: c._id });
    if (c.type === "select" && !c.source && !(c.options || []).length) E.push({ t: `Dropdown “${nm}” needs options or a master list.`, id: c._id });
    if (c.type === "number" && c.min != null && c.max != null && Number(c.min) > Number(c.max)) E.push({ t: `“${nm}”: minimum is greater than maximum.`, id: c._id });
    if (c.showIf?.field) {
      if (c.showIf.field === c.key || !cols.some((x) => x.key === c.showIf.field)) E.push({ t: `“${nm}”: “show if” points to a missing field.`, id: c._id });
      else if (c.showIf.equals == null && c.showIf.notEquals == null) E.push({ t: `“${nm}”: choose the value for “show if”.`, id: c._id });
    }
    if (c.afterField && !cols.some((x) => x.key === c.afterField && x.type === c.type && x.key !== c.key)) E.push({ t: `“${nm}”: “must not be before” points to a missing ${c.type} field.`, id: c._id });
  });
  if (d.endTimeKey && !cols.some((c) => c.key === d.endTimeKey && c.type === "time")) E.push({ t: "Late-entry field must be one of the time fields." });

  if (!cols.some((c) => c.required)) W.push({ t: "No mandatory fields — an operator could save a blank entry.", tag: "Complete" });
  else O.push({ t: `${cols.filter((c) => c.required).length} mandatory field(s) defined.`, tag: "Complete" });
  if (!cols.some((c) => c.type === "time")) W.push({ t: "No time field. Record the actual time of the activity.", tag: "Contemporaneous" });
  else if (!d.endTimeKey) W.push({ t: "Late-entry check is off. Choose a time field under Settings & workflow.", tag: "Contemporaneous" });
  else O.push({ t: `Late-entry check active on “${d.endTimeKey}” (> ${d.lateAfterMinutes || 30} min).`, tag: "Contemporaneous" });
  const timeCols = cols.filter((c) => c.type === "time");
  if (timeCols.length >= 2 && !timeCols.some((c) => c.afterField)) I.push({ t: "Two or more time fields but no “must not be before” rule — an end time earlier than the start time would be accepted.", tag: "Accurate" });
  if (!d.entrySign) W.push({ t: "e-Signature per entry is off — entries are attributed by login only.", tag: "Attributable" });
  else O.push({ t: "Every entry is e-signed (name, role, timestamp).", tag: "Attributable" });
  if (!d.verifyRequired) W.push({ t: "No second-person verification. Acceptable only for low-risk records.", tag: "Accurate" });
  else {
    O.push({ t: "Second-person verification required; self-verification is blocked.", tag: "Accurate" });
    if (!d.verifyRoles.length) W.push({ t: "Any user (except the author) can verify. Restrict to QA / Head roles.", tag: "Accurate" });
    if (d.entryRoles.some((r) => d.verifyRoles.map((x) => x.toLowerCase()).includes(r.toLowerCase()))) I.push({ t: "Same user group can enter and verify. The system still blocks the same person from doing both.", tag: "Accurate" });
  }
  [...new Set([...d.entryRoles, ...(d.verifyRequired ? d.verifyRoles : [])])].forEach((r) => { if (roleOpts.length && users(r) === 0) W.push({ t: `User group “${r}” has no active users.`, tag: "Access" }); });
  const noLimit = cols.filter((c) => c.type === "number" && c.min == null && c.max == null);
  if (noLimit.length) I.push({ t: `No limits set for: ${noLimit.map((c) => c.label).join(", ")}. Limits let the system flag out-of-limit readings.`, tag: "Accurate" });
  const limitNoAction = cols.some((c) => c.type === "number" && (c.min != null || c.max != null)) && !cols.some((c) => c.showIf?.field);
  if (limitNoAction) I.push({ t: "Readings have limits but no conditional “Action taken” field. Add the “Within limit + action” block.", tag: "Complete" });
  if (!d.docNo.trim() && !d.sopRef.trim()) W.push({ t: "Document No. / SOP reference not set. Controlled formats must be traceable to an SOP.", tag: "Traceability" });
  else O.push({ t: "Document control reference present.", tag: "Traceability" });
  if (!cols.some((c) => /remark|comment/i.test(`${c.key} ${c.label}`))) I.push({ t: "No remarks field. Operators need a place to explain deviations.", tag: "Complete" });
  return { errors: E, warns: W, infos: I, oks: O };
}

/** Export / import file format */
export const EXPORT_FORMAT = "logbook-template/2";

/** Colour theme per category — cards, headers, chips */
export const CAT_THEME = {
  Equipment: { from: "#4338ca", to: "#6366f1", soft: "#eef2ff", ring: "#c7d2fe", text: "#3730a3" },
  Instrument: { from: "#6d28d9", to: "#a855f7", soft: "#f5f3ff", ring: "#ddd6fe", text: "#5b21b6" },
  Area: { from: "#047857", to: "#14b8a6", soft: "#ecfdf5", ring: "#a7f3d0", text: "#065f46" },
  General: { from: "#c2410c", to: "#f59e0b", soft: "#fff7ed", ring: "#fed7aa", text: "#9a3412" },
};
export const themeOf = (cat) => CAT_THEME[cat] || CAT_THEME.General;
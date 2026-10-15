import { SRC_LABEL, TYPE_META, EXPORT_FORMAT } from "./model";

/* Downloads: Excel-friendly CSV of the field list, JSON backup (re-importable), all-templates bundle */

const save = (content, name, type) => {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const fileName = (def, ver, ext) => `${String(def.name || "logbook_template").replace(/\W+/g, "_")}${ver ? `_${ver}` : ""}.${ext}`;
const cell = (v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => `﻿${rows.map((r) => r.map(cell).join(",")).join("\r\n")}`;   // BOM → Excel reads UTF-8 (°C etc.)

export const fieldRows = (def) => [
  ["Sr", "Field label", "Key", "Type", "Mandatory", "Choices / master list", "Unit", "Min", "Max", "Show only if", "Must not be before", "Help text"],
  ...(def.columns || []).map((c, i) => [
    i + 1, c.label, c.key, TYPE_META[c.type]?.label || c.type, c.required ? "Yes" : "No",
    c.type === "select" ? (c.source ? `${SRC_LABEL[c.source]} master` : (c.options || []).join(" / ")) : "",
    c.unit || "", c.min ?? "", c.max ?? "",
    c.showIf?.field ? `${c.showIf.field} ${c.showIf.notEquals != null ? "is not" : "is"} ${c.showIf.equals ?? c.showIf.notEquals}` : "",
    c.afterField || "", c.helpText || "",
  ]),
];

/** One template → CSV (opens in Excel): header block + field list */
export function exportExcel(def, verLabel) {
  const head = [
    ["Logbook template", def.name], ["Version", verLabel || ""], ["Category", def.category], ["Issued against", def.refType],
    ["Format No.", def.docNo || ""], ["SOP reference", def.sopRef || ""], ["e-Sign every entry", def.entrySign ? "Yes" : "No"],
    ["Verification", def.verifyRequired ? `Yes — ${(def.verifyRoles || []).join(" / ") || "any user except author"}` : "No"],
    ["Who can add entries", (def.entryRoles || []).join(" / ") || "Any user"], [],
  ];
  save(csv([...head, ...fieldRows(def)]), fileName(def, verLabel, "csv"), "text/csv;charset=utf-8");
}

/** One template → JSON (can be imported again in the designer) */
export function exportJson(def, verLabel) {
  save(JSON.stringify({ format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), version: verLabel || null, ...def }, null, 2), fileName(def, verLabel, "json"), "application/json");
}

/** All templates → one CSV summary sheet */
export function exportAllExcel(types) {
  const rows = [["Sr", "Template", "Category", "Issued against", "Source", "Effective version", "Status", "Format No.", "SOP ref", "Fields", "Mandatory", "e-Sign", "Verification", "Verified by", "Change in progress"]];
  types.forEach((t, i) => rows.push([
    i + 1, t.name, t.category, t.refType, t.isCustom ? "Company" : t.isCustomized ? "Standard (customised)" : "Standard",
    t.effective === false ? "—" : `v${t.currentVersion ?? t.revision ?? 1}`, t.isRetired ? "Retired" : t.effective === false ? "Draft" : "Effective",
    t.docNo || "", t.sopRef || "", (t.columns || []).length, (t.columns || []).filter((c) => c.required).length,
    t.entrySign ? "Yes" : "No", t.verifyRequired ? "Yes" : "No", (t.verifyRoles || []).join(" / "),
    t.pending ? `v${t.pending.versionNo} ${t.pending.status}` : "",
  ]));
  save(csv(rows), `logbook_templates_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
}

/** All templates → JSON backup */
export function exportAllJson(types) {
  const pick = ({ key, name, category, refType, entrySign, verifyRequired, entryRoles, verifyRoles, endTimeKey, lateAfterMinutes, docNo, sopRef, description, columns, currentVersion }) =>
    ({ key, name, category, refType, entrySign, verifyRequired, entryRoles, verifyRoles, endTimeKey, lateAfterMinutes, docNo, sopRef, description, columns, version: currentVersion });
  save(JSON.stringify({ format: `${EXPORT_FORMAT}-bundle`, exportedAt: new Date().toISOString(), templates: types.map(pick) }, null, 2),
    `logbook_templates_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
}

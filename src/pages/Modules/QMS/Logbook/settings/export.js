import { getRegister, getLogbookHistory } from "../../Utils/LogbookAPI";
import { makeXlsx, makeZip, saveBlob } from "./xlsx";
import { buildRegisterPrint } from "./print";
import { EXPORT_FORMAT } from "./model";

/* ═══════════════════════════════════════════════════════════════════════
   Register data export: Excel (.xlsx) · CSV · PDF (print) · Audit pack (.zip) · JSON
   ═══════════════════════════════════════════════════════════════════════ */

const d2 = (n) => String(n).padStart(2, "0");
export const fmtDT = (v) => { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${d2(d.getDate())}-${d2(d.getMonth() + 1)}-${d.getFullYear()} ${d2(d.getHours())}:${d2(d.getMinutes())}`; };
const isoDay = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${d2(d.getMonth() + 1)}-${d2(d.getDate())}`; };

/** System columns that can be exported next to the template fields */
export const SYS_COLS = [
  { key: "_sr", label: "Sr", get: (e) => e.SeqNo, on: true },
  { key: "_at", label: "Date & time", get: (e) => fmtDT(e.EntryAt || e.DoneAt), on: true },
  { key: "_by", label: "Done by", get: (e) => e.DoneBy || "", on: true },
  { key: "_ver", label: "Verified by", get: (e) => e.VerifiedBy || "", on: true },
  { key: "_verAt", label: "Verified at", get: (e) => fmtDT(e.VerifiedAt), on: false },
  { key: "_st", label: "Status", get: (e) => e.Status || "", on: true },
  { key: "_late", label: "Late entry", get: (e) => (e.IsLateEntry ? "Yes" : ""), on: false },
  { key: "_alerts", label: "Alerts", get: (e) => (e.data?._alerts || []).join("; "), on: false },
  { key: "_cx", label: "Cancel reason", get: (e) => e.CancelReason || "", on: false },
];

/** Load the chosen registers with their entries, filtered by date and status */
export async function loadDataset({ registers, from, to, filter }) {
  const out = [];
  for (const reg of registers) {
    const r = await getRegister(reg.Id);
    if (r && r.success === false) throw new Error(r.message || "Could not load register");
    const entries = (r?.entries || []).filter((e) => {
      const day = isoDay(e.EntryAt || e.DoneAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (filter === "verified") return e.Status === "Verified" || e.Status === "Recorded";
      if (filter === "active") return e.Status !== "Cancelled";
      return true;
    });
    out.push({ reg: r?.register || reg, type: r?.type, entries });
  }
  return out;
}

/** Flat table (header + rows) from the dataset and the selected columns */
export function toTable(def, dataset, selected) {
  const multi = dataset.length > 1;
  const sys = SYS_COLS.filter((c) => selected.includes(c.key));
  const fields = (def.columns || []).filter((c) => selected.includes(c.key));
  const header = [...(multi ? ["Register No."] : []), ...sys.map((c) => c.label), ...fields.map((c) => `${c.label}${c.unit ? ` (${c.unit})` : ""}`)];
  const rows = [];
  dataset.forEach(({ reg, entries }) => entries.forEach((e) => rows.push([
    ...(multi ? [reg.RecordNo] : []), ...sys.map((c) => c.get(e)),
    ...fields.map((c) => { const v = e.data?.[c.key]; return c.type === "number" && v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : v ?? ""; }),
  ])));
  return { header, rows };
}

const fileBase = (pattern, def, dataset) => {
  const reg = dataset.length === 1 ? dataset[0].reg.RecordNo : "All_registers";
  const today = new Date(); const date = `${today.getFullYear()}${d2(today.getMonth() + 1)}${d2(today.getDate())}`;
  return String(pattern || "{RegisterNo}_{Date}").replace(/\{RegisterNo\}/g, reg).replace(/\{Date\}/g, date)
    .replace(/\{Template\}/g, def.name || "logbook").replace(/[^\w.-]+/g, "_").slice(0, 120) || "logbook_export";
};

/** Audit trail + e-signatures from the shared record-history endpoint (shape is normalised) */
async function loadHistory(dataset) {
  const audit = []; const sigs = [];
  for (const { reg } of dataset) {
    try {
      const r = await getLogbookHistory(reg.RecordNo); const d = r?.data ?? r ?? {};
      const a = d.auditTrail || d.audit || d.history || (Array.isArray(d) ? d : []);
      const s = d.eSignatures || d.signatures || d.esign || [];
      (Array.isArray(a) ? a : []).forEach((row) => audit.push({ RegisterNo: reg.RecordNo, ...row }));
      (Array.isArray(s) ? s : []).forEach((row) => sigs.push({ RegisterNo: reg.RecordNo, ...row }));
    } catch { /* history is optional */ }
  }
  return { audit, sigs };
}
const objSheet = (name, list) => {
  const keys = [...new Set(list.flatMap((o) => Object.keys(o)))].slice(0, 15);
  return { name, header: keys, rows: list.map((o) => keys.map((k) => { const v = o[k]; return v && typeof v === "object" ? JSON.stringify(v) : /At$|Date|Time/i.test(k) && v && !Number.isNaN(Date.parse(v)) ? fmtDT(v) : v ?? ""; })) };
};
const csvOf = (header, rows) => `﻿${[header, ...rows].map((r) => r.map((v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\r\n")}`;

function workbook(def, dataset, table, opt, hist) {
  const one = dataset.length === 1 ? dataset[0].reg : null;
  const title = opt.detailsBlock ? [
    `${def.name}${one?.RefName ? ` — ${one.RefName}` : ""}`,
    ["Register No.", one ? one.RecordNo : `${dataset.length} registers`], ["Document No.", def.docNo || ""],
    ["Period", `${opt.from || "start"} to ${opt.to || "today"}`], ["Exported by / on", `${opt.userName || ""} · ${fmtDT(new Date())}`],
  ] : [];
  const sheets = [{ name: "Entries", title, header: table.header, rows: table.rows }];
  if (opt.auditSheet && hist) sheets.push(objSheet("Audit trail", hist.audit.length ? hist.audit : [{ Info: "No audit records returned" }]));
  if (opt.signSheet && hist) sheets.push(objSheet("e-Signatures", hist.sigs.length ? hist.sigs : [{ Info: "No e-signatures returned" }]));
  return makeXlsx(sheets);
}

/** Run one export. format: xlsx | csv | pdf | zip | json */
export async function runExport({ format, def, dataset, selected, opt }) {
  const table = toTable(def, dataset, selected);
  const base = fileBase(opt.fileName, def, dataset);
  const hist = (format === "xlsx" && (opt.auditSheet || opt.signSheet)) || format === "zip" ? await loadHistory(dataset) : null;
  const prints = () => dataset.map(({ reg, entries }) => ({ reg, html: buildRegisterPrint({ def, ver: opt.ver, company: opt.company, register: reg, entries, userName: opt.userName }) }));

  if (format === "xlsx") saveBlob(workbook(def, dataset, table, opt, hist), `${base}.xlsx`);
  else if (format === "csv") saveBlob(new Blob([csvOf(table.header, table.rows)], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
  else if (format === "json") {
    saveBlob(new Blob([JSON.stringify({ format: `${EXPORT_FORMAT}-data`, exportedAt: new Date().toISOString(), exportedBy: opt.userName, template: def,
      registers: dataset.map(({ reg, entries }) => ({ register: reg, entries })) }, null, 2)], { type: "application/json" }), `${base}.json`);
  } else if (format === "pdf") {
    const docs = prints();
    const bodies = docs.map((p) => p.html.split("<body>")[1].split("</body>")[0]).join('<div style="page-break-after:always"></div>');
    const w = window.open("", "_blank");
    if (!w) throw new Error("Pop-up blocked — allow pop-ups for this site to print / save PDF.");
    w.document.write(`${docs[0].html.split("<body>")[0]}<body>${bodies}</body></html>`); w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  } else if (format === "zip") {
    const files = [
      { name: `${base}.xlsx`, data: new Uint8Array(await workbook(def, dataset, table, { ...opt, auditSheet: true, signSheet: true }, hist).arrayBuffer()) },
      ...prints().map((p) => ({ name: `print/${p.reg.RecordNo}.html`, data: p.html })),
      { name: "e_signatures.csv", data: (() => { const s = objSheet("s", hist.sigs); return csvOf(s.header, s.rows); })() },
      { name: "audit_trail.csv", data: (() => { const s = objSheet("a", hist.audit); return csvOf(s.header, s.rows); })() },
      { name: "README.txt", data: `Audit pack — ${def.name}\r\nExported by ${opt.userName || ""} on ${fmtDT(new Date())}\r\nPeriod: ${opt.from || "start"} to ${opt.to || "today"}\r\n\r\n${base}.xlsx  entries, audit trail, e-signatures\r\nprint/*.html  printable registers (open in a browser, Print -> Save as PDF)\r\ne_signatures.csv, audit_trail.csv  raw logs\r\n` },
    ];
    saveBlob(makeZip(files), `${base}_audit_pack.zip`);
  }
  return { rows: table.rows.length, cols: table.header.length };
}

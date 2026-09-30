/* ------------------------------------------------------------------
   exportUtils — one place for every download on the Sales Dashboard.

   Column spec:  { key, label, type }
     type: "text" (default) | "int" | "num" | "pct" | "date"
     - int  -> whole number
     - num  -> 2 decimals (money)
     - pct  -> 1 decimal, the value is already 0–100
     - date -> "YYYY-MM-DD" in, "DD-MM-YYYY" out
   `key` may be a string (row[key]) or a function (row) => value.

   Numbers are written raw (no ₹, no "Cr/L" shortening) so that Excel can
   sum / pivot them. Formatting is applied through Excel number formats.

   Excel export needs SheetJS:  npm i xlsx
   It is loaded lazily so the dashboard bundle is not affected.
------------------------------------------------------------------ */

const BOM = "\uFEFF";

/* ---------- helpers ---------- */
function cellValue(col, row) {
  const raw = typeof col.key === "function" ? col.key(row) : row?.[col.key];
  if (raw == null || raw === "") return null;
  switch (col.type) {
    case "int":  return Math.round(Number(raw) || 0);
    case "num":  return Math.round((Number(raw) || 0) * 100) / 100;
    case "pct":  return Math.round((Number(raw) || 0) * 10) / 10;
    case "date": return String(raw).slice(0, 10).split("-").reverse().join("-");
    default:     return raw;
  }
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function safeFileName(s) {
  return String(s || "export")
    .replace(/[₹%/\\:*?"<>|]+/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "export";
}

/* "sales_2026-01-01_to_2026-06-27" style suffix from the active filters */
export function rangeSuffix(filters) {
  if (!filters) return "";
  const a = filters.from || "all", b = filters.to || "all";
  return `_${a}_to_${b}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- CSV ---------- */
export function toCsv(columns, rows) {
  const head = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(cellValue(c, r))).join(","));
  return [head, ...body].join("\r\n");
}

export function exportCsv({ name, columns, rows }) {
  const csv = toCsv(columns, rows);
  downloadBlob(new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" }), `${safeFileName(name)}.csv`);
}

/* ---------- Excel ---------- */
const NUM_FMT = { int: "#,##0", num: "#,##0.00", pct: "0.0" };

/* Sheet names: max 31 chars, no []:*?/\  and unique inside one workbook */
function sheetName(title, used) {
  let base = String(title || "Sheet").replace(/[[\]:*?/\\]/g, "").trim().slice(0, 28) || "Sheet";
  let name = base, i = 2;
  while (used.has(name)) name = `${base.slice(0, 25)} (${i++})`;
  used.add(name);
  return name;
}

function buildSheet(XLSX, columns, rows) {
  const aoa = [
    columns.map((c) => c.label),
    ...rows.map((r) => columns.map((c) => cellValue(c, r))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // number formats + column widths
  const widths = columns.map((c) => Math.max(10, String(c.label).length + 2));
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci];
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      const cell = ws[addr];
      if (!cell) continue;
      if (NUM_FMT[col.type]) cell.z = NUM_FMT[col.type];
      const len = String(cell.v ?? "").length;
      if (len + 2 > widths[ci]) widths[ci] = Math.min(60, len + 2);
    }
  }
  ws["!cols"] = widths.map((wch) => ({ wch }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length, 1), c: columns.length - 1 } }) };
  return ws;
}

async function loadXlsx() {
  const mod = await import("xlsx");
  return mod.default?.utils ? mod.default : mod;
}

/* sheets: [{ title, columns, rows }] */
export async function exportWorkbook({ name, sheets }) {
  const XLSX = await loadXlsx();
  const wb = XLSX.utils.book_new();
  const used = new Set();
  let added = 0;
  for (const s of sheets) {
    if (!s || !s.columns?.length) continue;
    XLSX.utils.book_append_sheet(wb, buildSheet(XLSX, s.columns, s.rows || []), sheetName(s.title, used));
    added++;
  }
  if (!added) return;
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${safeFileName(name)}.xlsx`
  );
}

export function exportXlsx({ name, columns, rows, sheet }) {
  return exportWorkbook({ name, sheets: [{ title: sheet || name, columns, rows }] });
}

/* ---------- single entry point ---------- */
export function exportRows({ format = "csv", ...spec }) {
  return format === "xlsx" ? exportXlsx(spec) : exportCsv(spec);
}

/* ---------- ready-made column sets used by more than one component ---------- */
export const COLS = {
  keyAmt:   (keyLabel) => [{ key: 0, label: keyLabel }, { key: 1, label: "Amount (₹)", type: "num" }],
  keyQty:   (keyLabel) => [{ key: 0, label: keyLabel }, { key: 1, label: "Qty", type: "int" }],
};

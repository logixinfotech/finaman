import { useEffect, useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../../components/Reusable/alert";
import { getRegisters } from "../../Utils/LogbookAPI";
import { toDefinition } from "./model";
import { SYS_COLS, loadDataset, toTable, runExport } from "./export";
import { Card, FieldBox, Toggle, Badge, Button, Check, Empty, inpSm } from "./ui";

/* ═══════════════════════════════════════════════════════════════════════
   Export data — register entries of this template
   Left: ① Data ② Columns ③ File   ·   Right: summary + preview + Export
   ═══════════════════════════════════════════════════════════════════════ */

const FORMATS = [
  { k: "xlsx", l: "Excel workbook", ext: ".xlsx", d: "Entries, audit trail and e-signatures on separate sheets", i: FaIcons.FaFileExcel, c: "#15803d" },
  { k: "pdf", l: "PDF / print", ext: ".pdf", d: "Controlled print layout with header and signatures", i: FaIcons.FaFilePdf, c: "#b91c1c" },
  { k: "zip", l: "Audit pack", ext: ".zip", d: "Excel + printable registers + logs, for inspectors", i: FaIcons.FaFileArchive, c: "#7c3aed" },
  { k: "csv", l: "CSV", ext: ".csv", d: "Plain rows for other systems", i: FaIcons.FaFileCsv, c: "#4b5563" },
  { k: "json", l: "JSON", ext: ".json", d: "Data with field definitions", i: FaIcons.FaFileCode, c: "#b45309" },
];
const iso = (d) => d.toISOString().slice(0, 10);
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const PERIODS = [["7", "Last 7 days"], ["30", "Last 30 days"], ["month", "This month"], ["all", "All time"], ["custom", "Custom"]];
const Step = ({ n, title, children }) => (
  <div className="px-5 py-4 border-b border-[#f3f4f6] last:border-0">
    <div className="flex items-center gap-2.5 mb-3"><span className="w-[22px] h-[22px] rounded-full bg-[#111827] text-white text-[11px] font-semibold flex items-center justify-center">{n}</span><span className="text-[13px] font-semibold text-[#111827]">{title}</span></div>
    {children}
  </div>
);

export default function ExportTab({ ed, typeKey, isNew, company, userName, ver }) {
  const def = useMemo(() => toDefinition(ed.draft), [ed.draft]);
  const [format, setFormat] = useState("xlsx");
  const [regs, setRegs] = useState([]);
  const [regSel, setRegSel] = useState("all");
  const [period, setPeriod] = useState("30");
  const [from, setFrom] = useState(ago(30));
  const [to, setTo] = useState(iso(new Date()));
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(() => [...SYS_COLS.filter((c) => c.on).map((c) => c.key), ...def.columns.map((c) => c.key)]);
  const [opt, setOpt] = useState({ detailsBlock: true, auditSheet: true, signSheet: true, fileName: "{Template}_{RegisterNo}_{Date}" });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    getRegisters("All").then((r) => setRegs((r?.data || []).filter((x) => x.TypeKey === typeKey))).catch(() => setRegs([]));
  }, [typeKey, isNew]);
  const pickPeriod = (k) => {
    setPeriod(k);
    const now = new Date();
    if (k === "7" || k === "30") { setFrom(ago(Number(k))); setTo(iso(now)); }
    else if (k === "month") { setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(iso(now)); }
    else if (k === "all") { setFrom(""); setTo(""); }
  };

  const chosen = useMemo(() => (regSel === "all" ? regs : regs.filter((r) => String(r.Id) === regSel)), [regs, regSel]);
  useEffect(() => {
    if (!chosen.length) { setData(null); return undefined; }
    let live = true; setBusy(true);
    loadDataset({ registers: chosen, from, to, filter })
      .then((ds) => live && setData(ds))
      .catch((e) => live && alertError("Could not load entries", e.message))
      .finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [chosen, from, to, filter]);

  const table = useMemo(() => (data ? toTable(def, data, selected) : null), [data, def, selected]);
  const toggle = (k) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const allKeys = [...SYS_COLS.map((c) => c.key), ...def.columns.map((c) => c.key)];
  const fmt = FORMATS.find((f) => f.k === format);
  const go = async () => {
    if (!data || !table?.rows.length) { alertError("Nothing to export", "No entries match the selected registers, period and filter."); return; }
    setBusy(true);
    try {
      const r = await runExport({ format, def, dataset: data, selected, opt: { ...opt, from, to, company, userName, ver } });
      showToast({ icon: "success", title: `Exported ${r.rows} entries` });
    } catch (e) { alertError("Export failed", e.message); }
    finally { setBusy(false); }
  };

  if (isNew) return <Card><Empty icon={FaIcons.FaDownload} title="Nothing to export yet">Export works on registers issued from this template. Save and approve it first.</Empty></Card>;
  const stats = [["Registers", chosen.length], ["Entries", table ? table.rows.length : "—"], ["Columns", table ? table.header.length : selected.length], ["Period", from || to ? `${from || "start"} → ${to || "today"}` : "All time"]];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[370px_minmax(0,1fr)] gap-4 items-start">
      <aside className="bg-white border border-[#e5e7eb] rounded-[8px] xl:sticky xl:top-0 xl:max-h-[calc(100vh-240px)] overflow-y-auto">
        <Step n={1} title="Choose data">
          <div className="flex flex-col gap-3">
            <FieldBox label="Registers">
              <select className={inpSm} value={regSel} onChange={(e) => setRegSel(e.target.value)}>
                <option value="all">All registers of this template ({regs.length})</option>
                {regs.map((r) => <option key={r.Id} value={String(r.Id)}>{r.RecordNo} — {r.RefName}{r.Status !== "Active" ? ` (${r.Status})` : ""}</option>)}
              </select>
            </FieldBox>
            <FieldBox label="Period">
              <div className="flex flex-wrap gap-1.5">
                {PERIODS.map(([k, l]) => <button key={k} type="button" onClick={() => pickPeriod(k)} className={`h-[26px] px-2.5 rounded-[13px] text-[12px] font-semibold border ${period === k ? "bg-[#111827] border-[#111827] text-white" : "bg-white border-[#e5e7eb] text-[#4b5563] hover:border-[#9ca3af]"}`}>{l}</button>)}
              </div>
              {period === "custom" && <div className="grid grid-cols-2 gap-2 mt-2"><input type="date" className={inpSm} value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" className={inpSm} value={to} onChange={(e) => setTo(e.target.value)} /></div>}
            </FieldBox>
            <FieldBox label="Entries">
              <select className={inpSm} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All entries (including cancelled)</option>
                <option value="active">Exclude cancelled</option>
                <option value="verified">Verified / recorded only</option>
              </select>
            </FieldBox>
          </div>
        </Step>
        <Step n={2} title={`Choose columns (${selected.length})`}>
          <div className="flex gap-3 mb-1.5 text-[12px]">
            <button type="button" className="font-semibold text-[#1a56db]" onClick={() => setSelected(allKeys)}>Select all</button>
            <button type="button" className="font-semibold text-[#6b7280]" onClick={() => setSelected([])}>Clear</button>
          </div>
          <div className="-mx-2 max-h-[240px] overflow-y-auto">
            {SYS_COLS.map((c) => <Check key={c.key} checked={selected.includes(c.key)} onChange={() => toggle(c.key)} label={c.label} extra={<Badge tone="outline">system</Badge>} />)}
            {def.columns.map((c) => <Check key={c.key} checked={selected.includes(c.key)} onChange={() => toggle(c.key)} label={c.label} />)}
          </div>
        </Step>
        <Step n={3} title="Choose file">
          <div className="flex flex-col gap-1.5">
            {FORMATS.map((f) => (
              <label key={f.k} className={`flex items-start gap-3 px-3 py-2.5 rounded-[8px] border cursor-pointer transition-colors ${format === f.k ? "border-[#1a56db] bg-[#eff6ff]" : "border-[#e5e7eb] hover:border-[#9ca3af]"}`}>
                <input type="radio" name="fmt" className="mt-1 accent-[#1a56db]" checked={format === f.k} onChange={() => setFormat(f.k)} />
                <f.i size={18} style={{ color: f.c }} className="mt-0.5 shrink-0" />
                <span className="min-w-0"><span className="text-[13px] font-semibold text-[#111827]">{f.l} <span className="font-normal text-[#9ca3af]">{f.ext}</span></span><span className="block text-[12px] text-[#6b7280] leading-snug">{f.d}</span></span>
              </label>
            ))}
          </div>
          {format === "xlsx" && (
            <div className="flex flex-col gap-2.5 mt-3">
              <Toggle small checked={opt.detailsBlock} onChange={(v) => setOpt((o) => ({ ...o, detailsBlock: v }))} label="Register details on top" />
              <Toggle small checked={opt.auditSheet} onChange={(v) => setOpt((o) => ({ ...o, auditSheet: v }))} label="Audit trail sheet" />
              <Toggle small checked={opt.signSheet} onChange={(v) => setOpt((o) => ({ ...o, signSheet: v }))} label="e-Signature sheet" />
            </div>
          )}
          {format !== "pdf" && (
            <FieldBox label="File name" hint="Use {Template}, {RegisterNo}, {Date}" className="mt-3">
              <input className={inpSm} value={opt.fileName} onChange={(e) => setOpt((o) => ({ ...o, fileName: e.target.value }))} />
            </FieldBox>
          )}
        </Step>
      </aside>

      <div className="flex flex-col gap-4 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(([l, v]) => (
            <div key={l} className="bg-white border border-[#e5e7eb] rounded-[8px] px-4 py-3">
              <div className="text-[12px] text-[#6b7280]">{l}</div>
              <div className={`mt-1 font-semibold text-[#111827] truncate ${l === "Period" ? "text-[13px]" : "text-[20px]"}`}>{busy && l === "Entries" ? "…" : v}</div>
            </div>
          ))}
        </div>
        <Card title="Preview" desc={table?.rows.length > 10 ? `First 10 of ${table.rows.length} rows` : "Rows that will be exported"} bodyClass="p-0"
          right={<Button kind="primary" icon={fmt.i} disabled={busy || !table?.rows.length} onClick={go}>{busy ? "Working…" : `Export ${fmt.l}`}</Button>}>
          <div className="overflow-x-auto">
            {table && table.rows.length ? (
              <table className="w-full text-left">
                <thead><tr className="bg-[#f9fafb]">{table.header.map((h) => <th key={h} className="px-3 h-[34px] text-[12px] font-semibold text-[#4b5563] whitespace-nowrap border-b border-[#e5e7eb]">{h}</th>)}</tr></thead>
                <tbody>{table.rows.slice(0, 10).map((r, i) => <tr key={i} className="hover:bg-[#f9fafb]">{r.map((v, j) => <td key={j} className="px-3 h-[36px] text-[13px] text-[#111827] whitespace-nowrap border-b border-[#f3f4f6]">{String(v ?? "")}</td>)}</tr>)}</tbody>
              </table>
            ) : <Empty icon={FaIcons.FaTable} title={busy ? "Loading entries…" : regs.length ? "No entries for this selection" : "No registers issued from this template yet"}>{!busy && regs.length ? "Change the period or the entry filter." : null}</Empty>}
          </div>
        </Card>
      </div>
    </div>
  );
}

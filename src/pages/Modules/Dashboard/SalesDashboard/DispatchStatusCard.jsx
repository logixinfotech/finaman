import { useMemo, useState } from "react";
import { Truck } from "lucide-react";
import { fetchDispatchStatus } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import { StatChip, ErrorNote, DenseTable, money, int } from "./CardBits";
import { dmy } from "../../../../utils/helpers";

/* Invoice-level dispatch completeness: E-Way bill and GR (LR) entries. */
const EXPORT_COLS = [
  { key: "inv", label: "Invoice" }, { key: "dt", label: "Invoice Date", type: "date" },
  { key: "cust", label: "Customer" }, { key: "consignee", label: "Consignee" }, { key: "city", label: "City" }, { key: "state", label: "State" },
  { key: "status", label: "Status" }, { key: "ageDays", label: "Days Since Invoice", type: "int" },
  { key: "transporter", label: "Transporter" }, { key: "vehicle", label: "Vehicle" },
  { key: "grNo", label: "GR No" }, { key: "grDt", label: "GR Date", type: "date" },
  { key: "ewayNo", label: "E-Way No" }, { key: "ewayDt", label: "E-Way Date", type: "date" },
  { key: "amt", label: "Taxable (₹)", type: "num" }, { key: "invAmt", label: "Invoice Amt (₹)", type: "num" },
];
const FILTERS = [["", "All"], ["incomplete", "Incomplete"], ["noEway", "No E-Way"], ["noGr", "No GR"]];
const TONE = { Complete: "bg-emerald-50 text-emerald-700", "No E-Way": "bg-amber-50 text-amber-700", "No GR": "bg-amber-50 text-amber-700", "No E-Way, No GR": "bg-rose-50 text-rose-700" };

export default function DispatchStatusCard({ filters, setFilters }) {
  const params = useMemo(() => filterParams(filters), [filters]);
  const { data, loading, error, refetch } = useDashboardQuery(fetchDispatchStatus, params, !!filters?.from);
  const [f, setF] = useState("noEway");   // GR is rarely entered in this data, so "No E-Way" is the useful default
  const rows = useMemo(() => {
    const all = data?.data || [];
    if (f === "incomplete") return all.filter((r) => !(r.hasEway && r.hasGr));
    if (f === "noEway") return all.filter((r) => !r.hasEway);
    if (f === "noGr") return all.filter((r) => !r.hasGr);
    return all;
  }, [data, f]);
  const s = data?.summary;
  const exportSpec = useMemo(() => ({ columns: EXPORT_COLS, rows, id: "dispatch-status" }), [rows]);
  const onRow = setFilters ? (r) => setFilters((x) => ({ ...x, cust: x.cust === r.cust ? "" : r.cust })) : undefined;

  return (
    <CardShell title="Dispatch Status (E-Way / GR)" icon={Truck} accent="sky" exportSpec={exportSpec}
      actions={
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setF(k)} className={`rounded-md px-2 py-1 transition-colors ${f === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
          ))}
        </div>
      }>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatChip label="Invoices" value={int(s.invoices)} sub={`${int(s.complete)} complete`} tone="slate" />
            <StatChip label="No E-Way" value={int(s.noEway)} tone={s.noEway ? "amber" : "emerald"} />
            <StatChip label="No GR / LR" value={int(s.noGr)} tone={s.noGr ? "amber" : "emerald"} />
            <StatChip label="Value incomplete" value={money(s.amtIncomplete)} sub={`${int(s.noBoth)} with neither`} tone={s.noBoth ? "rose" : "slate"} />
          </div>
          <DenseTable maxHeight={280} rows={rows.slice(0, 300)} onRowClick={onRow} rowKey={(r) => r.invKey} emptyLabel="All invoices have E-Way and GR entries"
            cols={[
              { key: "inv", label: "Invoice", render: (r) => <span className="font-medium text-slate-800">{r.inv}</span> },
              { key: "dt", label: "Date", render: (r) => dmy(r.dt), cls: "text-slate-500" },
              { key: "cust", label: "Customer" },
              { key: "city", label: "City", cls: "text-slate-500" },
              { key: "status", label: "Status", render: (r) => <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${TONE[r.status]}`}>{r.status}</span> },
              { key: "ageDays", label: "Age", align: "right", render: (r) => `${r.ageDays}d` },
              { key: "transporter", label: "Transporter", cls: "text-slate-500" },
              { key: "invAmt", label: "Amount", align: "right", render: (r) => money(r.invAmt) },
            ]} />
          <p className="mt-1 text-[10.5px] text-slate-400">E-Way is not mandatory for every invoice — "No E-Way" means the entry is missing, not necessarily an error.</p>
        </div>
      )}
    </CardShell>
  );
}

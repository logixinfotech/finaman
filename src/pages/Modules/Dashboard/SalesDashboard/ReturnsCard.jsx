import { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Undo2 } from "lucide-react";
import { fetchReturnsAnalysis } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import ExportMenu from "./ExportMenu";
import { StatChip, ErrorNote, DenseTable, Empty, money, int, pct1 } from "./CardBits";

/* Credit-note (returns) analysis: how much of what was sold came back, and from whom. */
const CUST_COLS = [
  { key: "cust", label: "Customer" }, { key: "city", label: "City" },
  { key: "salesAmt", label: "Sales (₹)", type: "num" }, { key: "returnAmt", label: "Returns (₹)", type: "num" },
  { key: "returnPct", label: "Return %", type: "pct" }, { key: "creditNotes", label: "Credit Notes", type: "int" },
];
const PROD_COLS = [
  { key: "item", label: "Product" }, { key: "grp", label: "Group" },
  { key: "salesAmt", label: "Sales (₹)", type: "num" }, { key: "returnAmt", label: "Returns (₹)", type: "num" },
  { key: "returnQty", label: "Return Qty", type: "int" }, { key: "returnPct", label: "Return %", type: "pct" }, { key: "creditNotes", label: "Credit Notes", type: "int" },
];
const TREND_COLS = [
  { key: "bucket", label: "Month" }, { key: "salesAmt", label: "Sales (₹)", type: "num" },
  { key: "returnAmt", label: "Returns (₹)", type: "num" }, { key: "returnPct", label: "Return %", type: "pct" },
];
const trunc = (s, n = 22) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

export default function ReturnsCard({ filters, setFilters }) {
  const params = useMemo(() => filterParams(filters), [filters]);
  const { data, loading, error, refetch } = useDashboardQuery(fetchReturnsAnalysis, params, !!filters?.from);
  const [view, setView] = useState("cust");
  const t = data?.totals;
  const trend = data?.trend || [];
  const rows = view === "cust" ? data?.byCustomer || [] : data?.byProduct || [];

  const onRow = setFilters
    ? (r) => setFilters((f) => (view === "cust" ? { ...f, cust: f.cust === r.cust ? "" : r.cust } : { ...f, item: f.item === r.item ? "" : r.item }))
    : undefined;

  /* doughnut: kept vs returned */
  const kept = Math.max(0, (t?.salesAmt || 0) - (t?.returnAmt || 0));
  const donut = {
    labels: ["Kept by customer", "Returned"],
    datasets: [{ data: [kept, t?.returnAmt || 0], backgroundColor: ["#c7d2fe", "#f43f5e"], borderColor: "#fff", borderWidth: 2 }],
  };
  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: "68%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 9, usePointStyle: true, pointStyle: "circle", font: { size: 10.5, weight: "600" }, color: "#64748b" } },
      tooltip: { callbacks: { label: (c) => `${c.label}: ${money(c.parsed)}` } },
    },
  };

  /* horizontal bars: top 8 by return value in the active view */
  const top = rows.slice(0, 8);
  const hbar = {
    labels: top.map((r) => trunc(view === "cust" ? r.cust : r.item)),
    datasets: [{ data: top.map((r) => r.returnAmt), backgroundColor: top.map((r) => (r.returnPct > 5 ? "#f43f5e" : "#fda4af")), borderRadius: 4, barThickness: 14 }],
  };
  const hbarOpts = {
    indexAxis: "y", responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `Returned ${money(c.parsed.x)} · ${pct1(top[c.dataIndex]?.returnPct)} of ${money(top[c.dataIndex]?.salesAmt)}` } },
    },
    scales: {
      x: { ticks: { callback: (v) => money(v), font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#334155" } },
    },
    onClick: (_e, els) => { if (els.length && onRow) onRow(top[els[0].index]); },
    onHover: (e, els) => { if (e.native?.target) e.native.target.style.cursor = els.length ? "pointer" : "default"; },
  };

  const exportSpec = useMemo(() => ({ columns: TREND_COLS, rows: trend, id: "returns-trend" }), [trend]);

  const Switch = (
    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
      {[["cust", "By customer"], ["prod", "By product"]].map(([k, l]) => (
        <button key={k} type="button" onClick={() => setView(k)}
          className={`rounded-md px-2.5 py-1 transition-colors ${view === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
      ))}
    </div>
  );

  return (
    <CardShell title="Returns / Credit Notes" icon={Undo2} accent="rose" exportSpec={exportSpec} actions={Switch}>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatChip label="Returns" value={money(t.returnAmt)} sub={`${int(t.creditNotes)} credit notes`} tone="rose" />
            <StatChip label="Return %" value={pct1(t.returnPct)} sub={`of ${money(t.salesAmt)} sales`} tone={t.returnPct > 5 ? "rose" : "slate"} />
            <StatChip label="Return qty" value={int(t.returnQty)} tone="slate" />
            <StatChip label="Customers" value={int(t.customers)} sub="with a return" tone="slate" />
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Sold vs returned</p>
              <div className="relative" style={{ height: 190 }}>
                {t.salesAmt ? <Doughnut data={donut} options={donutOpts} /> : <Empty />}
                {t.salesAmt > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                    <p className="text-lg font-bold leading-none text-rose-600">{pct1(t.returnPct)}</p>
                    <p className="text-[10px] text-slate-400">returned</p>
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 lg:col-span-3">
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
                Top {view === "cust" ? "customers" : "products"} by returns <span className="font-normal normal-case text-slate-400">· dark red = over 5%</span>
              </p>
              <div style={{ height: 190 }}>{top.length ? <Bar data={hbar} options={hbarOpts} /> : <Empty label="No credit notes in this range" />}</div>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-end">
            <ExportMenu title={view === "cust" ? "Returns by Customer" : "Returns by Product"} columns={view === "cust" ? CUST_COLS : PROD_COLS} rows={rows} filters={filters} />
          </div>
          <DenseTable maxHeight={200} rows={rows} onRowClick={onRow} rowKey={(r) => r.custId || r.item} emptyLabel="No credit notes in this range"
            cols={[
              { key: view === "cust" ? "cust" : "item", label: view === "cust" ? "Customer" : "Product", render: (r) => <span className="font-medium text-slate-800">{view === "cust" ? r.cust : r.item}</span> },
              { key: view === "cust" ? "city" : "grp", label: view === "cust" ? "City" : "Group", cls: "text-slate-500" },
              { key: "salesAmt", label: "Sales", align: "right", render: (r) => money(r.salesAmt) },
              { key: "returnAmt", label: "Returns", align: "right", render: (r) => <span className="text-rose-600">{money(r.returnAmt)}</span> },
              { key: "returnPct", label: "%", align: "right", render: (r) => <span className={r.returnPct > 5 ? "font-semibold text-rose-600" : ""}>{pct1(r.returnPct)}</span> },
              { key: "creditNotes", label: "CNs", align: "right", render: (r) => int(r.creditNotes) },
            ]} />
          {onRow && <p className="mt-1 text-[10.5px] text-slate-400">Click a bar or row to filter by that {view === "cust" ? "customer" : "product"}</p>}
        </div>
      )}
    </CardShell>
  );
}

import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Timer } from "lucide-react";
import { fetchLeadTime } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import ExportMenu from "./ExportMenu";
import { StatChip, ErrorNote, DenseTable, Empty, money, int, days } from "./CardBits";
import { dmy } from "../../../../utils/helpers";

/* Order-to-dispatch lead time. "Dispatch" = first Sales invoice linked to the order. */
const BAR_COLORS = ["#10b981", "#34d399", "#f59e0b", "#fb923c", "#f43f5e"];

const CUST_COLS = [
  { key: "cust",    label: "Customer" },
  { key: "city",    label: "City" },
  { key: "orders",  label: "Orders", type: "int" },
  { key: "avgDays", label: "Avg Days", type: "pct" },
  { key: "maxDays", label: "Max Days", type: "int" },
  { key: "over15",  label: "Orders > 15d", type: "int" },
  { key: "amt",     label: "Order Value (₹)", type: "num" },
];
const DELAYED_COLS = [
  { key: "ord",   label: "Order No" },
  { key: "ordDt", label: "Order Date", type: "date" },
  { key: "cust",  label: "Customer" },
  { key: "city",  label: "City" },
  { key: "ageDays",      label: "Age (days)", type: "int" },
  { key: "expectedDays", label: "Customer Avg (days)", type: "pct" },
  { key: "overBy",       label: "Over By (days)", type: "pct" },
  { key: "qb",    label: "Balance Qty", type: "int" },
  { key: "amt",   label: "Order Value (₹)", type: "num" },
];
const ORDER_COLS = [
  { key: "ord", label: "Order No" }, { key: "ordDt", label: "Order Date", type: "date" },
  { key: "cust", label: "Customer" }, { key: "city", label: "City" }, { key: "state", label: "State" },
  { key: "firstInv", label: "First Dispatch", type: "date" }, { key: "lastInv", label: "Last Dispatch", type: "date" },
  { key: "leadDays", label: "Lead Days", type: "int" }, { key: "fullDays", label: "Days to Full Dispatch", type: "int" },
  { key: "invoices", label: "Invoices", type: "int" }, { key: "amt", label: "Order Value (₹)", type: "num" },
];

export default function LeadTimeCard({ filters, setFilters }) {
  const params = useMemo(() => filterParams(filters), [filters]);
  const { data, loading, error, refetch } = useDashboardQuery(fetchLeadTime, params, !!filters?.from);
  const [view, setView] = useState("slowest");   // slowest | delayed

  const s = data?.summary;
  const dist = data?.distribution || [];
  const chart = {
    labels: dist.map((d) => d.label),
    datasets: [{ data: dist.map((d) => d.orders), backgroundColor: BAR_COLORS, borderRadius: 6, barThickness: 22 }],
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.y} orders · ${money(dist[c.dataIndex]?.amt)}` } } },
    scales: { y: { ticks: { font: { size: 10.5 }, color: "#94a3b8", precision: 0 }, grid: { color: "#f1f5f9" } }, x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#64748b" } } },
  };

  const rows = view === "slowest" ? (data?.byCustomer || []) : (data?.delayed || []);
  const exportSpec = useMemo(() => ({ columns: ORDER_COLS, rows: data?.orders || [], id: "lead-time-orders" }), [data]);

  const onCust = setFilters ? (r) => setFilters((f) => ({ ...f, cust: f.cust === r.cust ? "" : r.cust })) : undefined;

  return (
    <CardShell title="Order-to-Dispatch Lead Time" icon={Timer} accent="teal" exportSpec={exportSpec}
      actions={<span className="hidden text-[10.5px] text-slate-400 sm:inline">first invoice vs order date</span>}>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-72 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatChip label="Avg lead time" value={days(s.avgDays)} sub={`${int(s.orders)} dispatched orders`} tone="teal" />
            <StatChip label="Median" value={days(s.medianDays)} tone="slate" />
            <StatChip label="P90" value={days(s.p90Days)} sub={`max ${days(s.maxDays)}`} tone={s.p90Days > 30 ? "rose" : "amber"} />
            <StatChip label="Within 7 days" value={`${s.within7.toFixed(0)}%`} tone="emerald" />
            <StatChip label="Within 15 days" value={`${s.within15.toFixed(0)}%`} tone="emerald" />
            <StatChip label="Pending orders" value={int(s.pendingOrders)} sub={`${int(data.delayed.length)} over customer avg`} tone={data.delayed.length ? "rose" : "slate"} />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Orders by lead time</p>
              <div style={{ height: 240 }}>{s.orders ? <Bar data={chart} options={opts} /> : <Empty />}</div>
            </div>
            <div className="min-w-0 lg:col-span-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
                  {[["slowest", "Slowest customers"], ["delayed", `Delayed now (${data.delayed.length})`]].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setView(k)}
                      className={`rounded-md px-2.5 py-1 transition-colors ${view === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
                  ))}
                </div>
                <ExportMenu title={view === "slowest" ? "Lead Time by Customer" : "Delayed Orders"} columns={view === "slowest" ? CUST_COLS : DELAYED_COLS} rows={rows} filters={filters} />
              </div>
              {view === "slowest" ? (
                <DenseTable maxHeight={240} rows={rows.slice(0, 50)} onRowClick={onCust} rowKey={(r) => r.custId || r.cust}
                  cols={[
                    { key: "cust", label: "Customer", render: (r) => <span className="font-medium text-slate-800">{r.cust}</span> },
                    { key: "city", label: "City", cls: "text-slate-500" },
                    { key: "orders", label: "Orders", align: "right", render: (r) => int(r.orders) },
                    { key: "avgDays", label: "Avg", align: "right", render: (r) => <span className={r.avgDays > 15 ? "font-semibold text-rose-600" : ""}>{days(r.avgDays)}</span> },
                    { key: "maxDays", label: "Max", align: "right", render: (r) => days(r.maxDays) },
                    { key: "amt", label: "Value", align: "right", render: (r) => money(r.amt) },
                  ]} />
              ) : (
                <DenseTable maxHeight={240} rows={rows.slice(0, 100)} onRowClick={onCust} rowKey={(r) => r.ordKey} emptyLabel="No pending order is older than its customer's usual lead time"
                  cols={[
                    { key: "ord", label: "Order", render: (r) => <span className="font-medium text-slate-800">{r.ord}</span> },
                    { key: "ordDt", label: "Date", render: (r) => dmy(r.ordDt), cls: "text-slate-500" },
                    { key: "cust", label: "Customer" },
                    { key: "ageDays", label: "Age", align: "right", render: (r) => days(r.ageDays) },
                    { key: "expectedDays", label: "Usual", align: "right", render: (r) => days(r.expectedDays), cls: "text-slate-500" },
                    { key: "overBy", label: "Over by", align: "right", render: (r) => <span className="font-semibold text-rose-600">+{days(r.overBy)}</span> },
                    { key: "amt", label: "Value", align: "right", render: (r) => money(r.amt) },
                  ]} />
              )}
              {onCust && <p className="mt-1 text-[10.5px] text-slate-400">Click a row to filter by that customer</p>}
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
}

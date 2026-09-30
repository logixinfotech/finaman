import { useMemo, useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Target, TrendingUp, TrendingDown, ChevronRight,
  Inbox, AlertCircle, Loader2,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import { useAgentPerformance } from "../../../../Hooks/useSalesSummary";
import { fetchAgentCustomers, fetchSalesDashboardFilters } from "../../../../utils/api";
import { inr, inrS } from "../../../../utils/helpers";
import FiltersBar from "./FiltersBar";
import Toaster from "./Toaster";
import { ExportRegistryProvider } from "./ExportRegistry";
import ExportMenu from "./ExportMenu";
import { exportRows, rangeSuffix } from "./exportUtils";

const PAGE_PX = "px-3 sm:px-4 lg:px-6 xl:px-8";
const DEBOUNCE_MS = 300;
const EMPTY_LISTS = { states: [], cities: [], customers: [], groups: [] };

const STATUS = {
  Exceeded:  { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  "On Track":{ cls: "bg-sky-50 text-sky-700 border-sky-200",             bar: "bg-sky-500",     dot: "bg-sky-500" },
  Behind:    { cls: "bg-amber-50 text-amber-700 border-amber-200",       bar: "bg-amber-500",   dot: "bg-amber-500" },
  Critical:  { cls: "bg-rose-50 text-rose-700 border-rose-200",          bar: "bg-rose-500",    dot: "bg-rose-500" },
};

const AGENT_EXPORT_COLS = [
  { key: "name",          label: "Agent" },
  { key: "monthlyTarget", label: "Monthly Target (₹)", type: "num" },
  { key: "months",        label: "Months", type: "int" },
  { key: "periodTarget",  label: "Period Target (₹)", type: "num" },
  { key: "achieved",      label: "Achieved (₹)", type: "num" },
  { key: "pct",           label: "Attainment %", type: "pct" },
  { key: "gap",           label: "Gap (₹)", type: "num" },
  { key: "invoices",      label: "Invoices", type: "int" },
  { key: "customers",     label: "Customers", type: "int" },
  { key: "status",        label: "Status" },
];

const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* Month columns in Indian FY order — April to March, matching the legacy report.
   Only months present in the data are shown; rendering 8 empty columns out of 12
   wastes screen space. */
function fyMonthOrder(buckets) {
  return [...buckets].sort((a, b) => {
    const fy = (k) => {
      const [y, m] = k.split("-").map(Number);
      return m >= 4 ? y * 100 + (m - 3) : (y - 1) * 100 + (m + 9);
    };
    return fy(a) - fy(b);
  });
}

const monthLabel = (k) => {
  const [y, m] = k.split("-");
  return `${MN[+m - 1]} ${y.slice(2)}`;
};

/* Long rows (custId x month) -> customer-wise matrix */
function pivot(rows) {
  const buckets = new Set();
  const byCust = new Map();

  for (const r of rows) {
    buckets.add(r.bucket);
    let c = byCust.get(r.custId);
    if (!c) {
      c = { custId: r.custId, cust: r.cust, city: r.city, months: {}, total: 0, invoices: 0 };
      byCust.set(r.custId, c);
    }
    c.months[r.bucket] = (c.months[r.bucket] || 0) + (r.amt || 0);
    c.total += r.amt || 0;
    c.invoices += r.invoices || 0;
  }

  const cols = fyMonthOrder([...buckets]);
  const customers = [...byCust.values()].sort((a, b) => b.total - a.total);

  const subTotal = { months: {}, total: 0, invoices: 0 };
  for (const c of customers) {
    for (const k of cols) subTotal.months[k] = (subTotal.months[k] || 0) + (c.months[k] || 0);
    subTotal.total += c.total;
    subTotal.invoices += c.invoices;
  }

  return { cols, customers, subTotal };
}

/* Two modes:
   - Standalone page (no props): owns its fetch, filters and FiltersBar.
   - Embedded in SalesDashboard (props.data present): the dashboard already
     fetched with its own filters, so this component only renders. No second
     FiltersBar, no duplicate request. */
function AgentPerformanceInner(props = {}) {
  const embedded = props.data !== undefined;
  const own = useAgentPerformance(!embedded);
  const data       = embedded ? (props.data || []) : own.data;
  const totals     = embedded ? (props.totals || { target: 0, achieved: 0, invoices: 0, pct: 0 }) : own.totals;
  const months     = embedded ? (props.months || 1) : own.months;
  const unassigned = embedded ? (props.unassigned ?? null) : own.unassigned;
  const bounds     = own.bounds;
  const loading    = embedded ? !!props.loading : own.loading;
  const error      = embedded ? props.error : own.error;
  const refetch    = own.refetch;

  /* Only the dropdown lists are needed here — using useSalesDashboard() would
     also pull ~15,000 sales rows that this page never uses. */
  const [filterLists, setFilterLists] = useState(EMPTY_LISTS);
  useEffect(() => {
    if (embedded) return undefined;          // dashboard's FiltersBar already has the lists
    let alive = true;
    fetchSalesDashboardFilters()
      .then((res) => { if (alive && res?.success) setFilterLists(res.data || EMPTY_LISTS); })
      .catch(() => { /* page must keep working even if filter lists fail to load */ });
    return () => { alive = false; };
  }, [embedded]);

  const [ownFilters, setFilters] = useState({
    state: "", city: "", cust: "", grp: "", item: "", gen: "",
    orderStatus: "", payTerms: "", from: "", to: "",
  });
  const filters = embedded ? (props.filters || ownFilters) : ownFilters;

  /* Date bounds come from the backend (agent-performance response) — this page
     has no raw rows from which min/max could be derived. */
  const dateBounds = useMemo(
    () => ({ min: bounds?.minDt || "", max: bounds?.maxDt || "" }),
    [bounds?.minDt, bounds?.maxDt]
  );

  useEffect(() => {
    if (embedded) return;
    if (dateBounds.min && !filters.from) {
      setFilters((f) => ({ ...f, from: dateBounds.min, to: dateBounds.max }));
    }
  }, [dateBounds.min, embedded]); // eslint-disable-line react-hooks/exhaustive-deps

  const queryParams = useMemo(() => ({
    from_date: filters.from || undefined,
    to_date:   filters.to || undefined,
    state:     filters.state || undefined,
    city:      filters.city || undefined,
    cust:      filters.cust || undefined,
    grp:       filters.grp || undefined,
    item:      filters.item || undefined,
  }), [filters.from, filters.to, filters.state, filters.city, filters.cust, filters.grp, filters.item]);

  /* Aggregation happens in SQL; raw rows never reach the browser. So every
     filter change refetches from the server — client-side filtering is not possible. */
  const timer = useRef(null);
  useEffect(() => {
    if (embedded || !filters.from) return undefined;   // embedded: SalesDashboard refetches
    clearTimeout(timer.current);
    timer.current = setTimeout(() => refetch(queryParams), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [queryParams, refetch, filters.from, embedded]);

  /* ---- drill-down ---- */
  const [expanded, setExpanded] = useState(null);
  const [drill, setDrill] = useState({});

  /* Filter signature is part of the cache key — otherwise expanding an agent and
     then changing a filter kept showing stale customer data. */
  const filterSig = useMemo(() => JSON.stringify(queryParams), [queryParams]);

  useEffect(() => {
    setDrill({});          // filters changed — previous drill data is invalid
    setExpanded(null);
  }, [filterSig]);

  const toggle = useCallback(async (agent) => {
    if (expanded === agent.id) { setExpanded(null); return; }
    setExpanded(agent.id);

    if (drill[agent.id]?.rows) return;   // already loaded for the current filters

    setDrill((d) => ({ ...d, [agent.id]: { loading: true } }));
    try {
      const res = await fetchAgentCustomers({ agentId: agent.id, ...queryParams });
      setDrill((d) => ({
        ...d,
        [agent.id]: res?.success
          ? { rows: res.data || [] }
          : { error: res?.message || "Failed to load customers" },
      }));
    } catch (err) {
      setDrill((d) => ({ ...d, [agent.id]: { error: err.message } }));
    }
  }, [expanded, drill, queryParams]);

  /* ---- export (format: "csv" | "xlsx", from the FiltersBar menu) ---- */
  const exportCsv = useCallback((format = "csv") => {
    if (!data.length) return;
    exportRows({ format, name: `agent_performance${rangeSuffix(filters)}`, sheet: "Agent Performance", columns: AGENT_EXPORT_COLS, rows: data });
  }, [data, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- chart ---- */
  const chart = useMemo(() => ({
    labels: data.map((a) => a.name),
    datasets: [
      { label: "Target", data: data.map((a) => a.periodTarget), backgroundColor: "#cbd5e1", borderRadius: 6, barPercentage: 0.7 },
      { label: "Achieved", data: data.map((a) => a.achieved),
        backgroundColor: data.map((a) => (a.pct >= 100 ? "#10b981" : a.pct >= 90 ? "#0ea5e9" : a.pct >= 75 ? "#f59e0b" : "#f43f5e")),
        borderRadius: 6, barPercentage: 0.7 },
    ],
  }), [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 }, color: "#64748b" } },
      tooltip: {
        backgroundColor: "#0f172a", padding: 10, cornerRadius: 8, displayColors: true,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${inrS(ctx.parsed.y)}` },
      },
    },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#64748b" } },
    },
  };

  const shortfall = totals.target - totals.achieved;

  return (
    <div className={embedded ? "w-full" : "h-full w-full overflow-y-auto bg-slate-50/50 pb-12"}>
      {!embedded && <Toaster />}
      {!embedded && (
      <div className={`sticky top-0 z-30 space-y-2 bg-slate-50/95 pb-2 pt-2 backdrop-blur sm:pt-3 ${PAGE_PX}`}>
        <FiltersBar
          title="Agent Performance"
          filters={filters}
          setFilters={setFilters}
          filterLists={filterLists}
          rows={[]}
          dateBounds={dateBounds}
          recordCount={data.length}
          lastFetched={null}
          loading={loading}
          onRefresh={() => refetch(queryParams)}
          onExport={exportCsv}
          tab="sales"
        />
      </div>
      )}

      <div className={embedded ? "w-full" : `w-full pt-3 sm:pt-4 ${PAGE_PX}`}>
        {error && !embedded && (   /* embedded: SalesDashboard shows the error banner */
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-start">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-800">Unable to load data</p>
              <p className="mt-0.5 break-words text-[13px] text-rose-600">{error}</p>
            </div>
            <button
              onClick={() => refetch(queryParams)}
              className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Skeleton only on first load. Replacing the whole content on every
            filter change would hide the filter bar and drop the user's focus. */}
        {loading && !data.length ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* ---- Overall summary ---- */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard label="Total Target" value={inrS(totals.target)} sub={`${months} month${months > 1 ? "s" : ""}`} />
              <SummaryCard label="Achieved" value={inrS(totals.achieved)} sub={`${(totals.invoices || 0).toLocaleString("en-IN")} invoices`} />
              <SummaryCard
                label="Attainment"
                value={`${(totals.pct || 0).toFixed(1)}%`}
                sub={shortfall <= 0 ? `${inrS(Math.abs(shortfall))} above target` : `${inrS(shortfall)} short`}
                tone={totals.pct >= 100 ? "good" : totals.pct >= 90 ? "ok" : "bad"}
              />
              <SummaryCard
                label="Agents On Target"
                value={`${data.filter((a) => a.pct >= 100).length} / ${data.length}`}
                sub={`${data.filter((a) => a.pct < 75).length} critical`}
              />
            </div>

            {unassigned?.achieved > 0 && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-[12.5px] text-slate-600">
                  <span className="font-semibold">{inrS(unassigned.achieved)}</span> of business is not assigned to any agent
                  {unassigned.invoices > 0 && ` (${unassigned.invoices.toLocaleString("en-IN")} invoices)`} — it is not counted towards any agent's target.
                </p>
              </div>
            )}

            {/* ---- Target vs Achieved ---- */}
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Target className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Target vs Achievement</h4>
                <ExportMenu className="ml-auto" title="Target vs Achievement" columns={AGENT_EXPORT_COLS} rows={data} filters={filters} />
              </div>
              <div style={{ height: 280 }}>
                {data.length ? <Bar data={chart} options={chartOptions} /> : <Empty />}
              </div>
            </div>

            {/* ---- Agent list ---- */}
            <div className="space-y-2.5">
              {data.map((a) => {
                const st = STATUS[a.status] || STATUS.Critical;
                const isOpen = expanded === a.id;
                const d = drill[a.id] || {};

                return (
                  <div key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      onClick={() => toggle(a)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:px-5 sm:py-4"
                    >
                      <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-bold text-slate-800">{a.name}</span>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${st.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {a.status}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-2 max-w-[320px] flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${st.bar} transition-all`} style={{ width: `${Math.min(100, a.pct)}%` }} />
                          </div>
                          <span className="shrink-0 text-[11.5px] font-bold text-slate-600">{a.pct.toFixed(1)}%</span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {inrS(a.achieved)} of {inrS(a.periodTarget)}
                          <span className="hidden sm:inline"> · {a.customers} customers · {a.invoices} invoices</span>
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right md:block">
                        <div className={`inline-flex items-center gap-1 text-[13px] font-bold ${a.gap >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {a.gap >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {inrS(Math.abs(a.gap))}
                        </div>
                        <p className="text-[10.5px] text-slate-400">{a.gap >= 0 ? "above target" : "short"}</p>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
                        {d.loading && (
                          <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs font-medium">Loading customers…</span>
                          </div>
                        )}
                        {d.error && <p className="py-6 text-center text-[13px] text-rose-600">{d.error}</p>}
                        {d.rows && <CustomerMatrix rows={d.rows} agentName={a.name} />}
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && data.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white py-16">
                  <Empty label="No agents configured" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- customer x month table, same layout as the legacy report ---- */
const CustomerMatrix = memo(function CustomerMatrix({ rows, agentName }) {
  const { cols, customers, subTotal } = useMemo(() => pivot(rows), [rows]);
  const [limit, setLimit] = useState(20);

  if (!customers.length) return <Empty label="No sales in this period" />;

  const shown = customers.slice(0, limit);
  const exportCols = [
    { key: "cust", label: "Customer" },
    { key: "city", label: "City" },
    ...cols.map((k) => ({ key: (c) => c.months[k] || 0, label: monthLabel(k), type: "num" })),
    { key: "total", label: "Total (₹)", type: "num" },
    { key: "invoices", label: "Invoices", type: "int" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[12.5px]">
          <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-slate-400">
            <tr>
              {/* sticky — otherwise the customer name scrolls out of view when
                  scrolling horizontally across month columns */}
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">Customer</th>
              <th className="px-3 py-2.5">City</th>
              {cols.map((k) => (
                <th key={k} className="whitespace-nowrap px-3 py-2.5 text-right">{monthLabel(k)}</th>
              ))}
              <th className="px-3 py-2.5 text-right font-bold text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {shown.map((c) => (
              <tr key={c.custId} className="transition-colors hover:bg-indigo-50/40">
                <td className="sticky left-0 z-10 max-w-[190px] truncate bg-white px-3 py-2 font-medium text-slate-800" title={c.cust}>
                  {c.cust}
                </td>
                <td className="px-3 py-2 text-slate-500">{c.city || "—"}</td>
                {cols.map((k) => (
                  <td key={k} className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {c.months[k] ? inr(c.months[k]) : <span className="text-slate-200">–</span>}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-800">{inr(c.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-amber-50">
              <td className="sticky left-0 z-10 bg-amber-50 px-3 py-2.5 font-bold text-slate-700">Sub Total</td>
              <td className="px-3 py-2.5" />
              {cols.map((k) => (
                <td key={k} className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-700">
                  {subTotal.months[k] ? inr(subTotal.months[k]) : "–"}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-slate-900">{inr(subTotal.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[11px] text-slate-400">{shown.length} of {customers.length} customers</p>
        <div className="flex items-center gap-1.5">
        <ExportMenu title={`Agent Customers - ${agentName || "agent"}`} id={`agent-matrix:${agentName}`} columns={exportCols} rows={customers} variant="button" />
        {shown.length < customers.length && (
          <button
            onClick={() => setLimit((l) => l + 30)}
            className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Show more
          </button>
        )}
        </div>
      </div>
    </div>
  );
});

function SummaryCard({ label, value, sub, tone }) {
  const color =
    tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-500" : tone === "ok" ? "text-sky-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-extrabold leading-none ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Empty({ label = "No data for current filters" }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 py-8 text-slate-300">
      <Inbox className="h-7 w-7" strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

export default function AgentPerformance(props) {
  /* Standalone: own registry so the FiltersBar "All charts" export works here too.
     Embedded: SalesDashboard already provides one. */
  if (props && props.data !== undefined) return <AgentPerformanceInner {...props} />;
  return (
    <ExportRegistryProvider>
      <AgentPerformanceInner {...(props || {})} />
    </ExportRegistryProvider>
  );
}

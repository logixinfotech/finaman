import { useMemo, useState, useEffect, memo } from "react";
import { Bar } from "react-chartjs-2";
import { FlaskConical, Inbox, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { inrS } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  titleColor: "#f8fafc",
  bodyColor: "#e2e8f0",
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
  titleFont: { weight: "700", size: 12 },
  bodyFont: { size: 12 },
};

const METRICS = [
  { key: "amt",    label: "Value",  fmt: inrS },
  { key: "qty",    label: "Qty",    fmt: (v) => Math.round(v).toLocaleString("en-IN") },
  { key: "orders", label: "Orders", fmt: (v) => v.toLocaleString("en-IN") },
];
const CHART_N = 10;
const EXPORT_COLS = [
  { key: "gen",    label: "Generic" },
  { key: "amt",    label: "Value (₹)", type: "num" },
  { key: "qty",    label: "Qty", type: "int" },
  { key: "orders", label: "Orders", type: "int" },
  { key: "custs",  label: "Customers", type: "int" },
  { key: "share",  label: "Share %", type: "pct" },
];
const PAGE_SIZE = 10;

function buildGenerics(rows) {
  const m = new Map();
  let blank = 0;

  for (const r of rows) {
    const g = (r.gen || "").trim();
    if (!g) { blank++; continue; }

    let e = m.get(g);
    if (!e) { e = { gen: g, amt: 0, qty: 0, ordSet: new Set(), custSet: new Set() }; m.set(g, e); }
    e.amt += r.amt || 0;
    e.qty += r.qo || 0;
    if (r.ord) e.ordSet.add(r.ord);
    e.custSet.add(r.custId ?? r.cust);
  }

  const list = [...m.values()].map((e) => ({
    gen: e.gen,
    amt: e.amt,
    qty: e.qty,
    orders: e.ordSet.size,
    custs: e.custSet.size,
  }));

  const total = list.reduce((s, e) => s + e.amt, 0);
  return { list, total, blank, distinct: list.length };
}

function GenericAnalysis({ rows }) {
  const [metric, setMetric] = useState("amt");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { list, total, blank, distinct } = useMemo(() => buildGenerics(rows), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    const base = needle ? list.filter((e) => e.gen.toUpperCase().includes(needle)) : list;
    return [...base].sort((a, b) => b[metric] - a[metric]);
  }, [list, q, metric]);

  // Back to page 1 whenever the list itself changes (search, metric, filters)
  useEffect(() => setPage(1), [filtered]);

  const active = METRICS.find((mm) => mm.key === metric);
  const exportRows = useMemo(() => filtered.map((e) => ({ ...e, share: total > 0 ? (e.amt / total) * 100 : 0 })), [filtered, total]);
  const chartRows = useMemo(() => filtered.slice(0, CHART_N), [filtered]);
  const max = chartRows[0]?.[metric] || 1;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const firstIdx = (safePage - 1) * PAGE_SIZE;

  const data = useMemo(() => ({
    labels: chartRows.map((e) => (e.gen.length > 22 ? e.gen.slice(0, 20) + "…" : e.gen)),
    datasets: [{
      data: chartRows.map((e) => e[metric]),
      backgroundColor: "#0ea5b7",
      hoverBackgroundColor: "#3ecbdc",
      borderRadius: 6,
      barThickness: 14,
    }],
  }), [chartRows, metric]);

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => active.fmt(ctx.parsed.x) } },
    },
    scales: {
      x: { ticks: { callback: (v) => active.fmt(v), font: { size: 10 }, color: "#94a3b8", maxTicksLimit: 5 }, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#64748b" } },
    },
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {/* ---- header ---- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="truncate text-[13px] font-bold tracking-tight text-slate-700">Generic-wise Analysis</h4>
          <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 sm:inline">
            {distinct.toLocaleString("en-IN")} generics
          </span>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-[170px] sm:flex-none">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && q && (e.stopPropagation(), setQ(""))}
              placeholder="Search generic…"
              className={`h-8 w-full rounded-md border border-slate-200 bg-white pl-7 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 ${q ? "pr-7" : "pr-2"}`}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                title="Clear"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="tablist">
            {METRICS.map((mm) => (
              <button
                key={mm.key}
                type="button"
                role="tab"
                aria-selected={metric === mm.key}
                onClick={() => setMetric(mm.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  metric === mm.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mm.label}
              </button>
            ))}
          </div>
          <ExportMenu title="Generic-wise Analysis" columns={EXPORT_COLS} rows={exportRows} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-slate-300">
          <Inbox className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs font-medium text-slate-400">
            {q ? "No generic matches this search" : "No data for current filters"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* ---- chart: top 10 by the selected metric ---- */}
          <div className="lg:col-span-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Top {chartRows.length} by {active.label}
            </p>
            <div style={{ height: 300 }}>
              <Bar data={data} options={options} />
            </div>
          </div>

          {/* ---- table: full list, paginated ---- */}
          <div className="min-w-0 lg:col-span-3">
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-slate-50/80 text-[10.5px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="w-8 px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2">Generic</th>
                    <th className="px-3 py-2 text-right">Value</th>
                    <th className="hidden px-3 py-2 text-right sm:table-cell">Qty</th>
                    <th className="hidden px-3 py-2 text-right md:table-cell">Orders</th>
                    <th className="hidden px-3 py-2 text-right md:table-cell">Customers</th>
                    <th className="px-3 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageRows.map((e, i) => (
                    <tr key={e.gen} className="transition-colors hover:bg-cyan-50/40">
                      <td className="px-3 py-2 text-right tabular-nums text-slate-400">{firstIdx + i + 1}</td>
                      <td className="max-w-[160px] truncate px-3 py-2 font-medium text-slate-800 sm:max-w-[260px]" title={e.gen}>
                        {e.gen}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-slate-700">{inrS(e.amt)}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 sm:table-cell">
                        {Math.round(e.qty).toLocaleString("en-IN")}
                      </td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 md:table-cell">{e.orders}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 md:table-cell">{e.custs}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                            {total > 0 ? ((e.amt / total) * 100).toFixed(1) : "0.0"}%
                          </span>
                          <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 sm:block">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                              style={{ width: `${Math.min(100, (e[metric] / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                {firstIdx + 1}–{firstIdx + pageRows.length} of {filtered.length.toLocaleString("en-IN")}
                {blank > 0 && (
                  <span className="text-slate-400"> · {blank.toLocaleString("en-IN")} lines without generic name</span>
                )}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="tabular-nums">
                    <span className="font-semibold text-slate-700">{safePage}</span> / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(GenericAnalysis);
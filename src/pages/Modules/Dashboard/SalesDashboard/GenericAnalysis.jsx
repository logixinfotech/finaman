import { useMemo, useState, memo } from "react";
import { Bar } from "react-chartjs-2";
import { FlaskConical, Inbox, Search } from "lucide-react";
import { inrS } from "../../../../utils/helpers";

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

/* Ek pass me sab kuch: generic-wise value, qty, order count, customer count.
   3792 distinct generics hain — poore set pe multiple passes mehnga padta. */
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

function GenericAnalysis({ rows, n = 12 }) {
  const [metric, setMetric] = useState("amt");
  const [q, setQ] = useState("");

  const { list, total, blank, distinct } = useMemo(() => buildGenerics(rows), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    const base = needle ? list.filter((e) => e.gen.toUpperCase().includes(needle)) : list;
    return [...base].sort((a, b) => b[metric] - a[metric]);
  }, [list, q, metric]);

  const top = useMemo(() => filtered.slice(0, n), [filtered, n]);
  const active = METRICS.find((mm) => mm.key === metric);
  const max = top[0]?.[metric] || 1;

  const data = {
    labels: top.map((e) => (e.gen.length > 22 ? e.gen.slice(0, 20) + "…" : e.gen)),
    datasets: [{
      data: top.map((e) => e[metric]),
      backgroundColor: "#0ea5b7",
      hoverBackgroundColor: "#3ecbdc",
      borderRadius: 8,
      barThickness: 16,
    }],
  };

  const options = {
    indexAxis: "y",           // horizontal — generic naam lambe hote hain
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => active.fmt(ctx.parsed.x) } },
    },
    scales: {
      x: { ticks: { callback: (v) => active.fmt(v), font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#64748b" } },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Generic-wise Analysis</h4>
          <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 sm:inline">
            {distinct.toLocaleString("en-IN")} generics
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-[120px] sm:w-[150px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search generic..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            />
          </div>
          <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5">
            {METRICS.map((mm) => (
              <button
                key={mm.key}
                onClick={() => setMetric(mm.key)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  metric === mm.key ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {mm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-slate-300">
          <Inbox className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs font-medium text-slate-400">
            {q ? "Is search se koi generic nahi mila" : "No data for current filters"}
          </span>
        </div>
      ) : (
        <>
          <div style={{ height: Math.max(220, top.length * 26) }} className="mb-4">
            <Bar data={data} options={options} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 sm:px-4">Generic</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">Value</th>
                  <th className="hidden px-4 py-2.5 text-right sm:table-cell">Qty</th>
                  <th className="hidden px-4 py-2.5 text-right md:table-cell">Orders</th>
                  <th className="hidden px-4 py-2.5 text-right md:table-cell">Customers</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {top.map((e) => (
                  <tr key={e.gen} className="transition-colors hover:bg-cyan-50/40">
                    <td className="max-w-[180px] truncate px-3 py-2.5 font-medium text-slate-800 sm:max-w-none sm:px-4" title={e.gen}>
                      {e.gen}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-700 sm:px-4">{inrS(e.amt)}</td>
                    <td className="hidden px-4 py-2.5 text-right text-slate-500 sm:table-cell">
                      {Math.round(e.qty).toLocaleString("en-IN")}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right text-slate-500 md:table-cell">{e.orders}</td>
                    <td className="hidden px-4 py-2.5 text-right text-slate-500 md:table-cell">{e.custs}</td>
                    <td className="px-3 py-2.5 text-right sm:px-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {total > 0 ? ((e.amt / total) * 100).toFixed(1) : "0.0"}%
                        </span>
                        <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                            style={{ width: `${(e[metric] / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 text-[11px] text-slate-400">
            Showing top {top.length} of {filtered.length.toLocaleString("en-IN")}
            {blank > 0 && ` · ${blank.toLocaleString("en-IN")} lines without generic name`}
          </p>
        </>
      )}
    </div>
  );
}

export default memo(GenericAnalysis);
import { useMemo, useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Calendar, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { buildPeriodSeries, periodLabel, inrS } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";

const PERIOD_TAB = [
  { key: "W", label: "Weekly" },
  { key: "M", label: "Monthly" },
  { key: "Q", label: "Quarterly" },
  { key: "F", label: "FY" },
  { key: "Y", label: "Cal. Yr" },
];
const ROW_STEP = 12;
const EXPORT_COLS = [
  { key: "period", label: "Period" },
  { key: "amt",    label: "Sales (₹)", type: "num" },
  { key: "gst",    label: "GST (₹)",   type: "num" },
  { key: "qty",    label: "Qty",       type: "int" },
  { key: "inv",    label: "Invoices",  type: "int" },
  { key: "growth", label: "Growth %",  type: "pct" },
];

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

export default function PeriodReport({ rows }) {
  const [tab, setTab] = useState("M");
  const [limit, setLimit] = useState(ROW_STEP);
  const { keys, m, growth } = useMemo(() => buildPeriodSeries(rows, tab), [rows, tab]);

  // Reset the row cap when the period changes, so Weekly doesn't open with 60 rows.
  useEffect(() => setLimit(ROW_STEP), [tab]);

  const data = useMemo(() => ({
    labels: keys.map((k) => periodLabel(k, tab)),
    datasets: [{
      data: keys.map((k) => m[k].amt),
      backgroundColor: "#6366f1",
      hoverBackgroundColor: "#a5b4fc",
      borderRadius: 6,
      maxBarThickness: 28,
    }],
  }), [keys, m, tab]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8", maxTicksLimit: 14 } },
    },
  };

  // Newest period first in the table
  const rowsDesc = useMemo(() => keys.map((k, i) => ({ k, g: growth[i] })).reverse(), [keys, growth]);
  const shown = rowsDesc.slice(0, limit);

  /* export: every period of the active view (newest first), not only the shown rows */
  const exportRows = useMemo(
    () => rowsDesc.map(({ k, g }) => ({ period: periodLabel(k, tab), amt: m[k].amt, gst: m[k].gst, qty: m[k].qty, inv: m[k].inv.size, growth: g })),
    [rowsDesc, m, tab]
  );
  const exportTitle = `Period Report - ${PERIOD_TAB.find((t) => t.key === tab)?.label || tab}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Period Report</h4>
        </div>
        <div className="flex items-center gap-1.5">
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="tablist">
          {PERIOD_TAB.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ExportMenu title={exportTitle} id="period-report" columns={EXPORT_COLS} rows={exportRows} />
        </div>
      </div>

      {/* Chart left, table right on lg+; stacked on small screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3" style={{ height: 240 }}>
          {keys.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-300">
              <Inbox className="h-7 w-7" strokeWidth={1.5} />
              <span className="text-xs font-medium text-slate-400">No data for current filters</span>
            </div>
          ) : (
            <Bar data={data} options={options} />
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[360px] text-left text-xs">
              <thead className="bg-slate-50/80 text-[10.5px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-1.5">Period</th>
                  <th className="px-3 py-1.5 text-right">Sales</th>
                  <th className="hidden px-3 py-1.5 text-right sm:table-cell">GST</th>
                  <th className="px-3 py-1.5 text-right">Inv</th>
                  <th className="px-3 py-1.5 text-right">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shown.map(({ k, g }) => (
                  <tr key={k} className="transition-colors hover:bg-indigo-50/40">
                    <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-800">{periodLabel(k, tab)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{inrS(m[k].amt)}</td>
                    <td className="hidden px-3 py-1.5 text-right tabular-nums text-slate-500 sm:table-cell">{inrS(m[k].gst)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{m[k].inv.size}</td>
                    <td className="px-3 py-1.5 text-right">
                      {g == null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums ${
                            g >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {g >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(g).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rowsDesc.length > ROW_STEP && (
            <div className="mt-1.5 flex items-center justify-between px-1">
              <span className="text-[10.5px] text-slate-400">{shown.length} of {rowsDesc.length} periods</span>
              {shown.length < rowsDesc.length ? (
                <button type="button" onClick={() => setLimit((l) => l + ROW_STEP)} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                  Show more
                </button>
              ) : (
                <button type="button" onClick={() => setLimit(ROW_STEP)} className="text-[11px] font-semibold text-slate-500 hover:underline">
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
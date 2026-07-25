import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Calendar, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { buildPeriodSeries, periodLabel, inrS } from "../../../../utils/helpers";

const TABS = [
  { key: "W", label: "Weekly" },
  { key: "M", label: "Monthly" },
  { key: "Y", label: "Yearly" },
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
  const { keys, m, growth } = useMemo(() => buildPeriodSeries(rows, tab), [rows, tab]);

  const data = {
    labels: keys.map((k) => periodLabel(k, tab)),
    datasets: [{
      data: keys.map((k) => m[k].amt),
      backgroundColor: "#6366f1",
      hoverBackgroundColor: "#a5b4fc",
      borderRadius: 8,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { font: { size: 10.5 }, color: "#94a3b8" } },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Period Report</h4>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 260 }} className="mb-4">
        {keys.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-300">
            <Inbox className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-xs font-medium text-slate-400">No data for current filters</span>
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2.5">Period</th>
              <th className="px-4 py-2.5">Sales</th>
              <th className="px-4 py-2.5">GST</th>
              <th className="px-4 py-2.5">Invoices</th>
              <th className="px-4 py-2.5">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {keys.slice().reverse().map((k, ridx) => {
              const i = keys.length - 1 - ridx;
              const g = growth[i];
              return (
                <tr key={k} className="transition-colors hover:bg-indigo-50/40">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{periodLabel(k, tab)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{inrS(m[k].amt)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{inrS(m[k].gst)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{m[k].inv.size}</td>
                  <td className="px-4 py-2.5">
                    {g == null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          g >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {g >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(g).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
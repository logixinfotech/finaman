import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { buildPeriodSeries, periodLabel, inrS } from "../../../../utils/helpers";

const TABS = [
  { key: "W", label: "Weekly" },
  { key: "M", label: "Monthly" },
  { key: "Y", label: "Yearly" },
];

export default function PeriodReport({ rows }) {
  const [tab, setTab] = useState("M");
  const { keys, m, growth } = useMemo(() => buildPeriodSeries(rows, tab), [rows, tab]);

  const data = {
    labels: keys.map((k) => periodLabel(k, tab)),
    datasets: [{ data: keys.map((k) => m[k].amt), backgroundColor: "#4f46e5", borderRadius: 6 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: { y: { ticks: { callback: (v) => inrS(v) }, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Period Report</h4>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
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
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No data for current filters</div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-slate-100">
            <tr>
              <th className="py-2 pr-4">Period</th>
              <th className="py-2 pr-4">Sales</th>
              <th className="py-2 pr-4">GST</th>
              <th className="py-2 pr-4">Invoices</th>
              <th className="py-2 pr-4">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {keys.slice().reverse().map((k, ridx) => {
              const i = keys.length - 1 - ridx;
              const g = growth[i];
              return (
                <tr key={k} className="hover:bg-slate-50/60">
                  <td className="py-2 pr-4 font-medium text-slate-800">{periodLabel(k, tab)}</td>
                  <td className="py-2 pr-4">{inrS(m[k].amt)}</td>
                  <td className="py-2 pr-4">{inrS(m[k].gst)}</td>
                  <td className="py-2 pr-4">{m[k].inv.size}</td>
                  <td className="py-2 pr-4">
                    {g == null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className={`font-semibold ${g >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {g >= 0 ? "▲" : "▼"} {Math.abs(g).toFixed(1)}%
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

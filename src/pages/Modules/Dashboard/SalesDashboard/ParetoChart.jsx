import { useMemo, memo } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip,
} from "chart.js";
import { CardShell } from "./ChartCards";
import { buildPareto } from "../../../../utils/orderHelpers";
import { inr, inrS } from "../../../../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

const CLASS_COLOR = { A: "#16a34a", B: "#f59e0b", C: "#94a3b8" };

function ParetoChart({ rows, n = 40, onClassed }) {
  const classed = useMemo(() => buildPareto(rows), [rows]);
  const shown = useMemo(() => classed.slice(0, n), [classed, n]);

  // let parent (Combined View table) reuse the same A/B/C classification
  useMemo(() => {
    if (onClassed) {
      const map = {};
      classed.forEach((c) => { map[c.custId ?? c.name] = c.cls; });
      onClassed(map);
    }
  }, [classed, onClassed]);

  const tot = classed.reduce((s, c) => s + c.amt, 0) || 1;
  const summary = { A: { n: 0, amt: 0 }, B: { n: 0, amt: 0 }, C: { n: 0, amt: 0 } };
  classed.forEach((c) => { summary[c.cls].n++; summary[c.cls].amt += c.amt; });

  const data = {
    labels: shown.map((c) => (c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name)),
    datasets: [
      {
        type: "bar",
        data: shown.map((c) => c.amt),
        backgroundColor: shown.map((c) => CLASS_COLOR[c.cls]),
        borderRadius: 6,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line",
        data: shown.map((c) => c.cumPct),
        borderColor: "#7c3aed",
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#7c3aed",
        tension: 0.3,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.dataset.type === "line" ? ` Cumulative: ${ctx.parsed.y.toFixed(1)}%` : ` ${inr(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: (v) => inrS(v) }, grid: { color: "#f1f5f9" } },
      y1: { position: "right", min: 0, max: 100, ticks: { callback: (v) => v + "%" }, grid: { display: false } },
      x: { ticks: { font: { size: 9.5 }, maxRotation: 60, minRotation: 40 }, grid: { display: false } },
    },
  };

  return (
    <CardShell title="ABC Analysis — Pareto 80/20">
      <div style={{ height: 300 }}>
        <Chart type="bar" data={data} options={options} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
        {["A", "B", "C"].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ background: CLASS_COLOR[k] }} />
            Class {k}: {summary[k].n} customers · {inrS(summary[k].amt)} ({((summary[k].amt / tot) * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </CardShell>
  );
}

export default memo(ParetoChart);
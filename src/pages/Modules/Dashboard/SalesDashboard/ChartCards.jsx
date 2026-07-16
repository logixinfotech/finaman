import { useMemo } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Filler,
} from "chart.js";
import { by, topN, inrS } from "../../../../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler);

const PALETTE = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

export function CardShell({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">{title}</h4>
      {children}
    </div>
  );
}

// Horizontal bar for Top Cities / Top Customers / Top Products / Qty
export function TopBarChart({ title, rows, keyFn, valFn, n = 10, height = 280 }) {
  const entries = useMemo(() => topN(by(rows, keyFn, valFn), n), [rows]);
  const data = {
    labels: entries.map(([k]) => (k.length > 26 ? k.slice(0, 24) + "…" : k)),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: "#4f46e5", borderRadius: 6, barThickness: 16 }],
  };
  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { callbacks: { label: (ctx) => inrS(ctx.parsed.x) } } },
    scales: { x: { ticks: { callback: (v) => inrS(v) }, grid: { color: "#f1f5f9" } }, y: { grid: { display: false } } },
  };
  return (
    <CardShell title={title}>
      <div style={{ height }}>
        {entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}
      </div>
    </CardShell>
  );
}

// Vertical bar for State-wise sales
export function StateBarChart({ rows, n = 12, height = 280 }) {
  const entries = useMemo(() => topN(by(rows, (r) => r.state || "Unknown", (r) => r.amt), n), [rows]);
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: "#0ea5e9", borderRadius: 6 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: { y: { ticks: { callback: (v) => inrS(v) }, grid: { color: "#f1f5f9" } }, x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } } },
  };
  return (
    <CardShell title="State-wise Sales">
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}</div>
    </CardShell>
  );
}

// Daily sales trend (line + fill)
export function TrendChart({ rows, height = 280 }) {
  const grouped = useMemo(() => {
    const m = by(rows, (r) => r.dt, (r) => r.amt);
    return Object.entries(m).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }, [rows]);

  const data = {
    labels: grouped.map(([d]) => d.slice(5).split("-").reverse().join("/")),
    datasets: [{
      data: grouped.map(([, v]) => v),
      borderColor: "#4f46e5",
      backgroundColor: "rgba(79,70,229,0.08)",
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: { y: { ticks: { callback: (v) => inrS(v) }, grid: { color: "#f1f5f9" } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } } },
  };
  return (
    <CardShell title="Daily Sales Trend" className="lg:col-span-2">
      <div style={{ height }}>{grouped.length === 0 ? <EmptyState /> : <Line data={data} options={options} />}</div>
    </CardShell>
  );
}

// Product group mix (doughnut)
export function GroupMixChart({ rows, height = 280 }) {
  const entries = useMemo(() => topN(by(rows, (r) => r.grp || "Other", (r) => r.amt), 8), [rows]);
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: PALETTE, borderWidth: 0 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${inrS(ctx.parsed)}` } } },
    cutout: "62%",
  };
  return (
    <CardShell title="Product Group Mix">
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Doughnut data={data} options={options} />}</div>
    </CardShell>
  );
}

function EmptyState() {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">No data for current filters</div>;
}

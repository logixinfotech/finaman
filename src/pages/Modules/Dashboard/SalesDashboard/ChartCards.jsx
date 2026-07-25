import { useMemo } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Filler,
} from "chart.js";
import { TrendingUp, MapPin, Layers, PieChart as PieIcon } from "lucide-react";
import { by, topN, inrS } from "../../../../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler);

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

/* ---------- accent presets — one distinct identity per chart type ---------- */
const ACCENTS = {
  indigo: { chip: "bg-indigo-50 text-indigo-600", ring: "hover:ring-indigo-100", bar: "#6366f1", barSoft: "#a5b4fc" },
  sky:    { chip: "bg-sky-50 text-sky-600",       ring: "hover:ring-sky-100",    bar: "#0ea5e9", barSoft: "#7dd3fc" },
  violet: { chip: "bg-violet-50 text-violet-600", ring: "hover:ring-violet-100", bar: "#8b5cf6", barSoft: "#c4b5fd" },
  emerald:{ chip: "bg-emerald-50 text-emerald-600", ring: "hover:ring-emerald-100", bar: "#10b981", barSoft: "#6ee7b7" },
  amber:  { chip: "bg-amber-50 text-amber-600",   ring: "hover:ring-amber-100",  bar: "#f59e0b", barSoft: "#fcd34d" },
  rose:   { chip: "bg-rose-50 text-rose-600",     ring: "hover:ring-rose-100",   bar: "#f43f5e", barSoft: "#fda4af" },
  teal:   { chip: "bg-teal-50 text-teal-600",     ring: "hover:ring-teal-100",   bar: "#14b8a6", barSoft: "#5eead4" },
};

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

/* ---------- shared card shell with colored icon chip + hover lift ---------- */
export function CardShell({ title, icon: Icon, accent = "indigo", children, className = "" }) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  return (
    <div
      className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${a.ring} ${className}`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.chip}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}
        <h4 className="text-[13px] font-bold tracking-tight text-slate-700">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// Horizontal bar for Top Cities / Top Customers / Top Products / Qty
export function TopBarChart({ title, rows, keyFn, valFn, n = 10, height = 280, valueFormatter, accent = "indigo", icon = TrendingUp }) {
  const entries = useMemo(() => topN(by(rows, keyFn, valFn), n), [rows]);
  const fmt = valueFormatter || inrS; // default stays ₹ — every existing call site is unaffected
  const a = ACCENTS[accent] || ACCENTS.indigo;
  const data = {
    labels: entries.map(([k]) => (k.length > 26 ? k.slice(0, 24) + "…" : k)),
    datasets: [{
      data: entries.map(([, v]) => v),
      backgroundColor: a.bar,
      hoverBackgroundColor: a.barSoft,
      borderRadius: 8,
      barThickness: 16,
    }],
  };
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },   // ← yahan bhi
    tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } },
  },
  scales: {
    y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
    x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, color: "#94a3b8" } },
  },
};
  return (
    <CardShell title={title} icon={icon} accent={accent}>
      <div style={{ height }}>
        {entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}
      </div>
    </CardShell>
  );
}

// Vertical bar for State-wise sales
export function StateBarChart({ rows, n = 12, height = 280, accent = "sky" }) {
  const entries = useMemo(() => topN(by(rows, (r) => r.state || "Unknown", (r) => r.amt), n), [rows]);
  const a = ACCENTS[accent] || ACCENTS.sky;
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: a.bar, hoverBackgroundColor: a.barSoft, borderRadius: 8 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    
     plugins: {
    legend: { display: false },   // ← yahan bhi
    tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } },
  },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, color: "#94a3b8" } },
    },
  };
  return (
    <CardShell title="State-wise Sales" icon={MapPin} accent={accent}>
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}</div>
    </CardShell>
  );
}

// Daily sales trend (line + fill)
export function TrendChart({ rows, height = 280, accent = "violet", className = "" }) {
  const grouped = useMemo(() => {
    const m = by(rows, (r) => r.dt, (r) => r.amt);
    return Object.entries(m).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }, [rows]);
  const a = ACCENTS[accent] || ACCENTS.violet;

  const data = {
    labels: grouped.map(([d]) => d.slice(5).split("-").reverse().join("/")),
    datasets: [{
      data: grouped.map(([, v]) => v),
      borderColor: a.bar,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return "transparent";
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, `${a.bar}33`);
        g.addColorStop(1, `${a.bar}00`);
        return g;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: a.bar,
      pointHoverBorderWidth: 2.5,
      borderWidth: 2.5,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } } },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10.5 }, color: "#94a3b8" } },
    },
  };
  return (
    <CardShell title="Daily Sales Trend" icon={TrendingUp} accent={accent} className={className}>
      <div style={{ height }}>{grouped.length === 0 ? <EmptyState /> : <Line data={data} options={options} />}</div>
    </CardShell>
  );
}

// Product group mix (doughnut) — reusable for any category breakdown (group, pay terms, etc.)
export function GroupMixChart({ rows, height = 280, keyFn, title = "Product Group Mix", accent = "amber" }) {
  const groupFn = keyFn || ((r) => r.grp || "Other"); // default stays exactly as before
  const entries = useMemo(() => topN(by(rows, groupFn, (r) => r.amt), 8), [rows, groupFn]);
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: PALETTE, borderColor: "#fff", borderWidth: 3, hoverOffset: 6 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: "circle", font: { size: 10.5, weight: "600" }, color: "#64748b", padding: 12 } },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => `${ctx.label}: ${inrS(ctx.parsed)}` } },
    },
    cutout: "66%",
  };
  return (
    <CardShell title={title} icon={PieIcon} accent={accent}>
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Doughnut data={data} options={options} />}</div>
    </CardShell>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-300">
      <Layers className="h-7 w-7" strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate-400">No data for current filters</span>
    </div>
  );
}
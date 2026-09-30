import { useMemo, useState, useCallback } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Filler,
} from "chart.js";
import { TrendingUp, MapPin, Layers, PieChart as PieIcon } from "lucide-react";
import { by, topN, inrS } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";
import { COLS } from "./exportUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Filler);

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];
const ACCENTS = {
  indigo: { chip: "bg-indigo-50 text-indigo-600", ring: "hover:ring-indigo-100", bar: "#6366f1", barSoft: "#a5b4fc" },
  sky:    { chip: "bg-sky-50 text-sky-600",       ring: "hover:ring-sky-100",    bar: "#0ea5e9", barSoft: "#7dd3fc" },
  violet: { chip: "bg-violet-50 text-violet-600", ring: "hover:ring-violet-100", bar: "#8b5cf6", barSoft: "#c4b5fd" },
  emerald:{ chip: "bg-emerald-50 text-emerald-600", ring: "hover:ring-emerald-100", bar: "#10b981", barSoft: "#6ee7b7" },
  amber:  { chip: "bg-amber-50 text-amber-600",   ring: "hover:ring-amber-100",  bar: "#f59e0b", barSoft: "#fcd34d" },
  rose:   { chip: "bg-rose-50 text-rose-600",     ring: "hover:ring-rose-100",   bar: "#f43f5e", barSoft: "#fda4af" },
  teal:   { chip: "bg-teal-50 text-teal-600",     ring: "hover:ring-teal-100",   bar: "#14b8a6", barSoft: "#5eead4" },
};

/* ---- cross-filter: click a bar / slice -> apply that value as a filter, click again to clear.
   filterKey: "state" | "city" | "cust" | "grp" | "item". State also clears city (same rule as the map). */
const UNFILTERABLE = new Set(["Unknown", "Other", "—", ""]);
function useChartFilter(filters, setFilters, filterKey) {
  const enabled = !!(setFilters && filterKey);
  const onSelect = useCallback((key) => {
    if (!enabled || UNFILTERABLE.has(key)) return;
    setFilters((f) => {
      const clear = f[filterKey] === key;
      return { ...f, [filterKey]: clear ? "" : key, ...(filterKey === "state" ? { city: "" } : {}) };
    });
  }, [enabled, setFilters, filterKey]);
  const active = enabled && filters ? filters[filterKey] : "";
  return { enabled, onSelect, active };
}

function ClickHint({ enabled, active, onClear, noun = "bar" }) {
  if (!enabled) return null;
  return (
    <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-400">
      <span>{active ? "Filtered by this chart" : `Click a ${noun} to filter`}</span>
      {active && (
        <button type="button" onClick={onClear} className="font-semibold text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Clear
        </button>
      )}
    </div>
  );
}

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

/* `actions` renders on the right side of the card header (e.g. a view switch). */
export function CardShell({ title, icon: Icon, accent = "indigo", actions, exportSpec, children, className = "" }) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  /* exportSpec: { columns, rows, id?, filters? } — adds the CSV/Excel menu to the header */
  const right = (actions || exportSpec) && (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      {actions}
      {exportSpec && <ExportMenu title={title} {...exportSpec} />}
    </div>
  );
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
        <h4 className="min-w-0 truncate text-[13px] font-bold tracking-tight text-slate-700">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}
 
function SegmentedSwitch({ options, value, onChange }) {
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? (idx + 1) % options.length : (idx - 1 + options.length) % options.length;
    onChange(options[next].key);
  };
  return (
    <div role="tablist" onKeyDown={onKeyDown} className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.key)}
            className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              on ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
 
function RankedBar({ entries, fmt, accent, height, onSelect }) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  const clickable = typeof onSelect === "function";
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
      legend: { display: false },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => fmt(ctx.parsed.y), footer: () => (clickable ? "Click to filter" : "") } },
    },
    scales: {
      y: { ticks: { callback: (v) => fmt(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, color: "#94a3b8" } },
    },
    ...(clickable && {
      onClick: (_e, els) => { if (els.length) onSelect(entries[els[0].index][0]); },   // full key, not the truncated label
      onHover: (e, els) => { if (e.native?.target) e.native.target.style.cursor = els.length ? "pointer" : "default"; },
    }),
  };
  return (
    <div style={{ height }}>
      {entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}
    </div>
  );
}

export function TopBarChart({ title, rows, keyFn, valFn, n = 10, height = 280, valueFormatter, accent = "indigo", icon = TrendingUp, exportKeyLabel = "Name", filters, setFilters, filterKey }) {
  const entries = useMemo(() => topN(by(rows, keyFn, valFn), n), [rows, keyFn, valFn, n]);
  const cf = useChartFilter(filters, setFilters, filterKey);
  const fmt = valueFormatter || inrS; // default stays ₹ — every existing call site is unaffected
  const exportSpec = useMemo(() => ({ columns: (valueFormatter ? COLS.keyQty : COLS.keyAmt)(exportKeyLabel), rows: entries }), [entries, valueFormatter, exportKeyLabel]);
  return (
    <CardShell title={title} icon={icon} accent={accent} exportSpec={exportSpec}>
      <RankedBar entries={entries} fmt={fmt} accent={accent} height={height} onSelect={cf.enabled ? cf.onSelect : undefined} />
      <ClickHint enabled={cf.enabled} active={cf.active} onClear={() => cf.onSelect(cf.active)} />
    </CardShell>
  );
}
 
export function SwitchBarChart({ views, height = 280, accent = "indigo", icon = TrendingUp, filters, setFilters }) {
  const [active, setActive] = useState(views[0]?.key);
  const view = views.find((v) => v.key === active) || views[0];
  const n = view.n ?? 10;
  const entries = useMemo(() => topN(by(view.rows, view.keyFn, view.valFn), n), [view.rows, view.keyFn, view.valFn, n]);
  const fmt = view.valueFormatter || inrS;
  const acc = view.accent || accent;
  const cf = useChartFilter(filters, setFilters, view.filterKey);
  /* export follows the active view — the user gets exactly what the chart is showing */
  const exportSpec = useMemo(() => ({
    columns: (view.valueFormatter ? COLS.keyQty : COLS.keyAmt)(view.exportKeyLabel || view.label),
    rows: entries,
    id: `switch:${views.map((v) => v.key).join("|")}`,
  }), [entries, view, views]);
  return (
    <CardShell
      title={view.title}
      icon={view.icon || icon}
      accent={acc}
      actions={<SegmentedSwitch options={views} value={view.key} onChange={setActive} />}
      exportSpec={exportSpec}
    >
      <RankedBar entries={entries} fmt={fmt} accent={acc} height={height} onSelect={cf.enabled ? cf.onSelect : undefined} />
      <ClickHint enabled={cf.enabled} active={cf.active} onClear={() => cf.onSelect(cf.active)} />
    </CardShell>
  );
}

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
      legend: { display: false },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => inrS(ctx.parsed.y) } },
    },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 10 }, color: "#94a3b8" } },
    },
  };
  const exportSpec = useMemo(() => ({ columns: COLS.keyAmt("State"), rows: entries }), [entries]);
  return (
    <CardShell title="State-wise Sales" icon={MapPin} accent={accent} exportSpec={exportSpec}>
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Bar data={data} options={options} />}</div>
    </CardShell>
  );
}

/* Auto granularity: the wider the date range, the coarser the buckets.
   Title follows the bucket so it never says "Daily" for a two-year range. */
const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function trendGranularity(rows) {
  let min = "", max = "";
  for (const r of rows) { if (!r.dt) continue; if (!min || r.dt < min) min = r.dt; if (!max || r.dt > max) max = r.dt; }
  if (!min) return "day";
  const days = (new Date(max) - new Date(min)) / 86400000;
  return days <= 62 ? "day" : days <= 400 ? "week" : "month";
}
function trendKey(dt, gran) {
  if (gran === "month") return dt.slice(0, 7);
  if (gran === "week") {
    const [y, m, d] = dt.split("-").map(Number);
    const x = new Date(y, m - 1, d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  return dt;
}
function trendLabel(k, gran) {
  if (gran === "month") { const [y, m] = k.split("-"); return `${MN[+m - 1]} ${y.slice(2)}`; }
  const [, m, d] = k.split("-");
  return gran === "week" ? `Wk ${d}/${m}` : `${d}/${m}`;
}
const TREND_TITLE = { day: "Daily Sales Trend", week: "Weekly Sales Trend", month: "Monthly Sales Trend" };
const TREND_COL   = { day: "Date", week: "Week Starting", month: "Month" };

export function TrendChart({ rows, height = 280, accent = "violet", className = "" }) {
  const gran = useMemo(() => trendGranularity(rows), [rows]);
  const grouped = useMemo(() => {
    const m = by(rows, (r) => (r.dt ? trendKey(r.dt, gran) : ""), (r) => r.amt);
    delete m[""];
    return Object.entries(m).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }, [rows, gran]);
  const a = ACCENTS[accent] || ACCENTS.violet;

  const data = {
    labels: grouped.map(([k]) => trendLabel(k, gran)),
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
      pointRadius: gran === "day" ? 0 : 3,
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
  const exportSpec = useMemo(() => ({
    columns: [
      { key: 0, label: TREND_COL[gran], type: gran === "month" ? "text" : "date" },
      { key: 1, label: "Sales (₹)", type: "num" },
    ],
    rows: grouped,
    id: "sales-trend",
  }), [grouped, gran]);

  return (
    <CardShell
      title={TREND_TITLE[gran]}
      icon={TrendingUp}
      accent={accent}
      className={className}
      exportSpec={exportSpec}
      actions={<span className="hidden text-[10.5px] text-slate-400 sm:inline">{grouped.length} {gran === "day" ? "days" : gran === "week" ? "weeks" : "months"}</span>}
    >
      <div style={{ height }}>{grouped.length === 0 ? <EmptyState /> : <Line data={data} options={options} />}</div>
    </CardShell>
  );
}

export function GroupMixChart({ rows, height = 280, keyFn, title = "Product Group Mix", accent = "amber", filters, setFilters, filterKey }) {
  const groupFn = keyFn || ((r) => r.grp || "Other"); // default stays exactly as before
  const entries = useMemo(() => topN(by(rows, groupFn, (r) => r.amt), 8), [rows, groupFn]);
  const cf = useChartFilter(filters, setFilters, filterKey);
  const data = {
    labels: entries.map(([k]) => k),
    datasets: [{ data: entries.map(([, v]) => v), backgroundColor: PALETTE, borderColor: "#fff", borderWidth: 3, hoverOffset: 6 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: "circle", font: { size: 10.5, weight: "600" }, color: "#64748b", padding: 12 } },
      tooltip: { ...TOOLTIP_STYLE, callbacks: { label: (ctx) => `${ctx.label}: ${inrS(ctx.parsed)}`, footer: () => (cf.enabled ? "Click to filter" : "") } },
    },
    cutout: "66%",
    ...(cf.enabled && {
      onClick: (_e, els) => { if (els.length) cf.onSelect(entries[els[0].index][0]); },
      onHover: (e, els) => { if (e.native?.target) e.native.target.style.cursor = els.length ? "pointer" : "default"; },
    }),
  };
  const exportSpec = useMemo(() => {
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    return {
      columns: [
        { key: 0, label: title.replace(/ Mix$/, ""), },
        { key: 1, label: "Amount (₹)", type: "num" },
        { key: ([, v]) => (v / total) * 100, label: "Share %", type: "pct" },
      ],
      rows: entries,
    };
  }, [entries, title]);
  return (
    <CardShell title={title} icon={PieIcon} accent={accent} exportSpec={exportSpec}>
      <div style={{ height }}>{entries.length === 0 ? <EmptyState /> : <Doughnut data={data} options={options} />}</div>
      <ClickHint enabled={cf.enabled} active={cf.active} onClear={() => cf.onSelect(cf.active)} noun="slice" />
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

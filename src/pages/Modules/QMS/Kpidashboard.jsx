import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaTachometerAlt, FaSyncAlt, FaSearch, FaFileCsv, FaPrint, FaTable, FaThLarge,
  FaSort, FaSortUp, FaSortDown, FaChevronDown, FaChevronRight, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaBullseye, FaDatabase, FaFolderOpen, FaHourglassHalf,
  FaCompressAlt, FaExpandAlt, FaCalendarAlt, FaLayerGroup, FaTimes,
} from "react-icons/fa";
import { ChartCard, KpiCard } from "./Components/Charts.jsx";
import { getKpiDashboard } from "./Utils/QmsAPI.js";

/* ══════════════════════════════════════════════════════════════════════════
   QMS — KPI DASHBOARD
   API contract (Utils/QmsAPI → getKpiDashboard(from, to)):
   {
     success: true,
     asOf: "2026-08-20T10:12:00",
     rows: [{
       key: "deviation", label: "Deviation",
       total, open, closed, overdue,
       dueIn7,                 // target date within next 7 days, still open
       aged30, aged60,         // open records older than 30 / 60 days
       critical,               // Critical / Major count (optional)
       closureRate,            // % — optional, warna total/closed se derive
       avgClosureDays,         // number | null
       onTimePct,              // % | null
       trend: [3,5,2,6,4,7]    // last 6 months created — optional
     }]
   }
   ══════════════════════════════════════════════════════════════════════════ */

const CAT = {
  events: "Quality Events",
  action: "Corrective & Change",
  docs: "Documents & Training",
  equip: "Equipment & Facility",
  product: "Product & Batch",
  vendor: "Vendor & Material",
  gov: "Governance",
};

// key → label + category. Key wahi rakhen jo API bhejta hai.
const MODULE_META = [
  { key: "deviation", label: "Deviation", cat: CAT.events },
  { key: "incident", label: "Incident", cat: CAT.events },
  { key: "complaint", label: "Market Complaint", cat: CAT.events },
  { key: "recall", label: "Product Recall", cat: CAT.events },
  { key: "oos", label: "OOS — Out of Specification", cat: CAT.events },
  { key: "oot", label: "OOT — Out of Trend", cat: CAT.events },
  { key: "capa", label: "CAPA", cat: CAT.action },
  { key: "changecontrol", label: "Change Control", cat: CAT.action },
  { key: "risk", label: "Risk Assessment (ICH Q9)", cat: CAT.action },
  { key: "dms", label: "Document Management (DMS)", cat: CAT.docs },
  { key: "stp", label: "STP Register", cat: CAT.docs },
  { key: "training", label: "Training Management", cat: CAT.docs },
  { key: "calibration", label: "Instrument Calibration", cat: CAT.equip },
  { key: "qualification", label: "Qualification Planner", cat: CAT.equip },
  { key: "pm", label: "Preventive Maintenance", cat: CAT.equip },
  { key: "env", label: "Environmental Monitoring", cat: CAT.equip },
  { key: "cleaning", label: "Cleaning & Sanitation", cat: CAT.equip },
  { key: "processvalidation", label: "Process Validation", cat: CAT.product },
  { key: "batchrelease", label: "Batch Release", cat: CAT.product },
  { key: "apqr", label: "Annual Product Quality Review", cat: CAT.product },
  { key: "reservesample", label: "Control / Reserve Sample", cat: CAT.product },
  { key: "returnedgoods", label: "Returned Goods & Salvage", cat: CAT.product },
  { key: "supplier", label: "Supplier Qualification", cat: CAT.vendor },
  { key: "customer", label: "Customer Qualification", cat: CAT.vendor },
  { key: "material", label: "Material Qualification", cat: CAT.vendor },
  { key: "audit", label: "Audit Management", cat: CAT.gov },
  { key: "mgmtreview", label: "Management Review", cat: CAT.gov },
  { key: "health", label: "Personnel Health Register", cat: CAT.gov },
];

const CAT_ORDER = Object.values(CAT);
const META_BY_KEY = Object.fromEntries(MODULE_META.map((m) => [m.key, m]));

const TONE = { good: "#2f9e7e", warn: "#c98a2e", bad: "#c25a5a", neutral: "#64748b" };
const SOFT = { good: "#e8f5f0", warn: "#fdf4e6", bad: "#fbeded", neutral: "#f1f5f9" };

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };
const num = (v) => (v == null || v === "" ? null : Number(v));
const dash = (v, s = "") => (v == null ? "—" : `${v}${s}`);

const RANGES = [{ label: "3M", m: 3 }, { label: "6M", m: 6 }, { label: "1Y", m: 12 }, { label: "2Y", m: 24 }];

/* ── Compliance health score — 0..100 ──
   closure 40% + on-time 30% − overdue penalty − 60-day ageing penalty */
function healthOf(r) {
  if (!r.total) return { score: null, tone: "neutral", text: "No data" };
  const closure = r.closureRate ?? 0;
  const onTime = r.onTimePct ?? closure;
  const overduePen = (r.overdue / Math.max(1, r.total)) * 100 * 0.45;
  const agedPen = ((r.aged60 || 0) / Math.max(1, r.total)) * 100 * 0.25;
  const score = Math.max(0, Math.min(100, Math.round(closure * 0.4 + onTime * 0.3 + 30 - overduePen - agedPen)));
  const tone = score >= 80 ? "good" : score >= 55 ? "warn" : "bad";
  const text = tone === "good" ? "Healthy" : tone === "warn" ? "Watch" : "Critical";
  return { score, tone, text };
}

/* ════════════════════════ small pieces ════════════════════════ */

const Chip = ({ tone = "neutral", children, title }) => (
  <span title={title}
        className="text-[9.5px] font-bold px-2 py-[2px] rounded-full whitespace-nowrap"
        style={{ background: SOFT[tone], color: TONE[tone] }}>
    {children}
  </span>
);

function Sparkline({ data = [], color = "#3b6fd4", w = 76, h = 22 }) {
  if (!data.length) return <span className="text-[10px] text-[#cbd5e1]">—</span>;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 3) - 1.5}`);
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6"
                strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2" fill={color} />
    </svg>
  );
}

function RateBar({ value }) {
  if (value == null) return <span className="text-[11px] text-[#cbd5e1]">—</span>;
  const tone = value >= 80 ? "good" : value >= 50 ? "warn" : "bad";
  return (
    <div className="flex items-center gap-2">
      <div className="w-[52px] h-[6px] rounded-full bg-[#eef2f8] overflow-hidden shrink-0">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: TONE[tone] }} />
      </div>
      <span className="text-[11px] font-bold text-[#1e293b] w-[32px]">{value}%</span>
    </div>
  );
}

/* half-circle gauge — overall plant quality health */
function HealthGauge({ score }) {
  const v = score ?? 0;
  const tone = score == null ? "neutral" : v >= 80 ? "good" : v >= 55 ? "warn" : "bad";
  const R = 62, C = Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[150px] h-[84px] shrink-0">
        <svg viewBox="0 0 150 84" className="w-full h-full">
          <path d={`M13,75 A${R},${R} 0 0 1 137,75`} fill="none" stroke="#eef2f8" strokeWidth="13" strokeLinecap="round" />
          <path d={`M13,75 A${R},${R} 0 0 1 137,75`} fill="none" stroke={TONE[tone]} strokeWidth="13"
                strokeLinecap="round" strokeDasharray={`${(v / 100) * C} ${C}`}
                style={{ transition: "stroke-dasharray .8s ease-out" }} />
        </svg>
        <div className="absolute inset-x-0 bottom-[2px] flex flex-col items-center">
          <span className="text-[26px] font-bold leading-[26px] tracking-[-0.6px]" style={{ color: TONE[tone] }}>
            {score == null ? "—" : v}
          </span>
          <span className="text-[8.5px] uppercase tracking-[0.5px] text-[#94a3b8]">Health score</span>
        </div>
      </div>
      <ul className="text-[10.5px] text-[#64748b] leading-[17px] list-disc pl-4">
        <li>Closure rate — weight 40%</li>
        <li>On-time closure — weight 30%</li>
        <li>Overdue &amp; 60-day ageing — penalty</li>
      </ul>
    </div>
  );
}

/* ════════════════════════ page ════════════════════════ */

export default function KpiDashboardPage({ onOpenModule }) {
  const [from, setFrom] = useState(monthsAgo(12));
  const [to, setTo] = useState(today());
  const [range, setRange] = useState(12);
  const [raw, setRaw] = useState([]);
  const [asOf, setAsOf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [view, setView] = useState("table");        // table | cards
  const [dense, setDense] = useState(true);
  const [grouped, setGrouped] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [focus, setFocus] = useState("all");        // all | attention | overdue | open
  const [sort, setSort] = useState({ key: "total", dir: "desc" });

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await getKpiDashboard(from, to);
      if (r?.success) { setRaw(r.rows || []); setAsOf(r.asOf || new Date().toISOString()); }
      else { setRaw([]); setErr("Server did not return KPI data."); }
    } catch {
      setRaw([]); setErr("Could not reach the QMS server. Check the connection and refresh.");
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const pickRange = (m) => { setRange(m); setFrom(monthsAgo(m)); setTo(today()); };

  /* ── normalise + enrich ── */
  const rows = useMemo(() => raw.map((r) => {
    const meta = META_BY_KEY[r.key] || {};
    const total = Number(r.total) || 0;
    const closed = Number(r.closed) || 0;
    const open = r.open != null ? Number(r.open) : Math.max(0, total - closed);
    const closureRate = r.closureRate != null ? Math.round(r.closureRate) : (total ? Math.round((closed / total) * 100) : null);
    const o = {
      key: r.key,
      label: r.label || meta.label || r.key,
      cat: meta.cat || "Other",
      total, open, closed,
      overdue: Number(r.overdue) || 0,
      dueIn7: Number(r.dueIn7) || 0,
      aged30: Number(r.aged30) || 0,
      aged60: Number(r.aged60) || 0,
      critical: Number(r.critical) || 0,
      closureRate,
      avgClosureDays: num(r.avgClosureDays),
      onTimePct: num(r.onTimePct),
      trend: Array.isArray(r.trend) ? r.trend.map(Number) : [],
    };
    return { ...o, health: healthOf(o) };
  }), [raw]);

  /* ── roll-ups ── */
  const totals = useMemo(() => {
    const t = rows.reduce((a, r) => ({
      total: a.total + r.total, open: a.open + r.open, closed: a.closed + r.closed,
      overdue: a.overdue + r.overdue, dueIn7: a.dueIn7 + r.dueIn7, aged60: a.aged60 + r.aged60,
    }), { total: 0, open: 0, closed: 0, overdue: 0, dueIn7: 0, aged60: 0 });

    const withAvg = rows.filter((r) => r.avgClosureDays != null && r.closed > 0);
    const avg = withAvg.length
      ? Math.round(withAvg.reduce((a, r) => a + r.avgClosureDays * r.closed, 0) / withAvg.reduce((a, r) => a + r.closed, 0))
      : null;
    const withOt = rows.filter((r) => r.onTimePct != null && r.closed > 0);
    const onTime = withOt.length
      ? Math.round(withOt.reduce((a, r) => a + r.onTimePct * r.closed, 0) / withOt.reduce((a, r) => a + r.closed, 0))
      : null;

    const scored = rows.filter((r) => r.health.score != null);
    const health = scored.length ? Math.round(scored.reduce((a, r) => a + r.health.score, 0) / scored.length) : null;

    return { ...t, closureRate: t.total ? Math.round((t.closed / t.total) * 100) : null, avg, onTime, health };
  }, [rows]);

  const attention = useMemo(
    () => rows.filter((r) => r.health.tone === "bad" || r.overdue > 0 || r.aged60 > 0)
              .sort((a, b) => (b.overdue - a.overdue) || ((a.health.score ?? 100) - (b.health.score ?? 100)))
              .slice(0, 4),
    [rows]
  );

  /* ── filter + sort ── */
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (needle && !r.label.toLowerCase().includes(needle) && !r.cat.toLowerCase().includes(needle)) return false;
      if (focus === "attention" && r.health.tone !== "bad") return false;
      if (focus === "overdue" && !r.overdue) return false;
      if (focus === "open" && !r.open) return false;
      return true;
    });
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = key === "label" ? a.label : key === "health" ? (a.health.score ?? -1) : (a[key] ?? -1);
      const bv = key === "label" ? b.label : key === "health" ? (b.health.score ?? -1) : (b[key] ?? -1);
      if (typeof av === "string") return av.localeCompare(bv) * mul;
      return (av - bv) * mul;
    });
    return out;
  }, [rows, q, focus, sort]);

  const groups = useMemo(() => {
    if (!grouped) return [["", visible]];
    const map = new Map();
    visible.forEach((r) => { if (!map.has(r.cat)) map.set(r.cat, []); map.get(r.cat).push(r); });
    return [...map.entries()].sort((a, b) => CAT_ORDER.indexOf(a[0]) - CAT_ORDER.indexOf(b[0]));
  }, [visible, grouped]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "label" ? "asc" : "desc" }));

  const exportCsv = () => {
    const head = ["Category", "Module", "Total", "Open", "Closed", "Overdue", "Due in 7d", ">30d", ">60d",
                  "Closure Rate %", "Avg Closure Days", "On-Time %", "Health"];
    const body = visible.map((r) => [r.cat, r.label, r.total, r.open, r.closed, r.overdue, r.dueIn7,
      r.aged30, r.aged60, r.closureRate ?? "", r.avgClosureDays ?? "", r.onTimePct ?? "", r.health.score ?? ""]);
    const csv = [head, ...body].map((line) =>
      line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `QMS_KPI_${from}_to_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const rowH = dense ? "h-[30px]" : "h-[38px]";
  const SortIcon = ({ k }) => sort.key !== k
    ? <FaSort className="text-[8px] opacity-25" />
    : sort.dir === "asc" ? <FaSortUp className="text-[8px] text-[#3b6fd4]" /> : <FaSortDown className="text-[8px] text-[#3b6fd4]" />;

  const Th = ({ k, children, right, w }) => (
    <th style={{ width: w }}
        className={`px-[9px] py-[7px] text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b]
                    select-none cursor-pointer hover:text-[#3b6fd4] ${right ? "text-right" : "text-left"}`}
        onClick={() => toggleSort(k)}>
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        {children}<SortIcon k={k} />
      </span>
    </th>
  );

  return (
    <div className="h-full w-full bg-[#f4f6fb] overflow-y-auto scrollbar-hide">
      <div className="p-[12px] flex flex-col gap-[11px] max-w-[1600px] mx-auto">

        {/* ═══════════ HEADER + CONTROLS ═══════════ */}
        <div className="bg-white border border-[#dce6f7] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-[16px] py-[11px] flex flex-wrap items-center gap-3 border-b border-[#f0f3f8]">
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f4fb] flex items-center justify-center shrink-0">
              <FaTachometerAlt className="text-[13px] text-[#3b6fd4]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1e293b] leading-[19px]">KPI Dashboard — Quality Metrics</h2>
              <p className="text-[10.5px] text-[#94a3b8] leading-[13px]">
                {rows.length} modules · {new Date(from).toLocaleDateString("en-IN")} — {new Date(to).toLocaleDateString("en-IN")}
                {asOf && ` · updated ${new Date(asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => setView(view === "table" ? "cards" : "table")}
                      title={view === "table" ? "Switch to cards" : "Switch to table"}
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b]
                                 hover:border-[#3b6fd4] hover:text-[#3b6fd4] flex items-center justify-center">
                {view === "table" ? <FaThLarge className="text-[11px]" /> : <FaTable className="text-[11px]" />}
              </button>
              <button onClick={() => setDense(!dense)} title={dense ? "Comfortable rows" : "Compact rows"}
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b]
                                 hover:border-[#3b6fd4] hover:text-[#3b6fd4] flex items-center justify-center">
                {dense ? <FaExpandAlt className="text-[10px]" /> : <FaCompressAlt className="text-[10px]" />}
              </button>
              <button onClick={exportCsv} title="Download CSV"
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b]
                                 hover:border-[#2f9e7e] hover:text-[#2f9e7e] flex items-center justify-center">
                <FaFileCsv className="text-[11px]" />
              </button>
              <button onClick={() => window.print()} title="Print"
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b]
                                 hover:border-[#3b6fd4] hover:text-[#3b6fd4] flex items-center justify-center">
                <FaPrint className="text-[11px]" />
              </button>
              <button onClick={load} disabled={loading}
                      className="h-[30px] px-[13px] text-[11.5px] font-semibold rounded-[6px] bg-[#3b6fd4]
                                 hover:bg-[#3260bd] text-white flex items-center gap-1.5 disabled:opacity-50">
                <FaSyncAlt className={`text-[10.5px] ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="px-[16px] py-[10px] bg-[#fafbfd] flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8] flex items-center gap-1">
                <FaCalendarAlt className="text-[8px]" /> Quick range
              </label>
              <div className="flex gap-[3px] p-[2px] bg-[#eef2f9] rounded-[6px]">
                {RANGES.map((r) => (
                  <button key={r.m} onClick={() => pickRange(r.m)}
                          className={`h-[26px] px-[13px] text-[11.5px] font-semibold rounded-[4px] transition-all ${
                            range === r.m ? "bg-white text-[#3b6fd4] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                                          : "text-[#64748b] hover:text-[#1e293b]"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">From</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRange(0); }}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRange(0); }}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
            </div>

            <div className="flex flex-col gap-[4px] min-w-[190px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">Find module</label>
              <div className="relative">
                <FaSearch className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[10px] text-[#b6c2d6]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a module name"
                       className="h-[30px] w-full pl-[27px] pr-[26px] text-[12.5px] border-[1.5px] border-[#dbe2ee]
                                  rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
                {q && (
                  <button onClick={() => setQ("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#b6c2d6] hover:text-[#64748b]">
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">Show</label>
              <div className="flex gap-[3px] p-[2px] bg-[#eef2f9] rounded-[6px]">
                {[["all", "All"], ["attention", "Needs attention"], ["overdue", "Has overdue"], ["open", "Open only"]].map(([k, l]) => (
                  <button key={k} onClick={() => setFocus(k)}
                          className={`h-[26px] px-[11px] text-[11px] font-semibold rounded-[4px] transition-all ${
                            focus === k ? "bg-white text-[#3b6fd4] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                                        : "text-[#64748b] hover:text-[#1e293b]"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-1.5 mb-[6px] cursor-pointer select-none">
              <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)}
                     className="accent-[#3b6fd4] w-[13px] h-[13px]" />
              <span className="text-[11px] text-[#64748b] font-medium flex items-center gap-1">
                <FaLayerGroup className="text-[9px]" /> Group by category
              </span>
            </label>
          </div>
        </div>

        {err && (
          <div className="bg-[#fbeded] border border-[#f0d2d2] text-[#a94848] rounded-[8px] px-[14px] py-[9px] text-[11.5px]">
            {err}
          </div>
        )}

        {/* ═══════════ KPI STRIP ═══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[9px]">
          <KpiCard label="Total Records" value={totals.total} icon={<FaDatabase />} hint={`${rows.length} modules`} />
          <KpiCard label="Open" value={totals.open} icon={<FaFolderOpen />} tone={totals.open > 0 ? "warn" : "good"}
                   hint={`${totals.aged60} beyond 60 days`} />
          <KpiCard label="Closed" value={totals.closed} icon={<FaCheckCircle />} tone="good"
                   hint={totals.closureRate != null ? `${totals.closureRate}% closure rate` : null} />
          <KpiCard label="Overdue Now" value={totals.overdue} icon={<FaExclamationTriangle />}
                   tone={totals.overdue > 0 ? "bad" : "good"} hint={totals.overdue ? "past target date" : "none pending"} />
          <KpiCard label="Due in 7 Days" value={totals.dueIn7} icon={<FaHourglassHalf />}
                   tone={totals.dueIn7 > 0 ? "warn" : "good"} hint="target date approaching" />
          <KpiCard label="On-Time Closure" value={totals.onTime} suffix="%" icon={<FaBullseye />}
                   tone={totals.onTime == null ? "neutral" : totals.onTime >= 90 ? "good" : totals.onTime >= 70 ? "warn" : "bad"}
                   hint={totals.avg != null ? `avg ${totals.avg} d to close` : "closed within target"} />
        </div>

        {/* ═══════════ HEALTH + ATTENTION ═══════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[11px]">
          <ChartCard title="Overall Quality Health" subtitle="Weighted across all active modules" icon={<FaBullseye />}>
            <HealthGauge score={totals.health} />
          </ChartCard>

          <ChartCard
            title="Needs Attention First"
            subtitle="Modules carrying overdue or long-pending records"
            icon={<FaExclamationTriangle />}
            className="xl:col-span-2"
            footer="Records open beyond 60 days generally require written justification during an inspection."
          >
            {attention.length === 0 ? (
              <div className="h-[110px] flex flex-col items-center justify-center gap-1">
                <FaCheckCircle className="text-[20px] text-[#2f9e7e] opacity-40" />
                <span className="text-[11px] text-[#94a3b8]">Nothing overdue. Every module is inside its target.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
                {attention.map((r) => (
                  <button key={r.key} onClick={() => onOpenModule?.(r.key)}
                          className="text-left border border-[#e3e8f0] rounded-[7px] px-[11px] py-[9px]
                                     hover:border-[#3b6fd4] hover:bg-[#fafbff] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-bold text-[#1e293b] truncate flex-1">{r.label}</span>
                      <Chip tone={r.health.tone}>{r.health.text}</Chip>
                    </div>
                    <div className="flex items-center gap-3 mt-[5px] text-[10px] text-[#64748b]">
                      <span><b className="text-[#c25a5a]">{r.overdue}</b> overdue</span>
                      <span><b className="text-[#c98a2e]">{r.aged60}</b> over 60 d</span>
                      <span><b className="text-[#1e293b]">{r.open}</b> open</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* ═══════════ MAIN TABLE ═══════════ */}
        {view === "table" ? (
          <div className="bg-white border border-[#dce6f7] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="px-[12px] h-[30px] bg-[#eef3fb] border-b border-[#dce6f7] flex items-center gap-[7px]">
              <FaTable className="text-[11px] text-[#3b6fd4]" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#2f63c4] flex-1">Module Metrics</h3>
              <span className="text-[10px] text-[#94a3b8]">{visible.length} of {rows.length} shown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1080px]">
                <thead className="bg-[#fafbfd] border-b border-[#e8edf6] sticky top-0 z-[1]">
                  <tr>
                    <Th k="label" w="24%">Module</Th>
                    <Th k="total" right w="6%">Total</Th>
                    <Th k="open" right w="6%">Open</Th>
                    <Th k="overdue" right w="7%">Overdue</Th>
                    <Th k="dueIn7" right w="7%">Due ≤7d</Th>
                    <Th k="aged60" right w="7%">&gt;60 d</Th>
                    <Th k="closureRate" w="12%">Closure rate</Th>
                    <Th k="avgClosureDays" right w="8%">Avg closure</Th>
                    <Th k="onTimePct" right w="8%">On-time</Th>
                    <th className="px-[9px] py-[7px] text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b] w-[9%]">6-month trend</th>
                    <Th k="health" w="9%">Health</Th>
                  </tr>
                </thead>

                {groups.map(([cat, list]) => {
                  const open = !collapsed[cat];
                  return (
                    <tbody key={cat || "all"}>
                      {grouped && cat && (
                        <tr className="bg-[#f7f9fd] border-y border-[#eef2f8] cursor-pointer"
                            onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}>
                          <td colSpan={11} className="px-[10px] py-[5px]">
                            <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#64748b] flex items-center gap-1.5">
                              {open ? <FaChevronDown className="text-[8px]" /> : <FaChevronRight className="text-[8px]" />}
                              {cat}
                              <span className="font-medium text-[#a8b4c8] normal-case tracking-normal">
                                · {list.length} modules · {list.reduce((a, r) => a + r.total, 0)} records
                              </span>
                            </span>
                          </td>
                        </tr>
                      )}

                      {open && list.map((r) => (
                        <tr key={r.key}
                            onClick={() => onOpenModule?.(r.key)}
                            className={`${rowH} border-b border-[#f2f5fa] hover:bg-[#f7faff] cursor-pointer transition-colors`}>
                          <td className="px-[9px]">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="w-[3px] h-[13px] rounded-full shrink-0" style={{ background: TONE[r.health.tone] }} />
                              <span className="text-[11.5px] font-semibold text-[#1e293b] truncate">{r.label}</span>
                              {r.critical > 0 && <Chip tone="bad" title="Critical / Major records">{r.critical} critical</Chip>}
                            </span>
                          </td>
                          <td className="px-[9px] text-right text-[11.5px] font-bold text-[#1e293b]">{r.total}</td>
                          <td className="px-[9px] text-right text-[11.5px] text-[#475569]">{r.open || "—"}</td>
                          <td className="px-[9px] text-right">
                            {r.overdue ? <Chip tone="bad">{r.overdue}</Chip> : <span className="text-[11px] text-[#cbd5e1]">0</span>}
                          </td>
                          <td className="px-[9px] text-right">
                            {r.dueIn7 ? <Chip tone="warn">{r.dueIn7}</Chip> : <span className="text-[11px] text-[#cbd5e1]">0</span>}
                          </td>
                          <td className="px-[9px] text-right text-[11.5px] font-semibold"
                              style={{ color: r.aged60 ? TONE.bad : "#cbd5e1" }}>{r.aged60 || 0}</td>
                          <td className="px-[9px]"><RateBar value={r.closureRate} /></td>
                          <td className="px-[9px] text-right text-[11.5px] text-[#475569]">{dash(r.avgClosureDays, " d")}</td>
                          <td className="px-[9px] text-right text-[11.5px] font-semibold"
                              style={{ color: r.onTimePct == null ? "#cbd5e1" : r.onTimePct >= 90 ? TONE.good : r.onTimePct >= 70 ? TONE.warn : TONE.bad }}>
                            {dash(r.onTimePct, "%")}
                          </td>
                          <td className="px-[9px]"><Sparkline data={r.trend} color={TONE[r.health.tone]} /></td>
                          <td className="px-[9px]">
                            <span className="flex items-center gap-1.5">
                              <Chip tone={r.health.tone}>{r.health.text}</Chip>
                              {r.health.score != null && (
                                <span className="text-[10px] font-bold text-[#94a3b8]">{r.health.score}</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  );
                })}
              </table>

              {!visible.length && !loading && (
                <div className="py-[34px] flex flex-col items-center gap-1.5">
                  <FaSearch className="text-[18px] text-[#cbd5e1]" />
                  <span className="text-[11.5px] text-[#94a3b8]">No module matches this filter. Clear the search or pick “All”.</span>
                </div>
              )}
            </div>

            <div className="px-[14px] py-[8px] bg-[#fafbfd] border-t border-[#f0f3f8] flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[9.5px] text-[#94a3b8] flex-1 min-w-[240px]">
                On-time closure = closed on or before target date. Metrics are computed live from records (ALCOA+ original data).
              </p>
              <span className="flex items-center gap-1.5 text-[9.5px] text-[#94a3b8]">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: TONE.good }} /> Healthy 80+
              </span>
              <span className="flex items-center gap-1.5 text-[9.5px] text-[#94a3b8]">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: TONE.warn }} /> Watch 55–79
              </span>
              <span className="flex items-center gap-1.5 text-[9.5px] text-[#94a3b8]">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: TONE.bad }} /> Critical below 55
              </span>
            </div>
          </div>
        ) : (
          /* ═══════════ CARD VIEW ═══════════ */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[9px]">
            {visible.map((r) => (
              <button key={r.key} onClick={() => onOpenModule?.(r.key)}
                      className="text-left bg-white border border-[#dce6f7] rounded-[8px] overflow-hidden
                                 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-[#3b6fd4] transition-colors">
                <div className="px-[11px] h-[28px] bg-[#eef3fb] border-b border-[#dce6f7] flex items-center gap-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#2f63c4] truncate flex-1">{r.label}</span>
                  <Chip tone={r.health.tone}>{r.health.score ?? "—"}</Chip>
                </div>
                <div className="px-[11px] py-[9px]">
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-[21px] font-bold text-[#1e293b] leading-[22px] tracking-[-0.4px]">{r.total}</div>
                      <div className="text-[9px] uppercase tracking-[0.5px] text-[#94a3b8]">records</div>
                    </div>
                    <div className="ml-auto"><Sparkline data={r.trend} color={TONE[r.health.tone]} w={64} /></div>
                  </div>
                  <div className="mt-[8px]"><RateBar value={r.closureRate} /></div>
                  <div className="flex items-center gap-2 mt-[8px] flex-wrap">
                    {r.overdue > 0 && <Chip tone="bad">{r.overdue} overdue</Chip>}
                    {r.dueIn7 > 0 && <Chip tone="warn">{r.dueIn7} due ≤7d</Chip>}
                    <Chip tone="neutral">{r.open} open</Chip>
                    {r.avgClosureDays != null && <Chip tone="neutral">{r.avgClosureDays} d avg</Chip>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaChartLine, FaChartPie, FaLayerGroup, FaHourglassHalf,
  FaBuilding, FaTrophy, FaSyncAlt, FaFolderOpen, FaCheckCircle,
  FaExclamationTriangle, FaClock, FaBullseye, FaDatabase, FaFilter,
} from "react-icons/fa";
import { ChartCard, KpiCard, TrendChart, DonutChart, BarList, SegmentBar } from "./Components/Charts.jsx";
import { getTrends, getTrendModules } from "./Utils/QmsAPI";

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

const RANGES = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "2Y", months: 24 },
];

const fmtRange = (f, t) => {
  const o = { day: "2-digit", month: "short", year: "numeric" };
  return `${new Date(f).toLocaleDateString("en-IN", o)} — ${new Date(t).toLocaleDateString("en-IN", o)}`;
};

export default function TrendingGraphsPage() {
  const [modules, setModules] = useState([]);
  const [moduleKey, setModuleKey] = useState("deviation");
  const [range, setRange] = useState(12);
  const [from, setFrom] = useState(monthsAgo(12));
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTrendModules().then((r) => setModules(r?.data || [])).catch(() => setModules([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getTrends(moduleKey, from, to);
      setData(r?.success ? r : null);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [moduleKey, from, to]);

  useEffect(() => { load(); }, [load]);

  const pickRange = (months) => {
    setRange(months);
    setFrom(monthsAgo(months));
    setTo(today());
  };

  const s = data?.summary || {};

  const closureRate = useMemo(
    () => (s.total ? Math.round((s.closed / s.total) * 100) : null),
    [s.total, s.closed]
  );

  const agedOver60 = useMemo(() => {
    const a = data?.ageing || [];
    return (a[3]?.count || 0) + (a[4]?.count || 0);
  }, [data]);

  // net backlog — created minus closed over the period
  const backlog = useMemo(() => {
    const m = data?.monthly || [];
    const c = m.reduce((a, x) => a + (Number(x.created) || 0), 0);
    const cl = m.reduce((a, x) => a + (Number(x.closed) || 0), 0);
    return c - cl;
  }, [data]);

  const isCustom = range === 0;

  return (
    <div className="h-full w-full bg-[#f4f6fb] overflow-y-auto scrollbar-hide">
      <div className="p-[12px] flex flex-col gap-[11px] max-w-[1600px] mx-auto">

        {/* ══════════ HEADER + CONTROLS ══════════ */}
        <div className="bg-white border border-[#e3e8f0] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden shrink-0">
          <div className="px-[16px] py-[11px] flex flex-wrap items-center gap-3 border-b border-[#f0f3f8]">
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f4fb] flex items-center justify-center shrink-0">
              <FaChartLine className="text-[13px] text-[#3b6fd4]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1e293b] leading-[19px]">Quality Trends & Analytics</h2>
              <p className="text-[10.5px] text-[#94a3b8] leading-[13px]">
                {data?.moduleName || "—"} · {fmtRange(from, to)}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {loading && (
                <span className="text-[10.5px] text-[#94a3b8] flex items-center gap-1.5">
                  <FaSyncAlt className="animate-spin text-[10px]" /> Loading…
                </span>
              )}
              <button onClick={load} disabled={loading}
                      className="h-[30px] px-[13px] text-[11.5px] font-semibold rounded-[6px]
                                 bg-[#3b6fd4] hover:bg-[#3260bd] text-white flex items-center gap-1.5
                                 disabled:opacity-50 transition-colors">
                <FaSyncAlt className={`text-[10.5px] ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="px-[16px] py-[10px] bg-[#fafbfd] flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-[4px] min-w-[210px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8] flex items-center gap-1">
                <FaDatabase className="text-[8px]" /> Module
              </label>
              <select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}
                      className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px]
                                 bg-white text-[#1e293b] outline-none focus:border-[#3b6fd4] cursor-pointer">
                {modules.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8] flex items-center gap-1">
                <FaFilter className="text-[8px]" /> Quick Range
              </label>
              <div className="flex gap-[3px] p-[2px] bg-[#eef2f9] rounded-[6px]">
                {RANGES.map((r) => (
                  <button key={r.months} onClick={() => pickRange(r.months)}
                          className={`h-[26px] px-[13px] text-[11.5px] font-semibold rounded-[4px] transition-all ${
                            range === r.months
                              ? "bg-white text-[#3b6fd4] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              : "text-[#64748b] hover:text-[#1e293b]"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">From</label>
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRange(0); }}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px]
                                bg-white outline-none focus:border-[#3b6fd4]" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRange(0); }}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px]
                                bg-white outline-none focus:border-[#3b6fd4]" />
            </div>

            {isCustom && (
              <span className="text-[10px] text-[#3b6fd4] font-semibold px-2 py-[3px] rounded-full bg-[#eef3fd] mb-[3px]">
                Custom range
              </span>
            )}
          </div>
        </div>

        {/* ══════════ KPI STRIP ══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-[9px] shrink-0">
          <KpiCard label="Total Records" value={s.total} icon={<FaDatabase />} />
          <KpiCard label="Open" value={s.open} icon={<FaFolderOpen />}
                   tone={s.open > 0 ? "warn" : "good"}
                   hint={backlog !== 0 ? `${backlog > 0 ? "+" : ""}${backlog} net this period` : "balanced"} />
          <KpiCard label="Closed" value={s.closed} icon={<FaCheckCircle />} tone="good"
                   hint={closureRate != null ? `${closureRate}% closure rate` : null} />
          <KpiCard label="Overdue Now" value={s.overdue} icon={<FaExclamationTriangle />}
                   tone={s.overdue > 0 ? "bad" : "good"}
                   hint={s.overdue > 0 ? "needs attention" : "none pending"} />
          <KpiCard label="Avg Closure" value={s.avgClosureDays} suffix="d" icon={<FaClock />}
                   tone={s.avgClosureDays == null ? "neutral" : s.avgClosureDays > 30 ? "warn" : "good"}
                   hint="from creation to closure" />
          <KpiCard label="On-Time Closure" value={s.onTimePct} suffix="%" icon={<FaBullseye />}
                   tone={s.onTimePct == null ? "neutral" : s.onTimePct >= 90 ? "good" : s.onTimePct >= 70 ? "warn" : "bad"}
                   hint="closed within target date" />
        </div>

        {/* ══════════ ROW 1 ══════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[11px] shrink-0">
          <ChartCard
            title="Monthly Trend"
            subtitle="Records created against records closed"
            icon={<FaChartLine />}
            className="xl:col-span-2"
            right={backlog !== 0 && (
              <span className={`text-[9.5px] font-bold px-2.5 py-[3px] rounded-full ${
                backlog > 0 ? "bg-[#fbeded] text-[#c25a5a]" : "bg-[#e8f5f0] text-[#2f9e7e]"}`}>
                {backlog > 0 ? `Backlog +${backlog}` : `Cleared ${Math.abs(backlog)}`}
              </span>
            )}
            footer="A rising gap between the two lines means records are being opened faster than they are closed."
          >
            <TrendChart
              data={data?.monthly || []}
              series={[
                { key: "created", label: "Created", color: "#3b6fd4" },
                { key: "closed", label: "Closed", color: "#2f9e7e" },
              ]}
            />
          </ChartCard>

          <ChartCard title="Status Distribution" subtitle="Where records currently sit" icon={<FaChartPie />}>
            <DonutChart data={data?.byStatus || []} centerLabel="Total" />
          </ChartCard>
        </div>

        {/* ══════════ ROW 2 ══════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[11px] shrink-0">
          <ChartCard
            title="Ageing of Open Records"
            subtitle="How long open records have been pending"
            icon={<FaHourglassHalf />}
            right={agedOver60 > 0 && (
              <span className="text-[9.5px] font-bold px-2.5 py-[3px] rounded-full bg-[#fbeded] text-[#c25a5a]">
                {agedOver60} over 60 days
              </span>
            )}
            footer="Records open beyond 30 days generally require written justification during an inspection."
          >
            <div className="mb-3">
              <SegmentBar data={data?.ageing || []} />
            </div>
            <BarList data={data?.ageing || []} useTone emptyText="No open records" labelWidth={70} />
          </ChartCard>

          <ChartCard
            title="By Classification / Severity"
            subtitle="Breakdown by criticality"
            icon={<FaLayerGroup />}
          >
            <BarList data={data?.byClass || []} />
          </ChartCard>
        </div>

        {/* ══════════ ROW 3 ══════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[11px] shrink-0 pb-1">
          <ChartCard
            title="By Department / Area"
            subtitle="Which areas generate the most records"
            icon={<FaBuilding />}
          >
            <BarList data={data?.byDept || []} emptyText="Not applicable for this module" />
          </ChartCard>

          <ChartCard
            title={`Top ${data?.topLabel || "Items"}`}
            subtitle="Recurring subjects across records"
            icon={<FaTrophy />}
            footer="The same item appearing repeatedly usually indicates a systemic issue rather than isolated events."
          >
            <BarList data={data?.topItems || []} labelWidth={120} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
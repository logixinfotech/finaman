import { useEffect, useMemo, useCallback } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from "recharts";

/**
 * OvertimeDrillDown
 * -----------------
 * Full-screen analytics dashboard for a single employee's overtime records.
 * Features:
 *  - KPI ribbon (total sessions, hours, amount, avg/session)
 *  - Composed chart: OT Hours (bar) + OT Amount (line) per date
 *  - Weekly breakdown bar chart
 *  - Escape key support to close
 *  - Crash-proof: all chart values guarded with Math.max(0, val)
 */

/* ─── helpers ───────────────────────────────────────────────────── */
const safeNum = (v) => Math.max(0, parseFloat(v) || 0);

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

const fmtCurrency = (n) =>
  `₹ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;

/** Format ISO date → "12 May" */
const shortDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

/** Get day-of-week label */
const dayLabel = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });
};

/* ─── KPI Card ───────────────────────────────────────────────────── */
const KPICard = ({ label, value, sub, color, icon }) => (
  <div
    className={`flex items-center gap-3 bg-white border-l-4 rounded-lg shadow-sm px-4 py-3 min-w-[160px] flex-1`}
    style={{ borderLeftColor: color }}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <i className={`pi ${icon}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
    </div>
  </div>
);

/* ─── Custom Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {p.name === "OT Amount" ? `₹ ${fmt(p.value)}` : fmt(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const OvertimeDrillDown = ({ employee, records = [], onBack }) => {
  /* Escape key listener */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onBack?.();
    },
    [onBack]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ── KPI Totals ── */
  const kpis = useMemo(() => {
    const sessions = records.length;
    const totalHours = records.reduce((s, r) => s + safeNum(r.ot_hours), 0);
    const totalAmount = records.reduce((s, r) => s + safeNum(r.ot_amount), 0);
    const avgHours = sessions > 0 ? totalHours / sessions : 0;
    const maxHours = sessions > 0 ? Math.max(...records.map((r) => safeNum(r.ot_hours))) : 0;
    return { sessions, totalHours, totalAmount, avgHours, maxHours };
  }, [records]);

  /* ── Chart Data: daily ── */
  const dailyData = useMemo(
    () =>
      records
        .slice()
        .sort((a, b) => new Date(a.ot_date) - new Date(b.ot_date))
        .map((r) => ({
          date: shortDate(r.ot_date),
          day: dayLabel(r.ot_date),
          "OT Hours": safeNum(r.ot_hours),
          "OT Amount": safeNum(r.ot_amount),
          "Worked Hours": safeNum(r.worked_hours),
        })),
    [records]
  );

  /* ── Chart Data: weekly breakdown ── */
  const weeklyData = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const label = dayLabel(r.ot_date);
      if (!map[label]) map[label] = { day: label, "OT Hours": 0, Sessions: 0 };
      map[label]["OT Hours"] = safeNum(map[label]["OT Hours"]) + safeNum(r.ot_hours);
      map[label]["Sessions"] += 1;
    });
    const ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return ORDER.filter((d) => map[d]).map((d) => map[d]);
  }, [records]);

  /* ── Guard: empty state ── */
  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <i className="pi pi-inbox text-5xl" />
        <p className="text-base">No overtime records found for this employee.</p>
        <button
          onClick={onBack}
          className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back to Report
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 bg-white border-b border-gray-200 px-5 py-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          title="Back (Esc)"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back
        </button>
        <div className="h-5 w-px bg-gray-300" />
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-gray-800 leading-tight">
            {employee?.employee_name || "Employee"}
          </h2>
          <p className="text-xs text-gray-400">
            {employee?.employee_code} &nbsp;·&nbsp; {employee?.department} &nbsp;·&nbsp;
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* ── KPI Ribbon ── */}
        <div className="flex flex-wrap gap-3">
          <KPICard
            label="Total Sessions"
            value={kpis.sessions}
            sub="OT Days"
            color="#3B82F6"
            icon="pi-calendar"
          />
          <KPICard
            label="Total OT Hours"
            value={`${fmt(kpis.totalHours)} hrs`}
            sub={`Avg ${fmt(kpis.avgHours)} hrs/day`}
            color="#8B5CF6"
            icon="pi-clock"
          />
          <KPICard
            label="Total OT Amount"
            value={fmtCurrency(kpis.totalAmount)}
            sub="Gross OT Pay"
            color="#10B981"
            icon="pi-indian-rupee"
          />
          <KPICard
            label="Peak OT (Single Day)"
            value={`${fmt(kpis.maxHours)} hrs`}
            sub="Highest single session"
            color="#F59E0B"
            icon="pi-bolt"
          />
        </div>

        {/* ── Main Chart: Composed ── */}
        <div className="flex flex-1 gap-2">
        <div className="bg-white border w-[50%] border-gray-200 rounded-xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Daily OT Hours &amp; Amount
          </p>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={dailyData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: 10, fill: "#94A3B8" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  yAxisId="left"
                  dataKey="OT Hours"
                  fill="#818CF8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  yAxisId="left"
                  dataKey="Worked Hours"
                  fill="#E0E7FF"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="OT Amount"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* ── Weekly Breakdown ── */}
        <div className="bg-white border w-[50%] border-gray-200 rounded-xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Weekly Distribution (OT Hours by Day-of-Week)
          </p>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={weeklyData}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="OT Hours"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="Sessions"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  iconType="circle"
                  iconSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-300 text-sm">
              No data available
            </div>
          )}
        </div>
        </div>

        {/* ── Detail Table ── */}
      
      </div>
    </div>
  );
};

export default OvertimeDrillDown;

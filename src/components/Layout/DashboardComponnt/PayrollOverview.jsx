import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import {
  getPayrollMonthly,
  getActledListAll,
  fetchGrades,
} from "../../../utils/api";


ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler);

const TREND_MONTHS = 6;

const buildMonthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // e.g. "2026-07"
};

const PAYROLL_KEYS = {
  gross:      ["gross", "gross_amount", "Gross", "total_gross", "GrossPay", "gross_pay"],
  net:        ["net", "net_amount", "Net", "net_pay", "NetPay"],
  pf:         ["pf", "PF", "pf_amount", "PF_Amount"],
  esi:        ["esi", "ESI", "esi_amount", "ESI_Amount"],
  pt:         ["pt", "PT", "pt_amount", "PT_Amount"],
  tds:        ["tds", "TDS", "tds_amount", "TDS_Amount"],
  lwf:        ["lwf", "LWF", "lwf_amount", "LWF_Amount"],
  employeeId: ["employee_id", "Actled_id", "emp_id"],
};

const EMP_KEYS = {
  id:     ["Actled_id", "id", "employee_id"],
  grade:  ["Op_id1"], 
  doj:    ["Doj", "doj", "date_of_joining"],
  dol:    ["Dol", "dol", "date_of_leaving"],
  status: ["Approved", "Status", "is_active", "IsActive"],
};

const GRADE_ID_KEYS = ["id", "group_id", "Group_id", "Op_id", "value"];

const PALETTE = ["#378ADD", "#639922", "#EF9F27", "#7F77DD", "#E24B4A", "#0C9AA6", "#BE185D", "#854F0B"];

const STAT_META = [
  { key: "pf",  label: "PF",  bg: "#E6F1FB", color: "#0C447C" },
  { key: "esi", label: "ESI", bg: "#EAF3DE", color: "#27500A" },
  { key: "pt",  label: "PT",  bg: "#FAEEDA", color: "#854F0B" },
  { key: "tds", label: "TDS", bg: "#FCEBEB", color: "#A32D2D" },
  { key: "lwf", label: "LWF", bg: "#EEEDFE", color: "#3C3489" },
];

// ── helpers ─────────────────────────────────────────────────────
const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const num = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const formatINR = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const formatLakhs = (v) => `₹${(v / 100000).toFixed(1)}L`;

const isLeftEmployee = (emp) => {
  const status = pick(emp, EMP_KEYS.status);
  if (status !== null) {
    const s = String(status).toLowerCase();
    if (["inactive", "left", "0", "false", "resigned", "terminated"].includes(s)) return true;
  }
  const dol = pick(emp, EMP_KEYS.dol);
  if (!dol) return false;
  const d = new Date(dol);
  if (isNaN(d.getTime())) return false;
  return d <= new Date(); 
};

const getLastNMonths = (n) => {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleString("en-IN", { month: "short" }),
      key: buildMonthKey(d),
      year: d.getFullYear(),
    });
  }
  return out;
};

const PayrollOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [monthlyRecords, setMonthlyRecords] = useState([]); 
  const [employees, setEmployees] = useState([]);
  const [grades, setGrades] = useState([]); 

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const months = getLastNMonths(TREND_MONTHS);

      const [payrollResults, empRes, gradeRes] = await Promise.all([
        Promise.all(
          months.map((m) =>
            getPayrollMonthly(m.key)
              .then((res) => ({ ...m, records: res?.success ? res.data || [] : [] }))
              .catch(() => ({ ...m, records: [] }))
          )
        ),
        getActledListAll().catch(() => null),
        fetchGrades().catch(() => null),
      ]);

      setMonthlyRecords(payrollResults);
      setEmployees(empRes?.success ? empRes.data || [] : []);

      const rawGrades = gradeRes?.success ? gradeRes.data || [] : [];
      console.log("[gradeMix debug] raw grades BEFORE mapping (full objects):", rawGrades);
      setGrades(
        rawGrades.map((g, i) => ({
          id: pick(g, GRADE_ID_KEYS),
          label: pick(g, ["group_name", "name", "GradeName", "grade_name", "label"]) || `Grade ${i + 1}`,
          color: PALETTE[i % PALETTE.length],
        }))
      );
    } catch (e) {
      console.error("PayrollOverview fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const trend = useMemo(() => {
    const labels = monthlyRecords.map((m) => m.label);
    const grossSeries = monthlyRecords.map((m) =>
      m.records.reduce((sum, r) => sum + num(pick(r, PAYROLL_KEYS.gross)), 0)
    );
    const netSeries = monthlyRecords.map((m) =>
      m.records.reduce((sum, r) => sum + num(pick(r, PAYROLL_KEYS.net)), 0)
    );
    return { labels, grossSeries, netSeries };
  }, [monthlyRecords]);

  const latestMonth = useMemo(() => {
    for (let i = monthlyRecords.length - 1; i >= 0; i--) {
      if (monthlyRecords[i].records.length > 0) return monthlyRecords[i];
    }
    return monthlyRecords[monthlyRecords.length - 1] || { records: [] };
  }, [monthlyRecords]);

  const statutory = useMemo(() => {
    const totals = { pf: 0, esi: 0, pt: 0, tds: 0, lwf: 0 };
    latestMonth.records.forEach((r) => {
      totals.pf  += num(pick(r, PAYROLL_KEYS.pf));
      totals.esi += num(pick(r, PAYROLL_KEYS.esi));
      totals.pt  += num(pick(r, PAYROLL_KEYS.pt));
      totals.tds += num(pick(r, PAYROLL_KEYS.tds));
      totals.lwf += num(pick(r, PAYROLL_KEYS.lwf));
    });
    return STAT_META.map((s) => ({ ...s, val: formatINR(totals[s.key]) }));
  }, [latestMonth]);

  // ── Gross / Net / Deductions summary for the latest month ──────
  const metaRow = useMemo(() => {
    const gross = latestMonth.records.reduce((sum, r) => sum + num(pick(r, PAYROLL_KEYS.gross)), 0);
    const net = latestMonth.records.reduce((sum, r) => sum + num(pick(r, PAYROLL_KEYS.net)), 0);
    const deductions = Math.max(gross - net, 0);
    const max = gross || 1;
    return [
      { label: "Gross payout", val: formatLakhs(gross), bar: "#378ADD", w: `${Math.min((gross / max) * 100, 100)}%` },
      { label: "Deductions", val: formatLakhs(deductions), bar: "#E24B4A", w: `${Math.min((deductions / max) * 100, 100)}%` },
      { label: "Net payout", val: formatLakhs(net), bar: "#639922", w: `${Math.min((net / max) * 100, 100)}%` },
    ];
  }, [latestMonth]);

  // ── Headcount & grade mix (currently active employees only) ────
  const gradeMix = useMemo(() => {
    const active = employees.filter((e) => !isLeftEmployee(e));

    // Build an id -> label lookup from fetchGrades() (e.g. { 54: "GRADE A" })
    const idToLabel = {};
    grades.forEach((g) => {
      if (g.id !== null && g.id !== undefined && g.id !== "") idToLabel[String(g.id)] = g.label;
    });

    const counts = {};
    active.forEach((e) => {
      const gradeId = pick(e, EMP_KEYS.grade); // Op_id1, an id like 54
      const label = (gradeId !== null && idToLabel[String(gradeId)]) || "Unassigned";
      counts[label] = (counts[label] || 0) + 1;
    });

    // ── 🐞 TEMP DEBUG — remove once grade mix is confirmed working ──
    console.log("[gradeMix debug] total employees:", employees.length);
    console.log("[gradeMix debug] active (non-left) employees:", active.length);
    console.log("[gradeMix debug] idToLabel lookup built from fetchGrades():", idToLabel);
    console.log("[gradeMix debug] counts by resolved label:", counts);
    // ─────────────────────────────────────────────────────────────

    // Show every known grade (even 0-count ones) plus "Unassigned" if any exist
    const knownLabels = grades.map((g) => g.label);
    const labels = counts["Unassigned"] > 0 ? [...knownLabels, "Unassigned"] : knownLabels;
    const colors = labels.map((l, i) => (l === "Unassigned" ? "#9CA3AF" : grades[i]?.color || PALETTE[i % PALETTE.length]));
    const data = labels.map((l) => counts[l] || 0);

    console.log("[gradeMix debug] final labels used for chart:", labels);
    console.log("[gradeMix debug] final data (counts per label):", data);

    return { labels, data, colors };
  }, [employees, grades]);

  // ── Joins vs Exits, year-to-date ───────────────────────────────
  const joinExit = useMemo(() => {
    const thisYear = new Date().getFullYear();
    let joins = 0;
    let exits = 0;
    employees.forEach((e) => {
      const doj = pick(e, EMP_KEYS.doj);
      const dol = pick(e, EMP_KEYS.dol);
      if (doj) {
        const d = new Date(doj);
        if (!isNaN(d.getTime()) && d.getFullYear() === thisYear) joins += 1;
      }
      if (dol) {
        const d = new Date(dol);
        if (!isNaN(d.getTime()) && d.getFullYear() === thisYear) exits += 1;
      }
    });
    return { joins, exits };
  }, [employees]);

  // ── chart configs ───────────────────────────────────────────────
  const trendData = {
    labels: trend.labels,
    datasets: [
      {
        label: "Gross",
        data: trend.grossSeries,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.07)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#378ADD",
      },
      {
        label: "Net",
        data: trend.netSeries,
        borderColor: "#639922",
        borderDash: [4, 3],
        tension: 0.4,
        fill: false,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: "#639922",
      },
    ],
  };

  const trendMin = Math.min(...trend.grossSeries, ...trend.netSeries, 0);
  const trendMax = Math.max(...trend.grossSeries, ...trend.netSeries, 1);
  const trendPad = (trendMax - trendMin) * 0.1 || 1;

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => formatLakhs(c.raw) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, autoSkip: false } },
      y: {
        min: Math.max(trendMin - trendPad, 0),
        max: trendMax + trendPad,
        grid: { color: "rgba(128,128,128,0.08)" },
        ticks: { font: { size: 9 }, callback: (v) => formatLakhs(v) },
      },
    },
  };

  const gradeData = {
    labels: gradeMix.labels,
    datasets: [{ data: gradeMix.data, backgroundColor: gradeMix.colors, borderRadius: 3 }],
  };

  const gradeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: "rgba(128,128,128,0.08)" }, ticks: { font: { size: 9 } } },
    },
  };

  const monthLabel = latestMonth?.label
    ? `${latestMonth.label} ${latestMonth.year}`
    : "";

  if (loading) {
    return (
      <>
        <style>{RESPONSIVE_CSS}</style>
        <div className="payroll-overview-wrap">
          {[0, 1].map((i) => (
            <div key={i} style={styles.card}>
              <div style={styles.skeletonBlock} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{RESPONSIVE_CSS}</style>
        <div className="payroll-overview-wrap">
          <div style={{ ...styles.card, alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "#A32D2D" }}>Couldn't load payroll overview</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <style>{RESPONSIVE_CSS}</style>
    <div className="payroll-overview-wrap">
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Payroll breakdown{monthLabel ? ` — ${monthLabel}` : ""}</span>
          <span style={styles.action}>Full report ↗️</span>
        </div>

        <div className="hide-scrollbar" style={styles.cardBody}>
          <div style={styles.metaRow}>
            {metaRow.map((m) => (
              <div key={m.label} style={styles.metaBox}>
                <div style={styles.metaVal}>{m.val}</div>
                <div style={styles.metaLbl}>{m.label}</div>
                <div style={styles.metaBarBg}>
                  <div style={{ height: "100%", borderRadius: 2, background: m.bar, width: m.w }} />
                </div>
              </div>
            ))}
          </div>

          {/* Statutory breakdown chips — now computed from real payroll records */}
          <div style={styles.chipRow}>
            {statutory.map((s) => (
              <span key={s.label} style={{ ...styles.chip, background: s.bg, color: s.color }}>
                {s.label} · {s.val}
              </span>
            ))}
          </div>

          <div style={{ height: 120, flexShrink: 0, position: "relative" }}>
            {trend.labels.length > 0 ? (
              <Line data={trendData} options={trendOptions} />
            ) : (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 11, color: "#888" }}>No payroll data for this period</span>
              </div>
            )}
          </div>

          <div style={styles.legendRow}>
            <span style={styles.legItem}><span style={{ ...styles.legLine, background: "#378ADD" }} />Gross</span>
            <span style={styles.legItem}><span style={{ ...styles.legLine, background: "#639922", borderTop: "1px dashed #639922" }} />Net</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Headcount & grade mix</span>
        </div>

        <div className="hide-scrollbar" style={styles.cardBody}>
          <div style={{ height: 130, flexShrink: 0, position: "relative", marginBottom: 10 }}>
            {gradeMix.labels.length > 0 ? (
              <Bar data={gradeData} options={gradeOptions} />
            ) : (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 11, color: "#888" }}>No employee data</span>
              </div>
            )}
          </div>

          {/* Grade chips */}
          <div style={styles.chipRow}>
            {gradeMix.labels.map((g, i) => (
              <span key={g} style={{ ...styles.chip, background: gradeMix.colors[i] + "22", color: gradeMix.colors[i] }}>
                {g} · {gradeMix.data[i]}
              </span>
            ))}
          </div>

          {/* Joins vs Exits */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(0,0,0,0.07)" }}>
            <div style={styles.cardTitle}>Joining vs exit — YTD</div>
            <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
              <div style={{ ...styles.jebox, background: "#EAF3DE" }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#3B6D11" }}>{joinExit.joins}</div>
                <div style={{ fontSize: 10, color: "#3B6D11" }}>New joins</div>
              </div>
              <div style={{ ...styles.jebox, background: "#FCEBEB" }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#A32D2D" }}>{joinExit.exits}</div>
                <div style={{ fontSize: 10, color: "#A32D2D" }}>Exits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

const RESPONSIVE_CSS = `
  .hide-scrollbar {
    scrollbar-width: none;       /* Firefox */
    -ms-overflow-style: none;    /* old Edge / IE */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;               /* Chrome, Safari, new Edge */
  }

  .payroll-overview-wrap {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 10px;
    height: 100%;
  }
  @media (max-width: 768px) {
    .payroll-overview-wrap {
      grid-template-columns: 1fr;
      height: auto !important;
    }
    .payroll-overview-wrap > div {
      height: auto !important;
      min-height: 260px;
    }
  }
`;

const styles = {
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderRadius: 8,
    padding: "13px 14px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardHdr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    scrollbarWidth: "thin",
  },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  metaRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 },
  metaBox: { background: "#f5f6f8", borderRadius: 8, padding: "8px 10px" },
  metaVal: { fontSize: 14, fontWeight: 500, color: "#1a1a1a" },
  metaLbl: { fontSize: 10, color: "#888", marginTop: 2 },
  metaBarBg: { height: 4, background: "#e0e0e0", borderRadius: 2, marginTop: 5 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  chip: { fontSize: 10, padding: "2px 8px", borderRadius: 20 },
  legendRow: { display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "#888" },
  legItem: { display: "flex", alignItems: "center", gap: 5 },
  legLine: { width: 14, height: 2, display: "inline-block", borderRadius: 1 },
  jebox: { flex: 1, borderRadius: 8, padding: "8px", textAlign: "center" },
  emptyState: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  skeletonBlock: {
    flex: 1,
    borderRadius: 8,
    background: "linear-gradient(90deg,#eef0f2 25%,#f7f8f9 37%,#eef0f2 63%)",
    backgroundSize: "200px 100%",
  },
};

export default PayrollOverview;
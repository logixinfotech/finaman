import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import UnivarsalFilter from "../../Reusable/Filter/UnivarsalFilter";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import {
  getLeaveRequests,
  getLeaveEncashments,
  getLeaveBalance,
} from "../../../utils/api";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend);
const REQ_KEYS = {
  id: ["id", "leave_id", "LR_id", "request_id"],
  employeeId: ["employee_id", "Actled_id", "emp_id"],
  employeeName: ["employee_name", "emp_name", "name", "Led_name"],
  department: ["department_name", "department", "dept"],
  departmentId: ["department_id", "department", "dept_id"],
  leaveType: ["leave_type_name", "leave_type", "type", "leavetype_name"],
  days: ["no_of_days", "days", "total_days", "day_count"],
  status: ["status", "Status"],
  fromDate: ["from_date", "start_date", "fromDate", "date"],
  toDate: ["to_date", "end_date", "toDate"],
};

const ENC_KEYS = {
  status: ["status", "Status"],
};
const C = {
  blue: "#3B6FD9",
  blueSoft: "#EAF0FB",
  green: "#2BA36B",
  greenSoft: "#E6F5EE",
  amber: "#D9962B",
  amberSoft: "#FBF1DF",
  red: "#D64545",
  redSoft: "#FBE9E9",
  purple: "#7B61D9",
  purpleSoft: "#EEEAFB",
  indigo: "#5B4FE9",
  indigoSoft: "#EFEEFD",
  teal: "#1D9E9E",
  tealSoft: "#E3F5F5",
  ink: "#1F2A44",
  navy: "#1F3A68",
  muted: "#6B7A90",
  faint: "#9AA6B8",
  line: "#E4E8EF",
  panel: "#F5F7FB",
};

const STATUS_STYLE = {
  Approved: { color: C.green, textColor: "#1F7A4F", bg: C.greenSoft },
  Pending: { color: C.amber, textColor: "#8A5A0E", bg: C.amberSoft },
  Rejected: { color: C.red, textColor: "#9A2F2F", bg: C.redSoft },
};

const TYPE_COLOR_MAP = {
  "Casual Leave": C.blue,
  "Sick Leave": C.green,
  "Earned Leave": C.amber,
  "Comp Off": C.purple,
  Maternity: "#D4537E",
};
const FALLBACK_PALETTE = [C.blue, C.green, C.amber, C.purple, "#D4537E", C.teal, "#F97316"];

const DURATION_BUCKETS = [
  { label: "1 d", color: C.green, test: (d) => d <= 1 },
  { label: "2–3 d", color: C.blue, test: (d) => d > 1 && d <= 3 },
  { label: "4–7 d", color: C.amber, test: (d) => d > 3 && d <= 7 },
  { label: "> 7 d", color: C.red, test: (d) => d > 7 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const normStatus = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (s.startsWith("appr")) return "Approved";
  if (s.startsWith("pend")) return "Pending";
  if (s.startsWith("rej")) return "Rejected";
  return raw || "Pending";
};

const toDateOnly = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const isBetween = (date, from, to) => {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const Icon = ({ name, color = "currentColor", size = 15 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "chart": return <svg {...p}><path d="M3 3v18h18" /><path d="M7 15l4-5 4 3 5-7" /></svg>;
    case "db": return <svg {...p}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>;
    case "check": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "x": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>;
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
    case "cash": return <svg {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M7 12h.01M17 12h.01" /></svg>;
    case "pie": return <svg {...p}><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M14 2.2A9 9 0 0 1 21.8 10H14z" /></svg>;
    case "hourglass": return <svg {...p}><path d="M6 3h12M6 21h12M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" /></svg>;
    case "layers": return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "refresh": return <svg {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>;
    case "download": return <svg {...p}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></svg>;
    case "filter": return <svg {...p}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
    case "chevron": return <svg {...p}><path d="M6 9l6 6 6-6" /></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    default: return null;
  }
};
const RESPONSIVE_CSS = `
.la-page { container-type: inline-size; }
.la-header-top { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 18px; flex-wrap:wrap; }
.la-header-left { display:flex; align-items:center; gap:12px; min-width:0; flex-wrap:wrap; }
.la-header-actions { display:flex; gap:8px; flex-wrap:wrap; }
.la-kpi-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:12px; flex-shrink:0; }
.la-row2 { display:grid; grid-template-columns:2fr 1fr; gap:12px; flex-shrink:0; }
.la-row2b { display:grid; grid-template-columns:1fr 1fr; gap:12px; flex-shrink:0; }
.la-status-wrap { display:flex; align-items:center; gap:22px; margin-top:12px; }
.la-table { width:100%; min-width:520px; border-collapse:collapse; text-align:left; }

@media (max-width: 1280px) {
  .la-kpi-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
}
@media (max-width: 1024px) {
  .la-row2 { grid-template-columns:1fr; }
}
@media (max-width: 820px) {
  .la-row2b { grid-template-columns:1fr; }
  .la-header-top { padding:12px 14px; }
}
@media (max-width: 600px) {
  .la-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .la-header-actions { width:100%; }
  .la-header-actions > button { flex:1 1 auto; justify-content:center; }
  .la-status-wrap { flex-direction:column; align-items:stretch; }
  .la-bar-lbl { width:80px !important; }
}
@media (max-width: 400px) {
  .la-kpi-grid { grid-template-columns:1fr; }
}
`;

const useResponsiveCss = () => {
  useEffect(() => {
    const id = "leave-analytics-responsive-css";
    if (document.getElementById(id)) return;
    const tag = document.createElement("style");
    tag.id = id;
    tag.textContent = RESPONSIVE_CSS;
    document.head.appendChild(tag);
  }, []);
};

const LeaveAnalytics = ({ isHalf = false, onViewAllClick, onAIClick ,calendarPage="LeaveAnalytics"}) => {
  useResponsiveCss();
   const navigate = useNavigate();
    const handleViewCalendar = useCallback(() => {
      if (onViewAllClick) return onViewAllClick(); 
      navigate(`/app?page=${calendarPage}`);
    }, [onViewAllClick, navigate, calendarPage]);
  const currentDate = useMemo(() => new Date(), []);
  const today = useMemo(() => toDateOnly(currentDate), [currentDate]);

  const [filters, setFilters] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    employee_id: "",
    department_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requests, setRequests] = useState([]);
  const [encashments, setEncashments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { options } = useGroupOptions();
  const pageRef = useRef(null);
  const [pageHeight, setPageHeight] = useState(null);

  useLayoutEffect(() => {
    if (isHalf) return;
    const recalc = () => {
      const el = pageRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      let bottomLimit = window.innerHeight;
      let node = el.parentElement;
      while (node && node !== document.body) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === "auto" || overflowY === "scroll" || overflowY === "hidden") {
          bottomLimit = Math.min(bottomLimit, node.getBoundingClientRect().bottom);
          break;
        }
        node = node.parentElement;
      }
      setPageHeight(Math.max(320, bottomLimit - top - 16));
    };

    recalc();
    window.addEventListener("resize", recalc);
    const t1 = setTimeout(recalc, 50);
    const t2 = setTimeout(recalc, 300);
    let ro;
    if (typeof ResizeObserver !== "undefined" && pageRef.current?.parentElement) {
      ro = new ResizeObserver(recalc);
      ro.observe(pageRef.current.parentElement);
    }
    return () => {
      window.removeEventListener("resize", recalc);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, [isHalf, loading]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [reqRes, encRes, balRes] = await Promise.all([
        getLeaveRequests(),
        getLeaveEncashments(),
        getLeaveBalance(),
      ]);
      setRequests(reqRes?.success ? reqRes.data || [] : []);
      setEncashments(encRes?.success ? encRes.data || [] : []);
      setBalances(balRes?.success ? balRes.data || [] : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("LeaveAnalytics fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const allRequests = useMemo(() => {
    return requests.map((r) => {
      const from = toDateOnly(pick(r, REQ_KEYS.fromDate));
      const to = toDateOnly(pick(r, REQ_KEYS.toDate)) || from;
      return {
        id: pick(r, REQ_KEYS.id) ?? Math.random(),
        employeeId: pick(r, REQ_KEYS.employeeId),
        name: pick(r, REQ_KEYS.employeeName) || "—",
        dept: pick(r, REQ_KEYS.department) || "—",
        deptId: pick(r, REQ_KEYS.departmentId),
        type: pick(r, REQ_KEYS.leaveType) || "Other",
        days: Number(pick(r, REQ_KEYS.days)) || 0,
        status: normStatus(pick(r, REQ_KEYS.status)),
        from,
        to,
        dateStr: from ? from.toISOString().substring(0, 10) : "",
      };
    });
  }, [requests]);
  const scopedRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const matchEmployee = !filters.employee_id || String(r.employeeId) === String(filters.employee_id);
      const matchDept = !filters.department_id || String(r.deptId) === String(filters.department_id);
      return matchEmployee && matchDept;
    });
  }, [allRequests, filters.employee_id, filters.department_id]);
  const monthRequests = useMemo(() => {
    return allRequests.filter(
      (r) => r.from && r.from.getMonth() + 1 === filters.month && r.from.getFullYear() === filters.year
    );
  }, [allRequests, filters.month, filters.year]);
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter(
      (r) => r.from && r.from.getMonth() + 1 === filters.month && r.from.getFullYear() === filters.year
    );
  }, [scopedRequests, filters.month, filters.year]);
  const buildStatus = (list) => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    list.forEach((r) => {
      if (counts[r.status] === undefined) counts[r.status] = 0;
      counts[r.status] += 1;
    });
    return Object.keys(STATUS_STYLE).map((label) => ({ label, value: counts[label] || 0, ...STATUS_STYLE[label] }));
  };
  const LEAVE_STATUS = useMemo(() => buildStatus(monthRequests), [monthRequests]);
  const FULL_STATUS = useMemo(() => buildStatus(filteredRequests), [filteredRequests]);
  const fullTotal = filteredRequests.length;
  const LEAVE_TYPES = useMemo(() => {
    const byType = {};
    filteredRequests.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    const entries = Object.entries(byType);
    const max = Math.max(1, ...entries.map(([, c]) => c));
    return entries
      .map(([name, count], i) => ({
        name,
        count,
        pct: Math.round((count / max) * 100),
        share: pct(count, fullTotal),
        color: TYPE_COLOR_MAP[name] || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRequests, fullTotal]);
  const DURATION = useMemo(() => {
    const open = filteredRequests.filter((r) => r.status !== "Rejected");
    return DURATION_BUCKETS.map((b) => ({ ...b, count: open.filter((r) => b.test(r.days)).length }));
  }, [filteredRequests]);
  const durationTotal = DURATION.reduce((s, b) => s + b.count, 0);
  const TREND = useMemo(() => {
    const requested = Array(12).fill(0);
    const approved = Array(12).fill(0);
    scopedRequests.forEach((r) => {
      if (!r.from || r.from.getFullYear() !== filters.year) return;
      const m = r.from.getMonth();
      requested[m] += 1;
      if (r.status === "Approved") approved[m] += 1;
    });
    const lastMonth = filters.year === currentDate.getFullYear() ? currentDate.getMonth() : 11;
    return {
      labels: MONTHS.slice(0, lastMonth + 1),
      requested: requested.slice(0, lastMonth + 1),
      approved: approved.slice(0, lastMonth + 1),
    };
  }, [scopedRequests, filters.year, currentDate]);
  const trendPending = TREND.requested.reduce((s, v) => s + v, 0) - TREND.approved.reduce((s, v) => s + v, 0);
  const DEPTS = useMemo(() => {
    const byDept = {};
    filteredRequests
      .filter((r) => r.status === "Approved")
      .forEach((r) => {
        byDept[r.dept] = (byDept[r.dept] || 0) + r.days;
      });
    const entries = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map(([, d]) => d));
    return entries.slice(0, 6).map(([name, days]) => ({ name, days, pct: Math.round((days / max) * 100) }));
  }, [filteredRequests]);
  const highAbsenceDept = DEPTS.length ? DEPTS[0].name : "—";
  const onLeaveTodayCount = useMemo(
    () => allRequests.filter((r) => r.status === "Approved" && isBetween(today, r.from, r.to)).length,
    [allRequests, today]
  );
  const expiringThisYear = useMemo(
    () =>
      balances.reduce((sum, b) => {
        const val = pick(b, ["expiring_days", "expire_days", "expiring_balance", "carry_forward_expiring"]);
        return sum + (Number(val) || 0);
      }, 0),
    [balances]
  );
  const pendingApprovalsCount = useMemo(() => scopedRequests.filter((r) => r.status === "Pending").length, [scopedRequests]);
  const encashmentsDueCount = useMemo(
    () =>
      encashments.filter((e) => {
        const s = String(pick(e, ENC_KEYS.status) || "").toLowerCase();
        return !s || s.includes("pend") || s.includes("due");
      }).length,
    [encashments]
  );
  const approvedCount = FULL_STATUS[0].value;
  const rejectedCount = FULL_STATUS[2].value;
  const approvalRate = pct(approvedCount, fullTotal);
  const totalDaysApproved = filteredRequests.filter((r) => r.status === "Approved").reduce((s, r) => s + r.days, 0);
  const doughnutData = (statusArr) => ({
    labels: statusArr.map((s) => s.label),
    datasets: [{ data: statusArr.map((s) => s.value), backgroundColor: statusArr.map((s) => s.color), borderWidth: 0 }],
  });
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
  };

  const lineData = {
    labels: TREND.labels,
    datasets: [
      {
        label: "Requested",
        data: TREND.requested,
        borderColor: C.blue,
        backgroundColor: "rgba(59,111,217,0.12)",
        fill: true,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: C.blue,
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: "Approved",
        data: TREND.approved,
        borderColor: C.green,
        backgroundColor: "rgba(43,163,107,0.10)",
        fill: true,
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: C.green,
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: false, font: { size: 11 }, color: C.muted, padding: 14 } },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: C.faint } },
      y: { beginAtZero: true, grid: { color: "#EEF1F6" }, ticks: { precision: 0, font: { size: 11 }, color: C.faint } },
    },
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Employee", "Department", "Type", "Days", "Status"];
    const rows = filteredRequests.map((r) => [
      `"${r.dateStr}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.dept.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      r.days,
      `"${r.status}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "leave_operations_report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthLabel = new Date(filters.year, filters.month - 1).toLocaleString("default", { month: "long" });
  if (isHalf) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Leave analytics — {monthLabel}</span>
          <span style={styles.action} onClick={handleViewCalendar}>View all ↗️</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
            <div style={styles.skeletonRow} />
            <div style={styles.skeletonRow} />
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.red }}>
            Couldn't load leave data
          </div>
        ) : (
          <>
            <div style={styles.topRow}>
              <div style={{ width: 125, height: 125, flexShrink: 0, position: "relative" }}>
                <Doughnut data={doughnutData(LEAVE_STATUS)} options={doughnutOptions} />
              </div>
              <div style={styles.statusList}>
                {LEAVE_STATUS.map((s) => (
                  <div key={s.label} style={styles.statusRow}>
                    <div style={{ ...styles.dot, background: s.color }} />
                    <span style={styles.statusLabel}>{s.label}</span>
                    <span style={{ ...styles.statusVal, color: s.textColor }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.pillRow}>
              {[
                { label: "On leave today", val: onLeaveTodayCount },
                { label: "Expiring this yr", val: expiringThisYear },
              ].map((p) => (
                <div key={p.label} style={styles.pill}>
                  <div style={styles.pillVal}>{p.val}</div>
                  <div style={styles.pillLbl}>{p.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
  const KPIS = [
    { label: "Total Requests", val: fullTotal, sub: `${totalDaysApproved} days approved`, icon: "db", color: C.blue, soft: C.blueSoft },
    { label: "Approved", val: approvedCount, sub: `${approvalRate}% approval rate`, icon: "check", color: C.green, soft: C.greenSoft },
    { label: "Pending Approvals", val: pendingApprovalsCount, sub: "needs attention", icon: "clock", color: C.amber, soft: C.amberSoft },
    { label: "Rejected", val: rejectedCount, sub: `${pct(rejectedCount, fullTotal)}% of requests`, icon: "x", color: C.red, soft: C.redSoft },
    { label: "On Leave Today", val: onLeaveTodayCount, sub: `${expiringThisYear} days expiring this year`, icon: "user", color: C.purple, soft: C.purpleSoft },
    { label: "Encashments Due", val: encashmentsDueCount, sub: highAbsenceDept !== "—" ? `high absence: ${highAbsenceDept}` : "no absence data", icon: "cash", color: C.teal, soft: C.tealSoft },
  ];

  const SectionHead = ({ icon, title, right }) => (
    <div style={styles.secHead}>
      <div style={styles.secTitle}>
        <Icon name={icon} color={C.blue} size={14} />
        <span>{title}</span>
      </div>
      {right}
    </div>
  );

  return (
    <div
      ref={pageRef}
      className="la-page"
      style={{ ...styles.page, height: pageHeight ? `${pageHeight}px` : "90vh" }}
    >
      <div style={styles.header}>
        <div className="la-header-top">
          <div className="la-header-left">
            <h2 style={styles.title}>Leave Analytics</h2>
            <span style={styles.metaChip}>
              {loading ? "Loading…" : `${filteredRequests.length.toLocaleString()} records`}
              {lastUpdated && !loading ? ` · ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          </div>
          <div className="la-header-actions">
            <button
              style={{ ...styles.ghostBtn, ...(showFilters ? styles.ghostBtnActive : null) }}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Icon name="filter" size={14} /> Filters
              <span style={{ display: "inline-flex", transform: showFilters ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
                <Icon name="chevron" size={13} />
              </span>
            </button>
            {onAIClick && (
              <button style={{ ...styles.ghostBtn, position: "relative" }} onClick={onAIClick}>
                <Icon name="sparkle" size={14} /> AI
                <span style={styles.aiDot} />
              </button>
            )}
            <button style={styles.ghostBtn} onClick={loadData} disabled={loading}>
              <Icon name="refresh" size={14} /> {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button style={styles.primaryBtn} onClick={handleExportCSV}>
              <Icon name="download" color="#fff" size={14} /> Export
            </button>
          </div>
        </div>
        {showFilters && (
          <div style={styles.filterArea}>
            <UnivarsalFilter
              options={options}
              setShowFilter={setShowFilters}
              filters={filters}
              visibleFields={["filterType", "employee", "department"]}
              setFilters={setFilters}
              onClear={() =>
                setFilters({
                  month: currentDate.getMonth() + 1,
                  year: currentDate.getFullYear(),
                  employee_id: "",
                  department_id: "",
                })
              }
            />
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorBanner}>
          Couldn't load leave data. <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={loadData}>Try again</span>
        </div>
      )}
      <div style={styles.scrollArea}>
      <div className="la-kpi-grid">
        {KPIS.map((k) => (
          <div key={k.label} style={styles.kpi}>
            <div style={{ ...styles.kpiIcon, background: k.soft }}>
              <Icon name={k.icon} color={k.color} size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kpiLabel}>{k.label}</div>
              <div style={{ ...styles.kpiVal, color: k.color }}>{loading ? "—" : k.val}</div>
              <div style={styles.kpiSub}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="la-row2">
        <div style={styles.panel}>
          <SectionHead
            icon="chart"
            title="Monthly Trend"
            right={
              <span style={{ ...styles.badge, background: trendPending > 0 ? C.amberSoft : C.greenSoft, color: trendPending > 0 ? "#8A5A0E" : "#1F7A4F" }}>
                Awaiting decision {trendPending > 0 ? `+${trendPending}` : trendPending}
              </span>
            }
          />
          <div style={styles.panelBody}>
            <div style={styles.hint}>Requests raised against requests approved · {filters.year}</div>
            <div style={{ height: 240 }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
          <div style={styles.panelFoot}>A widening gap between the two lines means requests are piling up faster than they are approved.</div>
        </div>

        <div style={styles.panel}>
          <SectionHead icon="pie" title="Status Distribution" />
          <div style={styles.panelBody}>
            <div style={styles.hint}>Where this month's requests currently sit</div>
            <div className="la-status-wrap">
              <div style={{ width: 140, height: 140, position: "relative", flexShrink: 0 }}>
                <Doughnut data={doughnutData(FULL_STATUS)} options={doughnutOptions} />
                <div style={styles.donutCenter}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{fullTotal}</div>
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>TOTAL</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {FULL_STATUS.map((s) => (
                  <div key={s.label} style={styles.legendRow}>
                    <div style={{ ...styles.dot, background: s.color, borderRadius: "50%" }} />
                    <span style={styles.legendLbl}>{s.label}</span>
                    <span style={styles.legendVal}>{s.value}</span>
                    <span style={styles.legendPct}>{pct(s.value, fullTotal)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="la-row2b">
        <div style={styles.panel}>
          <SectionHead icon="hourglass" title="Duration of Requests" />
          <div style={styles.panelBody}>
            <div style={styles.hint}>How long approved and pending leaves run</div>
            <div style={styles.stackBar}>
              {DURATION.map((b) =>
                b.count ? (
                  <div key={b.label} title={`${b.label}: ${b.count}`} style={{ width: `${pct(b.count, durationTotal)}%`, background: b.color }} />
                ) : null
              )}
              {!durationTotal && <div style={{ width: "100%", background: C.line }} />}
            </div>
            <div style={styles.stackLegend}>
              {DURATION.map((b) => (
                <div key={b.label} style={styles.stackItem}>
                  <div style={{ ...styles.dot, background: b.color, borderRadius: "50%" }} />
                  <span style={{ color: C.muted }}>{b.label}</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>{b.count}</span>
                </div>
              ))}
            </div>

            <div style={{ ...styles.hint, marginTop: 18 }}>Approved leave days by department</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {DEPTS.length ? (
                DEPTS.map((d) => (
                  <div key={d.name} style={styles.barRow}>
                    <span className="la-bar-lbl" style={styles.barLbl}>{d.name}</span>
                    <div style={styles.barBg}>
                      <div style={{ ...styles.barFill, width: `${d.pct}%`, background: C.blue }} />
                    </div>
                    <span style={styles.barVal}>{d.days} d</span>
                  </div>
                ))
              ) : (
                <div style={styles.empty}>No approved leaves in this period.</div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <SectionHead icon="layers" title="By Leave Type" />
          <div style={styles.panelBody}>
            <div style={styles.hint}>Breakdown by type of leave</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {LEAVE_TYPES.length ? (
                LEAVE_TYPES.map((t) => (
                  <div key={t.name} style={styles.barRow}>
                    <span className="la-bar-lbl" style={styles.barLbl}>{t.name}</span>
                    <div style={styles.barBg}>
                      <div style={{ ...styles.barFill, width: `${t.pct}%`, background: t.color, minWidth: 34 }}>
                        <span style={styles.barInner}>{t.share}%</span>
                      </div>
                    </div>
                    <span style={styles.barVal}>{t.count}</span>
                  </div>
                ))
              ) : (
                <div style={styles.empty}>No leave requests in this period.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={styles.panel}>
        <SectionHead
          icon="list"
          title={`Leave Requests (${filteredRequests.length})`}
          right={<span style={{ fontSize: 11, color: C.faint }}>{monthLabel} {filters.year}</span>}
        />
        <div style={styles.tableWrap}>
          <table className="la-table">
            <thead style={{ position: "sticky", top: 0, background: C.panel, zIndex: 1 }}>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Type</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Days</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={styles.tdMsg}>Loading leave requests…</td></tr>
              ) : error ? (
                <tr><td colSpan="6" style={{ ...styles.tdMsg, color: C.red }}>Couldn't load leave requests. Please refresh.</td></tr>
              ) : filteredRequests.length ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ ...styles.td, color: C.muted, whiteSpace: "nowrap" }}>{req.dateStr}</td>
                    <td style={{ ...styles.td, fontWeight: 500, color: C.ink }}>{req.name}</td>
                    <td style={{ ...styles.td, color: C.muted }}>{req.dept}</td>
                    <td style={{ ...styles.td, color: C.muted }}>{req.type}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: 600, color: C.ink }}>{req.days}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusChip, background: STATUS_STYLE[req.status]?.bg || C.panel, color: STATUS_STYLE[req.status]?.textColor || C.muted }}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={styles.tdMsg}>No leave requests found for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};
const styles = {
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 14, padding: "13px 14px", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", overflow: "hidden" },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexShrink: 0 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  topRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 30, flexShrink: 0 },
  statusList: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
  statusRow: { display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  statusLabel: { fontSize: 11, color: "#555", flex: 1 },
  statusVal: { fontSize: 11, fontWeight: 500 },
  pillRow: { display: "flex", gap: 6, paddingBottom: 10, flexShrink: 0 },
  pill: { flex: 1, background: "#f5f6f8", borderRadius: 8, padding: "7px 8px", textAlign: "center" },
  pillVal: { fontSize: 16, fontWeight: 500, color: "#1a1a1a" },
  pillLbl: { fontSize: 10, color: "#888", marginTop: 2 },
  skeletonRow: { height: 28, borderRadius: 6, background: "linear-gradient(90deg,#eef0f2 25%,#f7f8f9 37%,#eef0f2 63%)", backgroundSize: "200px 100%" },
  page: { background: C.panel, padding: 12, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, boxSizing: "border-box", color: C.ink, overflow: "hidden" },
  scrollArea: { flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4, paddingBottom: 12 },

  header: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", flexShrink: 0 },
  title: { fontSize: 17, fontWeight: 700, color: C.ink, margin: 0, whiteSpace: "nowrap" },
  metaChip: { fontSize: 11, fontWeight: 600, color: C.muted, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, background: C.indigo, color: "#fff", cursor: "pointer" },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", border: `1px solid ${C.line}`, borderRadius: 7, fontSize: 13, fontWeight: 500, background: "#fff", color: C.ink, cursor: "pointer" },
  ghostBtnActive: { borderColor: C.indigo, color: C.indigo, background: C.indigoSoft },
  aiDot: { position: "absolute", top: 6, right: 8, width: 6, height: 6, borderRadius: "50%", background: C.indigo },
  filterArea: { borderTop: `1px solid ${C.line}`, background: "#FAFBFD", padding: "12px 14px", overflowX: "auto" },
  errorBanner: { background: C.redSoft, color: "#9A2F2F", border: "1px solid #F3C7C7", borderRadius: 8, padding: "10px 14px", fontSize: 13, flexShrink: 0 },

  kpi: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 },
  kpiIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  kpiLabel: { fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  kpiVal: { fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginTop: 2 },
  kpiSub: { fontSize: 11, color: C.faint, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },


  panel: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", flexShrink: 0, minWidth: 0 },
  secHead: { background: C.panel, borderBottom: `1px solid ${C.line}`, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  secTitle: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.04em" },
  panelBody: { padding: "12px 14px 14px", flex: 1 },
  panelFoot: { borderTop: `1px solid ${C.line}`, background: "#FAFBFD", padding: "8px 14px", fontSize: 11, color: C.faint },
  hint: { fontSize: 11, color: C.faint, marginBottom: 8 },
  badge: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4 },

  donutCenter: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  legendRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  legendLbl: { flex: 1, color: C.navy },
  legendVal: { fontWeight: 700, color: C.ink, minWidth: 20, textAlign: "right" },
  legendPct: { color: C.faint, fontSize: 11, minWidth: 30, textAlign: "right" },

  stackBar: { display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: C.line },
  stackLegend: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 11 },
  stackItem: { display: "flex", alignItems: "center", gap: 5 },

  barRow: { display: "flex", alignItems: "center", gap: 10 },
  barLbl: { fontSize: 12, color: C.navy, width: 110, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  barBg: { flex: 1, height: 18, background: C.panel, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 6, boxSizing: "border-box", transition: "width .3s" },
  barInner: { fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" },
  barVal: { fontSize: 12, fontWeight: 700, color: C.ink, minWidth: 30, textAlign: "right" },
  empty: { fontSize: 12, color: C.faint, padding: "14px 0", textAlign: "center" },

  tableWrap: { maxHeight: 360, overflowY: "auto", overflowX: "auto", WebkitOverflowScrolling: "touch" },
  th: { padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${C.line}` },
  td: { padding: "11px 14px", verticalAlign: "middle", fontSize: 13 },
  tdMsg: { textAlign: "center", padding: 30, color: C.faint, fontSize: 13 },
  statusChip: { padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
};

export default LeaveAnalytics;

// import React, { useState } from "react";
// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import UnivarsalFilter from "../../Reusable/Filter/UnivarsalFilter"
// import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
// import { fetchMonthlyAttendanceSummary } from "../../../utils/api";

// ChartJS.register(ArcElement, Tooltip, Legend);

// // --- MOCK DATA ---
// const LEAVE_STATUS = [
//   { label: "Approved", value: 42, color: "#639922", textColor: "#3B6D11", bg: "#EAF3DE" },
//   { label: "Pending",  value: 14, color: "#EF9F27", textColor: "#854F0B", bg: "#FAEEDA" },
//   { label: "Rejected", value: 8,  color: "#E24B4A", textColor: "#A32D2D", bg: "#FCEBEB" },
// ];

// const LEAVE_TYPES = [
//   { name: "Casual Leave",   count: 18, pct: 75, color: "#378ADD" },
//   { name: "Sick Leave",     count: 13, pct: 55, color: "#1D9E75" },
//   { name: "Earned Leave",   count: 11, pct: 45, color: "#EF9F27" },
//   { name: "Comp Off",       count: 7,  pct: 30, color: "#7F77DD" },
//   { name: "Maternity",      count: 3,  pct: 15, color: "#D4537E" },
// ];

// // FULL VIEW KE LIYE DATA
// const RECENT_REQUESTS = [
//   { id: "LR-101", name: "Rahul Verma", dept: "Engineering", type: "Sick Leave", days: 2, status: "Pending", date: "2026-06-12" },
//   { id: "LR-102", name: "Priya Sharma", dept: "HR", type: "Casual Leave", days: 1, status: "Approved", date: "2026-06-15" },
//   { id: "LR-103", name: "Amit Singh", dept: "Sales", type: "Earned Leave", days: 4, status: "Approved", date: "2026-06-18" },
//   { id: "LR-104", name: "Neha Gupta", dept: "Marketing", type: "Comp Off", days: 1, status: "Rejected", date: "2026-06-20" },
//   { id: "LR-105", name: "Vikas Kumar", dept: "Engineering", type: "Sick Leave", days: 3, status: "Pending", date: "2026-06-22" },
// ];

// const LeaveAnalytics = ({ isHalf = false, onViewAllClick }) => {
//   // Filters for Full View
//   const [filters, setFilters] = useState({ name: "", dept: "", fromDate: "", toDate: "" });

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleClearFilters = () => {
//     setFilters({ name: "", dept: "", fromDate: "", toDate: "" });
//   };

//   const filteredRequests = RECENT_REQUESTS.filter((req) => {
//     const matchName = req.name.toLowerCase().includes(filters.name.toLowerCase());
//     const matchDept = filters.dept === "" || req.dept.toLowerCase() === filters.dept.toLowerCase();
//     let matchDate = true;
//     if (filters.fromDate && req.date < filters.fromDate) matchDate = false;
//     if (filters.toDate && req.date > filters.toDate) matchDate = false;
//     return matchName && matchDept && matchDate;
//   });
//   const currentDate = new Date();

//   const doughnutData = {
//     labels: LEAVE_STATUS.map((s) => s.label),
//     datasets: [
//       {
//         data: LEAVE_STATUS.map((s) => s.value),
//         backgroundColor: LEAVE_STATUS.map((s) => s.color),
//         borderWidth: 0,
//       },
//     ],
//   };
//   const {options}=useGroupOptions();
//   //   const loadSummary = useCallback(async () => {
//   //     setLoading(true);
  
//   //     console.log("===============");
//   //     console.log("MONTH SENT =", filters.month);
//   //     console.log("YEAR SENT =", filters.year);
//   //     console.log("===============");
  
//   //     try {
//   //       const res = await fetchMonthlyAttendanceSummary(
//   //         filters.month,
//   //         filters.year
//   //       );
  
//   //       console.log("API RESPONSE =", res);
  
//   //       if (res.success) {
//   //         console.log("TOTAL ROWS =", res.data?.length);
//   //         console.log("DATA =", res.data);
//   //         setTableData(res.data);
//   //       }
//   //     } catch (e) {
//   //       console.error("Summary fetch error:", e);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //  }, [filters.month, filters.year ]);
  

//   const doughnutOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     cutout: "72%",
//     plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
//   };

//   // ==========================================
//   // 1. AAPKA ORIGINAL DASHBOARD COMPACT VIEW (isHalf = true)
//   // NOTE: this returns a SINGLE card (not a Fragment) — it's the only card
//   // this component renders in compact mode, so it drops into the parent
//   // .fd-bento-grid as exactly one cell. height:"100%" + flex column makes
//   // it stretch to fill the grid's fixed row height (var(--fd-card-h)),
//   // same as every other bento card.
//   // ==========================================
//   if (isHalf) {
//     return (
//       <div style={styles.card}>
//         <div style={styles.cardHdr}>
//           <span style={styles.cardTitle}>Leave analytics — June</span>
//           <span style={styles.action} onClick={onViewAllClick}>View all ↗️</span>
//         </div>

//         {/* Doughnut + status */}
//         <div style={styles.topRow}>
//           <div style={{ width: 125, height: 125, flexShrink: 0, position: "relative" }}>
//             <Doughnut data={doughnutData} options={doughnutOptions} />
//           </div>
//           <div style={styles.statusList}>
//             {LEAVE_STATUS.map((s) => (
//               <div key={s.label} style={styles.statusRow}>
//                 <div style={{ ...styles.dot, background: s.color }} />
//                 <span style={styles.statusLabel}>{s.label}</span>
//                 <span style={{ ...styles.statusVal, color: s.textColor }}>{s.value}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bottom pills */}
//         <div style={styles.pillRow}>
//           {[
//             { label: "On leave today", val: 6 },
           
//             { label: "Expiring this yr", val: 18 },
//           ].map((p) => (
//             <div key={p.label} style={styles.pill}>
//               <div style={styles.pillVal}>{p.val}</div>
//               <div style={styles.pillLbl}>{p.label}</div>
//             </div>
//           ))}
//         </div>

//       </div>
//     );
//   }

//   // ==========================================
//   // 2. NAYA DETAILED ERP REPORT VIEW (isHalf = false)
//   // This is a standalone report page/modal — NOT a bento-grid card, so it
//   // intentionally keeps its own free-form layout (fullCard etc.) and is
//   // not affected by the grid fix.
//   // ==========================================
//   return (
//     <div style={styles.fullCard}>
//       {/* Title Header */}
//       <div style={styles.fullHdr}>
//         <div>
//           <h2 style={styles.fullTitle}>Leave Operations Report</h2>
//           <p style={styles.subText}>Comprehensive view of employee leaves and balances for June 2026.</p>
//         </div>
//         <button style={styles.exportBtn}>↓ Export CSV</button>
//       </div>

//       {/* FILTER BAR
//       <div style={styles.filterBar}>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Employee Name</label>
//           <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search name..." style={styles.inputBox} />
//         </div>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Department</label>
//           <select name="dept" value={filters.dept} onChange={handleFilterChange} style={styles.inputBox}>
//             <option value="">All Departments</option>
//             <option value="engineering">Engineering</option>
//             <option value="hr">HR</option>
//             <option value="sales">Sales</option>
//             <option value="marketing">Marketing</option>
//           </select>
//         </div>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>From Date</label>
//           <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} style={styles.inputBox} />
//         </div>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>To Date</label>
//           <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} style={styles.inputBox} />
//         </div>
//         <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", paddingBottom: "1px" }}>
//           <button style={styles.clearBtn} onClick={handleClearFilters}>Clear Filters</button>
//         </div>
//       </div> */}
//        <UnivarsalFilter
//           options={options}
//             filters={filters}
//             visibleFields={["filterType", "employee", "department"]}
//             setFilters={setFilters}
            
//             onClear={() => {
//               setFilters({
//                 month: currentDate.getMonth() + 1, // 1-12
//                 year: currentDate.getFullYear(),   // 2026
//                 employee_id: "",
//                 department_id: ""
//               });
//             }}
//           />

//       {/* Stats Grid */}
//       <div style={styles.statsGrid}>
//         {[
//           { label: "Total On Leave Today", val: "12", color: "#378ADD" },
//           { label: "Pending Approvals", val: "14", color: "#EF9F27" },
//           { label: "Encashments Due", val: "31", color: "#639922" },
//           { label: "High Absence Dept", val: "Sales", color: "#E24B4A" },
//         ].map((stat, i) => (
//           <div key={i} style={styles.statBox}>
//             <div style={{ fontSize: 13, color: "#666" }}>{stat.label}</div>
//             <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, marginTop: 5 }}>{stat.val}</div>
//           </div>
//         ))}
//       </div>

//       {/* Main Content */}
//       <div style={styles.fullContentWrapper}>
//         {/* Left Chart */}
//         <div style={styles.fullLeftCol}>
//           <h3 style={styles.sectionTitle}>Overall Status</h3>
//           <div style={{ width: 180, height: 180, margin: "10px auto" }}>
//             <Doughnut data={doughnutData} options={doughnutOptions} />
//           </div>
//           <div style={styles.fullStatusList}>
//             {LEAVE_STATUS.map((s) => (
//               <div key={s.label} style={{ textAlign: "center" }}>
//                 <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
//                 <div style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
//                   <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}/> {s.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Right Table */}
//         <div style={styles.fullRightCol}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
//             <h3 style={styles.sectionTitle}>Filtered Requests ({filteredRequests.length})</h3>
//           </div>
//           <div style={styles.tableWrap}>
//             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
//               <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
//                 <tr style={{ borderBottom: "1px solid #eee", color: "#888", fontSize: 12 }}>
//                   <th style={styles.th}>ID & Date</th>
//                   <th style={styles.th}>Employee</th>
//                   <th style={styles.th}>Type</th>
//                   <th style={styles.th}>Days</th>
//                   <th style={styles.th}>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredRequests.length > 0 ? (
//                   filteredRequests.map((req, i) => (
//                     <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
//                       <td style={styles.td}>
//                         <div style={{ fontWeight: 500, color: "#333", fontSize: 12 }}>{req.id}</div>
//                         <div style={{ fontSize: 11, color: "#888" }}>{req.date}</div>
//                       </td>
//                       <td style={styles.td}>
//                         <div style={{ fontWeight: 500, color: "#333", fontSize: 13 }}>{req.name}</div>
//                         <div style={{ fontSize: 11, color: "#888" }}>{req.dept}</div>
//                       </td>
//                       <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.type}</td>
//                       <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.days}</td>
//                       <td style={styles.td}>
//                         <span style={{
//                           padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
//                           backgroundColor: req.status === "Approved" ? "#EAF3DE" : req.status === "Pending" ? "#FAEEDA" : "#FCEBEB",
//                           color: req.status === "Approved" ? "#3B6D11" : req.status === "Pending" ? "#854F0B" : "#A32D2D"
//                         }}>
//                           {req.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
//                       No leave requests found for this filter.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // === STYLES ===
// const styles = {
//   // --- AAPKE ORIGINAL COMPACT VIEW STYLES ---
//   // card: now stretches to fill the fixed bento-grid row height, with the
//   // three sections (topRow / pillRow / typeList) sharing the space via flex
//   // so nothing overflows the fixed card height.
//   card: {
//     background: "#fff",
//     border: "0.5px solid rgba(0,0,0,0.09)",
//     borderRadius: 14,
//     padding: "13px 14px",
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",
//     boxSizing: "border-box",
//     overflow: "hidden",
//   },
//   cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexShrink: 0 },
//   cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
//   action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
//   topRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 30, flexShrink: 0 },
//   statusList: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
//   statusRow: { display: "flex", alignItems: "center", gap: 6 },
//   dot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
//   statusLabel: { fontSize: 11, color: "#555", flex: 1 },
//   statusVal: { fontSize: 11, fontWeight: 500 },
//   pillRow: { display: "flex", gap: 6,paddingBottom: 10, flexShrink: 0 },
//   pill: { flex: 1, background: "#f5f6f8", borderRadius: 8, padding: "7px 8px", textAlign: "center" },
//   pillVal: { fontSize: 16, fontWeight: 500, color: "#1a1a1a" },
//   pillLbl: { fontSize: 10, color: "#888", marginTop: 2 },
//   typeList: { display: "flex", flexDirection: "column", gap: 6, flex: 1, overflow: "hidden", justifyContent: "space-evenly" },
//   ltRow: { display: "flex", alignItems: "center", gap: 7 },
//   ltDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
//   ltName: { fontSize: 11, color: "#333", flex: 1 },
//   ltBarBg: { width: 70, height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
//   ltBar: { height: "100%", borderRadius: 3 },
//   ltCount: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", minWidth: 18, textAlign: "right" },

//   // --- NAYE FULL VIEW STYLES (unchanged — standalone report, not a grid card) ---
//   sectionTitle: { fontSize: 14, fontWeight: 600, color: "#333", margin: 0 },
//   fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
//   fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
//   fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
//   subText: { fontSize: 13, color: "#666", margin: 0 },
//   exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },
  
//   filterBar: { display: "flex", flexWrap: "wrap", gap: "16px", background: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #eaeaea", alignItems: "flex-end" },
//   filterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
//   filterLabel: { fontSize: 12, fontWeight: 600, color: "#555" },
//   inputBox: { padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: 13, outline: "none", minWidth: "140px", background: "#fff" },
//   clearBtn: { padding: "8px 16px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, background: "#fff", color: "#333", cursor: "pointer", fontWeight: 500 },

//   statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "30px" },
//   statBox: { background: "#fafbfc", border: "1px solid #f0f2f5", padding: "16px", borderRadius: 8 },

//   fullContentWrapper: { display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" },
//   fullLeftCol: { border: "1px solid #eee", padding: "20px", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center" },
//   fullStatusList: { display: "flex", justifyContent: "space-around", width: "100%", marginTop: 10 },
//   fullRightCol: { border: "1px solid #eee", padding: "20px", borderRadius: 8, background: "#fff", display: "flex", flexDirection: "column" },
  
//   tableWrap: { maxHeight: "350px", overflowY: "auto", overflowX: "auto", border: "1px solid #f0f0f0", borderRadius: "8px" },
//   th: { padding: "12px 10px", fontWeight: 600 },
//   td: { padding: "12px 10px", verticalAlign: "middle" },
// };

// export default LeaveAnalytics;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import UnivarsalFilter from "../../Reusable/Filter/UnivarsalFilter";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import {
  getLeaveRequests,
  getLeaveEncashments,
  getLeaveBalance,
} from "../../../utils/api";

ChartJS.register(ArcElement, Tooltip, Legend);

// ─────────────────────────────────────────────────────────────────
// 🔧 ADJUST HERE if your leave-request / encashment API returns
// different field names. `pick()` tries every key in order and
// returns the first non-empty value.
// ─────────────────────────────────────────────────────────────────
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

const STATUS_STYLE = {
  Approved: { color: "#639922", textColor: "#3B6D11", bg: "#EAF3DE" },
  Pending: { color: "#EF9F27", textColor: "#854F0B", bg: "#FAEEDA" },
  Rejected: { color: "#E24B4A", textColor: "#A32D2D", bg: "#FCEBEB" },
};

// fallback palette for leave-type bars when a type isn't in the known list
const TYPE_COLOR_MAP = {
  "Casual Leave": "#378ADD",
  "Sick Leave": "#1D9E75",
  "Earned Leave": "#EF9F27",
  "Comp Off": "#7F77DD",
  Maternity: "#D4537E",
};
const FALLBACK_PALETTE = ["#378ADD", "#1D9E75", "#EF9F27", "#7F77DD", "#D4537E", "#A855F7", "#F97316"];

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

const LeaveAnalytics = ({ isHalf = false, onViewAllClick }) => {
  const currentDate = useMemo(() => new Date(), []);
  const today = useMemo(() => toDateOnly(currentDate), [currentDate]);

  // Filters for Full View — shape matches what UnivarsalFilter reads/writes
  const [filters, setFilters] = useState({
    month: currentDate.getMonth() + 1, // 1-12
    year: currentDate.getFullYear(),
    employee_id: "",
    department_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requests, setRequests] = useState([]);
  const [encashments, setEncashments] = useState([]);
  const [balances, setBalances] = useState([]);

  const { options } = useGroupOptions();

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

  // ── normalise raw requests into a consistent shape ─────────────
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

  // requests that fall in the currently selected month/year (used for the compact dashboard card + full-view stats)
  const monthRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (!r.from) return false;
      return r.from.getMonth() + 1 === filters.month && r.from.getFullYear() === filters.year;
    });
  }, [allRequests, filters.month, filters.year]);

  // ── LEAVE_STATUS (doughnut) ─────────────────────────────────────
  const LEAVE_STATUS = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    monthRequests.forEach((r) => {
      if (counts[r.status] === undefined) counts[r.status] = 0;
      counts[r.status] += 1;
    });
    return Object.keys(STATUS_STYLE).map((label) => ({
      label,
      value: counts[label] || 0,
      ...STATUS_STYLE[label],
    }));
  }, [monthRequests]);

  // ── LEAVE_TYPES breakdown (bars) ────────────────────────────────
  const LEAVE_TYPES = useMemo(() => {
    const byType = {};
    monthRequests.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    const entries = Object.entries(byType);
    const max = Math.max(1, ...entries.map(([, c]) => c));
    return entries
      .map(([name, count], i) => ({
        name,
        count,
        pct: Math.round((count / max) * 100),
        color: TYPE_COLOR_MAP[name] || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthRequests]);

  // ── bottom pills (compact view) ─────────────────────────────────
  const onLeaveTodayCount = useMemo(
    () => allRequests.filter((r) => r.status === "Approved" && isBetween(today, r.from, r.to)).length,
    [allRequests, today]
  );

  const expiringThisYear = useMemo(() => {
    // Sum of any "expiring"-like field on the balance records; adjust keys as per your API.
    return balances.reduce((sum, b) => {
      const val = pick(b, ["expiring_days", "expire_days", "expiring_balance", "carry_forward_expiring"]);
      return sum + (Number(val) || 0);
    }, 0);
  }, [balances]);

  // ── full-view stats ─────────────────────────────────────────────
  const pendingApprovalsCount = useMemo(
    () => allRequests.filter((r) => r.status === "Pending").length,
    [allRequests]
  );

  const encashmentsDueCount = useMemo(() => {
    return encashments.filter((e) => {
      const s = String(pick(e, ENC_KEYS.status) || "").toLowerCase();
      return !s || s.includes("pend") || s.includes("due");
    }).length;
  }, [encashments]);

  const highAbsenceDept = useMemo(() => {
    const byDept = {};
    monthRequests
      .filter((r) => r.status === "Approved")
      .forEach((r) => {
        byDept[r.dept] = (byDept[r.dept] || 0) + 1;
      });
    const sorted = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : "—";
  }, [monthRequests]);

  // ── filtered requests table (full view) ─────────────────────────
  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (!r.from) return false;
      const matchMonthYear = r.from.getMonth() + 1 === filters.month && r.from.getFullYear() === filters.year;
      const matchEmployee = !filters.employee_id || String(r.employeeId) === String(filters.employee_id);
      const matchDept = !filters.department_id || String(r.deptId) === String(filters.department_id);
      return matchMonthYear && matchEmployee && matchDept;
    });
  }, [allRequests, filters]);

  const doughnutData = {
    labels: LEAVE_STATUS.map((s) => s.label),
    datasets: [
      {
        data: LEAVE_STATUS.map((s) => s.value),
        backgroundColor: LEAVE_STATUS.map((s) => s.color),
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Employee", "Department", "Type", "Days", "Status", "Date"];
    const rows = filteredRequests.map((r) => [
      `"${r.id}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.dept.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      r.days,
      `"${r.status}"`,
      `"${r.dateStr}"`,
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

  // ==========================================
  // 1. COMPACT DASHBOARD VIEW (isHalf = true)
  // ==========================================
  if (isHalf) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Leave analytics — {monthLabel}</span>
          <span style={styles.action} onClick={onViewAllClick}>View all ↗️</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
            <div style={styles.skeletonRow} />
            <div style={styles.skeletonRow} />
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#E24B4A" }}>
            Couldn't load leave data
          </div>
        ) : (
          <>
            {/* Doughnut + status */}
            <div style={styles.topRow}>
              <div style={{ width: 125, height: 125, flexShrink: 0, position: "relative" }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
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

            {/* Bottom pills */}
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

  // ==========================================
  // 2. DETAILED ERP REPORT VIEW (isHalf = false)
  // ==========================================
  return (
    <div style={styles.fullCard}>
      {/* Title Header */}
      <div style={styles.fullHdr}>
        <div>
          <h2 style={styles.fullTitle}>Leave Operations Report</h2>
          <p style={styles.subText}>Comprehensive view of employee leaves and balances for {monthLabel} {filters.year}.</p>
        </div>
        <button style={styles.exportBtn} onClick={handleExportCSV}>↓ Export CSV</button>
      </div>

      <UnivarsalFilter
        options={options}
        filters={filters}
        visibleFields={["filterType", "employee", "department"]}
        setFilters={setFilters}
        onClear={() => {
          setFilters({
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            employee_id: "",
            department_id: "",
          });
        }}
      />

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {[
          { label: "Total On Leave Today", val: String(onLeaveTodayCount), color: "#378ADD" },
          { label: "Pending Approvals", val: String(pendingApprovalsCount), color: "#EF9F27" },
          { label: "Encashments Due", val: String(encashmentsDueCount), color: "#639922" },
          { label: "High Absence Dept", val: highAbsenceDept, color: "#E24B4A" },
        ].map((stat, i) => (
          <div key={i} style={styles.statBox}>
            <div style={{ fontSize: 13, color: "#666" }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, marginTop: 5 }}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.fullContentWrapper}>
        {/* Left Chart */}
        <div style={styles.fullLeftCol}>
          <h3 style={styles.sectionTitle}>Overall Status</h3>
          <div style={{ width: 180, height: 180, margin: "10px auto" }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={styles.fullStatusList}>
            {LEAVE_STATUS.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} /> {s.label}
                </div>
              </div>
            ))}
          </div>

          {LEAVE_TYPES.length > 0 && (
            <div style={{ width: "100%", marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {LEAVE_TYPES.map((t) => (
                <div key={t.name} style={styles.ltRow}>
                  <div style={{ ...styles.ltDot, background: t.color }} />
                  <span style={styles.ltName}>{t.name}</span>
                  <div style={styles.ltBarBg}>
                    <div style={{ ...styles.ltBar, width: `${t.pct}%`, background: t.color }} />
                  </div>
                  <span style={styles.ltCount}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Table */}
        <div style={styles.fullRightCol}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
            <h3 style={styles.sectionTitle}>Filtered Requests ({filteredRequests.length})</h3>
          </div>
          <div style={styles.tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <tr style={{ borderBottom: "1px solid #eee", color: "#888", fontSize: 12 }}>
                  <th style={styles.th}>ID & Date</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      Loading leave requests…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#E24B4A" }}>
                      Couldn't load leave requests. Please refresh.
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500, color: "#333", fontSize: 12 }}>{req.id}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{req.dateStr}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500, color: "#333", fontSize: 13 }}>{req.name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{req.dept}</div>
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.type}</td>
                      <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.days}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: STATUS_STYLE[req.status]?.bg || "#f0f0f0",
                            color: STATUS_STYLE[req.status]?.textColor || "#555",
                          }}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      No leave requests found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// === STYLES ===
const styles = {
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderRadius: 14,
    padding: "13px 14px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
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

  ltRow: { display: "flex", alignItems: "center", gap: 7 },
  ltDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  ltName: { fontSize: 11, color: "#333", flex: 1 },
  ltBarBg: { width: 70, height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
  ltBar: { height: "100%", borderRadius: 3 },
  ltCount: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", minWidth: 18, textAlign: "right" },

  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#333", margin: 0 },
  fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
  fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
  subText: { fontSize: 13, color: "#666", margin: 0 },
  exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "30px" },
  statBox: { background: "#fafbfc", border: "1px solid #f0f2f5", padding: "16px", borderRadius: 8 },

  fullContentWrapper: { display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" },
  fullLeftCol: { border: "1px solid #eee", padding: "20px", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center" },
  fullStatusList: { display: "flex", justifyContent: "space-around", width: "100%", marginTop: 10 },
  fullRightCol: { border: "1px solid #eee", padding: "20px", borderRadius: 8, background: "#fff", display: "flex", flexDirection: "column" },

  tableWrap: { maxHeight: "350px", overflowY: "auto", overflowX: "auto", border: "1px solid #f0f0f0", borderRadius: "8px" },
  th: { padding: "12px 10px", fontWeight: 600 },
  td: { padding: "12px 10px", verticalAlign: "middle" },
};

export default LeaveAnalytics;
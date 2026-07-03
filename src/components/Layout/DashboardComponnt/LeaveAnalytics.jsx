// // import React from "react";
// // import { Doughnut } from "react-chartjs-2";
// // import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// // ChartJS.register(ArcElement, Tooltip, Legend);

// // const LEAVE_STATUS = [
// //   { label: "Approved", value: 42, color: "#639922", textColor: "#3B6D11", bg: "#EAF3DE" },
// //   { label: "Pending",  value: 14, color: "#EF9F27", textColor: "#854F0B", bg: "#FAEEDA" },
// //   { label: "Rejected", value: 8,  color: "#E24B4A", textColor: "#A32D2D", bg: "#FCEBEB" },
// // ];

// // const LEAVE_TYPES = [
// //   { name: "Casual Leave",   count: 18, pct: 75, color: "#378ADD" },
// //   { name: "Sick Leave",     count: 13, pct: 55, color: "#1D9E75" },
// //   { name: "Earned Leave",   count: 11, pct: 45, color: "#EF9F27" },
// //   { name: "Comp Off",       count: 7,  pct: 30, color: "#7F77DD" },
// //   { name: "Maternity",      count: 3,  pct: 15, color: "#D4537E" },
// // ];

// // const LeaveAnalytics = () => {
// //   const doughnutData = {
// //     labels: LEAVE_STATUS.map((s) => s.label),
// //     datasets: [
// //       {
// //         data: LEAVE_STATUS.map((s) => s.value),
// //         backgroundColor: LEAVE_STATUS.map((s) => s.color),
// //         borderWidth: 0,
// //       },
// //     ],
// //   };

// //   const doughnutOptions = {
// //     responsive: true,
// //     maintainAspectRatio: false,
// //     cutout: "72%",
// //     plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } } },
// //   };

// //   return (
// //     <div style={styles.card}>
// //       <div style={styles.cardHdr}>
// //         <span style={styles.cardTitle}>Leave analytics — June</span>
// //         <span style={styles.action}>View all ↗</span>
// //       </div>

// //       {/* Doughnut + status */}
// //       <div style={styles.topRow}>
// //         <div style={{ width: 80, height: 80, flexShrink: 0, position: "relative" }}>
// //           <Doughnut data={doughnutData} options={doughnutOptions} />
// //         </div>
// //         <div style={styles.statusList}>
// //           {LEAVE_STATUS.map((s) => (
// //             <div key={s.label} style={styles.statusRow}>
// //               <div style={{ ...styles.dot, background: s.color }} />
// //               <span style={styles.statusLabel}>{s.label}</span>
// //               <span style={{ ...styles.statusVal, color: s.textColor }}>{s.value}</span>
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Bottom pills */}
// //       <div style={styles.pillRow}>
// //         {[
// //           { label: "On leave today", val: 6 },
// //           { label: "Encashment due", val: 31 },
// //           { label: "Expiring this yr", val: 18 },
// //         ].map((p) => (
// //           <div key={p.label} style={styles.pill}>
// //             <div style={styles.pillVal}>{p.val}</div>
// //             <div style={styles.pillLbl}>{p.label}</div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Leave type bars */}
// //       <div style={styles.typeList}>
// //         {LEAVE_TYPES.map((lt) => (
// //           <div key={lt.name} style={styles.ltRow}>
// //             <div style={{ ...styles.ltDot, background: lt.color }} />
// //             <span style={styles.ltName}>{lt.name}</span>
// //             <div style={styles.ltBarBg}>
// //               <div style={{ ...styles.ltBar, width: `${lt.pct}%`, background: lt.color }} />
// //             </div>
// //             <span style={styles.ltCount}>{lt.count}</span>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // const styles = {
// //   card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px" },
// //   cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
// //   cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
// //   action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
// //   topRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 10 },
// //   statusList: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
// //   statusRow: { display: "flex", alignItems: "center", gap: 6 },
// //   dot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
// //   statusLabel: { fontSize: 11, color: "#555", flex: 1 },
// //   statusVal: { fontSize: 11, fontWeight: 500 },
// //   pillRow: {
// //     display: "flex", gap: 6, marginBottom: 10,
// //     paddingBottom: 10, borderBottom: "0.5px solid rgba(0,0,0,0.07)",
// //   },
// //   pill: {
// //     flex: 1, background: "#f5f6f8", borderRadius: 8,
// //     padding: "7px 8px", textAlign: "center",
// //   },
// //   pillVal: { fontSize: 16, fontWeight: 500, color: "#1a1a1a" },
// //   pillLbl: { fontSize: 10, color: "#888", marginTop: 2 },
// //   typeList: { display: "flex", flexDirection: "column", gap: 6 },
// //   ltRow: { display: "flex", alignItems: "center", gap: 7 },
// //   ltDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
// //   ltName: { fontSize: 11, color: "#333", flex: 1 },
// //   ltBarBg: { width: 70, height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
// //   ltBar: { height: "100%", borderRadius: 3 },
// //   ltCount: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", minWidth: 18, textAlign: "right" },
// // };

// // export default LeaveAnalytics;

// import React, { useState } from "react";
// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// // --- MOCK DATA ---
// const LEAVE_STATUS = [
//   { label: "Approved", value: 42, color: "#639922", textColor: "#3B6D11" },
//   { label: "Pending",  value: 14, color: "#EF9F27", textColor: "#854F0B" },
//   { label: "Rejected", value: 8,  color: "#E24B4A", textColor: "#A32D2D" },
// ];

// const LEAVE_TYPES = [
//   { name: "Casual Leave",   count: 18, pct: 75, color: "#378ADD" },
//   { name: "Sick Leave",     count: 13, pct: 55, color: "#1D9E75" },
//   { name: "Earned Leave",   count: 11, pct: 45, color: "#EF9F27" },
//   { name: "Comp Off",       count: 7,  pct: 30, color: "#7F77DD" },
// ];

// // MOCK DATA में 'date' ऐड की है ताकि डेट फ़िल्टर भी काम कर सके
// const RECENT_REQUESTS = [
//   { id: "LR-101", name: "Rahul Verma", dept: "Engineering", type: "Sick Leave", days: 2, status: "Pending", date: "2026-06-12" },
//   { id: "LR-102", name: "Priya Sharma", dept: "HR", type: "Casual Leave", days: 1, status: "Approved", date: "2026-06-15" },
//   { id: "LR-103", name: "Amit Singh", dept: "Sales", type: "Earned Leave", days: 4, status: "Approved", date: "2026-06-18" },
//   { id: "LR-104", name: "Neha Gupta", dept: "Marketing", type: "Comp Off", days: 1, status: "Rejected", date: "2026-06-20" },
//   { id: "LR-105", name: "Vikas Kumar", dept: "Engineering", type: "Sick Leave", days: 3, status: "Pending", date: "2026-06-22" },
//   { id: "LR-106", name: "Rajat Dalal", dept: "IT", type: "Casual Leave", days: 2, status: "Approved", date: "2026-06-25" },
//   { id: "LR-107", name: "Simran Kaur", dept: "Finance", type: "Earned Leave", days: 5, status: "Pending", date: "2026-06-28" },
//   { id: "LR-108", name: "Ankit Jain", dept: "Operations", type: "Sick Leave", days: 1, status: "Rejected", date: "2026-06-29" },
// ];

// const LeaveAnalytics = ({ isHalf = false }) => {
//   // ==========================================
//   // FILTER STATE & LOGIC
//   // ==========================================
//   const [filters, setFilters] = useState({
//     name: "",
//     dept: "",
//     fromDate: "",
//     toDate: ""
//   });

//   // इनपुट चेंज हैंडलर
//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   // क्लियर फ़िल्टर
//   const handleClearFilters = () => {
//     setFilters({ name: "", dept: "", fromDate: "", toDate: "" });
//   };

//   // असली डेटा को फ़िल्टर करने का फंक्शन
//   const filteredRequests = RECENT_REQUESTS.filter((req) => {
//     // 1. Name Check
//     const matchName = req.name.toLowerCase().includes(filters.name.toLowerCase());
    
//     // 2. Department Check
//     const matchDept = filters.dept === "" || req.dept.toLowerCase() === filters.dept.toLowerCase();
    
//     // 3. Date Check
//     let matchDate = true;
//     if (filters.fromDate && req.date < filters.fromDate) matchDate = false;
//     if (filters.toDate && req.date > filters.toDate) matchDate = false;

//     return matchName && matchDept && matchDate;
//   });

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

//   // ==========================================
//   // 1. DASHBOARD COMPACT VIEW
//   // ==========================================
//   if (isHalf) {
//     return (
//       <div style={styles.compactCard}>
//         <div style={styles.compactHdr}>
//           <span style={styles.compactTitle}>Leave analytics — June</span>
//           <span style={styles.action}>View all ↗️</span>
//         </div>

//         <div style={styles.compactTopRow}>
//           <div style={{ width: 80, height: 80, flexShrink: 0 }}>
//             <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false } } }} />
//           </div>
//           <div style={styles.compactStatusList}>
//             {LEAVE_STATUS.map((s) => (
//               <div key={s.label} style={styles.compactStatusRow}>
//                 <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
//                 <span style={{ color: "#555", fontSize: 11, flex: 1 }}>{s.label}</span>
//                 <span style={{ fontWeight: 600, color: s.textColor, fontSize: 11 }}>{s.value}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div style={styles.compactPillRow}>
//           {[
//             { label: "On leave", val: 6 },
//             { label: "Due", val: 31 },
//           ].map((p) => (
//             <div key={p.label} style={styles.compactPill}>
//               <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: 16 }}>{p.val}</div>
//               <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>{p.label}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // ==========================================
//   // 2. DETAILED ERP REPORT VIEW
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

//       {/* FILTER BAR */}
//       <div style={styles.filterBar}>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Employee Name</label>
//           <input 
//             type="text" 
//             name="name"
//             value={filters.name}
//             onChange={handleFilterChange}
//             placeholder="Search name..." 
//             style={styles.inputBox} 
//           />
//         </div>

//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Department</label>
//           <select 
//             name="dept"
//             value={filters.dept}
//             onChange={handleFilterChange}
//             style={styles.inputBox}
//           >
//             <option value="">All Departments</option>
//             <option value="engineering">Engineering</option>
//             <option value="hr">HR</option>
//             <option value="sales">Sales</option>
//             <option value="marketing">Marketing</option>
//             <option value="it">IT</option>
//             <option value="finance">Finance</option>
//             <option value="operations">Operations</option>
//           </select>
//         </div>

//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>From Date</label>
//           <input 
//             type="date" 
//             name="fromDate"
//             value={filters.fromDate}
//             onChange={handleFilterChange}
//             style={styles.inputBox} 
//           />
//         </div>

//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>To Date</label>
//           <input 
//             type="date" 
//             name="toDate"
//             value={filters.toDate}
//             onChange={handleFilterChange}
//             style={styles.inputBox} 
//           />
//         </div>

//         <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", paddingBottom: "1px" }}>
//           {/* Apply button is optional now because it filters automatically onChange, but we keep clear */}
//           <button style={styles.clearBtn} onClick={handleClearFilters}>Clear Filters</button>
//         </div>
//       </div>

//       {/* Top Stat Summary Grid */}
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

//       {/* Main Content Layout (2 Columns) */}
//       <div style={styles.fullContentWrapper}>
        
//         {/* Left Col: Charts */}
//         <div style={styles.fullLeftCol}>
//           <h3 style={styles.sectionTitle}>Overall Status</h3>
//           <div style={{ width: 180, height: 180, margin: "10px auto" }}>
//             <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: "75%", plugins: { legend: { display: false } } }} />
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

//           <div style={{ marginTop: 30, width: "100%" }}>
//             <h3 style={styles.sectionTitle}>Leave Balances by Type</h3>
//             <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 15 }}>
//               {LEAVE_TYPES.map((lt) => (
//                 <div key={lt.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <span style={{ fontSize: 13, color: "#333", width: 90 }}>{lt.name}</span>
//                   <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4 }}>
//                     <div style={{ height: "100%", width: `${lt.pct}%`, background: lt.color, borderRadius: 4 }} />
//                   </div>
//                   <span style={{ fontSize: 13, fontWeight: 600, color: "#111", width: 30, textAlign: "right" }}>{lt.count}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Right Col: Data Table */}
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
//   action: { fontSize: 12, color: "#185FA5", cursor: "pointer", fontWeight: 500 },
//   sectionTitle: { fontSize: 14, fontWeight: 600, color: "#333", margin: 0 },

//   compactCard: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "12px" },
//   compactHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
//   compactTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase" },
//   compactTopRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
//   compactStatusList: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
//   compactStatusRow: { display: "flex", alignItems: "center", gap: 6 },
//   compactPillRow: { display: "flex", gap: 6 },
//   compactPill: { flex: 1, background: "#f5f6f8", borderRadius: 6, padding: "6px", textAlign: "center" },

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
import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// --- MOCK DATA ---
const LEAVE_STATUS = [
  { label: "Approved", value: 42, color: "#639922", textColor: "#3B6D11", bg: "#EAF3DE" },
  { label: "Pending",  value: 14, color: "#EF9F27", textColor: "#854F0B", bg: "#FAEEDA" },
  { label: "Rejected", value: 8,  color: "#E24B4A", textColor: "#A32D2D", bg: "#FCEBEB" },
];

const LEAVE_TYPES = [
  { name: "Casual Leave",   count: 18, pct: 75, color: "#378ADD" },
  { name: "Sick Leave",     count: 13, pct: 55, color: "#1D9E75" },
  { name: "Earned Leave",   count: 11, pct: 45, color: "#EF9F27" },
  { name: "Comp Off",       count: 7,  pct: 30, color: "#7F77DD" },
  { name: "Maternity",      count: 3,  pct: 15, color: "#D4537E" },
];

// FULL VIEW KE LIYE DATA
const RECENT_REQUESTS = [
  { id: "LR-101", name: "Rahul Verma", dept: "Engineering", type: "Sick Leave", days: 2, status: "Pending", date: "2026-06-12" },
  { id: "LR-102", name: "Priya Sharma", dept: "HR", type: "Casual Leave", days: 1, status: "Approved", date: "2026-06-15" },
  { id: "LR-103", name: "Amit Singh", dept: "Sales", type: "Earned Leave", days: 4, status: "Approved", date: "2026-06-18" },
  { id: "LR-104", name: "Neha Gupta", dept: "Marketing", type: "Comp Off", days: 1, status: "Rejected", date: "2026-06-20" },
  { id: "LR-105", name: "Vikas Kumar", dept: "Engineering", type: "Sick Leave", days: 3, status: "Pending", date: "2026-06-22" },
];

const LeaveAnalytics = ({ isHalf = false, onViewAllClick }) => {
  // Filters for Full View
  const [filters, setFilters] = useState({ name: "", dept: "", fromDate: "", toDate: "" });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ name: "", dept: "", fromDate: "", toDate: "" });
  };

  const filteredRequests = RECENT_REQUESTS.filter((req) => {
    const matchName = req.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchDept = filters.dept === "" || req.dept.toLowerCase() === filters.dept.toLowerCase();
    let matchDate = true;
    if (filters.fromDate && req.date < filters.fromDate) matchDate = false;
    if (filters.toDate && req.date > filters.toDate) matchDate = false;
    return matchName && matchDept && matchDate;
  });

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

  // ==========================================
  // 1. AAPKA ORIGINAL DASHBOARD COMPACT VIEW (isHalf = true)
  // ==========================================
  if (isHalf) {
    return (
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Leave analytics — June</span>
          <span style={styles.action} onClick={onViewAllClick}>View all ↗️</span>
        </div>

        {/* Doughnut + status */}
        <div style={styles.topRow}>
          <div style={{ width: 80, height: 80, flexShrink: 0, position: "relative" }}>
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
            { label: "On leave today", val: 6 },
            { label: "Encashment due", val: 31 },
            { label: "Expiring this yr", val: 18 },
          ].map((p) => (
            <div key={p.label} style={styles.pill}>
              <div style={styles.pillVal}>{p.val}</div>
              <div style={styles.pillLbl}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Leave type bars */}
        <div style={styles.typeList}>
          {LEAVE_TYPES.map((lt) => (
            <div key={lt.name} style={styles.ltRow}>
              <div style={{ ...styles.ltDot, background: lt.color }} />
              <span style={styles.ltName}>{lt.name}</span>
              <div style={styles.ltBarBg}>
                <div style={{ ...styles.ltBar, width: `${lt.pct}%`, background: lt.color }} />
              </div>
              <span style={styles.ltCount}>{lt.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. NAYA DETAILED ERP REPORT VIEW (isHalf = false)
  // ==========================================
  return (
    <div style={styles.fullCard}>
      {/* Title Header */}
      <div style={styles.fullHdr}>
        <div>
          <h2 style={styles.fullTitle}>Leave Operations Report</h2>
          <p style={styles.subText}>Comprehensive view of employee leaves and balances for June 2026.</p>
        </div>
        <button style={styles.exportBtn}>↓ Export CSV</button>
      </div>

      {/* FILTER BAR */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Employee Name</label>
          <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search name..." style={styles.inputBox} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Department</label>
          <select name="dept" value={filters.dept} onChange={handleFilterChange} style={styles.inputBox}>
            <option value="">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="hr">HR</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>From Date</label>
          <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} style={styles.inputBox} />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>To Date</label>
          <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} style={styles.inputBox} />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", paddingBottom: "1px" }}>
          <button style={styles.clearBtn} onClick={handleClearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {[
          { label: "Total On Leave Today", val: "12", color: "#378ADD" },
          { label: "Pending Approvals", val: "14", color: "#EF9F27" },
          { label: "Encashments Due", val: "31", color: "#639922" },
          { label: "High Absence Dept", val: "Sales", color: "#E24B4A" },
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
                  <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}/> {s.label}
                </div>
              </div>
            ))}
          </div>
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
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500, color: "#333", fontSize: 12 }}>{req.id}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{req.date}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500, color: "#333", fontSize: 13 }}>{req.name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{req.dept}</div>
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.type}</td>
                      <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{req.days}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                          backgroundColor: req.status === "Approved" ? "#EAF3DE" : req.status === "Pending" ? "#FAEEDA" : "#FCEBEB",
                          color: req.status === "Approved" ? "#3B6D11" : req.status === "Pending" ? "#854F0B" : "#A32D2D"
                        }}>
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
  // --- AAPKE ORIGINAL COMPACT VIEW STYLES ---
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px" },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  topRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 10 },
  statusList: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
  statusRow: { display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  statusLabel: { fontSize: 11, color: "#555", flex: 1 },
  statusVal: { fontSize: 11, fontWeight: 500 },
  pillRow: { display: "flex", gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: "0.5px solid rgba(0,0,0,0.07)" },
  pill: { flex: 1, background: "#f5f6f8", borderRadius: 8, padding: "7px 8px", textAlign: "center" },
  pillVal: { fontSize: 16, fontWeight: 500, color: "#1a1a1a" },
  pillLbl: { fontSize: 10, color: "#888", marginTop: 2 },
  typeList: { display: "flex", flexDirection: "column", gap: 6 },
  ltRow: { display: "flex", alignItems: "center", gap: 7 },
  ltDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  ltName: { fontSize: 11, color: "#333", flex: 1 },
  ltBarBg: { width: 70, height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
  ltBar: { height: "100%", borderRadius: 3 },
  ltCount: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", minWidth: 18, textAlign: "right" },

  // --- NAYE FULL VIEW STYLES ---
  sectionTitle: { fontSize: 14, fontWeight: 600, color: "#333", margin: 0 },
  fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
  fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
  subText: { fontSize: 13, color: "#666", margin: 0 },
  exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },
  
  filterBar: { display: "flex", flexWrap: "wrap", gap: "16px", background: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #eaeaea", alignItems: "flex-end" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  filterLabel: { fontSize: 12, fontWeight: 600, color: "#555" },
  inputBox: { padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: 13, outline: "none", minWidth: "140px", background: "#fff" },
  clearBtn: { padding: "8px 16px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, background: "#fff", color: "#333", cursor: "pointer", fontWeight: 500 },

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
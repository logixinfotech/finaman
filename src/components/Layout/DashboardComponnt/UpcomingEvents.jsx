
// import React, { useState, useRef, useEffect } from "react";

// const TABS = ["Today", "This week", "All"];
// const FILTER_TYPES = ["All", "birthday", "anniversary", "holiday", "probation", "payroll", "contract"];

// const EVENTS = [
//   {
//     id: 1,
//     type: "birthday",
//     icon: "ti ti-cake",
//     title: "Ravi Kumar",
//     sub: "Birthday today",
//     day: "Today",
//     dayColor: "#185FA5",
//     dayBg: "#E6F1FB",
//     iconBg: "#E6F1FB",
//     iconColor: "#185FA5",
//     when: 0,
//     dept: "Engineering", action: "Send Wishes", dateStr: "29 Jun 2026",
//   },
//   {
//     id: 2,
//     type: "anniversary",
//     icon: "ti ti-star",
//     title: "Sneha Verma",
//     sub: "5-year work anniversary",
//     day: "Today",
//     dayColor: "#185FA5",
//     dayBg: "#E6F1FB",
//     iconBg: "#EEEDFE",
//     iconColor: "#534AB7",
//     when: 0,
//     dept: "Marketing", action: "Send Badge", dateStr: "29 Jun 2026",
//   },
//   {
//     id: 3,
//     type: "holiday",
//     icon: "ti ti-flag",
//     title: "Bank Holiday",
//     sub: "Eid-ul-Adha — office closed",
//     day: "Tomorrow",
//     dayColor: "#854F0B",
//     dayBg: "#FAEEDA",
//     iconBg: "#FAEEDA",
//     iconColor: "#854F0B",
//     when: 1,
//     dept: "All India", action: "View Policy", dateStr: "30 Jun 2026",
//   },
//   {
//     id: 4,
//     type: "probation",
//     icon: "ti ti-user-check",
//     title: "Trivesh Sharma",
//     sub: "Probation ends — confirmation due",
//     day: "27 Jun",
//     dayColor: "#3B6D11",
//     dayBg: "#EAF3DE",
//     iconBg: "#EAF3DE",
//     iconColor: "#3B6D11",
//     when: 2,
//     dept: "Sales", action: "Review", dateStr: "27 Jun 2026",
//   },
//   {
//     id: 5,
//     type: "probation",
//     icon: "ti ti-user-check",
//     title: "Neha Joshi",
//     sub: "Probation ends — confirmation due",
//     day: "28 Jun",
//     dayColor: "#3B6D11",
//     dayBg: "#EAF3DE",
//     iconBg: "#EAF3DE",
//     iconColor: "#3B6D11",
//     when: 3,
//     dept: "HR", action: "Review", dateStr: "28 Jun 2026",
//   },
//   {
//     id: 6,
//     type: "payroll",
//     icon: "ti ti-report-money",
//     title: "Payroll Deadline",
//     sub: "June salary processing cutoff",
//     day: "30 Jun",
//     dayColor: "#A32D2D",
//     dayBg: "#FCEBEB",
//     iconBg: "#FCEBEB",
//     iconColor: "#A32D2D",
//     when: 5,
//     dept: "Finance", action: "Run Payroll", dateStr: "30 Jun 2026",
//   },
//   {
//     id: 7,
//     type: "birthday",
//     icon: "ti ti-cake",
//     title: "Priya Sharma",
//     sub: "Birthday",
//     day: "29 Jun",
//     dayColor: "#185FA5",
//     dayBg: "#E6F1FB",
//     iconBg: "#E6F1FB",
//     iconColor: "#185FA5",
//     when: 4,
//     dept: "Design", action: "Send Wishes", dateStr: "29 Jun 2026",
//   },
//   {
//     id: 8,
//     type: "contract",
//     icon: "ti ti-file-description",
//     title: "Dev Gupta",
//     sub: "Contract renewal due",
//     day: "30 Jun",
//     dayColor: "#854F0B",
//     dayBg: "#FAEEDA",
//     iconBg: "#FAEEDA",
//     iconColor: "#854F0B",
//     when: 5,
//     dept: "IT Support", action: "Renew/Terminate", dateStr: "30 Jun 2026",
//   },
// ];

// const UpcomingEvents = ({ isHalf = false, onViewFullCalendar }) => {
//   // Compact View States
//   const [activeTab, setActiveTab] = useState("Today"); // default = Today
//   const [filterOpen, setFilterOpen] = useState(false);
//   const filterRef = useRef(null);

//   // Detailed View States
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedType, setSelectedType] = useState("All");

//   // Close the corner filter dropdown when clicking outside it
//   useEffect(() => {
//     if (!isHalf) return;
//     const handleClickOutside = (e) => {
//       if (filterRef.current && !filterRef.current.contains(e.target)) {
//         setFilterOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isHalf]);

//   // --- COMPACT VIEW LOGIC ---
//   const filtered = EVENTS.filter((e) => {
//     if (activeTab === "Today") return e.when === 0;
//     if (activeTab === "This week") return e.when <= 6;
//     return true;
//   });

//   const groups = filtered.reduce((acc, e) => {
//     const key = e.day;
//     if (!acc[key]) acc[key] = [];
//     acc[key].push(e);
//     return acc;
//   }, {});

//   // --- FULL VIEW LOGIC ---
//   const detailedFiltered = EVENTS.filter((e) => {
//     const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.dept.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchType = selectedType === "All" || e.type === selectedType;
//     return matchSearch && matchType;
//   });

//   const getEventCount = (type) => EVENTS.filter(e => e.type === type).length;

//   // --- EXPORT FUNCTIONALITY ---
//   const handleExportCSV = () => {
//     const headers = ["Title", "Description", "Date", "Timeline Status", "Category", "Department"];

//     const rows = detailedFiltered.map((e) => [
//       `"${e.title.replace(/"/g, '""')}"`,
//       `"${e.sub.replace(/"/g, '""')}"`,
//       `"${e.dateStr}"`,
//       `"${e.day}"`,
//       `"${e.type}"`,
//       `"${e.dept}"`
//     ]);

//     const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute("download", "upcoming_events_schedule.csv");
//     link.style.visibility = "hidden";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // ==========================================
//   // 1. AAPKA ORIGINAL DASHBOARD COMPACT VIEW (isHalf = true)
//   // ==========================================
//   if (isHalf) {
//     return (
//       <div style={styles.card}>
//         {/* Header */}
//         <div style={styles.cardHdr}>
//           <div>
//             <div style={styles.cardTitle}>Upcoming events</div>
//             <div style={styles.cardSub}>June 2026</div>
//           </div>

//           {/* Corner filter button + dropdown (dashboard view only) */}
//           <div style={styles.filterWrap} ref={filterRef}>
//             <button
//               style={styles.filterBtn}
//               onClick={() => setFilterOpen((v) => !v)}
//               aria-haspopup="true"
//               aria-expanded={filterOpen}
//             >
//               <i className="ti ti-filter" aria-hidden="true" style={{ fontSize: 13 }} />
//               <span>{activeTab}</span>
//               <i className="ti ti-chevron-down" aria-hidden="true" style={{ fontSize: 11 }} />
//             </button>

//             {filterOpen && (
//               <div style={styles.filterMenu}>
//                 {TABS.map((t) => (
//                   <div
//                     key={t}
//                     style={{
//                       ...styles.filterOption,
//                       ...(activeTab === t ? styles.filterOptionActive : {}),
//                     }}
//                     onClick={() => {
//                       setActiveTab(t);
//                       setFilterOpen(false);
//                     }}
//                   >
//                     <span>{t}</span>
//                     {t === "Today" && (
//                       <span style={styles.tabBadge}>
//                         {EVENTS.filter((e) => e.when === 0).length}
//                       </span>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Event list grouped */}
//         <div style={styles.list}>
//           {Object.keys(groups).length === 0 ? (
//             <div style={styles.empty}>
//               <i className="ti ti-calendar-off" aria-hidden="true" style={{ fontSize: 20, color: "#ccc" }} />
//               <span style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>No events</span>
//             </div>
//           ) : (
//             Object.entries(groups).map(([day, events]) => (
//               <div key={day} style={styles.group}>
//                 {/* Day header */}
//                 <div style={styles.dayHdr}>
//                   <div style={styles.dayLine} />
//                   <span
//                     style={{
//                       ...styles.dayLabel,
//                       background: events[0].dayBg,
//                       color: events[0].dayColor,
//                     }}
//                   >
//                     {day}
//                   </span>
//                   <div style={styles.dayLine} />
//                 </div>

//                 {events.map((e) => (
//                   <div key={e.id} style={styles.eventRow}>
//                     {/* Icon bubble */}
//                     <div style={{ ...styles.iconBubble, background: e.iconBg }}>
//                       <i className={e.icon} aria-hidden="true" style={{ fontSize: 13, color: e.iconColor }} />
//                     </div>

//                     {/* Info */}
//                     <div style={styles.eventInfo}>
//                       <div style={styles.eventTitle}>{e.title}</div>
//                       <div style={styles.eventSub}>{e.sub}</div>
//                     </div>

//                     {/* Type chip */}
//                     <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor }}>
//                       {e.type}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             ))
//           )}
//         </div>

//         {/* Footer */}
//         <div style={styles.footer} onClick={onViewFullCalendar}>
//           <i className="ti ti-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />
//           <span>View full calendar</span>
//         </div>
//       </div>
//     );
//   }

//   // ==========================================
//   // 2. NAYA DETAILED ERP VIEW (isHalf = false)
//   // ==========================================
//   return (
//     <div style={styles.fullCard}>
//       {/* Header */}
//       <div style={styles.fullHdr}>
//         <div>
//           <h2 style={styles.fullTitle}>Upcoming Events</h2>
//         </div>
//         <div style={{ display: "flex", gap: "10px" }}>
//            <button style={styles.exportBtn} onClick={handleExportCSV}>↓ Export Schedule</button>
//         </div>
//       </div>

//       {/* Stats / Quick Filters Row */}
//       <div style={styles.statsGrid}>
//         {[
//           { label: "Birthdays", count: getEventCount('birthday'), color: "#185FA5", bg: "#E6F1FB" },
//           { label: "Anniversaries", count: getEventCount('anniversary'), color: "#534AB7", bg: "#EEEDFE" },
//           { label: "HR Actions Due", count: getEventCount('probation') + getEventCount('contract'), color: "#3B6D11", bg: "#EAF3DE" },
//           { label: "Holidays", count: getEventCount('holiday'), color: "#854F0B", bg: "#FAEEDA" },
//         ].map((stat, i) => (
//           <div key={i} style={styles.statBox}>
//             <div style={{...styles.statIcon, background: stat.bg, color: stat.color}}>
//               <span style={{fontSize: 20, fontWeight: 'bold'}}>{stat.count}</span>
//             </div>
//             <div style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{stat.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* Filter Bar */}
//       <div style={styles.filterBar}>
//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Search Event or Employee</label>
//           <input
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             style={{...styles.inputBox, width: 250}}
//           />
//         </div>

//         <div style={styles.filterGroup}>
//           <label style={styles.filterLabel}>Event Type</label>
//           <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//             {FILTER_TYPES.map(type => (
//               <button
//                 key={type}
//                 onClick={() => setSelectedType(type)}
//                 style={{
//                   ...styles.fullFilterChip,
//                   background: selectedType === type ? "#1a1a1a" : "#fff",
//                   color: selectedType === type ? "#fff" : "#555",
//                   border: selectedType === type ? "1px solid #1a1a1a" : "1px solid #ddd"
//                 }}
//               >
//                 {type.charAt(0).toUpperCase() + type.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Detailed List */}
//       <div style={styles.fullContentWrapper}>
//         <div style={styles.tableWrap}>
//             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
//               <thead style={{ position: "sticky", top: 0, background: "#fafbfc", zIndex: 1 }}>
//                 <tr style={{ borderBottom: "1px solid #eee", color: "#666", fontSize: 12, textTransform: 'uppercase' }}>
//                   <th style={styles.th}>Event Details</th>
//                   <th style={styles.th}>Date & Day</th>
//                   <th style={styles.th}>Category</th>
//                   <th style={styles.th}>Department</th>
//                   <th style={styles.th}>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {detailedFiltered.length > 0 ? (
//                   detailedFiltered.map((e) => (
//                     <tr key={e.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
//                       <td style={styles.td}>
//                         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                            <div style={{ ...styles.iconBubble, background: e.iconBg, width: 36, height: 36 }}>
//                              <i className={e.icon} aria-hidden="true" style={{ fontSize: 16, color: e.iconColor }} />
//                            </div>
//                            <div>
//                               <div style={{ fontWeight: 600, color: "#222", fontSize: 14 }}>{e.title}</div>
//                               <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{e.sub}</div>
//                            </div>
//                         </div>
//                       </td>
//                       <td style={styles.td}>
//                         <div style={{ fontWeight: 500, color: "#333", fontSize: 13 }}>{e.dateStr}</div>
//                         <div style={{ fontSize: 11, color: e.dayColor, background: e.dayBg, display: 'inline-block', padding: '2px 6px', borderRadius: 10, marginTop: 4 }}>
//                           {e.day}
//                         </div>
//                       </td>
//                       <td style={styles.td}>
//                          <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor, fontSize: 11, padding: "4px 8px" }}>
//                            {e.type}
//                          </span>
//                       </td>
//                       <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{e.dept}</td>
//                       <td style={styles.td}>
//                          <button style={styles.actionBtn}>
//                             {e.action}
//                          </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
//                       <i className="ti ti-calendar-off" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>
//                       No events found for this filter criteria.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//         </div>
//       </div>

//     </div>
//   );
// };

// // === STYLES ===
// const styles = {
//   // --- AAPKE ORIGINAL COMPACT VIEW STYLES ---
//   card: {
//     background: "#fff",
//     border: "0.5px solid rgba(0,0,0,0.09)",
//     borderRadius: 8,
//     padding: "13px 14px",
//     display: "flex",
//     flexDirection: "column",
//     gap: 0,
//     height: "100%",
//     boxSizing: "border-box",
//     overflow: "hidden",
//   },
//   cardHdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 },
//   cardTitle: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.05em" },
//   cardSub: { fontSize: 10, color: "#888", marginTop: 2 },

//   // Corner filter button + dropdown
//   filterWrap: { position: "relative", flexShrink: 0 },
//   filterBtn: {
//     display: "flex",
//     alignItems: "center",
//     gap: 5,
//     fontSize: 11,
//     padding: "4px 9px",
//     borderRadius: 20,
//     border: "0.5px solid #B5D4F4",
//     background: "#E6F1FB",
//     color: "#185FA5",
//     cursor: "pointer",
//     fontWeight: 500,
//     whiteSpace: "nowrap",
//   },
//   filterMenu: {
//     position: "absolute",
//     top: "calc(100% + 6px)",
//     right: 0,
//     background: "#fff",
//     border: "0.5px solid rgba(0,0,0,0.1)",
//     borderRadius: 8,
//     boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
//     minWidth: 130,
//     zIndex: 20,
//     overflow: "hidden",
//   },
//   filterOption: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 8,
//     fontSize: 12,
//     padding: "8px 12px",
//     color: "#444",
//     cursor: "pointer",
//   },
//   filterOptionActive: {
//     background: "#E6F1FB",
//     color: "#185FA5",
//     fontWeight: 500,
//   },

//   tabBadge: { fontSize: 9, background: "#E24B4A", color: "#fff", borderRadius: 20, padding: "0px 5px", fontWeight: 500 },
//   list: { display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none" },
//   group: { marginBottom: 10 },
//   dayHdr: { display: "flex", alignItems: "center", gap: 6, marginBottom: 7 },
//   dayLine: { flex: 1, height: "0.5px", background: "rgba(0,0,0,0.08)" },
//   dayLabel: { fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" },
//   eventRow: { display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)" },
//   iconBubble: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   eventInfo: { flex: 1, minWidth: 0 },
//   eventTitle: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
//   eventSub: { fontSize: 10, color: "#888", marginTop: 1 },
//   typeChip: { fontSize: 9, padding: "2px 6px", borderRadius: 20, textTransform: "capitalize", flexShrink: 0, fontWeight: 500 },
//   empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" },
//   footer: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#185FA5", cursor: "pointer", marginTop: 10, paddingTop: 8, borderTop: "0.5px solid rgba(0,0,0,0.07)", flexShrink: 0 },

//   // --- NAYE FULL DETAILED VIEW STYLES (ERP) ---
//   fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
//   fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
//   fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
//   subText: { fontSize: 13, color: "#666", margin: 0 },
//   exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },
//   outlineBtn: { padding: "8px 14px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, background: "#fff", color: "#333", cursor: "pointer", fontWeight: 500 },

//   statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
//   statBox: { background: "#fff", border: "1px solid #f0f2f5", padding: "16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
//   statIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },

//   filterBar: { display: "flex", flexWrap: "wrap", gap: "24px", background: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #eaeaea", alignItems: "flex-end" },
//   filterGroup: { display: "flex", flexDirection: "column", gap: "8px" },
//   filterLabel: { fontSize: 12, fontWeight: 600, color: "#555" },
//   inputBox: { padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: 13, outline: "none", background: "#fff" },
//   fullFilterChip: { padding: "6px 12px", borderRadius: "20px", fontSize: 12, cursor: "pointer", fontWeight: 500, transition: "0.2s" },

//   fullContentWrapper: { background: "#fff" },
//   tableWrap: { overflowX: "auto", border: "1px solid #f0f0f0", borderRadius: "8px", maxHeight: "400px", overflowY: "auto" },
//   th: { padding: "14px 16px", fontWeight: 600 },
//   td: { padding: "14px 16px", verticalAlign: "middle" },

//   actionBtn: { padding: "6px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: "#f0f2f5", color: "#185FA5", border: "1px solid transparent", cursor: "pointer" }
// };

// export default UpcomingEvents;
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  getActledListAll,
  fetchHolidays,
  fetchUserGroupsByType,
} from "../../../utils/api";
// ^ paths adjust kar lena apne folder structure ke hisaab se

const TABS = ["Today", "This week", "All"];
const FILTER_TYPES = ["All", "birthday", "anniversary", "holiday", "probation", "payroll"];

// ─────────────────────────────────────────────────────────────────
// 🔧 ADJUST HERE if your employee API returns different field names.
// `pick()` tries every key in order and returns the first non-empty value,
// so you can just add your actual field name to the relevant list below.
// ─────────────────────────────────────────────────────────────────
const FIELD_KEYS = {
  id: ["Actled_id", "employee_id", "Employee ID", "id"],
  code: ["Led_code", "employee_code", "Employee Code", "code"],
  firstName: ["Led_name", "first_name", "First Name", "firstname"],
  lastName: ["Led_alias", "last_name", "Last Name", "lastname"],
  middleName: ["Middle_name"],
  dob: ["Dob", "dob", "DOB", "date_of_birth", "Date of Birth"],
  doj: ["Doj", "doj", "DOJ", "date_of_joining", "Joining Date", "joining_date"],
  department: ["department_name", "Department", "dept_name"],
  departmentId: ["department", "Department"],
  statusLeaving: ["Dol", "status_leaving_date", "Status Leaving Date", "leaving_date"],
  status: ["status", "Status"],
};

const PROBATION_MONTHS = 6; // confirmed via user: Joining Date + 6 months
const EVENT_WINDOW_PAST_DAYS = 30;   // how far back to still show an "overdue" event (e.g. confirmation due)
const EVENT_WINDOW_FUTURE_DAYS = 120; // how far ahead to compute upcoming events

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const startOfDay = (d) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDateStr = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

const dayLabelFor = (diff, d) => {
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// next occurrence of a recurring (yearly) date, e.g. birthday/anniversary
const nextOccurrence = (rawDate, today) => {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return null;
  let occ = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  occ = startOfDay(occ);
  if (occ < startOfDay(today)) occ.setFullYear(occ.getFullYear() + 1);
  return { occ, sourceYear: d.getFullYear() };
};

// ── visual style per event type ────────────────────────────────
const TYPE_STYLE = {
  birthday:    { icon: "ti ti-cake",              iconBg: "#E6F1FB", iconColor: "#185FA5", action: "Send Wishes" },
  anniversary: { icon: "ti ti-star",               iconBg: "#EEEDFE", iconColor: "#534AB7", action: "Send Badge" },
  holiday:     { icon: "ti ti-flag",               iconBg: "#FAEEDA", iconColor: "#854F0B", action: "View Policy" },
  probation:   { icon: "ti ti-user-check",         iconBg: "#EAF3DE", iconColor: "#3B6D11", action: "Review" },
  payroll:     { icon: "ti ti-report-money",       iconBg: "#FCEBEB", iconColor: "#A32D2D", action: "Run Payroll" },
};

const TODAY_STYLE = { dayColor: "#185FA5", dayBg: "#E6F1FB" };
const TOMORROW_STYLE = { dayColor: "#854F0B", dayBg: "#FAEEDA" };

const dayColorsFor = (diff, type) => {
  if (diff === 0) return TODAY_STYLE;
  if (diff === 1) return TOMORROW_STYLE;
  return { dayColor: TYPE_STYLE[type].iconColor, dayBg: TYPE_STYLE[type].iconBg };
};

const UpcomingEvents = ({ isHalf = false, onViewFullCalendar }) => {
  // Compact View States
  const [activeTab, setActiveTab] = useState("Today");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Detailed View States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [deptMap, setDeptMap] = useState({}); // id -> name, in case department comes as an ID

  const today = useMemo(() => startOfDay(new Date()), []);

  // Close the corner filter dropdown when clicking outside it
  useEffect(() => {
    if (!isHalf) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHalf]);

  // ── fetch employees + holidays + department master ───────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [empRes, holidayRows, deptRes] = await Promise.all([
        getActledListAll(),
        fetchHolidays(),
        fetchUserGroupsByType("DEP"),
      ]);

      if (empRes?.success) {
        setEmployees(empRes.data || []);
      } else {
        setEmployees([]);
      }

      setHolidays(holidayRows || []);

      const map = {};
      (deptRes?.data || []).forEach((g) => {
        map[g.group_id] = g.group_name;
      });
      setDeptMap(map);
    } catch (e) {
      console.error("UpcomingEvents fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolveDept = useCallback(
    (emp) => {
      const name = pick(emp, FIELD_KEYS.department);
      if (name) return name;
      const id = pick(emp, FIELD_KEYS.departmentId);
      if (id && deptMap[id]) return deptMap[id];
      return "—";
    },
    [deptMap]
  );

  const resolveName = useCallback((emp) => {
    const first = pick(emp, FIELD_KEYS.firstName) || "";
    const middle = pick(emp, FIELD_KEYS.middleName) || "";
    const last = pick(emp, FIELD_KEYS.lastName) || "";
    return `${first} ${middle} ${last}`.replace(/\s+/g, " ").trim() || "Unnamed Employee";
  }, []);

  // ── build the unified events list from all sources ────────────
  const EVENTS = useMemo(() => {
    const list = [];
    let autoId = 1;

    const isActive = (emp) => {
      const leaving = pick(emp, FIELD_KEYS.statusLeaving);
      const status = pick(emp, FIELD_KEYS.status);
      if (leaving) return false;
      if (status && String(status).toLowerCase() === "inactive") return false;
      return true;
    };

    employees.filter(isActive).forEach((emp) => {
      const name = resolveName(emp);
      const dept = resolveDept(emp);

      // Birthday
      const dobRaw = pick(emp, FIELD_KEYS.dob);
      const birthdayOcc = nextOccurrence(dobRaw, today);
      if (birthdayOcc) {
        const diff = daysBetween(today, birthdayOcc.occ);
        if (diff <= EVENT_WINDOW_FUTURE_DAYS) {
          list.push({
            id: `bday-${autoId++}`,
            type: "birthday",
            title: name,
            sub: "Birthday" + (diff === 0 ? " today" : ""),
            when: diff,
            dept,
            dateStr: formatDateStr(birthdayOcc.occ),
          });
        }
      }

      // Work anniversary
      const dojRaw = pick(emp, FIELD_KEYS.doj);
      const annivOcc = nextOccurrence(dojRaw, today);
      if (annivOcc) {
        const diff = daysBetween(today, annivOcc.occ);
        const years = annivOcc.occ.getFullYear() - annivOcc.sourceYear;
        if (diff <= EVENT_WINDOW_FUTURE_DAYS && years > 0) {
          list.push({
            id: `anniv-${autoId++}`,
            type: "anniversary",
            title: name,
            sub: `${years}-year work anniversary`,
            when: diff,
            dept,
            dateStr: formatDateStr(annivOcc.occ),
          });
        }
      }

      // Probation confirmation due = Joining Date + 6 months
      if (dojRaw) {
        const dojDate = new Date(dojRaw);
        if (!isNaN(dojDate.getTime())) {
          const probationDate = startOfDay(addMonths(dojDate, PROBATION_MONTHS));
          const diff = daysBetween(today, probationDate);
          if (diff >= -EVENT_WINDOW_PAST_DAYS && diff <= EVENT_WINDOW_FUTURE_DAYS) {
            list.push({
              id: `prob-${autoId++}`,
              type: "probation",
              title: name,
              sub: diff < 0 ? "Probation ended — confirmation overdue" : "Probation ends — confirmation due",
              when: diff,
              dept,
              dateStr: formatDateStr(probationDate),
            });
          }
        }
      }
    });

    // Holidays
    holidays.forEach((h) => {
      if (!h.date) return;
      const d = startOfDay(new Date(h.date));
      if (isNaN(d.getTime())) return;
      const diff = daysBetween(today, d);
      if (diff >= 0 && diff <= EVENT_WINDOW_FUTURE_DAYS) {
        list.push({
          id: `hol-${h.id}`,
          type: "holiday",
          title: h.purpose || "Holiday",
          sub: (h.remarks ? `${h.remarks} — ` : "") + "Office closed",
          when: diff,
          dept: "All India",
          dateStr: formatDateStr(d),
        });
      }
    });

    // Payroll deadline — static: last day of current month (per your instruction)
    {
      const y = today.getFullYear();
      const m = today.getMonth();
      let lastDay = startOfDay(new Date(y, m + 1, 0));
      let diff = daysBetween(today, lastDay);
      if (diff < 0) {
        // this month's cutoff already passed — show next month's
        lastDay = startOfDay(new Date(y, m + 2, 0));
        diff = daysBetween(today, lastDay);
      }
      list.push({
        id: "payroll-cutoff",
        type: "payroll",
        title: "Payroll Deadline",
        sub: `${MONTHS_SHORT[lastDay.getMonth()]} salary processing cutoff`,
        when: diff,
        dept: "Finance",
        dateStr: formatDateStr(lastDay),
      });
    }

    // attach visual styling + day label + sort
    return list
      .map((e) => {
        const eventDate = new Date(today);
        eventDate.setDate(eventDate.getDate() + e.when);
        const style = TYPE_STYLE[e.type];
        const dayColors = dayColorsFor(e.when, e.type);
        return {
          ...e,
          icon: style.icon,
          iconBg: style.iconBg,
          iconColor: style.iconColor,
          action: style.action,
          day: dayLabelFor(e.when, eventDate),
          dayColor: dayColors.dayColor,
          dayBg: dayColors.dayBg,
        };
      })
      .sort((a, b) => a.when - b.when);
  }, [employees, holidays, today, resolveDept, resolveName]);

  // --- COMPACT VIEW LOGIC ---
  const filtered = EVENTS.filter((e) => {
    if (activeTab === "Today") return e.when === 0;
    if (activeTab === "This week") return e.when >= 0 && e.when <= 6;
    return true;
  });

  const groups = filtered.reduce((acc, e) => {
    const key = e.day;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  // --- FULL VIEW LOGIC ---
  const detailedFiltered = EVENTS.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === "All" || e.type === selectedType;
    return matchSearch && matchType;
  });

  const getEventCount = (type) => EVENTS.filter((e) => e.type === type).length;

  // --- EXPORT FUNCTIONALITY ---
  const handleExportCSV = () => {
    const headers = ["Title", "Description", "Date", "Timeline Status", "Category", "Department"];

    const rows = detailedFiltered.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.sub.replace(/"/g, '""')}"`,
      `"${e.dateStr}"`,
      `"${e.day}"`,
      `"${e.type}"`,
      `"${e.dept}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "upcoming_events_schedule.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 1. COMPACT DASHBOARD VIEW (isHalf = true)
  // ==========================================
  if (isHalf) {
    return (
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHdr}>
          <div>
            <div style={styles.cardTitle}>Upcoming events</div>
            <div style={styles.cardSub}>
              {MONTHS_SHORT[today.getMonth()]} {today.getFullYear()}
            </div>
          </div>

          {/* Corner filter button + dropdown (dashboard view only) */}
          <div style={styles.filterWrap} ref={filterRef}>
            <button
              style={styles.filterBtn}
              onClick={() => setFilterOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={filterOpen}
            >
              <i className="ti ti-filter" aria-hidden="true" style={{ fontSize: 13 }} />
              <span>{activeTab}</span>
              <i className="ti ti-chevron-down" aria-hidden="true" style={{ fontSize: 11 }} />
            </button>

            {filterOpen && (
              <div style={styles.filterMenu}>
                {TABS.map((t) => (
                  <div
                    key={t}
                    style={{
                      ...styles.filterOption,
                      ...(activeTab === t ? styles.filterOptionActive : {}),
                    }}
                    onClick={() => {
                      setActiveTab(t);
                      setFilterOpen(false);
                    }}
                  >
                    <span>{t}</span>
                    {t === "Today" && (
                      <span style={styles.tabBadge}>{EVENTS.filter((e) => e.when === 0).length}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 0" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="ah-skeleton-fallback" style={styles.skeletonRow} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={styles.empty}>
            <i className="ti ti-alert-triangle" aria-hidden="true" style={{ fontSize: 20, color: "#E24B4A" }} />
            <span style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Couldn't load events</span>
          </div>
        )}

        {/* Event list grouped */}
        {!loading && !error && (
          <div style={styles.list}>
            {Object.keys(groups).length === 0 ? (
              <div style={styles.empty}>
                <i className="ti ti-calendar-off" aria-hidden="true" style={{ fontSize: 20, color: "#ccc" }} />
                <span style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>No events</span>
              </div>
            ) : (
              Object.entries(groups).map(([day, events]) => (
                <div key={day} style={styles.group}>
                  {/* Day header */}
                  <div style={styles.dayHdr}>
                    <div style={styles.dayLine} />
                    <span
                      style={{
                        ...styles.dayLabel,
                        background: events[0].dayBg,
                        color: events[0].dayColor,
                      }}
                    >
                      {day}
                    </span>
                    <div style={styles.dayLine} />
                  </div>

                  {events.map((e) => (
                    <div key={e.id} style={styles.eventRow}>
                      {/* Icon bubble */}
                      <div style={{ ...styles.iconBubble, background: e.iconBg }}>
                        <i className={e.icon} aria-hidden="true" style={{ fontSize: 13, color: e.iconColor }} />
                      </div>

                      {/* Info */}
                      <div style={styles.eventInfo}>
                        <div style={styles.eventTitle}>{e.title}</div>
                        <div style={styles.eventSub}>{e.sub}</div>
                      </div>

                      {/* Type chip */}
                      <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor }}>{e.type}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer} onClick={onViewFullCalendar}>
          <i className="ti ti-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          <span>View full calendar</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. DETAILED ERP VIEW (isHalf = false)
  // ==========================================
  return (
    <div style={styles.fullCard}>
      {/* Header */}
      <div style={styles.fullHdr}>
        <div>
          <h2 style={styles.fullTitle}>Upcoming Events</h2>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={styles.exportBtn} onClick={handleExportCSV}>↓ Export Schedule</button>
        </div>
      </div>

      {/* Stats / Quick Filters Row */}
      <div style={styles.statsGrid}>
        {[
          { label: "Birthdays", count: getEventCount("birthday"), color: "#185FA5", bg: "#E6F1FB" },
          { label: "Anniversaries", count: getEventCount("anniversary"), color: "#534AB7", bg: "#EEEDFE" },
          { label: "Probation Due", count: getEventCount("probation"), color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Holidays", count: getEventCount("holiday"), color: "#854F0B", bg: "#FAEEDA" },
        ].map((stat, i) => (
          <div key={i} style={styles.statBox}>
            <div style={{ ...styles.statIcon, background: stat.bg, color: stat.color }}>
              <span style={{ fontSize: 20, fontWeight: "bold" }}>{stat.count}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search Event or Employee</label>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...styles.inputBox, width: 250 }}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Event Type</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {FILTER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  ...styles.fullFilterChip,
                  background: selectedType === type ? "#1a1a1a" : "#fff",
                  color: selectedType === type ? "#fff" : "#555",
                  border: selectedType === type ? "1px solid #1a1a1a" : "1px solid #ddd",
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div style={styles.fullContentWrapper}>
        <div style={styles.tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ position: "sticky", top: 0, background: "#fafbfc", zIndex: 1 }}>
              <tr style={{ borderBottom: "1px solid #eee", color: "#666", fontSize: 12, textTransform: "uppercase" }}>
                <th style={styles.th}>Event Details</th>
                <th style={styles.th}>Date & Day</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                    Loading events…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#E24B4A" }}>
                    Couldn't load events. Please refresh.
                  </td>
                </tr>
              ) : detailedFiltered.length > 0 ? (
                detailedFiltered.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...styles.iconBubble, background: e.iconBg, width: 36, height: 36 }}>
                          <i className={e.icon} aria-hidden="true" style={{ fontSize: 16, color: e.iconColor }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#222", fontSize: 14 }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{e.sub}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500, color: "#333", fontSize: 13 }}>{e.dateStr}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: e.dayColor,
                          background: e.dayBg,
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: 10,
                          marginTop: 4,
                        }}
                      >
                        {e.day}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor, fontSize: 11, padding: "4px 8px" }}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontSize: 13, color: "#555" }}>{e.dept}</td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn}>{e.action}</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                    <i className="ti ti-calendar-off" style={{ fontSize: 24, display: "block", marginBottom: 8 }}></i>
                    No events found for this filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    borderRadius: 8,
    padding: "13px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardHdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.05em" },
  cardSub: { fontSize: 10, color: "#888", marginTop: 2 },

  filterWrap: { position: "relative", flexShrink: 0 },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    padding: "4px 9px",
    borderRadius: 20,
    border: "0.5px solid #B5D4F4",
    background: "#E6F1FB",
    color: "#185FA5",
    cursor: "pointer",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  filterMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    minWidth: 130,
    zIndex: 20,
    overflow: "hidden",
  },
  filterOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 12,
    padding: "8px 12px",
    color: "#444",
    cursor: "pointer",
  },
  filterOptionActive: { background: "#E6F1FB", color: "#185FA5", fontWeight: 500 },

  tabBadge: { fontSize: 9, background: "#E24B4A", color: "#fff", borderRadius: 20, padding: "0px 5px", fontWeight: 500 },
  list: { display: "flex", flexDirection: "column", gap: 0, flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none" },
  skeletonRow: { height: 28, borderRadius: 6, background: "linear-gradient(90deg,#eef0f2 25%,#f7f8f9 37%,#eef0f2 63%)", backgroundSize: "200px 100%" },
  group: { marginBottom: 10 },
  dayHdr: { display: "flex", alignItems: "center", gap: 6, marginBottom: 7 },
  dayLine: { flex: 1, height: "0.5px", background: "rgba(0,0,0,0.08)" },
  dayLabel: { fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" },
  eventRow: { display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)" },
  iconBubble: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  eventInfo: { flex: 1, minWidth: 0 },
  eventTitle: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  eventSub: { fontSize: 10, color: "#888", marginTop: 1 },
  typeChip: { fontSize: 9, padding: "2px 6px", borderRadius: 20, textTransform: "capitalize", flexShrink: 0, fontWeight: 500 },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" },
  footer: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#185FA5", cursor: "pointer", marginTop: 10, paddingTop: 8, borderTop: "0.5px solid rgba(0,0,0,0.07)", flexShrink: 0 },

  fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
  fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
  exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  statBox: { background: "#fff", border: "1px solid #f0f2f5", padding: "16px", borderRadius: 8, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },

  filterBar: { display: "flex", flexWrap: "wrap", gap: "24px", background: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #eaeaea", alignItems: "flex-end" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  filterLabel: { fontSize: 12, fontWeight: 600, color: "#555" },
  inputBox: { padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", fontSize: 13, outline: "none", background: "#fff" },
  fullFilterChip: { padding: "6px 12px", borderRadius: "20px", fontSize: 12, cursor: "pointer", fontWeight: 500, transition: "0.2s" },

  fullContentWrapper: { background: "#fff" },
  tableWrap: { overflowX: "auto", border: "1px solid #f0f0f0", borderRadius: "8px", maxHeight: "400px", overflowY: "auto" },
  th: { padding: "14px 16px", fontWeight: 600 },
  td: { padding: "14px 16px", verticalAlign: "middle" },

  actionBtn: { padding: "6px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: "#f0f2f5", color: "#185FA5", border: "1px solid transparent", cursor: "pointer" },
};

export default UpcomingEvents;
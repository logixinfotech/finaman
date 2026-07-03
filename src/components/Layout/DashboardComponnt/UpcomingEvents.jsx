// import React, { useState } from "react";

// const TABS = ["All", "Today", "This week"];

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
//   },
// ];

// const UpcomingEvents = () => {
//   const [activeTab, setActiveTab] = useState("Today");

//   const filtered = EVENTS.filter((e) => {
//     if (activeTab === "Today") return e.when === 0;
//     if (activeTab === "This week") return e.when <= 6;
//     return true;
//   });

//   // Group by day label
//   const groups = filtered.reduce((acc, e) => {
//     const key = e.day;
//     if (!acc[key]) acc[key] = [];
//     acc[key].push(e);
//     return acc;
//   }, {});

//   return (
//     <div style={styles.card}>
//       {/* Header */}
//       <div style={styles.cardHdr}>
//         <div>
//           <div style={styles.cardTitle}>Upcoming events</div>
//           <div style={styles.cardSub}>June 2026</div>
//         </div>
//         <i className="ti ti-calendar-event" aria-hidden="true" style={{ fontSize: 16, color: "#888" }} />
//       </div>

//       {/* Tabs */}
//       <div style={styles.tabRow}>
//         {TABS.map((t) => (
//           <button
//             key={t}
//             style={{
//               ...styles.tab,
//               ...(activeTab === t ? styles.tabActive : {}),
//             }}
//             onClick={() => setActiveTab(t)}
//           >
//             {t}
//             {t === "Today" && (
//               <span style={styles.tabBadge}>
//                 {EVENTS.filter((e) => e.when === 0).length}
//               </span>
//             )}
//           </button>
//         ))}
//       </div>

//       {/* Event list grouped */}
//       <div style={styles.list}>
//         {Object.keys(groups).length === 0 ? (
//           <div style={styles.empty}>
//             <i className="ti ti-calendar-off" aria-hidden="true" style={{ fontSize: 20, color: "#ccc" }} />
//             <span style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>No events</span>
//           </div>
//         ) : (
//           Object.entries(groups).map(([day, events]) => (
//             <div key={day} style={styles.group}>
//               {/* Day header */}
//               <div style={styles.dayHdr}>
//                 <div style={styles.dayLine} />
//                 <span
//                   style={{
//                     ...styles.dayLabel,
//                     background: events[0].dayBg,
//                     color: events[0].dayColor,
//                   }}
//                 >
//                   {day}
//                 </span>
//                 <div style={styles.dayLine} />
//               </div>

//               {events.map((e) => (
//                 <div key={e.id} style={styles.eventRow}>
//                   {/* Icon bubble */}
//                   <div style={{ ...styles.iconBubble, background: e.iconBg }}>
//                     <i className={e.icon} aria-hidden="true" style={{ fontSize: 13, color: e.iconColor }} />
//                   </div>

//                   {/* Info */}
//                   <div style={styles.eventInfo}>
//                     <div style={styles.eventTitle}>{e.title}</div>
//                     <div style={styles.eventSub}>{e.sub}</div>
//                   </div>

//                   {/* Type chip */}
//                   <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor }}>
//                     {e.type}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           ))
//         )}
//       </div>

//       {/* Footer */}
//       <div style={styles.footer}>
//         <i className="ti ti-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />
//         <span>View full calendar</span>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   card: {
//     background: "#fff",
//     border: "0.5px solid rgba(0,0,0,0.09)",
//     borderRadius: 8,
//     padding: "13px 14px",
//     display: "flex",
//     flexDirection: "column",
//     gap: 0,
//   },
//   cardHdr: {
//     display: "flex",
//     alignItems: "flex-start",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   cardTitle: {
//     fontSize: 11,
//     fontWeight: 500,
//     color: "#1a1a1a",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//   },
//   cardSub: { fontSize: 10, color: "#888", marginTop: 2 },
//   tabRow: {
//     display: "flex",
//     gap: 4,
//     marginBottom: 12,
//     borderBottom: "0.5px solid rgba(0,0,0,0.07)",
//     paddingBottom: 8,
//   },
//   tab: {
//     fontSize: 11,
//     padding: "3px 10px",
//     borderRadius: 20,
//     border: "0.5px solid transparent",
//     background: "none",
//     cursor: "pointer",
//     color: "#888",
//     display: "flex",
//     alignItems: "center",
//     gap: 4,
//   },
//   tabActive: {
//     background: "#E6F1FB",
//     color: "#185FA5",
//     border: "0.5px solid #B5D4F4",
//   },
//   tabBadge: {
//     fontSize: 9,
//     background: "#E24B4A",
//     color: "#fff",
//     borderRadius: 20,
//     padding: "0px 4px",
//     fontWeight: 500,
//   },
//   list: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 0,
//     maxHeight: 320,
//     overflowY: "auto",
//     scrollbarWidth: "none",
//   },
//   group: { marginBottom: 10 },
//   dayHdr: {
//     display: "flex",
//     alignItems: "center",
//     gap: 6,
//     marginBottom: 7,
//   },
//   dayLine: { flex: 1, height: "0.5px", background: "rgba(0,0,0,0.08)" },
//   dayLabel: {
//     fontSize: 10,
//     fontWeight: 500,
//     padding: "2px 8px",
//     borderRadius: 20,
//     whiteSpace: "nowrap",
//   },
//   eventRow: {
//     display: "flex",
//     alignItems: "center",
//     gap: 9,
//     padding: "6px 0",
//     borderBottom: "0.5px solid rgba(0,0,0,0.05)",
//   },
//   iconBubble: {
//     width: 28,
//     height: 28,
//     borderRadius: 8,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   eventInfo: { flex: 1, minWidth: 0 },
//   eventTitle: {
//     fontSize: 11,
//     fontWeight: 500,
//     color: "#1a1a1a",
//     whiteSpace: "nowrap",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//   },
//   eventSub: { fontSize: 10, color: "#888", marginTop: 1 },
//   typeChip: {
//     fontSize: 9,
//     padding: "2px 6px",
//     borderRadius: 20,
//     textTransform: "capitalize",
//     flexShrink: 0,
//     fontWeight: 500,
//   },
//   empty: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     padding: "20px 0",
//   },
//   footer: {
//     display: "flex",
//     alignItems: "center",
//     gap: 5,
//     fontSize: 11,
//     color: "#185FA5",
//     cursor: "pointer",
//     marginTop: 10,
//     paddingTop: 8,
//     borderTop: "0.5px solid rgba(0,0,0,0.07)",
//   },
// };

// export default UpcomingEvents;
import React, { useState } from "react";

const TABS = ["All", "Today", "This week"];
const FILTER_TYPES = ["All", "birthday", "anniversary", "holiday", "probation", "payroll", "contract"];

// आपके ओरिजिनल डेटा में सिर्फ Full View के लिए dept, action और dateStr ऐड किया है
const EVENTS = [
  {
    id: 1,
    type: "birthday",
    icon: "ti ti-cake",
    title: "Ravi Kumar",
    sub: "Birthday today",
    day: "Today",
    dayColor: "#185FA5",
    dayBg: "#E6F1FB",
    iconBg: "#E6F1FB",
    iconColor: "#185FA5",
    when: 0,
    dept: "Engineering", action: "Send Wishes", dateStr: "29 Jun 2026",
  },
  {
    id: 2,
    type: "anniversary",
    icon: "ti ti-star",
    title: "Sneha Verma",
    sub: "5-year work anniversary",
    day: "Today",
    dayColor: "#185FA5",
    dayBg: "#E6F1FB",
    iconBg: "#EEEDFE",
    iconColor: "#534AB7",
    when: 0,
    dept: "Marketing", action: "Send Badge", dateStr: "29 Jun 2026",
  },
  {
    id: 3,
    type: "holiday",
    icon: "ti ti-flag",
    title: "Bank Holiday",
    sub: "Eid-ul-Adha — office closed",
    day: "Tomorrow",
    dayColor: "#854F0B",
    dayBg: "#FAEEDA",
    iconBg: "#FAEEDA",
    iconColor: "#854F0B",
    when: 1,
    dept: "All India", action: "View Policy", dateStr: "30 Jun 2026",
  },
  {
    id: 4,
    type: "probation",
    icon: "ti ti-user-check",
    title: "Trivesh Sharma",
    sub: "Probation ends — confirmation due",
    day: "27 Jun",
    dayColor: "#3B6D11",
    dayBg: "#EAF3DE",
    iconBg: "#EAF3DE",
    iconColor: "#3B6D11",
    when: 2,
    dept: "Sales", action: "Review", dateStr: "27 Jun 2026",
  },
  {
    id: 5,
    type: "probation",
    icon: "ti ti-user-check",
    title: "Neha Joshi",
    sub: "Probation ends — confirmation due",
    day: "28 Jun",
    dayColor: "#3B6D11",
    dayBg: "#EAF3DE",
    iconBg: "#EAF3DE",
    iconColor: "#3B6D11",
    when: 3,
    dept: "HR", action: "Review", dateStr: "28 Jun 2026",
  },
  {
    id: 6,
    type: "payroll",
    icon: "ti ti-report-money",
    title: "Payroll Deadline",
    sub: "June salary processing cutoff",
    day: "30 Jun",
    dayColor: "#A32D2D",
    dayBg: "#FCEBEB",
    iconBg: "#FCEBEB",
    iconColor: "#A32D2D",
    when: 5,
    dept: "Finance", action: "Run Payroll", dateStr: "30 Jun 2026",
  },
  {
    id: 7,
    type: "birthday",
    icon: "ti ti-cake",
    title: "Priya Sharma",
    sub: "Birthday",
    day: "29 Jun",
    dayColor: "#185FA5",
    dayBg: "#E6F1FB",
    iconBg: "#E6F1FB",
    iconColor: "#185FA5",
    when: 4,
    dept: "Design", action: "Send Wishes", dateStr: "29 Jun 2026",
  },
  {
    id: 8,
    type: "contract",
    icon: "ti ti-file-description",
    title: "Dev Gupta",
    sub: "Contract renewal due",
    day: "30 Jun",
    dayColor: "#854F0B",
    dayBg: "#FAEEDA",
    iconBg: "#FAEEDA",
    iconColor: "#854F0B",
    when: 5,
    dept: "IT Support", action: "Renew/Terminate", dateStr: "30 Jun 2026",
  },
];

const UpcomingEvents = ({ isHalf = false, onViewFullCalendar }) => {
  // Compact View States
  const [activeTab, setActiveTab] = useState("Today");

  // Detailed View States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // --- COMPACT VIEW LOGIC ---
  const filtered = EVENTS.filter((e) => {
    if (activeTab === "Today") return e.when === 0;
    if (activeTab === "This week") return e.when <= 6;
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
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === "All" || e.type === selectedType;
    return matchSearch && matchType;
  });

  const getEventCount = (type) => EVENTS.filter(e => e.type === type).length;

  // ==========================================
  // 1. AAPKA ORIGINAL DASHBOARD COMPACT VIEW (isHalf = true)
  // ==========================================
  if (isHalf) {
    return (
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHdr}>
          <div>
            <div style={styles.cardTitle}>Upcoming events</div>
            <div style={styles.cardSub}>June 2026</div>
          </div>
          <i className="ti ti-calendar-event" aria-hidden="true" style={{ fontSize: 16, color: "#888" }} />
        </div>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {TABS.map((t) => (
            <button
              key={t}
              style={{
                ...styles.tab,
                ...(activeTab === t ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(t)}
            >
              {t}
              {t === "Today" && (
                <span style={styles.tabBadge}>
                  {EVENTS.filter((e) => e.when === 0).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Event list grouped */}
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
                    <span style={{ ...styles.typeChip, background: e.iconBg, color: e.iconColor }}>
                      {e.type}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer} onClick={onViewFullCalendar}>
          <i className="ti ti-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          <span>View full calendar</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. NAYA DETAILED ERP VIEW (isHalf = false)
  // ==========================================
  return (
    <div style={styles.fullCard}>
      {/* Header */}
      <div style={styles.fullHdr}>
        <div>
          <h2 style={styles.fullTitle}>Organization Calendar & Events</h2>
          <p style={styles.subText}>Manage birthdays, anniversaries, holidays, and crucial HR deadlines for June 2026.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <button style={styles.outlineBtn}><i className="ti ti-calendar-plus" style={{marginRight: 6}}></i>Add Event</button>
           <button style={styles.exportBtn}>↓ Export Schedule</button>
        </div>
      </div>

      {/* Stats / Quick Filters Row */}
      <div style={styles.statsGrid}>
        {[
          { label: "Birthdays", count: getEventCount('birthday'), color: "#185FA5", bg: "#E6F1FB" },
          { label: "Anniversaries", count: getEventCount('anniversary'), color: "#534AB7", bg: "#EEEDFE" },
          { label: "HR Actions Due", count: getEventCount('probation') + getEventCount('contract'), color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Holidays", count: getEventCount('holiday'), color: "#854F0B", bg: "#FAEEDA" },
        ].map((stat, i) => (
          <div key={i} style={styles.statBox}>
            <div style={{...styles.statIcon, background: stat.bg, color: stat.color}}>
              <span style={{fontSize: 20, fontWeight: 'bold'}}>{stat.count}</span>
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
            style={{...styles.inputBox, width: 250}} 
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Event Type</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {FILTER_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  ...styles.fullFilterChip,
                  background: selectedType === type ? "#1a1a1a" : "#fff",
                  color: selectedType === type ? "#fff" : "#555",
                  border: selectedType === type ? "1px solid #1a1a1a" : "1px solid #ddd"
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
                <tr style={{ borderBottom: "1px solid #eee", color: "#666", fontSize: 12, textTransform: 'uppercase' }}>
                  <th style={styles.th}>Event Details</th>
                  <th style={styles.th}>Date & Day</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {detailedFiltered.length > 0 ? (
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
                        <div style={{ fontSize: 11, color: e.dayColor, background: e.dayBg, display: 'inline-block', padding: '2px 6px', borderRadius: 10, marginTop: 4 }}>
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
                         <button style={styles.actionBtn}>
                            {e.action}
                         </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      <i className="ti ti-calendar-off" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>
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
  // --- AAPKE ORIGINAL COMPACT VIEW STYLES ---
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 0 },
  cardHdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.05em" },
  cardSub: { fontSize: 10, color: "#888", marginTop: 2 },
  tabRow: { display: "flex", gap: 4, marginBottom: 12, borderBottom: "0.5px solid rgba(0,0,0,0.07)", paddingBottom: 8 },
  tab: { fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "0.5px solid transparent", background: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", gap: 4 },
  tabActive: { background: "#E6F1FB", color: "#185FA5", border: "0.5px solid #B5D4F4" },
  tabBadge: { fontSize: 9, background: "#E24B4A", color: "#fff", borderRadius: 20, padding: "0px 4px", fontWeight: 500 },
  list: { display: "flex", flexDirection: "column", gap: 0, maxHeight: 320, overflowY: "auto", scrollbarWidth: "none" },
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
  footer: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#185FA5", cursor: "pointer", marginTop: 10, paddingTop: 8, borderTop: "0.5px solid rgba(0,0,0,0.07)" },

  // --- NAYE FULL DETAILED VIEW STYLES (ERP) ---
  fullCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "24px", minHeight: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" },
  fullHdr: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  fullTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px 0" },
  subText: { fontSize: 13, color: "#666", margin: 0 },
  exportBtn: { padding: "8px 14px", border: "none", borderRadius: 6, fontSize: 13, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontWeight: 500 },
  outlineBtn: { padding: "8px 14px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, background: "#fff", color: "#333", cursor: "pointer", fontWeight: 500 },

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
  
  actionBtn: { padding: "6px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: "#f0f2f5", color: "#185FA5", border: "1px solid transparent", cursor: "pointer" }
};

export default UpcomingEvents;

// import React from "react";

// // formatCurrency: 1840000 -> "₹18.4L"
// const fmt = (n) => {
//   if (!n || n === 0) return "₹0";
//   if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
//   if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
//   if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
//   return `₹${n}`;
// };

// const KpiStrip = ({ data, loading }) => {
//   const kpi = data?.kpi || {};

//   const kpis = [
//     {
//       label:   "Total Employees",
//       value:   loading ? "—" : kpi.total_employees ?? "—",
//       delta:   loading ? "" : `${kpi.active_employees ?? 0} active`,
//       deltaType: "neu",
//       icon:    "ti ti-users",
//       accent:  "#378ADD",
//       deltaBg: "#E6F1FB", deltaColor: "#0C447C",
//     },
//     {
//       label:   "Present Today",
//       value:   loading ? "—" : kpi.present_today ?? "—",
//       delta:   loading ? "" : `${kpi.absent_today ?? 0} absent`,
//       deltaType: "neu",
//       icon:    "ti ti-user-check",
//       accent:  "#639922",
//       deltaBg: "#FAEEDA", deltaColor: "#854F0B",
//     },
//     {
//       label:   "June Payroll",
//       value:   loading ? "—" : fmt(data?.payroll?.gross_total),
//       delta:   loading ? "" :
//         data?.payroll?.pending_count > 0
//           ? `${data.payroll.pending_count} pending`
//           : `${data?.payroll?.approved_count ?? 0} approved`,
//       deltaType: data?.payroll?.pending_count > 0 ? "warn" : "up",
//       icon:    "ti ti-report-money",
//       accent:  "#EF9F27",
//       deltaBg: data?.payroll?.pending_count > 0 ? "#FAEEDA" : "#EAF3DE",
//       deltaColor: data?.payroll?.pending_count > 0 ? "#854F0B" : "#3B6D11",
//     },
//     {
//       label:   "Pending Approvals",
//       value:   loading ? "—" : kpi.pending_approvals ?? "—",
//       delta:   loading ? "" : kpi.pending_approvals > 0 ? "Needs action" : "All clear",
//       deltaType: kpi.pending_approvals > 0 ? "dn" : "up",
//       icon:    "ti ti-circle-check",
//       accent:  "#E24B4A",
//       deltaBg: kpi.pending_approvals > 0 ? "#FCEBEB" : "#EAF3DE",
//       deltaColor: kpi.pending_approvals > 0 ? "#A32D2D" : "#3B6D11",
//     },
//     {
//       label:   "Open Tasks",
//       value:   loading ? "—" : kpi.open_tasks ?? "—",
//       delta:   loading ? "" : `${kpi.overdue_tasks ?? 0} overdue`,
//       deltaType: (kpi.overdue_tasks ?? 0) > 0 ? "dn" : "up",
//       icon:    "ti ti-checklist",
//       accent:  "#7F77DD",
//       deltaBg: (kpi.overdue_tasks ?? 0) > 0 ? "#FCEBEB" : "#EAF3DE",
//       deltaColor: (kpi.overdue_tasks ?? 0) > 0 ? "#A32D2D" : "#3B6D11",
//     },
//   ];

//   return (
//     <>
//       {/* Inline style objects can't declare @keyframes, so the shimmer
//           animation needs a real <style> tag rendered alongside the grid. */}
//       <style>{`
//         @keyframes kpiPulse {
//           0%   { opacity: 1; }
//           50%  { opacity: 0.4; }
//           100% { opacity: 1; }
//         }
//       `}</style>

//       <div style={styles.grid}>
//         {kpis.map((k) => (
//           <div key={k.label} style={{ ...styles.card, borderTopColor: k.accent }}>
//             <i className={k.icon} style={{ fontSize: 18, color: k.accent }} aria-hidden="true" />
//             <div style={styles.value}>
//               {loading ? <div style={styles.shimmer} /> : k.value}
//             </div>
//             <div style={styles.label}>{k.label}</div>
//             {!loading && (
//               <div style={{ ...styles.delta, background: k.deltaBg, color: k.deltaColor }}>
//                 {k.delta}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </>
//   );
// };

// const styles = {
//   grid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
//     gap: 20,
//     marginBottom: 12,
//   },
//   card: {
//     background: "#fff",
//     border: "0.5px solid rgba(0,0,0,0.09)",
//     borderTop: "3px solid transparent",
//     borderRadius: 8,
//     padding: "8px 11px",
//     display: "flex",
//     flexDirection: "column",
//     gap: 2,
//     boxSizing: "border-box",
//   },
//   value: {
//     fontSize: 18, fontWeight: 500, color: "#1a1a1a",
//     lineHeight: 1, marginTop: 1, minHeight: 26,
//   },
//   label:  { fontSize: 11, color: "#666" },
//   delta:  { fontSize: 10, padding: "2px 7px", borderRadius: 20, display: "inline-block", marginTop: 2, width: "fit-content" },
//   shimmer: { height: 22, width: 60, background: "#e8e8e8", borderRadius: 4, animation: "kpiPulse 1.5s infinite" },
// };

// export default KpiStrip;
import React from "react";

// formatCurrency: 1840000 -> "₹18.4L"
const fmt = (n) => {
  if (!n || n === 0) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const KpiStrip = ({ data, loading }) => {
  const kpi = data?.kpi || {};

  const kpis = [
    {
      label:   "Total Employees",
      value:   loading ? "—" : kpi.total_employees ?? "—",
      delta:   loading ? "" : `${kpi.active_employees ?? 0} active`,
      icon:    "ti ti-users",
      accent:  "#378ADD",
      accentSoft: "#E6F1FB",
      deltaBg: "#E6F1FB", deltaColor: "#0C447C",
    },
    {
      label:   "Present Today",
      value:   loading ? "—" : kpi.present_today ?? "—",
      delta:   loading ? "" : `${kpi.absent_today ?? 0} absent`,
      icon:    "ti ti-user-check",
      accent:  "#639922",
      accentSoft: "#EEF5E3",
      deltaBg: "#FAEEDA", deltaColor: "#854F0B",
    },
    {
      label:   "June Payroll",
      value:   loading ? "—" : fmt(data?.payroll?.gross_total),
      delta:   loading ? "" :
        data?.payroll?.pending_count > 0
          ? `${data.payroll.pending_count} pending`
          : `${data?.payroll?.approved_count ?? 0} approved`,
      icon:    "ti ti-report-money",
      accent:  "#EF9F27",
      accentSoft: "#FDF3E1",
      deltaBg: data?.payroll?.pending_count > 0 ? "#FAEEDA" : "#EAF3DE",
      deltaColor: data?.payroll?.pending_count > 0 ? "#854F0B" : "#3B6D11",
    },
    {
      label:   "Pending Approvals",
      value:   loading ? "—" : kpi.pending_approvals ?? "—",
      delta:   loading ? "" : kpi.pending_approvals > 0 ? "Needs action" : "All clear",
      icon:    "ti ti-circle-check",
      accent:  "#E24B4A",
      accentSoft: "#FCEAEA",
      deltaBg: kpi.pending_approvals > 0 ? "#FCEBEB" : "#EAF3DE",
      deltaColor: kpi.pending_approvals > 0 ? "#A32D2D" : "#3B6D11",
    },
    {
      label:   "Open Tasks",
      value:   loading ? "—" : kpi.open_tasks ?? "—",
      delta:   loading ? "" : `${kpi.overdue_tasks ?? 0} overdue`,
      icon:    "ti ti-checklist",
      accent:  "#7F77DD",
      accentSoft: "#EFEDFB",
      deltaBg: (kpi.overdue_tasks ?? 0) > 0 ? "#FCEBEB" : "#EAF3DE",
      deltaColor: (kpi.overdue_tasks ?? 0) > 0 ? "#A32D2D" : "#3B6D11",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes kpiPulse {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 12px;
        }

        .kpi-card {
          position: relative;
          background: #fff;
          border: 0.5px solid rgba(0,0,0,0.09);
          border-radius: 10px;
          padding: 14px;
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        /* left accent bar instead of a top border */
        .kpi-card::before {
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: var(--accent);
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.07);
        }

        .kpi-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--accent-soft);
          margin-left: 4px;
        }

        .kpi-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .kpi-top-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }

        .kpi-value {
          font-size: 19px;
          font-weight: 600;
          color: #17181a;
          line-height: 1.2;
          white-space: nowrap;
        }

        .kpi-label {
          font-size: 11.5px;
          color: #6b6b6b;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .kpi-delta {
          font-size: 10.5px;
          padding: 2px 7px;
          border-radius: 20px;
          display: inline-block;
          width: fit-content;
          font-weight: 500;
          margin-top: 5px;
        }

        .kpi-shimmer {
          height: 20px;
          width: 56px;
          background: #e8e8e8;
          border-radius: 4px;
          animation: kpiPulse 1.5s infinite;
        }

        /* Large monitors: cap card growth so the strip doesn't stretch into
           oversized cards with empty-feeling padding. */
        @media (min-width: 1440px) {
          .kpi-grid {
            grid-template-columns: repeat(5, minmax(0, 260px));
            justify-content: space-between;
          }
        }

        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 720px) {
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .kpi-value { font-size: 17px; }
        }

        @media (max-width: 420px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="kpi-card"
            style={{ "--accent": k.accent, "--accent-soft": k.accentSoft }}
          >
            <div className="kpi-icon-badge">
              <i className={k.icon} style={{ fontSize: 17, color: k.accent }} aria-hidden="true" />
            </div>

            <div className="kpi-body">
              <div className="kpi-value">
                {loading ? <div className="kpi-shimmer" /> : k.value}
              </div>
              <div className="kpi-label">{k.label}</div>

              {!loading && (
                <div
                  className="kpi-delta"
                  style={{ background: k.deltaBg, color: k.deltaColor }}
                >
                  {k.delta}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default KpiStrip;
import React from "react";

const fmt = (n) => {
  if (!n || n === 0) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};



const KpiStrip = ({ data, loading }) => {
  const kpi = data?.kpi || {};

  const totalEmp     = kpi.total_employees ?? 0;
  const activeEmp     = kpi.active_employees ?? 0;
  const inactiveEmp   = Math.max(0, totalEmp - activeEmp);
  const presentToday  = kpi.present_today ?? 0;
  const absentToday   = kpi.absent_today ?? 0;
  const approvedPay   = data?.payroll?.approved_count ?? 0;
  const pendingPay    = data?.payroll?.pending_count ?? 0;
  const openTasks     = kpi.open_tasks ?? 0;
  const overdueTasks  = kpi.overdue_tasks ?? 0;
  const onTrackTasks  = Math.max(0, openTasks - overdueTasks);
  const pendingAppr   = kpi.pending_approvals ?? 0;

  const kpis = [
    {
      label:   "Total Employees",
      value:   loading ? "—" : totalEmp || "—",
      delta:   loading ? "" : `${activeEmp} active`,
      icon:    "ti ti-users",
      accent:  "#3B82F6",
      accentSoft: "#EAF2FE",
      deltaBg: "#EAF2FE", deltaColor: "#1D4ED8",
   
      segA: activeEmp, segB: inactiveEmp,
      segALabel: "active", segBLabel: "inactive",
      emptyNote: "No employees added yet",
    },
    {
      label:   "Present Today",
      value:   loading ? "—" : presentToday || "—",
      delta:   loading ? "" : `${absentToday} absent`,
      icon:    "ti ti-user-check",
      accent:  "#16A34A",
      accentSoft: "#EAF8EF",
      deltaBg: "#FDF3E1", deltaColor: "#92610B",
      trend: "up",
      segA: presentToday, segB: absentToday,
      segALabel: "present", segBLabel: "absent",
      emptyNote: "Attendance not marked yet",
    },
    {
      label:   "June Payroll",
      value:   loading ? "—" : fmt(data?.payroll?.gross_total),
      delta:   loading ? "" :
        pendingPay > 0 ? `${pendingPay} pending` : `${approvedPay} approved`,
      icon:    "ti ti-report-money",
      accent:  "#EA9F1E",
      accentSoft: "#FDF3E1",
      deltaBg: pendingPay > 0 ? "#FDF3E1" : "#EAF8EF",
      deltaColor: pendingPay > 0 ? "#92610B" : "#15803D",
      trend: pendingPay > 0 ? "warn" : "up",
      segA: approvedPay, segB: pendingPay,
      segALabel: "approved", segBLabel: "pending",
      emptyNote: "Payroll not run yet",
    },
    {
      label:   "Pending Approvals",
      value:   loading ? "—" : pendingAppr || "—",
      delta:   loading ? "" : pendingAppr > 0 ? "Needs action" : "All clear",
      icon:    "ti ti-circle-check",
      accent:  "#E1483F",
      accentSoft: "#FCEBEA",
      deltaBg: pendingAppr > 0 ? "#FCEBEA" : "#EAF8EF",
      deltaColor: pendingAppr > 0 ? "#B42318" : "#15803D",
      trend: pendingAppr > 0 ? "warn" : "up",
      segA: null, segB: null,
      segALabel: "", segBLabel: "",
      emptyNote: "Awaiting review from managers",
    },
    {
      label:   "Open Tasks",
      value:   loading ? "—" : openTasks || "—",
      delta:   loading ? "" : `${overdueTasks} overdue`,
      icon:    "ti ti-checklist",
      accent:  "#7C6FE8",
      accentSoft: "#EFEDFC",
      deltaBg: overdueTasks > 0 ? "#FCEBEA" : "#EAF8EF",
      deltaColor: overdueTasks > 0 ? "#B42318" : "#15803D",
      trend: overdueTasks > 0 ? "warn" : "up",
      segA: onTrackTasks, segB: overdueTasks,
      segALabel: "on track", segBLabel: "overdue",
      emptyNote: "No tasks assigned yet",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes kpiFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes kpiMeterGrow {
          from { width: 0%; }
        }

        @keyframes kpiPulseRing {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
          70%  { box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 0%, transparent); }
        }

        @keyframes kpiShimmerMove {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 14px;
        }

        .kpi-card {
          position: relative;
          background: linear-gradient(180deg, #ffffff 0%, #fcfcfd 100%);
          border: 1px solid rgba(15, 23, 42, 0.07);
          border-radius: 16px;
          padding: 16px 17px 15px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          box-shadow:
            0 1px 2px rgba(16, 24, 40, 0.04),
            0 1px 1px rgba(16, 24, 40, 0.03);
          transition: transform 0.22s cubic-bezier(.2,.8,.2,1),
                      box-shadow 0.22s cubic-bezier(.2,.8,.2,1),
                      border-color 0.22s ease;
          animation: kpiFadeUp 0.4s ease both;
        }

        .kpi-card:nth-child(1) { animation-delay: 0.02s; }
        .kpi-card:nth-child(2) { animation-delay: 0.06s; }
        .kpi-card:nth-child(3) { animation-delay: 0.10s; }
        .kpi-card:nth-child(4) { animation-delay: 0.14s; }
        .kpi-card:nth-child(5) { animation-delay: 0.18s; }

        /* status rail: short accent flag top-left — reads as a tag, not a template gradient */
        .kpi-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 17px;
          width: 22px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: var(--accent);
          opacity: 0.85;
          z-index: 2;
        }

        /* big ghost watermark icon — fills the empty corner with character,
           tied to the card's own metric instead of being generic decoration */
        .kpi-ghost-icon {
          position: absolute;
          bottom: -16px;
          right: -10px;
          font-size: 92px;
          line-height: 1;
          color: var(--accent);
          opacity: 0.07;
          transform: rotate(-8deg);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease;
          z-index: 0;
        }


        .kpi-card:hover {
          transform: translateY(-3px);
          border-color: color-mix(in srgb, var(--accent) 35%, rgba(15,23,42,0.07));
          box-shadow:
            0 10px 24px -8px rgba(16, 24, 40, 0.14),
            0 2px 6px rgba(16, 24, 40, 0.06);
        }

        .kpi-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          z-index: 1;
        }

        .kpi-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: linear-gradient(145deg, var(--accent-soft) 0%, #ffffff 130%);
          box-shadow:
            inset 0 0 0 1px rgba(15,23,42,0.04),
            0 2px 5px -2px color-mix(in srgb, var(--accent) 45%, transparent);
        }

        .kpi-status {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
        }

        .kpi-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .kpi-status.is-warn .kpi-status-dot {
          background: #E1483F;
          animation: kpiPulseRing 2s ease-out infinite;
          --accent: #E1483F;
        }
        .kpi-status.is-up .kpi-status-dot { background: #16A34A; }
        .kpi-status.is-flat .kpi-status-dot { background: #94A3B8; }

        .kpi-status-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .kpi-status.is-warn .kpi-status-text { color: #B42318; }
        .kpi-status.is-up .kpi-status-text { color: #15803D; }
        .kpi-status.is-flat .kpi-status-text { color: #64748B; }

        .kpi-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 3px;
          z-index: 1;
        }

        .kpi-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }

        .kpi-label {
          font-size: 10.5px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.055em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        } 
        .kpi-value {
          font-family: ui-monospace, "SF Mono", "Roboto Mono", Consolas, monospace;
          font-size: 25px;
          font-weight: 600;
          color: #101828;
          line-height: 1.15;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        } 
        .kpi-delta {
          font-size: 10.5px;
          padding: 3px 8px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: fit-content;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          z-index: 1;
        } 
        .kpi-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid rgba(15, 23, 42, 0.055);
          z-index: 1;
        } 
        .kpi-stack-track {
          display: flex;
          width: 100%;
          height: 6px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.06);
        } 
        .kpi-stack-track.is-empty {
          background-image: repeating-linear-gradient(
            135deg,
            rgba(15,23,42,0.09) 0 4px,
            transparent 4px 8px
          );
        } 
        .kpi-stack-seg {
          height: 100%;
          animation: kpiMeterGrow 0.7s cubic-bezier(.2,.8,.2,1) both;
          animation-delay: 0.2s;
        } 
        .kpi-stack-legend {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 7px;
          font-size: 10px;
          color: #64748B;
          font-weight: 600;
        } 
        .kpi-stack-legend span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        } 
        .kpi-stack-legend b {
          color: #1F2937;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        } 
        .kpi-stack-dot {
          width: 6px;
          height: 6px;
          border-radius: 2px;
          flex-shrink: 0;
        } 
        .kpi-empty-note {
          font-size: 10.5px;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 7px;
        } 
        .kpi-shimmer {
          height: 22px;
          width: 60px;
          background: linear-gradient(90deg, #eceef1 0%, #f6f7f8 50%, #eceef1 100%);
          background-size: 200% 100%;
          border-radius: 5px;
          animation: kpiShimmerMove 1.4s ease-in-out infinite;
        } 
        @media (prefers-reduced-motion: reduce) {
          .kpi-card { animation: none; }
          .kpi-card:hover { transform: none; }
          .kpi-shimmer, .kpi-stack-seg, .kpi-status-dot { animation: none; }
        } 
        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        } 
        @media (max-width: 720px) {
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .kpi-value { font-size: 20px; }
          .kpi-card { padding: 13px 14px 12px; border-radius: 14px; }
        } 
        @media (max-width: 420px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style> 
      <div className="kpi-grid">
        {kpis.map((k) => { 
          return (
            <div
              key={k.label}
              className="kpi-card"
              style={{ "--accent": k.accent, "--accent-soft": k.accentSoft }}
            >
               <div className="kpi-top">
                <div className="kpi-icon-badge">
                  <i className={k.icon} style={{ fontSize: 17, color: k.accent }} aria-hidden="true" />
                </div>
                {!loading && (
                  <div className={`kpi-status is-${k.trend}`}>
                    <span className="kpi-status-dot" aria-hidden="true" />
                    <span className="kpi-status-text">
                      {k.trend === "warn" ? "Attention" : k.trend === "up" ? "On track" : "Steady"}
                    </span>
                  </div>
                )}
              </div> 
              <div className="kpi-body">
                <div className="kpi-top-row">
                  <div className="kpi-value-row">
                    <div className="kpi-value">
                      {loading ? <div className="kpi-shimmer" /> : k.value}
                    </div>
                    <div className="kpi-label">{k.label}</div>
                  </div>

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
             </div>
          );
        })}
      </div>
    </>
  );
};

export default KpiStrip;
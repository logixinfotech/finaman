// import React from "react";
// import KpiStrip from "../components/Layout/DashboardComponnt/KpiStrip";
// import { useDashboard } from "../Hooks/useDashboard";
// import AttendanceHeatmap from "../components/Layout/DashboardComponnt/AttendanceHeatmap";
// import LeaveAnalytics from "../components/Layout/DashboardComponnt/LeaveAnalytics";
// import ApprovalWorkflow from "../components/Layout/DashboardComponnt/ApprovalWorkflow";
// import WorkDiarySummary from "../components/Layout/DashboardComponnt/WorkDiarySummary";
// import PayrollOverview from "../components/Layout/DashboardComponnt/PayrollOverview";
// import UpcomingEvents from "../components/Layout/DashboardComponnt/UpcomingEvents";
// import AlertsStrip from "../components/Layout/DashboardComponnt/AlertsStrip";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js"; 
// ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// const FinamanDashboard = () => {
//   const { data, loading, error, refetch, lastFetched } = useDashboard();

//   const syncTime = lastFetched
//     ? lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
//     : "—";

//   return (
//     <div style={styles.shell}>
    
//       {/* Scrollable body */}
//       <div style={styles.body}>

//         {/* Row 0: Alerts strip */}
//         <AlertsStrip />

//         {/* Row 1: KPI strip — real data */}
//         <KpiStrip data={data} loading={loading} />

//         {/* Row 2: Heatmap + UpcomingEvents (static for now) */}
//         <div style={styles.row2}>
//           <AttendanceHeatmap />
//           <div style={styles.sidebar}>
//             <UpcomingEvents isHalf={true} />
//           </div>
//         </div>

//         {/* Row 3: Leave + Approvals + WorkDiary */}
//         <div style={styles.threeCol}>
//           <LeaveAnalytics isHalf={true} />
//           <ApprovalWorkflow />
//           <WorkDiarySummary data={data} loading={loading} />
//         </div>

//         {/* Row 4: Payroll — real data */}
//         <PayrollOverview data={data} loading={loading} />

//       </div>
//     </div>
//   );
// };

// const styles = {
//   shell: {
//     height: "100%", display: "flex", flexDirection: "column",
//     background: "#f0f2f5", overflow: "hidden",
//   },
//   infoBar: {
//     background: "#185FA5", padding: "8px 18px",
//     display: "flex", alignItems: "center", justifyContent: "space-between",
//     flexShrink: 0,
//   },
//   infoLeft:  { display: "flex", alignItems: "center", gap: 6 },
//   infoTitle: { fontSize: 12, fontWeight: 500, color: "#E6F1FB" },
//   infoDot:   { fontSize: 12, color: "#85B7EB" },
//   infoSub:   { fontSize: 11, color: "#85B7EB" },
//   syncBadge: {
//     fontSize: 10, color: "#9FE1CB", background: "#0C447C",
//     padding: "3px 9px", borderRadius: 20,
//     display: "flex", alignItems: "center",
//     border: "none", cursor: "pointer",
//   },
//   errorBar: {
//     background: "#FCEBEB", color: "#A32D2D",
//     padding: "6px 18px", fontSize: 11,
//     display: "flex", alignItems: "center", gap: 8,
//     flexShrink: 0,
//   },
//   retryBtn: {
//     fontSize: 11, color: "#A32D2D", background: "none",
//     border: "0.5px solid #A32D2D", borderRadius: 4,
//     padding: "1px 8px", cursor: "pointer", marginLeft: 4,
//   },
//   body: {
//     flex: 1, overflowY: "auto", padding: "12px 16px",
//     display: "flex", flexDirection: "column", gap: 0,
//   },
//   row2: {
//     display: "grid", gridTemplateColumns: "1fr 220px",
//     gap: 10, marginBottom: 12, alignItems: "start",
//   },
//   sidebar:  { position: "sticky", top: 0 },
//   threeCol: {
//     display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
//     gap: 10, marginBottom: 12,
//   },
// };

// export default FinamanDashboard;
import React, { useEffect } from "react";
import KpiStrip from "../components/Layout/DashboardComponnt/KpiStrip";
import { useDashboard } from "../Hooks/useDashboard";
import AttendanceHeatmap from "../components/Layout/DashboardComponnt/AttendanceHeatmap";
import LeaveAnalytics from "../components/Layout/DashboardComponnt/LeaveAnalytics";
import ApprovalWorkflow from "../components/Layout/DashboardComponnt/ApprovalWorkflow";
import WorkDiarySummary from "../components/Layout/DashboardComponnt/WorkDiarySummary";
import PayrollOverview from "../components/Layout/DashboardComponnt/PayrollOverview";
import UpcomingEvents from "../components/Layout/DashboardComponnt/UpcomingEvents";
import AlertsStrip from "../components/Layout/DashboardComponnt/AlertsStrip";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const RESPONSIVE_CSS = `
  .fd-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0f2f5;
    overflow: hidden;
    min-height: 0;
  }

  .fd-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-sizing: border-box;
    min-height: 0;
  }

  /* ── Row 2: Heatmap + Sidebar ── */
  .fd-row2 {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 10px;
    margin-bottom: 12px;
    align-items: start;
    min-width: 0;
  }

  .fd-row2 > * {
    min-width: 0;
    overflow: hidden;
  }

  .fd-sidebar {
    position: sticky;
    top: 0;
    min-width: 0;
  }

  /* ── Row 3: Three columns ── */
  .fd-three-col {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 12px;
    min-width: 0;
  }

  .fd-three-col > * {
    min-width: 0;
    overflow: hidden;
  }

  /* ── Tablet: ≤ 1024px ── */
  @media (max-width: 1024px) {
    .fd-body {
      padding: 10px 12px;
    }

    .fd-row2 {
      grid-template-columns: 1fr 200px;
    }

    .fd-three-col {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    /* WorkDiarySummary spans full width on 2-col layout */
    .fd-three-col > *:last-child {
      grid-column: 1 / -1;
    }
  }

  /* ── Small tablet / large phone: ≤ 768px ── */
  @media (max-width: 768px) {
    .fd-body {
      padding: 8px 10px;
    }

    .fd-row2 {
      grid-template-columns: 1fr;
    }

    .fd-sidebar {
      position: static;
    }

    .fd-three-col {
      grid-template-columns: minmax(0, 1fr);
    }

    .fd-three-col > *:last-child {
      grid-column: auto;
    }
  }

  /* ── Mobile: ≤ 480px ── */
  @media (max-width: 480px) {
    .fd-body {
      padding: 6px 8px;
    }

    .fd-row2 {
      gap: 8px;
      margin-bottom: 8px;
    }

    .fd-three-col {
      gap: 8px;
      margin-bottom: 8px;
    }
  }
`;

const FinamanDashboard = () => {
  const { data, loading, error, refetch, lastFetched } = useDashboard();

  useEffect(() => {
    // Inject responsive styles once, avoid duplicates
    const styleId = "fd-responsive-styles";
    if (!document.getElementById(styleId)) {
      const tag = document.createElement("style");
      tag.id = styleId;
      tag.textContent = RESPONSIVE_CSS;
      document.head.appendChild(tag);
    }
    return () => {
      // Leave styles in place if multiple instances might mount;
      // remove only when absolutely sure this is the sole consumer.
    };
  }, []);

  return (
    <div className="fd-shell">
      <div className="fd-body">
        {/* Row 0: Alerts strip */}
        <AlertsStrip />

        {/* Row 1: KPI strip */}
        <KpiStrip data={data} loading={loading} />

        {/* Row 2: Heatmap + Upcoming Events */}
        <div className="fd-row2">
          <AttendanceHeatmap />
          <div className="fd-sidebar">
            <UpcomingEvents isHalf={true} />
          </div>
        </div>

        {/* Row 3: Leave + Approvals + WorkDiary */}
        <div className="fd-three-col">
          <LeaveAnalytics isHalf={true} />
          <ApprovalWorkflow />
          <WorkDiarySummary data={data} loading={loading} />
        </div>

        {/* Row 4: Payroll */}
        <PayrollOverview data={data} loading={loading} />
      </div>
    </div>
  );
};

export default FinamanDashboard;
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
  :root {
    --fd-card-h: 292px;
  }

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
    box-sizing: border-box;
    min-height: 0;
  }

  .fd-alerts {
    margin-bottom: 12px;
  }

  .fd-kpi-strip {
    margin-bottom: 14px;
  }

  /* ── Single flat bento grid — every card is a direct child, same fixed
     row height, reflows as ONE unit (no manual row/column grouping) ── */
  .fd-bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    grid-auto-rows: var(--fd-card-h);
    gap: 14px;
    min-width: 0;
  }

  .fd-bento-grid > * {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  /* Optional span helpers — apply on the wrapper of any card that should
     take up more room than a single cell (e.g. Payroll, a wide hero, etc). */
  .fd-span-2 { grid-column: span 2; }
  .fd-span-3 { grid-column: span 3; }
  .fd-row-span-2 { grid-row: span 2; height: calc(var(--fd-card-h) * 2 + 14px); }

  /* ── Tablet: ≤ 1024px ── */
  @media (max-width: 1024px) {
    .fd-body {
      padding: 10px 12px;
    }

    .fd-bento-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    .fd-span-3 { grid-column: span 2; }
  }

  /* ── Small tablet / large phone: ≤ 768px ── */
  @media (max-width: 768px) {
    .fd-body {
      padding: 8px 10px;
    }

    .fd-bento-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .fd-span-2,
    .fd-span-3 {
      grid-column: span 1;
    }

    .fd-row-span-2 {
      grid-row: span 1;
      height: var(--fd-card-h);
    }
  }

  /* ── Mobile: ≤ 480px ── */
  @media (max-width: 480px) {
    .fd-body {
      padding: 6px 8px;
    }

    .fd-bento-grid {
      gap: 8px;
    }
  }
    @media (max-width: 768px) {
  .fd-bento-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .fd-span-2,
  .fd-span-3 {
    grid-column: span 1;
  }

  .fd-row-span-2 {
    grid-row: span 1;
    height: var(--fd-card-h);
  }

  /* 👇 ye naya block add karo — Payroll ko clip hone se rokta hai */
  .fd-payroll-wrap {
    height: auto;
    overflow: visible;
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
    return () => {};
  }, []);

  return (
    <div className="fd-shell">
      <div className="fd-body">
    

        {/* KpiStrip sits above the bento grid as its own row — it is not
            a grid child, so it isn't constrained to --fd-card-h. */}
        <div className="fd-kpi-strip">
          <KpiStrip data={data} loading={loading} />
        </div>

        <div className="fd-bento-grid">
          <AttendanceHeatmap />

          <UpcomingEvents isHalf={true} />

          <LeaveAnalytics isHalf={true} />

          <ApprovalWorkflow />

          <WorkDiarySummary data={data} loading={loading} />

          <div className="fd-span-2 fd-payroll-wrap">
            <PayrollOverview data={data} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinamanDashboard;
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
      deltaType: "neu",
      icon:    "ti ti-users",
      accent:  "#378ADD",
      deltaBg: "#E6F1FB", deltaColor: "#0C447C",
    },
    {
      label:   "Present Today",
      value:   loading ? "—" : kpi.present_today ?? "—",
      delta:   loading ? "" : `${kpi.absent_today ?? 0} absent`,
      deltaType: "neu",
      icon:    "ti ti-user-check",
      accent:  "#639922",
      deltaBg: "#FAEEDA", deltaColor: "#854F0B",
    },
    {
      label:   "June Payroll",
      value:   loading ? "—" : fmt(data?.payroll?.gross_total),
      delta:   loading ? "" :
        data?.payroll?.pending_count > 0
          ? `${data.payroll.pending_count} pending`
          : `${data?.payroll?.approved_count ?? 0} approved`,
      deltaType: data?.payroll?.pending_count > 0 ? "warn" : "up",
      icon:    "ti ti-report-money",
      accent:  "#EF9F27",
      deltaBg: data?.payroll?.pending_count > 0 ? "#FAEEDA" : "#EAF3DE",
      deltaColor: data?.payroll?.pending_count > 0 ? "#854F0B" : "#3B6D11",
    },
    {
      label:   "Pending Approvals",
      value:   loading ? "—" : kpi.pending_approvals ?? "—",
      delta:   loading ? "" : kpi.pending_approvals > 0 ? "Needs action" : "All clear",
      deltaType: kpi.pending_approvals > 0 ? "dn" : "up",
      icon:    "ti ti-circle-check",
      accent:  "#E24B4A",
      deltaBg: kpi.pending_approvals > 0 ? "#FCEBEB" : "#EAF3DE",
      deltaColor: kpi.pending_approvals > 0 ? "#A32D2D" : "#3B6D11",
    },
    {
      label:   "Open Tasks",
      value:   loading ? "—" : kpi.open_tasks ?? "—",
      delta:   loading ? "" : `${kpi.overdue_tasks ?? 0} overdue`,
      deltaType: (kpi.overdue_tasks ?? 0) > 0 ? "dn" : "up",
      icon:    "ti ti-checklist",
      accent:  "#7F77DD",
      deltaBg: (kpi.overdue_tasks ?? 0) > 0 ? "#FCEBEB" : "#EAF3DE",
      deltaColor: (kpi.overdue_tasks ?? 0) > 0 ? "#A32D2D" : "#3B6D11",
    },
  ];

  return (
    <div style={styles.grid}>
      {kpis.map((k) => (
        <div key={k.label} style={{ ...styles.card, borderTopColor: k.accent }}>
          <i className={k.icon} style={{ fontSize: 18, color: k.accent }} aria-hidden="true" />
          <div style={styles.value}>
            {loading ? <div style={styles.shimmer} /> : k.value}
          </div>
          <div style={styles.label}>{k.label}</div>
          {!loading && (
            <div style={{ ...styles.delta, background: k.deltaBg, color: k.deltaColor }}>
              {k.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 20,
    marginBottom: 12,
  },
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderTop: "3px solid transparent",
    borderRadius: 8,
    padding: "8px 11px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  value: {
    fontSize: 18, fontWeight: 500, color: "#1a1a1a",
    lineHeight: 1, marginTop: 1, minHeight: 26,
  },
  label:  { fontSize: 11, color: "#666" },
  delta:  { fontSize: 10, padding: "2px 7px", borderRadius: 20, display: "inline-block", marginTop: 2, width: "fit-content" },
  shimmer: { height: 22, width: 60, background: "#e8e8e8", borderRadius: 4, animation: "pulse 1.5s infinite" },
};

export default KpiStrip;

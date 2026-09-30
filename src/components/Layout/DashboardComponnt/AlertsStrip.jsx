import React, { useState } from "react";

const ALERTS = [
  {
    id: 1,
    type: "danger",
    icon: "ti ti-user-off",
    title: "3 employees absent 3+ days",
    sub: "Ravi Kumar, Amit Mishra, Pooja Singh",
    bg: "#FCEBEB",
    color: "#A32D2D",
    border: "#F09595",
    dot: "#E24B4A",
  },
  {
    id: 2,
    type: "warning",
    icon: "ti ti-alert-triangle",
    title: "5 employees — salary structure missing",
    sub: "June payroll may be affected",
    bg: "#FAEEDA",
    color: "#854F0B",
    border: "#FAC775",
    dot: "#EF9F27",
  },
  {
    id: 3,
    type: "warning",
    icon: "ti ti-beach",
    title: "12 leave balances expiring this month",
    sub: "Action needed before 30 Jun",
    bg: "#FAEEDA",
    color: "#854F0B",
    border: "#FAC775",
    dot: "#EF9F27",
  },
  {
    id: 4,
    type: "info",
    icon: "ti ti-id-badge",
    title: "4 employees — probation ending this week",
    sub: "Confirmation letters pending",
    bg: "#E6F1FB",
    color: "#0C447C",
    border: "#B5D4F4",
    dot: "#378ADD",
  },
  {
    id: 5,
    type: "danger",
    icon: "ti ti-file-invoice",
    title: "TDS returns due in 3 days",
    sub: "Q1 FY2026-27 filing deadline",
    bg: "#FCEBEB",
    color: "#A32D2D",
    border: "#F09595",
    dot: "#E24B4A",
  },
];

const AlertsStrip = () => {
  const [dismissed, setDismissed] = useState([]);

  const visible = ALERTS.filter((a) => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.hdr}>
        <div style={styles.hdrLeft}>
          <i className="ti ti-alert-circle" aria-hidden="true" style={{ fontSize: 13, color: "#E24B4A" }} />
          <span style={styles.hdrTitle}>Alerts & Anomalies</span>
          <span style={styles.badge}>{visible.length}</span>
        </div>
        <button
          style={styles.dismissAll}
          onClick={() => setDismissed(ALERTS.map((a) => a.id))}
        >
          Dismiss all
        </button>
      </div>
      <div style={styles.scrollRow}>
        {visible.map((a) => (
          <div key={a.id} style={{ ...styles.pill, background: a.bg, border: `0.5px solid ${a.border}` }}>
            <div style={{ ...styles.dot, background: a.dot }} />
            <i className={a.icon} aria-hidden="true" style={{ fontSize: 13, color: a.color, flexShrink: 0 }} />
            <div style={styles.pillText}>
              <span style={{ ...styles.pillTitle, color: a.color }}>{a.title}</span>
              <span style={{ ...styles.pillSub, color: a.color + "CC" }}>{a.sub}</span>
            </div>
            <button
              aria-label="Dismiss alert"
              style={styles.closeBtn}
              onClick={() => setDismissed((p) => [...p, a.id])}
            >
              <i className="ti ti-x" aria-hidden="true" style={{ fontSize: 11, color: a.color }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  wrap: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderLeft: "3px solid #E24B4A",
    borderRadius: 8,
    padding: "9px 14px",
    marginBottom: 12,
  },
  hdr: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  hdrLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  hdrTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  badge: {
    fontSize: 10,
    background: "#E24B4A",
    color: "#fff",
    borderRadius: 20,
    padding: "1px 6px",
    fontWeight: 500,
  },
  dismissAll: {
    fontSize: 10,
    color: "#888",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  },
  scrollRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 2,
    scrollbarWidth: "none",
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "6px 10px",
    borderRadius: 8,
    flexShrink: 0,
    maxWidth: 280,
    position: "relative",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  pillText: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0,
  },
  pillTitle: {
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  pillSub: {
    fontSize: 10,
    whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 0 0 4px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
};

export default AlertsStrip;

import React from "react";

const APPROVALS = [
  { initials: "RK", name: "Ravi Kumar",   type: "Casual Leave · 2 days",       status: "Pending",  avatarBg: "#FAEEDA", avatarColor: "#854F0B", badgeBg: "#FAEEDA", badgeColor: "#854F0B" },
  { initials: "PS", name: "Priya Sharma", type: "OT Claim · ₹4,200",           status: "Review",   avatarBg: "#E6F1FB", avatarColor: "#0C447C", badgeBg: "#E6F1FB", badgeColor: "#0C447C" },
  { initials: "AM", name: "Amit Mishra",  type: "Regularization · 3 days",     status: "Overdue",  avatarBg: "#FCEBEB", avatarColor: "#A32D2D", badgeBg: "#FCEBEB", badgeColor: "#A32D2D" },
  { initials: "SV", name: "Sneha Verma",  type: "Investment Declaration",       status: "Pending",  avatarBg: "#FAEEDA", avatarColor: "#854F0B", badgeBg: "#FAEEDA", badgeColor: "#854F0B" },
  { initials: "DG", name: "Dev Gupta",    type: "Sick Leave · 1 day",          status: "Overdue",  avatarBg: "#FCEBEB", avatarColor: "#A32D2D", badgeBg: "#FCEBEB", badgeColor: "#A32D2D" },
  { initials: "NJ", name: "Neha Joshi",   type: "Comp Off · 1 day",            status: "Pending",  avatarBg: "#FAEEDA", avatarColor: "#854F0B", badgeBg: "#FAEEDA", badgeColor: "#854F0B" },
];

const ApprovalWorkflow = () => {
  return (
    <div style={styles.card}>
      <div style={styles.cardHdr}>
        <span style={styles.cardTitle}>Approval workflow</span>
        <span style={styles.action}>Manage all ↗</span>
      </div>

      <div style={styles.list}>
        {APPROVALS.map((a, i) => (
          <div key={i} style={{ ...styles.item, borderBottom: i < APPROVALS.length - 1 ? "0.5px solid rgba(0,0,0,0.07)" : "none" }}>
            <div style={{ ...styles.avatar, background: a.avatarBg, color: a.avatarColor }}>
              {a.initials}
            </div>
            <div style={styles.info}>
              <div style={styles.name}>{a.name}</div>
              <div style={styles.type}>{a.type}</div>
            </div>
            <span style={{ ...styles.badge, background: a.badgeBg, color: a.badgeColor }}>
              {a.status}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div style={styles.summaryRow}>
        {[
          { label: "Pending", val: 4, color: "#854F0B", bg: "#FAEEDA" },
          { label: "Overdue", val: 2, color: "#A32D2D", bg: "#FCEBEB" },
          { label: "Review",  val: 1, color: "#0C447C", bg: "#E6F1FB" },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.summaryBox, background: s.bg }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 10, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px" },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  list: { display: "flex", flexDirection: "column" },
  item: { display: "flex", alignItems: "center", gap: 9, padding: "7px 0" },
  avatar: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  type: { fontSize: 10, color: "#888", marginTop: 1 },
  badge: { fontSize: 9, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 },
  summaryRow: { display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "0.5px solid rgba(0,0,0,0.07)" },
  summaryBox: { flex: 1, borderRadius: 8, padding: "7px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
};

export default ApprovalWorkflow;

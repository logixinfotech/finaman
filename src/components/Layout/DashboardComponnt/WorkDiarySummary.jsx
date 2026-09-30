 
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
 
const WorkDiarySummary = ({ data, loading }) => {
  const stats   = data?.work_diary?.stats      || {};
  const members = data?.work_diary?.by_member  || [];
  const tasks   = data?.work_diary?.recent_tasks || [];

  const STATS = [
    { label: "Open",    val: stats.open    ?? 0, color: "#378ADD" },
    { label: "Done",    val: stats.done    ?? 0, color: "#639922" },
    { label: "Overdue", val: stats.overdue ?? 0, color: "#E24B4A" },
    { label: "Review",  val: stats.review  ?? 0, color: "#EF9F27" },
  ];

 
  const statusColor = (s) => {
    if (!s) return "#999";
    if (s.toLowerCase().includes("over")) return "#A32D2D";
    if (s === "In Review") return "#854F0B";
    if (s === "Completed") return "#3B6D11";
    return "#185FA5";
  };
  const dotColor = (s) => {
    if (!s) return "#ccc";
    if (s.toLowerCase().includes("over") || s === "Overdue") return "#E24B4A";
    if (s === "In Review") return "#EF9F27";
    if (s === "Completed") return "#639922";
    return "#378ADD";
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHdr}>
        <span style={styles.cardTitle}>Work diary — task status</span>
        <span style={styles.action}>Open diary ↗️</span>
      </div>
      <div style={styles.statsRow}>
        {STATS.map((s) => (
          <div key={s.label} style={styles.statBox}>
            {loading
              ? <div style={styles.shimmer} />
              : <div style={{ ...styles.statVal, color: s.color }}>{s.val}</div>
            }
            <div style={styles.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={styles.taskList}>
        {loading
          ? [1,2,3].map(i => <div key={i} style={{ ...styles.shimmer, marginBottom: 5, height: 30 }} />)
          : tasks.length === 0
            ? <div style={styles.empty}>No open tasks</div>
            : tasks.map((t) => (
                <div key={t.line_id} style={styles.taskItem}>
                  <div style={{ ...styles.dot, background: dotColor(t.status) }} />
                  <span style={styles.taskText} title={t.work_plan}>
                    {t.work_plan?.length > 28 ? t.work_plan.substring(0, 28) + "…" : t.work_plan}
                  </span>
                  <span style={styles.taskAssign}>{t.assigned_to_name || t.diary_owner || "—"}</span>
                  <span style={{ ...styles.taskDue, color: statusColor(
                    t.due_date && t.due_date < new Date().toISOString().substring(0,10)
                      ? "Overdue" : t.status
                  )}}>
                    {t.due_date && t.due_date < new Date().toISOString().substring(0,10)
                      ? "Overdue"
                      : t.due_date || t.status}
                  </span>
                </div>
              ))
        }
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderRadius: 14,
    padding: "13px 14px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardHdr:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 },
  cardTitle:{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action:   { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 20, flexShrink: 0 },
  statBox:  { background: "#f5f6f8", borderRadius: 8, padding: "7px 8px", textAlign: "center" },
  statVal:  { fontSize: 16, fontWeight: 500 },
  statLbl:  { fontSize: 10, color: "#888", marginTop: 2 },
  chartBlock:{ flexShrink: 0 },
  legendRow:{ display: "flex", gap: 12, marginBottom: 8, fontSize: 10, color: "#888" },
  legItem:  { display: "flex", alignItems: "center", gap: 4 },
  legBox:   { width: 10, height: 10, borderRadius: 2, display: "inline-block" },
  taskList: { display: "flex", flexDirection: "column", gap: 5, flex: 1, minHeight: 0, overflowY: "auto" },
  taskItem: { display: "flex", alignItems: "center", gap: 8, background: "#f5f6f8", borderRadius: 8, padding: "6px 9px", flexShrink: 0 },
  dot:      { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  taskText: { flex: 1, fontSize: 11, color: "#1a1a1a", overflow: "hidden", whiteSpace: "nowrap" },
  taskAssign:{ fontSize: 10, color: "#888", flexShrink: 0 },
  taskDue:  { fontSize: 10, fontWeight: 500, flexShrink: 0 },
  shimmer:  { height: 16, background: "#e8e8e8", borderRadius: 4, width: "80%" },
  empty:    { fontSize: 11, color: "#aaa", textAlign: "center", padding: "10px 0" },
};

export default WorkDiarySummary;
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// June 2026: starts Monday. 0 = Holiday/Weekend
const ATT_DATA = [
  97, 94, 0,  91, 88, 0, 0,
  95, 92, 96,  0, 89, 0, 0,
  93, 90, 94, 97,  0, 0, 0,
  88, 92, 95, 91, 94, 0, 0,
  96,  0,
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const DEPT_DATA = [
  { name: "Sales",      pct: 100, color: "#639922" },
  { name: "IT",         pct: 92,  color: "#639922" },
  { name: "HR",         pct: 88,  color: "#EF9F27" },
  { name: "Finance",    pct: 80,  color: "#EF9F27" },
  { name: "Operations", pct: 72,  color: "#E24B4A" },
  { name: "Logistics",  pct: 68,  color: "#E24B4A" },
];

const TREND_DATA = [209, 215, 211, 218, 211];

function cellColor(v) {
  if (v === 0) return "#F7C1C1";
  if (v >= 95) return "#27500A";
  if (v >= 90) return "#3B6D11";
  if (v >= 85) return "#639922";
  return "#C0DD97";
}

const AttendanceHeatmap = () => {
  const trendChart = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        data: TREND_DATA,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.08)",
        tension: 0.4,
        fill: true,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: "#378ADD",
        type: "line",
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.raw + " present" } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        min: 195,
        max: 225,
        grid: { color: "rgba(128,128,128,0.08)" },
        ticks: { font: { size: 9 } },
      },
    },
  };

  return (
    <div style={styles.wrap}>
      {/* LEFT: Heatmap */}
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Attendance heatmap — June 2026</span>
          <span style={styles.action}>View register ↗</span>
        </div>

        {/* Day labels */}
        <div style={styles.dayRow}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={styles.dayLbl}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={styles.hmGrid}>
          {ATT_DATA.map((v, i) => (
            <div
              key={i}
              title={v === 0 ? "Holiday / Weekend" : `${v}% present`}
              style={{ ...styles.hmCell, background: cellColor(v) }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <span style={styles.legTxt}>Low</span>
          {["#C0DD97", "#639922", "#3B6D11", "#27500A"].map((c) => (
            <div key={c} style={{ ...styles.legBox, background: c }} />
          ))}
          <span style={styles.legTxt}>High</span>
          <div style={{ ...styles.legBox, background: "#F7C1C1", marginLeft: 8 }} />
          <span style={{ ...styles.legTxt, color: "#A32D2D" }}>Holiday/WO</span>
        </div>
      </div>

      {/* RIGHT: Dept bars + trend */}
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Dept-wise attendance %</span>
          <span style={styles.action}>Details ↗</span>
        </div>

        {DEPT_DATA.map((d) => (
          <div key={d.name} style={styles.deptRow}>
            <span style={styles.deptName}>{d.name}</span>
            <div style={styles.barBg}>
              <div style={{ ...styles.bar, width: `${d.pct}%`, background: d.color }} />
            </div>
            <span style={styles.deptPct}>{d.pct}%</span>
          </div>
        ))}

        <div style={{ height: 80, marginTop: 10, borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: 8, position: "relative" }}>
          <Bar data={trendChart} options={trendOptions} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrap: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 10 },
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px" },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  dayRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 },
  dayLbl: { fontSize: 9, color: "#999", textAlign: "center" },
  hmGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 },
  hmCell: { height: 14, borderRadius: 2, cursor: "default" },
  legend: { display: "flex", alignItems: "center", gap: 5, marginTop: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  legBox: { width: 10, height: 10, borderRadius: 2 },
  legTxt: { fontSize: 10, color: "#888" },
  deptRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 },
  deptName: { fontSize: 11, color: "#333", width: 72, flexShrink: 0 },
  barBg: { flex: 1, height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 4 },
  deptPct: { fontSize: 11, color: "#666", width: 30, textAlign: "right", flexShrink: 0 },
};

export default AttendanceHeatmap;

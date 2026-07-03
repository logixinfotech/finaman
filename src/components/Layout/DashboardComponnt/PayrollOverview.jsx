import React from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler);

const STATUTORY = [
  { label: "PF",  val: "₹52,400", bg: "#E6F1FB", color: "#0C447C" },
  { label: "ESI", val: "₹18,200", bg: "#EAF3DE", color: "#27500A" },
  { label: "PT",  val: "₹9,800",  bg: "#FAEEDA", color: "#854F0B" },
  { label: "TDS", val: "₹31,500", bg: "#FCEBEB", color: "#A32D2D" },
  { label: "LWF", val: "₹4,100",  bg: "#EEEDFE", color: "#3C3489" },
];

const GRADE_LABELS = ["L1", "L2", "L3", "L4", "L5"];
const GRADE_DATA   = [58, 72, 54, 38, 26];
const GRADE_COLORS = ["#378ADD", "#639922", "#EF9F27", "#7F77DD", "#E24B4A"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const GROSS  = [16.2, 16.8, 17.1, 17.0, 17.9, 18.4];
const NET    = [14.4, 14.9, 15.2, 15.1, 15.9, 16.3];

const PayrollOverview = () => {
  const trendData = {
    labels: MONTHS,
    datasets: [
      {
        label: "Gross",
        data: GROSS,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.07)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#378ADD",
      },
      {
        label: "Net",
        data: NET,
        borderColor: "#639922",
        borderDash: [4, 3],
        tension: 0.4,
        fill: false,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: "#639922",
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `₹${c.raw}L` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, autoSkip: false } },
      y: {
        min: 13, max: 20,
        grid: { color: "rgba(128,128,128,0.08)" },
        ticks: { font: { size: 9 }, callback: (v) => `₹${v}L` },
      },
    },
  };

  const gradeData = {
    labels: GRADE_LABELS,
    datasets: [{ data: GRADE_DATA, backgroundColor: GRADE_COLORS, borderRadius: 3 }],
  };

  const gradeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: "rgba(128,128,128,0.08)" }, ticks: { font: { size: 9 } } },
    },
  };

  return (
    <div style={styles.wrap}> 
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Payroll breakdown — June 2026</span>
          <span style={styles.action}>Full report ↗</span>
        </div> 
        <div style={styles.metaRow}>
          {[
            { label: "Gross payout",  val: "₹18.4L", bar: "#378ADD", w: "100%" },
            { label: "Deductions",    val: "₹2.1L",  bar: "#E24B4A", w: "32%"  },
            { label: "Net payout",    val: "₹16.3L", bar: "#639922", w: "88%"  },
          ].map((m) => (
            <div key={m.label} style={styles.metaBox}>
              <div style={styles.metaVal}>{m.val}</div>
              <div style={styles.metaLbl}>{m.label}</div>
              <div style={styles.metaBarBg}>
                <div style={{ height: "100%", borderRadius: 2, background: m.bar, width: m.w }} />
              </div>
            </div>
          ))}
        </div> 
        <div style={styles.chipRow}>
          {STATUTORY.map((s) => (
            <span key={s.label} style={{ ...styles.chip, background: s.bg, color: s.color }}>
              {s.label}: {s.val}
            </span>
          ))}
        </div> 
        <div style={{ height: 120, position: "relative" }}>
          <Line data={trendData} options={trendOptions} />
        </div> 
        <div style={styles.legendRow}>
          <span style={styles.legItem}><span style={{ ...styles.legLine, background: "#378ADD" }} />Gross</span>
          <span style={styles.legItem}><span style={{ ...styles.legLine, background: "#639922", borderTop: "1px dashed #639922" }} />Net</span>
        </div>
      </div> 
      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <span style={styles.cardTitle}>Headcount & grade mix</span>
        </div>

        <div style={{ height: 130, position: "relative", marginBottom: 10 }}>
          <Bar data={gradeData} options={gradeOptions} />
        </div>

        {/* Grade chips */}
        <div style={styles.chipRow}>
          {GRADE_LABELS.map((g, i) => (
            <span key={g} style={{ ...styles.chip, background: GRADE_COLORS[i] + "22", color: GRADE_COLORS[i] }}>
              {g} · {GRADE_DATA[i]}
            </span>
          ))}
        </div>

        {/* Joins vs Exits */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(0,0,0,0.07)" }}>
          <div style={styles.cardTitle}>Joining vs exit — YTD</div>
          <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
            <div style={{ ...styles.jebox, background: "#EAF3DE" }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#3B6D11" }}>18</div>
              <div style={{ fontSize: 10, color: "#3B6D11" }}>New joins</div>
            </div>
            <div style={{ ...styles.jebox, background: "#FCEBEB" }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#A32D2D" }}>7</div>
              <div style={{ fontSize: 10, color: "#A32D2D" }}>Exits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrap: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 },
  card: { background: "#fff", border: "0.5px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: "13px 14px" },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  metaRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 },
  metaBox: { background: "#f5f6f8", borderRadius: 8, padding: "8px 10px" },
  metaVal: { fontSize: 14, fontWeight: 500, color: "#1a1a1a" },
  metaLbl: { fontSize: 10, color: "#888", marginTop: 2 },
  metaBarBg: { height: 4, background: "#e0e0e0", borderRadius: 2, marginTop: 5 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  chip: { fontSize: 10, padding: "2px 8px", borderRadius: 20 },
  legendRow: { display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "#888" },
  legItem: { display: "flex", alignItems: "center", gap: 5 },
  legLine: { width: 14, height: 2, display: "inline-block", borderRadius: 1 },
  jebox: { flex: 1, borderRadius: 8, padding: "8px", textAlign: "center" },
};

export default PayrollOverview;

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { useDepartmentAttendance } from "../../../Hooks/useAttendance";
import { fetchAttendanceRegister } from "../../../utils/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const TREND_DATA = [209, 215, 211, 218, 211]; // TODO: wire this to a real weekly-trend endpoint if available

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const mapStatus = (dbStatus) => {
  const map = {
    PRESENT: "P",
    HALF_DAY: "HD",
    SHORT: "SH",
    ABSENT: "A",
    "WEEK OFF": "WO",
    "WEEKOFF": "WO",
    "WEEKOFF OT": "WOT",
    HOLIDAY: "H",
    "HOLIDAY OT": "HOT",
    CL: "CL",
    SL: "SL",
    PL: "PL",
    EL: "EL",
  };
  return map[dbStatus] || dbStatus || "-";
};

const PRESENT_STATUSES = ["P", "HD", "SH"];
const OFF_STATUSES = ["WO", "H", "WOT", "HOT"];

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

function cellColor(v) {
  if (v >= 95) return "#27500A";
  if (v >= 90) return "#3B6D11";
  if (v >= 85) return "#639922";
  return "#C0DD97";
}

const HOLIDAY_COLOR = "#F7C1C1";
const NO_DATA_COLOR = "#EAECEF"; // future / not-yet-available day

// ── tiny inline icons (no external deps) ──────────────────────
const CalendarIcon = ({ color = "#185FA5" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
  </svg>
);

const BuildingIcon = ({ color = "#185FA5" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15" />
    <path d="M14 21V10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
    <path d="M4 21h16M8 9h2M8 13h2M8 17h2" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

const ChevronIcon = ({ dir = "left" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5">
    {dir === "left" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
  </svg>
);

const INJECTED_CSS = `
  .ah-card {
    transition: box-shadow 180ms ease, transform 180ms ease;
  }
  .ah-card:hover {
    box-shadow: 0 8px 24px rgba(16,24,40,0.08);
  }
  .ah-cell {
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  .ah-cell:hover {
    transform: scale(1.08);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    z-index: 2;
    position: relative;
  }
  .ah-cell-nodata {
    background-image: repeating-linear-gradient(45deg, rgba(148,163,184,0.35) 0 2px, transparent 2px 6px);
  }
  .ah-dept-row {
    transition: background 120ms ease;
  }
  .ah-dept-row:hover {
    background: rgba(24,95,165,0.04);
  }
  .ah-ghost-btn {
    transition: background 140ms ease, border-color 140ms ease;
  }
  .ah-ghost-btn:hover {
    background: rgba(24,95,165,0.07);
    border-color: rgba(24,95,165,0.25);
  }
  .ah-month-nav-btn {
    transition: background 140ms ease;
  }
  .ah-month-nav-btn:hover {
    background: rgba(24,95,165,0.1);
  }
  @keyframes ah-shimmer {
    0% { background-position: -120px 0; }
    100% { background-position: 120px 0; }
  }
  .ah-skeleton {
    background: linear-gradient(90deg, #eef0f2 25%, #f7f8f9 37%, #eef0f2 63%);
    background-size: 200px 100%;
    animation: ah-shimmer 1.3s ease-in-out infinite;
    border-radius: 5px;
  }
`;

const AttendanceHeatmap = () => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState({
    month: today.getMonth() + 1, // 1-12
    year: today.getFullYear(),
  });

  const [dayMap, setDayMap] = useState({}); // { [day]: { total, present, off } }
  const [hmLoading, setHmLoading] = useState(false);
  const [hmError, setHmError] = useState(false);

  const currentMonthStr = `${cursor.year}-${String(cursor.month).padStart(2, "0")}`;
  const { data: deptData, loading: deptLoading, error: deptError } =
    useDepartmentAttendance(currentMonthStr);

  useEffect(() => {
    const id = "ah-injected-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = INJECTED_CSS;
      document.head.appendChild(tag);
    }
  }, []);

  const loadHeatmap = useCallback(async () => {
    setHmLoading(true);
    setHmError(false);
    try {
      const res = await fetchAttendanceRegister(cursor.month, cursor.year);
      if (res.success) {
        const map = {};
        res.data.forEach((row) => {
          const dateStr = String(row.attendance_date).substring(0, 10);
          const day = parseInt(dateStr.split("-")[2], 10);
          const status = mapStatus(row.status);

          if (!map[day]) map[day] = { total: 0, present: 0, off: 0 };
          map[day].total += 1;
          if (PRESENT_STATUSES.includes(status)) map[day].present += 1;
          if (OFF_STATUSES.includes(status)) map[day].off += 1;
        });
        setDayMap(map);
      } else {
        setHmError(true);
      }
    } catch (e) {
      console.error("Heatmap fetch error:", e);
      setHmError(true);
    } finally {
      setHmLoading(false);
    }
  }, [cursor.month, cursor.year]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const handlePrevMonth = () => {
    setCursor((c) => (c.month === 1 ? { month: 12, year: c.year - 1 } : { month: c.month - 1, year: c.year }));
  };
  const handleNextMonth = () => {
    setCursor((c) => (c.month === 12 ? { month: 1, year: c.year + 1 } : { month: c.month + 1, year: c.year }));
  };
  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(cursor.month, cursor.year);
    const firstWeekday = new Date(cursor.year, cursor.month - 1, 1).getDay(); // 0=Sun..6=Sat
    const leadingBlanks = (firstWeekday + 6) % 7; // shift so Monday = 0

    const cells = Array.from({ length: leadingBlanks }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(cursor.year, cursor.month - 1, day);
      cellDate.setHours(0, 0, 0, 0);
      const isFuture = cellDate > today;
      const entry = dayMap[day];

      let color;
      let pct = null;
      let label;

      if (isFuture || !entry) {
        color = NO_DATA_COLOR;
        label = isFuture ? "Data not available (upcoming)" : "Data not available";
      } else if (entry.off > 0 && entry.off >= entry.total * 0.5) {
        color = HOLIDAY_COLOR;
        label = "Holiday / Week off";
      } else {
        pct = entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0;
        color = cellColor(pct);
        label = `${pct}% present`;
      }

      cells.push({ day, color, label, isFuture: isFuture || !entry, isToday: cellDate.getTime() === today.getTime() });
    }

    // pad trailing cells so the grid always completes full week rows
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [cursor, dayMap, today]);

  const workingCells = calendarCells.filter((c) => c && !c.isFuture && c.color !== HOLIDAY_COLOR);
  const heatmapAvg = workingCells.length
    ? Math.round(
        workingCells.reduce((sum, c) => {
          const m = { "#27500A": 97, "#3B6D11": 92, "#639922": 87, "#C0DD97": 80 };
          return sum + (m[c.color] ?? 0);
        }, 0) / workingCells.length
      )
    : null;

  const deptRows = (deptData || [])
    .map((row) => {
      const totalDays =
        Number(row.total_present) + Number(row.total_absent) + Number(row.total_leave);
      const pct = totalDays > 0 ? Math.round((Number(row.total_present) / totalDays) * 100) : 0;
      return { name: row.department_name, pct, color: deptBarColor(pct) };
    })
    .sort((a, b) => b.pct - a.pct);

  const avgPct = deptRows.length
    ? Math.round(deptRows.reduce((sum, d) => sum + d.pct, 0) / deptRows.length)
    : null;

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
    <>
      {/* CARD 1: Heatmap */}
      <div className="ah-card ah-heatmap-card" style={styles.heatmapCard}>
        <div style={styles.cardHdr}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBadge}>
              <CalendarIcon />
            </div>
            <div>
              <div style={styles.eyebrow}>Attendance heatmap</div>
              <div style={styles.monthNavRow}>
                <button
                  className="ah-month-nav-btn"
                  style={styles.monthNavBtn}
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronIcon dir="left" />
                </button>
                <div style={styles.heading}>
                  {MONTH_NAMES[cursor.month - 1]} {cursor.year}
                </div>
                <button
                  className="ah-month-nav-btn"
                  style={styles.monthNavBtn}
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronIcon dir="right" />
                </button>
              </div>
            </div>
          </div>
          {heatmapAvg !== null && !hmLoading && !hmError && (
            <span style={styles.statPill}>Avg {heatmapAvg}%</span>
          )}
        </div>

        {hmLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, justifyContent: "center" }}>
            <div className="ah-skeleton" style={{ width: "100%", height: 90 }} />
          </div>
        )}

        {!hmLoading && hmError && (
          <div style={styles.stateBox}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={styles.stateTitle}>Couldn't load heatmap data</span>
            <span style={styles.stateSub}>Please refresh, or try again shortly.</span>
          </div>
        )}

        {!hmLoading && !hmError && (
          <div style={styles.hmWrap}>
            <div style={styles.dayRow}>
              {DAY_LABELS.map((d, i) => (
                <div key={i} style={styles.dayLbl}>{d}</div>
              ))}
            </div>

            <div style={styles.hmGrid}>
              {calendarCells.map((c, i) =>
                c ? (
                  <div
                    key={i}
                    className={`ah-cell${c.isFuture ? " ah-cell-nodata" : ""}`}
                    title={c.label}
                    style={{
                      ...styles.hmCell,
                      background: c.color,
                      outline: c.isToday ? "2px solid #185FA5" : "none",
                      outlineOffset: c.isToday ? "1px" : 0,
                    }}
                  >
                    <span style={{ ...styles.hmCellDate, color: c.isFuture ? "#8A8F98" : "rgba(0,0,0,0.55)" }}>
                      {c.day}
                    </span>
                  </div>
                ) : (
                  <div key={i} style={styles.hmCellBlank} />
                )
              )}
            </div>
          </div>
        )}

        <div style={styles.legendWrap}>
          <div style={styles.legendGradientRow}>
            <span style={styles.legTxt}>Low</span>
            <div style={styles.gradientBar} />
            <span style={styles.legTxt}>High</span>
          </div>
          <div style={styles.legendChipsRow}>
            <div style={styles.holidayChip}>
              <span style={{ ...styles.legendDot, background: HOLIDAY_COLOR }} />
              <span style={styles.legTxt}>Holiday / Week off</span>
            </div>
            <div style={styles.holidayChip}>
              <span style={{ ...styles.legendDot, background: NO_DATA_COLOR, border: "1px dashed #9AA0A6" }} />
              <span style={styles.legTxt}>Data not available</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Dept bars + trend */}
      <div className="ah-card" style={styles.card}>
        <div style={styles.cardHdr}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBadge}>
              <BuildingIcon />
            </div>
            <div>
              <div style={styles.eyebrow}>Department breakdown</div>
              <div style={styles.heading}>Attendance %</div>
            </div>
          </div>
          {avgPct !== null ? (
            <span style={styles.statPill}>Avg {avgPct}%</span>
          ) : (
            <button className="ah-ghost-btn" style={styles.ghostBtn}>
              Details <ArrowIcon />
            </button>
          )}
        </div>

        {deptLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13, padding: "6px 0 14px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="ah-skeleton" style={{ width: 70, height: 10 }} />
                <div className="ah-skeleton" style={{ flex: 1, height: 8 }} />
                <div className="ah-skeleton" style={{ width: 32, height: 10 }} />
              </div>
            ))}
          </div>
        )}

        {deptError && (
          <div style={styles.stateBox}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={styles.stateTitle}>Couldn't load department data</span>
            <span style={styles.stateSub}>Please refresh, or try again shortly.</span>
          </div>
        )}

        {!deptLoading && !deptError && deptRows.length === 0 && (
          <div style={styles.stateBox}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={styles.stateTitle}>No attendance data yet</span>
            <span style={styles.stateSub}>Nothing processed for this month so far.</span>
          </div>
        )}

        {!deptLoading && !deptError && deptRows.length > 0 && (
          <div style={styles.deptList}>
            {deptRows.map((d, i) => (
              <div
                key={d.name}
                className="ah-dept-row"
                style={{
                  ...styles.deptRow,
                  borderBottom: i === deptRows.length - 1 ? "none" : "1px solid rgba(15,23,42,0.05)",
                }}
              >
                <span style={styles.deptName} title={d.name}>{d.name}</span>
                <div style={styles.barBg}>
                  <div style={{ ...styles.bar, width: `${d.pct}%`, background: d.color }} />
                </div>
                <span style={{ ...styles.deptPctBadge, color: d.color, background: `${d.color}14` }}>
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.trendWrap}>
          <Bar data={trendChart} options={trendOptions} />
        </div>
      </div>
    </>
  );
};

function deptBarColor(pct) {
  if (pct >= 90) return "#1F9D55";
  if (pct >= 75) return "#EF9F27";
  return "#E24B4A";
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.07)",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  heatmapCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.07)",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },

  cardHdr: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "rgba(24,95,165,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 600,
    color: "#8A8F98",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 2,
  },
  heading: { fontSize: 14, fontWeight: 700, color: "#1F2430" },
  monthNavRow: { display: "flex", alignItems: "center", gap: 4 },
  monthNavBtn: {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    cursor: "pointer",
    padding: 0,
  },

  ghostBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#185FA5",
    background: "transparent",
    border: "1px solid rgba(24,95,165,0.18)",
    borderRadius: 7,
    padding: "5px 9px",
    cursor: "pointer",
  },

  statPill: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    color: "#185FA5",
    background: "rgba(24,95,165,0.08)",
    padding: "4px 10px",
    borderRadius: 20,
  },

  hmWrap: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" },
  dayRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6, width: "100%" },
  dayLbl: { fontSize: 10.5, color: "#9AA0A6", textAlign: "center", fontWeight: 600 },
  hmGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "22px", gap: 4, width: "100%" },
  hmCell: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hmCellBlank: { width: "100%", height: "100%" },
  hmCellDate: { fontSize: 8.5, fontWeight: 700, lineHeight: 1, userSelect: "none" },

  legendWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 10 },
  legendGradientRow: { display: "flex", alignItems: "center", gap: 8, width: "fit-content" },
  gradientBar: {
    width: 90,
    height: 7,
    borderRadius: 20,
    background: "linear-gradient(90deg, #C0DD97, #639922, #3B6D11, #27500A)",
  },
  legTxt: { fontSize: 10, color: "#9AA0A6", fontWeight: 500 },
  legendChipsRow: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" },
  holidayChip: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },

  deptList: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" },
  deptRow: { display: "flex", alignItems: "center", gap: 12, padding: "6px 2px" },
  deptName: {
    fontSize: 12.5,
    color: "#2A2E33",
    width: 92,
    flexShrink: 0,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  barBg: { flex: 1, height: 7, background: "#EEF0F2", borderRadius: 4, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 4, transition: "width 400ms ease" },
  deptPctBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: 20,
    flexShrink: 0,
    minWidth: 38,
    textAlign: "center",
  },

  trendWrap: {
    height: 60,
    marginTop: "auto",
    borderTop: "1px solid rgba(15,23,42,0.06)",
    paddingTop: 8,
    position: "relative",
    flexShrink: 0,
  },

  stateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "22px 8px",
    textAlign: "center",
    flex: 1,
  },
  stateTitle: { fontSize: 12.5, fontWeight: 600, color: "#5A6069" },
  stateSub: { fontSize: 11, color: "#9AA0A6" },
};

export default AttendanceHeatmap;
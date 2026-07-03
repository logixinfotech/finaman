import * as XLSX from "xlsx";
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import {
  saveAttendanceLog, getActledList, updateAttendance, getAttendanceList, deleteAttendance, getWeekOff, fetchHolidays, getApprovedLeaves
} from "../../../../utils/api";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif";

const todayDay = () => String(new Date().getDate());
const todayMonth = () => new Date().getMonth();
const todayYear = () => String(new Date().getFullYear());

// ── avatar helpers ────────────────────────────────────────────────────────────
const AVT_COLORS = [
  ["#dbeafe", "#1d4ed8"], ["#dcfce7", "#15803d"], ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"], ["#ede9fe", "#6d28d9"], ["#cffafe", "#0e7490"],
  ["#fee2e2", "#b91c1c"], ["#f0fdf4", "#166534"], ["#fff7ed", "#c2410c"], ["#ecfdf5", "#065f46"],
];
const getAvatarColor = (id) => {
  const n = parseInt(id, 10);
  return AVT_COLORS[(isNaN(n) ? 0 : n) % AVT_COLORS.length];
};
const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
};

// ── Toast notification (replaces alert) ──────────────────────────────────────
let _toastFn = null;
const toast = (msg, type = "success") => {
  if (_toastFn) _toastFn(msg, type);
  else console.log(msg);
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { _toastFn = null; };
  }, []);

  const COLOR = {
    success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", text: "#166534" },
    error: { bg: "#fef2f2", border: "#fca5a5", icon: "#dc2626", text: "#991b1b" },
    info: { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", text: "#1e40af" },
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map(t => {
        const c = COLOR[t.type] || COLOR.info;
        return (
          <div key={t.id}
            style={{
              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 260, maxWidth: 360,
              fontFamily: FONT, animation: "slideIn 0.25s ease", pointerEvents: "auto"
            }}>
            {t.type === "success" && (
              <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {t.type === "error" && (
              <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {t.type === "info" && (
              <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
              </svg>
            )}
            <span style={{ fontSize: 12, color: c.text, fontWeight: 500 }}>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
};

// ── OutlineButton component ───────────────────────────────────────────────────
const OutlineButton = ({ onClick, color, hoverBg, icon, label, disabled }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onClick?.();
        }
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={e => { e.currentTarget.style.outline = "2px solid #3b82f6"; e.currentTarget.style.outlineOffset = "2px"; }}
      onBlur={e => { e.currentTarget.style.outline = "none"; }}
      style={{
        background: hovered && !disabled ? hoverBg : "#fff",
        border: `1.5px solid ${disabled ? "#cbd5e1" : color}`,
        color: disabled ? "#94a3b8" : color,
        borderRadius: 6, height: 28, padding: "0 12px",
        fontSize: 11, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1
      }}>
      {icon}
      {label}
    </button>
  );
};

// ── Period dropdowns component ────────────────────────────────────────────────
const PeriodDropdowns = forwardRef(({
  day, setDay, month, setMonth, year, setYear,
  dayOpts, showDay = true, disabled = false, selectCls, labelCls, months, years,
  onDayEnter, onMonthEnter, onYearEnter
}, ref) => {

  const [openPicker, setOpenPicker] = useState(null);
  const pickerRef = useRef(null);
  const dayBtnRef = useRef(null);
  const monthBtnRef = useRef(null);
  const yearBtnRef = useRef(null);

  const [focusedDay, setFocusedDay] = useState(null);
  const [focusedMonthIdx, setFocusedMonthIdx] = useState(null);
  const [focusedYearVal, setFocusedYearVal] = useState(null);

  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = months.indexOf(month);
  const yr = parseInt(year);
  const daysInMon = new Date(yr, mIdx + 1, 0).getDate();
  const firstDay = new Date(yr, mIdx, 1).getDay();
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const currentYrNum = parseInt(year);

  // ✅ FIX 1: Bahar click pe band karo
  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setOpenPicker(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ✅ FIX 2: Picker open hone pe focused cell initialize
  useEffect(() => {
    if (openPicker === "day") setFocusedDay(parseInt(day));
    if (openPicker === "month") setFocusedMonthIdx(mIdx);
    if (openPicker === "year") setFocusedYearVal(currentYrNum);
  }, [openPicker]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      setTimeout(() => {
        if (showDay) {
          dayBtnRef.current?.focus();
        } else {
          monthBtnRef.current?.focus();
        }
      }, 200);
    }
  }), [showDay]);


  const goToPrevMonth = () => {
    const i = months.indexOf(month);
    if (i > 0) setMonth(months[i - 1]);
    else { setMonth(months[11]); setYear(String(parseInt(year) - 1)); }
  };
  const goToNextMonth = () => {
    const i = months.indexOf(month);
    if (i < 11) setMonth(months[i + 1]);
    else { setMonth(months[0]); setYear(String(parseInt(year) + 1)); }
  };

  // ── Styles ──
  const wrapStyle = {
    display: "inline-flex", alignItems: "center", gap: 4, position: "relative"
  };
  const lblStyle = {
    fontSize: 11, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.04em",
    whiteSpace: "nowrap", lineHeight: 1,
    display: "inline-flex", alignItems: "center"
  };
  const btnStyle = (active) => ({
    height: 28, minWidth: 36, padding: "0 8px",
    border: `1px solid ${active ? "#3b82f6" : "#e2e8f0"}`,
    borderRadius: 6,
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#1d4ed8" : "#334155",
    fontSize: 12, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    outline: "none",
    display: "inline-flex", alignItems: "center", gap: 4,
    opacity: disabled ? 0.5 : 1,
    verticalAlign: "middle"
  });
  const navBtnStyle = {
    width: 22, height: 22, border: "1px solid #e2e8f0",
    borderRadius: 5, background: "#fff", color: "#64748b",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    outline: "none", padding: 0, flexShrink: 0
  };
  const popupStyle = {
    position: "absolute", top: "calc(100% + 6px)", left: 0,
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: 8, zIndex: 9999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)"
  };
  const cellStyle = (sel, focused, isRed) => ({
    width: "100%", height: 26, borderRadius: 5, border: "none",
    background: sel ? "#3b82f6" : focused ? "#dbeafe" : "transparent",
    color: sel ? "#fff" : isRed ? "#ef4444" : "#334155",
    fontSize: 12, fontWeight: sel || focused ? 700 : 500,
    cursor: "pointer", outline: "none"
  });

  // ── Keyboard handlers ──
  // handleDayKey — Enter pe sirf select karo, Month focus mat karo yahan
  const handleDayKey = (e) => {
    const cur = focusedDay || parseInt(day);
    if (e.key === "ArrowRight") { e.preventDefault(); setFocusedDay(Math.min(cur + 1, daysInMon)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setFocusedDay(Math.max(cur - 1, 1)); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setFocusedDay(Math.min(cur + 7, daysInMon)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedDay(Math.max(cur - 7, 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      setDay(String(focusedDay || cur));
      setOpenPicker(null);
      setTimeout(() => {
        monthBtnRef.current?.focus();  // Month button pe jao
      }, 50);
    }
    else if (e.key === "Escape") { setOpenPicker(null); dayBtnRef.current?.focus(); }
  };

  // handleMonthKey — Enter pe sirf select karo
  const handleMonthKey = (e) => {
    const cur = focusedMonthIdx ?? mIdx;
    if (e.key === "ArrowRight") { e.preventDefault(); setFocusedMonthIdx(Math.min(cur + 1, 11)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setFocusedMonthIdx(Math.max(cur - 1, 0)); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setFocusedMonthIdx(Math.min(cur + 3, 11)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedMonthIdx(Math.max(cur - 3, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      setMonth(months[focusedMonthIdx ?? cur]);
      setOpenPicker(null);
      setTimeout(() => {
        yearBtnRef.current?.focus();   // Year button pe jao
      }, 50);
    }
    else if (e.key === "Escape") { setOpenPicker(null); monthBtnRef.current?.focus(); }
  };

  // handleYearKey — Enter pe sirf select karo
  const handleYearKey = (e) => {
    const cur = focusedYearVal ?? currentYrNum;
    if (e.key === "ArrowRight") { e.preventDefault(); setFocusedYearVal(cur + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setFocusedYearVal(cur - 1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setFocusedYearVal(cur + 4); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedYearVal(cur - 4); }
    else if (e.key === "Enter") {
      e.preventDefault();
      setYear(String(focusedYearVal ?? cur));
      setOpenPicker(null);
      setTimeout(() => {
        onYearEnter?.();   // Parent decide karega — Employee ya InTime
      }, 50);
    }
    else if (e.key === "Escape") { setOpenPicker(null); yearBtnRef.current?.focus(); }
  };
  // ── Sub pickers ──
  const DayPicker = () => (
    <div style={{ ...popupStyle, width: 220 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <button style={navBtnStyle} onMouseDown={e => e.preventDefault()} onClick={goToPrevMonth}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{monthAbbr[mIdx]} {year}</span>
        <button style={navBtnStyle} onMouseDown={e => e.preventDefault()} onClick={goToNextMonth}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMon }, (_, i) => i + 1).map(d => {
          const sel = String(d) === String(day);
          const focused = d === (focusedDay || parseInt(day));
          const isSun = (firstDay + d - 1) % 7 === 0;
          return (
            <button key={d}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setDay(String(d)); setOpenPicker(null); setTimeout(() => { monthBtnRef.current?.focus(); onDayEnter?.(); }, 80); }}
              style={cellStyle(sel, focused && !sel, isSun)}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );

  const MonthPicker = () => (
    <div style={{ ...popupStyle, width: 180 }} >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button style={navBtnStyle} onMouseDown={e => e.preventDefault()} onClick={() => setYear(String(parseInt(year) - 1))}>‹</button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{year}</span>
        <button style={navBtnStyle} onMouseDown={e => e.preventDefault()} onClick={() => setYear(String(parseInt(year) + 1))}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
        {monthAbbr.map((m, i) => {
          const sel = mIdx === i;
          const focused = (focusedMonthIdx ?? mIdx) === i;
          return (
            <button key={m}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setMonth(months[i]); setOpenPicker(null); setTimeout(() => { yearBtnRef.current?.focus(); onMonthEnter?.(); }, 80); }}
              style={cellStyle(sel, focused && !sel, false)}
            >{m}</button>
          );
        })}
      </div>
    </div>
  );

  const YearPicker = () => {
    const displayRange = Array.from({ length: 12 }, (_, i) => (focusedYearVal ?? currentYrNum) - 4 + i);
    return (
      <div style={{ ...popupStyle, width: 200 }} >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button style={navBtnStyle} onMouseDown={e => e.preventDefault()}
            onClick={() => setFocusedYearVal(v => (v ?? currentYrNum) - 12)}>‹</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Select Year</span>
          <button style={navBtnStyle} onMouseDown={e => e.preventDefault()}
            onClick={() => setFocusedYearVal(v => (v ?? currentYrNum) + 12)}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
          {displayRange.map(y => {
            const sel = String(y) === String(year);
            const focused = y === (focusedYearVal ?? currentYrNum);
            return (
              <button key={y}
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setYear(String(y)); setOpenPicker(null); setTimeout(() => onYearEnter?.(), 80); }}
                style={cellStyle(sel, focused && !sel, false)}
              >{y}</button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={pickerRef} style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", flexWrap: "nowrap" }}>

      {/* DAY */}
      {showDay && (
        <div style={wrapStyle}>
          <span style={lblStyle}>Day:</span>
          <button ref={dayBtnRef} disabled={disabled}
            style={btnStyle(openPicker === "day")}
            onFocus={e => {
              e.currentTarget.style.outline = "2px solid #3b82f6";
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={e => {
              e.currentTarget.style.outline = "none";
            }}
            onKeyDown={(e) => {
              if (openPicker === "day") {
                handleDayKey(e);  // popup open hai — navigation handle karo
              } else if (e.key === " ") {
                e.preventDefault();
                if (!disabled) setOpenPicker("day");  // Space se popup kholo
              }
              // Enter pe kuch mat karo — popup band hai to sirf focus rahega
            }}
            onClick={() => !disabled && setOpenPicker(openPicker === "day" ? null : "day")}
          >
            {String(day).padStart(2, "0")}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {openPicker === "day" && <DayPicker />}
        </div>
      )}

      {/* MONTH */}
      <div style={wrapStyle}>
        <span style={lblStyle}>Month:</span>
        <button ref={monthBtnRef} disabled={disabled}
          style={btnStyle(openPicker === "month")}
          onFocus={e => {
            e.currentTarget.style.outline = "2px solid #3b82f6";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={e => {
            e.currentTarget.style.outline = "none";
          }}
          onKeyDown={(e) => {
            if (openPicker === "month") {
              handleMonthKey(e);
            } else if (e.key === " ") {
              e.preventDefault();
              if (!disabled) setOpenPicker("month");
            }
          }}
          onClick={() => !disabled && setOpenPicker(openPicker === "month" ? null : "month")}
        >
          {monthAbbr[mIdx]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {openPicker === "month" && <MonthPicker />}
      </div>

      {/* YEAR */}
      <div style={wrapStyle}>
        <span style={lblStyle}>Year:</span>
        <button ref={yearBtnRef} disabled={disabled}
          style={btnStyle(openPicker === "year")}
          onFocus={e => {
            e.currentTarget.style.outline = "2px solid #3b82f6";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={e => {
            e.currentTarget.style.outline = "none";
          }}
          onKeyDown={(e) => {
            if (openPicker === "year") {
              handleYearKey(e);
            } else if (e.key === " ") {
              e.preventDefault();
              if (!disabled) setOpenPicker("year");
            }
          }}
          onClick={() => !disabled && setOpenPicker(openPicker === "year" ? null : "year")}
        >
          {year}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        {openPicker === "year" && <YearPicker />}
      </div>

    </div>
  );
});

// Ek helper component banao file ke upar
const TimeInput = ({ value, onChange, disabled, id, inputRef }) => {
  // value format: "HH:MM" (24hr) ya ""
  const toDisplay = (v) => {
    if (!v || v === "--:--") return { h: "", m: "", ampm: "AM" };
    const [hh, mm] = v.split(":");
    const h = parseInt(hh);
    return {
      h: String(h > 12 ? h - 12 : h === 0 ? 12 : h).padStart(2, "0"),
      m: mm,
      ampm: h >= 12 ? "PM" : "AM"
    };
  };

  const to24 = (h, m, ampm) => {
    let hr = parseInt(h) || 0;
    if (ampm === "PM" && hr !== 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;
    return `${String(hr).padStart(2, "0")}:${m || "00"}`;
  };

  const { h, m, ampm } = toDisplay(value);

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      <input
        ref={inputRef} id={id}
        disabled={disabled}
        type="text" maxLength={2} placeholder="HH"
        value={h}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, "");
          onChange(to24(val, m, ampm));
        }}
        style={{
          width: 28, textAlign: "center", fontSize: 12, fontFamily: "monospace",
          border: "1px solid #e2e8f0", borderRadius: 4, height: 28, padding: "0 2px",
          background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#94a3b8" : "#1d4ed8"
        }}
      />
      <span style={{ fontSize: 12, color: "#94a3b8" }}>:</span>
      <input
        disabled={disabled}
        type="text" maxLength={2} placeholder="MM"
        value={m}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, "");
          onChange(to24(h, val, ampm));
        }}
        style={{
          width: 28, textAlign: "center", fontSize: 12, fontFamily: "monospace",
          border: "1px solid #e2e8f0", borderRadius: 4, height: 28, padding: "0 2px",
          background: disabled ? "#f8fafc" : "#fff", color: disabled ? "#94a3b8" : "#1d4ed8"
        }}
      />
      <button
        disabled={disabled}
        onClick={() => onChange(to24(h, m, ampm === "AM" ? "PM" : "AM"))}
        style={{
          fontSize: 10, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 4,
          height: 28, padding: "0 5px", cursor: disabled ? "not-allowed" : "pointer",
          background: ampm === "PM" ? "#eff6ff" : "#f8fafc",
          color: ampm === "PM" ? "#1d4ed8" : "#64748b"
        }}
      >
        {ampm}
      </button>
    </div>
  );
};

const AttendancePage = ({
  formData, setFormData, setShowForm, onSave,
  activeTab = "entry", onTabChange,
  currentRecord, totalRecords,
  mode = "view",
  onModify, onDelete, onPrint, onNewEntry, onEditCancel,
  saving, canPrint, rights, onPrevRecord, onNextRecord
}) => {
  const [attendanceType, setAttendanceType] = useState("List");
  const modeRef = useRef(null);
  const calInAmPmRefs = useRef({});
  const calOutAmPmRefs = useRef({});
  const listInRefs = useRef([]);
  const listInAmPmRefs = useRef([]);
  const listOutAmPmRefs = useRef([]);
  const listOutRefs = useRef([]);
  const listStatusRefs = useRef([]);
  const employeeRef = useRef(null);
  const listPeriodRef = useRef(null);
  const manualPeriodRef = useRef(null);
  const bioPeriodRef = useRef(null);
  const isFirstMount = useRef(true);
  // ── SEPARATE file refs for Bio and Excel ─────────────────────────────────────
  const [bioFile, setBioFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const bioFileRef = useRef(null);
  const excelFileRef = useRef(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [weekoffs, setWeekoffs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026", "2027", "2028"];

  const [selectedMonth, setSelectedMonth] = useState(months[todayMonth()]);
  const [selectedYear, setSelectedYear] = useState(todayYear());

  const [bioDay, setBioDay] = useState(todayDay());
  const [bioMonth, setBioMonth] = useState(months[todayMonth()]);
  const [bioYear, setBioYear] = useState(todayYear());

  const [listDay, setListDay] = useState(todayDay());
  const [listMonth, setListMonth] = useState(months[todayMonth()]);
  const [listYear, setListYear] = useState(todayYear());

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  const [attendanceData, setAttendanceData] = useState({});
  const [bioTableData, setBioTableData] = useState([]);
  const [bioLoading, setBioLoading] = useState(false);
  const [excelRows, setExcelRows] = useState([]);
  const [listEntryData, setListEntryData] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // derived dates
  const listEntryDate = (() => {
    const mIdx = months.indexOf(listMonth) + 1;
    return `${listYear}-${String(mIdx).padStart(2, "0")}-${String(listDay).padStart(2, "0")}`;
  })();
  const bioSelectedDate = (() => {
    const mIdx = months.indexOf(bioMonth) + 1;
    return `${bioYear}-${String(mIdx).padStart(2, "0")}-${String(bioDay).padStart(2, "0")}`;
  })();

  // calendar helpers
  const monthIndex = months.indexOf(selectedMonth);
  const yearNum = parseInt(selectedYear);
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(yearNum, monthIndex, 1).getDay();
  const calendarGrid = Array.from({ length: Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7 });

  const bioDayOptions = Array.from({ length: new Date(parseInt(bioYear), months.indexOf(bioMonth) + 1, 0).getDate() }, (_, i) => i + 1);
  const listDayOptions = Array.from({ length: new Date(parseInt(listYear), months.indexOf(listMonth) + 1, 0).getDate() }, (_, i) => i + 1);

  const statusOptions = [
    { label: "PRESENT", value: "PRESENT" },
    { label: "ABSENT", value: "ABSENT" },
    { label: "CL - Casual Leave", value: "CL" },
    { label: "SL - Sick Leave", value: "SL" },
    { label: "PL - Privilege Leave", value: "PL" },
    { label: "EL - Earn Leave", value: "EL" },
    { label: "ML - Maternity Leave", value: "ML" },
    { label: "PTL - Paternity Leave", value: "PTL" },
    { label: "CO - Comp-Off", value: "CO" },
    { label: "SCL - Special Casual Leave", value: "SCL" },
    { label: "WEEK OFF", value: "WEEK OFF" },
    { label: "WEEK OFF OT", value: "WEEK OFF OT" },
    { label: "HOLIDAYS", value: "HOLIDAYS" },
    { label: "HOLIDAY OT", value: "HOLIDAY OT" },
    { label: "UNPAID", value: "UNPAID" },
  ];
  const attendanceTypeOptions = [
    { label: "Month Entry", value: "Manual" },
    { label: "Day Entry", value: "List" },
    { label: "Biometric Integration", value: "Biometric" },
    { label: "Excel Import", value: "Excel" },
  ];


  // Day name get karna — no new Date() UTC issue
  const getDayName = (dateStr) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [y, m, d] = dateStr.split("-").map(Number);
    return days[new Date(y, m - 1, d).getDay()];
  };

  // Kya yeh din employee ka weekoff hai?
  const isEmployeeWeekoff = (dateStr, empId) => {
    return weekoffs.some(w =>
      String(w.employee_id) === String(empId) &&
      w.day_of_week === getDayName(dateStr) &&
      dateStr >= w.effective_from?.split("T")[0] &&
      dateStr <= w.effective_to?.split("T")[0]
    );
  };

  // Kya yeh din holiday hai?
  const isHolidayDate = (dateStr) => {
    return holidays.some(h => h.date === dateStr);
  };

  // Auto status decide karna
  const getAutoStatus = (dateStr, empId, existingLog) => {
    const holiday = isHolidayDate(dateStr);
    const weekoff = isEmployeeWeekoff(dateStr, empId);

    if (existingLog?.in_time) {
      // Employee aaya tha
      if (holiday) return "HOLIDAY OT";
      if (weekoff) return "WEEK OFF OT";
      return "PRESENT";
    } else {
      // Employee nahi aaya
      if (holiday) return "HOLIDAYS";
      if (weekoff) return "WEEK OFF";
      return "";
    }
  };

  // ✅ attendanceType change hone pe focus karo
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; // pehli baar mount pe skip karo
    }
    // Sirf jab user ne mode dropdown se change kiya ho
    setTimeout(() => {
      if (attendanceType === "List") listPeriodRef.current?.focusFirst();
      else if (attendanceType === "Manual") manualPeriodRef.current?.focusFirst();
      else if (attendanceType === "Biometric") bioPeriodRef.current?.focusFirst();
    }, 200);
  }, [attendanceType]);


  // ── fetch employees ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getActledList();
        setEmployees(Array.isArray(res) ? res : res?.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Existing employee fetch ke neeche ADD karo:
  useEffect(() => {
    (async () => {
      try {
        // Weekoffs fetch
        const wRes = await getWeekOff();
        setWeekoffs(wRes?.data || []);

        // Holidays fetch
        const hData = await fetchHolidays();
        setHolidays(hData || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const toggleAmPm = (timeStr) => {
    if (!timeStr || timeStr === "--:--") return timeStr;
    const [hh, mm] = timeStr.split(":");
    let h = parseInt(hh);
    if (h >= 12) h -= 12;
    else h += 12;
    return `${String(h).padStart(2, "0")}:${mm}`;
  };

  // ── Manual attendance ────────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!formData.employee_id) return;
    setAttendanceData({});
    try {
      const res = await getAttendanceList({
        filters: {
          employee_id: formData.employee_id,
          month: months.indexOf(selectedMonth) + 1,
          year: selectedYear,
        }
      });

      const leaveRes = await getApprovedLeaves({
        employee_id: formData.employee_id,
        month: months.indexOf(selectedMonth) + 1,
        year: selectedYear
      });
      const leaveMap = {};
      (leaveRes?.data || []).forEach(l => {
        const from = new Date(l.from_date);
        const to = new Date(l.to_date);
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() + 1 === months.indexOf(selectedMonth) + 1 &&
            d.getFullYear() === parseInt(selectedYear)) {
            leaveMap[d.getDate()] = l.leave_code;
          }
        }
      });

      const fmt = {};
      const mNum = months.indexOf(selectedMonth) + 1;

      // Har din ke liye loop — existing log ya auto status
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(mNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const existingLog = res?.data?.find(item => {
          const clean = item.in_time?.toString().replace("T", " ").split(".")[0];
          return clean?.split(" ")[0] === dateStr;
        });

        const autoStatus = getAutoStatus(dateStr, formData.employee_id, existingLog);

        fmt[day] = {
          log_id: existingLog?.log_id || null,
          in: existingLog?.in_time ? existingLog.in_time.substring(11, 16) : "--:--",
          out: existingLog?.out_time ? existingLog.out_time.substring(11, 16) : "--:--",
          // Existing status use karo, warna auto status
          status: existingLog?.attendance_status || leaveMap[day] || autoStatus,
          is_weekoff: isEmployeeWeekoff(dateStr, formData.employee_id),
          is_holiday: isHolidayDate(dateStr),
          is_leave: !!leaveMap[day],
        };
      }

      setAttendanceData(fmt);

      // Pehle valid (non-disabled) day ka status select focus karo
      setTimeout(() => {
        const firstValidDay = Object.entries(fmt).find(
          ([, d]) => !d.is_holiday && !d.is_weekoff
        );
        if (firstValidDay) {
          const dayNum = firstValidDay[0];
          // Calendar cell ke andar ka select dhundho by data-day attribute
          const sel = document.querySelector(`[data-day="${dayNum}"] select`);
          sel?.focus();
        }
      }, 200);

    } catch (e) { console.error(e); }
  }, [formData.employee_id, selectedMonth, selectedYear, weekoffs, holidays, daysInMonth]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  useEffect(() => {
    if (formData?.in_time) {
      const clean = formData.in_time.toString().replace("T", " ").split(".")[0];
      const [y, m] = clean.split(" ")[0].split("-");
      setSelectedMonth(months[parseInt(m, 10) - 1]);
      setSelectedYear(y);
    }
  }, [formData?.in_time]);

  useEffect(() => {
    if (formData?.punch_type) setAttendanceType(formData.punch_type);
  }, [formData?.punch_type]);

  // ── Biometric: date-wise, ALL employees with logs for that date ──────────────
  const fetchBioData = useCallback(async () => {
    setBioLoading(true);
    setBioTableData([]);
    try {
      const mIdx = months.indexOf(bioMonth) + 1;
      const res = await getAttendanceList({
        filters: {
          month: mIdx, year: bioYear, punch_type: "Biometric"
        }
      });
      const rows = (res?.data || [])
        .filter(item => {
          const d = item.in_time?.toString().replace("T", " ").split(".")[0].split(" ")[0];
          return d === bioSelectedDate;
        })
        .map(item => ({
          log_id: item.log_id,
          employee_id: item.employee_id,
          employee_name: item.employee_name || "—",
          employee_code: item.employee_code || "",
          in: item.in_time ? item.in_time.substring(11, 16) : "--:--",
          out: item.out_time ? item.out_time.substring(11, 16) : "--:--",
          status: item.attendance_status || "PRESENT"
        }));
      setBioTableData(rows);
    } catch (e) { console.error(e); }
    finally { setBioLoading(false); }
  }, [bioDay, bioMonth, bioYear, bioSelectedDate]);

  useEffect(() => {
    if (attendanceType === "Biometric") fetchBioData();
  }, [attendanceType, bioDay, bioMonth, bioYear, fetchBioData]);


  // ── List Entry ───────────────────────────────────────────────────────────────
  const fetchListEntryData = useCallback(async () => {
    if (!employees.length) return;
    setListLoading(true);
    try {
      const mIdx = months.indexOf(listMonth) + 1;
      const res = await getAttendanceList({ filters: { month: mIdx, year: listYear } });
      const logsForDate = (res?.data || []).filter(item => {
        const d = item.in_time?.toString().replace("T", " ").split(".")[0].split(" ")[0];
        return d === listEntryDate;
      });

      // ✅ YAHAN ADD KARO — leave fetch
      const leaveRes = await getApprovedLeaves({ date: listEntryDate });
      const leaveMap = {};
      (leaveRes?.data || []).forEach(l => {
        leaveMap[l.employee_id] = l.leave_code;
      });

      setListEntryData(employees.map(emp => {
        const log = logsForDate.find(l => String(l.employee_id) === String(emp.Actled_id));

        const isWO = weekoffs.some(w =>
          String(w.employee_id) === String(emp.Actled_id) &&
          w.day_of_week === getDayName(listEntryDate) &&
          listEntryDate >= w.effective_from?.split("T")[0] &&
          listEntryDate <= w.effective_to?.split("T")[0]
        );

        const isHol = holidays.some(h => h.date === listEntryDate);
        const isLeave = !!leaveMap[emp.Actled_id];

        return {
          employee_id: emp.Actled_id,
          employee_name: emp.Led_name,
          employee_code: emp.Led_code,
          employee_photo: emp.Ledimg || null,
          department: emp.department || "",
          log_id: log?.log_id || null,
          in: log?.in_time ? log.in_time.substring(11, 16) : "",
          out: log?.out_time ? log.out_time.substring(11, 16) : "",
          // ✅ YAHAN CHANGE — leaveMap add kiya
          status: log?.attendance_status || leaveMap[emp.Actled_id] || (isHol ? "HOLIDAYS" : isWO ? "WEEK OFF" : ""),
          is_weekoff: isWO,
          is_holiday: isHol,
          is_leave: isLeave,
        };
      }));
    } catch (e) { console.error(e); }
    finally { setListLoading(false); }
  }, [employees, listEntryDate, listMonth, listYear]);

  useEffect(() => {
    if (attendanceType === "List") fetchListEntryData();
  }, [attendanceType, listEntryDate, fetchListEntryData]);

  useEffect(() => {
    if (isAddMode || isEditMode) {
      isFirstMount.current = true; // ✅ reset karo taaki attendanceType effect skip kare
      setTimeout(() => { modeRef.current?.focus(); }, 200);
    }
  }, [isAddMode, isEditMode]);


  const handleListRowChange = (idx, field, value) => {
    setListEntryData(prev => {
      const u = [...prev];
      const updated = { ...u[idx], [field]: value };

      if (field === "status" && value === "ABSENT") {
        updated.in = "";
        updated.out = "";
      }

      // In ya Out fill kiya aur yeh holiday/weekoff row hai
      if ((field === "in" || field === "out")) {
        if (updated.is_holiday && (updated.in || updated.out)) {
          updated.status = "HOLIDAY OT";
        } else if (updated.is_weekoff && (updated.in || updated.out)) {
          updated.status = "WEEK OFF OT";
        }
      }

      // In/Out dono clear ho gaye to original status restore karo
      if ((field === "in" || field === "out") && !updated.in && !updated.out) {
        if (updated.is_holiday) updated.status = "HOLIDAYS";
        else if (updated.is_weekoff) updated.status = "WEEK OFF";
      }

      u[idx] = updated;
      return u;
    });
  };
  const handleBulkDelete = async () => {
    try {
      if (!selectedDeleteIds.length) {
        toast("Please select records", "info");
        return;
      }

      for (const id of selectedDeleteIds) {
        await deleteAttendance(id);
      }

      toast("Records deleted successfully", "success");

      setSelectedDeleteIds([]);
      setDeleteMode(false);

      await fetchAttendance();
      await fetchListEntryData();
      await fetchBioData();

    } catch (err) {
      console.error(err);
      toast("Delete failed", "error");
    }
  };

  const handleListSave = async () => {
    try {
      //  const toSave = listEntryData.filter(r => r.status && !r.is_leave);
      const toSave = listEntryData.filter(r => {
        if (!r.status) return false;
        if (r.is_leave) return false;
        if (r.is_holiday || r.is_weekoff) return !!(r.in && r.out);
        return true;
      });
      if (!toSave.length) { toast("No status selected for any employee", "info"); return; }
      for (const row of toSave) {
        const payload = {
          employee_id: row.employee_id, punch_type: "List",
          attendance_status: row.status,
          in_time: `${listEntryDate} ${row.in && row.in !== "" ? row.in : "00:00"}:00`,
          out_time: `${listEntryDate} ${row.out && row.out !== "" ? row.out : "00:00"}:00`,
        };

        if (row.log_id) {
          // Existing record — sirf update karo, no confirm needed
          await updateAttendance(row.log_id, payload);
        } else {
          // Naya record — check karo koi conflict to nahi
          // Excel/Biometric se conflict — frontend pe already is handled by log_id
          await saveAttendanceLog(payload);
        }
      }
      toast("List Attendance Saved Successfully", "success");
      await fetchListEntryData();
      onSave?.();
    } catch (e) { console.error(e); toast("Error saving list attendance", "error"); }
  };

  const employeeOptions = employees.map(emp => ({
    label: emp.Led_name, value: emp.Led_code, id: emp.Actled_id
  }));

  const handleEmployeeSelect = (label) => {
    const emp = employees.find(e => e.Led_name === label);
    if (emp) setFormData(prev => ({
      ...prev,
      employee_name: emp.Led_name, employee_code: emp.Led_code,
      employee_id: emp.Actled_id, designation: emp.Designation || "",
      employee_photo: emp.Ledimg || null,
    }));
  };

  const handleDataChange = (day, field, value) => {
    setAttendanceData(prev => {
      const existing = prev[day] || {};
      const updated = { ...existing, [field]: value };

      if (field === "status" && value === "ABSENT") {
        updated.in = "--:--";
        updated.out = "--:--";
      }

      // Holiday/Weekoff pe in/out fill hone par OT status set karo
      if (field === "in" || field === "out") {
        const hasTime = (updated.in && updated.in !== "--:--") ||
          (updated.out && updated.out !== "--:--");
        const noTime = (!updated.in || updated.in === "--:--") &&
          (!updated.out || updated.out === "--:--");

        if (updated.is_holiday) {
          updated.status = hasTime ? "HOLIDAY OT" : "HOLIDAYS";
        } else if (updated.is_weekoff) {
          updated.status = hasTime ? "WEEK OFF OT" : "WEEK OFF";
        }
      }

      return { ...prev, [day]: updated };
    });

    const mNum = months.indexOf(selectedMonth) + 1;
    setFormData(prev => ({
      ...prev,
      attendance_day: `${selectedYear}-${String(mNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }));
  };

  // ── status helpers ───────────────────────────────────────────────────────────
  const STATUS_STYLE = {
    "PRESENT": "bg-green-600 text-white border-green-700",
    "ABSENT": "bg-red-400 text-white border-red-700",
    "WEEK OFF": "bg-orange-400 text-white border-orange-600",
    "LEAVE": "bg-blue-400 text-white border-blue-700",
    "CASUAL LEAVE": "bg-purple-400 text-white border-purple-700",
    "HOLIDAYS": "bg-yellow-400 text-white border-yellow-600",
    "UNPAID": "bg-slate-400 text-white border-slate-700",
    "WEEK OFF OT": "bg-orange-600 text-white border-orange-700",
    "HOLIDAY OT": "bg-yellow-600 text-white border-yellow-700",
  };
  const STATUS_BADGE = {
    "PRESENT": "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "ABSENT": "bg-red-100 text-red-800 border border-red-200",
    "WEEK OFF": "bg-orange-100 text-orange-800 border border-orange-200",
    "LEAVE": "bg-blue-100 text-blue-800 border border-blue-200",
    "CASUAL LEAVE": "bg-purple-100 text-purple-800 border border-purple-200",
    "HOLIDAYS": "bg-yellow-100 text-yellow-800 border border-yellow-200",
    "UNPAID": "bg-slate-100 text-slate-700 border border-slate-200",
    "WEEK OFF OT": "bg-orange-100 text-orange-900 border border-orange-300",
    "HOLIDAY OT": "bg-yellow-100 text-yellow-900 border border-yellow-300",
    "CL": "bg-blue-100 text-blue-800 border border-blue-200",
    "SL": "bg-purple-100 text-purple-800 border border-purple-200",
    "PL": "bg-teal-100 text-teal-800 border border-teal-200",
    "EL": "bg-cyan-100 text-cyan-800 border border-cyan-200",
    "ML": "bg-pink-100 text-pink-800 border border-pink-200",
    "PTL": "bg-indigo-100 text-indigo-800 border border-indigo-200",
    "CO": "bg-lime-100 text-lime-800 border border-lime-200",
    "SCL": "bg-violet-100 text-violet-800 border border-violet-200",
  };
  const getStatusStyle = (s) => STATUS_STYLE[s] || "bg-white text-slate-700 border-slate-300";
  const getStatusBadge = (s) => STATUS_BADGE[s] || "bg-gray-100 text-gray-600 border border-gray-200";

  // ── totals ───────────────────────────────────────────────────────────────────
  const src = attendanceType === "List" ? listEntryData : Object.values(attendanceData);
  const totalPresent = src.filter(x => x.status === "PRESENT").length;
  const totalAbsent = src.filter(x => x.status === "ABSENT").length;
  const totalWeekOff = src.filter(x => x.status === "WEEK OFF").length;
  const totalLeave = src.filter(x => x.status === "LEAVE" || x.status === "CASUAL LEAVE").length;
  const totalHoliday = src.filter(x => x.status === "HOLIDAYS").length;

  // ── main save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (attendanceType === "List") { await handleListSave(); return; }

    if (attendanceType === "Excel") {
      if (!excelRows.length) { toast("No records to import", "info"); return; }
      try {
        for (const row of excelRows) {
          const payload = {
            employee_id: row.employee_id,
            punch_type: "Excel",
            attendance_status: row.status || "PRESENT",
            in_time: `${row.date} ${row.in && row.in !== "--:--" ? row.in : "00:00"}:00`,
            out_time: `${row.date} ${row.out && row.out !== "--:--" ? row.out : "00:00"}:00`,

          };
          if (row.log_id) {
            await updateAttendance(row.log_id, payload);
          } else {
            // Same employee same date pe existing record check karo
            // row.log_id null hai Excel/Bio se imported data mein
            // fetchListEntryData se log_id milta — Excel rows mein nahi hota
            // So direct insert karo, backend mein duplicate handle hoga
            const res = await saveAttendanceLog(payload);
            if (!res?.success) throw new Error(`Save failed for employee ${row.employee_id}`);
          }
        }
        toast(`${excelRows.length} records imported successfully`, "success");
        setExcelFile(null); setExcelRows([]);
        setAttendanceType("List");
        onNewEntry?.();
        onSave?.();
      } catch (e) { console.error(e); toast("Error saving Excel data: " + e.message, "error"); }
      return;
    }

    if (attendanceType === "Biometric") {
      if (!bioTableData.length) { toast("No biometric records to save", "info"); return; }
      try {
        let saved = 0;
        for (const row of bioTableData) {
          const payload = {
            employee_id: row.employee_id,
            punch_type: "Biometric",
            attendance_status: row.status || "PRESENT",
            in_time: `${bioSelectedDate} ${row.in && row.in !== "--:--" ? row.in : "00:00"}:00`,
            out_time: `${bioSelectedDate} ${row.out && row.out !== "--:--" ? row.out : "00:00"}:00`,
          };
          if (row.log_id) {
            await updateAttendance(row.log_id, payload);
          } else {
            const res = await saveAttendanceLog(payload);
            if (!res?.success) throw new Error(`Save failed for employee ${row.employee_id}`);
          }
          saved++;
        }
        toast(`${saved} biometric records saved successfully`, "success");
        await fetchBioData(); onNewEntry?.();
        onSave?.();
      } catch (e) { console.error(e); toast("Error saving Biometric data: " + e.message, "error"); }
      return;
    }

    // Manual

    try {
      if (!formData.employee_id) { toast("Please select employee", "info"); return; }
      const targetDay = parseInt(formData.attendance_day?.split("-")[2], 10);
      const dayData = attendanceData[targetDay];
      if (!dayData?.status) { toast("Please select status for the day", "info"); return; }
      if ((dayData.is_holiday || dayData.is_weekoff) &&
        (!dayData.in || dayData.in === "--:--" || !dayData.out || dayData.out === "--:--")) {
        toast("Holiday/Weekoff OT ke liye In aur Out time dono required hain", "info");
        return;
      }
      const dt = formData.attendance_day;
      const payload = {
        employee_id: formData.employee_id, punch_type: "Manual",
        attendance_status: dayData?.status || "PRESENT",
        in_time: `${dt} ${dayData?.in && dayData.in !== "--:--" ? dayData.in : "00:00"}:00`,
        out_time: `${dt} ${dayData?.out && dayData.out !== "--:--" ? dayData.out : "00:00"}:00`,
      };
      const res = dayData?.log_id
        ? await updateAttendance(dayData.log_id, payload)
        : await saveAttendanceLog(payload);
      if (res?.success) {
        toast("Attendance saved successfully", "success");
        await fetchAttendance(); onNewEntry?.();
        onSave?.();
      } else {
        toast("Save failed", "error");
      }
    } catch (e) { console.error(e); toast("Error saving: " + e.message, "error"); }
  };

  // ── Excel helpers ────────────────────────────────────────────────────────────
  const downloadSampleFile = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Date: "2026-04-01", In: "10:00", Out: "18:30", EmployeeID: "1", Status: "PRESENT" },
      { Date: "2026-04-02", In: "10:15", Out: "18:40", EmployeeID: "2", Status: "ABSENT" },
      { Date: "2026-04-03", In: "09:55", Out: "18:20", EmployeeID: "11", Status: "PRESENT" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Sample_Attendance.xlsx");
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const parsed = rows.map(row => {
          let dv = row.Date;
          if (typeof dv === "number") {
            const ed = XLSX.SSF.parse_date_code(dv);
            dv = `${ed.y}-${String(ed.m).padStart(2, "0")}-${String(ed.d).padStart(2, "0")}`;
          }
          let dateStr = "";
          try { dateStr = new Date(dv).toISOString().split("T")[0]; } catch (e) { dateStr = String(dv); }
          const fmtTime = (v) => {
            if (!v) return "--:--";
            if (typeof v === "number") {
              const s = Math.round(v * 86400);
              return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
            }
            return v.toString().slice(0, 5);
          };
          console.log("Excel row date:", row.date, row.in, row.out, row.status);
          const empId = String(row.EmployeeID || row.ID || row.employee_id || "");
          const empRec = employees.find(e => String(e.Actled_id) === empId || String(e.Led_code) === empId);

          const parsedStatus = row.Status || "PRESENT";
          return {
            log_id: null,
            employee_id: empId,
            employee_name: empRec?.Led_name || `ID: ${empId}`,
            employee_code: empRec?.Led_code || empId,
            date: dateStr,
            in: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.In),
            out: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.Out),
            status: parsedStatus,
          };
        });

        setExcelRows(parsed);
        toast(`${parsed.length} records loaded from file`, "info");
      } catch (err) { console.error("Excel parse error:", err); toast("Error reading file", "error"); }
    };
    reader.readAsArrayBuffer(file);

  };

  const parseBioFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const parsed = rows.map((row, idx) => {
          let dv = row.Date;
          if (typeof dv === "number") {
            const ed = XLSX.SSF.parse_date_code(dv);
            dv = `${ed.y}-${String(ed.m).padStart(2, "0")}-${String(ed.d).padStart(2, "0")}`;
          }
          let dateStr = "";
          try { dateStr = new Date(dv).toISOString().split("T")[0]; } catch (e) { dateStr = String(dv); }
          const fmtTime = (v) => {
            if (!v) return "--:--";
            if (typeof v === "number") {
              const s = Math.round(v * 86400);
              return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
            }
            return v.toString().slice(0, 5);
          };
          const empId = String(row.EmployeeID || row.ID || row.employee_id || "");
          const empRec = employees.find(e => String(e.Actled_id) === empId || String(e.Led_code) === empId);
          const parsedStatus = row.Status || "PRESENT";
          return {
            log_id: null,
            employee_id: empId,
            employee_name: empRec?.Led_name || `ID: ${empId}`,
            employee_code: empRec?.Led_code || empId,
            in: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.In),
            out: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.Out),
            status: parsedStatus,
          };
        });
        setBioTableData(parsed);
        toast(`${parsed.length} biometric records loaded`, "info");
      } catch (err) { console.error("Bio parse error:", err); toast("Error reading biometric file", "error"); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── style constants ──────────────────────────────────────────────────────────
  const TH = { background: "#f1f5f9", color: "#475569", borderBottom: "2px solid #cbd5e1" };
  const inputCls = "h-8 w-full text-[13px] text-center font-medium font-mono border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-slate-300 transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden";
  const selectCls = "h-8 text-[14px] border border-slate-200 rounded-md px-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelCls = "text-[14px] font-semibold text-slate-700 uppercase whitespace-nowrap tracking-wide";

  // ── outlined button style (like Sample File) ─────────────────────────────────
  const outlinedBtn = (color, hoverBg) => ({
    base: { background: "#fff", border: `1.5px solid ${color}`, color, borderRadius: 6, height: 28, padding: "0 12px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.15s", outline: "none" },
    hover: { background: hoverBg }
  });


  // ── sub-components ───────────────────────────────────────────────────────────
  const TableHeader = ({ cols, template }) => (
    <div className="grid shrink-0 text-[13px] font-semibold uppercase tracking-wide"
      style={{ gridTemplateColumns: template, ...TH }}>
      {cols.map(c => <div key={c} className="px-3 py-1.5">{c}</div>)}
    </div>
  );

  const EmptyState = ({ msg }) => (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
      <svg className="w-9 h-9 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-[12px] italic text-center px-4">{msg}</p>
    </div>
  );

  const LoadingState = ({ msg }) => (
    <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-[12px]">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {msg}
    </div>
  );

  const TableRow = ({ children, idx, template, bgOverride }) => {
    const defaultBg = idx % 2 === 0 ? "#fff" : "#f8fafc";
    const bg = bgOverride || defaultBg;
    return (
      <div className="grid items-center border-b text-[13px] min-h-[58px] transition-colors"
        style={{ gridTemplateColumns: template, background: bg, borderColor: "#e2e8f0" }}
        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
        onMouseLeave={e => e.currentTarget.style.background = bg}>
        {children}
      </div>
    );
  };

  const AvatarCell = ({ name, code, empId, photo }) => {
    const colors = getAvatarColor(empId);
    const bg = colors?.[0] || "#e2e8f0";
    const tc = colors?.[1] || "#475569";
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:63554";
    return (
      <div className="px-3 py-2 flex items-center gap-2 min-w-0">
        {photo ? (
          <img
            src={`${baseUrl}${photo}`}
            alt={name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold"
            style={{ background: bg, color: tc }}>
            {getInitials(name)}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-slate-700 truncate">{name}</div>
          <div className="text-[12px] text-slate-400">{code}</div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 rounded-full text-[11px] font-semibold ${getStatusBadge(status)}`}>      {status || "—"}
    </span>
  );



  const ImportIcon = (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
  const SampleIcon = (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );

  const FileChip = ({ file, onRemove }) => (
    <div className="flex items-center gap-1.5 rounded-md px-2 py-1 border"
      style={{ background: "#f0fdf4", borderColor: "#86efac", maxWidth: 180 }}>
      <svg width="12" height="12" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-[10px] font-medium truncate" style={{ color: "#166534", maxWidth: 110 }}>
        {file.name}
      </span>
      <button onClick={onRemove}
        className="text-[11px] hover:text-red-500 transition-colors" style={{ color: "#64748b" }}>✕</button>
    </div>
  );

  return (
    <>
      <ToastContainer />
      <div className="w-full mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-120px)] overflow-hidden"
        style={{ fontFamily: FONT }}>
        <ERPHeader
          title="DAILY ATTENDANCE MANAGEMENT"
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          activeTab={activeTab} onTabChange={onTabChange}
          rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
          currentIndex={currentRecord}      // 👈
          totalRecords={totalRecords}        // 👈
          onPrevRecord={onPrevRecord}        // 👈
          onNextRecord={onNextRecord}
        />

        <div className="flex flex-1 min-h-0" style={{ background: "#f1f5f9" }}>
          <div className="flex w-full p-2.5 gap-2.5 overflow-hidden">

            {/* ══════════ LEFT SIDEBAR ══════════ */}
            {attendanceType === "Manual" && (
              <div className="w-[164px] bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="bg-slate-800 h-14 w-full relative mb-9 shrink-0">
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    <div className="w-[66px] h-[66px] bg-white rounded-xl p-0.5 shadow-lg border">
                      {formData.employee_photo ? (
                        <img src={`${process.env.REACT_APP_API_URL || "http://localhost:63554"}${formData.employee_photo}`} alt="emp" className="w-full h-full rounded-[10px] object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-[10px] flex items-center justify-center border border-dashed border-slate-300"
                          style={{ background: getAvatarColor(formData.employee_id)?.[0] || "#f1f5f9" }}>
                          <span className="text-[15px] font-semibold"
                            style={{ color: getAvatarColor(formData.employee_id)?.[1] || "#475569" }}>
                            {formData.employee_name
                              ? getInitials(formData.employee_name)
                              : <span className="text-[9px] text-slate-400">PHOTO</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 text-center">
                  <h2 className="text-[12px] font-semibold text-slate-800 uppercase leading-tight truncate">
                    {formData.employee_name || "—"}
                  </h2>
                  <p className="text-[10px] text-blue-600 uppercase tracking-wide truncate mt-0.5">
                    {formData.designation || ""}
                  </p>
                  <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border mt-1">
                    {formData.employee_code || "ID"}
                  </span>
                </div>

                <div className="flex-1 p-2.5 overflow-y-auto mt-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ["PRESENT", totalPresent, "#f0fdf4", "#166534", "#bbf7d0"],
                      ["ABSENT", totalAbsent, "#fef2f2", "#991b1b", "#fecaca"],
                      ["WEEK OFF", totalWeekOff, "#fff7ed", "#9a3412", "#fed7aa"],
                      ["LEAVE", totalLeave, "#eff6ff", "#1e40af", "#bfdbfe"],
                    ].map(([lbl, cnt, bg, tc, bc]) => (
                      <div key={lbl} className="rounded-lg p-1.5 text-center"
                        style={{ background: bg, border: `1px solid ${bc}` }}>
                        <span className="block text-[11px] font-semibold uppercase tracking-tight" style={{ color: tc }}>{lbl}</span>
                        <span className="block text-[13px] font-bold leading-none mt-0.5" style={{ color: tc }}>{cnt}</span>
                      </div>
                    ))}
                    <div className="col-span-2 rounded-lg p-1.5 text-center"
                      style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
                      <span className="block text-[11px] font-semibold uppercase tracking-tight text-yellow-700">HOLIDAY</span>
                      <span className="block text-[13px] font-bold leading-none mt-0.5 text-yellow-700">{totalHoliday}</span>
                    </div>
                  </div>

                  {attendanceType === "Biometric" && (
                    <div className="mt-2 pt-2 border-t border-dashed space-y-1.5">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase block">Biometric Path</span>
                      <div className="flex">
                        <input type="text" value={formData.path || ""} readOnly
                          className="w-full h-6 text-[9px] border border-slate-200 rounded-l px-1.5 bg-slate-50" />
                        <button className="px-1.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r text-[10px] text-slate-500">···</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ══════════ RIGHT CONTENT ══════════ */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">

              {/* ── CONTROLS BAR ──────────────────────────────────────────── */}
              <div className="bg-white rounded-xl border shadow-sm shrink-0 px-3 py-2">
                <div className="flex items-center gap-3 flex-wrap">

                  {/* MODE */}
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                    <span className={labelCls}>Mode:</span>
                    <select ref={modeRef} value={attendanceType} disabled={isViewMode}
                      onChange={e => {
                        const newType = e.target.value;
                        setAttendanceType(newType);
                        // ✅ Direct focus — useEffect ka wait mat karo
                        setTimeout(() => {
                          if (newType === "List") listPeriodRef.current?.focusFirst();
                          else if (newType === "Manual") manualPeriodRef.current?.focusFirst();
                          else if (newType === "Biometric") bioPeriodRef.current?.focusFirst();
                        }, 250);
                      }}
                      className={selectCls} style={{ minWidth: 180, height: 36 }}>
                      {attendanceTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* PERIOD */}
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                    {attendanceType === "List" && (
                      <PeriodDropdowns
                        ref={listPeriodRef}
                        day={listDay} setDay={setListDay}
                        month={listMonth} setMonth={setListMonth}
                        year={listYear} setYear={setListYear}
                        showDay={true}
                        months={months} years={years}
                        dayOpts={listDayOptions}
                        disabled={false}
                        selectCls={selectCls} labelCls={labelCls}
                        onDayEnter={() => { }}   // Day→Month auto handle ho raha hai
                        onMonthEnter={() => { }} // Month→Year auto handle ho raha hai
                        onYearEnter={() => {
                          // Year ke baad pehle employee row ki InTime pe jao
                          setTimeout(() => listInRefs.current[0]?.focus(), 80);
                        }}
                      />
                    )}
                    {(attendanceType === "Biometric" || attendanceType === "Excel") && (
                      <PeriodDropdowns
                        ref={bioPeriodRef}
                        day={bioDay} setDay={setBioDay}
                        month={bioMonth} setMonth={setBioMonth}
                        year={bioYear} setYear={setBioYear}
                        dayOpts={bioDayOptions}
                        disabled={isViewMode}
                        months={months}
                        years={years}
                        selectCls={selectCls}
                        labelCls={labelCls}
                      />
                    )}
                    {attendanceType === "Manual" && (
                      <PeriodDropdowns
                        ref={manualPeriodRef}
                        showDay={false}
                        month={selectedMonth} setMonth={setSelectedMonth}
                        year={selectedYear} setYear={setSelectedYear}
                        months={months} years={years}
                        dayOpts={[]}
                        disabled={isViewMode}
                        selectCls={selectCls} labelCls={labelCls}
                        onYearEnter={() => {
                          setTimeout(() => {
                            // ERPAutocomplete ke andar ka input find karo
                            const empContainer = document.querySelector('[data-employee-autocomplete]');
                            const input = empContainer?.querySelector('input');
                            input?.focus();
                          }, 80);
                        }}
                      />
                    )}
                  </div>

                  {/* EMPLOYEE — Manual only */}
                  {attendanceType === "Manual" && (
                    <div data-employee-autocomplete className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                      <span className={labelCls}>Employee:</span>
                      <ERPAutocomplete
                        disabled={isViewMode}
                        options={employeeOptions.map(o => o.label)}
                        value={employeeOptions.find(e => String(e.id) === String(formData.employee_id))?.label || ""}
                        onChange={handleEmployeeSelect}
                        className={selectCls}
                      />
                    </div>
                  )}

                  {/* IMPORT BUTTONS — Bio/Excel, same line */}
                  {(attendanceType === "Biometric" || attendanceType === "Excel") && (
                    <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
                      {attendanceType === "Biometric" && (
                        <>
                          <OutlineButton
                            onClick={() => bioFileRef.current.click()}
                            color="#334155" hoverBg="#f8fafc"
                            icon={ImportIcon} label="Import Logs"
                            disabled={isViewMode}
                          />
                          <OutlineButton
                            onClick={downloadSampleFile}
                            color="#059669" hoverBg="#f0fdf4"
                            icon={SampleIcon} label="Sample File"
                          />
                          <input type="file" ref={bioFileRef} className="hidden" accept=".xlsx,.xls,.csv"
                            onChange={e => {
                              const f = e.target.files[0];
                              if (f) { setBioFile(f); parseBioFile(f); }
                              e.target.value = "";
                            }} />
                          {bioFile && (
                            <FileChip file={bioFile} onRemove={() => { setBioFile(null); setBioTableData([]); }} />
                          )}
                          <span className="text-[11px] text-slate-400">{bioTableData.length} records</span>
                        </>
                      )}
                      {attendanceType === "Excel" && (
                        <>
                          <OutlineButton
                            onClick={() => excelFileRef.current.click()}
                            color="#334155" hoverBg="#f8fafc"
                            icon={ImportIcon} label="Import Logs"
                            disabled={isViewMode}
                          />
                          <OutlineButton
                            onClick={downloadSampleFile}
                            color="#059669" hoverBg="#f0fdf4"
                            icon={SampleIcon} label="Sample File"
                          />
                          <input type="file" ref={excelFileRef} className="hidden" accept=".xlsx,.xls,.csv"
                            onChange={e => {
                              const f = e.target.files[0];
                              if (f) { setExcelFile(f); parseExcelFile(f); }
                              e.target.value = "";
                            }} />
                          {excelFile && (
                            <FileChip file={excelFile} onRemove={() => { setExcelFile(null); setExcelRows([]); }} />
                          )}
                          <span className="text-[11px] text-slate-400">{excelRows.length} records</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
              <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden min-h-0">

                {/* ════ 1. MANUAL ════ */}
                {attendanceType === "Manual" && (
                  <>
                    <div className="grid grid-cols-7 shrink-0"
                      style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d, i) => (
                        <div key={d} className="py-2.5 text-center text-[13px] font-semibold tracking-wide border-r last:border-r-0"
                          style={{ color: i === 0 ? "#ef4444" : "#64748b", borderColor: "#e2e8f0" }}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 divide-x divide-y overflow-y-auto"
                      style={{ borderColor: "#e2e8f0" }}>
                      {calendarGrid.map((_, index) => {
                        const dayNum = index - firstDayOfMonth + 1;
                        const isValid = dayNum > 0 && dayNum <= daysInMonth;
                        const isSun = index % 7 === 0;
                        const data = attendanceData?.[dayNum] ?? { in: "--:--", out: "--:--", status: "" };
                        // const dis = isViewMode || !formData.employee_id || data?.is_holiday || data?.is_weekoff || data?.is_leave;
                        const dis = isViewMode || !formData.employee_id || data?.is_leave;
                        return (
                          <div key={index} data-day={isValid ? dayNum : undefined} className="relative p-1.5 flex flex-col justify-between"
                            style={{ minHeight: 82, background: !isValid ? "#f8fafc" : data.is_holiday ? "#fefce8" : data.is_weekoff ? "#f5f4ff" : data.is_leave ? "#eff6ff" : isSun ? "#fff5f5" : "#fff" }}>
                            {isValid && (<>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-semibold"
                                  style={{ color: isSun ? "#ef4444" : "#475569" }}>
                                  {String(dayNum).padStart(2, "0")}
                                </span>
                                {deleteMode && data?.log_id && (
                                  <input
                                    type="checkbox"
                                    checked={selectedDeleteIds.includes(data.log_id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDeleteIds(prev => [...prev, data.log_id]);
                                      } else {
                                        setSelectedDeleteIds(prev =>
                                          prev.filter(id => id !== data.log_id)
                                        );
                                      }
                                    }}
                                  />
                                )}
                                {/* status select — focusable */}
                                <select
                                  tabIndex={0}
                                  disabled={dis}
                                  value={data.status}
                                  onChange={e => handleDataChange(dayNum, "status", e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === "Tab") {
                                      e.preventDefault();
                                      // Agle valid day ka select dhundho
                                      const allDays = Object.entries(attendanceData);
                                      const nextValid = allDays.find(
                                        ([d, dd]) => parseInt(d) > dayNum && !dd.is_holiday && !dd.is_weekoff
                                      );
                                      if (nextValid) {
                                        const nextSel = document.querySelector(`[data-day="${nextValid[0]}"] select`);
                                        nextSel?.focus();
                                      }
                                    }
                                  }}
                                  className={`text-[11px] font-semibold border rounded px-0.5 h-[20px] cursor-pointer appearance-none text-center focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusStyle(data.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                  style={{
                                    width: 80, opacity: (data.is_holiday || data.is_weekoff) ? 0.8 : 1,
                                    cursor: (data.is_holiday || data.is_weekoff) ? "not-allowed" : "pointer"
                                  }}>
                                  <option value="">SELECT</option>
                                  {statusOptions.map(o => (
                                    <option key={o.value} value={o.value} className="bg-white text-slate-800">{o.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-1">
                                {/* IN */}
                                <div className="flex-1">
                                  <span className="text-[12px] text-slate-600 font-semibold uppercase block">In</span>
                                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <input type="time"
                                      disabled={data.status === "ABSENT" || dis}
                                      value={data.in === "--:--" ? "" : data.in}
                                      onChange={e => handleDataChange(dayNum, "in", e.target.value || "--:--")}
                                      className="text-[12px] font-mono w-full h-5 border rounded px-0.5 border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden" />
                                    <button
                                      ref={el => { calInAmPmRefs.current[dayNum] = el; }}
                                      tabIndex={!dis && data.status !== "ABSENT" ? 0 : -1}
                                      onClick={() => {
                                        if (!data.in || data.in === "--:--" || dis || data.status === "ABSENT") return;
                                        handleDataChange(dayNum, "in", toggleAmPm(data.in));
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                          e.preventDefault();
                                          if (!data.in || data.in === "--:--" || dis || data.status === "ABSENT") return;
                                          handleDataChange(dayNum, "in", toggleAmPm(data.in));
                                          setTimeout(() => calInAmPmRefs.current[dayNum]?.focus(), 30);
                                        }
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          e.currentTarget.closest('.flex')?.parentElement
                                            ?.querySelector('input[type="time"]:last-of-type')?.focus();
                                        }
                                      }}
                                      style={{
                                        fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 3,
                                        border: "1px solid #e2e8f0", whiteSpace: "nowrap", height: 18,
                                        display: "flex", alignItems: "center",
                                        cursor: data.in && data.in !== "--:--" && !dis ? "pointer" : "default",
                                        background: data.in && data.in !== "--:--" && parseInt(data.in.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                        color: data.in && data.in !== "--:--" && parseInt(data.in.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b"
                                      }}>
                                      {data.in && data.in !== "--:--" ? (parseInt(data.in.split(":")[0]) >= 12 ? "PM" : "AM") : "--"}
                                    </button>
                                  </div>
                                </div>

                                {/* OUT */}
                                <div className="flex-1">
                                  <span className="text-[12px] text-slate-600 font-semibold uppercase block">Out</span>
                                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <input type="time"
                                      disabled={data.status === "ABSENT" || dis}
                                      value={data.out === "--:--" ? "" : data.out}
                                      onChange={e => handleDataChange(dayNum, "out", e.target.value || "--:--")}
                                      className="text-[12px] font-mono w-full h-5 border rounded px-0.5 border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden" />
                                    <button
                                      ref={el => { calOutAmPmRefs.current[dayNum] = el; }}
                                      tabIndex={!dis && data.status !== "ABSENT" ? 0 : -1}
                                      onClick={() => {
                                        if (!data.out || data.out === "--:--" || dis || data.status === "ABSENT") return;
                                        handleDataChange(dayNum, "out", toggleAmPm(data.out));
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                          e.preventDefault();
                                          if (!data.out || data.out === "--:--" || dis || data.status === "ABSENT") return;
                                          handleDataChange(dayNum, "out", toggleAmPm(data.out));
                                          setTimeout(() => calOutAmPmRefs.current[dayNum]?.focus(), 30);
                                        }
                                      }}
                                      style={{
                                        fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 3,
                                        border: "1px solid #e2e8f0", whiteSpace: "nowrap", height: 18,
                                        display: "flex", alignItems: "center",
                                        cursor: data.out && data.out !== "--:--" && !dis ? "pointer" : "default",
                                        background: data.out && data.out !== "--:--" && parseInt(data.out.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                        color: data.out && data.out !== "--:--" && parseInt(data.out.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b"
                                      }}>
                                      {data.out && data.out !== "--:--" ? (parseInt(data.out.split(":")[0]) >= 12 ? "PM" : "AM") : "--"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </>)}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ════ 2. LIST ENTRY ════ */}
                {attendanceType === "List" && (
                  <>
                    <TableHeader
                      cols={[deleteMode ? "✓" : "#", "Employee", "Code", "Department", "Date", "In Time", "Out Time", "Status"]}
                      template="40px 1fr 195px 190px 110px 110px 110px 150px"
                    />
                    <div className="flex-1 overflow-y-auto">
                      {listLoading ? <LoadingState msg="Loading employees…" />
                        : listEntryData.length === 0 ? <EmptyState msg="No employees found." />
                          : listEntryData.map((row, idx) => {
                            const [y, m, d] = listEntryDate.split("-");
                            return (
                              <TableRow key={row.employee_id} idx={idx} template="40px 1fr 220px 150px 110px 110px 110px 150px" bgOverride={row.is_holiday ? "#fefce8" : row.is_weekoff ? "#fff7ed" : row.is_leave ? "#eff6ff" : null}>
                                <div className="px-3 py-2 text-center">
                                  {deleteMode ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedDeleteIds.includes(row.log_id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedDeleteIds(prev => [...prev, row.log_id]);
                                        } else {
                                          setSelectedDeleteIds(prev =>
                                            prev.filter(id => id !== row.log_id)
                                          );
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-[11px] text-slate-400">
                                      {idx + 1}
                                    </span>
                                  )}
                                </div>
                                <AvatarCell name={row.employee_name} empId={row.employee_id} photo={row.employee_photo} />
                                <div className="px-3 py-2 text-[12px] font-mono text-indigo-700">
                                  {row.employee_code}
                                </div>
                                <div className="px-3 py-2 text-[12px] text-slate-500 truncate">
                                  {row.department || "—"}
                                </div>
                                <div className="px-3 py-2 text-[14px] font-mono text-slate-700">{d}-{m}-{y}</div>
                                {/* IN */}
                                <div className="px-2 py-2 flex items-center gap-1">
                                  <input type="time" disabled={isViewMode || row.status === "ABSENT" || row.is_leave}
                                    ref={el => { listInRefs.current[idx] = el; }}
                                    value={row.in || ""}
                                    onChange={e => {
                                      handleListRowChange(idx, "in", e.target.value);
                                      setTimeout(() => listInAmPmRefs.current[idx]?.focus(), 50);
                                    }}
                                    className={inputCls} />
                                  <button
                                    ref={el => { listInAmPmRefs.current[idx] = el; }}
                                    tabIndex={!isViewMode && row.status !== "ABSENT" ? 0 : -1}
                                    disabled={!row.in || isViewMode || row.status === "ABSENT"}
                                    onClick={() => {
                                      if (!row.in || row.status === "ABSENT" || isViewMode) return;
                                      handleListRowChange(idx, "in", toggleAmPm(row.in));
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                        e.preventDefault();
                                        if (!row.in || row.status === "ABSENT" || isViewMode) return;
                                        handleListRowChange(idx, "in", toggleAmPm(row.in));
                                        setTimeout(() => listInAmPmRefs.current[idx]?.focus(), 30);
                                      }
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        setTimeout(() => listOutRefs.current[idx]?.focus(), 50);
                                      }
                                    }}
                                    style={{
                                      background: row.in && parseInt(row.in.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                      color: row.in && parseInt(row.in.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
                                      borderColor: "#e2e8f0", whiteSpace: "nowrap", height: 24,
                                      display: "flex", alignItems: "center",
                                      cursor: row.in && !isViewMode && row.status !== "ABSENT" ? "pointer" : "default",
                                      fontSize: 10, fontWeight: 700, padding: "0 4px", borderRadius: 4, border: "1px solid #e2e8f0"
                                    }}>
                                    {row.in && parseInt(row.in.split(":")[0]) >= 12 ? "PM" : "AM"}
                                  </button>
                                </div>

                                {/* OUT */}
                                <div className="px-2 py-2 flex items-center gap-1">
                                  <input type="time" id={`out-${idx}`} disabled={isViewMode || row.status === "ABSENT" || row.is_leave}
                                    ref={el => { listOutRefs.current[idx] = el; }}
                                    value={row.out || ""}
                                    onChange={e => {
                                      handleListRowChange(idx, "out", e.target.value);
                                      setTimeout(() => listOutAmPmRefs.current[idx]?.focus(), 50);
                                    }}
                                    className={inputCls} />
                                  <button
                                    ref={el => { listOutAmPmRefs.current[idx] = el; }}
                                    tabIndex={!isViewMode && row.status !== "ABSENT" ? 0 : -1}
                                    disabled={!row.out || isViewMode || row.status === "ABSENT"}
                                    onClick={() => {
                                      if (!row.out || row.status === "ABSENT" || isViewMode) return;
                                      handleListRowChange(idx, "out", toggleAmPm(row.out));
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                        e.preventDefault();
                                        if (!row.out || row.status === "ABSENT" || isViewMode) return;
                                        handleListRowChange(idx, "out", toggleAmPm(row.out));
                                        setTimeout(() => listOutAmPmRefs.current[idx]?.focus(), 30);
                                      }
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        setTimeout(() => listStatusRefs.current[idx]?.focus(), 50);
                                      }
                                    }}
                                    style={{
                                      background: row.out && parseInt(row.out.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                      color: row.out && parseInt(row.out.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
                                      borderColor: "#e2e8f0", whiteSpace: "nowrap", height: 24,
                                      display: "flex", alignItems: "center",
                                      cursor: row.out && !isViewMode && row.status !== "ABSENT" ? "pointer" : "default",
                                      fontSize: 10, fontWeight: 700, padding: "0 4px", borderRadius: 4, border: "1px solid #e2e8f0"
                                    }}>
                                    {row.out && parseInt(row.out.split(":")[0]) >= 12 ? "PM" : "AM"}
                                  </button>
                                </div>
                                <div className="px-4 py-3">
                                  <select id={`status-${idx}`} disabled={isViewMode || row.is_holiday || row.is_weekoff || row.is_leave} tabIndex={row.is_holiday || row.is_weekoff || row.is_leave ? -1 : 0}
                                    ref={el => { listStatusRefs.current[idx] = el; }}
                                    value={row.status}
                                    onChange={e => {
                                      handleListRowChange(idx, "status", e.target.value);
                                      setTimeout(() => {
                                        const next = listInRefs.current[idx + 1];
                                        if (next) {
                                          next.focus();
                                        }
                                      }, 0);
                                    }}
                                    className={`h-7 w-full text-[12px] text-center font-semibold border rounded-md px-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed ${row.status ? getStatusBadge(row.status) : "border-slate-200 text-slate-400 bg-white"}`}>
                                    <option value="">— Select —</option>
                                    {statusOptions.map(o => (
                                      <option key={o.value} value={o.value} className="bg-white text-slate-800 font-normal">{o.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </TableRow>
                            );
                          })}
                    </div>
                  </>
                )}

                {/* ════ 3. BIOMETRIC ════ */}
                {attendanceType === "Biometric" && (
                  <>
                    <TableHeader
                      cols={["#", "Employee", "Date", "In Time", "Out Time", "Status"]}
                      template="44px 1.8fr 110px 100px 100px 140px"
                    />
                    <div className="flex-1 overflow-y-auto">
                      {bioLoading ? <LoadingState msg="Loading biometric data…" />
                        : bioTableData.length === 0
                          ? <EmptyState msg="No biometric logs for this date. Import a file to populate." />
                          : bioTableData.map((row, idx) => {
                            const [y, m, d] = bioSelectedDate.split("-");
                            return (
                              <TableRow key={row.log_id || idx} idx={idx} template="44px 1.8fr 110px 100px 100px 140px">
                                <div className="px-3 py-2 text-center text-[15px] text-slate-400">{idx + 1}</div>
                                <AvatarCell name={row.employee_name} code={row.employee_code} empId={row.employee_id} />
                                <div className="px-3 py-2 text-[15px] font-mono text-slate-600">{d}-{m}-{y}</div>
                                <div className="px-3 py-2 font-mono text-[15px] text-blue-700 text-center">{row.in}</div>
                                <div className="px-3 py-2 font-mono text-[15px] text-blue-700 text-center">{row.out}</div>
                                <div className="px-3 py-2"><StatusBadge status={row.status} /></div>
                              </TableRow>
                            );
                          })
                      }
                    </div>
                    {bioTableData.length > 0 && (
                      <div className="shrink-0 border-t px-4 py-1.5 text-[11px] text-slate-500"
                        style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
                        {bioTableData.length} record{bioTableData.length !== 1 ? "s" : ""} — {bioDay} {bioMonth} {bioYear}
                      </div>
                    )}
                  </>
                )}

                {/* ════ 4. EXCEL IMPORT ════ */}
                {attendanceType === "Excel" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {excelRows.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center" style={{ background: "#f8fafc" }}>
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm"
                          style={{ maxWidth: 380, width: "100%" }}>
                          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#eff6ff" }}>
                            <svg className="w-7 h-7" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Import Excel Attendance</h3>
                          <p className="text-[11px] text-slate-400 mb-5">Columns: Date, In, Out, EmployeeID, Status</p>

                        </div>
                      </div>
                    ) : (
                      <>
                        <TableHeader
                          cols={[deleteMode ? "✓" : "#", "Employee", "Date", "In Time", "Out Time", "Status"]}
                          template="44px 1.8fr 110px 100px 100px 140px"
                        />
                        <div className="flex-1 overflow-y-auto">
                          {excelRows.map((row, idx) => (
                            <TableRow key={idx} idx={idx} template="44px 1.8fr 110px 100px 100px 140px">
                              <div className="px-3 py-2 text-center">
                                {deleteMode ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedDeleteIds.includes(row.log_id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedDeleteIds(prev => [...prev, row.log_id]);
                                      } else {
                                        setSelectedDeleteIds(prev =>
                                          prev.filter(id => id !== row.log_id)
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-[14px] text-slate-400">
                                    {idx + 1}
                                  </span>
                                )}
                              </div>
                              <AvatarCell name={row.employee_name} code={row.employee_code} empId={row.employee_id} />
                              <div className="px-3 py-2 text-[14px] font-mono text-slate-600">
                                {(() => { try { const [y, m, d] = row.date.split("-"); return `${d}-${m}-${y}`; } catch (e) { return row.date; } })()}
                              </div>
                              <div className="px-3 py-2 font-mono text-[14px] text-blue-700">{row.in}</div>
                              <div className="px-3 py-2 font-mono text-[14px] text-blue-700">{row.out}</div>
                              <div className="px-3 py-2"><StatusBadge status={row.status} /></div>
                            </TableRow>
                          ))}
                        </div>
                        <div className="shrink-0 border-t px-4 py-1.5 text-[11px] text-slate-500"
                          style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
                          {excelRows.length} records loaded — click Save to import
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <ERPFooter
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          handleSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);

            if (onTabChange) {
              onTabChange("list");
            }
          }}
          onModify={() => onModify(formData)}
          onDelete={() => {
            if (deleteMode) {
              if (selectedDeleteIds.length) {
                handleBulkDelete();
              } else {
                setDeleteMode(false);
                toast("Delete mode closed", "info");
              }
            } else {
              setDeleteMode(true);
              toast("Select records to delete", "info");
            }
          }}
          // onPrint={() => onPrint({ ...formData, month: selectedMonth, year: selectedYear, attendanceData })}
          onNewEntry={onNewEntry}
          onEditCancel={() => {
            setDeleteMode(false);
            setSelectedDeleteIds([]);
            onEditCancel?.();
          }}
          saving={saving} canPrint={canPrint} rights={rights}
          showPrevious={false} showNext={false}
        />
      </div>
    </>
  );
};

export default AttendancePage;
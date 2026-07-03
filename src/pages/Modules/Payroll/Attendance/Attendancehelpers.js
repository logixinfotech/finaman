// ─────────────────────────────────────────────────────────────────────────────
// FILE: attendanceHelpers.js
// Pure functions, constants, small reusable UI components
// No state, no API calls — safe to import anywhere
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif";

export const todayDay   = () => String(new Date().getDate());
export const todayMonth = () => new Date().getMonth();
export const todayYear  = () => String(new Date().getFullYear());

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVT_COLORS = [
  ["#dbeafe", "#1d4ed8"], ["#dcfce7", "#15803d"], ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"], ["#ede9fe", "#6d28d9"], ["#cffafe", "#0e7490"],
  ["#fee2e2", "#b91c1c"], ["#f0fdf4", "#166534"], ["#fff7ed", "#c2410c"], ["#ecfdf5", "#065f46"],
];
export const getAvatarColor = (id) => {
  const n = parseInt(id, 10);
  return AVT_COLORS[(isNaN(n) ? 0 : n) % AVT_COLORS.length];
};
export const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
};

// ── Attendance helpers ────────────────────────────────────────────────────────
export const getDayName = (dateStr) => {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const [y, m, d] = dateStr.split("-").map(Number);
  return days[new Date(y, m - 1, d).getDay()];
};

export const isEmployeeWeekoff = (dateStr, empId, weekoffs) =>
  weekoffs.some(w =>
    String(w.employee_id) === String(empId) &&
    w.day_of_week === getDayName(dateStr) &&
    dateStr >= w.effective_from?.split("T")[0] &&
    dateStr <= w.effective_to?.split("T")[0]
  );

export const isHolidayDate = (dateStr, holidays) =>
  holidays.some(h => h.date === dateStr);

export const getAutoStatus = (dateStr, empId, existingLog, weekoffs, holidays) => {
  const holiday = isHolidayDate(dateStr, holidays);
  const weekoff = isEmployeeWeekoff(dateStr, empId, weekoffs);
  if (existingLog?.in_time) {
    if (holiday) return "HOLIDAY OT";
    if (weekoff)  return "WEEK OFF OT";
    return "PRESENT";
  } else {
    if (holiday) return "HOLIDAYS";
    if (weekoff)  return "WEEK OFF";
    return "";
  }
};

export const toggleAmPm = (timeStr) => {
  if (!timeStr || timeStr === "--:--") return timeStr;
  const [hh, mm] = timeStr.split(":");
  let h = parseInt(hh);
  if (h >= 12) h -= 12; else h += 12;
  return `${String(h).padStart(2, "0")}:${mm}`;
};

// ── Status style maps ─────────────────────────────────────────────────────────
export const STATUS_STYLE = {
  "PRESENT":    "bg-green-600 text-white border-green-700",
  "ABSENT":     "bg-red-400 text-white border-red-700",
  "WEEK OFF":   "bg-orange-400 text-white border-orange-600",
  "LEAVE":      "bg-blue-400 text-white border-blue-700",
  "CASUAL LEAVE":"bg-purple-400 text-white border-purple-700",
  "HOLIDAYS":   "bg-yellow-400 text-white border-yellow-600",
  "UNPAID":     "bg-slate-400 text-white border-slate-700",
  "WEEK OFF OT":"bg-orange-600 text-white border-orange-700",
  "HOLIDAY OT": "bg-yellow-600 text-white border-yellow-700",
};
export const STATUS_BADGE = {
  "PRESENT":    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "ABSENT":     "bg-red-100 text-red-800 border border-red-200",
  "WEEK OFF":   "bg-orange-100 text-orange-800 border border-orange-200",
  "LEAVE":      "bg-blue-100 text-blue-800 border border-blue-200",
  "CASUAL LEAVE":"bg-purple-100 text-purple-800 border border-purple-200",
  "HOLIDAYS":   "bg-yellow-100 text-yellow-800 border border-yellow-200",
  "UNPAID":     "bg-slate-100 text-slate-700 border border-slate-200",
  "WEEK OFF OT":"bg-orange-100 text-orange-900 border border-orange-300",
  "HOLIDAY OT": "bg-yellow-100 text-yellow-900 border border-yellow-300",
  "CL":  "bg-blue-100 text-blue-800 border border-blue-200",
  "SL":  "bg-purple-100 text-purple-800 border border-purple-200",
  "PL":  "bg-teal-100 text-teal-800 border border-teal-200",
  "EL":  "bg-cyan-100 text-cyan-800 border border-cyan-200",
  "ML":  "bg-pink-100 text-pink-800 border border-pink-200",
  "PTL": "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "CO":  "bg-lime-100 text-lime-800 border border-lime-200",
  "SCL": "bg-violet-100 text-violet-800 border border-violet-200",
};
export const getStatusStyle = (s) => STATUS_STYLE[s] || "bg-white text-slate-700 border-slate-300";
export const getStatusBadge = (s) => STATUS_BADGE[s] || "bg-gray-100 text-gray-600 border border-gray-200";

// ── Dropdown options ──────────────────────────────────────────────────────────
export const statusOptions = [
  { label: "PRESENT",               value: "PRESENT" },
  { label: "ABSENT",                value: "ABSENT" },
  { label: "CL - Casual Leave",     value: "CL" },
  { label: "SL - Sick Leave",       value: "SL" },
  { label: "PL - Privilege Leave",  value: "PL" },
  { label: "EL - Earn Leave",       value: "EL" },
  { label: "ML - Maternity Leave",  value: "ML" },
  { label: "PTL - Paternity Leave", value: "PTL" },
  { label: "CO - Comp-Off",         value: "CO" },
  { label: "SCL - Special Casual Leave", value: "SCL" },
  { label: "WEEK OFF",              value: "WEEK OFF" },
  { label: "WEEK OFF OT",           value: "WEEK OFF OT" },
  { label: "HOLIDAYS",              value: "HOLIDAYS" },
  { label: "HOLIDAY OT",            value: "HOLIDAY OT" },
  { label: "UNPAID",                value: "UNPAID" },
];

export const attendanceTypeOptions = [
  { label: "Month Entry",             value: "Manual" },
  { label: "Day Entry",               value: "List" },
  { label: "Biometric Integration",   value: "Biometric" },
  { label: "Excel Import",            value: "Excel" },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastFn = null;
export const toast = (msg, type = "success") => {
  if (_toastFn) _toastFn(msg, type);
  else console.log(msg);
};

export const ToastContainer = () => {
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
    error:   { bg: "#fef2f2", border: "#fca5a5", icon: "#dc2626", text: "#991b1b" },
    info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", text: "#1e40af" },
  };

  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => {
        const c = COLOR[t.type] || COLOR.info;
        return (
          <div key={t.id} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 16px rgba(0,0,0,0.10)", minWidth:260, maxWidth:360, fontFamily:FONT, animation:"slideIn 0.25s ease", pointerEvents:"auto" }}>
            {t.type === "success" && <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>}
            {t.type === "error"   && <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>}
            {t.type === "info"    && <svg width="18" height="18" fill="none" stroke={c.icon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>}
            <span style={{ fontSize:12, color:c.text, fontWeight:500 }}>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
};

// ── OutlineButton ─────────────────────────────────────────────────────────────
export const OutlineButton = ({ onClick, color, hoverBg, icon, label, disabled }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") onClick?.(); }}
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={e => { e.currentTarget.style.outline="2px solid #3b82f6"; e.currentTarget.style.outlineOffset="2px"; }}
      onBlur={e => { e.currentTarget.style.outline="none"; }}
      style={{ background: hovered && !disabled ? hoverBg : "#fff", border:`1.5px solid ${disabled?"#cbd5e1":color}`, color: disabled?"#94a3b8":color, borderRadius:6, height:28, padding:"0 12px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:6, cursor:disabled?"not-allowed":"pointer", transition:"all 0.15s", opacity:disabled?0.6:1 }}>
      {icon}{label}
    </button>
  );
};

// ── AvatarCell ────────────────────────────────────────────────────────────────
export const AvatarCell = ({ name, code, empId, photo }) => {
  const colors = getAvatarColor(empId);
  const bg = colors?.[0] || "#e2e8f0";
  const tc = colors?.[1] || "#475569";
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:63554";
  return (
    <div className="px-3 py-2 flex items-center gap-2 min-w-0">
      {photo ? (
        <img src={`${baseUrl}${photo}`} alt={name}
          className="w-7 h-7 rounded-full object-cover shrink-0"
          onError={e => { e.target.style.display = "none"; }} />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold"
          style={{ background:bg, color:tc }}>{getInitials(name)}</div>
      )}
      <div className="min-w-0">
        <div className="text-[15px] font-medium text-slate-700 truncate">{name}</div>
        <div className="text-[12px] text-slate-400">{code}</div>
      </div>
    </div>
  );
};

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 rounded-full text-[11px] font-semibold ${getStatusBadge(status)}`}>
    {status || "—"}
  </span>
);

// ── Table sub-components ──────────────────────────────────────────────────────
export const TableHeader = ({ cols, template, TH }) => (
  <div className="grid shrink-0 text-[13px] font-semibold uppercase tracking-wide"
    style={{ gridTemplateColumns:template, ...TH }}>
    {cols.map(c => <div key={c} className="px-3 py-1.5">{c}</div>)}
  </div>
);

export const TableRow = ({ children, idx, template, bgOverride }) => {
  const defaultBg = idx % 2 === 0 ? "#fff" : "#f8fafc";
  const bg = bgOverride || defaultBg;
  return (
    <div className="grid items-center border-b text-[13px] min-h-[58px] transition-colors"
      style={{ gridTemplateColumns:template, background:bg, borderColor:"#e2e8f0" }}
      onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
      onMouseLeave={e => e.currentTarget.style.background = bg}>
      {children}
    </div>
  );
};

export const EmptyState = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
    <svg className="w-9 h-9 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
    <p className="text-[12px] italic text-center px-4">{msg}</p>
  </div>
);

export const LoadingState = ({ msg }) => (
  <div className="flex items-center justify-center h-32 gap-2 text-slate-400 text-[12px]">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    {msg}
  </div>
);

export const FileChip = ({ file, onRemove }) => (
  <div className="flex items-center gap-1.5 rounded-md px-2 py-1 border"
    style={{ background:"#f0fdf4", borderColor:"#86efac", maxWidth:180 }}>
    <svg width="12" height="12" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
    </svg>
    <span className="text-[10px] font-medium truncate" style={{ color:"#166534", maxWidth:110 }}>{file.name}</span>
    <button onClick={onRemove} className="text-[11px] hover:text-red-500 transition-colors" style={{ color:"#64748b" }}>✕</button>
  </div>
);

// ── PeriodDropdowns ───────────────────────────────────────────────────────────
export const PeriodDropdowns = forwardRef(({
  day, setDay, month, setMonth, year, setYear,
  dayOpts, showDay = true, disabled = false, selectCls, labelCls, months, years,
  onDayEnter, onMonthEnter, onYearEnter
}, ref) => {
  const [openPicker, setOpenPicker] = useState(null);
  const pickerRef    = useRef(null);
  const dayBtnRef    = useRef(null);
  const monthBtnRef  = useRef(null);
  const yearBtnRef   = useRef(null);
  const [focusedDay,      setFocusedDay]      = useState(null);
  const [focusedMonthIdx, setFocusedMonthIdx] = useState(null);
  const [focusedYearVal,  setFocusedYearVal]  = useState(null);

  const monthAbbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mIdx = months.indexOf(month);
  const yr   = parseInt(year);
  const daysInMon  = new Date(yr, mIdx + 1, 0).getDate();
  const firstDay   = new Date(yr, mIdx, 1).getDay();
  const dayNames   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const currentYrNum = parseInt(year);

  useEffect(() => {
    const handleClick = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpenPicker(null); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (openPicker === "day")   setFocusedDay(parseInt(day));
    if (openPicker === "month") setFocusedMonthIdx(mIdx);
    if (openPicker === "year")  setFocusedYearVal(currentYrNum);
  }, [openPicker]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      setTimeout(() => { if (showDay) dayBtnRef.current?.focus(); else monthBtnRef.current?.focus(); }, 200);
    }
  }), [showDay]);

  const goToPrevMonth = () => { const i = months.indexOf(month); if (i > 0) setMonth(months[i-1]); else { setMonth(months[11]); setYear(String(parseInt(year)-1)); } };
  const goToNextMonth = () => { const i = months.indexOf(month); if (i < 11) setMonth(months[i+1]); else { setMonth(months[0]); setYear(String(parseInt(year)+1)); } };

  const wrapStyle  = { display:"inline-flex", alignItems:"center", gap:4, position:"relative" };
  const lblStyle   = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap", lineHeight:1, display:"inline-flex", alignItems:"center" };
  const btnStyle   = (active) => ({ height:28, minWidth:36, padding:"0 8px", border:`1px solid ${active?"#3b82f6":"#e2e8f0"}`, borderRadius:6, background:active?"#eff6ff":"#fff", color:active?"#1d4ed8":"#334155", fontSize:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", outline:"none", display:"inline-flex", alignItems:"center", gap:4, opacity:disabled?0.5:1, verticalAlign:"middle" });
  const navBtnStyle = { width:22, height:22, border:"1px solid #e2e8f0", borderRadius:5, background:"#fff", color:"#64748b", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", outline:"none", padding:0, flexShrink:0 };
  const popupStyle  = { position:"absolute", top:"calc(100% + 6px)", left:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:8, zIndex:9999, boxShadow:"0 4px 16px rgba(0,0,0,0.10)" };
  const cellStyle   = (sel, focused, isRed) => ({ width:"100%", height:26, borderRadius:5, border:"none", background:sel?"#3b82f6":focused?"#dbeafe":"transparent", color:sel?"#fff":isRed?"#ef4444":"#334155", fontSize:12, fontWeight:sel||focused?700:500, cursor:"pointer", outline:"none" });

  const handleDayKey = (e) => {
    const cur = focusedDay || parseInt(day);
    if (e.key==="ArrowRight") { e.preventDefault(); setFocusedDay(Math.min(cur+1, daysInMon)); }
    else if (e.key==="ArrowLeft")  { e.preventDefault(); setFocusedDay(Math.max(cur-1, 1)); }
    else if (e.key==="ArrowDown")  { e.preventDefault(); setFocusedDay(Math.min(cur+7, daysInMon)); }
    else if (e.key==="ArrowUp")    { e.preventDefault(); setFocusedDay(Math.max(cur-7, 1)); }
    else if (e.key==="Enter")      { e.preventDefault(); setDay(String(focusedDay||cur)); setOpenPicker(null); setTimeout(() => { monthBtnRef.current?.focus(); }, 50); }
    else if (e.key==="Escape")     { setOpenPicker(null); dayBtnRef.current?.focus(); }
  };
  const handleMonthKey = (e) => {
    const cur = focusedMonthIdx ?? mIdx;
    if (e.key==="ArrowRight") { e.preventDefault(); setFocusedMonthIdx(Math.min(cur+1,11)); }
    else if (e.key==="ArrowLeft")  { e.preventDefault(); setFocusedMonthIdx(Math.max(cur-1,0)); }
    else if (e.key==="ArrowDown")  { e.preventDefault(); setFocusedMonthIdx(Math.min(cur+3,11)); }
    else if (e.key==="ArrowUp")    { e.preventDefault(); setFocusedMonthIdx(Math.max(cur-3,0)); }
    else if (e.key==="Enter")      { e.preventDefault(); setMonth(months[focusedMonthIdx??cur]); setOpenPicker(null); setTimeout(() => { yearBtnRef.current?.focus(); }, 50); }
    else if (e.key==="Escape")     { setOpenPicker(null); monthBtnRef.current?.focus(); }
  };
  const handleYearKey = (e) => {
    const cur = focusedYearVal ?? currentYrNum;
    if (e.key==="ArrowRight") { e.preventDefault(); setFocusedYearVal(cur+1); }
    else if (e.key==="ArrowLeft")  { e.preventDefault(); setFocusedYearVal(cur-1); }
    else if (e.key==="ArrowDown")  { e.preventDefault(); setFocusedYearVal(cur+4); }
    else if (e.key==="ArrowUp")    { e.preventDefault(); setFocusedYearVal(cur-4); }
    else if (e.key==="Enter")      { e.preventDefault(); setYear(String(focusedYearVal??cur)); setOpenPicker(null); setTimeout(() => { onYearEnter?.(); }, 50); }
    else if (e.key==="Escape")     { setOpenPicker(null); yearBtnRef.current?.focus(); }
  };

  const DayPicker = () => (
    <div style={{ ...popupStyle, width:220 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={goToPrevMonth}>‹</button>
        <span style={{ fontSize:12, fontWeight:700, color:"#334155" }}>{monthAbbr[mIdx]} {year}</span>
        <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={goToNextMonth}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {dayNames.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#94a3b8", padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {Array.from({ length:firstDay }).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({ length:daysInMon },(_,i)=>i+1).map(d => {
          const sel = String(d)===String(day);
          const focused = d===(focusedDay||parseInt(day));
          const isSun = (firstDay+d-1)%7===0;
          return <button key={d} onMouseDown={e=>e.preventDefault()} onClick={()=>{ setDay(String(d)); setOpenPicker(null); setTimeout(()=>{ monthBtnRef.current?.focus(); onDayEnter?.(); },80); }} style={cellStyle(sel,focused&&!sel,isSun)}>{d}</button>;
        })}
      </div>
    </div>
  );

  const MonthPicker = () => (
    <div style={{ ...popupStyle, width:180 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={()=>setYear(String(parseInt(year)-1))}>‹</button>
        <span style={{ fontSize:12, fontWeight:700, color:"#334155" }}>{year}</span>
        <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={()=>setYear(String(parseInt(year)+1))}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
        {monthAbbr.map((m,i)=>{ const sel=mIdx===i; const focused=(focusedMonthIdx??mIdx)===i; return <button key={m} onMouseDown={e=>e.preventDefault()} onClick={()=>{ setMonth(months[i]); setOpenPicker(null); setTimeout(()=>{ yearBtnRef.current?.focus(); onMonthEnter?.(); },80); }} style={cellStyle(sel,focused&&!sel,false)}>{m}</button>; })}
      </div>
    </div>
  );

  const YearPicker = () => {
    const displayRange = Array.from({ length:12 },(_,i)=>(focusedYearVal??currentYrNum)-4+i);
    return (
      <div style={{ ...popupStyle, width:200 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={()=>setFocusedYearVal(v=>(v??currentYrNum)-12)}>‹</button>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8" }}>Select Year</span>
          <button style={navBtnStyle} onMouseDown={e=>e.preventDefault()} onClick={()=>setFocusedYearVal(v=>(v??currentYrNum)+12)}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
          {displayRange.map(y=>{ const sel=String(y)===String(year); const focused=y===(focusedYearVal??currentYrNum); return <button key={y} onMouseDown={e=>e.preventDefault()} onClick={()=>{ setYear(String(y)); setOpenPicker(null); setTimeout(()=>onYearEnter?.(),80); }} style={cellStyle(sel,focused&&!sel,false)}>{y}</button>; })}
        </div>
      </div>
    );
  };

  return (
    <div ref={pickerRef} style={{ display:"flex", alignItems:"center", gap:8, position:"relative", flexWrap:"nowrap" }}>
      {showDay && (
        <div style={wrapStyle}>
          <span style={lblStyle}>Day:</span>
          <button ref={dayBtnRef} disabled={disabled} style={btnStyle(openPicker==="day")}
            onFocus={e=>{ e.currentTarget.style.outline="2px solid #3b82f6"; e.currentTarget.style.outlineOffset="2px"; }}
            onBlur={e=>{ e.currentTarget.style.outline="none"; }}
            onKeyDown={e=>{ if (openPicker==="day") handleDayKey(e); else if (e.key===" ") { e.preventDefault(); if (!disabled) setOpenPicker("day"); } }}
            onClick={()=>!disabled&&setOpenPicker(openPicker==="day"?null:"day")}>
            {String(day).padStart(2,"0")}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {openPicker==="day" && <DayPicker/>}
        </div>
      )}
      <div style={wrapStyle}>
        <span style={lblStyle}>Month:</span>
        <button ref={monthBtnRef} disabled={disabled} style={btnStyle(openPicker==="month")}
          onFocus={e=>{ e.currentTarget.style.outline="2px solid #3b82f6"; e.currentTarget.style.outlineOffset="2px"; }}
          onBlur={e=>{ e.currentTarget.style.outline="none"; }}
          onKeyDown={e=>{ if (openPicker==="month") handleMonthKey(e); else if (e.key===" ") { e.preventDefault(); if (!disabled) setOpenPicker("month"); } }}
          onClick={()=>!disabled&&setOpenPicker(openPicker==="month"?null:"month")}>
          {monthAbbr[mIdx]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {openPicker==="month" && <MonthPicker/>}
      </div>
      <div style={wrapStyle}>
        <span style={lblStyle}>Year:</span>
        <button ref={yearBtnRef} disabled={disabled} style={btnStyle(openPicker==="year")}
          onFocus={e=>{ e.currentTarget.style.outline="2px solid #3b82f6"; e.currentTarget.style.outlineOffset="2px"; }}
          onBlur={e=>{ e.currentTarget.style.outline="none"; }}
          onKeyDown={e=>{ if (openPicker==="year") handleYearKey(e); else if (e.key===" ") { e.preventDefault(); if (!disabled) setOpenPicker("year"); } }}
          onClick={()=>!disabled&&setOpenPicker(openPicker==="year"?null:"year")}>
          {year}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        {openPicker==="year" && <YearPicker/>}
      </div>
    </div>
  );
});
export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"rgba(15,23,42,0.45)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, backdropFilter:"blur(2px)"
    }}>
      <div style={{
        background:"#fff", borderRadius:16, padding:"28px 28px 22px",
        maxWidth:420, width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,0.18)",
        fontFamily:FONT, animation:"slideIn 0.2s ease"
      }}>
        {/* Icon */}
        <div style={{
          width:44, height:44, borderRadius:12, marginBottom:14,
          background:"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center"
        }}>
          <svg width="22" height="22" fill="none" stroke="#F97316" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        {/* Title */}
        <div style={{ fontSize:15, fontWeight:700, color:"#0F172A", marginBottom:8 }}>{title}</div>
        {/* Message */}
        <div style={{ fontSize:13, color:"#64748B", lineHeight:1.6, marginBottom:22 }}>{message}</div>
        {/* Buttons */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel}
            style={{
              height:36, padding:"0 18px", borderRadius:8, fontSize:13, fontWeight:600,
              border:"1.5px solid #E2E8F0", background:"#fff", color:"#64748B",
              cursor:"pointer", transition:"all 0.15s"
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.borderColor="#CBD5E1"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#E2E8F0"; }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{
              height:36, padding:"0 20px", borderRadius:8, fontSize:13, fontWeight:600,
              border:"none", background:"#0F172A", color:"#fff",
              cursor:"pointer", transition:"all 0.15s"
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background="#1E293B"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="#0F172A"; }}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Attendancehelpers.js mein naya component add karo:
export const TimeInput = ({ value, onChange, disabled }) => {
    const [hh, mm] = (value || "--:--").split(":");
    
    const handleHH = (e) => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 2);
        if (parseInt(v) > 23) v = "23";
        onChange(`${v.padStart(2,"0")}:${mm || "00"}`);
    };
    
    const handleMM = (e) => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 2);
        if (parseInt(v) > 59) v = "59";
        onChange(`${hh || "00"}:${v.padStart(2,"0")}`);
    };
    
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <input
                type="text"
                value={hh === "--" ? "" : hh}
                onChange={handleHH}
                placeholder="HH"
                maxLength={2}
                disabled={disabled}
                style={{ width: 32, textAlign: "center", border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 4px", fontSize: 13 }}
            />
            <span style={{ fontWeight: 700, color: "#64748b" }}>:</span>
            <input
                type="text"
                value={mm === "--" ? "" : mm}
                onChange={handleMM}
                placeholder="MM"
                maxLength={2}
                disabled={disabled}
                style={{ width: 32, textAlign: "center", border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 4px", fontSize: 13 }}
            />
        </div>
    );
};
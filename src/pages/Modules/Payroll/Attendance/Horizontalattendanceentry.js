// ─────────────────────────────────────────────────────────────────────────────
// FILE: HorizontalAttendanceEntry.js
// Horizontal Day Entry — all employees as rows, dates 01-30 as columns
// Each date has 3 sub-columns: In | Out | Status
// Employee column is sticky (left-fixed on scroll)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import {
  getActledList, getAttendanceList, saveAttendanceLog,
  updateAttendance, getWeekOff, fetchHolidays, getApprovedLeaves,
} from "../../../../utils/api";
import {
  FONT, toast, ToastContainer, ConfirmModal,
  todayMonth, todayYear,
  getDayName, isEmployeeWeekoff, isHolidayDate, toggleAmPm, calculateAutoStatus,
  getStatusBadge, statusOptions, attendanceTypeOptions,
  PeriodDropdowns,
} from "./Attendancehelpers";
import config from "../../../../config";

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEARS = ["2024", "2025", "2026", "2027", "2028"];

// Status display config
const STATUS_CONFIG = {
  "PRESENT": { label: "P", bg: "#EAF3DE", bc: "#C0DD97", tc: "#3B6D11" },
  "L1": { label: "L1", bg: "#FEF3C7", bc: "#FCD34D", tc: "#92400E" },
  "L2": { label: "L2", bg: "#EEF2FF", bc: "#C7D2FE", tc: "#3730A3" },
  "HALF_DAY": { label: "HD", bg: "#FEF9C3", bc: "#FDE047", tc: "#854D0E" },
  "ABSENT": { label: "A", bg: "#FCEBEB", bc: "#F7C1C1", tc: "#A32D2D" },
  "WFH": { label: "H", bg: "#E0F2FE", bc: "#7DD3FC", tc: "#0369A1" },
  "WFS": { label: "d", bg: "#CCFBF1", bc: "#5EEAD4", tc: "#0F766E" },
  "CL": { label: "CL", bg: "#E1F5EE", bc: "#9FE1CB", tc: "#085041" },
  "SL": { label: "SL", bg: "#E1F5EE", bc: "#9FE1CB", tc: "#085041" },
  "PL": { label: "PL", bg: "#E1F5EE", bc: "#9FE1CB", tc: "#085041" },
  "EL": { label: "EL", bg: "#E1F5EE", bc: "#9FE1CB", tc: "#085041" },
  "ML": { label: "ML", bg: "#FBEAF0", bc: "#F4C0D1", tc: "#993556" },
  "PTL": { label: "PTL", bg: "#FBEAF0", bc: "#F4C0D1", tc: "#993556" },
  "CO": { label: "CO", bg: "#EAF3DE", bc: "#C0DD97", tc: "#3B6D11" },
  "SCL": { label: "SCL", bg: "#EEEDFE", bc: "#AFA9EC", tc: "#534AB7" },
  "WEEK OFF": { label: "WO", bg: "#FAEEDA", bc: "#FAC775", tc: "#854F0B" },
  "WEEK OFF OT": { label: "WOT", bg: "#FAEEDA", bc: "#EF9F27", tc: "#633806" },
  "HOLIDAYS": { label: "H", bg: "#FAEEDA", bc: "#FAC775", tc: "#633806" },
  "HOLIDAY OT": { label: "HOT", bg: "#FAEEDA", bc: "#EF9F27", tc: "#412402" },
  "UNPAID": { label: "U", bg: "#F1EFE8", bc: "#D3D1C7", tc: "#5F5E5A" },
};

// Avatar colors
const AVT_COLORS = [
  ["#dbeafe", "#1d4ed8"], ["#dcfce7", "#15803d"], ["#fef3c7", "#b45309"],
  ["#fce7f3", "#be185d"], ["#ede9fe", "#6d28d9"], ["#cffafe", "#0e7490"],
  ["#fee2e2", "#b91c1c"], ["#f0fdf4", "#166534"], ["#fff7ed", "#c2410c"],
];
const getAvtColor = (id) => AVT_COLORS[(parseInt(id, 10) || 0) % AVT_COLORS.length];
const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
};

// ── Main Component ────────────────────────────────────────────────────────────
const HorizontalAttendanceEntry = ({
  mode = "add",
  onTabChange,
  activeTab = "entry",
  currentRecord, totalRecords,
  onNewEntry, onEditCancel, onModify, onDelete,
  saving, canPrint, rights,
  setShowForm,
}) => {
  const isViewMode = mode === "view";

  // ── Period state ────────────────────────────────────────────────────────────
  const [listMonth, setListMonth] = useState(MONTHS[todayMonth()]);
  const [listYear, setListYear] = useState(todayYear());
  const listPeriodRef = useRef(null);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [weekoffs, setWeekoffs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [tableData, setTableData] = useState({});  // { empId: { day: { in, out, status, log_id, is_leave, is_weekoff, is_holiday } } }
  const [loading, setLoading] = useState(false);
  const [saving2, setSaving2] = useState(false);

  // ── Confirm modal ───────────────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const showConfirm = (title, message) =>
    new Promise(resolve =>
      setConfirmModal({
        isOpen: true, title, message,
        onConfirm: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(true); },
        onCancel: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(false); },
      })
    );

  // ── Derived ─────────────────────────────────────────────────────────────────
  const monthIndex = MONTHS.indexOf(listMonth);
  const yearNum = parseInt(listYear);
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();

  const entryDateStr = (day) =>
    `${listYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // ── Fetch master data ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [empRes, woRes, hRes] = await Promise.all([
          getActledList(), getWeekOff(), fetchHolidays(),
        ]);
        setEmployees(Array.isArray(empRes) ? empRes : empRes?.data || []);
        setWeekoffs(woRes?.data || []);
        setHolidays(hRes || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Build table data ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!employees.length) return;
    setLoading(true);
    try {
      // Fetch attendance logs for this month
      const res = await getAttendanceList({
        filters: { month: monthIndex + 1, year: listYear }
      });
      const logs = res?.data || [];

      // Fetch all approved leaves for this month
      const leaveRes = await getApprovedLeaves({ month: monthIndex + 1, year: listYear });
      const leaveData = leaveRes?.data || [];

      const newTable = {};

      employees.forEach(emp => {
        const empId = emp.Actled_id;
        newTable[empId] = {};

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = entryDateStr(day);

          // Find existing log for this employee on this date
          const log = logs.find(l => {
            const logDate = l.in_time?.toString().replace("T", " ").split(".")[0].split(" ")[0];
            return String(l.employee_id) === String(empId) && logDate === dateStr;
          });

          // Check leave
          const leaveOnDay = leaveData.find(l => {
            if (String(l.employee_id) !== String(empId)) return false;
            const from = new Date(l.from_date);
            const to = new Date(l.to_date);
            const cur = new Date(dateStr);
            return cur >= from && cur <= to;
          });

          const isWO = isEmployeeWeekoff(dateStr, empId, weekoffs);
          const isHol = isHolidayDate(dateStr, holidays);
          const isLeave = !!leaveOnDay;

          let inVal = log?.in_time ? log.in_time.substring(11, 16) : "";
          let outVal = log?.out_time ? log.out_time.substring(11, 16) : "";
          const hasRealPunch = (inVal && inVal !== "--:--" && inVal !== "00:00") ||
                               (outVal && outVal !== "--:--" && outVal !== "00:00");
          if (!hasRealPunch) {
            inVal = "";
            outVal = "";
          }

          let status = "";
          if (isLeave) {
            status = leaveOnDay.leave_code || "CL";
          } else if (isHol) {
            status = hasRealPunch ? "HOLIDAY OT" : "HOLIDAYS";
          } else if (isWO) {
            status = hasRealPunch ? "WEEKOFF OT" : "WEEK OFF";
          } else if (hasRealPunch) {
            status = calculateAutoStatus({ inTime: inVal, outTime: outVal }) || log?.attendance_status || "PRESENT";
          } else if (log) {
            status = log.attendance_status === "PRESENT" ? "ABSENT" : (log.attendance_status || "ABSENT");
          } else {
            status = "";
          }

          newTable[empId][day] = {
            log_id: log?.log_id || null,
            in: inVal,
            out: outVal,
            status,
            is_leave: isLeave,
            is_weekoff: isWO,
            is_holiday: isHol,
          };
        }
      });

      setTableData(newTable);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [employees, listMonth, listYear, weekoffs, holidays, daysInMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Cell change handlers ────────────────────────────────────────────────────
  const handleCellChange = (empId, day, field, value) => {
    if (isViewMode) return;
    setTableData(prev => {
      const empData = { ...(prev[empId] || {}) };
      const cell = { ...(empData[day] || {}) };

      cell[field] = value;

      // Auto status when in/out is edited
      if (field === "in" || field === "out") {
        const auto = calculateAutoStatus({
          inTime: cell.in,
          outTime: cell.out,
          isHoliday: cell.is_holiday,
          isWeekoff: cell.is_weekoff,
          isLeave: cell.is_leave,
        });
        if (auto) cell.status = auto;
      }

      // Clear times when ABSENT
      if (field === "status" && value === "ABSENT") {
        cell.in = "";
        cell.out = "";
      }

      empData[day] = cell;
      return { ...prev, [empId]: empData };
    });
  };

  // ── Status cycle on click ───────────────────────────────────────────────────
  const STATUS_CYCLE = ["PRESENT", "L1", "L2", "HALF_DAY", "ABSENT", "WFH", "WFS", "CL", "SL", "WEEK OFF", "HOLIDAYS", ""];
  const cycleStatus = (empId, day) => {
    if (isViewMode) return;
    const cell = tableData[empId]?.[day];
    if (!cell) return;
    // Locked — leave rows not editable
    if (cell.is_leave) return;
    const cur = cell.status || "";
    const idx = STATUS_CYCLE.indexOf(cur);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    handleCellChange(empId, day, "status", next);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving2(true);
    try {
      let saved = 0, skipped = 0;

      for (const emp of employees) {
        const empId = emp.Actled_id;
        const empRow = tableData[empId] || {};

        for (let day = 1; day <= daysInMonth; day++) {
          const cell = empRow[day];
          if (!cell) continue;

          // Skip leave rows — sourced from leave_request, not saved to attendance_logs
          if (cell.is_leave) { skipped++; continue; }

          // Skip holiday/weekoff with no in/out
          if ((cell.is_holiday || cell.is_weekoff) && !cell.in && !cell.out) {
            skipped++; continue;
          }

          // Skip empty status
          if (!cell.status) { skipped++; continue; }

          const dateStr = entryDateStr(day);
          const payload = {
            employee_id: empId,
            punch_type: "List",
            attendance_status: cell.status,
            in_time: `${dateStr} ${cell.in || "00:00"}:00`,
            out_time: `${dateStr} ${cell.out || "00:00"}:00`,
          };

          if (cell.log_id) {
            await updateAttendance(cell.log_id, payload);
          } else {
            await saveAttendanceLog(payload);
          }
          saved++;
        }
      }

      toast(`Saved ${saved} records${skipped > 0 ? ` (${skipped} skipped)` : ""}`, "success");
      await loadData();
    } catch (e) {
      console.error(e);
      toast("Save failed: " + e.message, "error");
    } finally {
      setSaving2(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const TimeInput = ({ empId, day, field, value, disabled }) => (
    <input
      type="time"
      disabled={disabled}
      value={value || ""}
      onChange={e => handleCellChange(empId, day, field, e.target.value)}
      style={{
        width: 54, height: 20, fontSize: 9, fontFamily: "monospace",
        border: "0.5px solid #e2e8f0", borderRadius: 3, padding: "0 2px",
        background: disabled ? "#f8fafc" : (value ? "#eff6ff" : "#fff"),
        color: disabled ? "#94a3b8" : (value ? "#1d4ed8" : "#94a3b8"),
        textAlign: "center", outline: "none",
        WebkitAppearance: "none",
      }}
    />
  );

  const StatusBadge = ({ empId, day, status, disabled }) => {
    const cfg = STATUS_CONFIG[status];
    return (
      <div
        onClick={() => !disabled && cycleStatus(empId, day)}
        title={disabled ? status : `Click to change (${status || "—"})`}
        style={{
          width: 30, height: 20, display: "flex", alignItems: "center",
          justifyContent: "center", borderRadius: 3, cursor: disabled ? "default" : "pointer",
          border: `0.5px solid ${cfg?.bc || "#e2e8f0"}`,
          background: cfg?.bg || "#f8fafc",
          color: cfg?.tc || "#94a3b8",
          fontSize: 8, fontWeight: 600, whiteSpace: "nowrap",
          userSelect: "none",
        }}>
        {cfg?.label || "—"}
      </div>
    );
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const selectCls = "h-8 text-[14px] border border-slate-200 rounded-md px-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors";
  const labelCls = "text-[14px] font-semibold text-slate-700 uppercase whitespace-nowrap tracking-wide";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />

      <div
        style={{
          fontFamily: FONT, display: "flex", flexDirection: "column",
          height: "calc(100vh - 120px)", background: "#fff",
          borderRadius: 12, border: "1px solid #E8EAED",
          boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden"
        }}>

        <ERPHeader
          title="DAILY ATTENDANCE — HORIZONTAL VIEW"
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          activeTab={activeTab} onTabChange={onTabChange}
          rightContent={`${employees.length} Employees · ${daysInMonth} Days`}
        />

        {/* ── Controls Bar ── */}
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid #E8EAED",
          background: "#fff", display: "flex", alignItems: "center", gap: 16, flexShrink: 0
        }}>
          <span className={labelCls} style={{ fontSize: 12 }}>Period:</span>
          <PeriodDropdowns
            ref={listPeriodRef}
            showDay={false}
            month={listMonth} setMonth={setListMonth}
            year={listYear} setYear={setListYear}
            months={MONTHS} years={YEARS} dayOpts={[]}
            disabled={false}
            selectCls={selectCls} labelCls={labelCls}
          />

          {/* Legend */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[
              ["#EAF3DE", "#C0DD97", "#3B6D11", "P = Present"],
              ["#FEF3C7", "#FCD34D", "#92400E", "L1 = Late 1"],
              ["#EEF2FF", "#C7D2FE", "#3730A3", "L2 = Late 2"],
              ["#FEF9C3", "#FDE047", "#854D0E", "HD = Half Day"],
              ["#FCEBEB", "#F7C1C1", "#A32D2D", "A = Absent"],
              ["#E1F5EE", "#9FE1CB", "#085041", "CL/SL = Leave"],
              ["#FAEEDA", "#FAC775", "#854F0B", "WO = Week Off"],
              ["#eff6ff", "#b5d4f4", "#185FA5", "Click badge to cycle"],
            ].map(([bg, bc, tc, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `0.5px solid ${bc}` }} />
                <span style={{ fontSize: 9, color: "#64748b" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", color: "#94a3b8", fontSize: 13
            }}>
              Loading attendance data...
            </div>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", fontSize: 11 }}>

              {/* ── THEAD — Row 1: Employee + Date numbers ── */}
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>

                  {/* Sticky employee header */}
                  <th style={{
                    position: "sticky", left: 0, zIndex: 11,
                    background: "#f8fafc", padding: "6px 10px",
                    borderRight: "2px solid #e2e8f0", minWidth: 140, width: 140,
                    textAlign: "left", fontSize: 10, fontWeight: 700,
                    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Employee
                  </th>

                  {/* Date columns */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dow = new Date(yearNum, monthIndex, day).getDay();
                    const isSun = dow === 0;
                    const isSat = dow === 6;
                    const isToday = day === new Date().getDate() &&
                      monthIndex === new Date().getMonth() &&
                      yearNum === new Date().getFullYear();
                    return (
                      <th key={day} colSpan={3} style={{
                        padding: "5px 4px 3px",
                        textAlign: "center",
                        borderRight: "1px solid #e2e8f0",
                        minWidth: 102, width: 102,
                        background: isToday ? "#EFF6FF" : isSun ? "#fff5f5" : "#f8fafc",
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: isToday ? "#1d4ed8" : isSun ? "#ef4444" : "#334155",
                          display: "block", lineHeight: 1.2,
                        }}>
                          {String(day).padStart(2, "0")}
                        </span>
                        <span style={{
                          fontSize: 9,
                          color: isSun ? "#fca5a5" : "#94a3b8",
                          display: "block",
                        }}>
                          {DAYS_SHORT[dow]}
                        </span>
                      </th>
                    );
                  })}
                </tr>

                {/* ── Row 2: Sub-headers In | Out | St ── */}
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{
                    position: "sticky", left: 0, zIndex: 11,
                    background: "#f1f5f9", borderRight: "2px solid #e2e8f0",
                    minWidth: 140, width: 140,
                  }} />
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dow = new Date(yearNum, monthIndex, day).getDay();
                    const isSun = dow === 0;
                    return (
                      <React.Fragment key={day}>
                        {["In", "Out", "St"].map((lbl, li) => (
                          <th key={lbl} style={{
                            padding: "8px 3px",
                            fontSize: 12, fontWeight: 600, color: "#94a3b8",
                            textTransform: "uppercase",
                            textAlign: "center", width: 34,
                            borderRight: li === 2 ? "1px solid #e2e8f0" : "0.5px solid #f1f5f9",
                            background: isSun ? "#fff5f5" : "#f1f5f9",
                          }}>
                            {lbl}
                          </th>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              {/* ── TBODY ── */}
              <tbody>
                {employees.map((emp, rowIdx) => {
                  const empId = emp.Actled_id;
                  const [avtBg, avtTc] = getAvtColor(empId);
                  const empRow = tableData[empId] || {};
                  const rowBg = rowIdx % 2 === 0 ? "#fff" : "#fafbfc";

                  return (
                    <tr key={empId} style={{
                      borderBottom: "0.5px solid #f1f5f9",
                      background: rowBg,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      {/* Sticky employee cell */}
                      <td style={{
                        position: "sticky", left: 0, zIndex: 1,
                        background: rowBg, padding: "5px 8px",
                        borderRight: "2px solid #e2e8f0",
                        minWidth: 140, width: 140,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {emp.Ledimg ? (
                            <img
                              src={`${config.apiUrl}${emp.Ledimg}`}
                              alt={emp.Led_name}
                              style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                              onError={e => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div style={{
                              width: 26, height: 26, borderRadius: "50%",
                              background: avtBg, color: avtTc,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 700, flexShrink: 0,
                            }}>
                              {getInitials(emp.Led_name)}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: "#1e293b",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: 96
                            }}>
                              {emp.Led_name}
                            </div>
                            <div style={{ fontSize: 9, color: "#94a3b8" }}>{emp.Led_code}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date cells */}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const cell = empRow[day] || {};
                        const dateStr = entryDateStr(day);
                        const dow = new Date(yearNum, monthIndex, day).getDay();
                        const isSun = dow === 0;
                        const disabled = isViewMode || cell.is_leave;
                        const cellBg = cell.is_leave ? "#f0fdf4"
                          : cell.is_holiday ? "#fffbeb"
                            : cell.is_weekoff ? "#fff7ed"
                              : isSun ? "#fff5f5"
                                : "transparent";

                        return (
                          <React.Fragment key={day}>
                            {/* IN */}
                            <td style={{
                              padding: "4px 2px", textAlign: "center",
                              borderRight: "0.5px solid #f1f5f9",
                              background: cellBg, width: 34,
                            }}>
                              <TimeInput
                                empId={empId} day={day} field="in"
                                value={cell.in}
                                disabled={disabled || cell.status === "ABSENT"}
                              />
                            </td>

                            {/* OUT */}
                            <td style={{
                              padding: "4px 2px", textAlign: "center",
                              borderRight: "0.5px solid #f1f5f9",
                              background: cellBg, width: 34,
                            }}>
                              <TimeInput
                                empId={empId} day={day} field="out"
                                value={cell.out}
                                disabled={disabled || cell.status === "ABSENT"}
                              />
                            </td>

                            {/* STATUS */}
                            <td style={{
                              padding: "4px 2px", textAlign: "center",
                              borderRight: "1px solid #e2e8f0",
                              background: cellBg, width: 34,
                            }}>
                              {/* Status dropdown — click cycles, or select from dropdown */}
                              <div style={{ position: "relative" }}>
                                <select
                                  disabled={disabled}
                                  value={cell.status || ""}
                                  onChange={e => handleCellChange(empId, day, "status", e.target.value)}
                                  style={{
                                    width: 32, height: 20, fontSize: 7, fontWeight: 600,
                                    border: `0.5px solid ${STATUS_CONFIG[cell.status]?.bc || "#e2e8f0"}`,
                                    borderRadius: 3, padding: "0 1px",
                                    background: STATUS_CONFIG[cell.status]?.bg || "#f8fafc",
                                    color: STATUS_CONFIG[cell.status]?.tc || "#94a3b8",
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    outline: "none", appearance: "none",
                                    textAlign: "center",
                                    opacity: disabled ? 0.7 : 1,
                                  }}
                                  title={cell.status || "Select status"}>
                                  <option value="">—</option>
                                  {statusOptions.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan={daysInMonth * 3 + 1}
                      style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>

              {/* ── TFOOT — Totals ── */}
              {employees.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      background: "#f8fafc", padding: "5px 10px",
                      borderRight: "2px solid #e2e8f0",
                      fontSize: 10, fontWeight: 700, color: "#64748b",
                    }}>
                      Summary
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      // Count present for this day across all employees
                      const presentCount = employees.filter(emp => {
                        const cell = tableData[emp.Actled_id]?.[day];
                        return ["PRESENT", "L1", "L2", "HALF_DAY"].includes(cell?.status);
                      }).length;
                      const absentCount = employees.filter(emp => {
                        const cell = tableData[emp.Actled_id]?.[day];
                        return cell?.status === "ABSENT";
                      }).length;

                      return (
                        <td key={day} colSpan={3} style={{
                          padding: "4px 2px", textAlign: "center",
                          borderRight: "1px solid #e2e8f0",
                          fontSize: 8,
                        }}>
                          {presentCount > 0 && (
                            <span style={{ color: "#3B6D11", fontWeight: 700, display: "block" }}>
                              {presentCount}P
                            </span>
                          )}
                          {absentCount > 0 && (
                            <span style={{ color: "#A32D2D", fontWeight: 700, display: "block" }}>
                              {absentCount}A
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <ERPFooter
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          handleSubmit={handleSave}
          onCancel={() => setShowForm?.(false)}
          onModify={onModify}
          onNewEntry={onNewEntry}
          onEditCancel={onEditCancel}
          saving={saving2}
          canPrint={canPrint}
          rights={rights}
          showPrevious={false} showNext={false}
        />
      </div>
    </>
  );
};

export default HorizontalAttendanceEntry;
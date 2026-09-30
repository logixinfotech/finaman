// ─────────────────────────────────────────────────────────────────────────────
// FILE: DailyAttendanceEntry.js
// Manual (Month Entry calendar) + List (Day Entry table) modes
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import {
  saveAttendanceLog, getActledList, updateAttendance,
  getAttendanceList, deleteAttendance, getWeekOff, fetchHolidays, getApprovedLeaves,
  getLeaveTypes,
} from "../../../../utils/api";

import {
  FONT, toast, ToastContainer, ConfirmModal,
  todayDay, todayMonth, todayYear,
  getAvatarColor, getInitials,
  getDayName, isEmployeeWeekoff, isHolidayDate, getAutoStatus, calculateAutoStatus, toggleAmPm,
  getStatusStyle, getStatusBadge, statusOptions, attendanceTypeOptions, buildStatusOptions,
  OutlineButton, AvatarCell, StatusBadge,
  TableHeader, TableRow, EmptyState, LoadingState, FileChip,
  PeriodDropdowns,
} from "./Attendancehelpers";

import AttendanceImports from "./Attendanceimports";
import HorizontalAttendanceEntry from "./Horizontalattendanceentry";
import config from "../../../../config";

const TH = { background: "#f1f5f9", color: "#475569", borderBottom: "2px solid #cbd5e1" };

const AttendancePage = ({
  formData, setFormData, setShowForm, onSave,
  activeTab = "entry", onTabChange,
  currentRecord, totalRecords,
  mode = "view",
  onModify, onDelete, onPrint, onNewEntry, onEditCancel, initialData = {},
  saving, canPrint, rights
}) => {
  // ── Mode refs ───────────────────────────────────────────────────────────────
  const modeRef = useRef(null);
  const listPeriodRef = useRef(null);
  const manualPeriodRef = useRef(null);
  const bioPeriodRef = useRef(null);
  const isFirstMount = useRef(true);

  // ── In/Out refs for List Entry keyboard nav ─────────────────────────────────
  const listInRefs = useRef([]);
  const listInAmPmRefs = useRef([]);
  const listOutRefs = useRef([]);
  const listOutAmPmRefs = useRef([]);
  const listStatusRefs = useRef([]);

  // ── Calendar AM/PM refs ─────────────────────────────────────────────────────
  const calInAmPmRefs = useRef({});
  const calOutAmPmRefs = useRef({});

  // ── Base state ──────────────────────────────────────────────────────────────
  const [attendanceType, setAttendanceType] = useState("List");
  const [employees, setEmployees] = useState([]);
  const [weekoffs, setWeekoffs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: "", message: "", onConfirm: null
  });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [bioTableData, setBioTableData] = useState([]);
  const [bioLoading, setBioLoading] = useState(false);
  const [excelRows, setExcelRows] = useState([]);

  // ── Period state ─────────────────────────────────────────────────────────────
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

  // ── Derived state ────────────────────────────────────────────────────────────
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const statusOpts = buildStatusOptions(leaveTypes);
  const leaveCodes = leaveTypes.map(l => l.leave_code);

  const [attendanceData, setAttendanceData] = useState({});
  const [listEntryData, setListEntryData] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // ── Derived dates ─────────────────────────────────────────────────────────────
  const listEntryDate = (() => {
    const mIdx = months.indexOf(listMonth) + 1;
    return `${listYear}-${String(mIdx).padStart(2, "0")}-${String(listDay).padStart(2, "0")}`;
  })();

  const bioSelectedDate = (() => {
    const mIdx = months.indexOf(bioMonth) + 1;
    return `${bioYear}-${String(mIdx).padStart(2, "0")}-${String(bioDay).padStart(2, "0")}`;
  })();

  // ── Calendar helpers ──────────────────────────────────────────────────────────
  const monthIndex = months.indexOf(selectedMonth);
  const yearNum = parseInt(selectedYear);
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(yearNum, monthIndex, 1).getDay();
  const calendarGrid = Array.from({ length: Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7 });

  const listDayOptions = Array.from(
    { length: new Date(parseInt(listYear), months.indexOf(listMonth) + 1, 0).getDate() },
    (_, i) => i + 1
  );

  // ── Focus on mode change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    setTimeout(() => {
      if (attendanceType === "List") listPeriodRef.current?.focusFirst();
      else if (attendanceType === "Manual") manualPeriodRef.current?.focusFirst();
      else if (attendanceType === "Biometric") bioPeriodRef.current?.focusFirst();
    }, 200);
  }, [attendanceType]);

  // ── Fetch employees ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getActledList();
        setEmployees(Array.isArray(res) ? res : res?.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLeaveTypes();
        setLeaveTypes(res?.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Fetch weekoffs + holidays ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const wRes = await getWeekOff();
        setWeekoffs(wRes?.data || []);
        const hData = await fetchHolidays();
        setHolidays(hData || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Manual attendance (Calendar mode) ─────────────────────────────────────────
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

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(mNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const existingLog = res?.data?.find(item => {
          const clean = item.in_time?.toString().replace("T", " ").split(".")[0];
          return clean?.split(" ")[0] === dateStr;
        });

        let rawIn = existingLog?.in_time ? existingLog.in_time.substring(11, 16) : "--:--";
        let rawOut = existingLog?.out_time ? existingLog.out_time.substring(11, 16) : "--:--";
        const hasRealPunch = (rawIn && rawIn !== "--:--" && rawIn !== "00:00") ||
          (rawOut && rawOut !== "--:--" && rawOut !== "00:00");

        if (!hasRealPunch) {
          rawIn = "--:--";
          rawOut = "--:--";
        }

        const isWO = isEmployeeWeekoff(dateStr, formData.employee_id, weekoffs);
        const isHol = isHolidayDate(dateStr, holidays);
        const isLeave = !!leaveMap[day];

        let status = leaveMap[day] || "";
        if (!status) {
          if (isHol) {
            status = hasRealPunch ? "HOLIDAY OT" : "HOLIDAYS";
          } else if (isWO) {
            status = hasRealPunch ? "WEEKOFF OT" : "WEEK OFF";
          } else if (hasRealPunch) {
            status = calculateAutoStatus({ inTime: rawIn, outTime: rawOut }) || existingLog?.attendance_status || "PRESENT";
          } else if (existingLog) {
            status = existingLog.attendance_status === "PRESENT" ? "ABSENT" : (existingLog.attendance_status || "ABSENT");
          } else {
            status = "";
          }
        }

        fmt[day] = {
          log_id: existingLog?.log_id || null,
          in: rawIn,
          out: rawOut,
          status,
          is_weekoff: isWO,
          is_holiday: isHol,
          is_leave: isLeave,
        };
      }

      setAttendanceData(fmt);

      setTimeout(() => {
        const firstValidDay = Object.entries(fmt).find(
          ([, d]) => !d.is_holiday && !d.is_weekoff
        );
        if (firstValidDay) {
          const dayNum = firstValidDay[0];
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
        .map(item => {
          let rawIn = item.in_time ? item.in_time.substring(11, 16) : "--:--";
          let rawOut = item.out_time ? item.out_time.substring(11, 16) : "--:--";
          const hasRealPunch = (rawIn && rawIn !== "--:--" && rawIn !== "00:00") ||
            (rawOut && rawOut !== "--:--" && rawOut !== "00:00");
          if (!hasRealPunch) {
            rawIn = "--:--";
            rawOut = "--:--";
          }
          const status = hasRealPunch
            ? (item.attendance_status || "PRESENT")
            : (item.attendance_status === "PRESENT" ? "ABSENT" : (item.attendance_status || "ABSENT"));

          return {
            log_id: item.log_id,
            employee_id: item.employee_id,
            employee_name: item.employee_name || "—",
            employee_code: item.employee_code || "",
            in: rawIn,
            out: rawOut,
            status
          };
        });
      setBioTableData(rows);
    } catch (e) { console.error(e); }
    finally { setBioLoading(false); }
  }, [bioDay, bioMonth, bioYear, bioSelectedDate]);

  useEffect(() => {
    if (attendanceType === "Biometric") fetchBioData();
  }, [attendanceType, bioDay, bioMonth, bioYear, fetchBioData]);

  // ── List Entry (Day Entry mode) ─────────────────────────────────────────────
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

      const leaveRes = await getApprovedLeaves({ date: listEntryDate });
      const leaveMap = {};
      (leaveRes?.data || []).forEach(l => { leaveMap[l.employee_id] = l.leave_code; });

      setListEntryData(employees.map(emp => {
        const log = logsForDate.find(l => String(l.employee_id) === String(emp.Actled_id));
        const isWO = isEmployeeWeekoff(listEntryDate, emp.Actled_id, weekoffs);
        const isHol = isHolidayDate(listEntryDate, holidays);
        const isLeave = !!leaveMap[emp.Actled_id];

        let inVal = log?.in_time ? log.in_time.substring(11, 16) : "";
        let outVal = log?.out_time ? log.out_time.substring(11, 16) : "";
        const hasRealPunch = (inVal && inVal !== "--:--" && inVal !== "00:00") ||
          (outVal && outVal !== "--:--" && outVal !== "00:00");
        if (!hasRealPunch) {
          inVal = "";
          outVal = "";
        }

        let status = leaveMap[emp.Actled_id] || "";
        if (!status) {
          if (isHol) {
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
        }

        return {
          employee_id: emp.Actled_id,
          employee_name: emp.Led_name,
          employee_code: emp.Led_code,
          employee_photo: emp.Ledimg || null,
          department: emp.department || "",
          log_id: log?.log_id || null,
          in: inVal,
          out: outVal,
          status,
          is_weekoff: isWO,
          is_holiday: isHol,
          is_leave: isLeave,
        };
      }));
    } catch (e) { console.error(e); }
    finally { setListLoading(false); }
  }, [employees, listEntryDate, listMonth, listYear, weekoffs, holidays]);

  useEffect(() => {
    if (attendanceType === "List") fetchListEntryData();
  }, [attendanceType, listEntryDate, fetchListEntryData]);

  // ── List row change handler ───────────────────────────────────────────────────
  const handleListRowChange = (idx, field, value) => {
    setListEntryData(prev => {
      const u = [...prev];
      const updated = { ...u[idx], [field]: value };

      if (field === "status" && value === "ABSENT") {
        updated.in = "";
        updated.out = "";
      }

      // ✅ Auto calculate status (PRESENT, L1, L2, HALF_DAY, HOLIDAY OT, WEEKOFF OT)
      if (field === "in" || field === "out") {
        const auto = calculateAutoStatus({
          inTime: updated.in,
          outTime: updated.out,
          isHoliday: updated.is_holiday,
          isWeekoff: updated.is_weekoff,
          isLeave: updated.is_leave,
        });
        if (auto) {
          updated.status = auto;
        }
      }

      u[idx] = updated;
      return u;
    });
  };

  // ── Bulk delete ───────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    try {
      if (!selectedDeleteIds.length) { toast("Please select records", "info"); return; }
      for (const id of selectedDeleteIds) { await deleteAttendance(id); }
      toast("Records deleted successfully", "success");
      setSelectedDeleteIds([]);
      setDeleteMode(false);
      await fetchAttendance();
      await fetchListEntryData();
    } catch (err) { console.error(err); toast("Delete failed", "error"); }
  };

  // ── List Entry save ───────────────────────────────────────────────────────────
  const checkAndConfirmDuplicate = (employeeName, existingPunchType) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: "Duplicate Attendance Found",
        message: `${employeeName} already has attendance on this date (${existingPunchType}). Do you want to update it with new data?`,
        onConfirm: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(true); },
        onCancel: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(false); },
      });
    });
  };

  const handleListSave = async () => {
    const toSave = listEntryData.filter(r => {
      if (!r.status) return false;
      if (r.is_leave) return false;
      if (r.is_holiday || r.is_weekoff) return !!(r.in && r.out);
      return true;
    });
    if (!toSave.length) { toast("No status selected for any employee", "info"); return; }

    try {
      for (const row of toSave) {
        const payload = {
          employee_id: row.employee_id,
          punch_type: "List",
          attendance_status: row.status,
          in_time: `${listEntryDate} ${row.in && row.in !== "" ? row.in : "00:00"}:00`,
          out_time: `${listEntryDate} ${row.out && row.out !== "" ? row.out : "00:00"}:00`,
        };
        if (row.log_id) {
          // Existing record — direct update, no confirm needed
          await updateAttendance(row.log_id, payload);
        } else {
          await saveAttendanceLog(payload);
        }
      }
      toast("List Attendance Saved Successfully", "success");
      await fetchListEntryData();
      onSave?.();
    } catch (e) { console.error(e); toast("Error saving list attendance", "error"); }
  };

  // ── Manual (calendar) data change ────────────────────────────────────────────
  const handleDataChange = (day, field, value) => {
    setAttendanceData(prev => {
      const existing = prev[day] || {};
      const updated = { ...existing, [field]: value };

      if (field === "status" && value === "ABSENT") {
        updated.in = "--:--";
        updated.out = "--:--";
      }

      if (field === "in" || field === "out") {
        const auto = calculateAutoStatus({
          inTime: updated.in,
          outTime: updated.out,
          isHoliday: updated.is_holiday,
          isWeekoff: updated.is_weekoff,
          isLeave: updated.is_leave,
        });
        if (auto) {
          updated.status = auto;
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

  // ── Manual (calendar) save ────────────────────────────────────────────────────
  const handleManualSave = async () => {
    if (!formData.employee_id) { toast("Please select employee", "info"); return; }

    // ✅ Sirf woh days jinka status set hai
    const daysToSave = Object.entries(attendanceData).filter(([, d]) => {
      if (!d.status) return false;
      if (d.is_leave) return false;
      if ((d.is_holiday || d.is_weekoff) && (!d.in || d.in === "--:--" || !d.out || d.out === "--:--")) return false;
      return true;
    });

    if (!daysToSave.length) { toast("Please select status for at least one day", "info"); return; }

    const mNum = months.indexOf(selectedMonth) + 1;
    let saved = 0;

    try {
      for (const [dayNum, dayData] of daysToSave) {
        const dt = `${selectedYear}-${String(mNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        const payload = {
          employee_id: formData.employee_id,
          punch_type: "Manual",
          attendance_status: dayData.status,
          in_time: `${dt} ${dayData.in && dayData.in !== "--:--" ? dayData.in : "00:00"}:00`,
          out_time: `${dt} ${dayData.out && dayData.out !== "--:--" ? dayData.out : "00:00"}:00`,
        };

        if (dayData.log_id) {
          await updateAttendance(dayData.log_id, payload);
        } else {
          await saveAttendanceLog(payload);
        }
        saved++;
      }

      toast(`${saved} day(s) saved successfully`, "success");
      await fetchAttendance();
      onSave?.();
    } catch (e) {
      console.error(e);
      toast("Error saving: " + e.message, "error");
    }
  };

  // ── Main save dispatcher ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (attendanceType === "List") { await handleListSave(); return; }
    if (attendanceType === "Manual") { await handleManualSave(); return; }
    if (attendanceType === "Biometric") { await AttendanceImports.bioSave?.(); return; }
    if (attendanceType === "Excel") { await AttendanceImports.excelSave?.(); return; }
  };

  // ── Employee select (Manual) ──────────────────────────────────────────────────
  const employeeOptions = employees.map(emp => ({
    label: emp.Led_name, value: emp.Led_code, id: emp.Actled_id
  }));

  const handleEmployeeSelect = (label) => {
    const emp = employees.find(e => e.Led_name === label);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employee_name: emp.Led_name,
        employee_code: emp.Led_code,
        employee_id: emp.Actled_id,
        designation: emp.Designation || "",
        employee_photo: emp.Ledimg || null,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employee_name: label,
        employee_id: "",
      }));
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────────
  const src = attendanceType === "List" ? listEntryData : Object.values(attendanceData);
  const totalPresent = src.filter(x => ["PRESENT", "L1", "L2", "HALF_DAY", "WFH", "WFS"].includes(x.status)).length;
  const totalAbsent = src.filter(x => x.status === "ABSENT").length;
  const totalWeekOff = src.filter(x => x.status === "WEEK OFF").length;
  const totalLeave = src.filter(x => leaveCodes.includes(x.status)).length;
  const totalHoliday = src.filter(x => x.status === "HOLIDAYS").length;

  // ── Style constants ───────────────────────────────────────────────────────────
  const inputCls = "h-8 w-full text-[13px] text-center font-medium font-mono border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-slate-300 transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden";
  const selectCls = "h-8 text-[14px] border border-slate-200 rounded-md px-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelCls = "text-[14px] font-semibold text-slate-700 uppercase whitespace-nowrap tracking-wide";
  const baseUrl = config.apiUrl;

  // ─────────────────────────────────────────────────────────────────────────────
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
      <div className="w-full mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-full sm:h-[calc(100vh-120px)] overflow-hidden"
        style={{ fontFamily: FONT }}>

        <ERPHeader
          title="Daily Attendance"
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          activeTab={activeTab} onTabChange={onTabChange}
          rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        />

        <div className="flex flex-1 min-h-0" style={{ background: "#f1f5f9" }}>
          <div className="flex w-full p-2.5 gap-2.5 overflow-hidden">

            {/* ══ LEFT SIDEBAR (Manual only) ══ */}
            {attendanceType === "Manual" && (
              <div className="w-[164px] bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="bg-slate-800 h-24 w-full relative mb-16 shrink-0">
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                    <div className="w-[120px] h-[120px] bg-white rounded-xl p-0.5 shadow-lg border">
                      {formData.employee_photo ? (
                        <img src={`${baseUrl}${formData.employee_photo}`} alt="emp"
                          className="w-full h-full rounded-[10px] object-cover"
                          onError={e => { e.target.style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full rounded-[10px] flex items-center justify-center border border-dashed border-slate-300"
                          style={{ background: getAvatarColor(formData.employee_id)?.[0] || "#f1f5f9" }}>
                          <span className="text-[22px] font-semibold"
                            style={{ color: getAvatarColor(formData.employee_id)?.[1] || "#475569" }}>
                            {formData.employee_name
                              ? getInitials(formData.employee_name)
                              : <span className="text-[11px] text-slate-400">PHOTO</span>}
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
                </div>
              </div>
            )}

            {/* ══ RIGHT CONTENT ══ */}
            {attendanceType === "Horizontal" ? (
              <HorizontalAttendanceEntry
                mode={mode}
                onTabChange={onTabChange}
                activeTab={activeTab}
                currentRecord={currentRecord}
                totalRecords={totalRecords}
                onNewEntry={onNewEntry}
                onModify={onModify}
                onEditCancel={onEditCancel}
                onDelete={onDelete}
                setShowForm={setShowForm}
                rights={rights}
                canPrint={canPrint}
                saving={saving}
              />
            ) :
              (attendanceType === "Biometric" || attendanceType === "Excel") ? (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
                  <AttendanceImports
                    employees={employees}
                    leaveTypes={leaveTypes}
                    isViewMode={isViewMode}
                    attendanceType={attendanceType}
                    onModeChange={(newType) => {
                      setAttendanceType(newType);
                      setTimeout(() => {
                        if (newType === "Biometric") bioPeriodRef.current?.focusFirst();
                      }, 250);
                    }}
                    modeRef={modeRef}
                    bioTableData={bioTableData} setBioTableData={setBioTableData}
                    excelRows={excelRows} setExcelRows={setExcelRows}
                    bioDay={bioDay} setBioDay={setBioDay}
                    bioMonth={bioMonth} setBioMonth={setBioMonth}
                    bioYear={bioYear} setBioYear={setBioYear}
                    bioSelectedDate={bioSelectedDate}
                    bioPeriodRef={bioPeriodRef}
                    onSave={onSave} onNewEntry={onNewEntry}
                  />
                </div>
              ) : (
                /* Manual + List */
                <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">

                  {/* ── Controls bar ── */}
                  <div className="bg-white rounded-xl border shadow-sm shrink-0 px-3 py-2">
                    <div className="flex items-center gap-3 flex-wrap">

                      {/* Mode dropdown */}
                      <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                        <span className={labelCls}>Mode:</span>
                        <select ref={modeRef} value={attendanceType} disabled={isViewMode}
                          onChange={e => {
                            const newType = e.target.value;
                            setAttendanceType(newType);
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

                      {/* Period */}
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
                            onDayEnter={() => { }}
                            onMonthEnter={() => { }}
                            onYearEnter={() => { setTimeout(() => listInRefs.current[0]?.focus(), 80); }}
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
                                const c = document.querySelector("[data-employee-autocomplete]");
                                c?.querySelector("input")?.focus();
                              }, 80);
                            }}
                          />
                        )}
                      </div>

                      {/* Employee — Manual only */}
                      {attendanceType === "Manual" && (
                        <div data-employee-autocomplete className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                          <span className={labelCls}>Employee:</span>
                          <div style={{ minWidth: 200 }}>
                            <ERPAutocomplete
                              disabled={isViewMode}
                              options={employeeOptions.map(o => o.label)}
                              value={formData.employee_name || employeeOptions.find(e => String(e.id) === String(formData.employee_id))?.label || ""}
                              onChange={handleEmployeeSelect}
                              className={selectCls}
                              placeholder="Search Employee..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Main content area ── */}
                  <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden min-h-0">

                    {/* ════ MANUAL — Calendar ════ */}
                    {attendanceType === "Manual" && (
                      <>
                        <div className="grid grid-cols-7 shrink-0"
                          style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((d, i) => (
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
                            // Holiday/Weekoff pe in/out editable — sirf is_leave disable karo
                            const dis = isViewMode || !formData.employee_id || data?.is_leave;
                            const statusDis = dis || data?.is_holiday || data?.is_weekoff;

                            return (
                              <div key={index} data-day={isValid ? dayNum : undefined}
                                className="relative p-1.5 flex flex-col justify-between"
                                style={{
                                  minHeight: 82,
                                  background: !isValid ? "#f8fafc"
                                    : data.is_holiday ? "#fefce8"
                                      : data.is_weekoff ? "#f5f4ff"
                                        : data.is_leave ? "#eff6ff"
                                          : isSun ? "#fff5f5"
                                            : "#fff"
                                }}>
                                {isValid && (
                                  <>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[11px] font-semibold"
                                        style={{ color: isSun ? "#ef4444" : "#475569" }}>
                                        {String(dayNum).padStart(2, "0")}
                                      </span>
                                      {deleteMode && data?.log_id && (
                                        <input type="checkbox"
                                          checked={selectedDeleteIds.includes(data.log_id)}
                                          onChange={e => {
                                            if (e.target.checked) setSelectedDeleteIds(prev => [...prev, data.log_id]);
                                            else setSelectedDeleteIds(prev => prev.filter(id => id !== data.log_id));
                                          }} />
                                      )}
                                      <select
                                        tabIndex={0}
                                        disabled={statusDis}
                                        value={data.status}
                                        onChange={e => handleDataChange(dayNum, "status", e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter" || e.key === "Tab") {
                                            e.preventDefault();
                                            const allDays = Object.entries(attendanceData);
                                            const nextValid = allDays.find(([d, dd]) => parseInt(d) > dayNum && !dd.is_holiday && !dd.is_weekoff && !dd.is_leave);
                                            if (nextValid) {
                                              document.querySelector(`[data-day="${nextValid[0]}"] select`)?.focus();
                                            }
                                          }
                                        }}
                                        className={`text-[11px] font-semibold border rounded px-0.5 h-[20px] cursor-pointer appearance-none text-center focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusStyle(data.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        style={{ width: 80 }}>
                                        <option value="">SELECT</option>
                                        {statusOpts.map(o => (
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
                                            onClick={() => { if (!data.in || data.in === "--:--" || dis || data.status === "ABSENT") return; handleDataChange(dayNum, "in", toggleAmPm(data.in)); }}
                                            onKeyDown={e => {
                                              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                                e.preventDefault();
                                                if (!data.in || data.in === "--:--" || dis || data.status === "ABSENT") return;
                                                handleDataChange(dayNum, "in", toggleAmPm(data.in));
                                                setTimeout(() => calInAmPmRefs.current[dayNum]?.focus(), 30);
                                              }
                                            }}
                                            style={{
                                              fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 3,
                                              border: "1px solid #e2e8f0", whiteSpace: "nowrap", height: 18,
                                              display: "flex", alignItems: "center",
                                              cursor: data.in && data.in !== "--:--" && !dis ? "pointer" : "default",
                                              background: data.in && data.in !== "--:--" && parseInt(data.in.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                              color: data.in && data.in !== "--:--" && parseInt(data.in.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
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
                                            onClick={() => { if (!data.out || data.out === "--:--" || dis || data.status === "ABSENT") return; handleDataChange(dayNum, "out", toggleAmPm(data.out)); }}
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
                                              color: data.out && data.out !== "--:--" && parseInt(data.out.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
                                            }}>
                                            {data.out && data.out !== "--:--" ? (parseInt(data.out.split(":")[0]) >= 12 ? "PM" : "AM") : "--"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* ════ LIST ENTRY ════ */}
                    {attendanceType === "List" && (
                      <>
                        <TableHeader TH={TH}
                          cols={[deleteMode ? "✓" : "#", "Employee", "Code", "Department", "Date", "In Time", "Out Time", "Status"]}
                          template="40px 1fr 195px 190px 110px 110px 110px 150px"
                        />
                        <div className="flex-1 overflow-y-auto">
                          {listLoading ? <LoadingState msg="Loading employees…" />
                            : listEntryData.length === 0 ? <EmptyState msg="No employees found." />
                              : listEntryData.map((row, idx) => {
                                const [y, m, d] = listEntryDate.split("-");
                                return (
                                  <TableRow key={row.employee_id} idx={idx}
                                    template="40px 1fr 220px 150px 110px 110px 110px 150px"
                                    bgOverride={row.is_holiday ? "#fefce8" : row.is_weekoff ? "#fff7ed" : row.is_leave ? "#eff6ff" : null}>
                                    {/* # / checkbox */}
                                    <div className="px-3 py-2 text-center">
                                      {deleteMode ? (
                                        <input type="checkbox"
                                          checked={selectedDeleteIds.includes(row.log_id)}
                                          onChange={e => {
                                            if (e.target.checked) setSelectedDeleteIds(prev => [...prev, row.log_id]);
                                            else setSelectedDeleteIds(prev => prev.filter(id => id !== row.log_id));
                                          }} />
                                      ) : <span className="text-[11px] text-slate-400">{idx + 1}</span>}
                                    </div>
                                    <AvatarCell name={row.employee_name} empId={row.employee_id} photo={row.employee_photo} />
                                    <div className="px-3 py-2 text-[12px] font-mono text-indigo-700">{row.employee_code}</div>
                                    <div className="px-3 py-2 text-[12px] text-slate-500 truncate">{row.department || "—"}</div>
                                    <div className="px-3 py-2 text-[14px] font-mono text-slate-700">{d}-{m}-{y}</div>


                                    {/* IN */}
                                    <div className="px-2 py-2 flex items-center gap-1">
                                      <input type="time"
                                        disabled={isViewMode || row.status === "ABSENT" || row.is_leave}
                                        ref={el => { listInRefs.current[idx] = el; }}
                                        value={row.in || ""}
                                        onChange={e => handleListRowChange(idx, "in", e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            setTimeout(() => listInAmPmRefs.current[idx]?.focus(), 0);
                                          }
                                          if (e.key === "Backspace" && e.shiftKey) {
                                            e.preventDefault();
                                            listStatusRefs.current[idx - 1]?.focus();
                                          }
                                        }}
                                        className={inputCls} />
                                      <button
                                        ref={el => { listInAmPmRefs.current[idx] = el; }}
                                        tabIndex={isViewMode || row.status === "ABSENT" ? -1 : 0}
                                        onClick={e => e.preventDefault()}
                                        onKeyDown={e => {
                                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                            e.preventDefault();
                                            if (!row.in || row.status === "ABSENT" || isViewMode) return;
                                            handleListRowChange(idx, "in", toggleAmPm(row.in));
                                          }
                                          if (e.key === " ") {
                                            e.preventDefault();
                                            if (row.in && row.status !== "ABSENT" && !isViewMode) {
                                              handleListRowChange(idx, "in", toggleAmPm(row.in));
                                            }
                                          }
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            listOutRefs.current[idx]?.focus();
                                          }
                                          if (e.key === "Backspace" && e.shiftKey) {
                                            e.preventDefault();
                                            listInRefs.current[idx]?.focus();
                                          }
                                        }}
                                        style={{
                                          background: row.in && parseInt(row.in.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                          color: row.in && parseInt(row.in.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
                                          borderColor: "#e2e8f0", whiteSpace: "nowrap", height: 24,
                                          display: "flex", alignItems: "center",
                                          cursor: row.in && !isViewMode && row.status !== "ABSENT" ? "pointer" : "default",
                                          fontSize: 10, fontWeight: 700, padding: "0 4px", borderRadius: 4, border: "1px solid #e2e8f0",
                                          opacity: (!row.in || isViewMode || row.status === "ABSENT") ? 0.5 : 1
                                        }}>
                                        {row.in && parseInt(row.in.split(":")[0]) >= 12 ? "PM" : "AM"}
                                      </button>
                                    </div>

                                    {/* OUT */}
                                    <div className="px-2 py-2 flex items-center gap-1">
                                      <input type="time"
                                        disabled={isViewMode || row.status === "ABSENT" || row.is_leave}
                                        ref={el => { listOutRefs.current[idx] = el; }}
                                        value={row.out || ""}
                                        onChange={e => handleListRowChange(idx, "out", e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            setTimeout(() => listOutAmPmRefs.current[idx]?.focus(), 0);
                                          }
                                          if (e.key === "Backspace" && e.shiftKey) {
                                            e.preventDefault();
                                            listInAmPmRefs.current[idx]?.focus();
                                          }
                                        }}
                                        className={inputCls} />
                                      <button
                                        ref={el => { listOutAmPmRefs.current[idx] = el; }}
                                        tabIndex={isViewMode || row.status === "ABSENT" ? -1 : 0}
                                        onClick={e => e.preventDefault()}
                                        onKeyDown={e => {
                                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                                            e.preventDefault();
                                            if (!row.out || row.status === "ABSENT" || isViewMode) return;
                                            handleListRowChange(idx, "out", toggleAmPm(row.out));
                                          }
                                          if (e.key === " ") {
                                            e.preventDefault();
                                            if (row.out && row.status !== "ABSENT" && !isViewMode) {
                                              handleListRowChange(idx, "out", toggleAmPm(row.out));
                                            }
                                          }
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            listStatusRefs.current[idx]?.focus();
                                          }
                                          if (e.key === "Backspace" && e.shiftKey) {
                                            e.preventDefault();
                                            listOutRefs.current[idx]?.focus();
                                          }
                                        }}
                                        style={{
                                          background: row.out && parseInt(row.out.split(":")[0]) >= 12 ? "#eff6ff" : "#f8fafc",
                                          color: row.out && parseInt(row.out.split(":")[0]) >= 12 ? "#1d4ed8" : "#64748b",
                                          borderColor: "#e2e8f0", whiteSpace: "nowrap", height: 24,
                                          display: "flex", alignItems: "center",
                                          cursor: row.out && !isViewMode && row.status !== "ABSENT" ? "pointer" : "default",
                                          fontSize: 10, fontWeight: 700, padding: "0 4px", borderRadius: 4, border: "1px solid #e2e8f0",
                                          opacity: (!row.out || isViewMode || row.status === "ABSENT") ? 0.5 : 1
                                        }}>
                                        {row.out && parseInt(row.out.split(":")[0]) >= 12 ? "PM" : "AM"}
                                      </button>
                                    </div>

                                    {/* STATUS */}
                                    <div className="px-4 py-3">
                                      <select
                                        disabled={isViewMode || row.is_holiday || row.is_weekoff || row.is_leave}
                                        tabIndex={row.is_holiday || row.is_weekoff || row.is_leave ? -1 : 0}
                                        ref={el => { listStatusRefs.current[idx] = el; }}
                                        value={row.status}
                                        onChange={e => {
                                          handleListRowChange(idx, "status", e.target.value);
                                          setTimeout(() => { listInRefs.current[idx + 1]?.focus(); }, 0);
                                        }}
                                        onKeyDown={e => {
                                          if (e.key === "Backspace" && e.shiftKey) {
                                            e.preventDefault();
                                            listOutAmPmRefs.current[idx]?.focus();
                                          }
                                        }}
                                        className={`h-7 w-full text-[12px] text-center font-semibold border rounded-md px-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed ${row.status ? getStatusBadge(row.status) : "border-slate-200 text-slate-400 bg-white"}`}>
                                        <option value="">— Select —</option>
                                        {statusOpts.map(o => (
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

                  </div>{/* end main content */}
                </div>
              )}

          </div>
        </div>

        <ERPFooter
          isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
          handleSubmit={handleSave}
          onCancel={() => { setShowForm(false); if (onTabChange) onTabChange("list"); }}
          onModify={() => onModify(formData)}
          onDelete={() => {
            if (deleteMode) {
              if (selectedDeleteIds.length) handleBulkDelete();
              else { setDeleteMode(false); toast("Delete mode closed", "info"); }
            } else {
              setDeleteMode(true);
              toast("Select records to delete", "info");
            }
          }}
          onNewEntry={onNewEntry}
          onEditCancel={onEditCancel}
          saving={saving} canPrint={canPrint} rights={rights}
          showPrevious={false} showNext={false}
        />
      </div>
    </>
  );
};

export default AttendancePage;
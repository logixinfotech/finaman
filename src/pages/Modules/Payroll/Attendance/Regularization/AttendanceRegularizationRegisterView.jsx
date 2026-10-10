import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarCheck,
  RefreshCw,
  Sparkles,
  Filter,
  Search,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { showToast } from "../../../../../components/Reusable/alert";
import {
  fetchAttendanceRegister,
  fetchEmployeesList,
  saveAttendanceRegularization,
  getActledList,
} from "../../../../../utils/api";
import AttendanceRegularizationFilters from "./AttendanceRegularizationFilters";
import AttendanceRegularizationGrid from "./AttendanceRegularizationGrid";
import AttendanceRegularizationModal from "./AttendanceRegularizationModal";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = [2024, 2025, 2026, 2027];

const pad = (n) => String(n).padStart(2, "0");

/**
 * Transforms backend rows into aggregated employee objects with daily attendance maps.
 */
const processRegisterRows = (rawRows, month, year) => {
  if (!Array.isArray(rawRows)) return [];

  // If already aggregated with attendance map
  if (rawRows.length > 0 && (rawRows[0].attendance || rawRows[0].days)) {
    return rawRows.map((emp) => {
      const fullName =
        emp.employee_name ||
        emp.name ||
        emp.Led_name ||
        [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" ") ||
        `Employee #${emp.employee_id || emp.id}`;
      return {
        ...emp,
        employee_id: emp.employee_id || emp.id || emp.Actled_id,
        employee_code: emp.employee_code || emp.Led_code || emp.code || `EMP-${emp.employee_id}`,
        employee_name: fullName,
        department: emp.department || emp.department_name || emp.Dept_name || "General",
      };
    });
  }

  // Flat daily rows: Group by employee_id
  const empMap = new Map();

  rawRows.forEach((row) => {
    const empId = row.employee_id || row.Actled_id || row.id;
    if (!empId) return;

    if (!empMap.has(empId)) {
      const fullName =
        [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") ||
        row.employee_name ||
        row.Led_name ||
        row.name ||
        `Employee #${empId}`;
      const empCode = row.employee_code || row.Led_code || row.code || `EMP-${empId}`;
      const dept = row.department || row.department_name || row.Dept_name || "General";
      const desig = row.designation || row.Desig_name || "";

      empMap.set(empId, {
        employee_id: empId,
        employee_code: empCode,
        employee_name: fullName,
        department: dept,
        designation: desig,
        attendance: {},
      });
    }

    const empObj = empMap.get(empId);
    if (row.attendance_date) {
      const dateStr = String(row.attendance_date).split("T")[0];
      const dayNum = parseInt(dateStr.split("-")[2], 10);
      if (!isNaN(dayNum)) {
        empObj.attendance[dayNum] = {
          attendance_date: dateStr,
          status: (row.status || "P").toUpperCase(),
          day_type: row.day_type,
          is_holiday: Boolean(row.is_holiday),
          is_weekoff: Boolean(row.is_weekoff),
          punch_in_time: row.punch_in_time || row.in_time || null,
          punch_out_time: row.punch_out_time || row.out_time || null,
          overtime_hours: row.overtime_hours,
          total_work_hours: row.total_work_hours,
        };
      }
    }
  });

  return Array.from(empMap.values());
};

/**
 * AttendanceRegularizationRegisterView
 * Main orchestrator component for the Monthly Attendance Regularization Register Tab.
 * (SPEC: LI/HR/TM/04/011)
 */
export default function AttendanceRegularizationRegisterView({ tab }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registerData, setRegisterData] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Extract unique departments directly from the loaded attendance register
  const departments = useMemo(() => {
    const deptSet = new Set();
    (registerData || []).forEach((emp) => {
      const d = emp.department || emp.department_name;
      if (d && typeof d === "string" && d.trim() && d.trim() !== "General") {
        deptSet.add(d.trim());
      }
    });
    return Array.from(deptSet).sort();
  }, [registerData]);

  // Quick Regularization Modal & Queue State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const [queueIndex, setQueueIndex] = useState(0);

  // ── Load Employee Lookups ──────────────────────────────────
  const loadLookups = useCallback(async () => {
    try {
      const empRes = await (getActledList ? getActledList() : fetchEmployeesList());
      const raw = empRes?.data || empRes || [];
      setEmployees(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error("Error loading employee lookups:", err);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // ── Load Monthly Attendance Register Data ──────────────────────────────────
  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAttendanceRegister(selectedMonth, selectedYear);
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res?.data && Array.isArray(res.data)) {
        list = res.data;
      } else if (res?.tableData && Array.isArray(res.tableData)) {
        list = res.tableData;
      }

      const aggregated = processRegisterRows(list, selectedMonth, selectedYear);
      setRegisterData(aggregated);
    } catch (err) {
      showToast({ icon: "error", title: "Failed to load attendance register" });
      setRegisterData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // ── Detect Discrepancies Across All Loaded Records ──────────────────────────
  const allDiscrepancies = useMemo(() => {
    const list = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    (registerData || []).forEach((emp) => {
      const empId = emp.employee_id || emp.id || emp.Actled_id;
      const empName = emp.employee_name;
      const empCode = emp.employee_code;
      const deptName = emp.department;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${pad(selectedMonth)}-${pad(day)}`;
        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
        const isSunday = dateObj.getDay() === 0;

        const rawRecord = emp.attendance?.[day] || emp.attendance?.[dateStr] || null;

        let status = (
          (typeof rawRecord === "object" ? rawRecord?.status : rawRecord) ||
          (isSunday ? "WO" : "-")
        ).toUpperCase();

        const punchIn = typeof rawRecord === "object" ? rawRecord?.punch_in_time : null;
        const punchOut = typeof rawRecord === "object" ? rawRecord?.punch_out_time : null;
        const approved = typeof rawRecord === "object" ? Boolean(rawRecord?.approved) : false;

        // Discrepancy Conditions (§5):
        // 1. Half Day: status is "HD" or missing punch out when punch in exists
        // 2. Absent: status is "A" on non-weekend and not approved
        const isHalfDay = status === "HD" || (Boolean(punchIn) && !punchOut);
        const isAbsent = (status === "A" || status === "ABSENT") && !isSunday && !approved;

        if (isHalfDay || isAbsent) {
          list.push({
            employee_id: empId,
            employee_name: empName,
            employee_code: empCode,
            department: deptName,
            attendance_date: dateStr,
            punch_in_time: punchIn || null,
            punch_out_time: punchOut || null,
            status: isHalfDay ? "HD" : "A",
            discrepancy_type: isHalfDay ? "Half Day" : "Absent",
            approved: false,
            reason: isHalfDay ? "Forgot to Punch Out" : "Absent",
            remarks: "",
          });
        }
      }
    });

    return list;
  }, [registerData, selectedMonth, selectedYear]);

  // Counts for status banner
  const halfDayCount = useMemo(
    () => allDiscrepancies.filter((d) => d.discrepancy_type === "Half Day" || d.status === "HD").length,
    [allDiscrepancies]
  );
  const absentCount = useMemo(
    () => allDiscrepancies.filter((d) => d.discrepancy_type === "Absent" || d.status === "A").length,
    [allDiscrepancies]
  );

  // ── Filtered Data for Grid View ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...registerData];

    // Filter by Department
    if (selectedDepartment && selectedDepartment !== "All") {
      const target = selectedDepartment.toLowerCase();
      result = result.filter((emp) => {
        const dept = (emp.department || emp.department_name || emp.Dept_name || "").toLowerCase();
        return dept.includes(target);
      });
    }

    // Filter by Employee Search
    if (selectedEmployee && selectedEmployee.trim()) {
      const q = selectedEmployee.toLowerCase().trim();
      result = result.filter((emp) => {
        const name = (emp.employee_name || emp.name || emp.Led_name || "").toLowerCase();
        const code = (emp.employee_code || emp.code || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }

    // Filter by Discrepancy Type
    if (discrepancyFilter === "discrepancies") {
      const empIdsWithDisc = new Set(allDiscrepancies.map((d) => d.employee_id));
      result = result.filter((emp) => empIdsWithDisc.has(emp.employee_id || emp.id || emp.Actled_id));
    } else if (discrepancyFilter === "hd") {
      const empIdsWithHD = new Set(
        allDiscrepancies.filter((d) => d.status === "HD" || d.discrepancy_type === "Half Day").map((d) => d.employee_id)
      );
      result = result.filter((emp) => empIdsWithHD.has(emp.employee_id || emp.id || emp.Actled_id));
    } else if (discrepancyFilter === "a") {
      const empIdsWithA = new Set(
        allDiscrepancies.filter((d) => d.status === "A" || d.discrepancy_type === "Absent").map((d) => d.employee_id)
      );
      result = result.filter((emp) => empIdsWithA.has(emp.employee_id || emp.id || emp.Actled_id));
    }

    return result;
  }, [registerData, selectedDepartment, selectedEmployee, discrepancyFilter, allDiscrepancies]);

  // ── Modal & Discrepancy Queue Handlers ──────────────────────────────────────
  const handleCellClick = (cellData) => {
    const idx = allDiscrepancies.findIndex(
      (d) =>
        d.employee_id === cellData.employee_id &&
        (d.attendance_date || "").split("T")[0] === (cellData.attendance_date || "").split("T")[0]
    );

    setQueueIndex(idx !== -1 ? idx : 0);
    setCurrentCell(cellData);
    setIsModalOpen(true);
  };

  const handleStartRegularizing = () => {
    if (allDiscrepancies.length > 0) {
      setQueueIndex(0);
      setCurrentCell(allDiscrepancies[0]);
      setIsModalOpen(true);
    }
  };

  // ── Save Regularization Record ──────────────────────────────────────────────
  const handleSaveRegularization = async (formData, advanceToNext = false) => {
    setSaving(true);
    try {
      const res = await saveAttendanceRegularization(formData);
      if (res?.success !== false) {
        showToast({
          icon: "success",
          title: `Attendance Regularized for ${formData.employee_name || "Employee"}`,
        });

        // Refresh attendance data to update the grid
        await loadAttendanceData();

        if (advanceToNext) {
          const nextIdx = queueIndex + 1;
          if (nextIdx < allDiscrepancies.length) {
            setQueueIndex(nextIdx);
            setCurrentCell(allDiscrepancies[nextIdx]);
          } else {
            setIsModalOpen(false);
            setCurrentCell(null);
            showToast({
              icon: "success",
              title: "All highlighted discrepancies have been reviewed!",
            });
          }
        } else {
          setIsModalOpen(false);
          setCurrentCell(null);
        }
      } else {
        showToast({
          icon: "error",
          title: res?.message || "Failed to save attendance regularization",
        });
      }
    } catch (err) {
      showToast({
        icon: "error",
        title: "Error saving attendance regularization",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasActiveFilters =
    selectedDepartment !== "All" || selectedEmployee.trim() !== "" || discrepancyFilter !== "all";

  const handleResetFilters = () => {
    setSelectedDepartment("All");
    setSelectedEmployee("");
    setDiscrepancyFilter("all");
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50">
      {/* ── Standard ERP Table Header (Row 1) ────────────────────────────────── */}
      <div className="bg-white border border-slate-200 px-2 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-2xs">
        {/* Left: Module Title with Blue Icon Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CalendarCheck size={16} />
          </div>
          <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">
            Attendance Register ({MONTHS.find((m) => m.value === selectedMonth)?.label || "Month"} {selectedYear})
          </h2>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
            {filteredData.length} RECORDS
          </span>
        </div>

        {/* Right: Search & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search (Alt+F)"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 w-44 focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={loadAttendanceData}
            title="Refresh Register"
            className="h-[30px] px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            title="Toggle Detailed Filters & Legend"
            className={`h-[30px] px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-colors shadow-2xs ${showFilters
              ? "bg-amber-100 border-amber-400 text-amber-800 font-bold"
              : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              }`}
          >
            <Filter size={13} />
          </button>

          {allDiscrepancies.length > 0 && (
            <button
              type="button"
              onClick={handleStartRegularizing}
              className="h-[30px] px-3 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Sparkles size={13} />
              <span>Quick Regularize ({allDiscrepancies.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Sub-bar / Discrepancy Queue Pills (Row 2) ───────────────────── */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Queue Pill Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setDiscrepancyFilter("all")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${discrepancyFilter === "all"
              ? "bg-white text-slate-800 border-slate-300 shadow-2xs"
              : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200/60"
              }`}
          >
            All Days
          </button>

          <button
            type="button"
            onClick={() => setDiscrepancyFilter("discrepancies")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 transition-all ${discrepancyFilter === "discrepancies"
              ? "bg-rose-500 text-white border-rose-600 shadow-2xs"
              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
          >
            <AlertTriangle size={11} />
            <span>All Discrepancies</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/80 text-rose-900">
              {allDiscrepancies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDiscrepancyFilter("hd")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${discrepancyFilter === "hd"
              ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
          >
            Half Day / Missing Out ({halfDayCount})
          </button>

          <button
            type="button"
            onClick={() => setDiscrepancyFilter("a")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${discrepancyFilter === "a"
              ? "bg-red-600 text-white border-red-700 shadow-2xs"
              : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
              }`}
          >
            Absent ({absentCount})
          </button>
        </div>

        {/* Right: Dropdowns (Month, Year, Department) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 shadow-2xs focus:outline-none cursor-pointer"
            aria-label="Month"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 shadow-2xs focus:outline-none cursor-pointer"
            aria-label="Year"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 shadow-2xs focus:outline-none cursor-pointer max-w-[140px]"
            aria-label="Department"
          >
            <option value="All">Dept: All</option>
            {departments.map((dept) => {
              const name =
                typeof dept === "object"
                  ? dept.department_name || dept.group_name || dept.name || dept.Dept_name
                  : dept;
              const val =
                typeof dept === "object"
                  ? dept.department_id || dept.group_id || dept.id || name
                  : dept;
              return (
                <option key={val} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Expandable Status Legend */}
      {showFilters && (
        <AttendanceRegularizationFilters />
      )}

      {/* ── Attendance Grid Container (Full-Height Table View) ─────────────────── */}
      <div className="flex-1 min-h-0  overflow-hidden">
        <AttendanceRegularizationGrid
          data={filteredData}
          month={selectedMonth}
          year={selectedYear}
          discrepancies={allDiscrepancies}
          loading={loading}
          onCellClick={handleCellClick}
          discrepancyFilter={discrepancyFilter}
        />
      </div>

      {/* ── Footer Action Bar ─────────────────────────────────────────────────── */}
      <div className="w-full border-t bg-slate-50/90 backdrop-blur-md px-3 py-2 shrink-0 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">
            {filteredData.length} {filteredData.length === 1 ? "Employee" : "Employees"} loaded
          </span>
          <span>•</span>
          <span className="text-amber-800 font-medium">
            {allDiscrepancies.length} Discrepancies pending regularization
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Quick-Action Regularization Modal ─────────────────────────────────── */}
      {isModalOpen && currentCell && (
        <AttendanceRegularizationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentCell(null);
          }}
          cellData={currentCell}
          currentIndex={queueIndex}
          totalDiscrepancies={allDiscrepancies.length}
          onSave={(data) => handleSaveRegularization(data, false)}
          onSaveAndNext={(data) => handleSaveRegularization(data, true)}
          hasNextRecord={queueIndex < allDiscrepancies.length - 1}
          saving={saving}
        />
      )}
    </div>
  );
}



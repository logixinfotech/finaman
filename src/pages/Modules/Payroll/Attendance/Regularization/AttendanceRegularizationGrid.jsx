import React, { useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");

// --- SOLID THEME STATUS BADGES (From AttendanceRegister.jsx) ---
export const STATUS_UI = {
  P: "bg-[#C6F6D5] text-[#14532D] font-bold",   // Present
  H: "bg-[#047857] text-white font-bold",        // Holiday
  FH: "bg-[#86efac] text-[#065f46] font-bold",   // Work From Home
  WFH: "bg-[#86efac] text-[#065f46] font-bold",
  A: "bg-[#DC2626] text-white font-bold",        // Absent
  L1: "bg-[#FEEBC8] text-[#78350F] font-bold",   // Late 1 (Casual)
  L2: "bg-[#FBD38D] text-[#542605] font-bold",   // Late 2 (Privilege)
  HD: "bg-[#FEFCBF] text-[#713F12] font-bold",   // Half Day
  WO: "bg-[#E2E8F0] text-[#1E293B] font-bold",   // Week Off
  EL: "bg-[#BAE6FD] text-[#0C4A6E] font-bold",   // Earned Leave
  D: "bg-[#E9D8FD] text-[#581C87] font-bold",    // WFS (Work From Site)
  WFS: "bg-[#E9D8FD] text-[#581C87] font-bold",
  SH: "bg-orange-500 text-white font-bold",      // Short
  WOT: "bg-purple-600 text-white font-bold",     // Week Off OT
  HOT: "bg-amber-600 text-white font-bold",      // Holiday OT
  CL: "bg-teal-600 text-white font-bold",        // Casual Leave
  SL: "bg-blue-600 text-white font-bold",        // Sick Leave
  PL: "bg-violet-600 text-white font-bold",      // Paid Leave
  OD: "bg-cyan-600 text-white font-bold",        // On Duty
  REG: "bg-emerald-600 text-white font-bold",    // Regularized
};

// --- CODE BADGE COMPONENT ---
const CodeBadge = ({ code }) => (
  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs tracking-wider leading-none">
    {code || "—"}
  </span>
);

/**
 * Normalizes any database status string to its short code.
 */
export const mapStatus = (dbStatus) => {
  if (!dbStatus) return "";
  const key = dbStatus.toString().toUpperCase().replace(/\s+/g, " ").trim();
  const map = {
    PRESENT: "P",
    L1: "L1",
    L2: "L2",
    HALF_DAY: "HD",
    HALFDAY: "HD",
    "HALF DAY": "HD",
    SHORT: "SH",
    ABSENT: "A",
    "WEEK OFF": "WO",
    WEEKOFF: "WO",
    "WEEK OFF OT": "WOT",
    "WEEKOFF OT": "WOT",
    HOLIDAYS: "H",
    HOLIDAY: "H",
    "HOLIDAY OT": "HOT",
    WFH: "FH",
    "WORK FROM HOME": "FH",
    HOME: "FH",
    WFS: "D",
    "WORK FROM SITE": "D",
    SITE: "D",
    CL: "CL",
    SL: "SL",
    PL: "PL",
    EL: "EL",
    "EARNED LEAVE": "EL",
    REGULARIZED: "REG",
    "ON DUTY": "OD",
    OD: "OD",
  };
  return map[key] || (key.length > 3 ? key.substring(0, 3) : key);
};

/**
 * AttendanceRegularizationGrid
 * High-density monthly register matching AttendanceRegister.jsx table UI.
 */
export default function AttendanceRegularizationGrid({
  data = [],
  month,
  year,
  discrepancies = [],
  loading = false,
  onCellClick,
}) {
  const daysInMonth = useMemo(() => getDaysInMonth(month, year), [month, year]);

  // Build a fast lookup map for discrepancies: `${employee_id}_${dateStr}` => discrepancy object
  const discrepancyLookup = useMemo(() => {
    const map = new Map();
    (discrepancies || []).forEach((d) => {
      const dateOnly = (d.attendance_date || "").split("T")[0];
      const key = `${d.employee_id}_${dateOnly}`;
      map.set(key, d);
    });
    return map;
  }, [discrepancies]);

  // Compute per-row daily mapping and per-employee totals
  const processedRows = useMemo(() => {
    return (data || []).map((emp) => {
      const empId = emp.employee_id || emp.id || emp.Actled_id;
      const empCode = emp.employee_code || emp.Led_code || emp.code || `EMP-${empId}`;
      const empName =
        emp.employee_name ||
        emp.name ||
        emp.Led_name ||
        [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" ") ||
        `Employee #${empId}`;
      const deptName = emp.department || emp.department_name || emp.Dept_name || "General";

      const daily = {};
      const rawDaily = {};
      const totals = { P: 0, A: 0, L: 0, WO: 0, H: 0, L1: 0, L2: 0 };

      for (let d = 1; d <= 31; d++) {
        if (d > daysInMonth) {
          daily[d] = "";
          continue;
        }

        const dateStr = `${year}-${pad(month)}-${pad(d)}`;
        const dateObj = new Date(year, month - 1, d);
        const isSunday = dateObj.getDay() === 0;

        const cellKey = `${empId}_${dateStr}`;
        const discItem = discrepancyLookup.get(cellKey);

        const rawRecord =
          emp.attendance?.[d] ||
          emp.attendance?.[dateStr] ||
          emp.days?.[d] ||
          emp[d] ||
          emp[dateStr] ||
          null;

        const rawStatus =
          discItem?.status ||
          (typeof rawRecord === "object" ? rawRecord?.status : rawRecord) ||
          (isSunday ? "WO" : "");

        const status = mapStatus(rawStatus);
        daily[d] = status;
        rawDaily[d] = { rawStatus, rawRecord, discItem, dateStr, isSunday };

        if (status === "P" || status === "FH" || status === "D" || status === "REG" || status === "OD") {
          totals.P += 1;
        } else if (status === "A") {
          totals.A += 1;
        } else if (status === "PL" || status === "CL" || status === "SL" || status === "EL") {
          totals.L += 1;
        } else if (status === "WO" || status === "WOT") {
          totals.WO += 1;
        } else if (status === "H" || status === "HOT") {
          totals.H += 1;
        } else if (status === "L1") {
          totals.L1 += 1;
        } else if (status === "L2") {
          totals.L2 += 1;
        }
      }

      return {
        id: empId,
        code: empCode,
        name: empName,
        dept: deptName,
        daily,
        rawDaily,
        totals,
      };
    });
  }, [data, daysInMonth, month, year, discrepancyLookup]);

  // Overall summary footer counts
  const summary = useMemo(() => {
    const sum = { P: 0, A: 0, L: 0, WO: 0, H: 0, L1: 0, L2: 0 };
    processedRows.forEach((r) => {
      sum.P += r.totals.P;
      sum.A += r.totals.A;
      sum.L += r.totals.L;
      sum.WO += r.totals.WO;
      sum.H += r.totals.H;
      sum.L1 += r.totals.L1;
      sum.L2 += r.totals.L2;
    });
    return sum;
  }, [processedRows]);

  const dailyCounts = useMemo(() => {
    const counts = {};
    for (let d = 1; d <= daysInMonth; d++) {
      let pCount = 0;
      let aCount = 0;
      processedRows.forEach((r) => {
        const s = r.daily[d];
        if (s === "P" || s === "FH" || s === "D" || s === "REG" || s === "OD") pCount++;
        if (s === "A") aCount++;
      });
      counts[d] = { P: pCount, A: aCount };
    }
    return counts;
  }, [processedRows, daysInMonth]);

  if (loading) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">Loading attendance register data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full p-12 text-center bg-white border border-gray-200 rounded-lg shadow-xs">
        <AlertCircle className="w-9 h-9 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Attendance Records Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          No records match the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative z-0 overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left table-auto">
          {/* STICKY HEADER */}
          <thead className="sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <tr className="bg-slate-50 border-b border-gray-300">
              {/* 1. Employee Info — sticky left */}
              <th className="sticky left-0 z-40 bg-slate-50 px-2 py-1 border-r border-gray-200 w-[140px] min-w-[140px] max-w-[140px] text-[10.5px] font-bold text-gray-600 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)] select-none">
                EMPLOYEE
              </th>

              {/* 2. Emp ID Column */}
              <th className="sticky left-[140px] z-40 p-0.5 border-r border-gray-200 bg-slate-50 text-[10.5px] font-bold text-gray-600 uppercase tracking-wider text-center select-none w-[64px] min-w-[64px] max-w-[64px] shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                EMP ID
              </th>

              {/* 3. Date columns */}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month - 1, day);
                const isSun = day <= daysInMonth && dateObj.getDay() === 0;

                return (
                  <th
                    key={day}
                    className={`p-0 text-center border-r border-gray-200 min-w-[22px] ${
                      day > daysInMonth ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center leading-none py-0.5">
                      <span className="text-[7.5px] text-gray-400 font-medium uppercase">
                        {day <= daysInMonth
                          ? dateObj.toLocaleDateString("en-US", { weekday: "narrow" })
                          : "-"}
                      </span>
                      <span
                        className={`text-[10px] font-bold mt-0.5 ${
                          isSun ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {day <= daysInMonth ? day : "-"}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* 4. Totals — AFTER dates */}
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-emerald-600 uppercase min-w-[26px]">
                P
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-red-500 uppercase min-w-[26px]">
                A
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-blue-500 uppercase min-w-[26px]">
                L
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-slate-500 uppercase min-w-[26px]">
                WO
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-pink-500 uppercase min-w-[26px]">
                H
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-amber-500 uppercase min-w-[26px]">
                L1
              </th>
              <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-indigo-600 uppercase min-w-[26px]">
                L2
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {processedRows.map((row) => {
              const isHighLate = (row.totals.L1 || 0) + (row.totals.L2 || 0) > 9;

              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-300 transition-colors ${
                    isHighLate ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* 1. Employee Info — sticky left */}
                  <td
                    className={`sticky left-0 z-20 px-2 py-0 border-r border-gray-200 shadow-[1px_0_3px_rgba(0,0,0,0.02)] w-[140px] min-w-[140px] max-w-[140px] ${
                      isHighLate ? "bg-red-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-bold text-gray-800 text-[11px] truncate leading-tight"
                        title={row.name}
                      >
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* 2. Emp ID with CodeBadge */}
                  <td
                    className={`sticky left-[140px] z-20 p-0 text-center border-r border-gray-200 w-[64px] min-w-[64px] max-w-[64px] ${
                      isHighLate ? "bg-red-50" : "bg-white"
                    }`}
                  >
                    <CodeBadge code={row.code} />
                  </td>

                  {/* 3. Daily status full-fill boxes (compact size, text-[9px]) */}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    if (day > daysInMonth) {
                      return (
                        <td
                          key={day}
                          className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"
                        ></td>
                      );
                    }

                    const status = row.daily[day];
                    const rawInfo = row.rawDaily[day];
                    const hasStatus = !!status && status !== "-";
                    const isDiscrepancy =
                      Boolean(rawInfo?.discItem) ||
                      status === "HD" ||
                      (status === "A" && !rawInfo?.isSunday);

                    const cellBg = hasStatus
                      ? STATUS_UI[status] || "bg-gray-600 text-white font-bold"
                      : "bg-white text-gray-300";

                    const rawRecordObj = typeof rawInfo?.rawRecord === "object" ? rawInfo.rawRecord : null;
                    const dbPunchIn = rawRecordObj?.punch_in_time || rawRecordObj?.in_time || rawInfo?.discItem?.punch_in_time || null;
                    const dbPunchOut = rawRecordObj?.punch_out_time || rawRecordObj?.out_time || rawInfo?.discItem?.punch_out_time || null;

                    const cellData = {
                      employee_id: row.id,
                      employee_name: row.name,
                      employee_code: row.code,
                      department: row.dept,
                      attendance_date: rawInfo?.dateStr,
                      punch_in_time: dbPunchIn,
                      punch_out_time: dbPunchOut,
                      status: rawInfo?.discItem?.status || rawInfo?.rawStatus || status || "P",
                      approved: Boolean(rawRecordObj?.approved || rawInfo?.discItem?.approved),
                      reason: rawInfo?.discItem?.reason || (isDiscrepancy ? (status === "HD" ? "Forgot to Punch Out" : "Absent") : ""),
                      remarks: rawInfo?.discItem?.remarks || "",
                    };

                    return (
                      <td
                        key={day}
                        onClick={() => onCellClick?.(cellData)}
                        className={`p-0 border-r border-gray-200 text-center min-w-[22px] h-[18px] transition-transform active:scale-95 cursor-pointer ${cellBg} ${
                          isDiscrepancy ? "relative ring-1 ring-inset ring-rose-500" : ""
                        }`}
                        title={`${row.name} - Day ${day}: Status = ${status}${
                          isDiscrepancy ? " [Discrepancy - Click to regularize]" : ""
                        }`}
                      >
                        <span className="w-full h-full flex items-center justify-center text-[9px] font-bold select-none leading-none relative">
                          {hasStatus ? status : ""}
                          {isDiscrepancy && (
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                          )}
                        </span>
                      </td>
                    );
                  })}

                  {/* 4. Totals — AFTER dates */}
                  <td className="p-0 text-center font-bold text-emerald-600 bg-emerald-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">
                    {row.totals.P}
                  </td>
                  <td className="p-0 text-center font-bold text-red-600 bg-red-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">
                    {row.totals.A}
                  </td>
                  <td className="p-0 text-center font-bold text-blue-600 bg-blue-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">
                    {row.totals.L}
                  </td>
                  <td className="p-0 text-center font-bold text-slate-500 bg-slate-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">
                    {row.totals.WO}
                  </td>
                  <td className="p-0 text-center font-bold text-pink-600 bg-pink-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">
                    {row.totals.H}
                  </td>
                  <td
                    className={`p-0 text-center font-bold border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px] ${
                      isHighLate ? "bg-red-200 text-red-800" : "bg-amber-50/40 text-amber-600"
                    }`}
                  >
                    {row.totals.L1}
                  </td>
                  <td
                    className={`p-0 text-center font-bold border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px] ${
                      isHighLate ? "bg-red-200 text-red-800" : "bg-indigo-50/40 text-indigo-600"
                    }`}
                  >
                    {row.totals.L2}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* TOTALS FOOTER ROWS */}
          {processedRows.length > 0 && (
            <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_4px_rgba(0,0,0,0.08)]">
              {/* 1. Total Present Row */}
              <tr className="bg-emerald-50/95 border-t-2 border-emerald-300">
                <td className="sticky left-0 z-40 bg-emerald-100/95 px-2 py-0.5 border-r border-emerald-300 font-bold text-[10.5px] text-emerald-800 w-[140px] min-w-[140px] max-w-[140px] truncate">
                  Total Present
                </td>
                <td className="sticky left-[140px] z-40 bg-emerald-100/95 border-r border-emerald-300 text-center font-bold text-[10px] text-emerald-800 w-[64px] min-w-[64px] max-w-[64px]">
                  {summary.P}
                </td>
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  if (day > daysInMonth) {
                    return (
                      <td
                        key={i}
                        className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"
                      ></td>
                    );
                  }
                  const count = dailyCounts[day]?.P || 0;
                  return (
                    <td
                      key={i}
                      className="p-0 text-center font-bold text-emerald-700 bg-emerald-100/80 border-r border-emerald-200 text-[10px] min-w-[22px] h-[20px]"
                      title={`Day ${day}: ${count} Present`}
                    >
                      {count}
                    </td>
                  );
                })}
                <td className="p-0 text-center font-bold text-emerald-800 bg-emerald-200 border-r border-emerald-300 text-[10.5px] min-w-[26px]">
                  {summary.P}
                </td>
                <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center font-bold text-amber-700 bg-amber-100/60 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  {summary.L1}
                </td>
                <td className="p-0 text-center font-bold text-indigo-700 bg-indigo-100/60 border-r border-emerald-200 text-[10px] min-w-[26px]">
                  {summary.L2}
                </td>
              </tr>

              {/* 2. Total Absent Row */}
              <tr className="bg-red-50/95 border-t border-red-200">
                <td className="sticky left-0 z-40 bg-red-100/95 px-2 py-0.5 border-r border-red-200 font-bold text-[10.5px] text-red-800 w-[140px] min-w-[140px] max-w-[140px] truncate">
                  Total Absent
                </td>
                <td className="sticky left-[140px] z-40 bg-red-100/95 border-r border-red-200 text-center font-bold text-[10px] text-red-800 w-[64px] min-w-[64px] max-w-[64px]">
                  {summary.A}
                </td>
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  if (day > daysInMonth) {
                    return (
                      <td
                        key={i}
                        className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"
                      ></td>
                    );
                  }
                  const count = dailyCounts[day]?.A || 0;
                  return (
                    <td
                      key={i}
                      className="p-0 text-center font-bold text-red-700 bg-red-100/80 border-r border-red-200 text-[10px] min-w-[22px] h-[20px]"
                      title={`Day ${day}: ${count} Absent`}
                    >
                      {count}
                    </td>
                  );
                })}
                <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center font-bold text-red-800 bg-red-200 border-r border-red-300 text-[10.5px] min-w-[26px]">
                  {summary.A}
                </td>
                <td className="p-0 text-center font-bold text-blue-700 bg-blue-100/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  {summary.L}
                </td>
                <td className="p-0 text-center font-bold text-slate-700 bg-slate-100/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  {summary.WO}
                </td>
                <td className="p-0 text-center font-bold text-pink-700 bg-pink-100/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  {summary.H}
                </td>
                <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  —
                </td>
                <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">
                  —
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}



import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";
import UnivarsalFilter from "../../../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import ERPPrintPreview from "../../../../../components/Reusable/ERPPrintPreview";
import { showToast } from "../../../../../components/Reusable/alert";
import { fetchAttendanceRegister, syncAttendanceNow } from "../../../../../utils/api";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption"; // 👈 same hook used across Audit / EmployeeMaster
import TableExport from "../../../../../components/Reusable/table/TableExport";

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");
const getMonthName = (monthNum, year) => new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });

// --- SOLID THEME STATUS BADGES (High contrast, clearly visible fill & text) ---
const STATUS_UI = {
  P: "bg-[#C6F6D5] text-[#14532D] font-bold", // Present
  H: "bg-[#047857] text-white font-bold",      // Holiday
  FH: "bg-[#86efac] text-[#065f46] font-bold", // Work From Home
  A: "bg-[#DC2626] text-white font-bold",      // Absent
  L1: "bg-[#FEEBC8] text-[#78350F] font-bold", // Late 1 (Casual)
  L2: "bg-[#FBD38D] text-[#542605] font-bold", // Late 2 (Privilege)
  HD: "bg-[#FEFCBF] text-[#713F12] font-bold", // Half Day
  WO: "bg-[#E2E8F0] text-[#1E293B] font-bold", // Week Off
  EL: "bg-[#BAE6FD] text-[#0C4A6E] font-bold", // Earned Leave
  D: "bg-[#E9D8FD] text-[#581C87] font-bold",  // WFS
  d: "bg-[#E9D8FD] text-[#581C87] font-bold",  // WFS
  SH: "bg-orange-500 text-white font-bold",
  WOT: "bg-purple-600 text-white font-bold",
  HOT: "bg-amber-600 text-white font-bold",
  CL: "bg-teal-600 text-white font-bold",
  SL: "bg-blue-600 text-white font-bold",
  PL: "bg-violet-600 text-white font-bold",
  WFS: "bg-[#E9D8FD] text-[#581C87] font-bold",
};

// --- CODE BADGE COMPONENT ---
const CodeBadge = ({ code }) => (
  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs tracking-wider leading-none">
    {code || "—"}
  </span>
);

const mapStatus = (dbStatus) => {
  if (!dbStatus) return '-';
  // normalize: upper + extra spaces hatao
  const key = dbStatus.toString().toUpperCase().replace(/\s+/g, ' ').trim();
  const map = {
    'PRESENT': 'P',
    'L1': 'L1',
    'L2': 'L2',
    'HALF_DAY': 'HD',
    'HALFDAY': 'HD',
    'SHORT': 'SH',
    'ABSENT': 'A',
    'WEEK OFF': 'WO',
    'WEEKOFF': 'WO',            // dono spelling cover
    'WEEK OFF OT': 'WOT',
    'WEEKOFF OT': 'WOT',
    'HOLIDAYS': 'H',
    'HOLIDAY': 'H',
    'HOLIDAY OT': 'HOT',
    'WFH': 'FH',
    'WORK FROM HOME': 'FH',
    'HOME': 'FH',
    'WFS': 'D',
    'WORK FROM SITE': 'D',
    'SITE': 'D',
    'CL': 'CL', 'SL': 'SL', 'PL': 'PL', 'EL': 'EL',
    'EARNED LEAVE': 'EL',
  };
  return map[key] || dbStatus;
};

const AttendanceRegister = ({ tab, module, onOpenPage }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "code", direction: "asc" });
  const [syncing, setSyncing] = useState(false);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  // 👇 GenericFilter-compatible shape: from_date/to_date instead of month/year
  const today = new Date();
  const defaultFrom = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const defaultTo = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(getDaysInMonth(today.getMonth() + 1, today.getFullYear()))}`;

  const [filters, setFilters] = useState({
    from_date: defaultFrom,
    to_date: defaultTo,
    employee_id: "",
    employee_name: "",
  });

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 👇 same hook used everywhere else (Audit Master, Employee Master) — already returns
  // { employees: [...], department: [...], modules: [...], area: [...] } shape
  const { options } = useGroupOptions();

  // month/year derive karo from_date se (GenericFilter isi field pe likhta hai)
  const { month, year } = useMemo(() => {
    const d = filters.from_date ? new Date(filters.from_date) : today;
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }, [filters.from_date]);

  const daysInMonth = useMemo(() => getDaysInMonth(month, year), [month, year]);

  // Local Search Handling + employee filter + sorting
  const list = useMemo(() => {
    let result = [...tableData];

    // 👇 EmployeeMaster.jsx jaisa hi pattern — name se partial/case-insensitive match
    if (filters.employee_name) {
      const name = filters.employee_name.toLowerCase();
      result = result.filter((emp) =>
        (emp.name || "").toLowerCase().includes(name)
      );
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(lower) ||
        emp.code.toLowerCase().includes(lower)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key] || "").toString();
        const valB = (b[sortConfig.key] || "").toString();
        const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [tableData, searchTerm, filters.employee_name, sortConfig]);

  // 👇 FIX: summary now computed AFTER `list` exists, off the finished/filtered list —
  // not nested inside the list useMemo (that referenced `list` before it was defined).
  const summary = useMemo(() => {
    return list.reduce((acc, row) => {
      acc.P += row.totals.P || 0;
      acc.A += row.totals.A || 0;
      acc.L += row.totals.L || 0;
      acc.WO += row.totals.WO || 0;
      acc.H += row.totals.H || 0;
      acc.L1 += row.totals.L1 || 0;
      acc.L2 += row.totals.L2 || 0;
      return acc;
    }, { P: 0, A: 0, L: 0, WO: 0, H: 0, L1: 0, L2: 0 });
  }, [list]);

  // Daily Present & Absent counts per column (Day 1 to 31)
  const dailyCounts = useMemo(() => {
    const counts = {};
    for (let d = 1; d <= 31; d++) {
      counts[d] = { P: 0, A: 0, L: 0, WO: 0, H: 0, L1: 0, L2: 0 };
    }
    list.forEach((row) => {
      for (let d = 1; d <= 31; d++) {
        const status = row.daily?.[d];
        if (!status || status === "-") continue;
        if (["P", "L1", "L2", "HD", "SH", "D", "d", "FH", "WFS", "WFH"].includes(status)) {
          counts[d].P++;
        } else if (status === "A") {
          counts[d].A++;
        } else if (["CL", "SL", "PL", "EL", "L"].includes(status)) {
          counts[d].L++;
        } else if (status === "WO" || status === "WOT") {
          counts[d].WO++;
        } else if (status === "H" || status === "HOT") {
          counts[d].H++;
        }
        if (status === "L1") counts[d].L1++;
        if (status === "L2") counts[d].L2++;
      }
    });
    return counts;
  }, [list]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAttendanceRegister(month, year);
      if (res.success) {
        const empMap = {};
        res.data.forEach(row => {
          const empId = row.employee_id;
          if (!empMap[empId]) {
            empMap[empId] = {
              id: empId,
              code: row.employee_code,
              name: [
                row.first_name?.trim(),
                row.middle_name?.trim(),
                row.last_name?.trim()
              ]
                .filter(v => v)
                .join(" "),
              dept: row.department,
              desig: row.designation,
              daily: {},
              totals: { P: 0, A: 0, L: 0, WO: 0, H: 0, L1: 0, L2: 0 }
            };
          }
          const dateStr = String(row.attendance_date).substring(0, 10);
          const day = parseInt(dateStr.split('-')[2], 10);
          const status = mapStatus(row.status);
          const rawStatus = (row.status || '').toString().toUpperCase().trim();

          empMap[empId].daily[day] = status;

          if (status === 'L1') empMap[empId].totals.L1++;
          if (status === 'L2') empMap[empId].totals.L2++;

          if (['WFH', 'WORK FROM HOME', 'HOME', 'WFS', 'WORK FROM SITE', 'SITE'].includes(rawStatus) || ['P', 'L1', 'L2', 'HD', 'SH', 'D', 'd'].includes(status)) {
            empMap[empId].totals.P++;
          } else if (status === 'A') {
            empMap[empId].totals.A++;
          } else if (['CL', 'SL', 'PL', 'EL', 'L'].includes(status)) {
            empMap[empId].totals.L++;
          } else if (status === 'WO') {
            empMap[empId].totals.WO++;
          } else if (status === 'H') {
            empMap[empId].totals.H++;
          }
        });
        setTableData(Object.values(empMap));
      }
    } catch (e) {
      console.error("Register fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const monthStr = `${year}-${pad(month)}`;
      const res = await syncAttendanceNow(monthStr);
      if (res?.success) {
        showToast({ icon: "success", title: res.message || "Attendance synced" });
        await loadData();
      } else {
        showToast({ icon: "error", title: "Sync failed" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Sync failed: " + err.message });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  // --- EXPORT HANDLER ---
  const handleExportExcel = () => {
    if (list.length === 0) return showToast({ icon: "warning", title: "No data to export" });
    showToast({ icon: "success", title: "Exporting to Excel…" });
  };

  /* =========================================================
     PRINT PREVIEW
  ========================================================= */
  if (showPreview) {
    const monthName = getMonthName(month, year);
    return (
      <ERPPrintPreview
        title={`Attendance Register - ${monthName} ${year}`}
        sections={[{
          type: "custom",
          render: () => (
            <div className="w-full">
              <style>{`
                 @media print { 
                   @page { size: landscape; margin: 8mm; } 
                   .print-table th, .print-table td { border: 1px solid #000; padding: 4px; text-align: center; }
                   .print-table th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                 }
               `}</style>

              <table className="print-table w-full border-collapse text-[10px] font-sans">
                <thead>
                  <tr>
                    {/* 1. Employee */}
                    <th className="text-left w-36">Employee</th>
                    {/* 2. Emp ID */}
                    <th className="w-16">Emp ID</th>
                    {/* 3. Dates */}
                    {Array.from({ length: 31 }).map((_, i) => (
                      <th key={i} className="w-5">{i + 1}</th>
                    ))}
                    {/* 4. Totals — AFTER dates */}
                    <th>P</th><th>A</th><th>L</th><th>WO</th><th>H</th><th>L1</th><th>L2</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, idx) => (
                    <tr key={idx}>
                      {/* 1. Employee */}
                      <td className="text-left font-medium">
                        {row.name}
                      </td>
                      {/* 2. Emp ID */}
                      <td className="font-bold">
                        {row.code}
                      </td>
                      {/* 3. Dates */}
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1;
                        const status = row.daily[day];
                        const code = day > daysInMonth ? "-" : (status || "-");
                        return (
                          <td key={i} className={`font-bold ${code === 'A' ? 'text-red-600' : ''}`}>
                            {code}
                          </td>
                        )
                      })}
                      {/* 4. Totals — AFTER dates */}
                      <td>{row.totals.P}</td>
                      <td>{row.totals.A}</td>
                      <td>{row.totals.L}</td>
                      <td>{row.totals.WO}</td>
                      <td>{row.totals.H}</td>
                      <td>{row.totals.L1}</td>
                      <td>{row.totals.L2}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-emerald-50">
                    <td className="text-left font-bold text-emerald-800">Total Present</td>
                    <td className="font-bold text-emerald-800">{summary.P}</td>
                    {Array.from({ length: 31 }).map((_, i) => {
                      const day = i + 1;
                      const count = day > daysInMonth ? "-" : (dailyCounts[day]?.P || 0);
                      return (
                        <td key={i} className="font-bold text-emerald-700">
                          {count}
                        </td>
                      );
                    })}
                    <td className="font-bold text-emerald-800">{summary.P}</td>
                    <td>-</td><td>-</td><td>-</td><td>-</td>
                    <td className="font-bold text-amber-700">{summary.L1}</td>
                    <td className="font-bold text-indigo-700">{summary.L2}</td>
                  </tr>
                  <tr className="font-bold bg-red-50">
                    <td className="text-left font-bold text-red-800">Total Absent</td>
                    <td className="font-bold text-red-800">{summary.A}</td>
                    {Array.from({ length: 31 }).map((_, i) => {
                      const day = i + 1;
                      const count = day > daysInMonth ? "-" : (dailyCounts[day]?.A || 0);
                      return (
                        <td key={i} className="font-bold text-red-700">
                          {count}
                        </td>
                      );
                    })}
                    <td>-</td>
                    <td className="font-bold text-red-800">{summary.A}</td>
                    <td className="font-bold text-blue-700">{summary.L}</td>
                    <td className="font-bold text-slate-700">{summary.WO}</td>
                    <td className="font-bold text-pink-700">{summary.H}</td>
                    <td>-</td><td>-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        }]}
        onBack={() => setShowPreview(false)}
        logo="/finaman-logo.png"
      />
    );
  }


  /* =========================================================
     MAIN COMPONENT UI
  ========================================================= */
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">

      {/* CUSTOM HEADER */}
      <div className="flex-none bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title & Count */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h1 className="text-lg font-bold text-gray-800">
            Attendance Register ({getMonthName(month, year)} {year})
          </h1>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">
            {list.length} Records
          </span>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center group shrink-0">
            <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none group-focus-within:text-blue-500" />
            <input
              value={searchTerm}
              placeholder="Search…"
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 pl-7 pr-6 text-xs bg-slate-50 border border-slate-200 rounded-md w-[185px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
            {searchTerm && (
              <X size={12} className="absolute right-2 text-slate-400 cursor-pointer hover:text-slate-700" onClick={() => setSearchTerm("")} />
            )}
          </div>

          <TableExport
            title={`Attendance Register ${getMonthName(month, year)} ${year}`}
            columns={[
              { key: "name", label: "Employee" },
              { key: "code", label: "Emp ID" },
            ]}
            data={list}
            visibleColumns={{ name: true, code: true }}
          />

          <button
            onClick={() => setShowFilter(p => !p)}
            title="Filters"
            className={`shrink-0 h-7 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none ${showFilter
              ? "bg-amber-100 border-amber-400 text-amber-700"
              : "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
              }`}
          >
            <Filter size={12} />
          </button>

          {/* ✅ NAYA — Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-1.5 px-3 h-7 rounded-md border text-[12px] font-semibold transition-colors
    ${syncing
                ? 'bg-emerald-50 border-emerald-200 text-emerald-400 cursor-not-allowed'
                : 'bg-emerald-400 border-emerald-500 text-white hover:bg-emerald-700'}`}
            title="Sync attendance & recalculate"
          >
            <svg
              className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>



        </div>
      </div>

      {showFilter && (
        <div className="flex-none">
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            visibleFields={["filterType", "employee"]}
            options={options}
            onApply={() => showToast({ icon: "success", title: "Filters Applied" })}
            onClear={() => {
              setSearchTerm("");
              showToast({ icon: "info", title: "Filters Cleared" });
            }}
          />
        </div>
      )
      }

      {/* MAIN GRID */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative z-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-left table-auto">

            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <tr className="bg-slate-50 border-b border-gray-300">

                {/* 1. Employee Info — sticky left with sort */}
                <th
                  className="sticky left-0 z-40 bg-slate-50 px-2 py-1 border-r border-gray-200 w-[140px] min-w-[140px] max-w-[140px] text-[10.5px] font-bold text-gray-600 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("name")}
                  title="Sort by Employee Name"
                >
                  <div className="flex items-center justify-between">
                    <span>Employee</span>
                    <i
                      className={`pi text-[9px] ${sortConfig.key === 'name'
                        ? (sortConfig.direction === 'asc'
                          ? 'pi-sort-amount-up text-blue-600'
                          : 'pi-sort-amount-down text-blue-600')
                        : 'pi-sort-alt text-gray-400'
                        }`}
                    ></i>
                  </div>
                </th>

                {/* 2. Emp ID Column with Sorting */}
                <th
                  className="p-0.5 border-r border-gray-200 bg-slate-50 text-[10.5px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none w-[64px] min-w-[64px] max-w-[64px]"
                  onClick={() => handleSort("code")}
                  title="Sort by Emp ID"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Emp ID</span>
                    <i className={`pi text-[9px] ${sortConfig.key === 'code'
                      ? (sortConfig.direction === 'asc' ? 'pi-sort-amount-up text-blue-600' : 'pi-sort-amount-down text-blue-600')
                      : 'pi-sort-alt text-gray-400'
                      }`}></i>
                  </div>
                </th>

                {/* 3. Date columns */}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(year, month - 1, day);
                  const isSun = day <= daysInMonth && dateObj.getDay() === 0;

                  return (
                    <th key={day} className={`p-0 text-center border-r border-gray-200 min-w-[22px] ${day > daysInMonth ? 'bg-gray-100' : ''}`}>
                      <div className="flex flex-col items-center justify-center leading-none py-0.5">
                        <span className="text-[7.5px] text-gray-400 font-medium uppercase">
                          {day <= daysInMonth ? dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }) : "-"}
                        </span>
                        <span className={`text-[10px] font-bold mt-0.5 ${isSun ? 'text-red-500' : 'text-gray-700'}`}>
                          {day <= daysInMonth ? day : "-"}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* 4. Totals — AFTER dates */}
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-emerald-600 uppercase min-w-[26px]">P</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-red-500 uppercase min-w-[26px]">A</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-blue-500 uppercase min-w-[26px]">L</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-slate-500 uppercase min-w-[26px]">WO</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-pink-500 uppercase min-w-[26px]">H</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-amber-500 uppercase min-w-[26px]">L1</th>
                <th className="p-0 text-center border-r border-gray-200 bg-slate-50 text-[9.5px] font-bold text-indigo-600 uppercase min-w-[26px]">L2</th>

              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {list.length > 0 ? list.map((row) => {
                const isHighLate = (row.totals.L1 || 0) + (row.totals.L2 || 0) > 9;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-300 transition-colors cursor-pointer ${isHighLate ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50/80"
                      }`}
                    onClick={() => {
                      const empId = row.id || row.employee_id;
                      const code = row.code || row.employee_code || "";
                      const name = row.name || row.employee_name || "";
                      const dept = row.dept || row.department || "";
                      if (onOpenPage) {
                        onOpenPage({
                          masmnu_id: 634,
                          bar_name: "Monthly Attendance Summary",
                          appl_name: "MonthlyAttendanceSummaryReport",
                          appl_type: "R",
                          icon_name: "FaCalendarAlt",
                          params: {
                            employee_id: empId,
                            month,
                            year,
                            employee_code: code,
                            employee_name: name,
                            department: dept,
                          },
                        });
                      } else {
                        navigate(`/app?page=MonthlyAttendanceSummaryReport&employee_id=${empId}&month=${month}&year=${year}&employee_code=${encodeURIComponent(code)}&employee_name=${encodeURIComponent(name)}&department=${encodeURIComponent(dept)}`);
                      }
                    }}
                    title={`View Monthly Attendance for ${row.name}`}
                  >
                    {/* 1. Employee Info — sticky left */}
                    <td className={`sticky left-0 z-20 px-2 py-0 border-r border-gray-200 shadow-[1px_0_3px_rgba(0,0,0,0.02)] w-[140px] min-w-[140px] max-w-[140px] ${isHighLate ? "bg-red-200" : "bg-white"}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-gray-800 text-[11px] truncate leading-tight" title={row.name}>
                          {row.name}
                        </span>
                        {isHighLate && (
                          <span
                            className="shrink-0 text-[8.5px] font-bold uppercase tracking-wide text-red-700 bg-red-200 px-1 py-0.1 rounded"
                            title={`${row.totals.L1 + row.totals.L2} late marks this month`}
                          >
                            Late
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Emp ID with CodeBadge */}
                    <td className={`p-0 text-center border-r border-gray-200 w-[64px] min-w-[64px] max-w-[64px] ${isHighLate ? "bg-red-50" : "bg-white"}`}>
                      <CodeBadge code={row.code} />
                    </td>

                    {/* 3. Daily status full-fill boxes (compact size, text-[10px]) */}
                    {Array.from({ length: 31 }).map((_, i) => {
                      const day = i + 1;
                      if (day > daysInMonth) return <td key={day} className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"></td>;

                      const status = row.daily[day];
                      const hasStatus = !!status && status !== "-";
                      const cellBg = hasStatus ? (STATUS_UI[status] || "bg-gray-600 text-white font-bold") : "bg-white text-gray-300";

                      return (
                        <td key={day} className={`p-0 border-r border-gray-200 text-center min-w-[22px] h-[18px] ${cellBg}`}>
                          <span className="w-full h-full flex items-center justify-center text-[9px] font-bold select-none leading-none">
                            {hasStatus ? status : ""}
                          </span>
                        </td>
                      );
                    })}

                    {/* 4. Totals — AFTER dates */}
                    <td className="p-0 text-center font-bold text-emerald-600 bg-emerald-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">{row.totals.P}</td>
                    <td className="p-0 text-center font-bold text-red-600 bg-red-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">{row.totals.A}</td>
                    <td className="p-0 text-center font-bold text-blue-600 bg-blue-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">{row.totals.L}</td>
                    <td className="p-0 text-center font-bold text-slate-500 bg-slate-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">{row.totals.WO}</td>
                    <td className="p-0 text-center font-bold text-pink-600 bg-pink-50/40 border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px]">{row.totals.H}</td>
                    <td className={`p-0 text-center font-bold border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px] ${isHighLate ? "bg-red-200 text-red-800" : "bg-amber-50/40 text-amber-600"}`}>{row.totals.L1}</td>
                    <td className={`p-0 text-center font-bold border-r border-gray-200 text-[10.5px] leading-tight min-w-[26px] ${isHighLate ? "bg-red-200 text-red-800" : "bg-indigo-50/40 text-indigo-600"}`}>{row.totals.L2}</td>

                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={40} className="py-10 text-center text-gray-400">
                    <i className="pi pi-inbox text-4xl mb-2"></i>
                    <p>No records found</p>
                  </td>
                </tr>
              )}
            </tbody>

            {/* 👇 TOTALS FOOTER ROWS (sticky at bottom of the scroll container) */}
            {list.length > 0 && (
              <tfoot className=" bottom-0 z-30 shadow-[0_-2px_4px_rgba(0,0,0,0.08)]">
                {/* 1. Total Present Row */}
                <tr className="bg-emerald-50/95 border-t-2 border-emerald-300">
                  <td className=" left-0 z-40 bg-emerald-100/95 px-2 py-0.5 border-r border-emerald-300 font-bold text-[10.5px] text-emerald-800 w-[140px] min-w-[140px] max-w-[140px] truncate">
                    Total Present
                  </td>
                  <td className="bg-emerald-100/95 border-r border-emerald-300 text-center font-bold text-[10px] text-emerald-800 w-[64px] min-w-[64px] max-w-[64px]">
                    {summary.P}
                  </td>
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    if (day > daysInMonth) {
                      return <td key={i} className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"></td>;
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
                  {/* <td className="p-0 text-center font-bold text-emerald-800 bg-emerald-200 border-r border-emerald-300 text-[10.5px] min-w-[26px]">{summary.P}</td>
                  <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center text-slate-400 bg-emerald-50/50 border-r border-emerald-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center font-bold text-amber-700 bg-amber-100/60 border-r border-emerald-200 text-[10px] min-w-[26px]">{summary.L1}</td>
                  <td className="p-0 text-center font-bold text-indigo-700 bg-indigo-100/60 border-r border-emerald-200 text-[10px] min-w-[26px]">{summary.L2}</td> */}
                </tr>

                {/* 2. Total Absent Row */}
                <tr className="bg-red-50/95 border-t border-red-200">
                  <td className="sticky left-0 z-40 bg-red-100/95 px-2 py-0.5 border-r border-red-300 font-bold text-[10.5px] text-red-800 w-[140px] min-w-[140px] max-w-[140px] truncate">
                    Total Absent
                  </td>
                  <td className="bg-red-100/95 border-r border-red-300 text-center font-bold text-[10px] text-red-800 w-[64px] min-w-[64px] max-w-[64px]">
                    {summary.A}
                  </td>
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    if (day > daysInMonth) {
                      return <td key={i} className="bg-gray-100/70 border-r border-gray-200 min-w-[22px]"></td>;
                    }
                    const count = dailyCounts[day]?.A || 0;
                    return (
                      <td
                        key={i}
                        className={`p-0 text-center font-bold border-r border-red-200 text-[10px] min-w-[22px] h-[20px] ${count > 0 ? "text-red-700 bg-red-100/80" : "text-slate-400 bg-red-50/40"
                          }`}
                        title={`Day ${day}: ${count} Absent`}
                      >
                        {count}
                      </td>
                    );
                  })}
                  {/* <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center font-bold text-red-800 bg-red-200 border-r border-red-300 text-[10.5px] min-w-[26px]">{summary.A}</td>
                  <td className="p-0 text-center font-bold text-blue-700 bg-blue-100 border-r border-red-200 text-[10px] min-w-[26px]">{summary.L}</td>
                  <td className="p-0 text-center font-bold text-slate-700 bg-slate-200 border-r border-red-200 text-[10px] min-w-[26px]">{summary.WO}</td>
                  <td className="p-0 text-center font-bold text-pink-700 bg-pink-100 border-r border-red-200 text-[10px] min-w-[26px]">{summary.H}</td>
                  <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">—</td>
                  <td className="p-0 text-center text-slate-400 bg-red-50/50 border-r border-red-200 text-[10px] min-w-[26px]">—</td> */}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div >
  );
};

export default AttendanceRegister;
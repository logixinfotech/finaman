import { useState, useMemo, useEffect, useCallback } from "react";
import AttendanceRegisterFilter from "./AttendanceFilter";
import ERPPrintPreview from "../../../../../components/Reusable/ERPPrintPreview";
import { showToast } from "../../../../../components/Reusable/alert";
import { fetchAttendanceRegister } from "../../../../../utils/api";

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");
const getMonthName = (monthNum, year) => new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });

// --- PREMIUM STATUS BADGES (For UI) ---
const STATUS_UI = {
  P: "bg-emerald-100 text-emerald-700 border-emerald-200",
  HD: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SH: "bg-yellow-200 text-yellow-800 border-yellow-300",
  A: "bg-red-100 text-red-700 border-red-200",
  WO: "bg-slate-100 text-slate-500 border-slate-200",
  WOT: "bg-violet-100 text-violet-700 border-violet-200",
  H: "bg-pink-100 text-pink-700 border-pink-200",
  HOT: "bg-orange-100 text-orange-700 border-orange-200",
  CL: "bg-amber-100 text-amber-700 border-amber-200",
  SL: "bg-blue-100 text-blue-700 border-blue-200",
  PL: "bg-indigo-100 text-indigo-700 border-indigo-200",
  EL: "bg-teal-100 text-teal-700 border-teal-200",
};

const mapStatus = (dbStatus) => {
  const map = {
    'PRESENT': 'P',
    'HALF_DAY': 'HD',
    'SHORT': 'SH',
    'ABSENT': 'A',
    'WEEKOFF': 'WO',
    'WEEKOFF OT': 'WOT',
    'HOLIDAY': 'H',
    'HOLIDAY OT': 'HOT',
    'CL': 'CL',
    'SL': 'SL',
    'PL': 'PL',
    'EL': 'EL',
  };
  return map[dbStatus] || dbStatus || '-';
};

const AttendanceRegister = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    employee_id: "",
  });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysInMonth = useMemo(() => getDaysInMonth(filters.month, filters.year), [filters.month, filters.year]);

  // Local Search Handling
  const list = useMemo(() => {
    if (!searchTerm) return tableData;
    const lower = searchTerm.toLowerCase();
    return tableData.filter(emp =>
      emp.name.toLowerCase().includes(lower) ||
      emp.code.toLowerCase().includes(lower)
    );
  }, [tableData, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAttendanceRegister(filters.month, filters.year);
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
              totals: { P: 0, A: 0, L: 0, WO: 0, H: 0, HOT: 0, WOT: 0, OT: 0.00 }
            };
          }
          const dateStr = String(row.attendance_date).substring(0, 10);
          const day = parseInt(dateStr.split('-')[2], 10);
          const status = mapStatus(row.status);

          empMap[empId].daily[day] = status;

          if (['P', 'HD', 'SH'].includes(status)) empMap[empId].totals.P++;
          else if (status === 'A') empMap[empId].totals.A++;
          else if (['CL', 'SL', 'PL', 'EL', 'L'].includes(status)) empMap[empId].totals.L++;
          else if (status === 'WO') empMap[empId].totals.WO++;
          else if (status === 'H') empMap[empId].totals.H++;
          else if (status === 'HOT') empMap[empId].totals.HOT++;
          else if (status === 'WOT') empMap[empId].totals.WOT++;

          if (parseFloat(row.overtime_hours) > 0) {
            empMap[empId].totals.OT = parseFloat((empMap[empId].totals.OT + parseFloat(row.overtime_hours)).toFixed(2));
          }
        });
        setTableData(Object.values(empMap));
      }
    } catch (e) {
      console.error("Register fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year]);

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
    const monthName = getMonthName(filters.month, filters.year);
    return (
      <ERPPrintPreview
        title={`Attendance Register - ${monthName} ${filters.year}`}
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
                    {/* 1. Employee Details */}
                    <th className="text-left w-48">Employee Details</th>
                    {/* 2. Totals — BEFORE dates */}
                    <th>P</th><th>A</th><th>L</th><th>WO</th><th>H</th><th>HOT</th><th>WOT</th><th>OT Hrs</th>
                    {/* 3. Dates */}
                    {Array.from({ length: 31 }).map((_, i) => (
                      <th key={i} className="w-5">{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, idx) => (
                    <tr key={idx}>
                      {/* 1. Employee */}
                      <td className="text-left">
                        <span className="font-bold">{row.code}</span> - {row.name}
                      </td>
                      {/* 2. Totals — BEFORE dates */}
                      <td>{row.totals.P}</td>
                      <td>{row.totals.A}</td>
                      <td>{row.totals.L}</td>
                      <td>{row.totals.WO}</td>
                      <td>{row.totals.H}</td>
                      <td>{row.totals.HOT}</td>
                      <td>{row.totals.WOT}</td>
                      <td>{row.totals.OT}</td>
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
                    </tr>
                  ))}
                </tbody>
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
            Attendance Register ({getMonthName(filters.month, filters.year)} {filters.year})
          </h1>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">
            {list.length} Records
          </span>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

          <button
            onClick={handleExportExcel}
            className="w-9 h-9 flex items-center justify-center rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors tooltip"
            title="Export Excel"
          >
            <i className="pi pi-file-excel"></i>
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors tooltip"
            title="Print Preview"
          >
            <i className="pi pi-print"></i>
          </button>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`w-9 h-9 flex items-center justify-center rounded-md border transition-colors ${showFilter ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            title="Filters"
          >
            <i className="pi pi-filter"></i>
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      {showFilter && (
        <div className="flex-none">
          <AttendanceRegisterFilter
            filters={filters}
            setFilters={setFilters}
            onApply={() => showToast({ icon: "success", title: "Filters Applied" })}
            onClear={() => {
              setSearchTerm("");
              showToast({ icon: "info", title: "Filters Cleared" });
            }}
          />
        </div>
      )}

      {/* MAIN GRID */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative z-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-left min-w-max">

            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <tr className="bg-slate-50 border-b border-gray-200">

                {/* 1. Employee Info — sticky left */}
                <th className="sticky left-0 z-40 bg-slate-50 p-3 border-r border-gray-200 w-[180px] text-xs font-bold text-gray-500 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                  Employee Info
                </th>

                {/* 2. Totals — BEFORE dates */}
                <th className="p-3 text-center border-r border-gray-200 bg-slate-50 text-[11px] font-bold text-emerald-600 uppercase">P</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-red-500 uppercase">A</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-blue-500 uppercase">L</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">WO</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-pink-500 uppercase">H</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-orange-500 uppercase">HOT</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-violet-500 uppercase border-r border-gray-200">WOT</th>
                <th className="p-3 text-center border-r border-gray-200  bg-slate-50 text-[11px] font-bold text-purple-500 uppercase border-r border-gray-200">OT Hrs</th>

                {/* 3. Date columns */}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(filters.year, filters.month - 1, day);
                  const isSun = day <= daysInMonth && dateObj.getDay() === 0;

                  return (
                    <th key={day} className={`p-2 text-center border-r border-gray-100 min-w-[42px] ${day > daysInMonth ? 'bg-gray-100' : ''}`}>
                      <div className="flex flex-col items-center justify-center leading-none gap-1">
                        <span className="text-[9px] text-gray-400 font-medium uppercase">
                          {day <= daysInMonth ? dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }) : "-"}
                        </span>
                        <span className={`text-[13px] font-bold ${isSun ? 'text-red-500' : 'text-gray-700'}`}>
                          {day <= daysInMonth ? day : "-"}
                        </span>
                      </div>
                    </th>
                  );
                })}

              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {list.length > 0 ? list.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

                  {/* 1. Employee Info — sticky left */}
                  <td className="sticky left-0 z-20 bg-white p-2 border-r border-gray-200 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col ml-1">
                      <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{row.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 rounded">
                          {row.code}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate">{row.desig}</span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Totals — BEFORE dates */}
                  <td className="p-2 text-center font-bold text-emerald-600 bg-emerald-50/50 border-r border-gray-200">{row.totals.P}</td>
                  <td className="p-2 text-center font-bold text-red-600 bg-red-50/50 border-r border-gray-200">{row.totals.A}</td>
                  <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/50 border-r border-gray-200">{row.totals.L}</td>
                  <td className="p-2 text-center font-bold text-slate-500 bg-slate-50/50 border-r border-gray-200">{row.totals.WO}</td>
                  <td className="p-2 text-center font-bold text-pink-600 bg-pink-50/50 border-r border-gray-200">{row.totals.H}</td>
                  <td className="p-2 text-center font-bold text-orange-600 bg-orange-50/50 border-r border-gray-200">{row.totals.HOT}</td>
                  <td className="p-2 text-center font-bold text-violet-600 bg-violet-50/50 border-r border-gray-200">{row.totals.WOT}</td>
                  <td className="p-2 text-center font-bold text-purple-600 bg-purple-50/50 border-r border-gray-200">{row.totals.OT}</td>

                  {/* 3. Daily status badges */}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    if (day > daysInMonth) return <td key={day} className="bg-gray-50 border-r border-gray-100"></td>;

                    const status = row.daily[day];
                    const badgeClass = STATUS_UI[status] || STATUS_UI.P;

                    return (
                      <td key={day} className="p-1 border-r border-gray-100 text-center">
                        <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded text-[11px] font-bold ${badgeClass}`}>
                          {status}
                        </div>
                      </td>
                    );
                  })}

                </tr>
              )) : (
                <tr>
                  <td colSpan={40} className="py-10 text-center text-gray-400">
                    <i className="pi pi-inbox text-4xl mb-2"></i>
                    <p>No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AttendanceRegister;
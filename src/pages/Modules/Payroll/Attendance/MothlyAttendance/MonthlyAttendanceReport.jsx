import { useState, useMemo, useEffect, useCallback } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import UnivarsalFilter from "../../../../../components/Reusable/Filter/UnivarsalFilter"
import {
  fetchMonthlyAttendanceSummary,
  fetchEmployeeAttendanceDetail
} from "../../../../../utils/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

const columns = [
  { key: "employee_code", label: "Employee Code" },
  {
  key: "employee_name",
  label: "Employee Name",
  render: (row) => {
    const parts = [
      row.Led_name || row.employee_name || "",
      row.Middle_name || "",
      row.Led_alias || "",
    ].filter(Boolean);
    return parts.join(" ");
  }
},
  { key: "department", label: "Department" },
  { key: "present_days", label: "Present Days" },
  { key: "absent_days", label: "Absent Days" },
  { key: "weekoff_days", label: "Week Off" },      // ADD
  { key: "holiday_days", label: "Holidays" },       // ADD
  { key: "leave_days", label: "Leave Days" },     // ADD
  { key: "total_days", label: "Total Days" }
];
 
// --- Detail View Dashboard ---
const EmployeeAttendanceDetail = ({ employee, employeeList, setSelectedEmployee, filters, setFilters, onBack }) => {
  const [activeFilter, setActiveFilter] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchEmployeeAttendanceDetail(
          employee.employee_id,
          filters.month,
          filters.year
        );
        if (res.success) setDetailData(res.data);
      } catch (e) {
        console.error("Detail fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employee.employee_id, filters.month, filters.year]);

  // --- Escape Key Feature ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  // --- Real Calendar Math ---
  const firstDayOfMonth = new Date(filters.year, filters.month - 1, 1).getDay();


  // --- 100% DYNAMIC SYNC ENGINE FOR MONTH CHANGES ---
  const kpi = detailData?.kpi || {};
  const days = detailData?.days || [];
  const daysInMonth = new Date(filters.year, filters.month, 0).getDate();

  // dayMap — din number se record dhundne ke liye
  const dayMap = useMemo(() => {
    const m = {};
    days.forEach(d => {
      const day = new Date(d.attendance_date).getDate();
      m[day] = d;
    });
    return m;
  }, [days]);

  // --- KPI Cards Configuration ---
  // REPLACE kpiCards array
  const kpiCards = [
    { key: "total", label: "TOTAL DAYS", value: kpi.total_days || daysInMonth, colorTheme: "text-slate-700 bg-slate-100 border-slate-200", clickable: false },
    { key: "present", label: "PRESENT", value: kpi.present_days || 0, colorTheme: "text-green-700 bg-green-50 border-green-200", clickable: true },
    { key: "absent", label: "ABSENT", value: kpi.absent_days || 0, colorTheme: "text-red-700 bg-red-50 border-red-200", clickable: true },
    { key: "leave", label: "LEAVE", value: kpi.leave_days || 0, colorTheme: "text-blue-700 bg-blue-50 border-blue-200", clickable: true },
    { key: "weekoff", label: "WEEK OFF", value: kpi.weekoff_days || 0, colorTheme: "text-purple-700 bg-purple-50 border-purple-200", clickable: true },    // EXISTING weekoff card ke BAAD add karo
    { key: "weekoff_ot", label: "WEEKOFF OT", value: kpi.weekoff_ot_days || 0, colorTheme: "text-violet-700 bg-violet-50 border-violet-200", clickable: true },
    { key: "holiday", label: "HOLIDAYS", value: kpi.holiday_days || 0, colorTheme: "text-pink-700 bg-pink-50 border-pink-200", clickable: true },
    { key: "half_day", label: "HALF DAY", value: kpi.half_day_count || 0, colorTheme: "text-yellow-700 bg-yellow-50 border-yellow-200", clickable: true },
    { key: "holiday_ot", label: "HOLIDAY OT", value: kpi.holiday_ot_days || 0, colorTheme: "text-orange-700 bg-orange-50 border-orange-200", clickable: true },
  ];


  // REPLACE chartData
  const chartData = [
    { name: "Present", value: kpi.present_days || 0, color: "#22c55e" },
    { name: "Absent", value: kpi.absent_days || 0, color: "#ef4444" },
    { name: "Leave", value: kpi.leave_days || 0, color: "#3b82f6" },
    { name: "Week Off", value: kpi.weekoff_days || 0, color: "#a855f7" },
    { name: "Weekoff OT", value: kpi.weekoff_ot_days || 0, color: "#7c3aed" },
    { name: "Holiday", value: kpi.holiday_days || 0, color: "#ec4899" },
    { name: "Holiday OT", value: kpi.holiday_ot_days || 0, color: "#f97316" },
  ].filter(d => d.value > 0);



  const handleFilterClick = (item) => {
    if (!item.clickable) return;
    setActiveFilter(activeFilter === item.key ? null : item.key);
  };

  const monthsList = [
    { v: 1, l: 'Jan' }, { v: 2, l: 'Feb' }, { v: 3, l: 'Mar' }, { v: 4, l: 'Apr' },
    { v: 5, l: 'May' }, { v: 6, l: 'Jun' }, { v: 7, l: 'Jul' }, { v: 8, l: 'Aug' },
    { v: 9, l: 'Sep' }, { v: 10, l: 'Oct' }, { v: 11, l: 'Nov' }, { v: 12, l: 'Dec' }
  ];
  const yearsList = [2024, 2025, 2026, 2027];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-500 text-sm animate-pulse">Loading attendance data...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-4 overflow-y-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 mr-4 hover:bg-slate-100 rounded-full transition-colors border shadow-sm">
            <i className="pi pi-arrow-left text-lg text-slate-600"></i>
          </button>

          <div className="flex flex-col border-l-2 border-slate-200 pl-5">
            <h2 className="text-xl font-bold text-slate-800">
              {employee.employee_name} ({employee.employee_code})
            </h2>
            <p className="text-sm text-slate-500 font-medium ml-1">{employee.department}</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-slate-500">Month / Year</div>
          <div className="text-xl text-blue-600 font-black tracking-wide">{filters.month} / {filters.year}</div>
        </div>
      </div>

      {/* --- Unified Top KPI Ribbon --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-4">
        {kpiCards.map((item) => (
          <div
            key={item.key}
            onClick={() => handleFilterClick(item)}
            className={`
              relative p-3 rounded-xl border-l-4 border-y border-r shadow-sm flex flex-col justify-between transition-all duration-200 select-none
              ${item.colorTheme}
              ${item.clickable ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : ""}
              ${activeFilter === item.key ? "ring-2 ring-offset-1 scale-105 shadow-lg z-10" : ""}
            `}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-1 leading-tight">{item.label}</div>
            <div className="text-2xl font-black">{item.value}</div>
            {activeFilter === item.key && (
              <div className="absolute top-1 right-2 text-xs opacity-70"><i className="pi pi-filter-fill"></i></div>
            )}
          </div>
        ))}
      </div>

      {/* --- Charts & Calendar Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left Column: Donut Chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm border lg:col-span-1 flex flex-col items-center">
          <h3 className="text-md font-bold text-slate-700 w-full mb-2 border-b pb-2">Attendance Distribution</h3>
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value, name) => [`${value} Days`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Real Monthly Heatmap */}
        <div className="bg-white p-3 rounded-lg shadow-sm border lg:col-span-2">

          <div className="flex flex-wrap justify-between items-center mb-2 border-b pb-1 ">
            <h3 className="text-lg font-bold text-slate-700">Daily Attendance Heatmap</h3>

            <div className="flex items-center gap-3">
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-md font-bold transition-all shadow-sm flex items-center gap-1 mr-2"
                >
                  <i className="pi pi-times"></i> Clear Filter
                </button>
              )}

              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="text-sm font-semibold text-slate-700 border border-slate-300 rounded p-1.5 focus:outline-none cursor-pointer hover:border-blue-500"
              >
                {monthsList.map(m => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>

              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="text-sm font-semibold text-slate-700 border border-slate-300 rounded p-1.5 focus:outline-none cursor-pointer hover:border-blue-500"
              >
                {yearsList.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 ">
            {/* Days of week Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase ">{day}</div>
            ))}

            {/* Blank spaces */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="h-12"></div>
            ))}

            {/* Actual Dates with IN & OUT times fit inside exactly h-12 */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const record = dayMap[day];
              const status = record?.status || null;

              const statusStyles = {
                PRESENT: { label: "P", style: "bg-green-50 border-green-300 text-green-800" },
                HALF_DAY: { label: "H/D", style: "bg-yellow-50 border-yellow-300 text-yellow-700" },
                SHORT: { label: "SH", style: "bg-yellow-100 border-yellow-400 text-yellow-800" },
                ABSENT: { label: "A", style: "bg-red-50 border-red-400 text-red-700" },
                WEEKOFF: { label: "W/O", style: "bg-purple-50 border-purple-300 text-purple-700" },
                "WEEKOFF OT": { label: "W/OT", style: "bg-violet-50 border-violet-400 text-violet-700" },
                HOLIDAY: { label: "H", style: "bg-pink-50 border-pink-400 text-pink-700" },
                "HOLIDAY OT": { label: "H/OT", style: "bg-orange-50 border-orange-400 text-orange-700" },
                CL: { label: "CL", style: "bg-orange-50 border-orange-300 text-orange-700" },
                SL: { label: "SL", style: "bg-blue-50 border-blue-300 text-blue-700" },
                PL: { label: "PL", style: "bg-indigo-50 border-indigo-300 text-indigo-700" },
                EL: { label: "EL", style: "bg-teal-50 border-teal-300 text-teal-700" },
              };

              const cfg = statusStyles[status] || { label: "-", style: "bg-slate-50 border-slate-200 text-slate-300" };

              const KPI_STATUS_MATCH = {
                present: ["PRESENT", "HALF_DAY", "SHORT"],
                absent: ["ABSENT"],
                weekoff: ["WEEKOFF"],
                weekoff_ot: ["WEEKOFF OT"],
                holiday: ["HOLIDAY"],
                leave: ["CL", "SL", "PL", "EL", "LEAVE"],
                holiday_ot: ["HOLIDAY OT"],
                half_day: ["HALF_DAY"],
              };

              const matchesFilter = activeFilter
                ? KPI_STATUS_MATCH[activeFilter]?.includes(status)
                : true;

              const inTime = record?.in_time ? String(record.in_time).substring(11, 16) : null;
              const outTime = record?.out_time ? String(record.out_time).substring(11, 16) : null;

              return (
                <div
                  key={day}
                  className={`
        h-14 border rounded-md flex flex-col justify-between p-1 transition-all duration-300 transform
        ${cfg.style}
        ${!matchesFilter ? "opacity-30 scale-95 border-dashed bg-transparent" : ""}
        ${activeFilter && matchesFilter ? "opacity-100 scale-105 ring-2 shadow-md font-bold z-10 ring-current" : ""}
      `}
                >
                  <div className="flex justify-between items-start w-full leading-none">
                    <span className="font-bold text-xs opacity-90">{day}</span>
                    <span className="text-[11px] font-black tracking-tight opacity-100">{cfg.label}</span>
                  </div>
                  {inTime && outTime ? (
                    <div className="flex flex-col w-full text-[11px] font-semibold opacity-80 leading-[10px] tracking-tighter mt-auto">
                      <div className="flex justify-between"><span>In:</span><span>{inTime}</span></div>
                      <div className="flex justify-between"><span>Out:</span><span>{outTime}</span></div>
                    </div>
                  ) : (
                    <div className="w-full text-center text-[10px] opacity-30 mt-auto leading-none">
                      {record?.holiday_name || record?.leave_name || "-"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. Main Report Component ---
const MonthlyAttendanceReport = () => {
  const currentDate = new Date();
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: currentDate.getMonth() + 1, // 1-12
    year: currentDate.getFullYear(),   // 2026
    employee_id: "",
    department_id: ""
  });

  const [showFilter, setShowFilter] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);

    console.log("===============");
    console.log("MONTH SENT =", filters.month);
    console.log("YEAR SENT =", filters.year);
    console.log("===============");

    try {
      const res = await fetchMonthlyAttendanceSummary(
        filters.month,
        filters.year
      );

      console.log("API RESPONSE =", res);

      if (res.success) {
        console.log("TOTAL ROWS =", res.data?.length);
        console.log("DATA =", res.data);
        setTableData(res.data);
      }
    } catch (e) {
      console.error("Summary fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  const {options}=useGroupOptions();

  // --- ADDED DYNAMIC FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return tableData.filter((emp) => {
      // Check department match
      const matchDepartment = filters.department_id
        ? emp.department === filters.department_id
        : true;

      // Check employee match
      const matchEmployee = filters.employee_id
        ? emp.employee_code === filters.employee_id
        : true;

      return matchDepartment && matchEmployee;
    });
  }, [tableData, filters]);

  if (selectedEmployee) {
    return (
      <EmployeeAttendanceDetail
        employee={selectedEmployee}
        filters={filters}
        setFilters={setFilters}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 ">
      <Table
        title="Monthly Attendance Summary Report"
        data={filteredData} // --- UPDATED PROP: Now uses filteredData instead of dummyAttendanceData
        columns={columns}
        isHidden={true}
        rowKey="employee_code"
        loading={loading}
        onRefresh={loadSummary}
        onRowDoubleClick={(row) => setSelectedEmployee(row)}

        customActions={[
          {
            label: "Print",
            icon: "pi pi-print",
            onClick: () => window.print(),
            className: "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          },
          {
            label: "Export Excel",
            icon: "pi pi-file-excel",
            onClick: () => alert("Export Excel Clicked"),
            className: "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          }
        ]}

        rowActions={[
          {
            icon: "pi pi-chart-bar",
            label: "View Detail Graph",
            color: "text-blue-600",
            onClick: (row) => setSelectedEmployee(row)
          }
        ]}
      

        showForm={showFilter}
        onToggleFilter={() => setShowFilter((prev) => !prev)}
        serverPagination={false}

        formComponent={
          <UnivarsalFilter
            options={options}
            filters={filters}
            visibleFields={["filterType", "employee", "department"]}
            setFilters={setFilters}
            onApply={loadSummary}
            onClear={() => {
              setFilters({
                month: currentDate.getMonth() + 1, // 1-12
                year: currentDate.getFullYear(),   // 2026
                employee_id: "",
                department_id: ""
              });
            }}
          />
        }
      />
    </div>
  );
};

export default MonthlyAttendanceReport;
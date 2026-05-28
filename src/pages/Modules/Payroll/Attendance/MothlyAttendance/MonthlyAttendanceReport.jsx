import { useState, useMemo, useEffect } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import MonthlyAttendanceFilter from "../../OverTime/OvertimeFilter";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const columns = [
  { key: "employee_code", label: "Employee Code" },
  { key: "employee_name", label: "Employee Name" },
  { key: "department", label: "Department" },
  { key: "present_days", label: "Present Days" },
  { key: "absent_days", label: "Absent Days" },
  { key: "total_days", label: "Total Days" }
];

// --- DUMMY DATA ---
const dummyAttendanceData = [
  { 
    employee_code: "EMP001", employee_name: "Rahul Sharma", department: "IT", 
    total_days: 31,
    present_days: 19, 
    absent_days: 2,
    absent_dates: [8, 20], 
    leave_breakdown: {
      casual_leave: { label: "CASUAL LEAVE", count: 1, dates: [12] }, 
      leave: { label: "LEAVE", count: 1, dates: [5] }, 
      weekly_off: { label: "WEEKLY OFF", count: 5, dates: [3, 10, 17, 24, 31] }, 
      holidays: { label: "HOLIDAYS", count: 1, dates: [1] }, 
      unpaid: { label: "UNPAID", count: 2, dates: [28, 29] } 
    }
  },
  { 
    employee_code: "EMP002", employee_name: "Amit Verma", department: "HR", 
    total_days: 31,
    present_days: 22, 
    absent_days: 1,
    absent_dates: [11], 
    leave_breakdown: {
      casual_leave: { label: "CASUAL LEAVE", count: 2, dates: [18, 19] }, 
      leave: { label: "LEAVE", count: 0, dates: [] }, 
      weekly_off: { label: "WEEKLY OFF", count: 5, dates: [3, 10, 17, 24, 31] }, 
      holidays: { label: "HOLIDAYS", count: 1, dates: [1] }, 
      unpaid: { label: "UNPAID", count: 0, dates: [] } 
    }
  }
];

// --- Detail View Dashboard ---
const EmployeeAttendanceDetail = ({ employee, employeeList, setSelectedEmployee, filters, setFilters, onBack }) => {
  const [activeFilter, setActiveFilter] = useState(null); 

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
  const daysInMonth = new Date(filters.year, filters.month, 0).getDate();

  // --- 100% DYNAMIC SYNC ENGINE FOR MONTH CHANGES ---
  const dynamicEmployee = useMemo(() => {
    const sundays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (new Date(filters.year, filters.month - 1, day).getDay() === 0) {
        sundays.push(day); 
      }
    }

    const bd = employee.leave_breakdown;
    const newPresent = daysInMonth 
      - employee.absent_days 
      - bd.casual_leave.count 
      - bd.leave.count 
      - bd.holidays.count 
      - (bd.unpaid ? bd.unpaid.count : 0) 
      - sundays.length;

    return {
      ...employee,
      total_days: daysInMonth,
      present_days: Math.max(0, newPresent),
      leave_breakdown: {
        ...bd,
        weekly_off: { ...bd.weekly_off, count: sundays.length, dates: sundays } 
      }
    };
  }, [employee, filters.month, filters.year, daysInMonth]);

  // --- KPI Cards Configuration ---
  const kpiCards = [
    { key: "total", label: "TOTAL DAYS", value: dynamicEmployee.total_days, colorTheme: "text-slate-700 bg-slate-100 border-slate-200", clickable: false },
    { key: "present", label: "PRESENT", value: dynamicEmployee.present_days, colorTheme: "text-green-700 bg-green-50 border-green-200", clickable: true },
    { key: "absent", label: "ABSENT", value: dynamicEmployee.absent_days, colorTheme: "text-red-700 bg-red-50 border-red-200", clickable: true },
    { key: "casual_leave", label: "CASUAL LEAVE", value: dynamicEmployee.leave_breakdown.casual_leave.count, colorTheme: "text-orange-700 bg-orange-50 border-orange-200", clickable: true },
    { key: "leave", label: "LEAVE", value: dynamicEmployee.leave_breakdown.leave.count, colorTheme: "text-blue-700 bg-blue-50 border-blue-200", clickable: true },
    { key: "weekly_off", label: "WEEKLY OFF", value: dynamicEmployee.leave_breakdown.weekly_off.count, colorTheme: "text-purple-700 bg-purple-50 border-purple-200", clickable: true },
    { key: "holidays", label: "HOLIDAYS", value: dynamicEmployee.leave_breakdown.holidays.count, colorTheme: "text-pink-700 bg-pink-50 border-pink-200", clickable: true },
    { key: "unpaid", label: "UNPAID", value: dynamicEmployee.leave_breakdown.unpaid.count, colorTheme: "text-gray-500 bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed", clickable: false }
  ];

  // --- Pie Chart Data ---
  const totalLeavesAndOffs = dynamicEmployee.total_days - dynamicEmployee.present_days - dynamicEmployee.absent_days;
  const chartData = [
    { name: "Present", value: dynamicEmployee.present_days, color: "#22c55e" }, 
    { name: "Absent", value: dynamicEmployee.absent_days, color: "#ef4444" },  
    { name: "Leaves/Offs", value: totalLeavesAndOffs, color: "#3b82f6" } 
  ];

  // --- Map Days for Heatmap (WITH IN & OUT TIMES) ---
  const calendarDays = useMemo(() => {
    const days = [];
    const bd = dynamicEmployee.leave_breakdown;

    for (let day = 1; day <= daysInMonth; day++) {
      let status = "present";
      let displayStatus = "P";
      let baseStyle = "bg-green-50 border-green-300 text-green-800"; 
      
      // Simulating In & Out times for Present days
      let inTime = null;
      let outTime = null;

      if (bd.weekly_off.dates.includes(day)) { status = "weekly_off"; displayStatus = "W/O"; baseStyle = "bg-purple-50 border-purple-300 text-purple-700"; }
      else if (bd.casual_leave.dates.includes(day)) { status = "casual_leave"; displayStatus = "CL"; baseStyle = "bg-orange-50 border-orange-300 text-orange-700"; }
      else if (bd.leave.dates.includes(day)) { status = "leave"; displayStatus = "L"; baseStyle = "bg-blue-50 border-blue-300 text-blue-700"; }
      else if (bd.holidays.dates.includes(day)) { status = "holidays"; displayStatus = "H"; baseStyle = "bg-pink-50 border-pink-400 text-pink-700"; }
      else if (bd.unpaid.dates.includes(day)) { status = "unpaid"; displayStatus = "UP"; baseStyle = "bg-gray-100 border-gray-400 text-gray-700"; }
      else if (dynamicEmployee.absent_dates.includes(day)) { status = "absent"; displayStatus = "A"; baseStyle = "bg-red-50 border-red-400 text-red-700"; }
      else {
        // Since it's a Present Day, let's assign dummy check-in and check-out
        inTime = `09:0${Math.floor(Math.random() * 9)}`; 
        outTime = `18:${Math.floor(30 + Math.random() * 20)}`;
      }

      let opacityClass = "opacity-100 scale-100";
      if (activeFilter && activeFilter !== status) {
        opacityClass = "opacity-30 scale-95 border-dashed bg-transparent"; 
      } else if (activeFilter && activeFilter === status) {
        opacityClass = "opacity-100 scale-105 ring-2 shadow-md font-bold z-10 ring-current"; 
      }

      days.push({ day, status, displayStatus, inTime, outTime, className: `${baseStyle} ${opacityClass}` });
    }
    return days;
  }, [dynamicEmployee, daysInMonth, activeFilter]);

  const handleFilterClick = (item) => {
    if (!item.clickable) return;
    setActiveFilter(activeFilter === item.key ? null : item.key);
  };

  const monthsList = [
    {v:1, l:'Jan'}, {v:2, l:'Feb'}, {v:3, l:'Mar'}, {v:4, l:'Apr'}, 
    {v:5, l:'May'}, {v:6, l:'Jun'}, {v:7, l:'Jul'}, {v:8, l:'Aug'}, 
    {v:9, l:'Sep'}, {v:10, l:'Oct'}, {v:11, l:'Nov'}, {v:12, l:'Dec'}
  ];
  const yearsList = [2024, 2025, 2026, 2027];

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
    {dynamicEmployee.employee_name} ({dynamicEmployee.employee_code})
  </h2>
            <p className="text-sm text-slate-500 font-medium ml-1">{dynamicEmployee.department}</p>
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-slate-500">Month / Year</div>
          <div className="text-xl text-blue-600 font-black tracking-wide">{filters.month} / {filters.year}</div>
        </div>
      </div>

      {/* --- Unified Top KPI Ribbon --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
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
                <Legend verticalAlign="bottom" height={36}/>
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
                onChange={(e) => setFilters(prev => ({...prev, month: parseInt(e.target.value)}))}
                className="text-sm font-semibold text-slate-700 border border-slate-300 rounded p-1.5 focus:outline-none cursor-pointer hover:border-blue-500"
              >
                {monthsList.map(m => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>

              <select 
                value={filters.year} 
                onChange={(e) => setFilters(prev => ({...prev, year: parseInt(e.target.value)}))}
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
            {calendarDays.map((d, i) => (
              <div 
                key={i} 
                className={`h-14 border rounded-md flex flex-col justify-between p-1 transition-all duration-300 transform ${d.className}`}
              >
                {/* Top Row: Date & Status */}
                <div className="flex justify-between items-start w-full leading-none">
                  <span className="font-bold text-xs opacity-90">{d.day}</span>
                  <span className="text-[11px] font-black tracking-tight opacity-100">{d.displayStatus}</span>
                </div>
                
                {/* Bottom Row: Check-in / Check-out (Only for Present days) */}
                {d.inTime && d.outTime ? (
                  <div className="flex flex-col w-full text-[11px] font-semibold opacity-80 leading-[10px] tracking-tighter mt-auto">
                    <div className="flex justify-between"><span>In:</span> <span>{d.inTime}</span></div>
                    <div className="flex justify-between"><span>Out:</span> <span>{d.outTime}</span></div>
                  </div>
                ) : (
                  <div className="w-full text-center text-[10px] opacity-30 mt-auto leading-none">-</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. Main Report Component ---
const MonthlyAttendanceReport = () => {
  const currentDate = new Date();

  const [filters, setFilters] = useState({
    month: 5,
    year: 2026,
    employee_id: "",
    department_id: ""
  });

  const [showFilter, setShowFilter] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // --- ADDED DYNAMIC FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return dummyAttendanceData.filter((emp) => {
      // Check department match
      const matchDepartment = filters.department_id 
        ? emp.department.toLowerCase() === filters.department_id.toLowerCase() 
        : true;

      // Check employee match
      const matchEmployee = filters.employee_id 
        ? emp.employee_code.toLowerCase() === filters.employee_id.toLowerCase() 
        : true;

      return matchDepartment && matchEmployee;
    });
  }, [filters]); 

  if (selectedEmployee) {
    return (
      <EmployeeAttendanceDetail 
        employee={selectedEmployee} 
        employeeList={dummyAttendanceData} 
        setSelectedEmployee={setSelectedEmployee} 
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
        rowKey="employee_code"
        loading={false}
        onRefresh={() => console.log("Refresh clicked")}
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
          <MonthlyAttendanceFilter
            filters={filters}
            setFilters={setFilters}
            onApply={() => console.log("Apply Filters")}
            onClear={() => {
              setFilters({
                month: 5,
                year: 2026,
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
import { useState, useMemo } from "react";
import AttendanceRegisterFilter from "./AttendanceFilter";
import ERPPrintPreview from "../../../../../components/Reusable/ERPPrintPreview";
import { showToast } from "../../../../../components/Reusable/alert";

// // --- NATIVE HELPERS ---
// const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
// const pad = (n) => String(n).padStart(2, "0");
// const getMonthName = (monthNum, year) => new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });

// // --- PREMIUM STATUS BADGES ---
// const STATUS_UI = {
//   P: "bg-emerald-100 text-emerald-700 border-emerald-200",
//   A: "bg-red-100 text-red-700 border-red-200",
//   WO: "bg-slate-100 text-slate-500 border-slate-200",
//   H: "bg-blue-100 text-blue-700 border-blue-200",
//   L: "bg-amber-100 text-amber-700 border-amber-200",
// };

// // --- DUMMY DATA GENERATOR ---
// const generateData = (month, year) => {
//   const days = getDaysInMonth(month, year);
//   return [
//     { id: 1, code: "EMP001", name: "Rahul Sharma", desig: "React Developer", dept: "IT" },
//     { id: 2, code: "EMP002", name: "Amit Verma", desig: "NodeJS Developer", dept: "IT" },
//     { id: 3, code: "EMP003", name: "Priya Singh", desig: "HR Manager", dept: "Admin" },
//     { id: 4, code: "EMP004", name: "Vikram Gupta", desig: "QA Tester", dept: "IT" },
//     { id: 5, code: "EMP005", name: "Neha Ali", desig: "UI/UX Designer", dept: "Design" },
//     { id: 6, code: "EMP006", name: "Suresh Kumar", desig: "Backend Developer", dept: "IT" },
//     { id: 7, code: "EMP007", name: "Anjali Desai", desig: "Frontend Developer", dept: "IT" },
//   ].map(emp => {
//     let daily = {};
//     let totals = { P: 0, A: 0, L: 0, OT: 0 };
//     for (let d = 1; d <= days; d++) {
//       const isSun = new Date(year, month - 1, d).getDay() === 0;
//       let status = isSun ? "WO" : "P";
//       if (d === 5 && emp.id === 1) status = "A";
//       if (d === 12 && emp.id === 2) status = "L";
//       if (d === 18 && emp.id === 3) status = "A";
      
//       daily[d] = status;
//       if (totals[status] !== undefined) totals[status]++;
//       if (status === "P" && d % 8 === 0) totals.OT += 2; 
//     }
//     return { ...emp, daily, totals };
//   });
// };

// const AttendanceRegister = () => {
//   const [showFilter, setShowFilter] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filters, setFilters] = useState({
//     month: new Date().getMonth() + 1,
//     year: new Date().getFullYear(),
//     employee_id: "",
//   });

//   const rawList = useMemo(() => generateData(filters.month, filters.year), [filters.month, filters.year]);
//   const daysInMonth = useMemo(() => getDaysInMonth(filters.month, filters.year), [filters.month, filters.year]);

//   // Local Search Implementation
//   const list = useMemo(() => {
//     if (!searchTerm) return rawList;
//     const lowerSearch = searchTerm.toLowerCase();
//     return rawList.filter(emp => 
//       emp.name.toLowerCase().includes(lowerSearch) || 
//       emp.code.toLowerCase().includes(lowerSearch)
//     );
//   }, [rawList, searchTerm]);

//   if (showPreview) {
//     return <ERPPrintPreview title={`Attendance Register - ${getMonthName(filters.month, filters.year)}`} onBack={() => setShowPreview(false)} logo="/finaman-logo.png" />;
//   }

//   return (
//     <div className="h-full w-full bg-slate-50 flex flex-col p-4 gap-4 overflow-hidden">
      
//       {/* =========================================================
//           CUSTOM HEADER (Replaces your old Table Header)
//       ========================================================= */}
//       <div className="flex-none bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
//         {/* Title & Count */}
//         <div className="flex items-center gap-3">
//           <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
//           <h1 className="text-lg font-bold text-gray-800">
//             Attendance Register ({getMonthName(filters.month, filters.year)} {filters.year})
//           </h1>
//           <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">
//             {list.length} Records
//           </span>
//         </div>

//         {/* Toolbar Actions */}
//         <div className="flex items-center gap-3 w-full sm:w-auto">
//           {/* Search Box */}
//           <div className="relative flex-1 sm:w-64">
//             <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
//             <input
//               type="text"
//               placeholder="Search employee..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
//             />
//           </div>

//           <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

//           {/* Action Buttons */}
//           <button 
//             onClick={() => showToast({ icon: "success", title: "Exporting to Excel…" })}
//             className="w-9 h-9 flex items-center justify-center rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors tooltip"
//             title="Export Excel"
//           >
//             <i className="pi pi-file-excel"></i>
//           </button>
          
//           <button 
//             onClick={() => setShowPreview(true)}
//             className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors tooltip"
//             title="Print Preview"
//           >
//             <i className="pi pi-print"></i>
//           </button>

//           <button 
//             onClick={() => setShowFilter(!showFilter)}
//             className={`w-9 h-9 flex items-center justify-center rounded-md border transition-colors ${showFilter ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
//             title="Filters"
//           >
//             <i className="pi pi-filter"></i>
//           </button>
//         </div>
//       </div>

//       {/* =========================================================
//           FILTER SECTION (Conditionally Rendered)
//       ========================================================= */}
//       {showFilter && (
//         <div className="flex-none">
//           <AttendanceRegisterFilter
//             filters={filters}
//             setFilters={setFilters}
//             onApply={() => showToast({ icon: "success", title: "Filters Applied" })}
//             onClear={() => {
//               setSearchTerm("");
//               showToast({ icon: "info", title: "Filters Cleared" });
//             }}
//           />
//         </div>
//       )}

//       {/* =========================================================
//           MAIN PREMIUM GRID (Full width & height, robust scrolling)
//       ========================================================= */}
//       <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative z-0 overflow-hidden">
//         <div className="flex-1 overflow-auto custom-scrollbar">
//           <table className="w-full border-collapse text-left min-w-max">
            
//             {/* STICKY TOP HEADER */}
//             <thead className="sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
//               <tr className="bg-slate-50 border-b border-gray-200">
                
//                 {/* Sticky Left: Employee Column */}
//                 <th className="sticky left-0 z-40 bg-slate-50 p-3 border-r border-gray-200 w-[240px] text-xs font-bold text-gray-500 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
//                   Employee Info
//                 </th>
                
//                 {/* 1-31 Days Columns */}
//                 {Array.from({ length: 31 }).map((_, i) => {
//                   const day = i + 1;
//                   const dateObj = new Date(filters.year, filters.month - 1, day);
//                   const isSun = day <= daysInMonth && dateObj.getDay() === 0;
                  
//                   return (
//                     <th key={day} className={`p-2 text-center border-r border-gray-100 min-w-[42px] ${day > daysInMonth ? 'bg-gray-100' : ''}`}>
//                       <div className="flex flex-col items-center justify-center leading-none gap-1">
//                         <span className="text-[9px] text-gray-400 font-medium uppercase">
//                           {day <= daysInMonth ? dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }) : "-"}
//                         </span>
//                         <span className={`text-[13px] font-bold ${isSun ? 'text-red-500' : 'text-gray-700'}`}>
//                           {day <= daysInMonth ? day : "-"}
//                         </span>
//                       </div>
//                     </th>
//                   );
//                 })}
                
//                 {/* Summary Columns */}
//                 <th className="p-3 text-center border-l border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">P</th>
//                 <th className="p-3 text-center bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">A</th>
//                 <th className="p-3 text-center bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">OT</th>
//               </tr>
//             </thead>

//             {/* TABLE BODY */}
//             <tbody>
//               {list.length > 0 ? list.map((row) => (
//                 <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  
//                   {/* Sticky Left: Employee Info */}
//                   <td className="sticky left-0 z-20 bg-white p-2 border-r border-gray-200 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
//                     <div className="flex flex-col ml-1">
//                       <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{row.name}</span>
//                       <div className="flex items-center gap-1.5 mt-0.5">
//                         <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 rounded">
//                           {row.code}
//                         </span>
//                         <span className="text-[11px] text-gray-500 truncate">{row.desig}</span>
//                       </div>
//                     </div>
//                   </td>

//                   {/* 1-31 Days Data */}
//                   {Array.from({ length: 31 }).map((_, i) => {
//                     const day = i + 1;
//                     if (day > daysInMonth) return <td key={day} className="bg-gray-50 border-r border-gray-100"></td>;
                    
//                     const status = row.daily[day];
//                     const badgeClass = STATUS_UI[status] || STATUS_UI.P;

//                     return (
//                       <td key={day} className="p-1 border-r border-gray-100 text-center">
//                         <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded text-[11px] font-bold ${badgeClass}`}>
//                           {status}
//                         </div>
//                       </td>
//                     );
//                   })}

//                   {/* Summary Data */}
//                   <td className="p-2 text-center font-bold text-emerald-600 border-l border-gray-200 bg-emerald-50/50">
//                     {row.totals.P}
//                   </td>
//                   <td className="p-2 text-center font-bold text-red-600 bg-red-50/50">
//                     {row.totals.A}
//                   </td>
//                   <td className="p-2 text-center font-bold text-purple-600 bg-purple-50/50">
//                     {row.totals.OT}
//                   </td>

//                 </tr>
//               )) : (
//                 <tr>
//                   <td colSpan={35} className="py-10 text-center text-gray-400">
//                     <i className="pi pi-inbox text-4xl mb-2"></i>
//                     <p>No records found</p>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//     </div>
//   );
// };

// export default AttendanceRegister;

// --- NATIVE HELPERS ---
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");
const getMonthName = (monthNum, year) => new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });

// --- PREMIUM STATUS BADGES (For UI) ---
const STATUS_UI = {
  P: "bg-emerald-100 text-emerald-700 border-emerald-200",
  A: "bg-red-100 text-red-700 border-red-200",
  WO: "bg-slate-100 text-slate-500 border-slate-200",
  H: "bg-blue-100 text-blue-700 border-blue-200",
  L: "bg-amber-100 text-amber-700 border-amber-200",
};

// --- DUMMY DATA GENERATOR ---
const generateData = (month, year) => {
  const days = getDaysInMonth(month, year);
  return [
    { id: 1, code: "EMP001", name: "Rahul Sharma", desig: "React Developer", dept: "IT" },
    { id: 2, code: "EMP002", name: "Amit Verma", desig: "NodeJS Developer", dept: "IT" },
    { id: 3, code: "EMP003", name: "Priya Singh", desig: "HR Manager", dept: "Admin" },
    { id: 4, code: "EMP004", name: "Vikram Gupta", desig: "QA Tester", dept: "IT" },
    { id: 5, code: "EMP005", name: "Neha Ali", desig: "UI/UX Designer", dept: "Design" },
    { id: 6, code: "EMP006", name: "Suresh Kumar", desig: "Backend Developer", dept: "IT" },
    { id: 7, code: "EMP007", name: "Anjali Desai", desig: "Frontend Developer", dept: "IT" },
  ].map(emp => {
    let daily = {};
    let totals = { P: 0, A: 0, L: 0, OT: 0 };
    for (let d = 1; d <= days; d++) {
      const isSun = new Date(year, month - 1, d).getDay() === 0;
      let status = isSun ? "WO" : "P";
      if (d === 5 && emp.id === 1) status = "A";
      if (d === 12 && emp.id === 2) status = "L";
      if (d === 18 && emp.id === 3) status = "A";
      
      daily[d] = status;
      if (totals[status] !== undefined) totals[status]++;
      if (status === "P" && d % 8 === 0) totals.OT += 2; 
    }
    return { ...emp, daily, totals };
  });
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

  const rawList = useMemo(() => generateData(filters.month, filters.year), [filters.month, filters.year]);
  const daysInMonth = useMemo(() => getDaysInMonth(filters.month, filters.year), [filters.month, filters.year]);

  // Local Search Handling
  const list = useMemo(() => {
    if (!searchTerm) return rawList;
    const lowerSearch = searchTerm.toLowerCase();
    return rawList.filter(emp => 
      emp.name.toLowerCase().includes(lowerSearch) || 
      emp.code.toLowerCase().includes(lowerSearch)
    );
  }, [rawList, searchTerm]);

  // --- EXPORT HANDLER ---
  const handleExportExcel = () => {
    if (list.length === 0) return showToast({ icon: "warning", title: "No data to export" });
    showToast({ icon: "success", title: "Exporting to Excel…" });
    // Yahan apna Excel export logic daal dena
  };

  /* =========================================================
     PRINT PREVIEW (PEHLE WALA EXACT LOGIC WAPAS AA GAYA)
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
                      <th className="text-left w-48">Employee Details</th>
                      {Array.from({ length: 31 }).map((_, i) => (
                        <th key={i} className="w-5">{i + 1}</th>
                      ))}
                      <th>P</th><th>A</th><th>L</th><th>OT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((row, idx) => (
                      <tr key={idx}>
                         <td className="text-left">
                            <span className="font-bold">{row.code}</span> - {row.name}
                         </td>
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
                         <td>{row.totals.P}</td>
                         <td>{row.totals.A}</td>
                         <td>{row.totals.L}</td>
                         <td>{row.totals.OT}</td>
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
      
      {/* CUSTOM HEADER (Replaces your old Table Header) */}
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
          {/* Search Box */}
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

          {/* Action Buttons */}
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

      {/* MAIN PREMIUM GRID */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative z-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-left min-w-max">
            
            {/* STICKY TOP HEADER */}
            <thead className="sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <tr className="bg-slate-50 border-b border-gray-200">
                
                <th className="sticky left-0 z-40 bg-slate-50 p-3 border-r border-gray-200 w-[180px] text-xs font-bold text-gray-500 uppercase tracking-wider shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                  Employee Info
                </th>
                
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
                
                <th className="p-3 text-center border-l border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">P</th>
                <th className="p-3 text-center bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">A</th>
                <th className="p-3 text-center bg-slate-50 text-[11px] font-bold text-gray-500 uppercase">OT</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {list.length > 0 ? list.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  
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

                  <td className="p-2 text-center font-bold text-emerald-600 border-l border-gray-200 bg-emerald-50/50">
                    {row.totals.P}
                  </td>
                  <td className="p-2 text-center font-bold text-red-600 bg-red-50/50">
                    {row.totals.A}
                  </td>
                  <td className="p-2 text-center font-bold text-purple-600 bg-purple-50/50">
                    {row.totals.OT}
                  </td>

                </tr>
              )) : (
                <tr>
                  <td colSpan={35} className="py-10 text-center text-gray-400">
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
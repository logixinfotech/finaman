// import React from "react";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
// import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

// const MonthlyAttendanceFilter = ({ filters, setFilters, onApply, onClear }) => {
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   // Generate Year Options (e.g., last 5 years to next 1 year)
//   const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  
//   const months = [
//     { value: 1, label: "January" }, { value: 2, label: "February" },
//     { value: 3, label: "March" }, { value: 4, label: "April" },
//     { value: 5, label: "May" }, { value: 6, label: "June" },
//     { value: 7, label: "July" }, { value: 8, label: "August" },
//     { value: 9, label: "September" }, { value: 10, label: "October" },
//     { value: 11, label: "November" }, { value: 12, label: "December" }
//   ];
//    const { options, loading } = useGroupOptions();

//   return (
//     <div className="bg-white p-4 rounded shadow-sm border mb-4">
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
//         {/* Month Selection */}
//         <div className="flex flex-col">
//           <label className="text-sm font-semibold mb-1">Month <span className="text-red-500">*</span></label>
//           <select
//             name="month"
//             value={filters.month || ""}
//             onChange={handleChange}
//             className="border p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//           >
//             {months.map(m => (
//               <option key={m.value} value={m.value}>{m.label}</option>
//             ))}
//           </select>
//         </div>

//         {/* Year Selection */}
//         <div className="flex flex-col">
//           <label className="text-sm font-semibold mb-1">Year <span className="text-red-500">*</span></label>
//           <select
//             name="year"
//             value={filters.year || ""}
//             onChange={handleChange}
//             className="border p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
//           >
//             {years.map(y => (
//               <option key={y} value={y}>{y}</option>
//             ))}
//           </select>
//         </div>

//        <div className="flex flex-col gap-1 min-w-[150px]">
//           <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//             Department
//           </label>
//           <ERPAutocomplete
//             options={options.department.map((opt) => opt.label)}
//             value={filters.department_name || ""}
//             onChange={(selectedValue) => {
//               const selectedObj = options.department.find(
//                 (opt) => opt.label === selectedValue,
//               );
//               setFilters((prev) => ({
//                 ...prev,
//                 department_id: selectedObj ? selectedObj.value : "",
//                 department_name: selectedValue || "",
//               }));
//             }}
//             className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
//           />
//         </div>

//        <div className="flex flex-col gap-1 min-w-[150px]">
//           <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//             Employee
//           </label>
//           <ERPAutocomplete
//             options={options.employees.map((emp) => emp.label)}
//             value={filters.employee_name || ""}
//             onChange={(selectedValue) => {
//               const selectedEmp = options.employees.find(
//                 (emp) => emp.label === selectedValue,
//               );
//               setFilters((prev) => ({
//                 ...prev,
//                 employee_id: selectedEmp ? String (selectedEmp.value) : "", // ID set ho jayegi
//                 employee_name: selectedValue || "",
//               }));
//             }}
//             className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
//           />
//         </div>

//       </div>

//       {/* Filter Action Buttons */}
//       <div className="flex justify-end gap-2 mt-4">
//         <button
//           onClick={onClear}
//           className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
//         >
//           Clear
//         </button>
//         <button
//           onClick={onApply}
//           className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//         >
//           Apply Filters
//         </button>
//       </div>
//     </div>
//   );
// };


// export default MonthlyAttendanceFilter;
import { useState, useEffect } from "react";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";
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

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const getLastDay = (year, month) => new Date(year, month, 0).getDate();

const pad = (n) => String(n).padStart(2, "0");

const OvertimeFilter = ({ filters, setFilters, onApply, onClear }) => {
  const today = new Date();

  const parseDate = (dateStr) => {
    if (!dateStr) {
      return {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      };
    }

    const d = new Date(dateStr);
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  };

  const { options, loading } = useGroupOptions();
 
  //  useEffect(()=>{
  //   const loadDep=async()=>{
  //     try{
  //       const dept=await fetchUserGroupsByType("Dep");
  //       setDPARTMENTS(dept.data);
  //       console.log(dept)
  //     }
  //     catch(error){
  //       console.log("DropDown Error", error);
  //     }
  //   }
  //   loadDep()
  //  },[])
  //  const department=  DEPARTMENTS?.map((item) => (
  //     <option
  //       key={item.group_name}
  //       value={item.group_name}
  //     >
  //       {item.group_name}
  //     </option>
  //   ))
  // console.log(department);
  const init = parseDate(filters.from_date);

  const [selectedMonth, setSelectedMonth] = useState(init.month);
  const [selectedYear, setSelectedYear] = useState(init.year);

  // NEW: filter type
  const [filterType, setFilterType] = useState("month");

  // Auto sync dates when month/year changes
  useEffect(() => {
    if (filterType !== "month") return;

    const from = `${selectedYear}-${pad(selectedMonth)}-01`;

    const lastDay = getLastDay(selectedYear, selectedMonth);

    const to = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

    setFilters((prev) => ({
      ...prev,
      from_date: from,
      to_date: to,
    }));
  }, [selectedMonth, selectedYear, filterType, setFilters]);

  const handleClear = () => {
    const now = new Date();

    const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

    const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      getLastDay(now.getFullYear(), now.getMonth() + 1),
    )}`;

    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setFilterType("month");

    setFilters({
      from_date: from,
      to_date: to,
      employee_id: "",
      department_id: "",
      department_name: "",
    });

    onClear?.();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Filter Type */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter Type
          </label>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
          >
            <option value="month">Month Wise</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Month + Year */}
        {filterType === "month" && (
          <>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Month
              </label>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Custom Date Range */}
        {filterType === "custom" && (
          <>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                From Date
              </label>

              <input
                type="date"
                value={filters.from_date || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    from_date: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                To Date
              </label>

              <input
                type="date"
                value={filters.to_date || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    to_date: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
              />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Employee
          </label>
          <ERPAutocomplete
            options={options.employees.map((emp) => emp.label)}
            value={filters.employee_name || ""}
            onChange={(selectedValue) => {
              const selectedEmp = options.employees.find(
                (emp) => emp.label === selectedValue,
              );
              setFilters((prev) => ({
                ...prev,
                employee_id: selectedEmp ? String (selectedEmp.value) : "", // ID set ho jayegi
                employee_name: selectedValue || "",
              }));
            }}
            className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Department
          </label>
          <ERPAutocomplete
            options={options.department.map((opt) => opt.label)}
            value={filters.department_name || ""}
            onChange={(selectedValue) => {
              const selectedObj = options.department.find(
                (opt) => opt.label === selectedValue,
              );
              setFilters((prev) => ({
                ...prev,
                department_id: selectedObj ? selectedObj.value : "",
                department_name: selectedValue || "",
              }));
            }}
            className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onApply}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-md"
          >
            Apply
          </button>

          <button
            onClick={handleClear}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-md border"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default OvertimeFilter;

// import { useState, useEffect } from "react";
// import ERPAutocomplete from "../input/ERPAutocomplete"; // Path cross check kar lein
// import ERPDate from "../input/Date";

// const MONTHS = [
//   { value: 1, label: "January" },
//   { value: 2, label: "February" },
//   { value: 3, label: "March" },
//   { value: 4, label: "April" },
//   { value: 5, label: "May" },
//   { value: 6, label: "June" },
//   { value: 7, label: "July" },
//   { value: 8, label: "August" },
//   { value: 9, label: "September" },
//   { value: 10, label: "October" },
//   { value: 11, label: "November" },
//   { value: 12, label: "December" },
// ];

// const getLastDay = (year, month) => new Date(year, month, 0).getDate();
// const pad = (n) => String(n).padStart(2, "0");

// const GenericFilter = ({ 
//   filters, 
//   setFilters, 
//   onApply, 
//   onClear, 
//   visibleFields = [], // Example: ["filterType", "employee", "department", "status"]
//   options = { employees: [], department: [] } // Hooks data passed from parent
// }) => {
//   const today = new Date();

//   const parseDate = (dateStr) => {
//     if (!dateStr) {
//       return { month: today.getMonth() + 1, year: today.getFullYear() };
//     }
//     const d = new Date(dateStr);
//     return { month: d.getMonth() + 1, year: d.getFullYear() };
//   };

//   const init = parseDate(filters.from_date);

//   // ---- DRAFT STATE CONTROL ----
//   const [draft, setDraft] = useState({ ...filters });
//   const [selectedMonth, setSelectedMonth] = useState(init.month);
//   const [selectedYear, setSelectedYear] = useState(init.year);
//   const [filterType, setFilterType] = useState("Month Wise");
  
//   const [monthText, setMonthText] = useState(
//     init.month ? MONTHS.find((m) => m.value === init.month)?.label : ""
//   );

//   // Sync component internal updates when incoming filters change globally
//   useEffect(() => {
//     setDraft({ ...filters });
//     const parsed = parseDate(filters.from_date);
//     setSelectedMonth(parsed.month);
//     setMonthText(MONTHS.find((m) => m.value === parsed.month)?.label || "");
//   }, [filters]);

//   // Handle Month Wise dynamic calculation
//   useEffect(() => {
//     if (!visibleFields.includes("filterType") || filterType !== "Month Wise") return;
//     if (!selectedMonth || !selectedYear) return;

//     const from = `${selectedYear}-${pad(selectedMonth)}-01`;
//     const lastDay = getLastDay(selectedYear, selectedMonth);
//     const to = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

//     setDraft((prev) => ({ ...prev, from_date: from, to_date: to }));
//   }, [selectedMonth, selectedYear, filterType, visibleFields]);

//   const handleApply = () => {
//     setFilters(draft);
//     onApply?.(draft);
//   };

//   const handleClear = () => {
//     const now = new Date();
//     const currentMonthNum = now.getMonth() + 1;
//     const from = `${now.getFullYear()}-${pad(currentMonthNum)}-01`;
//     const to = `${now.getFullYear()}-${pad(currentMonthNum)}-${pad(
//       getLastDay(now.getFullYear(), currentMonthNum)
//     )}`;

//     // Rebuild initial state structure containing only keys that were originally passed
//     const cleared = Object.keys(filters).reduce((acc, curr) => {
//       if (curr === "from_date") acc[curr] = from;
//       else if (curr === "to_date") acc[curr] = to;
//       else if (curr === "Status" || curr === "status") acc[curr] = "All";
//       else acc[curr] = "";
//       return acc;
//     }, {});

//     setSelectedMonth(currentMonthNum);
//     setSelectedYear(now.getFullYear());
//     setFilterType("Month Wise");
//     setMonthText(MONTHS.find((m) => m.value === currentMonthNum)?.label || "");
    
//     setDraft(cleared);
//     setFilters(cleared);
//     onClear?.();
//   };

//   return (
//     <div className="bg-white rounded-lg px-5 py-5 shadow-sm">
//       <div className="flex flex-wrap items-center gap-x-4 gap-y-6">

//         {/* 1. FILTER TYPE */}
//         {visibleFields.includes("filterType") && (
//           <div className="relative max-w-[150px] w-full">
//             <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//               Filter Type
//             </label>
//             <ERPAutocomplete
//               value={filterType}
//               options={["Month Wise", "Custom Date Range"]}
//               onChange={(val) => setFilterType(val)}
//               className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             />
//           </div>
//         )}

//         {/* 2. MONTH WISE */}
//         {visibleFields.includes("filterType") && filterType === "Month Wise" && (
//           <div className="relative max-w-[120px] w-full">
//             <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//               Month
//             </label>
//             <ERPAutocomplete
//               value={monthText}
//               options={MONTHS.map((month) => month.label)}
//               onChange={(typedValue) => {
//                 setMonthText(typedValue || "");
//                 const selected = MONTHS.find((m) => m.label === typedValue);
//                 setSelectedMonth(selected?.value || "");
//               }}
//               className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             />
//           </div>
//         )}

//         {/* 3. CUSTOM DATE RANGE */}
//         {visibleFields.includes("filterType") && filterType === "Custom Date Range" && (
//           <>
//             <div className="relative max-w-[120px] w-full">
//               <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//                 From Date
//               </label>
//               <ERPDate
//                 value={draft.from_date || ""}
//                 onChange={(e) => setDraft((prev) => ({ ...prev, from_date: e }))}
//                 className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>

//             <div className="relative max-w-[120px] w-full">
//               <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//                 To Date
//               </label>
//               <ERPDate
//                 value={draft.to_date || ""}
//                 onChange={(e) => setDraft((prev) => ({ ...prev, to_date: e }))}
//                 className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//               />
//             </div>
//           </>
//         )}

//         {/* 4. EMPLOYEE */}
//         {visibleFields.includes("employee") && (
//           <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
//             <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//               Employee
//             </label>
//             <ERPAutocomplete
//               options={options?.employees?.map((emp) => emp.label) || []}
//               value={draft.employee_name || ""}
//               onChange={(selectedValue) => {
//                 const selectedEmp = options?.employees?.find((emp) => emp.label === selectedValue);
//                 setDraft((prev) => ({
//                   ...prev,
//                   employee_id: selectedEmp ? String(selectedEmp.value) : "",
//                   employee_name: selectedValue || "",
//                 }));
//               }}
//               className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             />
//           </div>
//         )}

//         {/* 5. DEPARTMENT */}
//         {visibleFields.includes("department") && (
//           <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
//             <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//               Department
//             </label>
//             <ERPAutocomplete
//               options={options?.department?.map((opt) => opt.label) || []}
//               value={draft.department_name || draft.Department || ""}
//               onChange={(selectedValue) => {
//                 const selectedObj = options?.department?.find((opt) => opt.label === selectedValue);
//                 setDraft((prev) => ({
//                   ...prev,
//                   department_id: selectedObj ? String(selectedObj.value) : "",
//                   department_name: selectedValue || "",
//                   Department: selectedValue || "", // Backward Compatibility support for simple strings
//                 }));
//               }}
//               className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             />
//           </div>
//         )}

//         {/* 6. STATUS */}
//         {visibleFields.includes("status") && (
//           <div className="relative max-w-[130px] flex-1 sm:flex-none w-full">
//             <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
//               Status
//             </label>
//             <ERPAutocomplete
//               value={draft.Status || draft.status || "All"}
//               options={["Active", "Inactive", "All"]}
//               onChange={(val) => setDraft((prev) => ({ ...prev, Status: val, status: val }))}
//               className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             />
//           </div>
//         )}

//         {/* ACTION BUTTONS */}
//         <div className="flex items-center gap-3 ml-auto">
//           <button
//             onClick={handleApply}
//             className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out shadow-sm h-[34px]"
//           >
//             Apply
//           </button>
//           <button
//             onClick={handleClear}
//             className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-sm h-[34px]"
//           >
//             Clear
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default GenericFilter;
import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import ERPAutocomplete from "../input/ERPAutocomplete"; // Path cross check kar lein
import ERPDate from "../input/Date";

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

const getLastDay = (year, month) => new Date(year, month, 0).getDate();
const pad = (n) => String(n).padStart(2, "0");

const GenericFilter = ({
  filters,
  setFilters,
  onApply,
  onClear,
  visibleFields = [], // Example: ["filterType", "employee", "department", "status", "module", "menu", "application", "itemType"]
  options = { employees: [], department: [], modules: [] }, // Hooks data passed from parent
}) => {
  const today = new Date();

  const parseDate = (dateStr) => {
    if (!dateStr) {
      return { month: today.getMonth() + 1, year: today.getFullYear() };
    }
    const d = new Date(dateStr);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };

  const init = parseDate(filters.from_date);

  // ---- DRAFT STATE CONTROL ----
  const [draft, setDraft] = useState({ ...filters });
  const [selectedMonth, setSelectedMonth] = useState(init.month);
  const [selectedYear, setSelectedYear] = useState(init.year);
  const [filterType, setFilterType] = useState("Month Wise");

  const [monthText, setMonthText] = useState(
    init.month ? MONTHS.find((m) => m.value === init.month)?.label : ""
  );

  // Sync component internal updates when incoming filters change globally
  useEffect(() => {
    setDraft({ ...filters });
    const parsed = parseDate(filters.from_date);
    setSelectedMonth(parsed.month);
    setMonthText(MONTHS.find((m) => m.value === parsed.month)?.label || "");
  }, [filters]);

  // Handle Month Wise dynamic calculation
  useEffect(() => {
    if (!visibleFields.includes("filterType") || filterType !== "Month Wise") return;
    if (!selectedMonth || !selectedYear) return;

    const from = `${selectedYear}-${pad(selectedMonth)}-01`;
    const lastDay = getLastDay(selectedYear, selectedMonth);
    const to = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

    setDraft((prev) => ({ ...prev, from_date: from, to_date: to }));
  }, [selectedMonth, selectedYear, filterType, visibleFields]);

  const handleApply = () => {
    setFilters(draft);
    onApply?.(draft);
  };

  const handleClear = () => {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const from = `${now.getFullYear()}-${pad(currentMonthNum)}-01`;
    const to = `${now.getFullYear()}-${pad(currentMonthNum)}-${pad(
      getLastDay(now.getFullYear(), currentMonthNum)
    )}`;

    // Rebuild initial state structure containing only keys that were originally passed
    const cleared = Object.keys(filters).reduce((acc, curr) => {
      if (curr === "from_date") acc[curr] = from;
      else if (curr === "to_date") acc[curr] = to;
      else if (curr === "Status" || curr === "status") acc[curr] = "All";
      else acc[curr] = "";
      return acc;
    }, {});

    setSelectedMonth(currentMonthNum);
    setSelectedYear(now.getFullYear());
    setFilterType("Month Wise");
    setMonthText(MONTHS.find((m) => m.value === currentMonthNum)?.label || "");

    setDraft(cleared);
    setFilters(cleared);
    onClear?.();
  };

  return (
    <div className="bg-white rounded-lg px-5 py-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-6">

        {/* 1. FILTER TYPE */}
        {visibleFields.includes("filterType") && (
          <div className="relative max-w-[150px] w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Filter Type
            </label>
            <ERPAutocomplete
              value={filterType}
              options={["Month Wise", "Custom Date Range"]}
              onChange={(val) => setFilterType(val)}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 2. MONTH WISE */}
        {visibleFields.includes("filterType") && filterType === "Month Wise" && (
          <div className="relative max-w-[120px] w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Month
            </label>
            <ERPAutocomplete
              value={monthText}
              options={MONTHS.map((month) => month.label)}
              onChange={(typedValue) => {
                setMonthText(typedValue || "");
                const selected = MONTHS.find((m) => m.label === typedValue);
                setSelectedMonth(selected?.value || "");
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 3. CUSTOM DATE RANGE */}
        {visibleFields.includes("filterType") && filterType === "Custom Date Range" && (
          <>
            <div className="relative max-w-[120px] w-full">
              <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
                From Date
              </label>
              <ERPDate
                value={draft.from_date || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, from_date: e }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="relative max-w-[120px] w-full">
              <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
                To Date
              </label>
              <ERPDate
                value={draft.to_date || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, to_date: e }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* 4. EMPLOYEE */}
        {visibleFields.includes("employee") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Employee
            </label>
            <ERPAutocomplete
              options={options?.employees?.map((emp) => emp.label) || []}
              value={draft.employee_name || ""}
              onChange={(selectedValue) => {
                const selectedEmp = options?.employees?.find((emp) => emp.label === selectedValue);
                setDraft((prev) => ({
                  ...prev,
                  employee_id: selectedEmp ? String(selectedEmp.value) : "",
                  employee_name: selectedValue || "",
                }));
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 5. DEPARTMENT */}
        {visibleFields.includes("department") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Department
            </label>
            <ERPAutocomplete
              options={options?.department?.map((opt) => opt.label) || []}
              value={draft.department_name || draft.Department || ""}
              onChange={(selectedValue) => {
                const selectedObj = options?.department?.find((opt) => opt.label === selectedValue);
                setDraft((prev) => ({
                  ...prev,
                  department_id: selectedObj ? String(selectedObj.value) : "",
                  department_name: selectedValue || "",
                  Department: selectedValue || "", // Backward Compatibility support for simple strings
                }));
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 6. STATUS */}
        {visibleFields.includes("status") && (
          <div className="relative max-w-[130px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Status
            </label>
            <ERPAutocomplete
              value={draft.Status || draft.status || "All"}
              options={["Active", "Inactive", "All"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, Status: val, status: val }))}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 7. MODULE (Menu Master) */}
        {visibleFields.includes("module") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Module
            </label>
            <ERPAutocomplete
              options={options?.modules?.map((m) => m.mod_name) || []}
              value={draft.mod_name || ""}
              onChange={(selectedValue) => {
                setDraft((prev) => ({ ...prev, mod_name: selectedValue || "" }));
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 8. MENU (pad_name) */}
        {visibleFields.includes("menu") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Menu
            </label>
            <input
              type="text"
              placeholder="Menu name"
              value={draft.pad_name || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, pad_name: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 9. APPLICATION (appl_name) */}
        {visibleFields.includes("application") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Application
            </label>
            <input
              type="text"
              placeholder="Application"
              value={draft.appl_name || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, appl_name: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* 10. ITEM TYPE (item_type) */}
        {visibleFields.includes("itemType") && (
          <div className="relative max-w-[100px] w-full">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Item Type
            </label>
            <input
              type="text"
              placeholder="F / R"
              value={draft.item_type || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, item_type: e.target.value }))}
              className="w-full text-sm text-center border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out shadow-sm h-[34px]"
          >
            <Filter size={14} />
            Apply
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-sm h-[34px]"
          >
            <X size={14} />
            Clear
          </button>
        </div>

      </div>
    </div>
  );
};

export default GenericFilter;
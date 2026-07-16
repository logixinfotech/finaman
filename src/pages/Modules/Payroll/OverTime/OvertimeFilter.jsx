import { useState, useEffect } from "react";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";
import ERPDate from "../../../../components/Reusable/input/Date";

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
  const { options, loading } = useGroupOptions();

  const parseDate = (dateStr) => {
    if (!dateStr) {
      return { month: today.getMonth() + 1, year: today.getFullYear() };
    }
    const d = new Date(dateStr);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  };

  const init = parseDate(filters.from_date);

  // ---- LOCAL DRAFT STATE ----
  const [draft, setDraft] = useState({
    from_date: filters.from_date || "",
    to_date: filters.to_date || "",
    employee_id: filters.employee_id || "",
    employee_name: filters.employee_name || "",
    department_id: filters.department_id || "",
    department_name: filters.department_name || "",
  });

  const [selectedMonth, setSelectedMonth] = useState(init.month);
  const [selectedYear, setSelectedYear] = useState(init.year);
  const [filterType, setFilterType] = useState("Month Wise");
  
  // NAYI STATE: Month ke typed text ko hold karne ke liye
  const [monthText, setMonthText] = useState(
    init.month ? MONTHS.find((m) => m.value === init.month)?.label : ""
  );

  // Auto sync draft dates when month/year changes
  useEffect(() => {
    if (filterType !== "Month Wise") return;
    if (!selectedMonth || !selectedYear) return;

    const from = `${selectedYear}-${pad(selectedMonth)}-01`;
    const lastDay = getLastDay(selectedYear, selectedMonth);
    const to = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

    setDraft((prev) => ({ ...prev, from_date: from, to_date: to }));
  }, [selectedMonth, selectedYear, filterType]);

  const handleApply = () => {
    setFilters(draft);
    onApply?.(draft);
  };

  const handleClear = () => {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const from = `${now.getFullYear()}-${pad(currentMonthNum)}-01`;
    const to = `${now.getFullYear()}-${pad(currentMonthNum)}-${pad(
      getLastDay(now.getFullYear(), currentMonthNum),
    )}`;

    const cleared = {
      from_date: from,
      to_date: to,
      employee_id: "",
      employee_name: "",
      department_id: "",
      department_name: "",
    };

    setSelectedMonth(currentMonthNum);
    setSelectedYear(now.getFullYear());
    setFilterType("Month Wise");
    
    // Clear karne par text bhi current month par set karein
    setMonthText(MONTHS.find((m) => m.value === currentMonthNum)?.label || "");
    
    setDraft(cleared);
    setFilters(cleared);

    onClear?.();
  };

  return (
    <div className="bg-white rounded-lg px-5 py-5 shadow-sm ">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-6">

        {/* Filter Type */}
        <div className="relative max-w-[150px]">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Filter Type
          </label>
          <ERPAutocomplete
            value={filterType}
            options={["Month Wise", "Custom Date Range"]}
            onChange={(e) => setFilterType(e)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Month - FIX APPLIED HERE */}
        {filterType === "Month Wise" && (
          <div className="relative max-w-[120px]">
            <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
              Month
            </label>
            <ERPAutocomplete
              // Yahan se key={selectedMonth} hata diya gaya hai
              value={monthText}
              options={MONTHS.map((month) => month.label)}
              onChange={(typedValue) => {
                setMonthText(typedValue || ""); // Typed text ko state mein update karein
                
                const selected = MONTHS.find(
                  (m) => m.label === typedValue,
                );
                // Agar exact match mile tabhi selectedMonth ID ko update karein
                setSelectedMonth(selected?.value || "");
              }}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Custom Date Range */}
        {filterType === "Custom Date Range" && (
          <>
            <div className="relative max-w-[100px]">
              <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
                From Date
              </label>
              <ERPDate
                value={draft.from_date || ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, from_date: e }))
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="relative max-w-[100px]">
              <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
                To Date
              </label>
              <ERPDate
                value={draft.to_date || ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, to_date: e }))
                }
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Employee Autocomplete */}
        <div className="relative max-w-[150px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Employee
          </label>
          <ERPAutocomplete
            options={options.employees.map((emp) => emp.label)}
            value={draft.employee_name || ""}
            onChange={(selectedValue) => {
              const selectedEmp = options.employees.find(
                (emp) => emp.label === selectedValue,
              );
              setDraft((prev) => ({
                ...prev,
                employee_id: selectedEmp ? String(selectedEmp.value) : "",
                employee_name: selectedValue || "",
              }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Department Autocomplete */}
        <div className="relative max-w-[150px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Department
          </label>
          <ERPAutocomplete
            options={options.department.map((opt) => opt.label)}
            value={draft.department_name || ""}
            onChange={(selectedValue) => {
              const selectedObj = options.department.find(
                (opt) => opt.label === selectedValue,
              );
              setDraft((prev) => ({
                ...prev,
                department_id: selectedObj ? String(selectedObj.value) : "",
                department_name: selectedValue || "",
              }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out shadow-sm"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default OvertimeFilter;
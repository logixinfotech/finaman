// export default AttendanceFilter;
import { useState, useEffect } from "react";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const AttendanceRegisterFilter = ({ filters, setFilters, onApply, onClear }) => {
  const { options, loading } = useGroupOptions();

  // Local draft state initialized with parent filters
  const [draft, setDraft] = useState({
    month: filters.month || new Date().getMonth() + 1,
    year: filters.year || currentYear,
    branch_id: filters.branch_id || "",
    branch_name: filters.branch_name || "",
    department_id: filters.department_id || "",
    department_name: filters.department_name || "",
    employee_id: filters.employee_id || "",
    employee_name: filters.employee_name || "",
  });

  const [monthText, setMonthText] = useState(
    MONTHS.find((m) => m.value === draft.month)?.label || ""
  );

  const handleApply = () => {
    setFilters(draft);
    onApply?.(draft);
  };

  const handleClear = () => {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;

    const cleared = {
      month: currentMonthNum,
      year: now.getFullYear(),
      branch_id: "",
      branch_name: "",
      department_id: "",
      department_name: "",
      employee_id: "",
      employee_name: "",
    };

    setMonthText(MONTHS.find((m) => m.value === currentMonthNum)?.label || "");
    setDraft(cleared);
    setFilters(cleared);
    onClear?.();
  };

  return (
    <div className="bg-white rounded-lg px-5 py-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-6">

        {/* Month */}
        <div className="relative max-w-[140px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Month
          </label>
          <ERPAutocomplete
            value={monthText}
            options={MONTHS.map((month) => month.label)}
            onChange={(typedValue) => {
              setMonthText(typedValue || "");
              const selected = MONTHS.find((m) => m.label === typedValue);
              setDraft((prev) => ({ ...prev, month: selected?.value || prev.month }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Year */}
        <div className="relative max-w-[100px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Year
          </label>
          <ERPAutocomplete
            value={String(draft.year)}
            options={YEARS.map(String)}
            onChange={(val) => setDraft((prev) => ({ ...prev, year: parseInt(val) || currentYear }))}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Branch */}
        <div className="relative max-w-[150px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Branch
          </label>
          <ERPAutocomplete
            options={(options.branches || []).map((b) => b.label)}
            value={draft.branch_name || ""}
            onChange={(selectedValue) => {
              const selectedObj = (options.branches || []).find((b) => b.label === selectedValue);
              setDraft((prev) => ({
                ...prev,
                branch_id: selectedObj ? String(selectedObj.value) : "",
                branch_name: selectedValue || "",
              }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Department */}
        <div className="relative max-w-[150px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Department
          </label>
          <ERPAutocomplete
            options={(options.department || []).map((opt) => opt.label)}
            value={draft.department_name || ""}
            onChange={(selectedValue) => {
              const selectedObj = (options.department || []).find((opt) => opt.label === selectedValue);
              setDraft((prev) => ({
                ...prev,
                department_id: selectedObj ? String(selectedObj.value) : "",
                department_name: selectedValue || "",
              }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Employee */}
        <div className="relative max-w-[180px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Employee
          </label>
          <ERPAutocomplete
            options={(options.employees || []).map((emp) => emp.label)}
            value={draft.employee_name || ""}
            onChange={(selectedValue) => {
              const selectedEmp = (options.employees || []).find((emp) => emp.label === selectedValue);
              setDraft((prev) => ({
                ...prev,
                employee_id: selectedEmp ? String(selectedEmp.value) : "",
                employee_name: selectedValue || "",
              }));
            }}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition duration-150 ease-in-out shadow-sm"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRegisterFilter;
import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import ERPAutocomplete from "../input/ERPAutocomplete";
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

const LABEL_CLS =
  "absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10";
const INPUT_CLS =
  "w-full h-[30px] text-sm border border-gray-300 rounded-md px-3 py-2 bg-transparent outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const GenericFilter = ({
  filters,
  setShowFilter,
  setFilters,
  onApply,
  onClear,
  visibleFields = [],
  options = { employees: [], department: [], modules: [], area: [] },
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

  const toggle = () => setShowFilter((p) => !p);

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
      else if (
        curr === "Severity" ||
        curr === "classification" ||
        curr === "DocType" ||
        curr === "training_type" ||
        curr === "MonitoringType" ||
        curr === "category"
      )
        acc[curr] = "All";
      else if (curr === "Status" || curr === "status") acc[curr] = "All";
      else if (curr === "audit_type") acc[curr] = "All";
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
    <div className="bg-white rounded-lg px-3 py-4 sm:px-5 sm:py-5 shadow-sm">
      <div className="grid grid-cols-3 gap-x-2 gap-y-5 max-sm:[&>div]:!max-w-none sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-6">
        {visibleFields.includes("filterType") && (
          <div className="relative max-w-[150px] w-full">
            <label className={LABEL_CLS}>Filter Type</label>
            <ERPAutocomplete
              value={filterType}
              options={["Month Wise", "Custom Date Range"]}
              onChange={(val) => setFilterType(val)}
              className={INPUT_CLS}
            />
          </div>
        )}
        {visibleFields.includes("filterType") && filterType === "Month Wise" && (
          <div className="relative max-w-[120px] w-full">
            <label className={LABEL_CLS}>Month</label>
            <ERPAutocomplete
              value={monthText}
              options={MONTHS.map((month) => month.label)}
              onChange={(typedValue) => {
                setMonthText(typedValue || "");
                const selected = MONTHS.find((m) => m.label === typedValue);
                setSelectedMonth(selected?.value || "");
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 3. CUSTOM DATE RANGE */}
        {visibleFields.includes("filterType") && filterType === "Custom Date Range" && (
          <>
            <div className="relative max-w-[120px] w-full">
              <label className={LABEL_CLS}>From Date</label>
              <ERPDate
                value={draft.from_date || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, from_date: e }))}
                className={INPUT_CLS}
              />
            </div>

            <div className="relative max-w-[120px] w-full">
              <label className={LABEL_CLS}>To Date</label>
              <ERPDate
                value={draft.to_date || ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, to_date: e }))}
                className={INPUT_CLS}
              />
            </div>
          </>
        )}

        {/* 4. EMPLOYEE */}
        {visibleFields.includes("employee") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Employee</label>
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
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 5. DEPARTMENT */}
        {visibleFields.includes("department") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Department</label>
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
                  target_department: selectedValue || "",
                  department: selectedValue || "", // 👈 STP ke liye
                }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6. STATUS */}
        {visibleFields.includes("status") && (
          <div className="relative max-w-[130px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Status</label>
            <ERPAutocomplete
              value={draft.Status || draft.status || "All"}
              options={
                options?.status?.length
                  ? options.status.map((s) => (typeof s === "string" ? s : s.label))
                  : ["Active", "Inactive", "All"] // 👈 default fallback
              }
              onChange={(val) => setDraft((prev) => ({ ...prev, Status: val, status: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6b. AREA */}
        {visibleFields.includes("area") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Area</label>
            <ERPAutocomplete
              options={options?.area?.map((a) => a.label) || []}
              value={draft.Area || ""}
              onChange={(selectedValue) => {
                const selectedObj = options?.area?.find((a) => a.label === selectedValue);
                setDraft((prev) => ({
                  ...prev,
                  area_id: selectedObj ? String(selectedObj.value) : "",
                  Area: selectedValue || "",
                }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6c. SEVERITY */}
        {visibleFields.includes("severity") && (
          <div className="relative max-w-[130px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Severity</label>
            <ERPAutocomplete
              value={draft.Severity || "All"}
              options={["All", "Low", "Medium", "High", "Critical"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, Severity: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6d. PRODUCT */}
        {visibleFields.includes("product") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Product</label>
            <ERPAutocomplete
              options={options?.product?.map((p) => p.label) || []}
              value={draft.product || ""}
              onChange={(selectedValue) => {
                const selectedObj = options?.product?.find((p) => p.label === selectedValue);
                setDraft((prev) => ({
                  ...prev,
                  product_id: selectedObj ? String(selectedObj.value) : "",
                  product: selectedValue || "",
                }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6e. CLASSIFICATION */}
        {visibleFields.includes("classification") && (
          <div className="relative max-w-[140px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Classification</label>
            <ERPAutocomplete
              value={draft.classification || "All"}
              options={["All", "Class I", "Class II", "Class III"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, classification: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6f. DOC TYPE */}
        {visibleFields.includes("docType") && (
          <div className="relative max-w-[140px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Doc Type</label>
            <ERPAutocomplete
              value={draft.DocType || "All"}
              options={["All", "SOP", "Policy", "Form", "Manual", "Work Instruction"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, DocType: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6g. TRAINING TYPE */}
        {visibleFields.includes("trainingType") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Training Type</label>
            <ERPAutocomplete
              value={draft.training_type || "All"}
              options={["All", "Induction", "On-the-Job", "Refresher", "SOP", "GMP"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, training_type: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6h. MONITORING TYPE */}
        {visibleFields.includes("monitoringType") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Monitoring Type</label>
            <ERPAutocomplete
              value={draft.MonitoringType || "All"}
              options={["All", "Air", "Surface", "Personnel", "Water"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, MonitoringType: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6i. CATEGORY (STP) */}
        {visibleFields.includes("category") && (
          <div className="relative max-w-[140px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Category</label>
            <ERPAutocomplete
              value={draft.category || "All"}
              options={["All", "Manufacturing", "QC", "QA", "Engineering", "Warehouse"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, category: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6j. AUDIT TYPE */}
        {visibleFields.includes("auditType") && (
          <div className="relative max-w-[140px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Audit Type</label>
            <ERPAutocomplete
              value={draft.audit_type || "All"}
              options={["All", "Internal", "External", "Regulatory", "Supplier"]}
              onChange={(val) => setDraft((prev) => ({ ...prev, audit_type: val }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 6k. AREA/DEPT AUDITED (dynamic) */}
        {visibleFields.includes("areaAudited") && (
          <div className="relative max-w-[160px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Area/Dept Audited</label>
            <ERPAutocomplete
              options={options?.department?.map((d) => d.label) || []}
              value={draft.area_department_audited || ""}
              onChange={(selectedValue) => {
                const selectedObj = options?.department?.find((d) => d.label === selectedValue);
                setDraft((prev) => ({
                  ...prev,
                  area_department_audited_id: selectedObj ? String(selectedObj.value) : "",
                  area_department_audited: selectedValue || "",
                }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 7. MODULE (Menu Master) */}
        {visibleFields.includes("module") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Module</label>
            <ERPAutocomplete
              options={options?.modules?.map((m) => m.mod_name) || []}
              value={draft.mod_name || ""}
              onChange={(selectedValue) => {
                setDraft((prev) => ({ ...prev, mod_name: selectedValue || "" }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 7b. AUDIT MODULE (QMS audit trail) */}
        {visibleFields.includes("auditModule") && (
          <div className="relative max-w-[160px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Module</label>
            <ERPAutocomplete
              options={options?.auditModules?.map((m) => m.label) || []}
              value={
                options?.auditModules?.find((m) => m.value === (draft.moduleKey || ""))?.label ||
                "All Modules"
              }
              onChange={(selectedValue) => {
                const selectedObj = options?.auditModules?.find((m) => m.label === selectedValue);
                setDraft((prev) => ({ ...prev, moduleKey: selectedObj ? selectedObj.value : "" }));
              }}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 7c. RECORD NO */}
        {visibleFields.includes("recordNo") && (
          <div className="relative max-w-[170px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Record No.</label>
            <input
              type="text"
              placeholder="e.g. DEV-2026-0001"
              value={draft.recordNo || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, recordNo: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 8. MENU (pad_name) */}
        {visibleFields.includes("menu") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Menu</label>
            <input
              type="text"
              placeholder="Menu name"
              value={draft.pad_name || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, pad_name: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 9. APPLICATION (appl_name) */}
        {visibleFields.includes("application") && (
          <div className="relative max-w-[150px] flex-1 sm:flex-none w-full">
            <label className={LABEL_CLS}>Application</label>
            <input
              type="text"
              placeholder="Application"
              value={draft.appl_name || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, appl_name: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
        )}

        {/* 10. ITEM TYPE (item_type) */}
        {visibleFields.includes("itemType") && (
          <div className="relative max-w-[100px] w-full">
            <label className={LABEL_CLS}>Item Type</label>
            <input
              type="text"
              placeholder="F / R"
              value={draft.item_type || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, item_type: e.target.value }))}
              className={`${INPUT_CLS} text-center`}
            />
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="col-span-3 sm:col-span-1 flex items-center gap-2 sm:gap-3 sm:ml-auto">
          <button
            onClick={handleApply}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out shadow-sm h-[34px] sm:h-[28px]"
          >
            <Filter size={10} />
            Apply
          </button>
          <button
            onClick={handleClear}
            onDoubleClick={toggle}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-sm h-[34px] sm:h-[28px]"
          >
            <X size={10} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericFilter;
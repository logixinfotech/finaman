import { useState, useMemo } from "react";
import Table from "../../../../components/Reusable/table/Table";
import OvertimeFilter from "./OvertimeFilter";
import OvertimeDrillDown from "./OverTimeDrillDown";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { showToast } from "../../../../components/Reusable/alert";
const columns = [
  {
    key: "employee_code",
    label: "Emp Code",
    render: (row) => (
      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
        {row.employee_code}
      </span>
    ),
  },
  {
    key: "employee_name",
    label: "Employee Name",
    render: (row) => (
      <span className="font-medium text-gray-800">{row.employee_name}</span>
    ),
  },
  {
    key: "department",
    label: "Department",
    render: (row) => (
      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
        {row.department}
      </span>
    ),
  },
  {
    key: "ot_date",
    label: "OT Date",
    render: (row) =>
      new Date(row.ot_date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  { key: "in_time", label: "In Time" },
  { key: "out_time", label: "Out Time" },
  {
    key: "worked_hours",
    label: "Worked Hrs",
    render: (row) => (
      <span className="text-gray-600">{row.worked_hours} h</span>
    ),
  },
  {
    key: "ot_hours",
    label: "OT Hrs",
    render: (row) => (
      <span className="inline-block bg-purple-100 text-purple-700 font-semibold text-xs px-2 py-0.5 rounded-full">
        {row.ot_hours} h
      </span>
    ),
  },
  {
    key: "ot_amount",
    label: "OT Amount",
    render: (row) => (
      <span className="font-semibold text-emerald-600">
        ₹{" "}
        {new Intl.NumberFormat("en-IN").format(
          Math.max(0, parseFloat(row.ot_amount) || 0)
        )}
      </span>
    ),
  },
];
const dummyOvertimeData = [
  {
    ot_id: 1,
    employee_code: "EMP001",
    employee_name: "Rahul Sharma",
    department: "IT",
    ot_date: "2026-05-04",
    in_time: "09:00 AM",
    out_time: "08:30 PM",
    worked_hours: "11.5",
    ot_hours: "3.5",
    ot_amount: "1750",
  },
  {
    ot_id: 2,
    employee_code: "EMP001",
    employee_name: "Rahul Sharma",
    department: "IT",
    ot_date: "2026-05-11",
    in_time: "09:00 AM",
    out_time: "09:00 PM",
    worked_hours: "12",
    ot_hours: "4",
    ot_amount: "2000",
  },
  {
    ot_id: 3,
    employee_code: "EMP002",
    employee_name: "Amit Verma",
    department: "HR",
    ot_date: "2026-05-06",
    in_time: "09:15 AM",
    out_time: "07:45 PM",
    worked_hours: "10.5",
    ot_hours: "2.5",
    ot_amount: "1250",
  },
  {
    ot_id: 4,
    employee_code: "EMP003",
    employee_name: "Priya Singh",
    department: "Finance",
    ot_date: "2026-05-07",
    in_time: "08:50 AM",
    out_time: "09:00 PM",
    worked_hours: "12",
    ot_hours: "4",
    ot_amount: "2200",
  },
  {
    ot_id: 5,
    employee_code: "EMP003",
    employee_name: "Priya Singh",
    department: "Finance",
    ot_date: "2026-05-14",
    in_time: "09:00 AM",
    out_time: "08:00 PM",
    worked_hours: "11",
    ot_hours: "3",
    ot_amount: "1650",
  },
  {
    ot_id: 6,
    employee_code: "EMP004",
    employee_name: "Neha Gupta",
    department: "Admin",
    ot_date: "2026-05-08",
    in_time: "09:30 AM",
    out_time: "08:00 PM",
    worked_hours: "10.5",
    ot_hours: "2.5",
    ot_amount: "1350",
  },
  {
    ot_id: 7,
    employee_code: "EMP005",
    employee_name: "Vikas Kumar",
    department: "Sales",
    ot_date: "2026-05-09",
    in_time: "09:10 AM",
    out_time: "10:00 PM",
    worked_hours: "13",
    ot_hours: "5",
    ot_amount: "3000",
  },
  {
    ot_id: 8,
    employee_code: "EMP005",
    employee_name: "Vikas Kumar",
    department: "Sales",
    ot_date: "2026-05-16",
    in_time: "09:00 AM",
    out_time: "09:30 PM",
    worked_hours: "12.5",
    ot_hours: "4.5",
    ot_amount: "2700",
  },
  {
    ot_id: 9,
    employee_code: "EMP002",
    employee_name: "Amit Verma",
    department: "HR",
    ot_date: "2026-05-13",
    in_time: "09:00 AM",
    out_time: "08:15 PM",
    worked_hours: "11.25",
    ot_hours: "3.25",
    ot_amount: "1625",
  },
  {
    ot_id: 10,
    employee_code: "EMP001",
    employee_name: "Rahul Sharma",
    department: "IT",
    ot_date: "2026-05-18",
    in_time: "09:00 AM",
    out_time: "07:30 PM",
    worked_hours: "10.5",
    ot_hours: "2.5",
    ot_amount: "1250",
  },
];
const OvertimeDetailsReport = () => {
  const [list] = useState(dummyOvertimeData);
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [drillDownEmployee, setDrillDownEmployee] = useState(null); // { row }
  const [filters, setFilters] = useState({
    from_date: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    })(),
    to_date: (() => {
      const d = new Date();
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    })(),
    employee_id: "",
    department_id: "",
  });

  /* ── Filtered Data ── */
  const filteredList = useMemo(() => {
    return list.filter((row) => {
      const matchEmp =
        !filters.employee_id ||
        row.employee_code.toLowerCase().includes(filters.employee_id.toLowerCase()) ||
        row.employee_name.toLowerCase().includes(filters.employee_id.toLowerCase());
      const matchDept =
        !filters.department_id || row.department === filters.department_id;
      const matchFrom = !filters.from_date || row.ot_date >= filters.from_date;
      const matchTo = !filters.to_date || row.ot_date <= filters.to_date;
      return matchEmp && matchDept && matchFrom && matchTo;
    });
  }, [list, filters]);
  /* ── Drill-down: collect all records for that employee ── */
  const handleDrillDown = (row) => {
    const empRecords = list.filter((r) => r.employee_code === row.employee_code);
    setDrillDownEmployee({ row, records: empRecords });
  };

  /* ── Handlers ── */
  const handleRefresh = () =>
    showToast({ icon: "success", title: "Data Refreshed" });

  const handleExportExcel = () => {
    if (filteredList.length === 0)
      return showToast({ icon: "warning", title: "No data to export" });
    showToast({ icon: "success", title: "Exporting to Excel…" });
  };

  /* ── Print Sections ── */
  const reportPrintSections = [
    {
      type: "custom",
      render: () => (
        <div>
          <h2 className="text-center font-bold text-lg mb-4">
            OVERTIME DETAILS REPORT
          </h2>
          <table className="w-full border-collapse text-xs border">
            <thead>
              <tr className="bg-gray-100">
                {["Code", "Name", "Department", "Date", "In", "Out", "OT Hrs", "Amount"].map(
                  (h) => (
                    <th key={h} className="border p-2 text-left">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
                <tr key={idx} className="border">
                  <td className="border ">{row.employee_code}</td>
                  <td className="border ">{row.employee_name}</td>
                  <td className="border ">{row.department}</td>
                  <td className="border ">{row.ot_date}</td>
                  <td className="border ">{row.in_time}</td>
                  <td className="border ">{row.out_time}</td>
                  <td className="border  text-center">{row.ot_hours}</td>
                  <td className="border ">₹ {row.ot_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  /* ── Render: Drill-down View ── */
  if (drillDownEmployee) {
    return (
      <div className="h-full w-full">
        <OvertimeDrillDown
          employee={drillDownEmployee.row}
          records={drillDownEmployee.records}
          onBack={() => setDrillDownEmployee(null)}
        />
      </div>
    );
  }

  /* ── Render: Print Preview ── */
  if (showPreview) {
    return (
      <ERPPrintPreview
        title="Overtime Details Report"
        sections={reportPrintSections}
        onBack={() => setShowPreview(false)}
        logo="/finaman-logo.png"
      />
    );
  }

  /* ── Render: Main Report ── */
  return (
    <div className="h-full w-full bg-slate-50 flex flex-col gap-1">
      {/* ── Data Table ── */}
      <div className="flex-1 min-h-0">
        <Table
          title="Overtime Details Report"
          data={filteredList}
          columns={columns}
          rowKey="ot_id"
          loading={false}
          onRefresh={handleRefresh}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter(!showFilter)}
          onRowDoubleClick={handleDrillDown}
          customActions={[
            {
              label: "Print",
              icon: "pi pi-print",
              onClick: () => setShowPreview(true),
              className:
                "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors",
            },
            {
              label: "Export",
              icon: "pi pi-file-excel",
              onClick: handleExportExcel,
              className:
                "bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors",
            },
          ]}
          rowActions={[
            {
              label: "View",
              icon: "pi pi-chart-bar",
              onClick: handleDrillDown,
              className:
                "text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors",
            },
          ]}
          formComponent={
            <OvertimeFilter
              filters={filters}
              setFilters={setFilters}
              onApply={() =>
                showToast({ icon: "success", title: "Filter Applied" })
              }
              onClear={() => {
                const d = new Date();
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const last = new Date(y, d.getMonth() + 1, 0).getDate();
                setFilters({
                  from_date: `${y}-${m}-01`,
                  to_date: `${y}-${m}-${String(last).padStart(2, "0")}`,
                  employee_id: "",
                  department_id: "",
                });
                showToast({ icon: "info", title: "Filters Cleared" });
              }}
            />
          }
        />
      </div>
    </div>
  );
};

export default OvertimeDetailsReport;

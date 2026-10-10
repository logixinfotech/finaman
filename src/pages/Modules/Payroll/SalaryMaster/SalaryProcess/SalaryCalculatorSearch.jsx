import React from "react";
import Table from "../../../../../components/Reusable/table/Table";
import { Search, X, Users } from "lucide-react";

const STATUS_STYLES = {
  Active: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
  Inactive: { bg: "bg-[#F1EFE8]", text: "text-[#444441]" },
  Pending: { bg: "bg-[#FAEEDA]", text: "text-[#633806]" },
  Created: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
};

export const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Inactive;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      {status ?? "—"}
    </span>
  );
};

export const StatChip = ({ label, value, bg, color }) => (
  <div className={`flex-1 text-center py-1.5 px-1 rounded-lg ${bg}`}>
    <div className={`text-[16px] font-semibold leading-none ${color}`}>{value}</div>
    <div className={`text-[10px] mt-1 opacity-70 ${color}`}>{label}</div>
  </div>
);

export const TabBtn = ({ label, active, badge, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-2.5 py-1.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all
      ${active ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
  >
    {label}
    {badge != null && badge > 0 && (
      <span className="ml-1 bg-[#FAEEDA] text-[#633806] text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
        {badge}
      </span>
    )}
  </button>
);

export const EmployeeListCard = ({ record, isActive, onClick }) => {
  const empName = record.Led_name || record.employee_name || record.name || `Employee #${record.Actled_id}`;
  const empId = record.Actled_id || record.employee_id || record._id;
  const grade = record._gradeLabel || record.Op_id1 || record.grade;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100 mb-1.5
        ${isActive
          ? "border-[#185FA5] bg-[#E6F1FB] shadow-xs"
          : "border-slate-200 bg-white hover:border-[#85B7EB] hover:bg-[#E6F1FB]/40 active:bg-[#E6F1FB]/60"
        }`}
    >
      <div className="flex items-center justify-between mb-0.5 gap-2">
        <span className="text-[13px] font-medium truncate text-slate-800">
          {empName}
        </span>
        <StatusPill status={record._status} />
      </div>
      <div className="text-[11px] truncate text-slate-500">
        ID: {empId} {grade ? `· Grade ${grade}` : ""}
      </div>
    </button>
  );
};

const SalaryCalculatorSearch = ({
  activeTab = "search",
  onTabChange = () => { },
  pendingEmp = 0,
  createdEmp = 0,
  totalEmp = 0,
  sidebarTab = "Pending",
  setSidebarTab = () => { },
  sidebarSearch = "",
  setSidebarSearch = () => { },
  sidebarEmployees = [],
  selectedEmpId = "",
  handleSidebarEmployeePick = () => { },
  latestStructuresList = [],
  searchColumns = [],
  loadingStructures = false,
  handleTableRowDoubleClick = () => { },
  loadSalaryStructures = () => { },
}) => {
  const sidebarPanel = (
    <div className="w-full md:w-[280px] h-full flex flex-col max-h-[45vh] md:max-h-none overflow-hidden bg-white">
      {/* Stat Chips */}
      <div className="p-3 border-b border-slate-100 shrink-0">
        <div className="flex gap-1.5">
          <StatChip label="Pend" value={pendingEmp} bg="bg-[#FAEEDA]" color="text-[#633806]" />
          <StatChip label="Created" value={createdEmp} bg="bg-[#EAF3DE]" color="text-[#27500A]" />
          <StatChip label="All" value={totalEmp} bg="bg-[#E6F1FB]" color="text-[#0C447C]" />
        </div>
      </div>

      {/* Sub-Tabs: Pending / Created / All */}
      <div className="flex px-2 border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0">
        {["Pending", "Created", "All"].map((t) => (
          <TabBtn
            key={t}
            label={t}
            active={sidebarTab === t}
            badge={t === "Pending" ? pendingEmp : null}
            onClick={() => setSidebarTab(t)}
          />
        ))}
      </div>

      {/* Sidebar Search */}
      <div className="p-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search employee..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full text-[12px] bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
          {sidebarSearch && (
            <button
              type="button"
              onClick={() => setSidebarSearch("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Employee Cards */}
      <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
        {sidebarEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
            <Users size={24} className="opacity-40" />
            <span className="text-[12px]">No employees found</span>
          </div>
        ) : (
          sidebarEmployees.map((emp) => (
            <EmployeeListCard
              key={emp.Actled_id || emp.employee_id || emp._id}
              record={emp}
              isActive={selectedEmpId === String(emp.Actled_id || emp.employee_id || emp._id)}
              onClick={() => handleSidebarEmployeePick(emp)}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col bg-slate-50 overflow-hidden">
      <Table
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Assigned Salary Structures"
        data={latestStructuresList}
        columns={searchColumns}
        rowKey="salary_structure_id"
        loading={loadingStructures}
        onAdd={() => onTabChange("entry")}
        onRowClick={handleTableRowDoubleClick}
        onRowDoubleClick={handleTableRowDoubleClick}
        onRefresh={loadSalaryStructures}
        leftPanel={sidebarPanel}
      />
    </div>
  );
};

export default SalaryCalculatorSearch;

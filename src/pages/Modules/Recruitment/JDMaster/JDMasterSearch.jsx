import React from "react";
import Table from "../../../../components/Reusable/table/Table";
import { FaBriefcase, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const JDMasterSearch = ({
  jds = [],
  loading = false,
  onSelectJD,
  onNewEntry,
  onTabChange,
  onRefresh,
  onDeleteMultiple,
}) => {
  const columns = [
    {
      key: "jd_code",
      label: "JD Code",
      render: (row) => (
        <span className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer">
          {row.jd_code}
        </span>
      ),
    },
    {
      key: "job_title",
      label: "Job Title",
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.job_title}
        </span>
      ),
    },
    {
      key: "department_name",
      label: "Department",
      render: (row) => (
        <span className="text-slate-600">
          {row.department_name || "—"}
        </span>
      ),
    },
    {
      key: "designation_name",
      label: "Designation",
      render: (row) => (
        <span className="text-slate-600">
          {row.designation_name || "—"}
        </span>
      ),
    },
    {
      key: "experience",
      label: "Exp (Yrs)",
      render: (row) => {
        const min = row.min_experience || 0;
        const max = row.max_experience || 0;
        if (min === 0 && max === 0) return <span className="text-slate-400">Fresher / Any</span>;
        return (
          <span className="text-slate-700 font-medium">
            {min} - {max} yrs
          </span>
        );
      },
    },
    {
      key: "skills_count",
      label: "Skills Mapped",
      render: (row) => {
        const count = Array.isArray(row.skills) ? row.skills.length : 0;
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {count} {count === 1 ? "Skill" : "Skills"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const isActive = row.status === "Active";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {isActive ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
            {row.status || "Active"}
          </span>
        );
      },
    },
  ];

  return (
    <Table
      activeTab="search"
      onTabChange={onTabChange}
      data={jds}
      columns={columns}
      loading={loading}
      onRowDoubleClick={onSelectJD}
      onAddNew={onNewEntry}
      onRefresh={onRefresh}
      onDeleteMultiple={onDeleteMultiple}
      exportFileName="Job_Descriptions_Master"
      title="Job Description (JD) Master"
      searchPlaceholder="Search by JD code, job title, department, skills..."
      showAddButton={true}
      showCheckboxes={false}
      defaultSortField="jd_code"
      defaultSortOrder="desc"
    />
  );
};

export default JDMasterSearch;

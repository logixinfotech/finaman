import React from "react";
import Table from "../../../../components/Reusable/table/Table";
import { FaUserTie } from "react-icons/fa";

const STATUS_BADGE_STYLES = {
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Open: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
  "On Hold": "bg-purple-50 text-purple-700 border-purple-200",
  Closed: "bg-slate-200 text-slate-800 border-slate-300",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const PRIORITY_BADGE_STYLES = {
  Urgent: "text-rose-700 bg-rose-50 border-rose-200 font-semibold",
  High: "text-orange-700 bg-orange-50 border-orange-200 font-semibold",
  Normal: "text-slate-700 bg-slate-50 border-slate-200",
  Low: "text-slate-500 bg-slate-50 border-slate-200",
};

const JobVacancySearch = ({
  vacancies = [],
  loading = false,
  onSelectVacancy,
  onNewEntry,
  onTabChange,
  onRefresh,
  onDeleteMultiple,
}) => {
  const columns = [
    {
      key: "vacancy_no",
      label: "Vacancy No",
      render: (row) => (
        <span className="font-semibold text-blue-700 hover:underline cursor-pointer">
          {row.vacancy_no}
        </span>
      ),
    },
    {
      key: "vacancy_date",
      label: "Date",
      render: (row) =>
        row.vacancy_date
          ? new Date(row.vacancy_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "—",
    },
    {
      key: "designation_name",
      label: "Designation / Role",
      render: (row) => (
        <div className="flex items-center min-h-[32px] leading-4">
          <span
            className="font-medium text-slate-800 truncate whitespace-nowrap"
            title={row.designation_name || row.job_role || ""}
          >
            {row.designation_name || row.job_role || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "department_name",
      label: "Department",
      render: (row) => row.department_name || "—",
    },
    {
      key: "vacancy_type",
      label: "Type",
      render: (row) => (
        <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.vacancy_type || "New Position"}
        </span>
      ),
    },
    {
      key: "positions",
      label: "Positions (Req / Filled)",
      render: (row) => (
        <div className="text-center font-medium">
          <span className="text-blue-700 font-semibold">{row.number_of_positions || 1}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-emerald-700">{row.filled_positions || 0}</span>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) => {
        const p = row.priority || "Normal";
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] border ${PRIORITY_BADGE_STYLES[p] || PRIORITY_BADGE_STYLES.Normal}`}>
            {p}
          </span>
        );
      },
    },
    {
      key: "requested_by_name",
      label: "Requested By",
      render: (row) => row.requested_by_name || "—",
    },
    {
      key: "recruitment_owner_name",
      label: "Owner",
      render: (row) => row.recruitment_owner_name || "—",
    },
    {
      key: "vacancy_status",
      label: "Status",
      render: (row) => {
        const s = row.vacancy_status || "Draft";
        return (
          <span className={`px-2.5 py-0.5  text-[11px] font-medium border ${STATUS_BADGE_STYLES[s] || STATUS_BADGE_STYLES.Draft}`}>
            {s}
          </span>
        );
      },
    },
  ];

  return (
    <Table
      activeTab="search"
      onTabChange={onTabChange}
      title="Job Vacancy Entry"
      TitleIcon={FaUserTie}
      data={vacancies}
      columns={columns}
      rowKey="vacancy_id"
      loading={loading}
      onAdd={onNewEntry}
      onRowDoubleClick={onSelectVacancy}
      onRowClick={onSelectVacancy}
      onRefresh={onRefresh}
      onDeleteMultiple={onDeleteMultiple}
    />
  );
};

export default JobVacancySearch;

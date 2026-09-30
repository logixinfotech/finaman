import React from "react";
import Table from "../../../../components/Reusable/table/Table";
import { FaBrain, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case "Technical / Hard Skill":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Behavioral / Soft Skill":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Tool / Software Proficiency":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const SkillMasterSearch = ({
  skills = [],
  loading = false,
  onSelectSkill,
  onNewEntry,
  onTabChange,
  onRefresh,
  onDeleteMultiple,
}) => {
  const columns = [
    {
      key: "skill_code",
      label: "Skill ID",
      render: (row) => (
        <span className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer">
          {row.skill_code}
        </span>
      ),
    },
    {
      key: "skill_name",
      label: "Skill Name",
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.skill_name}
        </span>
      ),
    },
    {
      key: "skill_category",
      label: "Category",
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getCategoryBadgeClass(
            row.skill_category
          )}`}
        >
          {row.skill_category}
        </span>
      ),
    },
    {
      key: "proficiency_scale_type",
      label: "Proficiency Scale",
      render: (row) => (
        <span className="text-slate-600">
          {row.proficiency_scale_type}
        </span>
      ),
    },
    {
      key: "skill_description",
      label: "Description",
      render: (row) => (
        <span className="text-slate-500 truncate max-w-xs block" title={row.skill_description || ""}>
          {row.skill_description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const isActive = row.status === "Active";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5  text-[11px] font-semibold ${isActive
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
      title="Skill Master"
      TitleIcon={FaBrain}
      data={skills}
      columns={columns}
      rowKey="skill_id"
      loading={loading}
      onAdd={onNewEntry}
      onRowDoubleClick={onSelectSkill}
      onRowClick={onSelectSkill}
      onRefresh={onRefresh}
      onDeleteMultiple={onDeleteMultiple}
    />
  );
};

export default SkillMasterSearch;

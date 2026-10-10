import React from "react";
import Table from "../../../../components/Reusable/table/Table";
import { Award, CheckCircle, XCircle, Clock, Link2 } from "lucide-react";
import { copyToClipboard } from "../../../../utils/helpers";
import { showToast } from "../../../../components/Reusable/alert";

// Open public link for an assessment: candidates enter their details, then take the test
const buildOpenLink = (assessmentId) => {
  let tenantDb = "";
  try {
    tenantDb = JSON.parse(localStorage.getItem("user") || "{}")?.database || "";
  } catch (_) { }
  return `${window.location.origin}/assessment?db=${encodeURIComponent(tenantDb)}&aid=${encodeURIComponent(assessmentId)}`;
};

const AssessmentMasterSearch = ({
  assessments = [],
  loading = false,
  onSelectAssessment,
  onNewEntry,
  onTabChange,
  onRefresh,
  onDeleteMultiple,
}) => {
  const columns = [
    {
      key: "assessment_code",
      label: "Assessment Code",
      width: 120,
      render: (row) => (
        <span className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer">
          {row.assessment_code}
        </span>
      ),
    },
    {
      key: "assessment_name",
      label: "Assessment Title",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{row.assessment_name}</span>
          {row.description && (
            <span className="text-[11px] text-slate-400 font-normal truncate max-w-xs block" title={row.description}>
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "total_questions",
      label: "Questions",
      width: 90,
      render: (row) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
          {row.total_questions || row.question_count || 0}
        </span>
      ),
    },
    {
      key: "estimated_duration_minutes",
      label: "Duration",
      width: 100,
      render: (row) => (
        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
          <Clock className="w-3 h-3 text-slate-400" />
          {row.estimated_duration_minutes || 30} mins
        </div>
      ),
    },
    {
      key: "total_marks",
      label: "Total Marks",
      width: 80,
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">
          {row.total_marks || 0}
        </span>
      ),
    },
    {
      key: "passing_marks",
      label: "Passing Marks",
      width: 80,
      render: (row) => (
        <span className="font-semibold text-blue-700 text-xs">
          {row.passing_marks || 0}
        </span>
      ),
    },
    {
      key: "assigned_count",
      label: "Candidates",
      width: 90,
      render: (row) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
          {row.assigned_count || 0}
        </span>
      ),
    },
    {
      key: "public_link",
      label: "Public Link",
      width: 110,
      render: (row) => (
        <button
          type="button"
          title={buildOpenLink(row.assessment_id)}
          onClick={async (e) => {
            e.stopPropagation(); // don't open the record
            await copyToClipboard(buildOpenLink(row.assessment_id));
            showToast({ icon: "success", title: "Public link copied" });
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
        >
          <Link2 className="w-3 h-3" />
          Copy Link
        </button>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: 100,
      render: (row) => {
        const isActive = row.status === "Active";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
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
      title="Assessment Master"
      TitleIcon={Award}
      data={assessments}
      columns={columns}
      rowKey="assessment_id"
      loading={loading}
      onAdd={onNewEntry}
      onRowDoubleClick={onSelectAssessment}
      onRowClick={onSelectAssessment}
      onRefresh={onRefresh}
      onDeleteMultiple={onDeleteMultiple}
    />
  );
};

export default AssessmentMasterSearch;

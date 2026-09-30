import React, { useCallback, useEffect, useMemo, useState } from "react";
import Table from "../../../../components/Reusable/table/Table";
import { showToast } from "../../../../components/Reusable/alert";
import { formInputClass } from "../../../../components/Reusable/form/SectionCard";
import {
  getPipelineList,
  getPipelineSummary,
  getPipelineRecruiters,
  getActiveVacanciesWithJD,
} from "../../../../utils/recruitmentApi";
import PipelineProgressBar from "./components/PipelineProgressBar";
import StatusChip from "./components/StatusChip";
import PipelineStageStrip from "./components/PipelineStageStrip";
import { CATEGORY_STYLES, STAGES, initials, styleFor, timeAgo } from "./pipelineConstants";
import { GitBranch, Phone, ClipboardEdit, Eye, LayoutList, LayoutGrid } from "lucide-react";

const SORT_MAP = { candidate: "candidate", vacancy: "vacancy", progress: "stage", status: "status", next_action: "since", recruiter: "recruiter" };
const SOURCES = ["PublicURL", "InternalHR", "Bulk Excel", "Referral", "Career Portal", "Direct", "Naukri", "LinkedIn"];
const EMPTY_FILTERS = { vacancy_id: "All", stage: "All", category: "All", recruiter_id: "All", source: "All", my_tasks: false };

const KpiCard = ({ label, value, sub, tone = "slate" }) => {
  const tones = { slate: "text-slate-800", blue: "text-blue-700", amber: "text-amber-600", emerald: "text-emerald-600", rose: "text-rose-600" };
  return (
    <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm px-2.5 py-1.5 min-w-0 flex items-center gap-2.5">
      <span className={`text-[20px] font-bold leading-6 tabular-nums shrink-0 ${tones[tone]}`}>{value ?? "—"}</span>
      <span className="min-w-0">
        <span className="block text-[10.5px] font-semibold text-slate-600 truncate leading-tight">{label}</span>
        <span className="block text-[9.5px] text-slate-400 truncate leading-tight">{sub}</span>
      </span>
    </div>
  );
};

export default function PipelineList({ onOpen, onAdd, refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ kpi: {}, stages: [] });
  const [vacancies, setVacancies] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState({ page: 1, pageSize: 50, search: "", sort: "since", dir: "desc" });
  const [showFilters, setShowFilters] = useState(true);

  const loadSummary = useCallback(async () => {
    const [s, v, r] = await Promise.all([getPipelineSummary(), getActiveVacanciesWithJD(), getPipelineRecruiters()]);
    if (s?.success) setSummary({ kpi: s.kpi || {}, stages: s.stages || [] });
    if (v?.data) setVacancies(v.data);
    if (r?.data) setRecruiters(r.data);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await getPipelineList({
      ...query,
      vacancy_id: filters.vacancy_id,
      stage: filters.stage,
      category: filters.category,
      recruiter_id: filters.recruiter_id,
      source: filters.source,
      my_tasks: filters.my_tasks ? 1 : 0,
    });
    if (res?.success) {
      setRows(res.data || []);
      setTotal(res.total || 0);
    } else {
      showToast({ icon: "error", title: res?.message || "Failed to load pipeline" });
    }
    setLoading(false);
  }, [query, filters]);

  useEffect(() => { loadSummary(); }, [loadSummary, refreshKey]);
  useEffect(() => { loadList(); }, [loadList, refreshKey]);

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setQuery((q) => ({ ...q, page: 1 })); };

  // Table → server paging / sorting (search arrives via onSearch)
  const handlePageChange = useCallback((page, pageSize, _search, sortField, sortOrder) => {
    setQuery((q) => ({ ...q, page, pageSize, sort: SORT_MAP[sortField] || "since", dir: sortField ? sortOrder : "desc" }));
  }, []);
  const handleSearch = useCallback((text) => setQuery((q) => ({ ...q, page: 1, search: text })), []);

  const columns = useMemo(() => [
    {
      key: "candidate",
      label: "Candidate",
      width: 230,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}
          >
            {initials(row.full_name)}
          </span>
          <span className="min-w-0 truncate">
            <span className="font-semibold text-slate-800">{row.full_name || "—"}</span>
            <span className="text-slate-400 text-[10.5px]"> · {row.candidate_code} · {row.entry_channel === "PublicURL" ? "URL" : row.source_channel || row.entry_channel}</span>
          </span>
        </span>
      ),
    },
    {
      key: "vacancy",
      label: "Vacancy",
      width: 190,
      render: (row) => (
        <span className="truncate" title={`${row.v_title} (${row.vacancy_no || ""})`}>
          <span className="font-medium text-slate-800">{row.v_title}</span>
          <span className="text-slate-400 text-[10.5px]"> · {row.vacancy_no || "—"}</span>
        </span>
      ),
    },
    {
      key: "progress",
      label: "Pipeline Progress",
      width: 200,
      render: (row) => (
        <span className="flex items-center gap-2 w-full min-w-0">
          <PipelineProgressBar currentStage={row.current_stage} category={row.category} statusBase={row.current_status_base} showCaption={false} compact className="w-[90px] shrink-0" />
          <span className="text-[10.5px] text-slate-500 truncate">Stage {row.current_stage} of 7 · {STAGES[row.current_stage - 1]?.short}</span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Unique Status",
      width: 300,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <StatusChip status={row.current_status} category={row.category} statusBase={row.current_status_base} />
          <span className="text-[10.5px] text-slate-500 shrink-0">{styleFor(row.category, row.current_status_base).label} · {timeAgo(row.status_since)}</span>
        </span>
      ),
    },
    { key: "next_action", label: "Next Action", width: 240, render: (row) => <span className="truncate" title={row.next_action || ""}>{row.next_action || "—"}</span> },
    { key: "recruiter", label: "Recruiter", width: 120, render: (row) => row.recruiter_name || "—" },
  ], []);

  const actions = useCallback((row) => {
    const btn = "w-[20px] h-[20px] rounded flex items-center justify-center transition-colors";
    return (
      <>
        <button type="button" aria-label="Log call" title="Log Call" onClick={(e) => { e.stopPropagation(); onOpen(row, "call"); }} className={`${btn} text-amber-600 hover:bg-amber-50`}><Phone size={12} /></button>
        <button type="button" aria-label="Update status" title="Update Status" onClick={(e) => { e.stopPropagation(); onOpen(row, "update"); }} className={`${btn} text-blue-600 hover:bg-blue-50`}><ClipboardEdit size={12} /></button>
        <button type="button" aria-label="View candidate" title="View" onClick={(e) => { e.stopPropagation(); onOpen(row, "view"); }} className={`${btn} text-slate-600 hover:bg-slate-100`}><Eye size={12} /></button>
      </>
    );
  }, [onOpen]);

  const k = summary.kpi || {};
  const filterPanel = (
    <div className="px-2.5 pt-2 pb-1.5 space-y-1.5 bg-[#eef1f8] border-b border-[#dde1ea]">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <KpiCard label="Total in Pipeline" value={k.total} sub={`across ${k.vacancies || 0} open vacancies`} />
        <KpiCard label="Active" value={k.active} sub="moving through stages" tone="blue" />
        <KpiCard label="Comm Pending (My Tasks)" value={k.comm_pending_mine} sub={`${k.comm_pending_all || 0} total · recruiter action required`} tone="amber" />
        <KpiCard label="Interviews Today" value={k.interviews_today} sub="R1 · R2 · Final" />
        <KpiCard label="Rejected / Dropped" value={k.rejected_this_month} sub="this month" tone="rose" />
        <KpiCard label="Joined" value={k.joined} sub="converted to employee" tone="emerald" />
      </div>

      {/* Pipeline by stage */}
      <PipelineStageStrip
        stages={summary.stages}
        selectedStage={filters.stage}
        onSelectStage={(v) => setFilter("stage", v)}
        joined={k.joined || 0}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={filters.vacancy_id} onChange={(e) => setFilter("vacancy_id", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px] min-w-[150px]`} aria-label="Vacancy">
          <option value="All">Vacancy: All ({vacancies.length})</option>
          {vacancies.map((v) => <option key={v.vacancy_id} value={v.vacancy_id}>{v.job_title || v.designation_name} ({v.vacancy_no})</option>)}
        </select>
        <select value={filters.stage} onChange={(e) => setFilter("stage", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Stage">
          <option value="All">Stage: All</option>
          {STAGES.map((s) => <option key={s.stage_no} value={s.stage_no}>{s.stage_no}. {s.stage_name}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Category">
          <option value="All">Category: All</option>
          {Object.entries(CATEGORY_STYLES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
        <select value={filters.recruiter_id} onChange={(e) => setFilter("recruiter_id", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Recruiter">
          <option value="All">Recruiter: All</option>
          {recruiters.map((r) => <option key={r.recruiter_id} value={r.recruiter_id}>{r.recruiter_name}</option>)}
        </select>
        <select value={filters.source} onChange={(e) => setFilter("source", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Source">
          <option value="All">Source: All</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-[11.5px] text-slate-700 cursor-pointer select-none">
          <input type="checkbox" checked={filters.my_tasks} onChange={(e) => setFilter("my_tasks", e.target.checked)} className="accent-[var(--icon-color)]" />
          Show only my tasks
        </label>
        {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
          <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setQuery((q) => ({ ...q, page: 1 })); }} className="text-[11px] text-blue-600 hover:underline">Clear filters</button>
        )}
        <span className="ml-auto flex items-center gap-0.5 bg-slate-100 rounded-md p-[2px]">
          <button type="button" className="h-[24px] px-2.5 rounded text-[11px] font-semibold bg-white shadow-sm flex items-center gap-1" style={{ color: "var(--icon-color)" }} aria-pressed="true"><LayoutList size={12} /> List</button>
          <button type="button" disabled title="Board view coming soon" className="h-[24px] px-2.5 rounded text-[11px] font-semibold text-slate-400 flex items-center gap-1 cursor-not-allowed"><LayoutGrid size={12} /> Board</button>
        </span>
      </div>
    </div>
  );

  return (
    <Table
      title="CANDIDATE PIPELINE"
      TitleIcon={GitBranch}
      data={rows}
      columns={columns}
      rowKey="pipeline_id"
      loading={loading}
      serverPagination
      totalRecords={total}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onRowClick={(row) => onOpen(row, "view")}
      onRowDoubleClick={(row) => onOpen(row, "view")}
      onAdd={onAdd}
      onRefresh={() => { loadSummary(); loadList(); }}
      onToggleFilter={() => setShowFilters((v) => !v)}
      showForm={showFilters}
      formComponent={filterPanel}
      actions={actions}
      activeTab="search"
      onTabChange={(tabKey) => { if (tabKey === "entry") onAdd?.(); }}
    />
  );
}

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
import KpiCard from "./components/KpiCard";
import { CATEGORY_STYLES, STAGES, initials, timeAgo } from "./pipelineConstants";
import {
  GitBranch, Phone, ClipboardEdit, Eye, LayoutList, LayoutGrid,
  Search, Filter, RefreshCw, X, ChevronLeft, ChevronRight,
} from "lucide-react";

const SORT_MAP = { candidate: "candidate", vacancy: "vacancy", progress: "stage", status: "status", next_action: "since", recruiter: "recruiter" };
const SOURCES = ["PublicURL", "InternalHR", "Bulk Excel", "Referral", "Career Portal", "Direct", "Naukri", "LinkedIn"];
const EMPTY_FILTERS = { vacancy_id: "All", stage: "All", category: "All", recruiter_id: "All", source: "All", my_tasks: false, kpi: "All" };

// true below Tailwind's `md` breakpoint (768px) -> table switches to a card list
const useIsMobile = (breakpoint = 768) => {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return isMobile;
};

export default function PipelineList({ onOpen, onAdd, refreshKey = 0 }) {
  const isMobile = useIsMobile();
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
      kpi: filters.kpi,
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

  // Table -> server paging / sorting (search arrives via onSearch)
  const handlePageChange = useCallback((page, pageSize, _search, sortField, sortOrder) => {
    setQuery((q) => ({ ...q, page, pageSize, sort: SORT_MAP[sortField] || "since", dir: sortField ? sortOrder : "desc" }));
  }, []);
  const handleSearch = useCallback((text) => setQuery((q) => ({ ...q, page: 1, search: text })), []);

  // Total width ~1,300px so the Actions column never falls off the screen
  const columns = useMemo(() => [
    {
      key: "candidate",
      label: "Candidate",
      width: 220,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span
            className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}
          >
            {initials(row.full_name)}
          </span>
          <span className="min-w-0 truncate" title={`${row.full_name || ""} · ${row.candidate_code || ""}`}>
            <span className="font-semibold text-slate-800">{row.full_name || "—"}</span>
            <span className="text-slate-400 text-[10.5px]"> · {row.candidate_code}</span>
          </span>
        </span>
      ),
    },
    {
      key: "vacancy",
      label: "Vacancy",
      width: 170,
      render: (row) => (
        <span className="block min-w-0 truncate" title={`${row.v_title} (${row.vacancy_no || ""})`}>
          <span className="font-medium text-slate-800">{row.v_title}</span>
          <span className="text-slate-400 text-[10.5px]"> · {row.vacancy_no || "—"}</span>
        </span>
      ),
    },
    {
      key: "progress",
      label: "Pipeline Progress",
      width: 190,
      render: (row) => (
        <span className="flex items-center gap-2 w-full min-w-0">
          <PipelineProgressBar
            currentStage={row.current_stage}
            category={row.category}
            statusBase={row.current_status_base}
            showCaption={false}
            compact
            className="w-[70px] shrink-0"
          />
          <span className="text-[10.5px] text-slate-500 truncate whitespace-nowrap">
            Stage {row.current_stage}/7 · {STAGES[row.current_stage - 1]?.short}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Unique Status",
      width: 270,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0 whitespace-nowrap">
          <StatusChip status={row.current_status} category={row.category} statusBase={row.current_status_base} />
          <span className="text-[10.5px] text-slate-500 truncate">{timeAgo(row.status_since)}</span>
        </span>
      ),
    },
    {
      key: "next_action",
      label: "Next Action",
      width: 200,
      render: (row) => <span className="block min-w-0 truncate" title={row.next_action || ""}>{row.next_action || "—"}</span>,
    },
    {
      key: "recruiter",
      label: "Recruiter",
      width: 110,
      render: (row) => <span className="block truncate" title={row.recruiter_name || ""}>{row.recruiter_name || "—"}</span>,
    },
    {
      key: "action",
      label: "Actions",
      width: 110,
      render: (row) => {
        const btn = "w-[24px] h-[24px] rounded border flex items-center justify-center transition-colors cursor-pointer";
        return (
          <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" title="Log Call" aria-label="Log call" onClick={() => onOpen(row, "call")} className={`${btn} text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100`}><Phone size={12} /></button>
            <button type="button" title="Update Status" aria-label="Update status" onClick={() => onOpen(row, "update")} className={`${btn} text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100`}><ClipboardEdit size={12} /></button>
            <button type="button" title="View" aria-label="View candidate" onClick={() => onOpen(row, "view")} className={`${btn} text-slate-600 bg-white border-slate-200 hover:bg-slate-100`}><Eye size={12} /></button>
          </span>
        );
      },
    },
  ], [onOpen]);

  const k = summary.kpi || {};
  // Picking a card starts from a clean filter set so the table count matches the card; clicking it again clears it
  const kpiProps = (key) => ({
    selected: filters.kpi === key,
    onClick: () => {
      setFilters(filters.kpi === key ? EMPTY_FILTERS : { ...EMPTY_FILTERS, kpi: key });
      setQuery((q) => ({ ...q, page: 1 }));
    },
  });

  const selectCls = `${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px] min-w-[140px]`;

  const filterPanel = (
    <div className="px-2.5 pt-2 pb-1.5 space-y-1.5 bg-[#eef1f8] border-b border-[#dde1ea]">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <KpiCard {...kpiProps("total")} label="Total in Pipeline" value={k.total} sub={`across ${k.vacancies || 0} open vacancies`} />
        <KpiCard {...kpiProps("active")} label="Active" value={k.active} sub="moving through stages" tone="blue" />
        <KpiCard {...kpiProps("comm_pending_mine")} label="Comm Pending (My Tasks)" value={k.comm_pending_mine} sub={`${k.comm_pending_all || 0} total · recruiter action required`} tone="amber" />
        <KpiCard {...kpiProps("interviews_today")} label="Interviews Today" value={k.interviews_today} sub="R1 · R2 · Final" />
        <KpiCard {...kpiProps("rejected_this_month")} label="Rejected / Dropped" value={k.rejected_this_month} sub="this month" tone="rose" />
        <KpiCard {...kpiProps("joined")} label="Joined" value={k.joined} sub="converted to employee" tone="emerald" />
      </div>

      {/* Pipeline by stage (scrolls sideways on small screens) */}
      <PipelineStageStrip
        className="w-full max-w-full min-w-0"
        stages={summary.stages}
        selectedStage={filters.stage}
        onSelectStage={(v) => setFilter("stage", v)}
        joined={k.joined || 0}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-1.5 [&>select]:flex-1 sm:[&>select]:flex-none">
        <select value={filters.vacancy_id} onChange={(e) => setFilter("vacancy_id", e.target.value)} className={selectCls} aria-label="Vacancy">
          <option value="All">Vacancy: All ({vacancies.length})</option>
          {vacancies.map((v) => <option key={v.vacancy_id} value={v.vacancy_id}>{v.job_title || v.designation_name} ({v.vacancy_no})</option>)}
        </select>
        <select value={filters.stage} onChange={(e) => setFilter("stage", e.target.value)} className={selectCls} aria-label="Stage">
          <option value="All">Stage: All</option>
          {STAGES.map((s) => <option key={s.stage_no} value={s.stage_no}>{s.stage_no}. {s.stage_name}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className={selectCls} aria-label="Category">
          <option value="All">Category: All</option>
          {Object.entries(CATEGORY_STYLES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
        <select value={filters.recruiter_id} onChange={(e) => setFilter("recruiter_id", e.target.value)} className={selectCls} aria-label="Recruiter">
          <option value="All">Recruiter: All</option>
          {recruiters.map((r) => <option key={r.recruiter_id} value={r.recruiter_id}>{r.recruiter_name}</option>)}
        </select>
        <select value={filters.source} onChange={(e) => setFilter("source", e.target.value)} className={selectCls} aria-label="Source">
          <option value="All">Source: All</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-[11.5px] text-slate-700 cursor-pointer select-none whitespace-nowrap">
          <input type="checkbox" checked={filters.my_tasks} onChange={(e) => setFilter("my_tasks", e.target.checked)} className="accent-[var(--icon-color)]" />
          Show only my tasks
        </label>
        {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
          <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setQuery((q) => ({ ...q, page: 1 })); }} className="text-[11px] text-blue-600 hover:underline">Clear filters</button>
        )}
        <span className="ml-auto hidden sm:flex items-center gap-0.5 bg-slate-100 rounded-md p-[2px]">
          <button type="button" className="h-[24px] px-2.5 rounded text-[11px] font-semibold bg-white shadow-sm flex items-center gap-1" style={{ color: "var(--icon-color)" }} aria-pressed="true"><LayoutList size={12} /> List</button>
          <button type="button" disabled title="Board view coming soon" className="h-[24px] px-2.5 rounded text-[11px] font-semibold text-slate-400 flex items-center gap-1 cursor-not-allowed"><LayoutGrid size={12} /> Board</button>
        </span>
      </div>
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  /* ── MOBILE: header + search + filters + card list ───────────────────── */
  if (isMobile) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden bg-slate-50">
        <div className="flex-none bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2">
          <GitBranch className="shrink-0" size={16} style={{ color: "var(--icon-color)" }} />
          <h1 className="text-sm font-bold text-slate-800 truncate flex-1">Candidate Pipeline</h1>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">{total}</span>
          <button type="button" onClick={() => { loadSummary(); loadList(); }} title="Refresh" className="h-8 w-8 flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            title="Filters"
            className={`h-8 w-8 flex items-center justify-center rounded-md border cursor-pointer ${showFilters ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-amber-50 border-amber-300 text-amber-600"}`}
          >
            <Filter size={14} />
          </button>
        </div>

        <div className="flex-none bg-white border-b border-slate-200 px-3 py-2">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              value={query.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search candidate, vacancy, code…"
              className="h-9 w-full pl-8 pr-8 text-[16px] bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-400"
            />
            {query.search && <X size={13} className="absolute right-2.5 text-slate-400 cursor-pointer" onClick={() => handleSearch("")} />}
          </div>
        </div>

        {showFilters && (
          <div className="flex-none max-h-[55%] overflow-y-auto bg-white border-b border-slate-200">{filterPanel}</div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 pb-24 space-y-2.5">
          {loading && rows.length === 0 ? (
            <div className="flex justify-center py-10"><div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">No candidates found</div>
          ) : (
            rows.map((row) => (
              <div key={row.pipeline_id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2">
                <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => onOpen(row, "view")}>
                  <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}>
                    {initials(row.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{row.full_name || "—"}</p>
                    <p className="text-[10.5px] text-slate-400 truncate">{row.candidate_code} · {row.v_title} · {row.vacancy_no || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <StatusChip status={row.current_status} category={row.category} statusBase={row.current_status_base} />
                  <span className="text-[10.5px] text-slate-500 whitespace-nowrap">{timeAgo(row.status_since)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <PipelineProgressBar currentStage={row.current_stage} category={row.category} statusBase={row.current_status_base} showCaption={false} compact className="w-[90px] shrink-0" />
                  <span className="text-[10.5px] text-slate-500 truncate">Stage {row.current_stage}/7 · {STAGES[row.current_stage - 1]?.short}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2">
                  <span className="text-slate-400">Next: </span>{row.next_action || "—"}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => onOpen(row, "call")} className="flex-1 min-w-0 h-9 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-center justify-center gap-1 cursor-pointer"><Phone size={13} /> Call</button>
                  <button type="button" onClick={() => onOpen(row, "update")} className="flex-1 min-w-0 h-9 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md flex items-center justify-center gap-1 cursor-pointer"><ClipboardEdit size={13} /> Update</button>
                  <button type="button" onClick={() => onOpen(row, "view")} title="View" className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 cursor-pointer"><Eye size={15} /></button>
                </div>
              </div>
            ))
          )}

          {total > query.pageSize && (
            <div className="flex items-center justify-between pt-1">
              <button type="button" disabled={query.page <= 1} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))} className="h-8 px-3 text-xs font-semibold border border-slate-200 bg-white rounded-md disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={13} /> Prev</button>
              <span className="text-[11px] text-slate-500">Page {query.page} / {totalPages}</span>
              <button type="button" disabled={query.page >= totalPages} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))} className="h-8 px-3 text-xs font-semibold border border-slate-200 bg-white rounded-md disabled:opacity-40 flex items-center gap-1">Next <ChevronRight size={13} /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── DESKTOP: shared Table ───────────────────────────────────────────── */
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
      activeTab="search"
      onTabChange={(tabKey) => { if (tabKey === "entry") onAdd?.(); }}
    />
  );
}
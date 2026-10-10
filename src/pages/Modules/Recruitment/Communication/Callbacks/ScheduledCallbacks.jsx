import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Clock, Calendar, AlertCircle, PhoneCall, RefreshCw, Search } from "lucide-react";
import Table from "../../../../../components/Reusable/table/Table";
import { showToast } from "../../../../../components/Reusable/alert";
import { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import { getScheduledCallbacks, getActiveVacanciesWithJD } from "../../../../../utils/communicationApi";
import UniversalCallModal from "../components/UniversalCallModal";
import { BaseButton, RefreshButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";
import { STAGES, initials } from "../../CandidateTracking/pipelineConstants";

const EMPTY_FILTERS = { vacancy_id: "All", search: "" };

const TABS = [
  { key: "today", label: "Today's Callbacks", Icon: Clock, on: "bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-300", icon: "text-amber-600", badge: "bg-amber-200/90 text-amber-950" },
  { key: "overdue", label: "Overdue Callbacks", Icon: AlertCircle, on: "bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-300", icon: "text-rose-600", badge: "bg-rose-200/90 text-rose-950" },
  { key: "upcoming", label: "Upcoming Callbacks", Icon: Calendar, on: "bg-blue-100 text-blue-900 border-blue-300 ring-1 ring-blue-300", icon: "text-blue-600", badge: "bg-blue-200/90 text-blue-950" },
];

export default function ScheduledCallbacks() {
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(false);
  const [callbacks, setCallbacks] = useState([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [vacancies, setVacancies] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [callModalData, setCallModalData] = useState({ isOpen: false, candidate: null });

  const loadVacancies = useCallback(async () => {
    const res = await getActiveVacanciesWithJD();
    if (res?.data) setVacancies(res.data);
  }, []);

  const loadCallbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getScheduledCallbacks({
        tab: activeTab,
        vacancy_id: filters.vacancy_id !== "All" ? filters.vacancy_id : undefined,
        search: filters.search || undefined,
      });
      if (res?.success) {
        setCallbacks(Array.isArray(res.data) ? res.data : []);
        if (res.counts) setCounts(res.counts);
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to load callbacks" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error loading callbacks" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => { loadVacancies(); }, [loadVacancies]);
  useEffect(() => { loadCallbacks(); }, [loadCallbacks]);

  const openCall = (row) => setCallModalData({ isOpen: true, candidate: row });

  // Rows are a fixed 34px in the shared Table, so every cell is a single truncated line
  const columns = useMemo(() => [
    {
      key: "full_name",
      label: "Candidate",
      width: 240,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}>
            {initials(row.full_name)}
          </span>
          <span className="min-w-0 truncate" title={`${row.full_name || ""} · ${row.candidate_code || ""} · ${row.mobile || ""}${row.email ? ` · ${row.email}` : ""}`}>
            <span className="font-semibold text-slate-800">{row.full_name || "—"}</span>
            <span className="text-slate-400 text-[10.5px]"> · {row.candidate_code || "—"} · <span className="font-mono">{row.mobile || "No Phone"}</span></span>
          </span>
        </span>
      ),
    },
    {
      key: "job_role",
      label: "Vacancy",
      width: 190,
      render: (row) => (
        <span className="truncate block" title={`${row.job_role || row.designation_name || ""} (${row.vacancy_no || ""})`}>
          <span className="font-medium text-slate-800">{row.job_role || row.designation_name || "General"}</span>
          {row.vacancy_no && <span className="text-slate-400 text-[10.5px]"> · {row.vacancy_no}</span>}
        </span>
      ),
    },
    {
      key: "current_status",
      label: "Stage · Status",
      width: 260,
      render: (row) => (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap">
            Stage {row.current_stage || 1} · {STAGES[(row.current_stage || 1) - 1]?.short || ""}
          </span>
          <span className="text-[10.5px] text-slate-600 truncate" title={row.current_status || ""}>{row.current_status || ""}</span>
        </span>
      ),
    },
    {
      key: "callback_at",
      label: "Callback Date & Time",
      width: 200,
      render: (row) => {
        const d = new Date(row.callback_at);
        const isPast = d < new Date();
        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap ${isPast ? "text-rose-600" : "text-amber-700"}`}>
            <Clock className="w-3 h-3" />
            {d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {isPast && <span className="ml-1 text-[9.5px] font-semibold px-1 py-0.5 rounded bg-rose-50 border border-rose-200">Overdue</span>}
          </span>
        );
      },
    },
    {
      key: "callback_notes",
      label: "Callback Purpose / Notes",
      width: 260,
      render: (row) => (
        <span className="text-[11px] text-slate-600 truncate block" title={row.callback_notes || row.last_remarks || ""}>
          {row.callback_notes || row.last_remarks || <span className="italic text-slate-400">No notes</span>}
        </span>
      ),
    },
    { key: "recruiter_name", label: "Recruiter", width: 110, render: (row) => <span className="text-[11px] text-slate-700 truncate block">{row.recruiter_name || "—"}</span> },
  ], []);

  const actions = useCallback((row) => (
    <div className="flex items-center justify-end">
      <button type="button" onClick={(e) => { e.stopPropagation(); openCall(row); }} className="h-[22px] px-2.5 text-[10.5px] font-bold text-white rounded shadow-xs flex items-center gap-1 transition-colors" style={{ background: "var(--icon-color)" }}>
        <PhoneCall size={11} />
        <span>Call Now</span>
      </button>
    </div>
  ), []);

  const filterPanel = (
    <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-[#f8fafc] border-b border-[#dde1ea] text-[11px]">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {TABS.map(({ key, label, Icon, on, icon, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            aria-pressed={activeTab === key}
            className={`h-[26px] px-2.5 rounded font-semibold text-[11px] flex items-center gap-1.5 border transition-all shrink-0 ${activeTab === key ? `${on} shadow-xs` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            <Icon size={12} className={icon} />
            <span>{label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${badge}`}>{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, phone..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className={`${formInputClass(false, false)} !pl-6 !w-[180px] !h-[26px] !text-[11px]`}
          />
        </div>
        <select value={filters.vacancy_id} onChange={(e) => setFilters((prev) => ({ ...prev, vacancy_id: e.target.value }))} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px] max-w-[170px]`} aria-label="Filter Vacancy">
          <option value="All">All Vacancies ({vacancies.length})</option>
          {vacancies.map((v) => <option key={v.vacancy_id} value={v.vacancy_id}>{v.job_title || v.designation_name}</option>)}
        </select>
        {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[10.5px] text-blue-600 hover:underline px-1">Clear</button>
        )}
        <button type="button" onClick={loadCallbacks} title="Refresh Callbacks" className="h-[26px] px-2 rounded font-medium text-[11px] text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1 shadow-2xs">
          <RefreshCw size={11} className={loading ? "animate-spin text-blue-600" : ""} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label || "Callbacks";

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Table
          title="SCHEDULED CANDIDATE CALLBACKS"
          TitleIcon={Clock}
          columns={columns}
          data={Array.isArray(callbacks) ? callbacks : []}
          rowKey="pipeline_id"
          loading={loading}
          actions={actions}
          onRowDoubleClick={openCall}
          onRefresh={loadCallbacks}
          onToggleFilter={() => setShowFilters((v) => !v)}
          showForm={showFilters}
          formComponent={filterPanel}
          activeTab="search"
          isHidden
        />
      </div>

      {/* Footer Action Bar */}
      <div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-2 sm:px-4 py-2 mt-1 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {callbacks.length} {callbacks.length === 1 ? "callback" : "callbacks"}
            </span>
            <span>in {activeTabLabel} (Overdue: {counts.overdue || 0}, Today: {counts.today || 0}, Upcoming: {counts.upcoming || 0})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {callbacks.length > 0 && (
              <BaseButton
                onClick={() => openCall(callbacks[0])}
                label={`Call Due Callback (${callbacks[0].full_name?.split(" ")[0] || "Candidate"})`}
                icon={<PhoneCall size={16} />}
                tone="amber"
                title="Call next pending scheduled callback"
              />
            )}
            <RefreshButton onClick={loadCallbacks} loading={loading} />
            {hasActiveFilters && (
              <ResetButton onClick={() => setFilters(EMPTY_FILTERS)} label="Reset Filters" />
            )}
          </div>
        </div>
      </div>

      {callModalData.isOpen && (
        <UniversalCallModal
          isOpen={callModalData.isOpen}
          candidate={callModalData.candidate}
          pipelineId={callModalData.candidate?.pipeline_id}
          onClose={() => setCallModalData({ isOpen: false, candidate: null })}
          onSuccess={() => {
            setCallModalData({ isOpen: false, candidate: null });
            loadCallbacks();
          }}
        />
      )}
    </div>
  );
}

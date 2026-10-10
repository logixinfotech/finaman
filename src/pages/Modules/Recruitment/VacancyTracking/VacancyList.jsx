import React, { useCallback, useEffect, useMemo, useState } from "react";
import Table from "../../../../components/Reusable/table/Table";
import { showToast } from "../../../../components/Reusable/alert";
import { formInputClass } from "../../../../components/Reusable/form/SectionCard";
import { getVacancyTracking } from "../../../../utils/recruitmentApi";
import KpiCard from "../CandidateTracking/components/KpiCard";
import { Briefcase, Eye, AlertTriangle, Users } from "lucide-react";
import {
  STAGES, VACANCY_STATUSES, PRIORITIES, statusStyle, priorityStyle, vacancyTitle, isOpenVacancy, isOverdue, fmtDate, timeAgo,
} from "./vacancyConstants";

const EMPTY_FILTERS = { status: "All", priority: "All", department_id: "All", kpi: "All" };

// KPI card → client-side predicate over the vacancy rows (list is not paged)
const KPI_MATCH = {
  open: (v) => isOpenVacancy(v),
  overdue: (v) => isOverdue(v),
  no_candidates: (v) => isOpenVacancy(v) && (v.active || 0) + (v.pending || 0) === 0,
  in_pipeline: (v) => isOpenVacancy(v) && (v.active || 0) + (v.pending || 0) > 0,
  on_hold: (v) => v.vacancy_status === "On Hold",
  closed: (v) => ["Closed", "Cancelled", "Rejected"].includes(v.vacancy_status),
};

// Filled-vs-total positions bar
const PositionsBar = ({ filled = 0, total = 0 }) => {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const done = total > 0 && filled >= total;
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="h-[6px] w-[70px] rounded-full bg-slate-200 overflow-hidden shrink-0">
        <span className={`block h-full rounded-full ${done ? "bg-emerald-500" : ""}`} style={{ width: `${pct}%`, background: done ? undefined : "var(--icon-color)" }} />
      </span>
      <span className="text-[11px] font-semibold text-slate-800 tabular-nums">{filled}/{total}</span>
      <span className="text-[10px] text-slate-400">filled</span>
    </span>
  );
};

// Seven stage counts as compact chips (active candidates currently in that stage)
const FunnelStrip = ({ row }) => (
  <span className="flex items-center gap-[3px]" title={STAGES.map((s) => `${s.short}: ${row[`s${s.stage_no}`] || 0}`).join(" · ")}>
    {STAGES.map((s) => {
      const n = row[`s${s.stage_no}`] || 0;
      const last = s.stage_no === STAGES.length;
      return (
        <span
          key={s.stage_no}
          className="inline-flex items-center justify-center h-[16px] min-w-[18px] px-[3px] rounded-[3px] text-[10px] font-bold tabular-nums border"
          style={n > 0
            ? { background: last ? "#ecfdf5" : "var(--accent-soft)", color: last ? "#047857" : "var(--icon-color)", borderColor: last ? "#a7f3d0" : "var(--accent-hover)" }
            : { background: "#f8fafc", color: "#cbd5e1", borderColor: "#e2e8f0" }}
        >
          {n}
        </span>
      );
    })}
  </span>
);

export default function VacancyList({ onOpen, refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [kpi, setKpi] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getVacancyTracking();
    if (res?.success) {
      setRows(res.data || []);
      setKpi(res.kpi || {});
      setDepartments(res.departments || []);
    } else {
      showToast({ icon: "error", title: res?.message || "Failed to load vacancy tracking" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => rows.filter((v) =>
    (filters.status === "All" || v.vacancy_status === filters.status) &&
    (filters.priority === "All" || v.priority === filters.priority) &&
    (filters.department_id === "All" || String(v.department_id) === String(filters.department_id)) &&
    (filters.kpi === "All" || KPI_MATCH[filters.kpi]?.(v))
  ), [rows, filters]);

  const columns = useMemo(() => [
    {
      key: "vacancy",
      label: "Vacancy",
      width: 230,
      render: (row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-[26px] h-[26px] rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}>
            <Briefcase size={13} />
          </span>
          <span className="min-w-0 truncate">
            <span className="font-semibold text-slate-800">{vacancyTitle(row)}</span>
            <span className="text-slate-400 text-[10.5px] font-mono"> · {row.vacancy_no || "—"}</span>
          </span>
        </span>
      ),
    },
    {
      key: "department",
      label: "Department · Location",
      width: 170,
      render: (row) => (
        <span className="truncate block" title={`${row.department_name || ""} · ${row.location_name || ""}`}>
          <span className="font-medium text-slate-800">{row.department_name || "—"}</span>
          {row.location_name && <span className="text-slate-400 text-[10.5px]"> · {row.location_name}</span>}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status · Priority",
      width: 180,
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border ${statusStyle(row.vacancy_status)}`}>{row.vacancy_status || "Draft"}</span>
          {row.priority && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityStyle(row.priority)}`}>{row.priority}</span>}
        </span>
      ),
    },
    { key: "positions", label: "Positions", width: 150, render: (row) => <PositionsBar filled={row.filled_positions} total={row.number_of_positions} /> },
    { key: "funnel", label: "Funnel (Stage 1 → 7)", width: 190, render: (row) => <FunnelStrip row={row} /> },
    {
      key: "candidates",
      label: "Candidates",
      width: 190,
      render: (row) => (
        <span className="flex items-center gap-2 text-[10.5px] tabular-nums">
          <span className="font-bold text-slate-800 text-[11.5px]">{row.total_candidates || 0}</span>
          <span className="text-blue-700" title="Active">{row.active || 0} active</span>
          {row.pending > 0 && <span className="text-amber-600" title="Comm pending">{row.pending}P</span>}
          {row.rejected > 0 && <span className="text-rose-600" title="Rejected / dropped">{row.rejected}R</span>}
          {row.joined > 0 && <span className="text-emerald-600 font-semibold" title="Joined">{row.joined} joined</span>}
        </span>
      ),
    },
    {
      key: "aging",
      label: "Days Open · Target",
      width: 170,
      render: (row) => {
        const overdue = isOverdue(row);
        return (
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-800 tabular-nums">{row.days_open ?? 0}d</span>
            <span className={`text-[10.5px] truncate ${overdue ? "text-rose-600 font-semibold" : "text-slate-500"}`} title={overdue ? "Target joining date has passed" : ""}>
              {overdue && <AlertTriangle size={11} className="inline mr-0.5 -mt-[2px]" />}
              target {fmtDate(row.target_joining_date)}
            </span>
          </span>
        );
      },
    },
    { key: "owner", label: "Owner · Manager", width: 170, render: (row) => (
      <span className="truncate block" title={`${row.recruitment_owner_name || ""} · ${row.reporting_manager_name || ""}`}>
        <span className="text-slate-800">{row.recruitment_owner_name || "—"}</span>
        {row.reporting_manager_name && <span className="text-slate-400 text-[10.5px]"> · {row.reporting_manager_name}</span>}
      </span>
    ) },
    { key: "last_activity", label: "Last Activity", width: 110, render: (row) => <span className="text-slate-500 text-[10.5px]">{row.last_activity ? timeAgo(row.last_activity) : "—"}</span> },
  ], []);

  const actions = useCallback((row) => (
    <button type="button" aria-label="View vacancy" title="View" onClick={(e) => { e.stopPropagation(); onOpen(row); }} className="w-[20px] h-[20px] rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
      <Eye size={12} />
    </button>
  ), [onOpen]);

  const kpiProps = (key) => ({
    selected: filters.kpi === key,
    onClick: () => setFilters(filters.kpi === key ? EMPTY_FILTERS : { ...EMPTY_FILTERS, kpi: key }),
  });

  const filterPanel = (
    <div className="px-2.5 pt-2 pb-1.5 space-y-1.5 bg-[#eef1f8] border-b border-[#dde1ea]">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <KpiCard {...kpiProps("open")} label="Open Vacancies" value={kpi.open_vacancies} sub={`${kpi.remaining_positions ?? 0} of ${kpi.total_positions ?? 0} positions to fill`} tone="blue" />
        <KpiCard {...kpiProps("in_pipeline")} label="Candidates in Pipeline" value={kpi.in_pipeline} sub="active + comm pending · open vacancies" />
        <KpiCard {...kpiProps("no_candidates")} label="No Active Candidates" value={kpi.no_candidates} sub="open vacancies needing sourcing" tone="amber" />
        <KpiCard {...kpiProps("overdue")} label="Overdue" value={kpi.overdue} sub="target joining date passed" tone="rose" />
        <KpiCard {...kpiProps("on_hold")} label="On Hold" value={kpi.on_hold} sub="paused by approver" tone="purple" />
        <KpiCard {...kpiProps("closed")} label="Avg Days Open" value={kpi.avg_days_open} sub="open vacancies · click for closed" tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Status">
          <option value="All">Status: All</option>
          {VACANCY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter("priority", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px]`} aria-label="Priority">
          <option value="All">Priority: All</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.department_id} onChange={(e) => setFilter("department_id", e.target.value)} className={`${formInputClass(false, false)} !w-auto !h-[26px] !text-[11px] min-w-[150px]`} aria-label="Department">
          <option value="All">Department: All ({departments.length})</option>
          {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
        </select>
        {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[11px] text-blue-600 hover:underline">Clear filters</button>
        )}
        <span className="ml-auto flex items-center gap-1 text-[10.5px] text-slate-500">
          <Users size={12} /> {filtered.length} of {rows.length} vacancies
        </span>
      </div>
    </div>
  );

  return (
    <Table
      title="VACANCY TRACKING"
      TitleIcon={Briefcase}
      data={filtered}
      columns={columns}
      rowKey="vacancy_id"
      loading={loading}
      onRowClick={onOpen}
      onRowDoubleClick={onOpen}
      onRefresh={load}
      onToggleFilter={() => setShowFilters((v) => !v)}
      showForm={showFilters}
      formComponent={filterPanel}
      actions={actions}
      activeTab="search"
      onTabChange={() => {}}
    />
  );
}

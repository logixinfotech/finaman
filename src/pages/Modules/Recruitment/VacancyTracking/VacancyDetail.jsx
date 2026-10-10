import React, { useEffect, useMemo, useState } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import SectionCard from "../../../../components/Reusable/form/SectionCard";
import { showToast } from "../../../../components/Reusable/alert";
import { getVacancyTrackingDetail } from "../../../../utils/recruitmentApi";
import PipelineStageStrip from "../CandidateTracking/components/PipelineStageStrip";
import PipelineProgressBar from "../CandidateTracking/components/PipelineProgressBar";
import StatusChip from "../CandidateTracking/components/StatusChip";
import { CATEGORY_STYLES, styleFor } from "../CandidateTracking/pipelineConstants";
import { Briefcase, ArrowLeft, Users, Activity, History, Info, AlertTriangle } from "lucide-react";
import {
  STAGES, TOTAL_STAGES, statusStyle, priorityStyle, vacancyTitle, isOverdue, fmtDate, fmtDateTime, timeAgo, initials,
} from "./vacancyConstants";

const fmtCtc = (n) => (n == null || n === "" ? null : `₹${Number(n).toLocaleString("en-IN")}`);

export default function VacancyDetail({ vacancyId, onBack }) {
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candFilter, setCandFilter] = useState("Open"); // Open | All | Terminal

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getVacancyTrackingDetail(vacancyId);
      if (!alive) return;
      if (res?.success) setV(res.data);
      else showToast({ icon: "error", title: res?.message || "Failed to load vacancy" });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [vacancyId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const stages = useMemo(() => STAGES.map((s) => ({ ...s, active: v?.[`s${s.stage_no}`] || 0, count: v?.[`s${s.stage_no}`] || 0 })), [v]);

  const candidates = useMemo(() => {
    const all = v?.candidates || [];
    if (candFilter === "Open") return all.filter((c) => !c.is_closed || c.current_status_base === "Joined - Converted to Employee");
    if (candFilter === "Terminal") return all.filter((c) => c.is_closed);
    return all;
  }, [v, candFilter]);

  const header = <ERPHeader title="VACANCY TRACKING" subtitle={v ? `${vacancyTitle(v)} · ${v.vacancy_no || ""}` : undefined} TitleIcon={Briefcase} isViewMode activeTab="entry" onTabChange={(t) => t === "search" && onBack()} />;

  if (loading || !v) {
    return (
      <div className="w-full h-full flex flex-col bg-[#eef1f8]">
        {header}
        <div className="p-4 space-y-3 animate-pulse">
          {[80, 90, 260].map((h, i) => <div key={i} className="bg-white border border-[#dde1ea] rounded-[6px]" style={{ height: h }} />)}
        </div>
      </div>
    );
  }

  const total = v.number_of_positions || 0;
  const filled = v.filled_positions || 0;
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const overdue = isOverdue(v);
  const ctc = [fmtCtc(v.min_ctc), fmtCtc(v.max_ctc)].filter(Boolean).join(" – ");
  const exp = v.min_experience_years != null || v.max_experience_years != null ? `${v.min_experience_years ?? 0}–${v.max_experience_years ?? "∞"} yrs` : null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#eef1f8] font-sans">
      {header}

      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="max-w-[1400px] mx-auto space-y-3">
          {/* Vacancy header card */}
          <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-xs px-3 py-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Vacancy Tracking"
              title="Back (Esc)"
              className="w-[28px] h-[28px] rounded-md border bg-white flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-colors shrink-0"
              style={{ borderColor: "#e2e8f0" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
            </button>
            <span
              className="w-[38px] h-[38px] rounded-md flex items-center justify-center shrink-0 bg-blue-50 text-blue-600"
            >
              <Briefcase size={18} />
            </span>
            <div className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-bold text-slate-900">{vacancyTitle(v)}</span>
                <span className="font-mono text-[11px] text-slate-500">{v.vacancy_no}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle(v.vacancy_status)}`}>
                  {v.vacancy_status || "Draft"}
                </span>
                {v.priority && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityStyle(v.priority)}`}>
                    {v.priority}
                  </span>
                )}
                {overdue && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-300 inline-flex items-center gap-1">
                    <AlertTriangle size={10} /> Overdue
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {[v.department_name, v.designation_name, v.location_name, v.employment_type, v.work_mode]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </div>
            </div>
            <dl className="w-full xl:w-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-1 text-[11px] pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
              {[
                ["Positions", `${filled} / ${total} filled`],
                ["Days Open", `${v.days_open ?? 0} days`],
                ["Target Joining", fmtDate(v.target_joining_date)],
                ["Recruitment Owner", v.recruitment_owner_name],
                ["Hiring Manager", v.reporting_manager_name],
                ["CTC Range", ctc],
              ].map(([k, val]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-slate-400 text-[10px] uppercase">{k}</dt>
                  <dd className="font-medium text-slate-800 truncate" title={val || ""}>
                    {val || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Positions + Funnel Card */}
          <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-xs px-3 py-2 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#0f2137]">
                Hiring Progress · {filled} of {total} positions filled ({pct}%)
              </span>
              <span className="text-[11px] text-slate-500">
                {v.total_candidates || 0} candidates · <b className="text-blue-700">{v.active || 0}</b> active ·{" "}
                <b className="text-amber-600">{v.pending || 0}</b> pending ·{" "}
                <b className="text-rose-600">{v.rejected || 0}</b> rejected ·{" "}
                <b className="text-emerald-600">{v.joined || 0}</b> joined
              </span>
            </div>
            <div className="h-[8px] rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="-mx-1 overflow-x-auto">
              <PipelineStageStrip stages={stages} selectedStage="All" joined={v.joined || 0} className="min-w-[900px]" />
            </div>
          </div>

          {/* Main 2-column Content */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-start">
            {/* LEFT: candidates in this vacancy */}
            <SectionCard
              title={`Candidates in Pipeline (${candidates.length})`}
              icon={<Users className="w-3 h-3" />}
              theme="indigo"
              bodyClassName="space-y-1.5"
              right={
                <span className="flex items-center gap-0.5 bg-slate-100 rounded-md p-[2px]">
                  {["Open", "All", "Terminal"].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCandFilter(k)}
                      aria-pressed={candFilter === k}
                      className={`h-[20px] px-2 rounded text-[10.5px] font-semibold ${
                        candFilter === k ? "bg-white text-blue-700 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      {k === "Terminal" ? "Closed" : k}
                    </button>
                  ))}
                </span>
              }
            >
              {candidates.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-lg bg-slate-50">
                  No candidates {candFilter === "Open" ? "currently active" : "found"} for this vacancy.
                </div>
              ) : (
                candidates.map((c) => {
                  const st = styleFor(c.category, c.current_status_base);
                  return (
                    <div
                      key={c.pipeline_id}
                      className="px-2 py-1.5 rounded border border-slate-200 bg-white hover:border-blue-400 transition-colors grid grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(150px,190px)_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 items-center"
                    >
                      <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-blue-50 text-blue-700 border border-blue-100">
                        {initials(c.full_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-800 text-xs truncate">{c.full_name}</span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {c.candidate_code} · {c.entry_channel === "PublicURL" ? "URL" : c.source_channel || c.entry_channel || "—"}
                          {c.recruiter_name ? ` · ${c.recruiter_name}` : ""}
                        </span>
                      </span>

                      {/* Progress + status: own row on phones, inline on wide screens */}
                      <div className="col-span-2 lg:col-span-1 flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 pl-[36px] lg:pl-0">
                        <span className="flex items-center gap-1.5 shrink-0">
                          <PipelineProgressBar
                            currentStage={c.current_stage}
                            category={c.category}
                            statusBase={c.current_status_base}
                            showCaption={false}
                            compact
                            className="w-[80px]"
                          />
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            Stage {c.current_stage}/{TOTAL_STAGES} · {STAGES[c.current_stage - 1]?.short}
                          </span>
                        </span>
                        <StatusChip
                          status={c.current_status}
                          category={c.category}
                          statusBase={c.current_status_base}
                          className="min-w-0 max-w-full"
                        />
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {st.label} · {timeAgo(c.status_since)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9.5px] text-slate-400 pt-1">
                {Object.entries(CATEGORY_STYLES).map(([key, s]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-sm ${s.dot}`} />
                    {s.label}
                  </span>
                ))}
              </div>
            </SectionCard>

            {/* RIGHT: vacancy info + status history */}
            <div className="space-y-3 min-w-0">
              <SectionCard
                title="Vacancy Info"
                icon={<Info className="w-3 h-3" />}
                theme="slate"
                bodyClassName="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]"
              >
                {[
                  ["Vacancy Date", fmtDate(v.vacancy_date)],
                  ["Type", v.vacancy_type],
                  ["Requested By", v.requested_by_name],
                  ["Recruitment Start", fmtDate(v.recruitment_start_date)],
                  ["Application Close", fmtDate(v.application_close_date)],
                  ["Expected Candidates", v.expected_candidates],
                  ["Experience", exp],
                  ["Last Pipeline Activity", v.last_activity ? fmtDateTime(v.last_activity) : null],
                ].map(([k, val]) => (
                  <div key={k} className="min-w-0">
                    <div className="text-slate-400 text-[10px]">{k}</div>
                    <div className="font-medium text-slate-800 truncate" title={val ?? ""}>
                      {val ?? "—"}
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard
                title={`Vacancy Status History (${(v.status_history || []).length})`}
                icon={<History className="w-3 h-3" />}
                theme="indigo"
                bodyClassName="space-y-0"
              >
                {(v.status_history || []).length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">No status changes recorded.</div>
                ) : (
                  [...v.status_history].reverse().map((h, i) => (
                    <div key={i} className="flex gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
                      <span
                        className="mt-1 w-2 h-2 rounded-full shrink-0"
                        style={{ background: i === 0 ? "#2563eb" : "#cbd5e1" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {h.from_status && (
                            <>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusStyle(h.from_status)}`}>
                                {h.from_status}
                              </span>
                              <span className="text-slate-400 text-[10px]">→</span>
                            </>
                          )}
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusStyle(h.to_status)}`}>
                            {h.to_status}
                          </span>
                        </div>
                        {h.remarks && <div className="text-[10.5px] text-slate-600 mt-0.5">{h.remarks}</div>}
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Activity size={9} /> {fmtDateTime(h.changed_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

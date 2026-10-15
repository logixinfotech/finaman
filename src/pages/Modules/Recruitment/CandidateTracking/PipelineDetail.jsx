import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
import { showToast, alertError } from "../../../../components/Reusable/alert";
import { getPipelineDetail, getPipelineReasons, updatePipelineStatus } from "../../../../utils/recruitmentApi";
import config from "../../../../config";
import PipelineProgressBar from "./components/PipelineProgressBar";
import StageStepper from "./components/StageStepper";
import StatusChip from "./components/StatusChip";
import SendAssessmentModal from "./components/SendAssessmentModal";
import CandidateAssessmentReviewCard from "./components/CandidateAssessmentReviewCard";
import UniversalCallModal from "../Communication/components/UniversalCallModal";
import GlobalWhatsAppModal from "../../../../components/Reusable/whatsapp/GlobalWhatsAppModal";
import {
  STAGES, TOTAL_STAGES, JOINED_STATUS, CATEGORY_STYLES, initials, styleFor,
  fmtDate, fmtDateTime, timeAgo, daysBetween, reasonScopeFor,
} from "./pipelineConstants";
import { GitBranch, Phone, PhoneCall, MessageSquare, FileText, Lock, AlertTriangle, Send, History, Activity, ArrowLeft, Award } from "lucide-react";

const EMPTY_FORM = { to_status: "", reason: "", scheduled_at: "", remarks: "" };

export default function PipelineDetail({ pipelineId, intent = "view", onBack, rights }) {
  const [detail, setDetail] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [isSendAssessmentOpen, setIsSendAssessmentOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const actionRef = useRef(null);
  const saveBtnRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getPipelineDetail(pipelineId);
    if (res?.success) setDetail(res);
    else showToast({ icon: "error", title: res?.message || "Failed to load candidate" });
    setLoading(false);
  }, [pipelineId]);

  useEffect(() => { load(); getPipelineReasons().then((r) => setReasons(r?.data || [])); }, [load]);

  const row = detail?.data;
  const transitions = detail?.transitions || [];
  const history = detail?.history || [];
  const commLog = detail?.comm_log || [];
  const callLimit = detail?.call_limit || 0;
  const locked = !!row?.is_closed;
  const canModify = rights?.mod === 1;

  // "Log Call" intent pre-selects the call-attempt action
  useEffect(() => {
    if (!row || locked) return;
    if (intent === "call") {
      const call = transitions.find((t) => t.is_call_attempt);
      if (call) setForm((f) => ({ ...f, to_status: call.to_status }));
    }
    if (intent !== "view") setTimeout(() => actionRef.current?.focus(), 50);
  }, [row, locked, intent, transitions]);

  const selected = useMemo(() => transitions.find((t) => t.to_status === form.to_status) || null, [transitions, form.to_status]);
  const generatedStatus = selected
    ? selected.reason_required && form.reason ? `${selected.to_status} (${form.reason})` : selected.to_status
    : "";
  const reasonOptions = useMemo(() => {
    if (!selected?.reason_required) return [];
    const scope = reasonScopeFor(selected.to_status);
    return reasons.filter((r) => r.applies_to === "All" || r.applies_to === scope);
  }, [reasons, selected]);

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _drop, ...rest }) => rest);
  };
  const resetForm = () => { setForm(EMPTY_FORM); setErrors({}); };

  const handleSave = async () => {
    if (locked || !canModify) return;
    const e = {};
    if (!selected) e.to_status = "Select an operational action";
    if (selected?.reason_required && !form.reason) e.reason = "Reason is mandatory for this status";
    if (selected?.schedule_required && !form.scheduled_at) e.scheduled_at = "Date & time is mandatory for this status";
    if (Object.keys(e).length) { setErrors(e); showToast({ icon: "warning", title: "Please fill the required fields" }); return; }

    setSaving(true);
    const res = await updatePipelineStatus(pipelineId, {
      to_status: selected.to_status,
      reason: form.reason || undefined,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined,
      remarks: form.remarks,
    });
    setSaving(false);
    if (res?.success) {
      showToast({ icon: "success", title: res.message || "Status updated" });
      resetForm();
      load();
    } else {
      alertError("Update Failed", res?.message || "Could not update status");
    }
  };

  const filteredHistory = useMemo(() => {
    if (historyFilter === "Milestones") return history.filter((h) => h.category === "Milestone" || h.to_status === JOINED_STATUS);
    if (historyFilter === "Calls") return history.filter((h) => /Call Attempt|Callback|No Communication/i.test(h.to_status));
    return history;
  }, [history, historyFilter]);

  if (loading && !detail) {
    return (
      <div className="w-full h-full flex flex-col bg-[#eef1f8]">
        <ERPHeader title="CANDIDATE PIPELINE" TitleIcon={GitBranch} isViewMode activeTab="entry" onTabChange={(t) => t === "search" && onBack()} />
        <div className="p-4 space-y-3 animate-pulse">
          {[80, 110, 260].map((h, i) => <div key={i} className="bg-white border border-[#dde1ea] rounded-[6px]" style={{ height: h }} />)}
        </div>
      </div>
    );
  }
  if (!row) return null;

  const st = styleFor(row.category, row.current_status_base);
  const stage = STAGES[row.current_stage - 1];
  const clearedCount = row.current_status_base === JOINED_STATUS ? TOTAL_STAGES : row.current_stage - 1;
  const milestones = history.filter((h) => h.category === "Milestone").length;
  const commTemplate = selected?.comm_template;

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#eef1f8] font-sans">
      <ERPHeader
        title="CANDIDATE PIPELINE"
        subtitle={`${row.full_name} · ${row.candidate_code}`}
        TitleIcon={GitBranch}
        isViewMode
        activeTab="entry"
        onTabChange={(t) => t === "search" && onBack()}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 pb-6 md:p-4">
        <div className="max-w-[1400px] mx-auto space-y-3">
          {/* Candidate header card */}
          <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm px-3 py-2.5 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to Candidate Pipeline"
                title="Back (Esc)"
                className="w-[28px] h-[28px] rounded-md border bg-white flex items-center justify-center text-slate-600 hover:text-[var(--icon-color)] hover:border-[var(--icon-color)] transition-colors shrink-0 cursor-pointer"
                style={{ borderColor: "#e2e8f0" }}
              >
                <ArrowLeft size={15} strokeWidth={2.5} />
              </button>
              <span className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--icon-color)" }}>
                {initials(row.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                  <span className="text-[15px] font-bold text-slate-900 truncate max-w-full">{row.full_name}</span>
                  <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.candidate_code}</span>
                  <span className={`inline-flex items-center h-[20px] px-2 rounded-full text-[10px] font-bold leading-none border ${st.chip}`}>{st.label}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 truncate" title={`${row.v_title} · ${row.vacancy_no || ""}`}>
                  {row.v_title} · <span className="font-mono">{row.vacancy_no || "—"}</span>{row.department_name ? ` · ${row.department_name}` : ""}
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1.5 text-[11px]">
              {[
                ["Mobile", row.mobile], ["Email", row.email],
                ["Source", row.entry_channel === "PublicURL" ? "Public URL" : row.source_channel || row.entry_channel],
                ["Sourced", fmtDate(row.sourced_at)], ["Recruiter", row.recruiter_name],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-slate-400 text-[10px]">{k}</dt>
                  <dd className="font-medium text-slate-800 truncate" title={v || ""}>{v || "—"}</dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:justify-end">
              {row.resume_file_path ? (
                <a href={`${config.apiUrl}${row.resume_file_path}`} target="_blank" rel="noopener noreferrer" className="h-[30px] sm:h-[26px] px-2.5 inline-flex items-center justify-center gap-1 text-[11px] font-semibold border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 whitespace-nowrap">
                  <FileText size={13} /> Resume
                </a>
              ) : (
                <span className="h-[30px] sm:h-[26px] px-2.5 inline-flex items-center justify-center gap-1 text-[11px] font-semibold border border-slate-200 rounded-md bg-slate-50 text-slate-400 whitespace-nowrap" title="No resume attached"><FileText size={13} /> Resume</span>
              )}
              <button
                type="button"
                disabled={locked}
                onClick={() => setIsSendAssessmentOpen(true)}
                className="h-[30px] sm:h-[26px] px-2.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                title="Dispatch Online Assessment Link"
              >
                <Award size={13} /> Send Assessment
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setWhatsappModalOpen(true)}
                className="h-[30px] sm:h-[26px] px-2.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                title="Send WhatsApp Message"
              >
                <MessageSquare size={13} /> WhatsApp
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setCallModalOpen(true)}
                className="h-[30px] sm:h-[26px] px-2.5 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-md text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                style={{ background: "var(--icon-color)" }}
                title="Log Call, Audio Recording & Dispositions"
              >
                <PhoneCall size={13} /> Call / Disposition
              </button>
            </div>
          </div>

          {/* Stage stepper */}
          {/* Stage stepper */}
          <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mb-1.5">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#0f2137]">Pipeline Progress · Stage {row.current_stage} of {TOTAL_STAGES}</span>
              <span className="text-[11px] text-slate-500">{daysBetween(row.entered_pipeline_at)} days in pipeline · {clearedCount} stages cleared · {milestones} milestones reached</span>
            </div>
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[640px]">
                <StageStepper currentStage={row.current_stage} category={row.category} statusBase={row.current_status_base} history={history} scheduledAt={row.scheduled_at} statusSince={row.status_since} />
              </div>
            </div>
            <PipelineProgressBar currentStage={row.current_stage} category={row.category} statusBase={row.current_status_base} className="mt-2" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 items-start">
            {/* LEFT: current status + update form */}
            <div className="space-y-3 min-w-0">
              <SectionCard title="CURRENT UNIQUE STATUS" icon={<Activity className="w-3 h-3" />} theme="indigo" bodyClassName="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={row.current_status} category={row.category} statusBase={row.current_status_base} size="md" />
                  <span className="text-[11px] text-slate-500">Category: <b className={st.text}>{st.label}</b> · since {fmtDateTime(row.status_since)} ({timeAgo(row.status_since)})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2">
                    <div className="text-[9.5px] font-semibold uppercase text-slate-400">Next Action</div>
                    <div className="text-[11.5px] text-slate-800">{row.next_action || "—"}</div>
                    {row.scheduled_at && <div className="text-[10.5px] mt-0.5" style={{ color: "var(--icon-color)" }}>Scheduled: {fmtDateTime(row.scheduled_at)}</div>}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2">
                    <div className="text-[9.5px] font-semibold uppercase text-slate-400">System Automation</div>
                    <div className="text-[11.5px] text-slate-800">{row.automation || "None"}</div>
                  </div>
                </div>
                {callLimit > 0 && !locked && (
                  <div className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-[11px] ${row.call_attempts_current_stage >= callLimit - 1 ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <AlertTriangle size={13} className="shrink-0" />
                    <span><b>Call attempts ({stage?.short}):</b> {row.call_attempts_current_stage} of {callLimit} used · reaching the limit auto-sets "Rejected - {stage?.short === "Sourcing" ? "Raw Data" : stage?.short} - No Communication"</span>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="UPDATE STATUS"
                icon={<Send className="w-3 h-3" />}
                theme="sky"
                right={<span className="hidden sm:inline text-[10px] text-slate-500">Only transitions valid from the current stage are listed</span>}
                bodyClassName="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {locked ? (
                  <div className="sm:col-span-2 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded p-3 text-[12px] text-rose-700">
                    <Lock size={14} /> This record is locked at terminal status <b>{row.current_status}</b>. No further transitions are allowed.
                  </div>
                ) : (
                  <>
                    <FormField label="Operational Action" required error={errors.to_status}>
                      <select ref={actionRef} value={form.to_status} onChange={(e) => { setForm((f) => ({ ...f, to_status: e.target.value, reason: "", scheduled_at: "" })); setErrors({}); }} className={formInputClass(!canModify, errors.to_status)} disabled={!canModify}>
                        <option value="">-- Select action --</option>
                        {transitions.map((t) => (
                          <option key={t.to_status} value={t.to_status}>
                            {t.is_call_attempt ? `Call Attempt Unanswered (attempt ${t.attempt_no} of ${t.call_limit})` : t.action}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Generated Unique Status" hint="auto-filled">
                      <input type="text" readOnly value={generatedStatus} placeholder="Select an action" className={`${formInputClass(true, false)} ${selected ? (CATEGORY_STYLES[selected.category]?.text || "") : ""} font-semibold`} />
                    </FormField>
                    <FormField label="Reason" required={!!selected?.reason_required} error={errors.reason} hint={selected?.reason_required ? "mandatory for Not Interested / Offer Declined" : "not applicable"}>
                      <select value={form.reason} onChange={(e) => setField("reason", e.target.value)} disabled={!selected?.reason_required || !canModify} className={formInputClass(!selected?.reason_required || !canModify, errors.reason)}>
                        <option value="">-- Select reason --</option>
                        {reasonOptions.map((r) => <option key={r.reason_id} value={r.reason_name}>{r.reason_name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Reschedule / Callback Date & Time" required={!!selected?.schedule_required} error={errors.scheduled_at} hint={selected?.schedule_required ? "" : "not applicable"}>
                      <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setField("scheduled_at", e.target.value)} disabled={!selected?.schedule_required || !canModify} className={`${formInputClass(!selected?.schedule_required || !canModify, errors.scheduled_at)}  font-mono text-[16px] sm:text-[11px]`} />
                    </FormField>
                    <FormField label="Recruiter Remarks" className="sm:col-span-2">
                      <textarea rows={3} value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} disabled={!canModify} placeholder="Call notes, candidate response, panel remarks..." className={`${formInputClass(!canModify, false)} !h-auto py-1.5 resize-y`} maxLength={2000} />
                    </FormField>
                    <div className="sm:col-span-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                      <Send size={12} className="mt-0.5 shrink-0" style={{ color: "var(--icon-color)" }} />
                      {selected
                        ? commTemplate
                          ? <span>Will auto-dispatch <b className="text-slate-700">"{commTemplate}"</b> to the Communication Dispatch Log on save.{selected.is_call_attempt && selected.category === "Terminal" ? " Call limit reached — this attempt auto-rejects." : ""}</span>
                          : <span>No auto-dispatch for this status.{selected.automation ? ` System: ${selected.automation}.` : ""}</span>
                        : <span>Select an action to see what will auto-dispatch.</span>}
                    </div>
                  </>
                )}
              </SectionCard>

              {/* Candidate Assessment Review & Manual Grading Card */}
              <CandidateAssessmentReviewCard
                pipelineId={pipelineId}
                candidateId={row?.candidate_id}
                onRefreshPipeline={load}
              />
            </div>

            {/* RIGHT: history + comm log */}
            <div className="space-y-3 min-w-0">
              <SectionCard
                title="STATUS HISTORY"
                icon={<History className="w-3 h-3" />}
                theme="slate"
                right={
                  <span className="flex items-center gap-0.5 bg-slate-100 rounded p-[2px]">
                    {["All", "Milestones", "Calls"].map((f) => (
                      <button key={f} type="button" onClick={() => setHistoryFilter(f)} aria-pressed={historyFilter === f} className={`h-[20px] px-2 rounded text-[10.5px] font-semibold ${historyFilter === f ? "bg-white shadow-sm" : "text-slate-500"}`} style={historyFilter === f ? { color: "var(--icon-color)" } : undefined}>{f}</button>
                    ))}
                  </span>
                }
                bodyClassName="block"
              >
                {filteredHistory.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400">No history entries</div>
                ) : (
                  <ol className="max-h-[420px] overflow-y-auto pl-1 pr-1 pt-1">
                    {filteredHistory.map((h, idx) => {
                      const hs = styleFor(h.category, h.to_status);
                      const isLast = idx === filteredHistory.length - 1;
                      return (
                        <li key={h.history_id} className={`relative flex gap-3 text-xs ${isLast ? "" : "pb-4"}`}>
                          {/* rail: dot + connector to the next entry (inside the scroll box, so never clipped) */}
                          <span className="relative w-[14px] shrink-0" aria-hidden="true">
                            {!isLast && (
                              <span className="absolute left-1/2 -translate-x-1/2 top-[14px] -bottom-[2px] w-[2px] rounded-full" style={{ background: "var(--border-main)" }} />
                            )}
                            <span className={`absolute left-1/2 -translate-x-1/2 top-[4px] w-[10px] h-[10px] rounded-full ring-[3px] ${hs.dot} ${hs.ring}`} style={{ "--tw-ring-opacity": 0.45 }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">{fmtDateTime(h.changed_at)}</span>
                              <StatusChip status={h.to_status} category={h.category} statusBase={h.to_status} />
                              <span className={`text-[10px] font-semibold ${hs.text}`}>{hs.label}</span>
                            </div>
                            {h.remarks && <p className="text-[11px] text-slate-600 mt-0.5">{h.remarks}</p>}
                            <p className="text-[10px] text-slate-400">{h.is_system ? "System" : h.changed_by_name || "User"}{h.from_status ? ` · from ${h.from_status}` : ""}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </SectionCard>

              <SectionCard
                title="COMMUNICATION DISPATCH LOG"
                icon={<Send className="w-3 h-3" />}
                theme="teal"
                right={<span className="text-[10px] text-slate-400" title="Communication module integration pending">Open in Communication</span>}
                bodyClassName="block !p-0"
              >
                {commLog.length === 0 ? (
                  <div className="m-3 p-3 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400">No communications dispatched yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
                        <tr>{["Trigger Status", "Channel", "Template", "Delivery", "When"].map((h) => <th key={h} className="text-left px-3 py-1.5 font-semibold border-b border-slate-200">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {commLog.map((c) => (
                          <tr key={c.log_id} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-1.5 text-slate-800 font-medium max-w-[200px] truncate" title={c.trigger_status}>{c.trigger_status}</td>
                            <td className="px-3 py-1.5 text-slate-600">{c.channel}</td>
                            <td className="px-3 py-1.5 text-slate-600 max-w-[220px] truncate" title={c.template_name}>{c.template_name}</td>
                            <td className="px-3 py-1.5"><span className={`inline-flex items-center h-[18px] px-2 rounded-full border text-[10px] font-semibold leading-none whitespace-nowrap ${c.delivery_status === "Delivered" || c.delivery_status === "Opened" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : c.delivery_status === "Failed" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>{c.delivery_status}</span></td>
                            <td className="px-3 py-1.5 text-slate-400 font-mono whitespace-nowrap">{fmtDateTime(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {/* Reused footer: Save & Update Status / Cancel (Alt+S / Esc) */}
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)] bg-white relative z-20">
        <ERPFooter
          isAddMode={!locked && canModify}
          isViewMode={locked || !canModify}
          saveBtnRef={saveBtnRef}
          saving={saving || !selected}
          handleSubmit={handleSave}
          onEditCancel={() => (form.to_status || form.remarks ? resetForm() : onBack())}
          onCancel={onBack}
          rights={rights}
          formData={row}
          moduleKey="pipeline"
        />
      </div>

      {/* Send Assessment Modal */}
      <SendAssessmentModal
        isOpen={isSendAssessmentOpen}
        onClose={() => setIsSendAssessmentOpen(false)}
        pipelineRow={row}
        onSuccess={load}
      />

      {/* Universal Call / Disposition Modal */}
      {callModalOpen && row && (
        <UniversalCallModal
          isOpen={callModalOpen}
          candidate={{
            candidate_id: row.candidate_id,
            candidate_name: row.candidate_name,
            phone: row.primary_contact,
            email: row.primary_email,
            job_title: row.job_title,
            vacancy_id: row.vacancy_id,
            pipeline_id: row.pipeline_id,
            current_stage: row.current_stage,
            current_status_name: row.current_status,
            call_count: row.call_attempts_current_stage || 0,
          }}
          onClose={() => setCallModalOpen(false)}
          onSuccess={() => {
            setCallModalOpen(false);
            load();
          }}
        />
      )}

      {/* Global Reusable WhatsApp Modal */}
      {whatsappModalOpen && row && (
        <GlobalWhatsAppModal
          isOpen={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          recipientPhone={row.primary_contact}
          recipientName={row.candidate_name}
          moduleName="Recruitment"
          referenceType="candidate"
          referenceId={row.candidate_id}
          onMessageSent={() => {
            showToast({ icon: "success", title: "WhatsApp message logged" });
          }}
        />
      )}
    </div>
  );
}

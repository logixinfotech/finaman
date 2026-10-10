import React, { useCallback, useState } from "react";
import {
  PhoneIncoming,
  Search,
  User,
  Building,
  Clock,
  PhoneCall,
  History,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Briefcase,
  Users,
  CalendarClock,
} from "lucide-react";
import SectionCard, { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import { showToast } from "../../../../../components/Reusable/alert";
import { searchInboundCandidate, getCandidateCommunicationHistory } from "../../../../../utils/communicationApi";
import UniversalCallModal from "../components/UniversalCallModal";
import GlobalWhatsAppModal from "../../../../../components/Reusable/whatsapp/GlobalWhatsAppModal";
import { BaseButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";
import { STAGES, fmtDateTime, timeAgo, initials } from "../../CandidateTracking/pipelineConstants";
import { dispositionDot } from "../communicationConstants";
import { MessageSquare } from "lucide-react";

export default function CallReceive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [searched, setSearched] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const resetLookup = () => {
    setSearchTerm("");
    setMatches([]);
    setCandidate(null);
    setRecentCalls([]);
    setSearched(false);
  };

  const selectCandidate = useCallback(async (c) => {
    setCandidate(c);
    setRecentCalls([]);
    if (!c?.candidate_id) return;
    const res = await getCandidateCommunicationHistory(c.candidate_id);
    if (res?.success) setRecentCalls((res.data || []).slice(0, 10));
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      showToast({ icon: "warning", title: "Enter a phone number or candidate name" });
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const res = await searchInboundCandidate(term);
      const list = Array.isArray(res?.data) ? res.data : [];
      setMatches(list);
      if (list.length === 1) await selectCandidate(list[0]);
      else { setCandidate(null); setRecentCalls([]); }
      if (list.length === 0) showToast({ icon: "info", title: "No candidate found with that phone or name" });
    } catch (err) {
      showToast({ icon: "error", title: "Error searching candidate" });
      setMatches([]);
      setCandidate(null);
    } finally {
      setSearching(false);
    }
  };

  const stage = candidate ? STAGES[(candidate.current_stage || 1) - 1] : null;
  const inPipeline = Boolean(candidate?.pipeline_id);

  return (
    <div className="space-y-3">
      {/* Step 1: instant caller lookup */}
      <SectionCard
        title="INBOUND CALL RECEIVE & CALLER LOOKUP"
        icon={<PhoneIncoming className="w-3.5 h-3.5 text-emerald-600" />}
        theme="emerald"
        bodyClassName="p-4 space-y-3"
      >
        <p className="text-xs text-slate-500">
          When a candidate calls in, type the caller's mobile number or name. The match card shows their vacancy and active stage so you can log the call without asking redundant questions.
        </p>
        <form onSubmit={handleSearch} className="max-w-2xl flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Caller phone number or candidate name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${formInputClass(false, false)} pl-9 !text-sm !py-2`}
              autoFocus
            />
          </div>
          <button type="submit" disabled={searching} className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded shadow-xs transition-colors">
            <Search className={`w-3.5 h-3.5 ${searching ? "animate-spin" : ""}`} />
            <span>Verify Caller</span>
          </button>
        </form>

        {/* Several matches: pick the right one */}
        {matches.length > 1 && (
          <div className="border border-slate-200 rounded-md divide-y divide-slate-100 bg-white max-w-2xl">
            <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 flex items-center gap-1.5">
              <Users size={12} /> {matches.length} matches - select the caller
            </div>
            {matches.map((m) => (
              <button
                key={`${m.candidate_id}-${m.pipeline_id || ""}`}
                type="button"
                onClick={() => selectCandidate(m)}
                className={`w-full text-left px-3 py-2 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5 hover:bg-emerald-50 ${candidate?.candidate_id === m.candidate_id && candidate?.pipeline_id === m.pipeline_id ? "bg-emerald-50" : ""}`}
              >
                <span className="font-semibold text-slate-800">{m.full_name}</span>
                <span className="font-mono text-[10.5px] text-slate-500">{m.candidate_code}</span>
                <span className="font-mono text-[10.5px] text-slate-500">{m.mobile}</span>
                <span className="text-slate-500">{m.job_role || "—"} {m.vacancy_no ? `(${m.vacancy_no})` : ""}</span>
                {m.pipeline_id
                  ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Stage {m.current_stage}</span>
                  : <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Not in pipeline</span>}
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Step 2: verified match card */}
      {candidate && (
        <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden">
          <div className="bg-[#e6f7f4] border-b border-[#b2e3da] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {initials(candidate.full_name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 size={12} /> Verified candidate record</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {candidate.full_name} <span className="font-mono text-[11px] text-slate-500">[{candidate.candidate_code}]</span>
                </h3>
                <p className="text-xs text-slate-600 font-mono">{candidate.mobile || "No Phone"} <span className="font-sans">·</span> {candidate.email || "No Email"}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {inPipeline ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0f2137] text-white">
                  Active stage: {candidate.current_stage} · {stage?.stage_name}
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600">Not in a pipeline yet</span>
              )}
              <button
                type="button"
                disabled={!inPipeline}
                title={inPipeline ? "Open the stage-adaptive call log" : "Add this candidate to a pipeline in Candidate Tracking first"}
                onClick={() => setCallModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded shadow-xs transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log Inbound Call</span>
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard title="CANDIDATE & VACANCY" icon={<User className="w-3 h-3 text-blue-600" />} theme="blue" bodyClassName="p-3 space-y-1.5 text-xs">
              {[
                [Briefcase, "Applied Vacancy", [candidate.job_role, candidate.vacancy_no].filter(Boolean).join(" · ")],
                [Building, "Department", candidate.department_name],
                [MapPin, "Location", candidate.location_name || candidate.current_location],
                [Users, "Assigned Recruiter", candidate.recruiter_name],
                [Clock, "Experience", candidate.total_experience_years != null ? `${candidate.total_experience_years} yrs` : null],
              ].map(([Icon, k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><Icon className="w-3.5 h-3.5 text-slate-400" /> {k}</span>
                  <span className="font-medium text-slate-800 truncate text-right" title={v || ""}>{v || "N/A"}</span>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="PIPELINE CONTEXT" icon={<CalendarClock className="w-3 h-3 text-amber-600" />} theme="amber" bodyClassName="p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Status</span>
                <span className="font-medium text-slate-800 text-right truncate" title={candidate.current_status || ""}>{candidate.current_status || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-100">
                <span className="text-slate-500">Unanswered Attempts</span>
                <span className="font-bold text-slate-800">{candidate.call_attempts_current_stage || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Scheduled</span>
                <span className="font-medium text-slate-800 text-right">{candidate.scheduled_at ? fmtDateTime(candidate.scheduled_at) : "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-slate-500">Last Call</span>
                <span className="font-medium text-slate-800 text-right truncate">
                  {candidate.last_disposition ? `${candidate.last_disposition} · ${timeAgo(candidate.last_comm_at)}` : "None"}
                </span>
              </div>
            </SectionCard>

            <SectionCard title="RECENT CALL TIMELINE" icon={<History className="w-3 h-3 text-indigo-600" />} theme="indigo" bodyClassName="p-3 space-y-2 max-h-60 overflow-y-auto">
              {recentCalls.length > 0 ? recentCalls.map((log) => (
                <div key={log.log_id || `${log.created_at}-${log.disposition}`} className="p-2 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${dispositionDot(log.disposition)}`} />
                      {log.disposition}
                      {log.direction && <span className="text-[9.5px] font-semibold text-slate-400 uppercase">· {log.direction}</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{fmtDateTime(log.created_at)}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 line-clamp-2">{log.remarks || "No notes recorded"}</p>
                </div>
              )) : (
                <p className="text-[11px] text-slate-400 italic">No prior calls recorded for this candidate.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {searched && !searching && matches.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-800">Candidate Not Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            No registered candidate matches &quot;{searchTerm}&quot;. Verify the number, or register the candidate first in Candidate Registration.
          </p>
        </div>
      )}

      {/* Footer Action Bar */}
      <div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-2 sm:px-4 py-2 mt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-600">
            {candidate ? (
              <span>Verified candidate: <strong className="text-slate-800">{candidate.full_name}</strong> ({candidate.mobile || "No phone"})</span>
            ) : matches.length > 0 ? (
              <span>{matches.length} matching candidates found</span>
            ) : (
              <span>Inbound Caller Verification Desk</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {candidate ? (
              <>
                <BaseButton
                  onClick={() => setCallModalOpen(true)}
                  disabled={!inPipeline}
                  label="Log Inbound Call"
                  icon={<PhoneCall size={16} />}
                  tone="emerald"
                  title={inPipeline ? "Open call log dialog" : "Candidate not in pipeline"}
                />
                <BaseButton
                  onClick={() => setWhatsappModalOpen(true)}
                  label="Send WhatsApp"
                  icon={<MessageSquare size={16} />}
                  tone="teal"
                  title="Send WhatsApp message"
                />
                <ResetButton onClick={resetLookup} label="New Search" />
              </>
            ) : (
              <>
                <BaseButton
                  onClick={handleSearch}
                  disabled={searching || !searchTerm.trim()}
                  loading={searching}
                  label="Verify Caller"
                  icon={<Search size={16} />}
                  tone="emerald"
                />
                <ResetButton
                  onClick={resetLookup}
                  label="Clear"
                  disabled={!searchTerm && !searched && matches.length === 0}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: same stage-adaptive modal, pre-loaded as an inbound call */}
      {callModalOpen && candidate && (
        <UniversalCallModal
          isOpen={callModalOpen}
          candidate={candidate}
          pipelineId={candidate.pipeline_id}
          initialDirection="Inbound"
          onClose={() => setCallModalOpen(false)}
          onSuccess={() => {
            setCallModalOpen(false);
            handleSearch();
          }}
        />
      )}

      {whatsappModalOpen && candidate && (
        <GlobalWhatsAppModal
          isOpen={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          recipientPhone={candidate.mobile}
          recipientName={candidate.full_name}
          moduleName="Recruitment"
          referenceType="candidate"
          referenceId={candidate.candidate_id}
          onMessageSent={() => showToast({ icon: "success", title: "WhatsApp message logged" })}
        />
      )}
    </div>
  );
}

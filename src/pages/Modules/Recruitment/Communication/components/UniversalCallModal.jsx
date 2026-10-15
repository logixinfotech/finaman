import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  X,
  Mic,
  Upload,
  CheckCircle2,
  FileAudio,
  Trash2,
  Loader2,
  Info,
  Clock,
  Copy,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { saveCallDisposition } from "../../../../../utils/communicationApi";
import { showToast } from "../../../../../components/Reusable/alert";
import { STAGES } from "../../CandidateTracking/pipelineConstants";
import {
  DISPOSITIONS,
  NOT_INTERESTED_REASONS,
  REJECTION_CATEGORIES,
  RESCHEDULE_REASONS,
  INTERVIEW_MODES,
  CALL_LIMITS,
} from "../communicationConstants";

const fmtDT = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");
const money = (n) => (n != null && n !== "" && Number(n) > 0 ? `₹${Number(n).toLocaleString("en-IN")}` : "");
const INPUT = "w-full h-8 px-2 text-[16px] sm:text-xs bg-white border border-slate-300 rounded outline-none focus:border-blue-500";
const LABEL = "block text-[10px] font-bold text-slate-600 uppercase mb-0.5";

// Mobile = phone user-agent OR (touch input AND screen width <= 768px). Everything else is PC.
const detectMobile = () => {
  if (typeof window === "undefined") return false;
  const phoneUA = /Android|iPhone|iPod/i.test(navigator.userAgent || "");
  const touchSmall = (navigator.maxTouchPoints || 0) > 0 && window.innerWidth <= 768;
  return phoneUA || touchSmall;
};

// Valid = 10-digit Indian mobile after removing spaces, dashes, +91 and leading 0
const normalizePhone = (raw) => {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return /^[6-9]\d{9}$/.test(d) ? d : "";
};

// Callers pass rows from different endpoints (calling queue, inbound search, pipeline detail) with different field names
const normalise = (c = {}) => ({
  name: c.full_name || c.candidate_name || "Candidate",
  code: c.candidate_code || "",
  mobile: c.mobile || c.phone || c.primary_contact || "",
  email: c.email || c.primary_email || "",
  role: c.job_role || c.job_title || c.designation_name || "",
  vacancyNo: c.vacancy_no || "",
  department: c.department_name || "",
  location: c.location_name || c.current_location || "",
  source: c.entry_channel === "PublicURL" ? "Public URL" : c.source_channel || c.entry_channel || "",
  experience: c.total_experience_years != null && c.total_experience_years !== "" ? `${c.total_experience_years} yrs` : "",
  ctc: money(c.current_ctc),
  expectedCtc: money(c.expected_ctc),
  status: c.current_status || c.current_status_name || "",
  stageNo: Number(c.current_stage) || 1,
  attempts: Number(c.call_attempts_current_stage ?? c.call_count ?? 0),
  scheduledAt: c.scheduled_at || null,
  recruiter: c.recruiter_name || "",
});

export default function UniversalCallModal({
  isOpen,
  onClose,
  candidate,
  pipelineId,
  initialDirection = "Outbound",
  onSaved,
  onSuccess,
}) {
  const [direction, setDirection] = useState(initialDirection);
  const [disposition, setDisposition] = useState("Interested");
  const [remarks, setRemarks] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [holdReviewDate, setHoldReviewDate] = useState("");
  const [reason, setReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("");
  const [callbackPurpose, setCallbackPurpose] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [interviewMode, setInterviewMode] = useState("Telephonic");
  const [interviewPanelist, setInterviewPanelist] = useState("");
  const [interviewVenue, setInterviewVenue] = useState("");
  const [recordingFile, setRecordingFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMobileDevice, setIsMobileDevice] = useState(detectMobile());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDirection(initialDirection);
      setDisposition("Interested");
      setRemarks("");
      setScheduledAt("");
      setHoldReviewDate("");
      setReason("");
      setRescheduleReason("");
      setRejectionCategory("");
      setCallbackPurpose("");
      setAlternateMobile("");
      setInterviewMode("Telephonic");
      setInterviewPanelist("");
      setInterviewVenue("");
      setRecordingFile(null);
      setErrors({});
      setCopied(false);
      setIsMobileDevice(detectMobile());
    }
  }, [isOpen, initialDirection]);

  // Re-evaluate device type if the window is resized / rotated
  useEffect(() => {
    const onResize = () => setIsMobileDevice(detectMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Wrong Number is only meaningful on an outbound dial that did not connect (spec §2)
  const wrongNumberDisabled = direction === "Inbound";
  useEffect(() => {
    if (wrongNumberDisabled && disposition === "Wrong Number") setDisposition("Interested");
  }, [wrongNumberDisabled, disposition]);

  const c = useMemo(() => normalise(candidate), [candidate]);
  const stage = STAGES[c.stageNo - 1];
  const maxAttempts = CALL_LIMITS[c.stageNo] || null;
  const isRound = c.stageNo >= 4 && c.stageNo <= 6;
  const selectedDisp = DISPOSITIONS.find((d) => d.key === disposition);

  // One normalized number feeds the QR, the Tap to Call link and the Copy option
  const phone10 = useMemo(() => normalizePhone(c.mobile), [c.mobile]);
  const telUri = phone10 ? `tel:+91${phone10}` : "";
  const displayPhone = phone10 ? `+91 ${phone10.slice(0, 5)} ${phone10.slice(5)}` : "";

  const handleCopyNumber = async () => {
    const value = `+91${phone10}`;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const t = document.createElement("textarea");
      t.value = value;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Live preview of what the backend will do on save
  const actionPreview = useMemo(() => {
    const when = scheduledAt ? fmtDT(scheduledAt) : "the selected time";
    switch (disposition) {
      case "Not Picked": {
        const next = c.attempts + 1;
        if (!maxAttempts) return `Unanswered call will be logged (${next} so far). No attempt ceiling at this stage.`;
        if (next >= maxAttempts) return `Attempt ${next}/${maxAttempts} - record will be auto-closed as "No Communication".`;
        return `Attempt ${next} of ${maxAttempts} will be recorded.${next === maxAttempts - 1 ? " The next unanswered call auto-closes the record." : ""}`;
      }
      case "Call Back":
        return `Candidate will appear under Committed Callbacks at ${when} and the recruiter will be reminded.`;
      case "Reschedule":
        return isRound ? `${stage?.short} interview will move to ${when} and the new slot is re-dispatched to the candidate.` : `Follow-up will move to ${when}.`;
      case "Hold":
        return `Profile parked until ${holdReviewDate ? new Date(holdReviewDate).toLocaleDateString("en-IN") : "the review date"}; it leaves the calling queues until then.`;
      case "Not Interested":
        return `Candidate will be dropped (${reason || "reason pending"}) and the record closed.`;
      case "Rejected":
        return `Candidate will be rejected at ${stage?.stage_name || "this stage"} (${rejectionCategory || "category pending"}) and the record closed.`;
      case "Wrong Number":
        return alternateMobile.length === 10
          ? `Contact number will be corrected to ${alternateMobile}; the record stays active.`
          : "Record will be closed as invalid contact data and removed from the calling queues.";
      case "Interested":
        if (c.stageNo === 1) return "Candidate moves to Initial Screening as Qualified & Interested; JD summary is queued for dispatch.";
        if (c.stageNo === 2) return "Screening cleared; candidate is queued for the assessment link.";
        if (c.stageNo === 3) return scheduledAt ? `Assessment cleared; Round 1 telephonic interview booked for ${when}.` : "Assessment cleared; candidate becomes eligible for Round 1 scheduling.";
        if (isRound) return scheduledAt
          ? `If ${stage?.short} is not booked yet, ${when} books it; if it is already done, ${when} books the next round.`
          : `${stage?.short} will be marked as cleared (or interest noted if the interview is still to be booked).`;
        return "Offer step advances (released → accepted / joining confirmed).";
      default:
        return "Action will be logged to communication history.";
    }
  }, [disposition, c.attempts, c.stageNo, maxAttempts, isRound, stage, scheduledAt, holdReviewDate, reason, rejectionCategory, alternateMobile]);

  if (!isOpen || !candidate) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast({ icon: "error", title: "Audio file exceeds 50MB limit" });
      return;
    }
    setRecordingFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!remarks.trim()) errs.remarks = "Calling remarks are mandatory";
    if (disposition === "Call Back" && !scheduledAt) errs.scheduledAt = "Callback date & time is required";
    if (disposition === "Reschedule" && !scheduledAt) errs.scheduledAt = "Revised date & time is required";
    if (disposition === "Reschedule" && !rescheduleReason) errs.rescheduleReason = "Select the reschedule reason";
    if (disposition === "Hold" && !holdReviewDate) errs.holdReviewDate = "Hold review date is required";
    if (disposition === "Not Interested" && !reason) errs.reason = "Please select a reason";
    if (disposition === "Rejected" && !rejectionCategory) errs.rejectionCategory = "Please select a rejection category";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast({ icon: "warning", title: "Please fill the required fields" });
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("candidate_id", candidate.candidate_id);
      if (pipelineId || candidate.pipeline_id) fd.append("pipeline_id", pipelineId || candidate.pipeline_id);
      if (candidate.vacancy_id) fd.append("vacancy_id", candidate.vacancy_id);
      fd.append("comm_type", `Call - ${direction}`);
      fd.append("direction", direction);
      fd.append("disposition", disposition);
      const finalRemarks = disposition === "Call Back" && callbackPurpose.trim()
        ? `Callback purpose: ${callbackPurpose.trim()} | ${remarks.trim()}`
        : remarks.trim();
      fd.append("remarks", finalRemarks);
      if (scheduledAt) fd.append("scheduled_at", new Date(scheduledAt).toISOString());
      if (holdReviewDate) fd.append("hold_review_date", holdReviewDate);
      if (disposition === "Not Interested" && reason) fd.append("reason", reason);
      if (disposition === "Reschedule" && rescheduleReason) fd.append("reason", rescheduleReason);
      if (disposition === "Rejected" && rejectionCategory) {
        fd.append("rejection_category", rejectionCategory);
        fd.append("reason", rejectionCategory);
      }
      if (alternateMobile) fd.append("alternate_mobile", alternateMobile.trim());
      if (disposition === "Interested") {
        fd.append("interview_mode", interviewMode);
        if (interviewPanelist.trim()) fd.append("interview_panelist", interviewPanelist.trim());
        if (interviewVenue.trim()) fd.append("interview_venue", interviewVenue.trim());
      }
      if (recordingFile) fd.append("recording_file", recordingFile);

      const res = await saveCallDisposition(fd);
      if (res?.success) {
        showToast({ icon: "success", title: res.message || "Call disposition saved" });
        (onSuccess || onSaved)?.(res.data);
        onClose();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to save call disposition" });
      }
    } catch (err) {
      showToast({ icon: "error", title: err.message || "Failed to submit" });
    } finally {
      setSaving(false);
    }
  };

  const headerMeta = [c.mobile, c.role, c.vacancyNo, c.department].filter(Boolean).join(" · ");
  const headerExtra = [
    c.email,
    c.source && `Source: ${c.source}`,
    c.experience && `Exp: ${c.experience}`,
    c.ctc && `CTC: ${c.ctc}`,
    c.expectedCtc && `Expected: ${c.expectedCtc}`,
  ].filter(Boolean).join(" · ");

  // Compact call-recording control (used inside Progression panel, and standalone for other statuses)
  const recordingControl = (
    <div>
      <div className="flex items-center justify-between mb-0.5 gap-2">
        <label className={`${LABEL} !mb-0 flex items-center gap-1`}>
          <Mic size={11} className="text-blue-600" /> Attach Call Recording (Optional)
        </label>
        <span className="hidden sm:inline text-[9px] text-slate-400">.mp3, .wav, .m4a, .webm</span>
      </div>
      {recordingFile ? (
        <div className="flex items-center justify-between h-8 px-2 bg-white rounded border border-blue-200 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileAudio size={14} className="text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{recordingFile.name}</span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">({(recordingFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
          </div>
          <button type="button" onClick={() => setRecordingFile(null)} className="p-1 text-slate-400 hover:text-red-600 rounded shrink-0">
            <Trash2 size={13} />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-1.5 h-8 px-2 bg-white border border-dashed border-slate-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors text-xs text-slate-600">
          <Upload size={12} className="text-slate-400" />
          <span className="truncate">Upload call recording audio file</span>
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.webm" onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  );

  // Call handoff: PC = large QR + number + copy; Mobile = Tap to Call (+ copy). Outbound only.
  const callHandoff = direction === "Outbound" && (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      {!phone10 ? (
        <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2.5">
          <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <span>Phone number missing or invalid. Please update candidate profile.</span>
        </div>
      ) : isMobileDevice ? (
        <div className="space-y-1.5">
          <a
            href={telUri}
            className="w-full min-h-[48px] rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm"
          >
            <Phone size={18} /> Call {displayPhone}
          </a>
          <p className="text-[10.5px] text-slate-500 text-center">Opens your phone's dialer with the number pre-filled</p>
          <button
            type="button"
            onClick={handleCopyNumber}
            className="mx-auto flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
          >
            <Copy size={11} /> {copied ? "Number copied" : "Copy number"}
          </button>
        </div>
      ) : (
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Call candidate</span>
            <span className="block text-base font-bold text-slate-900 tracking-wide whitespace-nowrap">{displayPhone}</span>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
            >
              <Copy size={11} /> {copied ? "Number copied" : "Copy number"}
            </button>
            <p className="text-[10.5px] text-slate-500 max-w-[220px]">
              Scan the QR with your phone camera to open the dialer with this number.
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="bg-white p-2 rounded-lg border border-slate-300 shadow-sm">
              <QRCodeSVG key={telUri} value={telUri} size={200} level="M" />
            </div>
            <span className="text-[10.5px] text-slate-600">Scan with phone camera to call</span>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:px-3 sm:py-6 md:py-8 bg-black/50 backdrop-blur-xs font-sans animate-fade-in">
      {/* h-full (not 100dvh) so the footer always stays inside the visible screen on mobile */}
      <div className="bg-white shadow-2xl border border-slate-200 w-full sm:max-w-xl md:max-w-2xl overflow-hidden flex flex-col rounded-none sm:rounded-xl h-full sm:h-auto sm:max-h-full min-h-0">
        {/* Header: candidate + stage context banner + call type */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs font-bold uppercase tracking-wider truncate">{c.name}</h2>
                  {c.code && <span className="text-[10.5px] font-mono text-slate-300">{c.code}</span>}
                </div>
                <p className="text-[10.5px] text-slate-300 truncate mt-0.5" title={headerMeta}>{headerMeta || "—"}</p>
                {headerExtra && <p className="hidden sm:block text-[10px] text-slate-400 truncate" title={headerExtra}>{headerExtra}</p>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-1.5 sm:px-2 py-0.5 rounded text-right max-w-[110px] sm:max-w-none truncate sm:whitespace-nowrap"
                title={`Current stage: ${c.stageNo} · ${stage?.stage_name || ""}`}
              >
                Stage {c.stageNo}<span className="hidden sm:inline"> · {stage?.stage_name || "—"}</span>
              </span>
              <button type="button" onClick={onClose} aria-label="Close" className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Bottom row: status info (left) + attempts & call type (right) */}
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-300">
              {c.status && <span>Status: <b className="text-white">{c.status}</b></span>}
              {c.scheduledAt && <span className="inline-flex items-center gap-1"><Clock size={10} /> Scheduled: <b className="text-white">{fmtDT(c.scheduledAt)}</b></span>}
              {c.recruiter && <span className="hidden sm:inline">Recruiter: <b className="text-white">{c.recruiter}</b></span>}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-slate-300 whitespace-nowrap">
                Unanswered: <b className="text-white">{c.attempts}</b>{maxAttempts ? ` of ${maxAttempts}` : ""}
              </span>
              <div className="flex items-center gap-0.5 bg-white/10 border border-white/20 p-0.5 rounded">
                <button
                  type="button"
                  onClick={() => setDirection("Outbound")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${direction === "Outbound" ? "bg-blue-600 text-white shadow-xs" : "text-slate-200 hover:text-white"}`}
                >
                  <PhoneOutgoing size={10} /> Outbound
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("Inbound")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${direction === "Inbound" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-200 hover:text-white"}`}
                >
                  <PhoneIncoming size={10} /> Inbound
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3 overflow-y-auto overscroll-contain flex-1 min-h-0 text-xs">
          {/* Call handoff (QR on PC / Tap to Call on mobile) */}
          {callHandoff}

          {/* Level 1: the 8 universal statuses (unchanged) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Call Status / Outcome <span className="text-red-500">*</span>
            </label>

            {/* Mobile: dropdown */}
            <div className="sm:hidden relative">
              <span
                className={`absolute left-2.5 top-[15px] w-2.5 h-2.5 rounded-full pointer-events-none ${selectedDisp?.dot || ""}`}
              />
              <select
                value={disposition}
                onChange={(e) => { setDisposition(e.target.value); setErrors({}); }}
                className="w-full h-10 pl-7 pr-2 text-[16px] font-bold bg-white border border-blue-500 rounded-lg outline-none text-blue-900 ring-2 ring-blue-500/10"
              >
                {DISPOSITIONS.map((d) => {
                  const disabled = d.key === "Wrong Number" && wrongNumberDisabled;
                  return (
                    <option key={d.key} value={d.key} disabled={disabled}>
                      {d.label}{disabled ? " (not on inbound call)" : ""}
                    </option>
                  );
                })}
              </select>
              {selectedDisp?.description && (
                <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">{selectedDisp.description}</p>
              )}
            </div>

            {/* Desktop / tablet: buttons */}
            <div className="hidden sm:grid grid-cols-4 gap-1.5">
              {DISPOSITIONS.map((d) => {
                const isSelected = disposition === d.key;
                const disabled = d.key === "Wrong Number" && wrongNumberDisabled;
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={disabled}
                    title={disabled ? "Not available on a connected inbound call" : d.description}
                    onClick={() => { setDisposition(d.key); setErrors({}); }}
                    className={`p-2 rounded-lg border text-left transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${d.dot}`} />
                    <span className={`text-[11px] font-bold ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 2: conditional execution panel */}
          {disposition === "Interested" && (
            <div className="p-2.5 sm:p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2.5 animate-fade-in">
              <div>
                <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider block">Progression Parameters</span>
                <span className="hidden sm:block text-[10px] text-emerald-700">
                  {c.stageNo <= 3
                    ? "Optional: book the next interview slot now, or leave blank to just advance the candidate."
                    : `If ${stage?.short} is not booked yet, the slot books it. If ${stage?.short} is done, the slot books the next round.`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className={LABEL}>Interview Date & Time</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={`${INPUT} font-mono`} />
                </div>
                <div>
                  <label className={LABEL}>Mode of Interview</label>
                  <select value={interviewMode} onChange={(e) => setInterviewMode(e.target.value)} className={INPUT}>
                    {INTERVIEW_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Assigned Panelist</label>
                  <input type="text" value={interviewPanelist} onChange={(e) => setInterviewPanelist(e.target.value)} placeholder="Panelist name" className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className={LABEL}>Venue / Video Link</label>
                  <input type="text" value={interviewVenue} onChange={(e) => setInterviewVenue(e.target.value)} placeholder="e.g. Head Office Room 4 or Google Meet link" className={INPUT} />
                </div>
                {recordingControl}
              </div>
            </div>
          )}

          {disposition === "Call Back" && (
            <div className="p-2.5 sm:p-3 bg-amber-50/60 rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
              <div>
                <label className={LABEL}>Callback Date & Time <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={`${INPUT} font-mono ${errors.scheduledAt ? "!border-red-500" : ""}`} />
                {errors.scheduledAt && <p className="text-[10px] text-red-600 mt-0.5">{errors.scheduledAt}</p>}
              </div>
              <div>
                <label className={LABEL}>Callback Purpose</label>
                <input type="text" value={callbackPurpose} onChange={(e) => setCallbackPurpose(e.target.value)} placeholder="e.g. Discuss CTC after shift ends" className={INPUT} />
              </div>
            </div>
          )}

          {disposition === "Reschedule" && (
            <div className="p-2.5 sm:p-3 bg-sky-50/60 rounded-lg border border-sky-200 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
              <div>
                <label className={LABEL}>Revised Date & Time <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={`${INPUT} font-mono ${errors.scheduledAt ? "!border-red-500" : ""}`} />
                {errors.scheduledAt && <p className="text-[10px] text-red-600 mt-0.5">{errors.scheduledAt}</p>}
              </div>
              <div>
                <label className={LABEL}>Reschedule Reason <span className="text-red-500">*</span></label>
                <select value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} className={`${INPUT} ${errors.rescheduleReason ? "!border-red-500" : ""}`}>
                  <option value="">Select a reason...</option>
                  {RESCHEDULE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.rescheduleReason && <p className="text-[10px] text-red-600 mt-0.5">{errors.rescheduleReason}</p>}
              </div>
            </div>
          )}

          {disposition === "Hold" && (
            <div className="p-2.5 sm:p-3 bg-purple-50/60 rounded-lg border border-purple-200 space-y-1 animate-fade-in">
              <label className={LABEL}>Hold Review Date <span className="text-red-500">*</span></label>
              <input type="date" value={holdReviewDate} onChange={(e) => setHoldReviewDate(e.target.value)} className={`${INPUT} sm:w-60 font-mono ${errors.holdReviewDate ? "!border-red-500" : ""}`} />
              {errors.holdReviewDate && <p className="text-[10px] text-red-600">{errors.holdReviewDate}</p>}
              <p className="text-[10px] text-purple-700">Put the justification in the remarks below.</p>
            </div>
          )}

          {disposition === "Not Interested" && (
            <div className="p-2.5 sm:p-3 bg-orange-50/60 rounded-lg border border-orange-200 space-y-1 animate-fade-in">
              <label className={LABEL}>Reason for Opting Out <span className="text-red-500">*</span></label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${INPUT} ${errors.reason ? "!border-red-500" : ""}`}>
                <option value="">Select a reason...</option>
                {NOT_INTERESTED_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.reason && <p className="text-[10px] text-red-600">{errors.reason}</p>}
            </div>
          )}

          {disposition === "Rejected" && (
            <div className="p-2.5 sm:p-3 bg-rose-50/60 rounded-lg border border-rose-200 space-y-1 animate-fade-in">
              <label className={LABEL}>Rejection Category <span className="text-red-500">*</span></label>
              <select value={rejectionCategory} onChange={(e) => setRejectionCategory(e.target.value)} className={`${INPUT} ${errors.rejectionCategory ? "!border-red-500" : ""}`}>
                <option value="">Select rejection category...</option>
                {REJECTION_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.rejectionCategory && <p className="text-[10px] text-red-600">{errors.rejectionCategory}</p>}
              <p className="text-[10px] text-rose-700">Put the evaluator's assessment notes in the remarks below.</p>
            </div>
          )}

          {disposition === "Wrong Number" && (
            <div className="p-2.5 sm:p-3 bg-red-50/60 rounded-lg border border-red-200 space-y-1 animate-fade-in">
              <label className={LABEL}>Alternate Contact Number (Optional)</label>
              <input type="text" inputMode="numeric" value={alternateMobile} onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" className={`${INPUT} sm:w-60 font-mono`} />
              <p className="text-[10px] text-red-700">With a valid alternate number the record stays active and the number is corrected; without one the record is closed as invalid data.</p>
            </div>
          )}

          {/* Call recording: shown standalone for statuses that have no Progression panel */}
          {disposition !== "Interested" && (
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              {recordingControl}
            </div>
          )}

          {/* Level 3: mandatory remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Calling Remarks / Recruiter Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); if (errors.remarks) setErrors((p) => ({ ...p, remarks: null })); }}
              placeholder="Summary of the conversation, evaluator notes, hold justification..."
              className={`w-full px-2 py-1.5 text-[16px] sm:text-xs bg-white border rounded outline-none resize-none leading-snug ${errors.remarks ? "border-red-500" : "border-slate-300 focus:border-blue-500"}`}
            />
            {errors.remarks && <p className="text-[10.5px] text-red-600 mt-0.5">{errors.remarks}</p>}
          </div>

          {/* Level 4: automated triggers preview */}
          <div className="p-2 sm:p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2 text-xs text-blue-900">
            <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-bold block text-[9.5px] uppercase tracking-wider text-blue-700">Automated actions on save:</span>
              <p className="text-[10.5px] sm:text-[11px] text-blue-950 mt-0.5">{actionPreview}</p>
            </div>
          </div>
        </form>

        {/* Footer: always pinned, never scrolls away */}
        <div className="bg-slate-50 px-3 sm:px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-3 h-9 sm:h-auto sm:py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 sm:flex-none sm:ml-auto px-5 h-9 sm:h-auto sm:py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Save & Update Status
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
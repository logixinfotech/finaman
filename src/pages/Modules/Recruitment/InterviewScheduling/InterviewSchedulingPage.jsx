import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Video,
  Building2,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  X,
  Sparkles,
  CheckSquare,
  Square,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import { showToast } from "../../../../components/Reusable/alert";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import { formInputClass } from "../../../../components/Reusable/form/SectionCard";
import {
  getInterviewScheduleBoard,
  getActivePanelists,
  checkScheduleConflict,
  suggestScheduleSlot,
  saveInterviewSchedule,
  dispatchBulkInvites,
  getActiveVacanciesWithJD
} from "../../../../utils/recruitmentApi";
import { BaseButton, RefreshButton, ResetButton } from "../../../../components/Reusable/button/ActionButon";
import { fmtDate, fmtDateTime, initials } from "../CandidateTracking/pipelineConstants";

const ROUND_OPTIONS = [
  { value: "Round 1", label: "Round 1 (Telephonic)", pillBg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Round 2", label: "Round 2 (Walk-In)", pillBg: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "Final Management", label: "Final Management", pillBg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Rescheduled", label: "Round 1 (Rescheduled)", pillBg: "bg-sky-50 text-sky-700 border-sky-200" }
];

const MODE_OPTIONS = [
  { value: "Telephonic", label: "Telephonic / Call", icon: PhoneCall },
  { value: "Office Walk-In", label: "Walk-In / Office", icon: Building2 },
  { value: "Video Call", label: "Google Meet (VC)", icon: Video }
];

const ROOM_OPTIONS = [
  "Room #204, Noida Sec-63",
  "Board Room #1, 2nd Floor",
  "Executive Cabin #3",
  "Conference Room A (1st Floor)",
  "Interview Cabin 1",
  "HR Discussion Room"
];

const EMPTY_RESOLVE_MODAL = {
  open: false,
  row: null,
  suggestedStart: null,
  suggestedEnd: null,
  formattedStart: "",
  formattedEnd: "",
  calculating: false,
  message: ""
};

// ── Toast Helper ─────────────────────────────────────────────────────────────
const toast = (msg, icon = "success") => {
  if (!msg) return;
  if (typeof msg === "object") showToast(msg);
  else showToast({ icon, title: String(msg) });
};

export default function InterviewSchedulingPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [panelists, setPanelists] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, scheduled: 0, conflict: 0, dispatched: 0 });

  // Top ERP Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterVacancy, setFilterVacancy] = useState("");
  const [filterRound, setFilterRound] = useState("");
  const [filterPanelist, setFilterPanelist] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Buffer: maps pipeline_id or candidate_id to draft changes
  const [drafts, setDrafts] = useState({});
  const [savingIds, setSavingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [resolveModal, setResolveModal] = useState(EMPTY_RESOLVE_MODAL);

  const [dispatchModal, setDispatchModal] = useState({
    open: false,
    channel: "Email",
    sending: false,
    eligibleCount: 0
  });

  const [previewCandidate, setPreviewCandidate] = useState(null);

  // ── Load Panelists & Vacancies ──────────────────────────────────────────────
  const loadMasterData = useCallback(async () => {
    try {
      const [panRes, vacRes] = await Promise.all([
        getActivePanelists().catch(() => ({ success: false, data: [] })),
        getActiveVacanciesWithJD ? getActiveVacanciesWithJD().catch(() => ({ success: false, data: [] })) : Promise.resolve({ success: false, data: [] })
      ]);
      if (panRes?.success && Array.isArray(panRes.data)) {
        setPanelists(panRes.data);
      }
      if (vacRes?.success && Array.isArray(vacRes.data)) {
        setVacancies(vacRes.data);
      }
    } catch (e) {
      console.warn("Could not load panelists/vacancies:", e);
    }
  }, []);

  // ── Fetch Board Data ────────────────────────────────────────────────────────
  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInterviewScheduleBoard({
        date: filterDate || undefined,
        vacancy_id: filterVacancy || undefined,
        round: filterRound || undefined,
        mode: filterMode || undefined,
        search: searchQuery || undefined
      });

      if (res?.success) {
        setRows(res.data || []);
        setStats(res.stats || { total: 0, pending: 0, scheduled: 0, conflict: 0, dispatched: 0 });

        // Initialize drafts for inline editing
        const initialDrafts = {};
        (res.data || []).forEach((r) => {
          const toLocalDT = (dt) => {
            if (!dt) return "";
            const d = new Date(dt);
            if (isNaN(d.getTime())) return "";
            const pad = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          };

          const defaultStart = r.confirmed_start_datetime || r.pipeline_scheduled_at || "";
          let defaultEnd = r.confirmed_end_datetime || "";
          if (defaultStart && !defaultEnd) {
            const s = new Date(defaultStart);
            if (!isNaN(s.getTime())) {
              defaultEnd = new Date(s.getTime() + 30 * 60000).toISOString();
            }
          }

          initialDrafts[r.pipeline_id] = {
            schedule_id: r.schedule_id || null,
            candidate_id: r.candidate_id,
            vacancy_id: r.vacancy_id,
            pipeline_id: r.pipeline_id,
            round_no: r.round_no || (r.current_status?.includes("Round 2") ? "Round 2" : r.current_status?.includes("Final") ? "Final Management" : "Round 1"),
            interview_mode: r.interview_mode || "Telephonic",
            preferred_start_datetime: r.preferred_start_datetime || r.pipeline_scheduled_at || null,
            preferred_end_datetime: r.preferred_end_datetime || null,
            confirmed_start_datetime: toLocalDT(defaultStart),
            confirmed_end_datetime: toLocalDT(defaultEnd),
            panelist_employee_id: r.panelist_employee_id || (panelists[0]?.employee_id || ""),
            panelist_name: r.panelist_name || (panelists[0]?.employee_name || ""),
            venue_room: r.venue_room || (r.interview_mode === "Office Walk-In" ? ROOM_OPTIONS[0] : ""),
            meeting_link: r.meeting_link || (r.interview_mode === "Video Call" ? "https://meet.google.com/abc-xyz" : ""),
            hr_notes: r.hr_notes || "",
            conflict_status: r.conflict_status || "Clear",
            conflict_remarks: r.conflict_remarks || null
          };
        });
        setDrafts(initialDrafts);
      } else {
        toast(res?.message || "Failed to load scheduling board", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to load scheduling board", "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterVacancy, filterRound, filterMode, searchQuery, panelists]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // ── Handle Draft Changes ───────────────────────────────────────────────────
  const updateDraftField = (pipelineId, field, value) => {
    setDrafts((prev) => {
      const cur = prev[pipelineId] || {};
      const updated = { ...cur, [field]: value };

      if (field === "confirmed_start_datetime" && value) {
        const s = new Date(value);
        if (!isNaN(s.getTime())) {
          const currentEnd = updated.confirmed_end_datetime ? new Date(updated.confirmed_end_datetime) : null;
          if (!currentEnd || currentEnd <= s) {
            const newEnd = new Date(s.getTime() + 30 * 60000);
            const pad = (n) => String(n).padStart(2, "0");
            updated.confirmed_end_datetime = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())}T${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`;
          }
        }
      }

      if (field === "interview_mode") {
        if (value === "Office Walk-In" && !updated.venue_room) {
          updated.venue_room = ROOM_OPTIONS[0];
        }
        if (value === "Video Call" && !updated.meeting_link) {
          updated.meeting_link = "https://meet.google.com/abc-xyz";
        }
      }

      if (field === "panelist_employee_id") {
        const p = panelists.find((emp) => String(emp.employee_id) === String(value));
        updated.panelist_name = p ? p.employee_name : "";
      }

      return { ...prev, [pipelineId]: updated };
    });
  };

  // ── Save Single Schedule ────────────────────────────────────────────────────
  const handleSaveSchedule = async (pipelineId) => {
    const draft = drafts[pipelineId];
    if (!draft) return;

    if (!draft.confirmed_start_datetime || !draft.confirmed_end_datetime) {
      toast("Please enter confirmed start and end date/time.", "warning");
      return;
    }
    if (new Date(draft.confirmed_start_datetime) >= new Date(draft.confirmed_end_datetime)) {
      toast("Start time must be before end time.", "warning");
      return;
    }
    if (draft.interview_mode === "Office Walk-In" && !draft.venue_room?.trim()) {
      toast("Please select or enter a venue room for Office Walk-In.", "warning");
      return;
    }
    if (draft.interview_mode === "Video Call" && !draft.meeting_link?.trim()) {
      toast("Please enter a meeting link for Video Call.", "warning");
      return;
    }

    setSavingIds((prev) => new Set(prev).add(pipelineId));
    try {
      const res = await saveInterviewSchedule(draft);
      if (res.success) {
        toast(res.message || "Schedule confirmed successfully.", "success");
        setDrafts((prev) => ({
          ...prev,
          [pipelineId]: {
            ...prev[pipelineId],
            schedule_id: res.schedule_id,
            conflict_status: res.conflict_status,
            conflict_remarks: res.conflict_remarks
          }
        }));
        fetchBoard();
      } else {
        toast(res.message || "Failed to save schedule.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to save schedule.", "error");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(pipelineId);
        return next;
      });
    }
  };

  // ── Open Resolve Slot Modal ────────────────────────────────────────────────
  const handleOpenResolveModal = async (row) => {
    const draft = drafts[row.pipeline_id] || {};
    const baseDate = draft.confirmed_start_datetime
      ? draft.confirmed_start_datetime.split("T")[0]
      : new Date().toISOString().split("T")[0];

    setResolveModal({
      open: true,
      row,
      suggestedStart: null,
      suggestedEnd: null,
      formattedStart: "",
      formattedEnd: "",
      calculating: true,
      message: ""
    });

    try {
      const res = await suggestScheduleSlot({
        schedule_id: draft.schedule_id || row.schedule_id,
        panelist_employee_id: draft.panelist_employee_id || row.panelist_employee_id,
        venue_room: draft.venue_room || row.venue_room,
        target_date: baseDate,
        duration_minutes: 30
      });

      if (res.success && res.found) {
        setResolveModal((prev) => ({
          ...prev,
          calculating: false,
          suggestedStart: res.suggested_start,
          suggestedEnd: res.suggested_end,
          formattedStart: res.formatted_start,
          formattedEnd: res.formatted_end,
          message: ""
        }));
      } else {
        setResolveModal((prev) => ({
          ...prev,
          calculating: false,
          suggestedStart: null,
          suggestedEnd: null,
          message: res.message || "No open slot found on this date."
        }));
      }
    } catch (err) {
      setResolveModal((prev) => ({
        ...prev,
        calculating: false,
        message: err.message || "Failed to calculate suggested slot."
      }));
    }
  };

  // ── Apply Suggested Slot ───────────────────────────────────────────────────
  const handleApplySuggestedSlot = () => {
    if (!resolveModal.row || !resolveModal.suggestedStart) return;
    const pipelineId = resolveModal.row.pipeline_id;

    const toLocalDT = (dt) => {
      const d = new Date(dt);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    updateDraftField(pipelineId, "confirmed_start_datetime", toLocalDT(resolveModal.suggestedStart));
    updateDraftField(pipelineId, "confirmed_end_datetime", toLocalDT(resolveModal.suggestedEnd));
    updateDraftField(pipelineId, "conflict_status", "Clear");
    updateDraftField(pipelineId, "conflict_remarks", null);

    setResolveModal(EMPTY_RESOLVE_MODAL);
    toast("Suggested slot applied. Click Save to confirm.", "success");
  };

  // ── Filtered Rows ──────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterPanelist && String(r.panelist_employee_id) !== String(filterPanelist)) return false;
      return true;
    });
  }, [rows, filterPanelist]);

  // Total active conflicts
  const activeConflicts = useMemo(() => {
    return filteredRows.filter((r) => {
      const draft = drafts[r.pipeline_id];
      return (draft?.conflict_status && draft.conflict_status !== "Clear") || (r.conflict_status && r.conflict_status !== "Clear");
    });
  }, [filteredRows, drafts]);

  // ── Open Dispatch Modal ────────────────────────────────────────────────────
  const handleOpenDispatchModal = () => {
    if (activeConflicts.length > 0) {
      toast(`${activeConflicts.length} scheduling conflict(s) must be resolved before dispatch.`, "error");
      return;
    }

    const unconfirmed = filteredRows.filter((r) => !r.schedule_id && !drafts[r.pipeline_id]?.schedule_id);
    if (unconfirmed.length > 0) {
      toast(`${unconfirmed.length} candidates need their schedules saved before dispatching.`, "warning");
      return;
    }

    setDispatchModal({
      open: true,
      channel: "Email",
      sending: false,
      eligibleCount: filteredRows.length
    });
  };

  // ── Execute Bulk Dispatch ──────────────────────────────────────────────────
  const handleExecuteBulkDispatch = async () => {
    const scheduleIds = filteredRows
      .map((r) => drafts[r.pipeline_id]?.schedule_id || r.schedule_id)
      .filter(Boolean);

    if (scheduleIds.length === 0) {
      toast("No saved interview schedules found to dispatch.", "warning");
      return;
    }

    setDispatchModal((prev) => ({ ...prev, sending: true }));
    try {
      const res = await dispatchBulkInvites({
        schedule_ids: scheduleIds,
        channel: dispatchModal.channel
      });

      if (res.success) {
        toast(res.message || "Interview invitations dispatched successfully.", "success");
        setDispatchModal({ open: false, channel: "Email", sending: false, eligibleCount: 0 });
        fetchBoard();
      } else {
        toast(res.message || "Failed to dispatch invitations.", "error");
      }
    } catch (err) {
      toast(err.message || "Failed to dispatch invitations.", "error");
    } finally {
      setDispatchModal((prev) => ({ ...prev, sending: false }));
    }
  };

  const getRoundBadge = (roundNo = "Round 1") => {
    const match = ROUND_OPTIONS.find((o) => o.value === roundNo) || ROUND_OPTIONS[0];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${match.pillBg} inline-block whitespace-nowrap`}>
        {match.label}
      </span>
    );
  };

  const hasAnyFilter = filterDate || filterVacancy || filterRound || filterPanelist || searchQuery;

  const clearFilters = () => {
    setFilterDate("");
    setFilterVacancy("");
    setFilterRound("");
    setFilterPanelist("");
    setSearchQuery("");
  };

  // ── Shared cell renderers (used by both the table and the mobile cards) ─────
  const renderRoundSelect = (r, draft) => (
    <select
      value={draft.round_no || "Round 1"}
      onChange={(e) => updateDraftField(r.pipeline_id, "round_no", e.target.value)}
      className="px-2 py-1 rounded-full text-xs font-semibold border bg-white focus:outline-none focus:border-blue-500 cursor-pointer w-full xl:w-auto max-w-full"
    >
      {ROUND_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const renderPreferred = (r) =>
    r.preferred_start_datetime || r.pipeline_scheduled_at ? (
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Clock size={13} className="text-slate-400 shrink-0" />
        <span>{fmtDateTime(r.preferred_start_datetime || r.pipeline_scheduled_at)}</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
        <Clock size={13} className="text-slate-300 shrink-0" />
        <span>10:00 AM - 10:30 AM (Ref)</span>
      </div>
    );

  const renderConfirmedSlot = (r, draft, hasConflict) => (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded border bg-white w-full min-w-0 ${hasConflict ? "border-red-500 ring-1 ring-red-400" : "border-slate-300"
        }`}
    >
      <CalendarIcon size={12} className={hasConflict ? "text-red-500 shrink-0" : "text-slate-400 shrink-0"} />
      <input
        type="datetime-local"
        value={draft.confirmed_start_datetime || ""}
        onChange={(e) => updateDraftField(r.pipeline_id, "confirmed_start_datetime", e.target.value)}
        className="text-xs text-slate-800 bg-transparent focus:outline-none w-full min-w-0"
      />
    </div>
  );

  const renderModeSelect = (r, draft) => (
    <select
      value={draft.interview_mode || "Telephonic"}
      onChange={(e) => updateDraftField(r.pipeline_id, "interview_mode", e.target.value)}
      className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 w-full"
    >
      {MODE_OPTIONS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );

  const renderPanelistVenue = (r, draft) => (
    <div className="space-y-0.5 min-w-0">
      <select
        value={draft.panelist_employee_id || ""}
        onChange={(e) => updateDraftField(r.pipeline_id, "panelist_employee_id", e.target.value)}
        className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 w-full"
      >
        <option value="">Select Panelist...</option>
        {panelists.map((p) => (
          <option key={p.employee_id} value={p.employee_id}>
            {p.employee_name} ({p.employee_code || "Lead"})
          </option>
        ))}
      </select>

      {draft.interview_mode === "Office Walk-In" ? (
        <select
          value={draft.venue_room || ""}
          onChange={(e) => updateDraftField(r.pipeline_id, "venue_room", e.target.value)}
          className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 w-full focus:outline-none"
        >
          {ROOM_OPTIONS.map((rm) => (
            <option key={rm} value={rm}>
              {rm}
            </option>
          ))}
        </select>
      ) : draft.interview_mode === "Video Call" ? (
        <input
          type="text"
          value={draft.meeting_link || ""}
          onChange={(e) => updateDraftField(r.pipeline_id, "meeting_link", e.target.value)}
          placeholder="meet.google.com/..."
          className="text-[11px] text-blue-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 w-full focus:outline-none font-mono"
        />
      ) : (
        <span className="text-[11px] text-slate-500 block">Direct Phone Dial</span>
      )}
    </div>
  );

  const renderConflict = (draft, hasConflict) =>
    hasConflict ? (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-300 bg-red-50 text-red-700 font-semibold text-xs max-w-full">
        <AlertTriangle size={12} className="text-red-500 shrink-0" />
        <span className="truncate" title={draft.conflict_remarks || draft.conflict_status}>
          {draft.conflict_remarks ? `OVERLAP: ${draft.conflict_remarks}` : `OVERLAP: ${draft.conflict_status}`}
        </span>
      </div>
    ) : (
      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold text-xs max-w-full">
        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
        <span>Slot Available (No Overlap)</span>
      </div>
    );

  const renderAction = (r, hasConflict, isDispatched, isSaving, fullWidthMobile = false) => {
    const w = fullWidthMobile ? "w-full xl:w-auto justify-center" : "";
    if (hasConflict) {
      return (
        <button
          onClick={() => handleOpenResolveModal(r)}
          className={`px-3 py-1.5 xl:py-1 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1 ${w}`}
        >
          <Sparkles size={12} />
          <span>Resolve Slot</span>
        </button>
      );
    }
    if (isDispatched) {
      return (
        <button
          onClick={() => handleSaveSchedule(r.pipeline_id)}
          disabled={isSaving}
          className={`px-3 py-1.5 xl:py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center ${w}`}
        >
          Re-send
        </button>
      );
    }
    return (
      <button
        onClick={() => handleSaveSchedule(r.pipeline_id)}
        disabled={isSaving}
        className={`px-3 py-1.5 xl:py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center ${w}`}
      >
        {isSaving ? "Saving..." : "Save Slot"}
      </button>
    );
  };

  const FieldLabel = ({ children }) => (
    <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
      {children}
    </span>
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 text-xs">
      {/* ── Standard ERP Header (No Entry/Search buttons) ── */}
      <ERPHeader
        title="INTERVIEW SCHEDULING"
        subtitle="Recruitment · Scheduling & Panel Allocation"
        TitleIcon={CalendarIcon}
        isViewMode
        isHidden={true}
        activeTab="entry"
        onTabChange={() => { }}
        rightContent={`${filteredRows.length} Candidate${filteredRows.length === 1 ? "" : "s"}`}
      />

      {/* ── Top ERP Filter Strip ── */}
      <div className="px-2.5 sm:px-3 py-2 bg-[#eef1f8] border-b border-[#dde1ea] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 shrink-0 shadow-2xs">
        {/* Left Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap items-center gap-2 min-w-0">
          {/* Search */}
          <div className="relative w-full xl:w-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2.5 py-1.5 xl:py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-blue-500 w-full xl:w-40"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1 xl:py-0.5 w-full xl:w-auto min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs text-slate-800 bg-transparent focus:outline-none w-full min-w-0"
            />
          </div>

          {/* Vacancy Scope */}
          <select
            value={filterVacancy}
            onChange={(e) => setFilterVacancy(e.target.value)}
            className="px-2 py-1.5 xl:py-1 text-xs border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-blue-500 w-full xl:w-auto xl:max-w-[200px] min-w-0"
          >
            <option value="">Vacancy: All ({vacancies.length})</option>
            {vacancies.map((v) => (
              <option key={v.vacancy_id} value={v.vacancy_id}>
                {v.vacancy_no}: {v.job_role || "Job Vacancy"}
              </option>
            ))}
          </select>

          {/* Round Filter */}
          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="px-2 py-1.5 xl:py-1 text-xs border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-blue-500 w-full xl:w-auto min-w-0"
          >
            <option value="">Round: All</option>
            {ROUND_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Assigned Panelist */}
          <select
            value={filterPanelist}
            onChange={(e) => setFilterPanelist(e.target.value)}
            className="px-2 py-1.5 xl:py-1 text-xs border border-slate-300 rounded text-slate-800 bg-white focus:outline-none focus:border-blue-500 w-full xl:w-auto xl:max-w-[170px] min-w-0"
          >
            <option value="">Panelist: All ({panelists.length})</option>
            {panelists.map((p) => (
              <option key={p.employee_id} value={p.employee_id}>
                {p.employee_name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer text-left sm:text-center xl:text-left py-1"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Right Action & Alerts */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {activeConflicts.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-300 bg-rose-50 text-rose-700 font-semibold text-[11px]">
              <AlertTriangle size={13} className="text-rose-600 shrink-0" />
              <span>
                {activeConflicts.length} Time Overlap{activeConflicts.length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="shrink-0">
            <RefreshButton onClick={fetchBoard} loading={loading} />
          </div>

          <button
            onClick={handleOpenDispatchModal}
            disabled={filteredRows.length === 0 || activeConflicts.length > 0}
            className="flex flex-1 xl:flex-none items-center justify-center gap-1.5 px-3 py-1.5 xl:py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Send size={12} />
            <span className="sm:hidden">Dispatch ({filteredRows.length})</span>
            <span className="hidden sm:inline">Dispatch All Invites ({filteredRows.length})</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Body ── */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 md:p-3.5 space-y-3">
        {/* ═══════════ DESKTOP (xl+): TABLE ═══════════ */}
        <div className="hidden xl:block bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-xs border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 min-w-[170px] border-r border-slate-200">Candidate Name & ID</th>
                  <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-200">Target Round</th>
                  <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-200">Candidate Preferred Slot</th>
                  <th className="py-2.5 px-3 min-w-[210px] border-r border-slate-200">Adjusted / Confirmed Time Slot</th>
                  <th className="py-2.5 px-3 min-w-[120px] border-r border-slate-200">Interview Mode</th>
                  <th className="py-2.5 px-3 min-w-[190px] border-r border-slate-200">Assigned Panelist & Venue/Link</th>
                  <th className="py-2.5 px-3 min-w-[190px] border-r border-slate-200">Slot Conflict / Validation Status</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw size={22} className="animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Loading interview schedules...</span>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CalendarIcon size={30} className="mx-auto mb-2 opacity-30" />
                      <span className="font-semibold text-slate-600 block">No candidates eligible for scheduling</span>
                      <span className="text-slate-400 text-xs">
                        Candidates will appear here when qualified from the Candidate Pipeline or Assessment stage.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const draft = drafts[r.pipeline_id] || {};
                    const isSaving = savingIds.has(r.pipeline_id);
                    const hasConflict = draft.conflict_status && draft.conflict_status !== "Clear";
                    const isDispatched = r.dispatch_status === "Dispatched";

                    return (
                      <tr
                        key={r.pipeline_id}
                        className={`transition-colors ${hasConflict ? "bg-[#fffbeb]" : "hover:bg-slate-50/70"}`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block text-xs">
                            {r.candidate_name || "—"}{" "}
                            <span className="font-normal text-slate-500">[{r.candidate_code || "CAN"}]</span>
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {r.job_role || "General Role"} | Exp:{" "}
                            {r.total_experience_years ? `${r.total_experience_years} Yrs` : "1.5 Yrs"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{renderRoundSelect(r, draft)}</td>
                        <td className="py-2.5 px-3">{renderPreferred(r)}</td>
                        <td className="py-2.5 px-3">{renderConfirmedSlot(r, draft, hasConflict)}</td>
                        <td className="py-2.5 px-3">{renderModeSelect(r, draft)}</td>
                        <td className="py-2.5 px-3">{renderPanelistVenue(r, draft)}</td>
                        <td className="py-2.5 px-3">{renderConflict(draft, hasConflict)}</td>
                        <td className="py-2.5 px-3 text-center">
                          {renderAction(r, hasConflict, isDispatched, isSaving)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════ MOBILE / TABLET (< xl): CARDS ═══════════ */}
        <div className="xl:hidden">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-lg py-12 text-center text-slate-400">
              <RefreshCw size={22} className="animate-spin mx-auto mb-2 text-blue-600" />
              <span>Loading interview schedules...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg py-12 px-4 text-center text-slate-400">
              <CalendarIcon size={30} className="mx-auto mb-2 opacity-30" />
              <span className="font-semibold text-slate-600 block">No candidates eligible for scheduling</span>
              <span className="text-slate-400 text-xs">
                Candidates will appear here when qualified from the Candidate Pipeline or Assessment stage.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRows.map((r) => {
                const draft = drafts[r.pipeline_id] || {};
                const isSaving = savingIds.has(r.pipeline_id);
                const hasConflict = draft.conflict_status && draft.conflict_status !== "Clear";
                const isDispatched = r.dispatch_status === "Dispatched";

                return (
                  <div
                    key={r.pipeline_id}
                    className={`rounded-lg border shadow-xs overflow-hidden min-w-0 ${hasConflict ? "bg-[#fffbeb] border-amber-300" : "bg-white border-slate-200"
                      }`}
                  >
                    {/* Card header */}
                    <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/70">
                      <span className="font-bold text-slate-900 block text-[13px] break-words">
                        {r.candidate_name || "—"}{" "}
                        <span className="font-normal text-slate-500">[{r.candidate_code || "CAN"}]</span>
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {r.job_role || "General Role"} | Exp:{" "}
                        {r.total_experience_years ? `${r.total_experience_years} Yrs` : "1.5 Yrs"}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <FieldLabel>Target Round</FieldLabel>
                        {renderRoundSelect(r, draft)}
                      </div>

                      <div className="min-w-0">
                        <FieldLabel>Candidate Preferred Slot</FieldLabel>
                        <div className="py-1">{renderPreferred(r)}</div>
                      </div>

                      <div className="min-w-0 sm:col-span-2">
                        <FieldLabel>Adjusted / Confirmed Time Slot</FieldLabel>
                        {renderConfirmedSlot(r, draft, hasConflict)}
                      </div>

                      <div className="min-w-0">
                        <FieldLabel>Interview Mode</FieldLabel>
                        {renderModeSelect(r, draft)}
                      </div>

                      <div className="min-w-0">
                        <FieldLabel>Panelist & Venue / Link</FieldLabel>
                        {renderPanelistVenue(r, draft)}
                      </div>

                      <div className="min-w-0 sm:col-span-2">
                        <FieldLabel>Conflict / Validation Status</FieldLabel>
                        {renderConflict(draft, hasConflict)}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
                      {renderAction(r, hasConflict, isDispatched, isSaving, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Resolve Slot Modal ─────────────────────────────────────────────── */}
        {resolveModal.open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-lg shadow-2xl border border-slate-200 max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">Auto-Resolve Conflict Slot</h3>
                </div>
                <button
                  onClick={() => setResolveModal(EMPTY_RESOLVE_MODAL)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-semibold block mb-0.5">Current Conflict:</span>
                  <p className="break-words">
                    {drafts[resolveModal.row?.pipeline_id]?.conflict_remarks ||
                      "Schedule overlaps with an existing panelist or room booking."}
                  </p>
                </div>

                {resolveModal.calculating ? (
                  <div className="py-6 text-center text-slate-500">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-1.5 text-blue-600" />
                    <span>Scanning nearest available slots...</span>
                  </div>
                ) : resolveModal.suggestedStart ? (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="font-semibold text-emerald-800 block mb-1">Suggested Available Window:</span>
                    <div className="text-sm font-bold text-emerald-950 flex items-start gap-1.5">
                      <Clock size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span className="break-words">
                        {new Date(resolveModal.suggestedStart).toLocaleDateString("en-IN", { dateStyle: "medium" })} ·{" "}
                        {resolveModal.formattedStart} - {resolveModal.formattedEnd}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Zero overlap detected for this panelist and room during this window.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                    {resolveModal.message || "No free slot found on this date. Please pick another date."}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setResolveModal(EMPTY_RESOLVE_MODAL)}
                  className="px-3 py-2 sm:py-1.5 rounded border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                {resolveModal.suggestedStart && (
                  <button
                    onClick={handleApplySuggestedSlot}
                    className="px-3.5 py-2 sm:py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Apply Suggested Slot
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Dispatch Summary Modal ────────────────────────────────────────── */}
        {dispatchModal.open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-lg shadow-2xl border border-slate-200 max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                    <Send size={15} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">Dispatch Official Invitations</h3>
                </div>
                <button
                  onClick={() => setDispatchModal({ open: false, channel: "Email", sending: false, eligibleCount: 0 })}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-xs">
                <p className="text-slate-600">
                  You are about to dispatch official interview invitations to{" "}
                  <strong className="text-slate-900">{dispatchModal.eligibleCount} candidate(s)</strong> with confirmed
                  schedule slots.
                </p>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Communication Channel</label>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDispatchModal((prev) => ({ ...prev, channel: "Email" }))}
                      className={`p-2 rounded border text-left flex items-center gap-2 font-semibold text-xs cursor-pointer ${dispatchModal.channel === "Email"
                        ? "border-blue-600 bg-blue-50/70 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <Send size={13} />
                      <span>Candidate Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchModal((prev) => ({ ...prev, channel: "WhatsApp" }))}
                      className={`p-2 rounded border text-left flex items-center gap-2 font-semibold text-xs cursor-pointer ${dispatchModal.channel === "WhatsApp"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <Send size={13} />
                      <span>WhatsApp / SMS</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[11px] space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldCheck size={13} className="text-blue-600" />
                    <span>Automated Validations Passed</span>
                  </div>
                  <p>• Panelist, confirmed time, and meeting link/venue verified.</p>
                  <p>• Zero blocking scheduling conflicts found.</p>
                  <p>• Candidate communication logs will be updated automatically.</p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDispatchModal({ open: false, channel: "Email", sending: false, eligibleCount: 0 })}
                  disabled={dispatchModal.sending}
                  className="px-3 py-2 sm:py-1.5 rounded border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteBulkDispatch}
                  disabled={dispatchModal.sending}
                  className="px-3.5 py-2 sm:py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {dispatchModal.sending ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Confirm & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
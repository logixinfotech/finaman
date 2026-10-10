import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  CheckSquare,
  Square,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Inbox,
  Layers,
} from "lucide-react";
import { showToast } from "../../../../../components/Reusable/alert";
import {
  getCommunicationTemplates,
  getCallingQueue,
  getActiveVacanciesWithJD,
  sendCandidateMessage,
  sendBulkWhatsApp,
} from "../../../../../utils/communicationApi";
import { BaseButton, RefreshButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";
import TemplatePickerModal from "../components/TemplatePickerModal";
import { resolveCandidateStage } from "../CallingManagement/CallingManagement";
import { STAGES, initials } from "../../CandidateTracking/pipelineConstants";

const PLACEHOLDER_TOKENS = [
  { label: "Candidate Name", token: "{{candidate_name}}" },
  { label: "Job Title", token: "{{job_title}}" },
  { label: "Company Name", token: "{{company_name}}" },
  { label: "Recruiter Name", token: "{{recruiter_name}}" },
  { label: "Assessment Link", token: "{{assessment_link}}" },
  { label: "Interview Date", token: "{{interview_date}}" },
  { label: "Interview Time", token: "{{interview_time}}" },
  { label: "Venue", token: "{{venue}}" },
];

export default function WhatsAppMessageDesk() {
  const [candidates, setCandidates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Multi-select & filtering state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [candidateViewMode, setCandidateViewMode] = useState("flat"); // "flat" or "grouped"
  const [search, setSearch] = useState("");
  const [filterVacancy, setFilterVacancy] = useState("All");
  const [filterStage, setFilterStage] = useState("All");

  // Form state
  const [bodyText, setBodyText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, vRes] = await Promise.all([
        getCommunicationTemplates({ channel: "WhatsApp" }),
        getCallingQueue({ stage_no: "All" }),
        getActiveVacanciesWithJD(),
      ]);

      if (tRes?.data) setTemplates(tRes.data);
      if (cRes?.data) {
        setCandidates(cRes.data || []);
      }
      if (vRes?.data) setVacancies(vRes.data || []);
    } catch (err) {
      showToast({ icon: "error", title: "Error loading candidates and WhatsApp templates" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter candidate list
  const filteredCandidates = useMemo(() => {
    let list = Array.isArray(candidates) ? candidates : [];

    if (filterVacancy !== "All") {
      list = list.filter((c) => String(c.vacancy_id) === String(filterVacancy));
    }

    if (filterStage !== "All") {
      list = list.filter((c) => resolveCandidateStage(c) === Number(filterStage));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(q) ||
          (c.candidate_code || "").toLowerCase().includes(q) ||
          (c.mobile || "").includes(q) ||
          (c.current_status || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [candidates, filterVacancy, filterStage, search]);

  // Group candidates by recruitment stage
  const groupedCandidatesByStage = useMemo(() => {
    const stageMap = {};
    STAGES.forEach((s) => {
      stageMap[s.stage_no] = { stage: s, candidates: [] };
    });

    filteredCandidates.forEach((c) => {
      const stgNo = resolveCandidateStage(c);
      if (!stageMap[stgNo]) {
        stageMap[stgNo] = {
          stage: { stage_no: stgNo, title: `Stage ${stgNo}`, short: `Stage ${stgNo}` },
          candidates: [],
        };
      }
      stageMap[stgNo].candidates.push(c);
    });

    // Only return stages that have active candidates matching current filters
    return Object.values(stageMap).filter((g) => g.candidates.length > 0);
  }, [filteredCandidates]);

  // Handle Stage Group Selection
  const handleToggleStageGroup = (stageCandidates) => {
    const allInStageSelected = stageCandidates.every((c) =>
      selectedCandidateIds.has(c.candidate_id)
    );

    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      stageCandidates.forEach((c) => {
        if (allInStageSelected) {
          next.delete(c.candidate_id);
        } else {
          next.add(c.candidate_id);
        }
      });
      return next;
    });
  };

  // Handle Select All / Toggle
  const isAllSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedCandidateIds.has(c.candidate_id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCandidateIds(new Set());
    } else {
      const next = new Set(selectedCandidateIds);
      filteredCandidates.forEach((c) => next.add(c.candidate_id));
      setSelectedCandidateIds(next);
    }
  };

  const handleToggleCandidate = (cid) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  // Template Selection
  const handleApplyTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    if (tmpl) {
      setBodyText(tmpl.body_text || tmpl.template_body || "");
    }
  };

  const handleInsertToken = (token) => {
    setBodyText((prev) => `${prev} ${token}`);
  };

  const handleReset = () => {
    setSelectedCandidateIds(new Set());
    setBodyText("");
    setSelectedTemplate(null);
  };

  // Preview Candidate
  const previewCandidate = useMemo(() => {
    if (selectedCandidateIds.size > 0) {
      const firstId = Array.from(selectedCandidateIds)[0];
      return candidates.find((c) => c.candidate_id === firstId) || null;
    }
    return filteredCandidates[0] || null;
  }, [selectedCandidateIds, candidates, filteredCandidates]);

  const renderedPreview = useMemo(() => {
    const cName = previewCandidate?.full_name || "Candidate";
    const jTitle = previewCandidate?.job_role || previewCandidate?.job_title || "Job Position";
    const cCompany = "FINAMAN ERP";

    let res = bodyText || "Type your WhatsApp message or choose a template...";
    res = res
      .replace(/{{candidate_name}}/gi, cName)
      .replace(/{{job_title}}/gi, jTitle)
      .replace(/{{company_name}}/gi, cCompany)
      .replace(/{{recruiter_name}}/gi, "HR Team")
      .replace(/{{assessment_link}}/gi, "https://erp.finaman.com/candidate-assessment/token-sample")
      .replace(/{{assessment_url}}/gi, "https://erp.finaman.com/candidate-assessment/token-sample")
      .replace(/{{interview_date}}/gi, new Date(Date.now() + 86400000).toLocaleDateString("en-IN"))
      .replace(/{{interview_time}}/gi, "11:00 AM")
      .replace(/{{venue}}/gi, "Corporate Office, Floor 3");

    return res;
  }, [bodyText, previewCandidate]);

  const getCleanPhone = (cand = previewCandidate) => {
    let clean = String(cand?.mobile || "").replace(/\D/g, "");
    if (clean.length === 10) clean = "91" + clean;
    return clean;
  };

  const getWaLink = () => {
    const cleanNumber = getCleanPhone();
    if (!cleanNumber) return "";
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(renderedPreview || "")}`;
  };

  const handleCopy = () => {
    if (!renderedPreview) return;
    navigator.clipboard.writeText(renderedPreview);
    setCopied(true);
    showToast({ icon: "success", title: "Message copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Bulk / Single WhatsApp Dispatch Handler
  const handleSendWhatsApp = async () => {
    if (selectedCandidateIds.size === 0) {
      showToast({ icon: "warning", title: "Please select at least one candidate" });
      return;
    }

    if (!bodyText.trim()) {
      showToast({ icon: "warning", title: "Message text cannot be empty" });
      return;
    }

    setSending(true);
    try {
      const res = await sendBulkWhatsApp({
        candidate_ids: Array.from(selectedCandidateIds),
        template_id: selectedTemplate?.template_id || null,
        template_name: selectedTemplate?.template_name || "Custom WhatsApp Message",
        template_text: bodyText,
        custom_message: bodyText,
        remarks: `Dispatched WhatsApp to ${selectedCandidateIds.size} candidate(s)`,
      });

      if (res?.success) {
        showToast({
          icon: "success",
          title: res.message || `WhatsApp messages logged for ${selectedCandidateIds.size} candidates!`,
        });

        // If single candidate, open WhatsApp Web directly
        if (selectedCandidateIds.size === 1) {
          const waUrl = getWaLink();
          if (waUrl) window.open(waUrl, "_blank");
        }

        handleReset();
        loadData();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to log WhatsApp dispatch" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error dispatching WhatsApp messages" });
    } finally {
      setSending(false);
    }
  };

  const selectedCount = selectedCandidateIds.size;

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Candidate WhatsApp Message Desk</span>
              <span className="px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Bulk / Single Dispatch
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Personalized candidate WhatsApp messaging with dynamic tokens and multi-candidate selection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-7 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles size={13} className="text-emerald-600" />
            <span>Browse WhatsApp Templates</span>
          </button>
          <RefreshButton onClick={loadData} loading={loading} />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left Column: Candidate Selection Table (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Candidate Filter & Search Bar */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-600" />
                <span>Select Candidates</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                selectedCount > 0 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {selectedCount} Selected
              </span>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, code, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-3 text-[11px] bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <select
                value={filterVacancy}
                onChange={(e) => setFilterVacancy(e.target.value)}
                className="h-6 px-2 text-[10.5px] bg-white border border-slate-200 rounded outline-none font-medium"
              >
                <option value="All">Vacancy: All ({vacancies.length})</option>
                {vacancies.map((v) => (
                  <option key={v.vacancy_id} value={v.vacancy_id}>
                    {v.job_title || v.designation_name}
                  </option>
                ))}
              </select>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="h-6 px-2 text-[10.5px] bg-white border border-slate-200 rounded outline-none font-medium"
              >
                <option value="All">Stage: All (1-7)</option>
                {STAGES.map((s) => (
                  <option key={s.stage_no} value={s.stage_no}>
                    {s.stage_no}. {s.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select All & Group View Toggle Action Row */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 hover:text-emerald-700 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare size={14} className="text-emerald-600" />
              ) : (
                <Square size={14} className="text-slate-400" />
              )}
              <span>Select All in list ({filteredCandidates.length})</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Group Toggle Button */}
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setCandidateViewMode("flat")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer ${
                    candidateViewMode === "flat"
                      ? "bg-emerald-700 text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Flat Candidate List"
                >
                  Flat
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateViewMode("grouped")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer ${
                    candidateViewMode === "grouped"
                      ? "bg-emerald-700 text-white font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Group Candidates by Recruitment Stage"
                >
                  Grouped
                </button>
              </div>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds(new Set())}
                  className="text-emerald-600 hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Candidates Scrollable List (Flat or Grouped View) */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
            {filteredCandidates.length > 0 ? (
              candidateViewMode === "grouped" ? (
                groupedCandidatesByStage.map(({ stage, candidates: stageCands }) => {
                  const allStageSelected = stageCands.every((c) =>
                    selectedCandidateIds.has(c.candidate_id)
                  );
                  const someStageSelected =
                    !allStageSelected &&
                    stageCands.some((c) => selectedCandidateIds.has(c.candidate_id));

                  return (
                    <div key={stage.stage_no} className="border-b border-slate-200 last:border-b-0">
                      {/* Stage Group Header */}
                      <div className="bg-slate-100/90 px-3 py-1.5 flex items-center justify-between border-y border-slate-200 text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>
                            Stage {stage.stage_no}: {stage.short || stage.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-slate-200">
                            {stageCands.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStageGroup(stageCands)}
                          className="text-[10.5px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {allStageSelected ? (
                            <CheckSquare size={13} className="text-emerald-600" />
                          ) : (
                            <Square size={13} className="text-slate-400" />
                          )}
                          <span>{allStageSelected ? "Deselect Stage" : "Select Stage"}</span>
                        </button>
                      </div>

                      {/* Candidate rows in this stage */}
                      <div className="divide-y divide-slate-100">
                        {stageCands.map((c) => {
                          const isSelected = selectedCandidateIds.has(c.candidate_id);

                          return (
                            <div
                              key={c.candidate_id}
                              onClick={() => handleToggleCandidate(c.candidate_id)}
                              className={`p-2.5 flex items-center gap-2.5 hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                                isSelected ? "bg-emerald-50/70" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                              />

                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-slate-100 text-slate-700">
                                {initials(c.full_name)}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-xs text-slate-900 truncate">
                                    {c.full_name || "—"}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {c.candidate_code || "—"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[10.5px] text-slate-500 truncate">
                                  <span className="font-mono text-slate-600 truncate">
                                    {c.mobile || "No Mobile"}
                                  </span>
                                  <span>·</span>
                                  <span className="truncate">
                                    {c.job_role || c.job_title || "General"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedCandidateIds.has(c.candidate_id);
                  const stgNo = resolveCandidateStage(c);

                  return (
                    <div
                      key={c.candidate_id}
                      onClick={() => handleToggleCandidate(c.candidate_id)}
                      className={`p-2.5 flex items-center gap-2.5 hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                        isSelected ? "bg-emerald-50/70" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                      />

                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-slate-100 text-slate-700"
                      >
                        {initials(c.full_name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {c.full_name || "—"}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Stage {stgNo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 truncate">
                          <span className="font-mono text-slate-600 truncate">{c.mobile || "No Mobile"}</span>
                          <span>·</span>
                          <span className="truncate">{c.job_role || c.job_title || "General"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs italic">
                <Inbox size={32} className="mx-auto mb-2 opacity-30" />
                <p>No candidates found matching filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: WhatsApp Composer & Live Chat Simulation Preview (Col 7) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 gap-3">
          {/* Composer Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3.5 flex flex-col min-h-0 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Smartphone size={14} className="text-emerald-600" />
                <span>WhatsApp Message Content</span>
              </h3>
              {selectedTemplate && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[200px]">
                  Template: {selectedTemplate.template_name}
                </span>
              )}
            </div>

            {/* Token Chips Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Insert Placeholder Tokens
                </label>
                <span className="text-[10px] text-slate-400">Click to insert token into message</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDER_TOKENS.map(({ label, token }) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => handleInsertToken(token)}
                    className="px-2 py-0.5 text-[10.5px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded transition-all cursor-pointer font-mono"
                  >
                    + {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Textarea */}
            <div className="flex-1 min-h-[140px] flex flex-col">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                WhatsApp Body Text <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={7}
                placeholder="Type your WhatsApp message here, or choose a pre-approved template..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full flex-1 p-3 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed text-slate-800"
              />
            </div>
          </div>

          {/* WhatsApp Live Chat Simulation Preview Card */}
          <div className="bg-[#efeae2] border border-slate-300 rounded-xl shadow-xs overflow-hidden flex flex-col max-h-[230px]">
            {/* WhatsApp Chat Header */}
            <div className="bg-[#075e54] text-white px-3.5 py-2 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                  {initials(previewCandidate?.full_name || "Candidate")}
                </span>
                <div>
                  <h4 className="text-xs font-bold leading-tight">
                    {previewCandidate?.full_name || "Candidate"}
                  </h4>
                  <p className="text-[9.5px] text-emerald-200">
                    {previewCandidate?.mobile ? `+91 ${previewCandidate.mobile}` : "online"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-0.5 text-[10.5px] bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy Message Text"
                >
                  {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Chat Bubble Canvas */}
            <div className="p-3.5 flex-1 overflow-y-auto flex flex-col justify-end">
              <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none p-2.5 shadow-sm text-xs text-slate-800 leading-relaxed whitespace-pre-wrap self-start">
                {renderedPreview}
                <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="w-full border-t bg-white px-4 py-2.5 mt-auto shrink-0 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-slate-900">
            {selectedCount} {selectedCount === 1 ? "candidate" : "candidates"} selected
          </span>
          <span>out of {filteredCandidates.length} in queue</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount === 1 && getWaLink() && (
            <a
              href={getWaLink()}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Open in WhatsApp Web</span>
            </a>
          )}

          <BaseButton
            onClick={handleSendWhatsApp}
            label={sending ? "Dispatching..." : `Send / Log WhatsApp (${selectedCount})`}
            icon={<Send size={15} />}
            tone="emerald"
            disabled={selectedCount === 0 || sending || !bodyText.trim()}
            title="Dispatch and log WhatsApp message for all selected candidates"
          />

          <ResetButton onClick={handleReset} label="Clear Form" />
        </div>
      </div>

      {/* Template Picker Modal */}
      {isTemplateModalOpen && (
        <TemplatePickerModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          channel="WhatsApp"
          templates={templates}
          onSelectTemplate={handleApplyTemplate}
        />
      )}
    </div>
  );
}

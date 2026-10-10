import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Mail,
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
  AlertCircle,
  Inbox,
  Briefcase,
  Layers,
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Clipboard,
  Award,
  Clock,
  HelpCircle,
  X,
} from "lucide-react";
import { showToast } from "../../../../../components/Reusable/alert";
import { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import {
  getCommunicationTemplates,
  getCallingQueue,
  sendCandidateEmail,
  getActiveVacanciesWithJD,
} from "../../../../../utils/communicationApi";
import { getActiveAssessments } from "../../../../../utils/recruitmentApi";
import { BaseButton, RefreshButton, ResetButton } from "../../../../../components/Reusable/button/ActionButon";
import TemplatePickerModal from "../components/TemplatePickerModal";
import { resolveCandidateStage } from "../CallingManagement/CallingManagement";
import { STAGES, initials } from "../../CandidateTracking/pipelineConstants";

const PLACEHOLDER_TOKENS = [
  { label: "Candidate Name", token: "{{candidate_name}}" },
  { label: "Job Title", token: "{{job_title}}" },
  { label: "Company Name", token: "{{company_name}}" },
  { label: "Recruiter Name", token: "{{recruiter_name}}" },
  { label: "Assessment Link(s)", token: "{{assessment_link}}" },
  { label: "Interview Date", token: "{{interview_date}}" },
  { label: "Interview Time", token: "{{interview_time}}" },
  { label: "Venue", token: "{{venue}}" },
];

const DEFAULT_ASSESSMENT_EMAIL_SUBJECT = "Online Assessment Invitation — {{job_title}} | {{company_name}}";
const DEFAULT_ASSESSMENT_EMAIL_BODY = `Dear {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}.

As the next step in our recruitment process, please complete the required online skill assessment(s) using the official access link(s) provided below:

{{assessment_link}}

General Assessment Guidelines:
• Please ensure a stable internet connection and a quiet environment.
• Complete all questions and click final submit before the timer expires.
• Once started, do not refresh or navigate away from the test window.

Should you face any technical difficulties, please reply directly to this email.

Best of luck!

Warm regards,
{{recruiter_name}}
Talent Acquisition Team
{{company_name}}`;

export default function EmailMessageDesk({ initialData, onClearInitialData }) {
  const [candidates, setCandidates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [assessmentMasterList, setAssessmentMasterList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Multi-select & filtering state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [candidateViewMode, setCandidateViewMode] = useState("flat"); // "flat" or "grouped"
  const [search, setSearch] = useState("");
  const [filterVacancy, setFilterVacancy] = useState("All");
  const [filterStage, setFilterStage] = useState("All");

  // Form state
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Assessment Attachment state
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [isAssessmentPickerOpen, setIsAssessmentPickerOpen] = useState(false);
  const [assessmentSearch, setAssessmentSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, vRes, aRes] = await Promise.all([
        getCommunicationTemplates({ channel: "Email" }),
        getCallingQueue({ stage_no: "All" }),
        getActiveVacanciesWithJD(),
        getActiveAssessments(),
      ]);

      if (tRes?.data) setTemplates(tRes.data);
      if (cRes?.data) setCandidates(cRes.data || []);
      if (vRes?.data) setVacancies(vRes.data || []);
      if (aRes?.data) setAssessmentMasterList(aRes.data || []);
    } catch (err) {
      showToast({ icon: "error", title: "Error loading candidates, templates, and assessments" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle incoming initialData (e.g. Navigated from Calling Queue)
  useEffect(() => {
    if (!initialData?.candidate) return;

    const cand = initialData.candidate;
    if (cand.candidate_id) {
      setSelectedCandidateIds(new Set([cand.candidate_id]));
    }

    if (cand.vacancy_id) {
      setFilterVacancy(String(cand.vacancy_id));
    }

    // If navigated specifically for assessment sending
    if (
      initialData.templateCode?.includes("ASSESSMENT") ||
      cand.current_status?.includes("Assessment") ||
      cand.current_status?.includes("Screening Cleared")
    ) {
      setSubject((prev) => prev || DEFAULT_ASSESSMENT_EMAIL_SUBJECT);
      setBodyText((prev) => prev || DEFAULT_ASSESSMENT_EMAIL_BODY);

      // If assessment master is loaded and none selected, auto-select first available
      if (assessmentMasterList.length > 0 && selectedAssessments.length === 0) {
        setSelectedAssessments([assessmentMasterList[0]]);
      }
    }
  }, [initialData, assessmentMasterList]);

  // Format generated public assessment links
  const formattedAssessmentLinks = useMemo(() => {
    if (!selectedAssessments || selectedAssessments.length === 0) {
      return "";
    }

    const origin = window.location.origin;
    if (selectedAssessments.length === 1) {
      const a = selectedAssessments[0];
      const dur = a.estimated_duration_minutes ? ` (Duration: ${a.estimated_duration_minutes} Mins)` : "";
      const qs = a.total_questions ? ` · ${a.total_questions} Questions` : "";
      const marks = a.total_marks ? ` · ${a.total_marks} Marks` : "";
      const url = `${origin}/assessment?aid=${a.assessment_id}`;
      return `Assessment: ${a.assessment_name}${dur}${qs}${marks}\nAssessment Link: ${url}`;
    }

    return selectedAssessments
      .map((a, idx) => {
        const dur = a.estimated_duration_minutes ? ` (Duration: ${a.estimated_duration_minutes} Mins)` : "";
        const qs = a.total_questions ? ` · ${a.total_questions} Questions` : "";
        const marks = a.total_marks ? ` · ${a.total_marks} Marks` : "";
        const url = `${origin}/assessment?aid=${a.assessment_id}`;
        return `${idx + 1}. ${a.assessment_name}${dur}${qs}${marks}\n   Link: ${url}`;
      })
      .join("\n\n");
  }, [selectedAssessments]);

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
          (c.email || "").toLowerCase().includes(q) ||
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

  // Assessment Attachment Handlers
  const handleToggleAssessment = (asm) => {
    setSelectedAssessments((prev) => {
      const exists = prev.some((a) => a.assessment_id === asm.assessment_id);
      if (exists) {
        return prev.filter((a) => a.assessment_id !== asm.assessment_id);
      }
      return [...prev, asm];
    });
  };

  const handleRemoveAssessment = (asmId) => {
    setSelectedAssessments((prev) => prev.filter((a) => a.assessment_id !== asmId));
  };

  const handleInsertAssessmentLinksToken = () => {
    if (bodyText.includes("{{assessment_link}}")) {
      showToast({ icon: "info", title: "{{assessment_link}} token is already present in email body" });
    } else {
      setBodyText((prev) => `${prev}\n\nAssessment Link(s):\n{{assessment_link}}`);
      showToast({ icon: "success", title: "Inserted {{assessment_link}} token into message body" });
    }
  };

  // Template Selection
  const handleApplyTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    if (tmpl) {
      setSubject(tmpl.subject || `Update regarding your application for {{job_title}}`);
      setBodyText(tmpl.body_text || tmpl.template_body || "");
    }
  };

  const handleInsertToken = (token) => {
    setBodyText((prev) => `${prev} ${token}`);
  };

  const handleReset = () => {
    setSelectedCandidateIds(new Set());
    setSelectedAssessments([]);
    setSubject("");
    setBodyText("");
    setSelectedTemplate(null);
    if (onClearInitialData) onClearInitialData();
  };

  // Preview Resolution for first selected candidate (or generic)
  const previewCandidate = useMemo(() => {
    if (selectedCandidateIds.size > 0) {
      const firstId = Array.from(selectedCandidateIds)[0];
      return candidates.find((c) => c.candidate_id === firstId) || null;
    }
    return filteredCandidates[0] || null;
  }, [selectedCandidateIds, candidates, filteredCandidates]);

  const renderedPreview = useMemo(() => {
    const cName = previewCandidate?.full_name || "Alex Johnson";
    const jTitle = previewCandidate?.job_role || previewCandidate?.job_title || "Software Engineer";
    const cCompany = "Finaman ERP";

    const resolvedAssessmentText =
      formattedAssessmentLinks ||
      `Assessment: Technical & Analytical Assessment (Duration: 30 Mins)\nLink: ${window.location.origin}/assessment?aid=sample-assessment-id`;

    let res = bodyText || "Type your email message or select a template above...";
    res = res
      .replace(/{{candidate_name}}/gi, cName)
      .replace(/{{job_title}}/gi, jTitle)
      .replace(/{{company_name}}/gi, cCompany)
      .replace(/{{recruiter_name}}/gi, "HR Talent Team")
      .replace(/{{assessment_link}}/gi, resolvedAssessmentText)
      .replace(/{{assessment_url}}/gi, resolvedAssessmentText)
      .replace(/{{interview_date}}/gi, new Date(Date.now() + 86400000).toLocaleDateString("en-IN"))
      .replace(/{{interview_time}}/gi, "11:00 AM")
      .replace(/{{venue}}/gi, "Corporate Headquarters, Floor 3");

    return res;
  }, [bodyText, previewCandidate, formattedAssessmentLinks]);

  const renderedSubject = useMemo(() => {
    const cName = previewCandidate?.full_name || "Alex Johnson";
    const jTitle = previewCandidate?.job_role || previewCandidate?.job_title || "Software Engineer";
    let res = subject || "Update regarding your application";
    res = res
      .replace(/{{candidate_name}}/gi, cName)
      .replace(/{{job_title}}/gi, jTitle)
      .replace(/{{company_name}}/gi, "Finaman ERP");
    return res;
  }, [subject, previewCandidate]);

  // Send Email Handler
  const handleSendEmail = async () => {
    if (selectedCandidateIds.size === 0) {
      showToast({ icon: "warning", title: "Please select at least one candidate" });
      return;
    }

    if (!subject.trim()) {
      showToast({ icon: "warning", title: "Email subject is mandatory" });
      return;
    }

    if (!bodyText.trim()) {
      showToast({ icon: "warning", title: "Email body text cannot be empty" });
      return;
    }

    let finalBody = bodyText;
    // If assessments are attached but placeholder is missing in custom text, append it
    if (selectedAssessments.length > 0 && !finalBody.includes("{{assessment_link}}") && !finalBody.includes("{{assessment_url}}")) {
      finalBody = `${finalBody}\n\nAssessment Link(s):\n{{assessment_link}}`;
    }

    setSending(true);
    try {
      const res = await sendCandidateEmail({
        candidate_ids: Array.from(selectedCandidateIds),
        subject: subject.trim(),
        template_id: selectedTemplate?.template_id || null,
        template_name: selectedTemplate?.template_name || (selectedAssessments.length > 0 ? "Assessment Invite" : "Custom Email"),
        custom_message: finalBody,
        variables: {
          assessment_link: formattedAssessmentLinks,
        },
        remarks: selectedAssessments.length > 0
          ? `Dispatched assessment (${selectedAssessments.map((a) => a.assessment_name).join(", ")}) via email`
          : `Dispatched email: ${subject.trim()}`,
      });

      if (res?.success) {
        showToast({
          icon: "success",
          title: res.message || `Emails sent to ${res.sent_count || selectedCandidateIds.size} candidates!`,
        });
        handleReset();
        loadData();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to send email" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error sending candidate emails" });
    } finally {
      setSending(false);
    }
  };

  const selectedCount = selectedCandidateIds.size;

  // Filtered assessment list for modal picker
  const filteredAssessmentMaster = useMemo(() => {
    let list = assessmentMasterList || [];
    if (assessmentSearch.trim()) {
      const q = assessmentSearch.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.assessment_name || "").toLowerCase().includes(q) ||
          (a.assessment_code || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [assessmentMasterList, assessmentSearch]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-50 overflow-hidden">
      {/* Top Header & Overview Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Mail size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Candidate Email & Assessment Dispatch Desk</span>
              <span className="px-2 py-0.2 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Bulk / Single Dispatch
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Compose, attach master assessments, bind templates, and send official emails with public test links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-7 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles size={13} className="text-blue-600" />
            <span>Browse Templates</span>
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
                <Users size={14} className="text-blue-600" />
                <span>Select Candidates</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                  selectedCount > 0 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {selectedCount} Selected
              </span>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, code, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-3 text-[11px] bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500 font-medium"
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
              className="flex items-center gap-1.5 hover:text-blue-700 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare size={14} className="text-blue-600" />
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
                      ? "bg-blue-700 text-white font-semibold"
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
                      ? "bg-blue-700 text-white font-semibold"
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
                  className="text-blue-600 hover:underline font-semibold"
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

                  return (
                    <div key={stage.stage_no} className="border-b border-slate-200 last:border-b-0">
                      {/* Stage Group Header */}
                      <div className="bg-slate-100/90 px-3 py-1.5 flex items-center justify-between border-y border-slate-200 text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <span>
                            Stage {stage.stage_no}: {stage.short || stage.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-blue-800 border border-slate-200">
                            {stageCands.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleStageGroup(stageCands)}
                          className="text-[10.5px] font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {allStageSelected ? (
                            <CheckSquare size={13} className="text-blue-600" />
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
                              className={`p-2.5 flex items-center gap-2.5 hover:bg-blue-50/40 cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50/70" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
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
                                    {c.email || "No Email"}
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
                      className={`p-2.5 flex items-center gap-2.5 hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
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
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            Stage {stgNo}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 truncate">
                          <span className="font-mono text-slate-600 truncate">{c.email || "No Email"}</span>
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

        {/* Right Column: Email Composer & Assessment Attachment (Col 7) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 gap-3">
          {/* Composer Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3.5 flex flex-col min-h-0 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText size={14} className="text-blue-600" />
                <span>Email Message Composition</span>
              </h3>
              {selectedTemplate && (
                <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-[200px]">
                  Template: {selectedTemplate.template_name}
                </span>
              )}
            </div>

            {/* Assessment Attachment Section */}
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Award size={14} className="text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">
                    Attached Assessment(s) from Master
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-800">
                    {selectedAssessments.length} Attached
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAssessmentPickerOpen(true)}
                    className="h-6 px-2.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Attach Assessment(s)</span>
                  </button>

                  {selectedAssessments.length > 0 && (
                    <button
                      type="button"
                      onClick={handleInsertAssessmentLinksToken}
                      className="h-6 px-2 text-[10.5px] font-medium text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Insert {{assessment_link}} placeholder into body"
                    >
                      <span>Insert Token</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Assessment Pills */}
              {selectedAssessments.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedAssessments.map((a) => (
                    <div
                      key={a.assessment_id}
                      className="bg-white border border-indigo-300 rounded-md px-2.5 py-1 text-[11px] flex items-center gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-indigo-900 truncate max-w-[220px]">
                          {a.assessment_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({a.assessment_code || "ASM"})
                        </span>
                        {a.estimated_duration_minutes && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1 rounded">
                            {a.estimated_duration_minutes}m
                          </span>
                        )}
                        {a.total_questions && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1 rounded">
                            {a.total_questions} Qs
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAssessment(a.assessment_id)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                        title="Remove assessment"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-500 italic">
                  No assessments attached yet. Click <strong>Attach Assessment(s)</strong> to pick one or more tests from Assessment Master.
                </p>
              )}
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Online Assessment Invitation — {{job_title}} | {{company_name}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-8 px-3 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-semibold text-slate-800"
              />
            </div>

            {/* Token Chips Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Insert Placeholder Tokens
                </label>
                <span className="text-[10px] text-slate-400">Click to insert token into email</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDER_TOKENS.map(({ label, token }) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => handleInsertToken(token)}
                    className="px-2 py-0.5 text-[10.5px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded transition-all cursor-pointer font-mono"
                  >
                    + {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Textarea */}
            <div className="flex-1 min-h-[140px] flex flex-col">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Email Message Content <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={7}
                placeholder="Type your official candidate email here, or choose a pre-approved template..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full flex-1 p-3 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none font-sans leading-relaxed text-slate-800"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3.5 flex flex-col max-h-[220px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                <span>Live Email Preview ({previewCandidate?.full_name || "Alex Johnson"})</span>
              </span>
              <span className="text-[10.5px] text-slate-400">
                To: {selectedCount > 0 ? `${selectedCount} Recipients` : "No recipient selected"}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-lg border border-slate-200 p-3 overflow-y-auto font-sans text-xs text-slate-800 space-y-2 flex-1">
              <div className="border-b border-slate-200 pb-1 text-[11px]">
                <span className="font-bold text-slate-600">Subject: </span>
                <span className="font-semibold text-slate-900">{renderedSubject}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {renderedPreview}
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
          {selectedAssessments.length > 0 && (
            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedAssessments.length} Assessment(s) Attached
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BaseButton
            onClick={handleSendEmail}
            label={sending ? "Dispatching..." : `Send Email (${selectedCount})`}
            icon={<Send size={15} />}
            tone="blue"
            disabled={selectedCount === 0 || sending || !subject.trim() || !bodyText.trim()}
            title="Dispatch official email to selected candidates"
          />
          <ResetButton onClick={handleReset} label="Clear Form" />
        </div>
      </div>

      {/* Template Picker Modal */}
      {isTemplateModalOpen && (
        <TemplatePickerModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          channel="Email"
          templates={templates}
          onSelectTemplate={handleApplyTemplate}
        />
      )}

      {/* Assessment Master Multi-Select Picker Modal */}
      {isAssessmentPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Select Assessment(s) from Master
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose one or multiple active assessments to embed public registration/test links
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assessment name or code..."
                  value={assessmentSearch}
                  onChange={(e) => setAssessmentSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Assessment List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 divide-y divide-slate-100">
              {filteredAssessmentMaster.length > 0 ? (
                filteredAssessmentMaster.map((asm) => {
                  const isChecked = selectedAssessments.some(
                    (a) => a.assessment_id === asm.assessment_id
                  );

                  return (
                    <div
                      key={asm.assessment_id}
                      onClick={() => handleToggleAssessment(asm)}
                      className={`p-3 rounded-lg flex items-center justify-between gap-3 hover:bg-indigo-50/50 cursor-pointer transition-colors ${
                        isChecked ? "bg-indigo-50/80 border border-indigo-200" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {asm.assessment_name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-slate-100 text-slate-700">
                              {asm.assessment_code || "ASM"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            {asm.estimated_duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" />
                                {asm.estimated_duration_minutes} Mins
                              </span>
                            )}
                            {asm.total_questions && (
                              <span className="flex items-center gap-1">
                                <HelpCircle size={11} className="text-slate-400" />
                                {asm.total_questions} Questions
                              </span>
                            )}
                            {asm.total_marks && (
                              <span>· Total Marks: {asm.total_marks}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          isChecked
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isChecked ? "Attached" : "Attach"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No active assessments found in Assessment Master.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                {selectedAssessments.length} assessment(s) attached
              </span>
              <button
                type="button"
                onClick={() => setIsAssessmentPickerOpen(false)}
                className="h-8 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Done Attaching
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

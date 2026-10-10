import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import Table from "../../../../components/Reusable/table/Table";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
import {
  SaveButton,
  DiscardButton,
  ResetButton,
} from "../../../../components/Reusable/button/ActionButon";
import {
  Award,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Layers,
  Sparkles,
  Check,
  UserCheck,
  User,
  GraduationCap,
  Briefcase,
  Building2,
  Code,
  BarChart3,
  FileText,
} from "lucide-react";
import { api } from "../../../../utils/api";
import { showToast, alertSuccess, alertWarning, alertError } from "../../../../components/Reusable/alert";
import { evaluateGeneralAssessment } from "./logixGeneralAssessmentRules";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const INITIAL_ANSWERS = {
  dob: "",
  open_to_relocate: "Yes",
  laptop_available: "Yes",
  highest_qualification: "Graduate",
  tenth_percentage: "75",
  twelfth_percentage: "75",
  graduation_percentage: "70",
  pg_percentage: "",
  college_name: "Recognized University",
  current_ctc: "300000",
  expected_ctc: "360000",
  total_experience_years: "2",
  relevant_work_experience: "Relevant",
  notice_period_days: "30",
  current_company: "",
  current_company_industry: "Relevant",
  current_designation: "",
  current_department: "",
  previous_company_products: "Relevant",
  agree_for_bond: "Yes",
  willing_to_travel: "Yes",
  erp_knowledge: "Basic ERP",
  languages_known: "English, Hindi",
  email_chat_handling: "Professional",
  ms_office_knowledge: "Intermediate",
  programming_languages: "",
  monthly_sales_target: "",
};

export default function GeneralAssessmentPage({ tab }) {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Meta Dropdowns
  const [candidatesList, setCandidatesList] = useState([]);
  const [vacanciesList, setVacanciesList] = useState([]);

  // Active Assessment Form Data
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");
  const [vacancy, setVacancy] = useState(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);

  const [formAnswers, setFormAnswers] = useState(INITIAL_ANSWERS);
  const [evaluation, setEvaluation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusOverride, setStatusOverride] = useState("");

  const tenantDb = useMemo(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("user") || "{}")?.database ||
        localStorage.getItem("selectedCompany") ||
        ""
      );
    } catch (_) {
      return "";
    }
  }, []);

  const publicUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (tenantDb) params.set("db", tenantDb);
    if (selectedVacancyId) params.set("vid", selectedVacancyId);
    const qs = params.toString();
    return `${window.location.origin}/candidate-assessment/general${qs ? `?${qs}` : ""}`;
  }, [tenantDb, selectedVacancyId]);

  const rights = useMemo(
    () => ({
      is_add: 1,
      is_edit: 1,
      is_delete: 1,
      is_view: 1,
      is_print: 1,
      is_export: 1,
      ...tab?.rights,
    }),
    [tab]
  );

  // Load Assessments List & Meta
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/recruitment/general-assessment/list");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("GeneralAssessmentPage load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/api/recruitment/general-assessment/meta");
      if (res.data?.success) {
        let vacancies = res.data?.data?.vacancies || [];
        const candidates = res.data?.data?.candidates || [];

        if (!vacancies.length) {
          try {
            const vRes = await api.get("/api/recruitment/vacancies");
            if (vRes.data?.success) {
              vacancies = vRes.data.data || [];
            }
          } catch (_) { }
        }

        setVacanciesList(vacancies);
        setCandidatesList(candidates);

        if (vacancies.length > 0 && !selectedVacancyId) {
          handleSelectVacancy(vacancies[0].vacancy_id);
        }
      }
    } catch (e) {
      console.error("loadMeta error:", e);
    }
  }, []);

  useEffect(() => {
    loadList();
    loadMeta();
  }, [loadList, loadMeta]);

  // When vacancy changes, fetch full JD criteria for scoring rules
  const handleSelectVacancy = async (vid) => {
    setSelectedVacancyId(vid);
    if (!vid) {
      setVacancy(null);
      return;
    }
    try {
      const res = await api.get(`/api/recruitment/general-assessment/vacancy-criteria/${vid}`);
      if (res.data?.success) {
        setVacancy(res.data.data);
      }
    } catch (e) {
      console.error("handleSelectVacancy error:", e);
    }
  };

  // When candidate changes, auto-fill standard candidate profile fields
  const handleSelectCandidate = async (cid) => {
    setSelectedCandidateId(cid);
    if (!cid) {
      setCandidate(null);
      return;
    }
    try {
      const res = await api.get(`/api/recruitment/general-assessment/candidate-data/${cid}`);
      if (res.data?.success) {
        const c = res.data.data;
        setCandidate(c);
        setFormAnswers((prev) => ({
          ...prev,
          dob: c.dob ? String(c.dob).split("T")[0] : prev.dob,
          highest_qualification: c.highest_qualification || prev.highest_qualification,
          total_experience_years: c.total_experience_years
            ? String(c.total_experience_years)
            : prev.total_experience_years,
          current_ctc: c.current_ctc ? String(c.current_ctc) : prev.current_ctc,
          expected_ctc: c.expected_ctc ? String(c.expected_ctc) : prev.expected_ctc,
          notice_period_days: c.notice_period_days ? String(c.notice_period_days) : prev.notice_period_days,
          current_company: c.current_company || prev.current_company,
          current_designation: c.current_designation || prev.current_designation,
        }));

        if (c.vacancy_id && (!selectedVacancyId || selectedVacancyId !== c.vacancy_id)) {
          handleSelectVacancy(c.vacancy_id);
        }
      }
    } catch (e) {
      console.error("handleSelectCandidate error:", e);
    }
  };

  // Live real-time scoring evaluation whenever formAnswers or vacancy changes
  useEffect(() => {
    const result = evaluateGeneralAssessment(formAnswers, vacancy || {});
    setEvaluation(result);
    if (!statusOverride) {
      setStatusOverride(result.evaluation_status);
    }
  }, [formAnswers, vacancy, statusOverride]);

  const handleInputChange = (field, value) => {
    setFormAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset Entry Form
  const handleResetForm = () => {
    setFormAnswers(INITIAL_ANSWERS);
    setActiveAssessmentId(null);
    setRemarks("");
    setStatusOverride("");
    if (vacanciesList.length > 0) {
      handleSelectVacancy(vacanciesList[0].vacancy_id);
    }
    showToast({ icon: "success", title: "Form reset to defaults" });
  };

  // Copy public candidate link
  const handleCopyPublicLink = (overrideVid) => {
    const targetVid = overrideVid || selectedVacancyId;
    if (!targetVid) {
      showToast({ icon: "warning", title: "Please select a Vacancy / Job Description first to generate the link!" });
      return;
    }
    const params = new URLSearchParams();
    if (tenantDb) params.set("db", tenantDb);
    params.set("vid", targetVid);
    const qs = params.toString();
    const url = `${window.location.origin}/candidate-assessment/general${qs ? `?${qs}` : ""}`;

    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast({ icon: "success", title: "Public assessment link for selected JD copied to clipboard!" });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Load single assessment to view in Entry mode
  const handleViewAssessment = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/recruitment/general-assessment/${id}`);
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setActiveAssessmentId(data.candidate_assessment_id);
        setCandidate({
          candidate_id: data.candidate_id,
          candidate_code: data.candidate_code,
          candidate_name: data.candidate_name,
          mobile: data.candidate_mobile,
          email: data.candidate_email,
        });
        setSelectedCandidateId(data.candidate_id || "");

        setVacancy({
          vacancy_id: data.vacancy_id,
          vacancy_no: data.vacancy_no,
          job_role: data.job_role,
          department_name: data.department_name,
        });
        setSelectedVacancyId(data.vacancy_id || "");

        setRemarks(data.evaluation_remarks || "");
        setStatusOverride(data.evaluation_status || "");

        if (data.answers && Array.isArray(data.answers)) {
          setEvaluation({
            applicable_max_marks: data.applicable_max_marks,
            obtained_marks: data.obtained_marks,
            percentage: data.percentage,
            evaluation_status: data.evaluation_status,
            answers: data.answers,
          });
        }
        setActiveHeaderTab("entry");
      }
    } catch (err) {
      console.error("handleViewAssessment error:", err);
      showToast({ icon: "error", title: "Failed to load assessment details" });
    } finally {
      setLoading(false);
    }
  };

  // Save / Submit Assessment
  const handleSaveAssessment = async () => {
    if (!candidate?.candidate_id && !selectedCandidateId) {
      alertWarning("Candidate Required", "Please select a candidate before saving.");
      return;
    }
    if (!vacancy?.vacancy_id && !selectedVacancyId) {
      alertWarning("Vacancy Required", "Please select a vacancy for this assessment.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/api/recruitment/general-assessment/save", {
        candidate_id: candidate?.candidate_id || selectedCandidateId,
        vacancy_id: vacancy?.vacancy_id || selectedVacancyId,
        pipeline_id: candidate?.pipeline_id || null,
        candidate_data: formAnswers,
        vacancy_criteria: vacancy,
        remarks: remarks,
        evaluation_status_override: statusOverride,
      });

      if (res.data?.success) {
        alertSuccess("Assessment Saved", "Candidate General Assessment has been successfully recorded!");
        loadList();
        setActiveHeaderTab("search");
      } else {
        alertError("Save Failed", res.data?.message || "Failed to save assessment");
      }
    } catch (err) {
      console.error("Save assessment error:", err);
      alertError("Error", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Columns for Search Tab
  const columns = useMemo(
    () => [
      {
        key: "candidate_code",
        label: "Candidate Code",
        width: 130,
        render: (row) => (
          <span className="font-semibold text-blue-700 hover:underline cursor-pointer truncate">
            {row?.candidate_code || "—"}
          </span>
        ),
      },
      {
        key: "candidate_name",
        label: "Candidate Name",
        width: 180,
        render: (row) => (
          <span className="font-medium text-slate-800 truncate" title={row?.candidate_name || ""}>
            {row?.candidate_name || "Applicant"}
          </span>
        ),
      },
      {
        key: "candidate_mobile",
        label: "Mobile Number",
        width: 130,
        render: (row) => (
          <span className="text-slate-600 font-mono text-[11.5px] truncate">
            {row?.candidate_mobile || "—"}
          </span>
        ),
      },
      {
        key: "vacancy_no",
        label: "Vacancy No",
        width: 130,
        render: (row) => (
          <span className="font-medium text-slate-700 truncate">{row?.vacancy_no || "—"}</span>
        ),
      },
      {
        key: "job_role",
        label: "Position / Role",
        width: 170,
        render: (row) => (
          <span className="text-slate-800 truncate" title={row?.job_role || ""}>
            {row?.job_role || "—"}
          </span>
        ),
      },
      {
        key: "department_name",
        label: "Department",
        width: 140,
        render: (row) => (
          <span className="text-slate-600 truncate">{row?.department_name || "—"}</span>
        ),
      },
      {
        key: "obtained_marks",
        label: "Score / Max",
        width: 110,
        align: "center",
        render: (row) => (
          <span className="font-bold text-slate-800 text-xs">
            {row?.obtained_marks ?? 0}{" "}
            <span className="text-slate-400 font-normal">/ {row?.applicable_max_marks ?? 0}</span>
          </span>
        ),
      },
      {
        key: "percentage",
        label: "Score %",
        width: 90,
        align: "center",
        render: (row) => {
          const pct = parseFloat(row?.percentage) || 0;
          const isPass = pct >= 70;
          const isHold = pct >= 50 && pct < 70;
          return (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-black leading-4 ${isPass
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : isHold
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
            >
              {pct}%
            </span>
          );
        },
      },
      {
        key: "evaluation_status",
        label: "Result Status",
        width: 130,
        align: "center",
        render: (row) => {
          const status = row?.evaluation_status || "Completed";
          const isPass = status === "Shortlisted";
          const isHold = status === "Hold";
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold leading-4 ${isPass
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isHold
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
            >
              {isPass && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {isHold && <AlertCircle className="w-3 h-3 text-amber-600" />}
              {!isPass && !isHold && <XCircle className="w-3 h-3 text-rose-600" />}
              {status}
            </span>
          );
        },
      },
      {
        key: "evaluated_by_name",
        label: "Evaluated By",
        width: 130,
        render: (row) => (
          <span className="text-slate-700 truncate" title={row?.evaluated_by_name || ""}>
            {row?.evaluated_by_name || "System"}
          </span>
        ),
      },
      {
        key: "created_at",
        label: "Date",
        width: 110,
        render: (row) => (
          <span className="text-slate-500 text-[11px]">
            {row?.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Action",
        width: 90,
        align: "center",
        render: (row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleViewAssessment(row?.candidate_assessment_id);
            }}
            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer border border-indigo-200"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div
      className="w-full h-full md:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden text-[13px] text-[#0f172a]"
      style={{ fontFamily: FONT }}
    >
      {/* ── TAB 1: ENTRY FORM VIEW (Full-Page Assessment Form) ── */}
      {activeHeaderTab === "entry" ? (
        <div className="flex-1 overflow-hidden flex flex-col h-full">
          {/* ── Standard ERP Header for Entry mode ── */}
          <ERPHeader
            title="Candidate General Assessment"
            TitleIcon={Award}
            activeTab="entry"
            onTabChange={(tabId) => setActiveHeaderTab(tabId)}
            isViewMode={false}
            hideActionButtons={true}
          />

          <div className="flex-1 overflow-hidden p-2 md:p-3 flex flex-col h-full">
            {/* Form Main Layout: Two Column Split matching Assessment Master */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* ── LEFT: REUSABLE SECTION CARDS (7 Cols) ── */}
              <div className="lg:col-span-7 space-y-3">
                {/* Section: Candidate & Vacancy Selection */}
                <SectionCard
                  title="Candidate & Vacancy Selection"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  theme="blue"
                  right={
                    <span className="text-[11px] font-semibold text-slate-600">
                      Status: <strong className="text-blue-700">{statusOverride || "Pending"}</strong>
                    </span>
                  }
                  bodyClassName="w-full min-w-0 flex flex-col items-stretch gap-3 p-3.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <FormField label="Select Registered Candidate">
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => handleSelectCandidate(e.target.value)}
                        className={formInputClass()}
                      >
                        <option value="">-- Choose Candidate --</option>
                        {candidatesList.map((c) => (
                          <option key={c.candidate_id} value={c.candidate_id}>
                            {c.candidate_name} ({c.candidate_code || c.mobile})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Applied Vacancy / Job Description" required>
                      <select
                        value={selectedVacancyId}
                        onChange={(e) => handleSelectVacancy(e.target.value)}
                        className={formInputClass()}
                      >
                        <option value="">-- Select Vacancy / JD --</option>
                        {vacanciesList.map((v) => {
                          const role = v.job_role || v.designation_name || "Job Vacancy";
                          const num = v.vacancy_no ? `${v.vacancy_no} - ` : "";
                          const dept = v.department_name ? ` (${v.department_name})` : "";
                          return (
                            <option key={v.vacancy_id} value={v.vacancy_id}>
                              {num}{role}{dept}
                            </option>
                          );
                        })}
                      </select>
                    </FormField>
                  </div>

                  {/* Public Link Box - Shown only when JD is selected */}
                  {selectedVacancyId ? (
                    <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-[5px] flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-bold text-[11px] text-blue-900">JD Assessment Link:</span>
                          <span className="font-mono text-[10.5px] text-blue-700 bg-white px-2 py-0.5 border border-blue-200 rounded select-all max-w-[260px] sm:max-w-xs md:max-w-md truncate">
                            {publicUrl}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyPublicLink()}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10.5px] inline-flex items-center gap-1 cursor-pointer transition-colors rounded shadow-xs"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? "Copied!" : "Copy Link"}
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 font-semibold text-[10.5px] inline-flex items-center gap-1 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-500 italic flex items-center gap-1.5 mt-0.5">
                      <span>💡 Select a Vacancy / JD above to generate and copy the public candidate assessment link.</span>
                    </div>
                  )}

                  {/* Candidate & Vacancy Quick Details Ribbon */}
                  {(candidate || vacancy) && (
                    <div className="mt-1 pt-2 border-t border-dashed border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] w-full">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Candidate Name:</span>
                        <strong className="text-slate-800">{candidate?.candidate_name || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobile / Email:</span>
                        <span className="text-slate-700 font-mono text-[10.5px]">
                          {candidate?.mobile || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Job Role:</span>
                        <strong className="text-blue-700">{vacancy?.job_role || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">JD Experience Req:</span>
                        <span className="text-slate-700 font-semibold">
                          {vacancy?.min_exp_years != null ? `${vacancy.min_exp_years} - ${vacancy.max_exp_years || "+"} Yrs` : "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* ── SECTION 1: Personal & General Eligibility ── */}
                <SectionCard
                  title="1. Personal & General Eligibility"
                  icon={<User className="w-3.5 h-3.5" />}
                  theme="teal"
                  bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <FormField label="A. Date of Birth / Age">
                    <input
                      type="date"
                      value={formAnswers.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="B. Open to Relocate?">
                    <select
                      value={formAnswers.open_to_relocate}
                      onChange={(e) => handleInputChange("open_to_relocate", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Yes">Yes (Fully Open / Local)</option>
                      <option value="Specific Location Only">Specific Location Only</option>
                      <option value="No">No (Not Relocating)</option>
                    </select>
                  </FormField>

                  <FormField label="C. Laptop / System Available?">
                    <select
                      value={formAnswers.laptop_available}
                      onChange={(e) => handleInputChange("laptop_available", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Yes">Yes (Has Working Laptop)</option>
                      <option value="No">No (Does Not Have)</option>
                    </select>
                  </FormField>
                </SectionCard>

                {/* ── SECTION 2: Academic & Education Profile ── */}
                <SectionCard
                  title="2. Academic & Education Profile"
                  icon={<GraduationCap className="w-3.5 h-3.5" />}
                  theme="indigo"
                  bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <FormField label="D. Highest Qualification">
                    <select
                      value={formAnswers.highest_qualification}
                      onChange={(e) => handleInputChange("highest_qualification", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Post Graduate">Post Graduate (Master's)</option>
                      <option value="Graduate">Graduate (Bachelor's)</option>
                      <option value="Diploma">Diploma / Polytechnic</option>
                      <option value="12th">12th Pass</option>
                      <option value="10th">10th Pass</option>
                    </select>
                  </FormField>

                  <FormField label="E. 10th Percentage (%)">
                    <input
                      type="number"
                      placeholder="e.g. 75"
                      value={formAnswers.tenth_percentage}
                      onChange={(e) => handleInputChange("tenth_percentage", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="F. 12th Percentage (%)">
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      value={formAnswers.twelfth_percentage}
                      onChange={(e) => handleInputChange("twelfth_percentage", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="G. Graduation Percentage (%)">
                    <input
                      type="number"
                      placeholder="e.g. 68"
                      value={formAnswers.graduation_percentage}
                      onChange={(e) => handleInputChange("graduation_percentage", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="H. Post-Graduation % (Optional)">
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={formAnswers.pg_percentage}
                      onChange={(e) => handleInputChange("pg_percentage", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="I. College / University Tier">
                    <select
                      value={formAnswers.college_name}
                      onChange={(e) => handleInputChange("college_name", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Tier 1 / Top 50 Ranked">Tier 1 / Top 50 Ranked</option>
                      <option value="Recognized University">Recognized University / College</option>
                      <option value="Unaccredited / Unknown">Unaccredited / Unknown</option>
                    </select>
                  </FormField>
                </SectionCard>

                {/* ── SECTION 3: Experience & Compensation ── */}
                <SectionCard
                  title="3. Experience & Compensation"
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  theme="orange"
                  bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <FormField label="J. Total Experience (Years)">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 3.5"
                      value={formAnswers.total_experience_years}
                      onChange={(e) => handleInputChange("total_experience_years", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="K. Relevant Work Experience">
                    <select
                      value={formAnswers.relevant_work_experience}
                      onChange={(e) => handleInputChange("relevant_work_experience", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Relevant">Directly Relevant Experience</option>
                      <option value="Partially Relevant">Partially Relevant / Allied</option>
                      <option value="Non-Relevant">Non-Relevant / None</option>
                    </select>
                  </FormField>

                  <FormField label="L. Notice Period">
                    <select
                      value={formAnswers.notice_period_days}
                      onChange={(e) => handleInputChange("notice_period_days", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="0">Immediate Joiner (0 Days)</option>
                      <option value="15">15 Days or Less</option>
                      <option value="30">30 Days (1 Month)</option>
                      <option value="60">60 Days (2 Months)</option>
                      <option value="90">90 Days (3 Months)</option>
                    </select>
                  </FormField>

                  <FormField label="M. Current Annual CTC (₹)">
                    <input
                      type="number"
                      placeholder="e.g. 350000"
                      value={formAnswers.current_ctc}
                      onChange={(e) => handleInputChange("current_ctc", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="N. Expected Annual CTC (₹)">
                    <input
                      type="number"
                      placeholder="e.g. 420000"
                      value={formAnswers.expected_ctc}
                      onChange={(e) => handleInputChange("expected_ctc", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>
                </SectionCard>

                {/* ── SECTION 4: Company, Role & Domain Match ── */}
                <SectionCard
                  title="4. Company, Role & Product Match"
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  theme="sky"
                  bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <FormField label="O. Current / Previous Company">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={formAnswers.current_company}
                      onChange={(e) => handleInputChange("current_company", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="P. Company Industry Match">
                    <select
                      value={formAnswers.current_company_industry}
                      onChange={(e) => handleInputChange("current_company_industry", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Relevant">Directly Relevant Industry / IT / ERP</option>
                      <option value="Allied Industry">Allied Industry / Tech-adjacent</option>
                      <option value="Unrelated">Unrelated Industry</option>
                    </select>
                  </FormField>

                  <FormField label="Q. Current Department Match">
                    <select
                      value={formAnswers.current_department}
                      onChange={(e) => handleInputChange("current_department", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Exact Match">Exact Department Match</option>
                      <option value="Allied">Allied Function</option>
                      <option value="Different">Different Function</option>
                    </select>
                  </FormField>

                  <FormField label="R. Current Designation Match">
                    <input
                      type="text"
                      placeholder="e.g. Sales Executive"
                      value={formAnswers.current_designation}
                      onChange={(e) => handleInputChange("current_designation", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="S. Product / Software Match">
                    <select
                      value={formAnswers.previous_company_products}
                      onChange={(e) => handleInputChange("previous_company_products", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Relevant">Same Products / ERP / SaaS</option>
                      <option value="Similar">Similar B2B Products</option>
                      <option value="Different">Completely Different Products</option>
                    </select>
                  </FormField>
                </SectionCard>

                {/* ── SECTION 5: Commitments & Technical Skills ── */}
                <SectionCard
                  title="5. Commitments & Technical Skills"
                  icon={<Code className="w-3.5 h-3.5" />}
                  theme="purple"
                  bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <FormField label="T. Agree for Service Bond?">
                    <select
                      value={formAnswers.agree_for_bond}
                      onChange={(e) => handleInputChange("agree_for_bond", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Yes">Yes (Agrees to 1-2 Yr Policy)</option>
                      <option value="No">No (Does Not Agree)</option>
                    </select>
                  </FormField>

                  <FormField label="U. Willing to Travel?">
                    <select
                      value={formAnswers.willing_to_travel}
                      onChange={(e) => handleInputChange("willing_to_travel", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Yes">Yes (Open to Client Travel)</option>
                      <option value="No">No (In-office / Remote only)</option>
                    </select>
                  </FormField>

                  <FormField label="V. ERP Knowledge">
                    <select
                      value={formAnswers.erp_knowledge}
                      onChange={(e) => handleInputChange("erp_knowledge", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Advanced ERP">Advanced / Multi-Module ERP</option>
                      <option value="Basic ERP">Basic ERP / Accounting</option>
                      <option value="None">None / No Prior ERP Exp</option>
                    </select>
                  </FormField>

                  <FormField label="W. Languages Known">
                    <input
                      type="text"
                      placeholder="e.g. English, Hindi"
                      value={formAnswers.languages_known}
                      onChange={(e) => handleInputChange("languages_known", e.target.value)}
                      className={formInputClass()}
                    />
                  </FormField>

                  <FormField label="X. Email / Chat Skills">
                    <select
                      value={formAnswers.email_chat_handling}
                      onChange={(e) => handleInputChange("email_chat_handling", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Professional">Professional Business English</option>
                      <option value="Intermediate">Intermediate Communication</option>
                      <option value="Basic">Basic Communication</option>
                    </select>
                  </FormField>

                  <FormField label="Y. MS Office & Tools">
                    <select
                      value={formAnswers.ms_office_knowledge}
                      onChange={(e) => handleInputChange("ms_office_knowledge", e.target.value)}
                      className={formInputClass()}
                    >
                      <option value="Advanced">Advanced (Formulas, Pivot, PPT)</option>
                      <option value="Intermediate">Intermediate (Normal Excel/Word)</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </FormField>
                </SectionCard>
              </div>

              {/* ── RIGHT: LIVE SCORECARD & BREAKDOWN SIDEBAR (5 Cols) matching Assessment Master theme ── */}
              <div className="lg:col-span-5 w-full min-w-0 space-y-3 flex flex-col items-stretch">
                {/* Scorecard Hero Card */}
                <SectionCard
                  title="Candidate View – Live Preview & Scorecard"
                  icon={<Award className="w-3.5 h-3.5" />}
                  theme="violet"
                  bodyClassName="w-full min-w-0 flex flex-col items-stretch gap-3 p-3.5"
                >
                  {/* Assessment Info Pill Bar */}
                  <div className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-[5px] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">
                        {candidate?.candidate_name || "General Eligibility Assessment"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                        LOGIX Standard
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        <Layers className="w-3 h-3 text-slate-500" /> 25 Criteria
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        <Award className="w-3 h-3 text-amber-500" /> {evaluation?.applicable_max_marks ?? 43} Max Marks
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                        Passing: 70%
                      </span>
                    </div>
                  </div>

                  {/* Scoreboard Metrics Box */}
                  <div className="w-full min-w-0 bg-[#0f2137] text-white p-3.5 rounded-[5px] shadow-xs">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-[10.5px] text-slate-300 block font-medium">
                          Obtained Score:
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl font-black text-white font-mono">
                            {evaluation?.obtained_marks ?? 0}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            / {evaluation?.applicable_max_marks ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10.5px] text-slate-300 block font-medium">
                          Score Percentage:
                        </span>
                        <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
                          {evaluation?.percentage ?? 0}%
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Pill */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Automated Recommendation:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded ${evaluation?.evaluation_status === "Shortlisted"
                          ? "bg-emerald-500 text-white"
                          : evaluation?.evaluation_status === "Hold"
                            ? "bg-amber-500 text-white"
                            : "bg-rose-500 text-white"
                          }`}
                      >
                        {evaluation?.evaluation_status === "Shortlisted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {evaluation?.evaluation_status === "Hold" && <AlertCircle className="w-3.5 h-3.5" />}
                        {evaluation?.evaluation_status === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                        {evaluation?.evaluation_status || "Hold"}
                      </span>
                    </div>
                  </div>

                  {/* Rule-by-Rule Scoring Breakdown List */}
                  <div className="w-full min-w-0 border border-slate-200 rounded-[5px] flex flex-col overflow-hidden bg-white">
                    <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-[#0f2137] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                        Criteria Breakdown ({evaluation?.answers?.length || 25})
                      </span>
                    </div>

                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100 text-xs">
                      {evaluation?.answers?.map((row, idx) => {
                        const isZero = row.is_applicable && row.awarded_marks === 0;
                        const isFull = row.is_applicable && row.awarded_marks === row.max_marks;
                        const isNA = !row.is_applicable || row.max_marks === 0;

                        return (
                          <div
                            key={row.code || idx}
                            className={`p-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${isNA ? "bg-slate-50/40 opacity-60" : isZero ? "bg-rose-50/20" : ""
                              }`}
                          >
                            <div className="min-w-0 flex-1 flex items-start gap-2">
                              <span className="w-4 h-4 shrink-0 rounded-full bg-slate-800 text-white font-bold text-[9.5px] flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-800 text-[11px] truncate block">
                                  {row.name}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {row.evaluation_note || row.candidate_answer || "—"}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {isNA ? (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200">
                                  N/A
                                </span>
                              ) : (
                                <span
                                  className={`inline-block px-1.5 py-0.5 font-mono text-[10.5px] font-bold rounded ${isFull
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isZero
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                >
                                  +{row.awarded_marks} / {row.max_marks}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                {/* Evaluator Remarks & Decision SectionCard */}
                <SectionCard
                  title="Evaluator Decision & Remarks"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  theme="emerald"
                  bodyClassName="w-full min-w-0 flex flex-col items-stretch gap-2.5 p-3"
                >
                  <FormField label="HR / Evaluator Remarks & Decision Note">
                    <textarea
                      rows={2}
                      placeholder="Enter evaluator qualitative remarks, interview recommendations..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className={`${formInputClass()} !h-auto py-1.5`}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-2.5 items-center">
                    <FormField label="Final Assessment Decision">
                      <select
                        value={statusOverride}
                        onChange={(e) => setStatusOverride(e.target.value)}
                        className={formInputClass()}
                      >
                        <option value="Shortlisted">✅ Shortlisted (Proceed to Round 1)</option>
                        <option value="Hold">⏳ Hold / Under Review</option>
                        <option value="Rejected">❌ Rejected (Not Fit)</option>
                      </select>
                    </FormField>

                    <div className="pt-4">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Current Decision: <strong className="text-blue-700">{statusOverride || "Pending"}</strong>
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>

          {/* ── Docked ERP Footer Action Bar at Bottom (Centered) ── */}
          <div className="w-full border-t border-slate-300 bg-slate-50/95 backdrop-blur-md px-4 py-2 mt-2 flex items-center justify-center gap-3 shrink-0 shadow-sm">
            <SaveButton
              onClick={handleSaveAssessment}
              saving={saving}
              disabled={saving}
            />
            <DiscardButton onClick={() => setActiveHeaderTab("search")} />
            <ResetButton onClick={handleResetForm} />
          </div>
        </div>
      ) : (
        /* ── TAB 2: SEARCH / LIST VIEW (Submitted Candidate Records) ── */
        <div className="w-full h-full flex-1 overflow-hidden">
          <Table
            title="Candidate General Assessments"
            TitleIcon={Award}
            data={list}
            columns={columns}
            rowKey="candidate_assessment_id"
            loading={loading}
            onRowClick={(row) => handleViewAssessment(row?.candidate_assessment_id)}
            onRowDoubleClick={(row) => handleViewAssessment(row?.candidate_assessment_id)}
            onAdd={() => {
              handleResetForm();
              setActiveHeaderTab("entry");
            }}
            rights={rights}
            activeTab="search"
            onTabChange={(tabKey) => {
              if (tabKey === "entry") {
                handleResetForm();
                setActiveHeaderTab("entry");
              }
            }}
            onRefresh={loadList}
            onImport={handleCopyPublicLink}
          />
        </div>
      )}
    </div>
  );
}

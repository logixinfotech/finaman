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
} from "lucide-react";
import { api } from "../../../../utils/api";
import { showToast, alertSuccess, alertWarning, alertError, confirmDelete } from "../../../../components/Reusable/alert";
import { evaluateGeneralAssessment } from "./logixGeneralAssessmentRules";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// Clipboard copy that also works on non-HTTPS origins
const copyTextToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

// Every field starts EMPTY. Values appear only when the user fills them,
// or when a submitted assessment is opened from the Search tab.
const EMPTY_ANSWERS = {
  dob: "",
  open_to_relocate: "",
  laptop_available: "",
  highest_qualification: "",
  tenth_percentage: "",
  twelfth_percentage: "",
  graduation_percentage: "",
  pg_percentage: "",
  college_name: "",
  current_ctc: "",
  expected_ctc: "",
  total_experience_years: "",
  relevant_work_experience: "",
  notice_period_days: "",
  current_company: "",
  current_company_industry: "",
  current_designation: "",
  current_department: "",
  previous_company_products: "",
  agree_for_bond: "",
  willing_to_travel: "",
  erp_knowledge: "",
  languages_known: "",
  email_chat_handling: "",
  ms_office_knowledge: "",
  programming_languages: "",
  monthly_sales_target: "",
};

// Dropdown that always shows the saved value, even if it is not in the option list
// (the public candidate form uses different wording than this page).
const OptSelect = ({ value, onChange, options }) => {
  const known = options.some((o) => o.value === value);
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={formInputClass()}>
      <option value="">-- Select --</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {value && !known && <option value={value}>{value}</option>}
    </select>
  );
};

const YES_NO_RELOCATE = [
  { value: "Yes", label: "Yes (Fully Open / Local)" },
  { value: "Specific Location Only", label: "Specific Location Only" },
  { value: "No", label: "No (Not Relocating)" },
];
const YES_NO_LAPTOP = [
  { value: "Yes", label: "Yes (Has Working Laptop)" },
  { value: "No", label: "No (Does Not Have)" },
];
const QUALIFICATION = [
  { value: "Post Graduate", label: "Post Graduate (Master's)" },
  { value: "Graduate", label: "Graduate (Bachelor's)" },
  { value: "Diploma", label: "Diploma / Polytechnic" },
  { value: "12th", label: "12th Pass" },
  { value: "10th", label: "10th Pass" },
];
const COLLEGE = [
  { value: "Tier 1 / Top 50 Ranked", label: "Tier 1 / Top 50 Ranked" },
  { value: "Recognized University", label: "Recognized University / College" },
  { value: "Unaccredited / Unknown", label: "Unaccredited / Unknown" },
];
const RELEVANT_EXP = [
  { value: "Relevant", label: "Directly Relevant Experience" },
  { value: "Partially Relevant", label: "Partially Relevant / Allied" },
  { value: "Non-Relevant", label: "Non-Relevant / None" },
];
const NOTICE = [
  { value: "0", label: "Immediate Joiner (0 Days)" },
  { value: "15", label: "15 Days or Less" },
  { value: "30", label: "30 Days (1 Month)" },
  { value: "60", label: "60 Days (2 Months)" },
  { value: "90", label: "90 Days (3 Months)" },
];
const INDUSTRY = [
  { value: "Relevant", label: "Directly Relevant Industry / IT / ERP" },
  { value: "Allied Industry", label: "Allied Industry / Tech-adjacent" },
  { value: "Unrelated", label: "Unrelated Industry" },
];
const DEPARTMENT = [
  { value: "Exact Match", label: "Exact Department Match" },
  { value: "Allied", label: "Allied Function" },
  { value: "Different", label: "Different Function" },
];
const PRODUCTS = [
  { value: "Relevant", label: "Same Products / ERP / SaaS" },
  { value: "Similar", label: "Similar B2B Products" },
  { value: "Different", label: "Completely Different Products" },
];
const BOND = [
  { value: "Yes", label: "Yes (Agrees to 1-2 Yr Policy)" },
  { value: "No", label: "No (Does Not Agree)" },
];
const TRAVEL = [
  { value: "Yes", label: "Yes (Open to Client Travel)" },
  { value: "No", label: "No (In-office / Remote only)" },
];
const ERP = [
  { value: "Advanced ERP", label: "Advanced / Multi-Module ERP" },
  { value: "Basic ERP", label: "Basic ERP / Accounting" },
  { value: "None", label: "None / No Prior ERP Exp" },
];
const EMAIL_CHAT = [
  { value: "Professional", label: "Professional Business English" },
  { value: "Intermediate", label: "Intermediate Communication" },
  { value: "Basic", label: "Basic Communication" },
];
const MS_OFFICE = [
  { value: "Advanced", label: "Advanced (Formulas, Pivot, PPT)" },
  { value: "Intermediate", label: "Intermediate (Normal Excel/Word)" },
  { value: "Basic", label: "Basic" },
];

export default function GeneralAssessmentPage({ tab }) {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [candidatesList, setCandidatesList] = useState([]);
  const [vacanciesList, setVacanciesList] = useState([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");
  const [vacancy, setVacancy] = useState(null);

  // true = a submitted assessment is opened from Search (read-only, saved scorecard shown)
  const [isViewing, setIsViewing] = useState(false);

  const [formAnswers, setFormAnswers] = useState(EMPTY_ANSWERS);
  const [evaluation, setEvaluation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusOverride, setStatusOverride] = useState("");
  const [decisionManual, setDecisionManual] = useState(false);

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

  const hasAnswers = useMemo(
    () => Object.values(formAnswers).some((v) => String(v ?? "").trim() !== ""),
    [formAnswers]
  );

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

  // Load dropdown data only. NO vacancy is auto-selected.
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
      }
    } catch (e) {
      console.error("loadMeta error:", e);
    }
  }, []);

  useEffect(() => {
    loadList();
    loadMeta();
  }, [loadList, loadMeta]);

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

  // Fills only from the candidate's real profile (no fake defaults)
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

  // Live scoring — only for NEW entries. A submitted record keeps its saved scorecard.
  useEffect(() => {
    if (isViewing) return;

    if (!vacancy || !hasAnswers) {
      setEvaluation(null);
      if (!decisionManual) setStatusOverride("");
      return;
    }

    const result = evaluateGeneralAssessment(formAnswers, vacancy);
    setEvaluation(result);
    if (!decisionManual) setStatusOverride(result.evaluation_status);
  }, [formAnswers, vacancy, hasAnswers, isViewing, decisionManual]);

  const handleInputChange = (field, value) => {
    setFormAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset → fully blank
  const handleResetForm = (silent) => {
    setFormAnswers(EMPTY_ANSWERS);
    setSelectedCandidateId("");
    setCandidate(null);
    setSelectedVacancyId("");
    setVacancy(null);
    setEvaluation(null);
    setRemarks("");
    setStatusOverride("");
    setDecisionManual(false);
    setIsViewing(false);
    if (silent !== true) {
      showToast({ icon: "success", title: "Form cleared" });
    }
  };

  const handleCopyPublicLink = async (overrideVid) => {
    const targetVid = typeof overrideVid === "string" ? overrideVid : selectedVacancyId;
    if (!targetVid) {
      showToast({ icon: "warning", title: "Please select a Vacancy / Job Description first to generate the link!" });
      return;
    }
    const params = new URLSearchParams();
    if (tenantDb) params.set("db", tenantDb);
    params.set("vid", targetVid);
    const qs = params.toString();
    const url = `${window.location.origin}/candidate-assessment/general${qs ? `?${qs}` : ""}`;

    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopiedLink(true);
      showToast({ icon: "success", title: "Public assessment link for selected JD copied to clipboard!" });
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      showToast({ icon: "error", title: "Copy failed. Please select the link and press Ctrl+C." });
    }
  };

  // Open a SUBMITTED assessment from Search → fills the form with the saved answers
  const handleViewAssessment = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/recruitment/general-assessment/${id}`);
      if (res.data?.success && res.data.data) {
        const data = res.data.data;

        setIsViewing(true);
        setDecisionManual(true); // keep the saved decision, never auto-overwrite

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

        // Restore the saved answers (blank for old records saved before the backend change)
        setFormAnswers({ ...EMPTY_ANSWERS, ...(data.form_answers || {}) });

        setRemarks(data.evaluation_remarks || "");
        setStatusOverride(data.evaluation_status || "");

        setEvaluation({
          applicable_max_marks: data.applicable_max_marks,
          obtained_marks: data.obtained_marks,
          percentage: data.percentage,
          evaluation_status: data.evaluation_status,
          answers: Array.isArray(data.answers) ? data.answers : [],
        });

        setActiveHeaderTab("entry");

        // Load full JD details for the header ribbon (does not re-score the saved record)
        if (data.vacancy_id) handleSelectVacancy(data.vacancy_id);
      }
    } catch (err) {
      console.error("handleViewAssessment error:", err);
      showToast({ icon: "error", title: "Failed to load assessment details" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (isViewing) {
      showToast({ icon: "info", title: "This is a submitted assessment. Click Reset to start a new one." });
      return;
    }
    if (!candidate?.candidate_id && !selectedCandidateId) {
      alertWarning("Candidate Required", "Please select a candidate before saving.");
      return;
    }
    if (!vacancy?.vacancy_id && !selectedVacancyId) {
      alertWarning("Vacancy Required", "Please select a vacancy for this assessment.");
      return;
    }
    if (!hasAnswers) {
      alertWarning("No Answers", "Please fill in the assessment before saving.");
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
        await loadList();
        handleResetForm(true);
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

  const handleDeleteMultiple = async (selectedRows) => {
    const ids = (selectedRows || []).map((row) =>
      typeof row === "object" ? row.candidate_assessment_id : row
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} selected assessment(s)?`,
      text: `Are you sure you want to remove ${ids.length} assessment record(s)?`,
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await api.post("/api/recruitment/general-assessment/delete-multiple", { ids });
      if (res.data?.success) {
        showToast({ icon: "success", title: `${ids.length} assessment(s) deleted successfully.` });
        await loadList();
      } else {
        alertError("Delete Failed", res.data?.message || "Failed to delete assessment records");
      }
    } catch (err) {
      console.error("Delete assessment error:", err);
      alertError("Delete Error", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Columns for Search Tab
  const columns = useMemo(
    () => {
      const pill = "inline-flex items-center gap-1 h-[20px] px-2.5 rounded-full text-[10.5px] font-bold leading-none border whitespace-nowrap";

      const statusStyle = (status) => {
        switch (status) {
          case "Shortlisted":
            return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 };
          case "Hold":
            return { cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertCircle };
          case "Rejected":
            return { cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle };
          case "Completed":
            return { cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: CheckCircle2 };
          default:
            return { cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: AlertCircle };
        }
      };

      return [
        {
          key: "candidate_code",
          label: "Candidate Code",
          width: 150,
          render: (row) => (
            <span className="font-mono text-[11.5px] font-bold text-blue-700 whitespace-nowrap">
              {row?.candidate_code || "—"}
            </span>
          ),
        },
        {
          key: "candidate_name",
          label: "Candidate Name",
          width: 170,
          render: (row) => (
            <span className="block truncate font-semibold text-slate-800" title={row?.candidate_name || ""}>
              {row?.candidate_name || "Applicant"}
            </span>
          ),
        },
        {
          key: "candidate_mobile",
          label: "Mobile Number",
          width: 120,
          render: (row) => (
            <span className="font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
              {row?.candidate_mobile || "—"}
            </span>
          ),
        },
        {
          key: "vacancy_no",
          label: "Vacancy No",
          width: 150,
          render: (row) => (
            <span className="font-mono text-[11px] font-medium text-slate-700 whitespace-nowrap">
              {row?.vacancy_no || "—"}
            </span>
          ),
        },
        {
          key: "job_role",
          label: "Position / Role",
          width: 130,
          render: (row) => (
            <span className="block truncate text-slate-800" title={row?.job_role || ""}>
              {row?.job_role || "—"}
            </span>
          ),
        },
        {
          key: "department_name",
          label: "Department",
          width: 120,
          render: (row) => (
            <span className="block truncate text-slate-600" title={row?.department_name || ""}>
              {row?.department_name || "—"}
            </span>
          ),
        },
        {
          key: "obtained_marks",
          label: "Score / Max",
          width: 100,
          align: "center",
          render: (row) => {
            const max = Number(row?.applicable_max_marks) || 0;
            if (!max) return <span className="text-slate-400">—</span>;
            return (
              <span className="font-mono text-[11.5px] font-bold text-slate-800 whitespace-nowrap">
                {row?.obtained_marks ?? 0}
                <span className="text-slate-400 font-normal"> / {max}</span>
              </span>
            );
          },
        },
        {
          key: "percentage",
          label: "Score %",
          width: 85,
          align: "center",
          render: (row) => {
            const max = Number(row?.applicable_max_marks) || 0;
            if (!max) return <span className="text-slate-400">—</span>;
            const pct = parseFloat(row?.percentage) || 0;
            const cls =
              pct >= 70
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : pct >= 50
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300";
            return (
              <span className={`inline-flex items-center h-[20px] px-2 rounded-full text-[11px] font-black leading-none border ${cls}`}>
                {pct}%
              </span>
            );
          },
        },
        {
          key: "evaluation_status",
          label: "Result Status",
          width: 125,
          align: "center",
          render: (row) => {
            const status = row?.evaluation_status || "Pending";
            const { cls, Icon } = statusStyle(status);
            return (
              <span className={`${pill} ${cls}`}>
                <Icon className="w-3 h-3" />
                {status}
              </span>
            );
          },
        },
        {
          key: "evaluated_by_name",
          label: "Evaluated By",
          width: 110,
          render: (row) => (
            <span className="block truncate text-slate-700" title={row?.evaluated_by_name || ""}>
              {row?.evaluated_by_name || "System"}
            </span>
          ),
        },
        {
          key: "created_at",
          label: "Date",
          width: 95,
          render: (row) => (
            <span className="text-slate-500 text-[11px] whitespace-nowrap">
              {row?.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "—"}
            </span>
          ),
        },
        {
          key: "actions",
          label: "Action",
          width: 85,
          align: "center",
          render: (row) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleViewAssessment(row?.candidate_assessment_id);
              }}
              className="h-[22px] px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer border border-indigo-200 rounded whitespace-nowrap"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          ),
        },
      ];
    },
    []
  );

  const currentStatus = evaluation?.evaluation_status;

  return (
    <div
      className="w-full h-full md:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden text-[13px] text-[#0f172a]"
      style={{ fontFamily: FONT }}
    >
      {activeHeaderTab === "entry" ? (
        <div className="flex-1 overflow-hidden flex flex-col h-full">
          <ERPHeader
            title="Candidate General Assessment"
            TitleIcon={Award}
            activeTab="entry"
            onTabChange={(tabId) => {
              if (tabId === "search" && isViewing) handleResetForm(true);
              setActiveHeaderTab(tabId);
            }}
            isViewMode={false}
            hideActionButtons={true}
          />

          <div className="flex-1 overflow-hidden p-2 md:p-3 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* ── LEFT (7 cols) ── */}
              <div className="lg:col-span-7 space-y-3">
                <SectionCard
                  title="Candidate & Vacancy Selection"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  theme="blue"
                  right={
                    <span className="text-[11px] font-semibold text-slate-600">
                      {isViewing && (
                        <span className="mr-2 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          SUBMITTED RECORD (READ-ONLY)
                        </span>
                      )}
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
                        disabled={isViewing}
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
                        disabled={isViewing}
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
                          {vacancy?.min_experience_years != null
                            ? `${vacancy.min_experience_years} - ${vacancy.max_experience_years || "+"} Yrs`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* All answer sections are locked when viewing a submitted record */}
                <fieldset disabled={isViewing} className="contents">
                  {/* SECTION 1 */}
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
                      <OptSelect value={formAnswers.open_to_relocate} onChange={(v) => handleInputChange("open_to_relocate", v)} options={YES_NO_RELOCATE} />
                    </FormField>
                    <FormField label="C. Laptop / System Available?">
                      <OptSelect value={formAnswers.laptop_available} onChange={(v) => handleInputChange("laptop_available", v)} options={YES_NO_LAPTOP} />
                    </FormField>
                  </SectionCard>

                  {/* SECTION 2 */}
                  <SectionCard
                    title="2. Academic & Education Profile"
                    icon={<GraduationCap className="w-3.5 h-3.5" />}
                    theme="indigo"
                    bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <FormField label="D. Highest Qualification">
                      <OptSelect value={formAnswers.highest_qualification} onChange={(v) => handleInputChange("highest_qualification", v)} options={QUALIFICATION} />
                    </FormField>
                    <FormField label="E. 10th Percentage (%)">
                      <input type="number" placeholder="e.g. 75" value={formAnswers.tenth_percentage}
                        onChange={(e) => handleInputChange("tenth_percentage", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="F. 12th Percentage (%)">
                      <input type="number" placeholder="e.g. 70" value={formAnswers.twelfth_percentage}
                        onChange={(e) => handleInputChange("twelfth_percentage", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="G. Graduation Percentage (%)">
                      <input type="number" placeholder="e.g. 68" value={formAnswers.graduation_percentage}
                        onChange={(e) => handleInputChange("graduation_percentage", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="H. Post-Graduation % (Optional)">
                      <input type="number" placeholder="e.g. 72" value={formAnswers.pg_percentage}
                        onChange={(e) => handleInputChange("pg_percentage", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="I. College / University Tier">
                      <OptSelect value={formAnswers.college_name} onChange={(v) => handleInputChange("college_name", v)} options={COLLEGE} />
                    </FormField>
                  </SectionCard>

                  {/* SECTION 3 */}
                  <SectionCard
                    title="3. Experience & Compensation"
                    icon={<Briefcase className="w-3.5 h-3.5" />}
                    theme="orange"
                    bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <FormField label="J. Total Experience (Years)">
                      <input type="number" step="0.5" placeholder="e.g. 3.5" value={formAnswers.total_experience_years}
                        onChange={(e) => handleInputChange("total_experience_years", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="K. Relevant Work Experience">
                      <OptSelect value={formAnswers.relevant_work_experience} onChange={(v) => handleInputChange("relevant_work_experience", v)} options={RELEVANT_EXP} />
                    </FormField>
                    <FormField label="L. Notice Period">
                      <OptSelect value={String(formAnswers.notice_period_days ?? "")} onChange={(v) => handleInputChange("notice_period_days", v)} options={NOTICE} />
                    </FormField>
                    <FormField label="M. Current Annual CTC (₹)">
                      <input type="number" placeholder="e.g. 350000" value={formAnswers.current_ctc}
                        onChange={(e) => handleInputChange("current_ctc", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="N. Expected Annual CTC (₹)">
                      <input type="number" placeholder="e.g. 420000" value={formAnswers.expected_ctc}
                        onChange={(e) => handleInputChange("expected_ctc", e.target.value)} className={formInputClass()} />
                    </FormField>
                  </SectionCard>

                  {/* SECTION 4 */}
                  <SectionCard
                    title="4. Company, Role & Product Match"
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    theme="sky"
                    bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <FormField label="O. Current / Previous Company">
                      <input type="text" placeholder="Company Name" value={formAnswers.current_company}
                        onChange={(e) => handleInputChange("current_company", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="P. Company Industry Match">
                      <OptSelect value={formAnswers.current_company_industry} onChange={(v) => handleInputChange("current_company_industry", v)} options={INDUSTRY} />
                    </FormField>
                    <FormField label="Q. Current Department Match">
                      <OptSelect value={formAnswers.current_department} onChange={(v) => handleInputChange("current_department", v)} options={DEPARTMENT} />
                    </FormField>
                    <FormField label="R. Current Designation Match">
                      <input type="text" placeholder="e.g. Sales Executive" value={formAnswers.current_designation}
                        onChange={(e) => handleInputChange("current_designation", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="S. Product / Software Match">
                      <OptSelect value={formAnswers.previous_company_products} onChange={(v) => handleInputChange("previous_company_products", v)} options={PRODUCTS} />
                    </FormField>
                  </SectionCard>

                  {/* SECTION 5 */}
                  <SectionCard
                    title="5. Commitments & Technical Skills"
                    icon={<Code className="w-3.5 h-3.5" />}
                    theme="purple"
                    bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <FormField label="T. Agree for Service Bond?">
                      <OptSelect value={formAnswers.agree_for_bond} onChange={(v) => handleInputChange("agree_for_bond", v)} options={BOND} />
                    </FormField>
                    <FormField label="U. Willing to Travel?">
                      <OptSelect value={formAnswers.willing_to_travel} onChange={(v) => handleInputChange("willing_to_travel", v)} options={TRAVEL} />
                    </FormField>
                    <FormField label="V. ERP Knowledge">
                      <OptSelect value={formAnswers.erp_knowledge} onChange={(v) => handleInputChange("erp_knowledge", v)} options={ERP} />
                    </FormField>
                    <FormField label="W. Languages Known">
                      <input type="text" placeholder="e.g. English, Hindi" value={formAnswers.languages_known}
                        onChange={(e) => handleInputChange("languages_known", e.target.value)} className={formInputClass()} />
                    </FormField>
                    <FormField label="X. Email / Chat Skills">
                      <OptSelect value={formAnswers.email_chat_handling} onChange={(v) => handleInputChange("email_chat_handling", v)} options={EMAIL_CHAT} />
                    </FormField>
                    <FormField label="Y. MS Office & Tools">
                      <OptSelect value={formAnswers.ms_office_knowledge} onChange={(v) => handleInputChange("ms_office_knowledge", v)} options={MS_OFFICE} />
                    </FormField>
                  </SectionCard>
                </fieldset>
              </div>

              {/* ── RIGHT (5 cols): Scorecard ── */}
              <div className="lg:col-span-5 w-full min-w-0 space-y-3 flex flex-col items-stretch">
                <SectionCard
                  title={isViewing ? "Submitted Scorecard" : "Candidate View – Live Preview & Scorecard"}
                  icon={<Award className="w-3.5 h-3.5" />}
                  theme="violet"
                  bodyClassName="w-full min-w-0 flex flex-col items-stretch gap-3 p-3.5"
                >
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
                        <Award className="w-3 h-3 text-amber-500" /> {evaluation?.applicable_max_marks ?? 0} Max Marks
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                        Passing: 70%
                      </span>
                    </div>
                  </div>

                  <div className="w-full min-w-0 bg-[#0f2137] text-white p-3.5 rounded-[5px] shadow-xs">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-[10.5px] text-slate-300 block font-medium">Obtained Score:</span>
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
                        <span className="text-[10.5px] text-slate-300 block font-medium">Score Percentage:</span>
                        <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
                          {evaluation?.percentage ?? 0}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">
                        {isViewing ? "Saved Result:" : "Automated Recommendation:"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded ${currentStatus === "Shortlisted"
                          ? "bg-emerald-500 text-white"
                          : currentStatus === "Hold"
                            ? "bg-amber-500 text-white"
                            : currentStatus === "Rejected"
                              ? "bg-rose-500 text-white"
                              : "bg-slate-600 text-slate-100"
                          }`}
                      >
                        {currentStatus === "Shortlisted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {currentStatus === "Hold" && <AlertCircle className="w-3.5 h-3.5" />}
                        {currentStatus === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                        {currentStatus || "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full min-w-0 border border-slate-200 rounded-[5px] flex flex-col overflow-hidden bg-white">
                    <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-[#0f2137] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                        Criteria Breakdown ({evaluation?.answers?.length || 25})
                      </span>
                    </div>

                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100 text-xs">
                      {!evaluation?.answers?.length ? (
                        <div className="p-4 text-center text-[11px] text-slate-400 italic">
                          {selectedVacancyId
                            ? "Start filling the form to see the live score breakdown."
                            : "Select a Vacancy / JD and fill the form, or open a submitted assessment from the Search tab."}
                        </div>
                      ) : (
                        evaluation.answers.map((row, idx) => {
                          const isZero = row.is_applicable && row.awarded_marks === 0;
                          const isFull = row.is_applicable && row.awarded_marks === row.max_marks;
                          const isNA = !row.is_applicable || row.max_marks === 0;

                          return (
                            <div
                              key={row.code || idx}
                              className={`p-2 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors ${isNA ? "bg-slate-50/40 opacity-60" : isZero ? "bg-rose-50/20" : ""}`}
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
                        })
                      )}
                    </div>
                  </div>
                </SectionCard>

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
                      disabled={isViewing}
                      className={`${formInputClass()} !h-auto py-1.5`}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-2.5 items-center">
                    <FormField label="Final Assessment Decision">
                      <select
                        value={statusOverride}
                        onChange={(e) => {
                          setStatusOverride(e.target.value);
                          setDecisionManual(true);
                        }}
                        disabled={isViewing}
                        className={formInputClass()}
                      >
                        <option value="">-- Pending --</option>
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

          {/* Footer Action Bar */}
          <div className="w-full border-t border-slate-300 bg-slate-50/95 backdrop-blur-md px-4 py-2 mt-2 flex items-center justify-center gap-3 shrink-0 shadow-sm">
            <SaveButton
              onClick={handleSaveAssessment}
              saving={saving}
              disabled={saving || isViewing}
            />
            <DiscardButton
              onClick={() => {
                handleResetForm(true);
                setActiveHeaderTab("search");
              }}
            />
            <ResetButton onClick={() => handleResetForm()} />
          </div>
        </div>
      ) : (
        /* ── SEARCH / LIST VIEW ── */
        <div className="w-full h-full flex-1 overflow-hidden">
          <Table
            title="Candidate General Assessments"
            TitleIcon={Award}
            data={list}
            columns={columns}
            rowKey="candidate_assessment_id"
            loading={loading}
            onRowDoubleClick={(row) => handleViewAssessment(row?.candidate_assessment_id)}
            onDeleteMultiple={handleDeleteMultiple}
            onAdd={() => {
              handleResetForm(true);
              setActiveHeaderTab("entry");
            }}
            rights={rights}
            activeTab="search"
            onTabChange={(tabKey) => {
              if (tabKey === "entry") {
                handleResetForm(true);
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
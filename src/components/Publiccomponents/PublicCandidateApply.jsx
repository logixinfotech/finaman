import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchPublicActiveVacancies,
  checkPublicCandidateDuplicate,
  submitPublicCandidateApplication,
} from "../../utils/publicApi";
import { copyToClipboard } from "../../utils/helpers";
import SectionCard, { FormField } from "../Reusable/form/SectionCard";
import {
  Briefcase,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  Tag,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  Send,
  Paperclip,
  X,
  RotateCcw,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";

/* ── ERP theme tokens ── */
const ERP = {
  navy: "#0f1d3d",
  navySoft: "#1b2540",
  page: "#eef1f8",
  border: "#dde1ea",
  heading: "#0f2137",
};

const MAX_RESUME_MB = 2;
const ALLOWED_EXT = ["pdf", "doc", "docx", "rtf", "txt"];

const EMPTY_FORM = {
  vacancy_id: "",
  vacancy_no: "",
  job_title: "",
  full_name: "",
  mobile: "",
  email: "",
  current_location: "",
  source_channel: "Career Portal",
};

/* Compact input styling */
export const compactInputClass = (disabled, error) =>
  `w-full h-[30px] px-2.5 py-1 text-xs border rounded-md outline-none transition-colors ${disabled
    ? "bg-[#eef1f6] text-slate-500 border-slate-300 cursor-not-allowed"
    : error
      ? "bg-white text-slate-800 border-red-500 ring-1 ring-red-200"
      : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
  }`;

/* ── Shared shell: ERP-style navy header + page background ── */
function Shell({ children, wide = false }) {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: ERP.page }}>
      <header style={{ background: ERP.navy }} className="w-full shrink-0 shadow-sm">
        <div className={`${wide ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 py-2.5 flex items-center justify-between`}>
          <div className="leading-tight">
            <div className="text-white text-sm font-bold tracking-wide">FINAMAN ERP</div>
            <div className="text-[10px] text-slate-300">Careers & Recruitment Portal</div>
          </div>
          <div className="text-[11px] text-slate-300 font-medium bg-white/10 px-2.5 py-1 rounded">
            Public Application
          </div>
        </div>
      </header>
      <main className="flex-1 w-full px-3 sm:px-4 py-4 sm:py-5 flex flex-col items-center">
        {children}
      </main>
      <footer className="text-center text-[11px] text-slate-400 pb-4 shrink-0">
        © {new Date().getFullYear()} FINHRMS Recruitment. All rights reserved.
      </footer>
    </div>
  );
}

/* ── Left Column: Job Description & Criteria Card ── */
function JobDescriptionCard({ vacancy, isCollapsible = false, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!vacancy) return null;

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden border-[#dde1ea] flex flex-col">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-blue-950 truncate">
              {vacancy.job_title || vacancy.designation_name || "Job Description"}
            </h3>
            {vacancy.vacancy_no && (
              <span className="text-[10px] text-blue-700 font-mono block">
                Ref: {vacancy.vacancy_no}
              </span>
            )}
          </div>
        </div>

        {isCollapsible && (
          <button
            type="button"
            onClick={() => setIsOpen((p) => !p)}
            className="text-blue-700 p-1 hover:bg-blue-100 rounded cursor-pointer transition-colors"
            aria-label="Toggle details"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Body Content */}
      {(!isCollapsible || isOpen) && (
        <div className="p-3.5 space-y-3 text-xs text-slate-700 overflow-y-auto">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department</span>
              <span className="font-semibold text-slate-800 truncate block">
                {vacancy.department_name || "General"}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Experience</span>
              <span className="font-semibold text-slate-800 truncate block">
                {vacancy.min_experience_years || 0} - {vacancy.max_experience_years || 0} Yrs
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Location</span>
              <span className="font-semibold text-slate-800 truncate block">
                {vacancy.location_name || "Any / Base"}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Work Mode</span>
              <span className="font-semibold text-slate-800 truncate block">
                {vacancy.work_mode || "Full Time"}
              </span>
            </div>
          </div>

          {/* Key Skills */}
          {vacancy.skills && vacancy.skills.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Required Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {vacancy.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-medium border ${s.is_preferred
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    <span>{s.skill_name}</span>
                    {s.is_preferred && (
                      <span className="text-[9px] font-bold text-amber-700">(Preferred)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Minimum Education */}
          {vacancy.qualifications && vacancy.qualifications.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Minimum Education</span>
              <div className="flex flex-wrap gap-1.5">
                {vacancy.qualifications.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] bg-slate-50 text-slate-700 border border-slate-200"
                  >
                    <Award className="w-2.5 h-2.5 text-slate-500" />
                    <span>{q.qualification_name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overview / Job Summary */}
          {(vacancy.job_summary || vacancy.jd_overview) && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">Role Overview</span>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                {vacancy.job_summary || vacancy.jd_overview}
              </p>
            </div>
          )}

          {/* Key Responsibilities */}
          {(vacancy.job_responsibilities || vacancy.jd_responsibilities) && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">Key Responsibilities</span>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                {vacancy.job_responsibilities || vacancy.jd_responsibilities}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PublicCandidateApply() {
  const [searchParams] = useSearchParams();
  const initialVacancyNo = searchParams.get("vacancy_no") || searchParams.get("vno") || "";
  const initialVacancyId = searchParams.get("vacancy_id") || searchParams.get("vid") || "";

  // Dynamic tenant database recognition
  const currentDb = useMemo(() => {
    const urlDb = searchParams.get("db") || searchParams.get("database");
    if (urlDb) return urlDb;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.database) return user.database;
    } catch (_) { }
    return localStorage.getItem("selectedCompany") || "LOGIXINFOTECH";
  }, [searchParams]);

  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const fileInputRef = useRef(null);

  // Load active vacancies
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchPublicActiveVacancies({ db: currentDb });
        if (isMounted && res?.data) {
          setVacancies(res.data);

          if (initialVacancyId || initialVacancyNo) {
            const matched = res.data.find(
              (v) =>
                (initialVacancyId &&
                  (v.vacancy_id || "").toLowerCase() === initialVacancyId.toLowerCase()) ||
                (initialVacancyNo &&
                  (v.vacancy_no || "").toLowerCase() === initialVacancyNo.toLowerCase())
            );
            if (matched) {
              setFormData((prev) => ({
                ...prev,
                vacancy_id: matched.vacancy_id,
                vacancy_no: matched.vacancy_no,
                job_title: matched.job_title || matched.designation_name || "Open Position",
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error loading vacancies:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialVacancyId, initialVacancyNo, currentDb]);

  const selectedVacancy = useMemo(() => {
    if (!formData.vacancy_id) return null;
    return (
      vacancies.find(
        (v) => (v.vacancy_id || "").toLowerCase() === formData.vacancy_id.toLowerCase()
      ) || null
    );
  }, [formData.vacancy_id, vacancies]);

  const handleVacancyChange = (vacId) => {
    const vac = vacancies.find((v) => v.vacancy_id === vacId);
    setFormData((prev) => ({
      ...prev,
      vacancy_id: vac?.vacancy_id || "",
      vacancy_no: vac?.vacancy_no || "",
      job_title: vac ? vac.job_title || vac.designation_name || "Open Position" : "",
    }));
  };

  const clearError = (field) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // Resume selection
  const handleResumeChange = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setErrors((p) => ({ ...p, resume: "Upload a PDF, DOC, DOCX, RTF or TXT file" }));
      return;
    }
    if (file.size > MAX_RESUME_MB * 1024 * 1024) {
      setErrors((p) => ({ ...p, resume: `File is larger than ${MAX_RESUME_MB} MB` }));
      return;
    }
    setResumeFile(file);
    clearError("resume");
  };

  const removeResume = () => {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDuplicateCheck = async () => {
    if (!formData.mobile && !formData.email) return;
    try {
      const res = await checkPublicCandidateDuplicate({
        mobile: formData.mobile,
        email: formData.email,
        vacancy_id: formData.vacancy_id || undefined,
        db: currentDb,
      });
      setDuplicateWarning(res?.exists ? res.message : null);
    } catch (_) { }
  };

  const validate = () => {
    const errs = {};
    const cleanName = formData.full_name.trim();
    const cleanMobile = formData.mobile.trim();

    if (!cleanName) errs.full_name = "Enter your full name";
    else if (cleanName.length < 2) errs.full_name = "Name must be at least 2 characters";

    if (!cleanMobile) errs.mobile = "Enter your mobile number";
    else if (cleanMobile.length !== 10) errs.mobile = "Mobile number must be 10 digits";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email, e.g. name@domain.com";
    }

    setErrors((prev) => ({ ...(prev.resume ? { resume: prev.resume } : {}), ...errs }));
    return Object.keys(errs).length === 0 && !errors.resume;
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setDuplicateWarning(null);
    removeResume();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      Swal.fire({
        icon: "warning",
        title: "Check highlighted fields",
        text: "Full Name and a valid 10-digit Mobile Number are required.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        const val = formData[key];
        if (val !== null && val !== undefined && val !== "") formPayload.append(key, val);
      });
      if (currentDb) formPayload.append("db", currentDb);
      if (resumeFile) formPayload.append("resume", resumeFile);

      const res = await submitPublicCandidateApplication(formPayload);
      if (res?.success) {
        setSubmittedData(res.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        Swal.fire({
          icon: "error",
          title: "Application not submitted",
          text: res?.message || "Something went wrong. Try again.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Application not submitted",
        text: err?.response?.data?.message || err.message || "Something went wrong. Try again.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferenceCode = async () => {
    if (!submittedData?.candidate_code) return;
    await copyToClipboard(submittedData.candidate_code);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Reference number copied",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-600">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-semibold">Loading open positions…</p>
        </div>
      </Shell>
    );
  }

  /* ── Success screen ── */
  if (submittedData) {
    return (
      <Shell>
        <div
          className="max-w-lg w-full bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center space-y-5 border"
          style={{ borderColor: ERP.border }}
        >
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold" style={{ color: ERP.heading }}>
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-slate-500">
              Thank you, <strong className="text-slate-800">{submittedData.full_name}</strong>.
              We have received your application
              {formData.job_title ? ` for ${formData.job_title}` : ""}.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Application Reference Number
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-blue-700 tracking-wider font-mono">
                {submittedData.candidate_code}
              </span>
              <button
                type="button"
                onClick={copyReferenceCode}
                aria-label="Copy reference number"
                className="p-1.5 text-slate-500 hover:text-blue-700 bg-white rounded-md border border-slate-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Quote this reference number in all recruitment communication.
            </p>
          </div>

          <p className="text-[11.5px] text-slate-600 text-left bg-blue-50/60 border border-blue-200 rounded-md p-3 leading-relaxed">
            Our hiring team will review your profile against the role criteria. Interview updates will be
            sent to your registered mobile number and email.
          </p>

          <button
            type="button"
            onClick={() => {
              setSubmittedData(null);
              resetForm();
            }}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer"
          >
            Apply for another position
          </button>
        </div>
      </Shell>
    );
  }

  const hasSelectedVacancy = !!selectedVacancy;

  /* ── Main form screen ── */
  return (
    <Shell wide={hasSelectedVacancy}>
      <div className={`${hasSelectedVacancy ? "max-w-6xl" : "max-w-2xl"} w-full space-y-3`}>
        {/* Page title card */}
        <div
          className="bg-white border rounded-lg shadow-sm px-4 py-2.5 flex items-center justify-between gap-3"
          style={{ borderColor: ERP.border }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold leading-tight" style={{ color: ERP.heading }}>
                Candidate Job Application
              </h1>
              <p className="text-[11px] text-slate-500 truncate">
                Select your desired position, enter contact info, and attach your CV.
              </p>
            </div>
          </div>
        </div>

        {/* ── Responsive Layout: 2-column on Desktop when Vacancy selected, 1-column otherwise & on mobile ── */}
        <div className={hasSelectedVacancy ? "grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start" : "space-y-3"}>

          {/* ── LEFT COLUMN (Desktop only): Job Description Card ── */}
          {hasSelectedVacancy && (
            <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-4">
              <JobDescriptionCard vacancy={selectedVacancy} isCollapsible={false} />
            </div>
          )}

          {/* ── RIGHT COLUMN (or Single Column): Form & Position Selector ── */}
          <div className={hasSelectedVacancy ? "lg:col-span-7 space-y-3" : "space-y-3"}>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>

              {/* Section 1: Position Selection */}
              <SectionCard
                title="POSITION SELECTION"
                icon={<Briefcase className="w-3 h-3" />}
                theme="indigo"
                bodyClassName="space-y-2"
              >
                <FormField label="Applying for" hint="Select from our open vacancies">
                  <select
                    value={formData.vacancy_id}
                    onChange={(e) => handleVacancyChange(e.target.value)}
                    className={`${compactInputClass(false, false)} font-medium`}
                  >
                    <option value="">General talent pool / open application</option>
                    {vacancies.map((v) => (
                      <option key={v.vacancy_id} value={v.vacancy_id}>
                        {v.job_title || v.designation_name || "Open Position"}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* ── Mobile-only vertical JD preview ── */}
                {hasSelectedVacancy && (
                  <div className="block lg:hidden mt-2">
                    <JobDescriptionCard vacancy={selectedVacancy} isCollapsible={true} defaultOpen={true} />
                  </div>
                )}
              </SectionCard>

              {/* Section 2: Candidate Details */}
              <SectionCard
                title="CANDIDATE DETAILS"
                icon={<User className="w-3 h-3" />}
                theme="indigo"
                bodyClassName="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {/* Full Name */}
                <FormField label="Full Name" required error={errors.full_name}>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={compactInputClass(false, errors.full_name)}
                  />
                </FormField>

                {/* Mobile Number */}
                <FormField label="Mobile Number (10 Digits)" required error={errors.mobile}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) =>
                      handleInputChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    onBlur={handleDuplicateCheck}
                    placeholder="10-digit mobile number"
                    autoComplete="tel-national"
                    className={`${compactInputClass(false, errors.mobile)} font-mono`}
                  />
                </FormField>

                {/* Email Address */}
                <FormField label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    maxLength={100}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={handleDuplicateCheck}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={compactInputClass(false, errors.email)}
                  />
                </FormField>

                {/* Location */}
                <FormField label="Current Location / City">
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.current_location}
                    onChange={(e) => handleInputChange("current_location", e.target.value)}
                    placeholder="e.g. Noida, Delhi"
                    autoComplete="address-level2"
                    className={compactInputClass(false, false)}
                  />
                </FormField>

                {/* Mobile-as-identifier Note */}
                <div className="sm:col-span-2 -mt-0.5 flex items-start gap-1.5 text-[10.5px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-px" />
                  <span>
                    Your mobile number is your primary ID for all recruitment tracking and updates.
                  </span>
                </div>

                {/* Duplicate Warning */}
                {duplicateWarning && (
                  <div className="sm:col-span-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-[11.5px] text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{duplicateWarning}</span>
                  </div>
                )}

                {/* Resume Upload (Compact) */}
                <div className="sm:col-span-2">
                  <FormField
                    label="Resume / CV Document"
                    hint={`PDF, DOC, DOCX up to ${MAX_RESUME_MB} MB`}
                    error={errors.resume}
                  >
                    <input
                      id="resume-input"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.rtf,.txt"
                      onChange={(e) => handleResumeChange(e.target.files?.[0])}
                      className="sr-only"
                    />
                    <div className="relative">
                      <label
                        htmlFor="resume-input"
                        className={`${compactInputClass(false, errors.resume)} flex items-center gap-1.5 cursor-pointer pr-20`}
                      >
                        <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                        {resumeFile ? (
                          <span className="truncate text-slate-800 font-medium">
                            {resumeFile.name}
                            <span className="text-slate-400 ml-1.5 text-[10.5px]">
                              ({(resumeFile.size / 1024).toFixed(0)} KB)
                            </span>
                          </span>
                        ) : (
                          <span className="truncate text-slate-400">No file chosen</span>
                        )}
                      </label>
                      <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                        {resumeFile && (
                          <button
                            type="button"
                            onClick={removeResume}
                            aria-label="Remove resume"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <label
                          htmlFor="resume-input"
                          className="px-2 py-0.5 text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                        >
                          {resumeFile ? "Change" : "Browse"}
                        </label>
                      </div>
                    </div>
                  </FormField>
                </div>
              </SectionCard>

              {/* ERP-style footer action bar */}
              <div
                className="bg-white border rounded-lg shadow-sm px-3.5 py-2 flex items-center justify-between gap-3"
                style={{ borderColor: ERP.border }}
              >
                <span className="text-[10.5px] text-slate-500">
                  <span className="text-red-500 font-bold">*</span> Required fields
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
import { showToast } from "../../../../components/Reusable/alert";
import { copyToClipboard } from "../../../../utils/helpers";
import { getActiveVacanciesWithJD, checkCandidateDuplicate } from "../../../../utils/recruitmentApi";
import config from "../../../../config";

import {
  UserCheck,
  Briefcase,
  User,
  Phone,
  Mail,
  FileText,
  Upload,
  Tag,
  Sparkles,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function CandidateRegistrationForm({
  mode = "view",
  initialData = {},
  setFormData,
  onSave,
  onCancel,
  onEditCancel,
  onDelete,
  saving,
  onModify,
  onNewEntry,
  currentRecord = 1,
  totalRecords = 1,
  rights,
  activeTab = "entry",
  onTabChange,
  onPrevRecord,
  onNextRecord,
  vacanciesList = [],
}) {
  const [localData, setLocalData] = useState(initialData || {});
  const [internalVacancies, setInternalVacancies] = useState(vacanciesList || []);
  const [resumeFile, setResumeFile] = useState(null);
  const [showJdDetails, setShowJdDetails] = useState(true);
  const [errors, setErrors] = useState({});
  const [mobileDupMsg, setMobileDupMsg] = useState("");
  const [checkingMobile, setCheckingMobile] = useState(false);
  const fileInputRef = useRef(null);
  const saveBtnRef = useRef(null);

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (vacanciesList && vacanciesList.length > 0) {
      setInternalVacancies(vacanciesList);
    } else {
      getActiveVacanciesWithJD()
        .then((res) => {
          if (res?.data) setInternalVacancies(res.data);
        })
        .catch(() => {});
    }
  }, [vacanciesList]);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    setLocalData(initialData);
  }, [initialData]);

  // Live duplicate check once a full 10-digit mobile is entered
  const mobileValue = String(localData?.mobile || "").trim();
  const candidateId = localData?.candidate_id;
  useEffect(() => {
    setMobileDupMsg("");
    if (isViewMode || !/^\d{10}$/.test(mobileValue)) {
      setCheckingMobile(false);
      return;
    }
    let cancelled = false;
    setCheckingMobile(true);
    const timer = setTimeout(async () => {
      const res = await checkCandidateDuplicate({ mobile: mobileValue, exclude_id: candidateId || undefined });
      if (cancelled) return;
      if (res?.exists) {
        const c = res.candidate || {};
        setMobileDupMsg(`Already registered: ${c.full_name || "candidate"} (${c.candidate_code || "—"})`);
      }
      setCheckingMobile(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mobileValue, candidateId, isViewMode]);

  const canSave = !!localData?.vacancy_id && !mobileDupMsg && !checkingMobile;

  const handleChange = (field, value) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    if (setFormData) setFormData(updated);
    if (errors[field]) {
      setErrors((prev) => {
        const c = { ...prev };
        delete c[field];
        return c;
      });
    }
  };

  // Selected Vacancy
  const selectedVacancy = useMemo(() => {
    if (!localData?.vacancy_id) return null;
    return (
      internalVacancies.find(
        (v) => String(v.vacancy_id || "").toLowerCase() === String(localData.vacancy_id || "").toLowerCase()
      ) || null
    );
  }, [localData?.vacancy_id, internalVacancies]);

  const handleVacancySelect = (vacId) => {
    const vac = internalVacancies.find(
      (v) => String(v.vacancy_id || "").toLowerCase() === String(vacId || "").toLowerCase()
    );
    if (vac) {
      const updated = {
        ...localData,
        vacancy_id: vac.vacancy_id,
        vacancy_no: vac.vacancy_no,
        job_title: vac.job_title || vac.designation_name || "Open Position",
      };
      setLocalData(updated);
      if (setFormData) setFormData(updated);
      if (errors.vacancy_id) {
        setErrors(({ vacancy_id, ...rest }) => rest);
      }
    } else {
      const updated = {
        ...localData,
        vacancy_id: "",
        vacancy_no: "",
        job_title: "",
      };
      setLocalData(updated);
      if (setFormData) setFormData(updated);
    }
  };

  const handleCopyPublicLink = async () => {
    let baseUrl = `${window.location.origin}/apply`;
    let userDb = "";
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      userDb = userObj?.database || localStorage.getItem("selectedCompany") || "";
    } catch (_) {}

    const params = new URLSearchParams();
    if (userDb) {
      params.set("db", userDb);
    }
    if (localData?.vacancy_no) {
      params.set("vacancy_no", localData.vacancy_no);
    }
    if (localData?.vacancy_id) {
      params.set("vacancy_id", localData.vacancy_id);
    }

    const qs = params.toString();
    const finalUrl = qs ? `${baseUrl}?${qs}` : baseUrl;
    const ok = await copyToClipboard(finalUrl);
    if (ok) {
      showToast({ icon: "success", title: "Public application link copied to clipboard!" });
    } else {
      showToast({ icon: "info", title: "Link generated (Check console/prompt)" });
    }
  };

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    if (!localData?.full_name?.trim()) {
      newErrors.full_name = "Full name is required";
    }
    const mobile = String(localData?.mobile || "").trim();
    if (!mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    } else if (mobileDupMsg) {
      newErrors.mobile = mobileDupMsg;
    }
    if (!localData?.vacancy_id) {
      newErrors.vacancy_id = "Please select a position / vacancy";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast({ icon: "warning", title: "Please fill the required fields" });
      return;
    }

    onSave && onSave(localData, resumeFile);
  }, [isViewMode, localData, resumeFile, onSave, mobileDupMsg]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#eef1f8] font-sans">
      {/* ── Standard ERP Header ── */}
      <ERPHeader
        title="CANDIDATE REGISTRATION"
        TitleIcon={UserCheck}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
        rightContent={
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="flex items-center gap-1.5 h-[28px] px-2.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 rounded-md transition-all shadow-2xs cursor-pointer"
            title="Copy public career application link for candidates"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Copy Public Link</span>
          </button>
        }
      />

      {/* ── Centered Form Container ── */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className={`w-full mx-auto space-y-3 ${selectedVacancy ? "max-w-[1200px]" : "max-w-[760px]"}`}>
          
          {/* Top Status & Code Ribbon */}
          <div className="bg-white border border-[#dde1ea] rounded-md px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Candidate Code:</span>
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {localData?.candidate_code || (isAddMode ? "(Auto-Generated)" : "—")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Pipeline Stage:</span>
                <span className="font-semibold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {localData?.pipeline_status || "Raw Data"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    localData?.candidate_status === "Active" || !localData?.candidate_status
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}
                >
                  {localData?.candidate_status || "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Role criteria on the left, form on the right (stacks on small screens) */}
          <div
            className={
              selectedVacancy
                ? "grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-3 items-start"
                : ""
            }
          >
          {selectedVacancy && (
            <aside className="bg-white border border-blue-200 rounded-md shadow-2xs overflow-hidden lg:sticky lg:top-0">
              <div
                onClick={() => setShowJdDetails((p) => !p)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-blue-900 truncate" title={`${selectedVacancy.job_title} (${selectedVacancy.vacancy_no})`}>
                    Role Criteria: {selectedVacancy.job_title} ({selectedVacancy.vacancy_no})
                  </span>
                </div>
                <button type="button" className="text-blue-700 shrink-0">
                  {showJdDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showJdDetails && (
                <div className="p-3 space-y-2.5 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase block">Department</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{selectedVacancy.department_name || "—"}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase block">Experience</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {selectedVacancy.min_experience_years || 0} - {selectedVacancy.max_experience_years || 0} Yrs
                      </span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase block">Location / Mode</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {selectedVacancy.location_name || "—"} ({selectedVacancy.work_mode || "On-site"})
                      </span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase block">Budget CTC</span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {selectedVacancy.min_ctc ? `₹${(selectedVacancy.min_ctc / 100000).toFixed(1)}L` : "—"} -{" "}
                        {selectedVacancy.max_ctc ? `₹${(selectedVacancy.max_ctc / 100000).toFixed(1)}L` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Required Skills */}
                  {selectedVacancy.skills && selectedVacancy.skills.length > 0 && (
                    <div>
                      <span className="text-[10.5px] font-bold text-slate-600 block mb-1">Required Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedVacancy.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              s.is_preferred
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>{s.skill_name}</span>
                            {s.is_preferred && <span className="text-[8.5px] font-bold text-amber-600">(Preferred)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overview */}
                  {(selectedVacancy.job_summary || selectedVacancy.jd_overview) && (
                    <p className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] text-slate-600 line-clamp-[8] leading-relaxed">
                      {selectedVacancy.job_summary || selectedVacancy.jd_overview}
                    </p>
                  )}
                </div>
              )}
            </aside>
          )}

          <div className="space-y-3 min-w-0">
          {/* Section 1: Candidate Information */}
          <SectionCard
            title="CANDIDATE INFORMATION"
            icon={<User className="w-3 h-3" />}
            theme="indigo"
            bodyClassName="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {/* Full Name */}
            <FormField label="Full Name" required={!isViewMode} error={errors.full_name}>
              <input
                type="text"
                readOnly={isViewMode}
                maxLength={100}
                value={localData?.full_name || ""}
                onChange={(e) =>
                  handleChange("full_name", e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))
                }
                placeholder="Enter full name"
                className={formInputClass(isViewMode, errors.full_name)}
              />
            </FormField>

            {/* Mobile Number */}
            <FormField
              label="Mobile Number"
              required={!isViewMode}
              error={errors.mobile || mobileDupMsg}
              hint={checkingMobile ? "checking..." : "10 digits"}
            >
              <input
                type="tel"
                inputMode="numeric"
                readOnly={isViewMode}
                maxLength={10}
                value={localData?.mobile || ""}
                onChange={(e) =>
                  handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                className={`${formInputClass(isViewMode, errors.mobile || mobileDupMsg)} font-mono`}
              />
            </FormField>

            {/* Email Address */}
            <FormField label="Email Address">
              <input
                type="email"
                readOnly={isViewMode}
                maxLength={100}
                value={localData?.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="name@example.com"
                className={formInputClass(isViewMode, errors.email)}
              />
            </FormField>

            {/* Apply For Position / Vacancy */}
            <FormField label="Apply For Position / Vacancy" required={!isViewMode} error={errors.vacancy_id}>
              {isViewMode ? (
                <input
                  type="text"
                  readOnly
                  value={
                    localData?.job_title
                      ? `${localData.job_title} ${localData.vacancy_no ? `(${localData.vacancy_no})` : ""}`
                      : "General Talent Pool (No Vacancy Assigned)"
                  }
                  className={`${formInputClass(true, false)} font-medium text-slate-800`}
                />
              ) : (
                <select
                  value={localData?.vacancy_id || ""}
                  onChange={(e) => handleVacancySelect(e.target.value)}
                  className={`${formInputClass(false, errors.vacancy_id)} font-medium`}
                >
                  <option value="" disabled>-- Select Position / Vacancy --</option>
                  {internalVacancies.map((v) => (
                    <option key={v.vacancy_id} value={v.vacancy_id}>
                      {v.job_title || v.designation_name || "Open Position"} {v.vacancy_no ? `(${v.vacancy_no})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </SectionCard>

          {/* Section 2: Resume / CV Document */}
          <SectionCard
            title="RESUME / CV DOCUMENT"
            icon={<FileText className="w-3 h-3" />}
            theme="sky"
            bodyClassName="space-y-2"
          >
            {isViewMode ? (
              <div>
                {localData?.resume_file_path ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-bold text-emerald-900 block truncate">
                          {localData.resume_file_name || "Candidate_CV.pdf"}
                        </span>
                        <span className="text-[10px] text-emerald-600">Attached Document</span>
                      </div>
                    </div>
                    <a
                      href={`${config.apiUrl}${localData.resume_file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 shrink-0 transition-colors"
                    >
                      View / Download
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400">
                    No Resume / CV document attached.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf, .doc, .docx, .rtf, .txt"
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      showToast({ icon: "warning", title: "Resume file size cannot exceed 2 MB" });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      return;
                    }
                    setResumeFile(file);
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-md p-3.5 text-center cursor-pointer transition-colors ${
                    resumeFile
                      ? "border-emerald-400 bg-emerald-50/40"
                      : "border-slate-300 hover:border-blue-400 bg-slate-50"
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  {resumeFile ? (
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">{resumeFile.name}</span>
                      <span className="text-[10px] text-slate-500">
                        ({(resumeFile.size / 1024).toFixed(1)} KB) - Ready to upload
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">
                        Click to select CV (.pdf, .doc, .docx)
                      </span>
                      <span className="text-[10px] text-slate-400">Max size 2MB</span>
                    </div>
                  )}
                </div>

                {localData?.resume_file_path && !resumeFile && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>
                      Currently saved:{" "}
                      <strong className="text-slate-700">
                        {localData.resume_file_name || "Candidate CV"}
                      </strong>
                    </span>
                    <a
                      href={`${config.apiUrl}${localData.resume_file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      View Current
                    </a>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
          </div>
          </div>
        </div>
      </div>

      {/* ── Standard ERP Footer (Pinned with correct mode props) ── */}
      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saveBtnRef={saveBtnRef}
        saving={saving || !canSave}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
        formData={localData}
      />
    </div>
  );
}

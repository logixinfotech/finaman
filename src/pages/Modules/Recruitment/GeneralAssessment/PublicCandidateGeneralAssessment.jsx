import React, { useState, useEffect } from "react";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  DollarSign,
  Clock,
  MapPin,
  Laptop,
  Send,
  ChevronRight,
  ChevronLeft,
  Building2,
  Layers,
  Check,
  Loader2,
  HelpCircle,
} from "lucide-react";
import axios from "axios";
import config from "../../../../config";
import { showToast } from "../../../../components/Reusable/alert";

const ERP = {
  navy: "#0f2137",
  page: "#f0f4f9",
};

const FONT = `'Inter', 'Segoe UI', system-ui, Arial, sans-serif`;

const publicClient = axios.create({
  baseURL: config.apiUrl || "http://localhost:63554",
  timeout: 30000,
});

const SECTIONS = [
  { id: 1, label: "Personal & General", icon: User },
  { id: 2, label: "Academic Profile", icon: GraduationCap },
  { id: 3, label: "Experience & CTC", icon: Briefcase },
  { id: 4, label: "Domain & Industry", icon: Building2 },
  { id: 5, label: "Role Competencies", icon: Award },
];

export default function PublicCandidateGeneralAssessment() {
  const [screen, setScreen] = useState("loading"); // loading | verify | instructions | test | submitted | error
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Parse URL search parameters for db, vid, vno
  const searchParams = new URLSearchParams(window.location.search);
  const db = searchParams.get("db") || searchParams.get("database") || "";
  const vidParam = searchParams.get("vid") || searchParams.get("vacancy_id") || "";
  const vnoParam = searchParams.get("vno") || searchParams.get("vacancy_no") || "";

  // Vacancy Data
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState(vidParam);
  const [vacancyInfo, setVacancyInfo] = useState(null);

  // Verification & Candidate Form
  const [verifyForm, setVerifyForm] = useState({
    mobile: "",
    full_name: "",
    email: "",
  });
  const [verifyError, setVerifyError] = useState("");
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);

  // Active Section inside Test
  const [activeSection, setActiveSection] = useState(1);

  // Form State (25 LOGIX General Assessment Criteria)
  const [formData, setFormData] = useState({
    // 1. Personal & General Eligibility
    full_name: "",
    mobile: "",
    email: "",
    dob: "",
    open_to_relocate: "Yes",
    laptop_available: "Yes",

    // 2. Academic & Education Profile
    highest_qualification: "Bachelor of Technology (B.Tech)",
    tenth_percentage: "75",
    twelfth_percentage: "75",
    graduation_percentage: "70",
    pg_percentage: "",
    college_name: "Recognized University / College",

    // 3. Compensation & Experience
    current_ctc: "300000",
    expected_ctc: "360000",
    total_experience_years: "2",
    relevant_work_experience: "Relevant",
    notice_period_days: "30",

    // 4. Domain & Background
    current_company: "",
    current_company_industry: "Information Technology",
    current_designation: "",
    current_department: "",
    previous_company_products: "Relevant ERP / Software",

    // 5. Skills & Specific Competencies
    agree_for_bond: "Yes",
    willing_to_travel: "Yes",
    erp_knowledge: "Basic ERP",
    languages_known: "English, Hindi",
    email_chat_handling: "Strong / Professional",
    ms_office_knowledge: "Strong Practical Knowledge (Excel Formulas, Docs)",
    programming_languages: "",
    monthly_sales_target: "",
  });

  // Initial Load: Fetch Vacancies & Position info with tenant database
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setScreen("loading");
        const res = await publicClient.get("/api/public/general-assessment/info", {
          params: { db, vid: vidParam, vno: vnoParam },
          headers: { "x-database": db, "x-db": db },
        });
        if (res.data?.success) {
          if (res.data.vacancy) {
            setVacancyInfo(res.data.vacancy);
            setSelectedVacancyId(res.data.vacancy.vacancy_id);
          } else if (res.data.vacancies && res.data.vacancies.length > 0) {
            setVacancies(res.data.vacancies);
            setSelectedVacancyId(res.data.vacancies[0].vacancy_id);
            setVacancyInfo(res.data.vacancies[0]);
          }
          setScreen("verify");
        } else {
          setErrorMessage(res.data?.message || "Assessment information not available.");
          setScreen("error");
        }
      } catch (err) {
        console.warn("fetchInfo error:", err);
        setScreen("verify");
      }
    };
    fetchInfo();
  }, [db, vidParam, vnoParam]);

  // Step 1: Handle Candidate Verification
  const handleVerifyCandidate = async (e) => {
    e.preventDefault();
    setVerifyError("");

    const cleanMob = verifyForm.mobile.trim().replace(/\D/g, "");
    if (cleanMob.length !== 10) {
      setVerifyError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!verifyForm.full_name || verifyForm.full_name.trim().length < 2) {
      setVerifyError("Please enter your full name");
      return;
    }
    if (!verifyForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifyForm.email.trim())) {
      setVerifyError("Please enter a valid email address");
      return;
    }
    if (!selectedVacancyId && vacancies.length > 0) {
      setVerifyError("Please select the position you are applying for");
      return;
    }

    setLoading(true);
    try {
      const res = await publicClient.post(
        "/api/public/general-assessment/verify-candidate",
        {
          db,
          mobile: cleanMob,
          vacancy_id: selectedVacancyId,
        },
        {
          headers: { "x-database": db, "x-db": db },
          params: { db },
        }
      );

      if (res.data?.success && res.data.candidate) {
        const c = res.data.candidate;
        setVerifiedCandidate(c);
        setFormData((prev) => ({
          ...prev,
          mobile: cleanMob,
          full_name: verifyForm.full_name.trim() || c?.candidate_name || prev.full_name,
          email: verifyForm.email.trim() || c?.email || prev.email,
          dob: c?.dob ? String(c.dob).split("T")[0] : prev.dob,
          highest_qualification: c?.highest_qualification || prev.highest_qualification,
          total_experience_years: c?.total_experience_years
            ? String(c.total_experience_years)
            : prev.total_experience_years,
          current_ctc: c?.current_ctc ? String(c.current_ctc) : prev.current_ctc,
          expected_ctc: c?.expected_ctc ? String(c.expected_ctc) : prev.expected_ctc,
          notice_period_days: c?.notice_period_days
            ? String(c.notice_period_days)
            : prev.notice_period_days,
          current_company: c?.current_company || prev.current_company,
          current_designation: c?.current_designation || prev.current_designation,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          mobile: cleanMob,
          full_name: verifyForm.full_name.trim(),
          email: verifyForm.email.trim(),
        }));
      }
      setScreen("instructions");
    } catch (err) {
      console.warn("verify-candidate fallback:", err);
      setFormData((prev) => ({
        ...prev,
        mobile: cleanMob,
        full_name: verifyForm.full_name.trim(),
        email: verifyForm.email.trim(),
      }));
      setScreen("instructions");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Step 3: Handle Final Submission with tenant db passed cleanly
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.full_name || !formData.mobile || !formData.email) {
      showToast({ icon: "error", title: "Please fill all required personal details" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        db,
        vacancy_id: selectedVacancyId || vacancyInfo?.vacancy_id,
        candidate_id: verifiedCandidate?.candidate_id || null,
        personal_details: {
          full_name: formData.full_name,
          mobile: formData.mobile,
          email: formData.email,
          dob: formData.dob,
          open_to_relocate: formData.open_to_relocate,
          laptop_available: formData.laptop_available,
        },
        academic_details: {
          highest_qualification: formData.highest_qualification,
          tenth_percentage: formData.tenth_percentage,
          twelfth_percentage: formData.twelfth_percentage,
          graduation_percentage: formData.graduation_percentage,
          pg_percentage: formData.pg_percentage,
          college_name: formData.college_name,
        },
        experience_details: {
          current_ctc: formData.current_ctc,
          expected_ctc: formData.expected_ctc,
          total_experience_years: formData.total_experience_years,
          relevant_work_experience: formData.relevant_work_experience,
          notice_period_days: formData.notice_period_days,
        },
        domain_details: {
          current_company: formData.current_company,
          current_company_industry: formData.current_company_industry,
          current_designation: formData.current_designation,
          current_department: formData.current_department,
          previous_company_products: formData.previous_company_products,
        },
        skills_details: {
          agree_for_bond: formData.agree_for_bond,
          willing_to_travel: formData.willing_to_travel,
          erp_knowledge: formData.erp_knowledge,
          languages_known: formData.languages_known,
          email_chat_handling: formData.email_chat_handling,
          ms_office_knowledge: formData.ms_office_knowledge,
          programming_languages: formData.programming_languages,
          monthly_sales_target: formData.monthly_sales_target,
        },
      };

      const res = await publicClient.post("/api/public/general-assessment/submit", payload, {
        params: { db },
        headers: { "x-database": db, "x-db": db },
      });

      if (res.data?.success) {
        setScreen("submitted");
      } else {
        showToast({ icon: "error", title: res.data?.message || "Submission failed" });
      }
    } catch (err) {
      console.error("Submission error:", err);
      showToast({
        icon: "error",
        title: err.response?.data?.message || err.message || "Failed to submit assessment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full h-10 px-3.5 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-colors";
  const selectCls =
    "w-full h-10 px-3 text-xs sm:text-[13px] bg-white border border-slate-300 rounded-md outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 font-medium text-slate-800 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-700 mb-1";

  // ── Render 1: Loading ──
  if (screen === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9]" style={{ fontFamily: FONT }}>
        <div className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-3 text-xs font-semibold text-slate-700 border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading Assessment Portal...</span>
        </div>
      </div>
    );
  }

  // ── Render 2: Error ──
  if (screen === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] p-4" style={{ fontFamily: FONT }}>
        <div className="bg-white rounded-xl shadow-md max-w-md w-full p-6 text-center space-y-4 border border-slate-200">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Assessment Link Unavailable</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 border-t">
            If you believe this is an error, please contact the recruitment team.
          </div>
        </div>
      </div>
    );
  }

  // ── Render 3: Submitted Confirmation ──
  if (screen === "submitted") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f4f9]" style={{ fontFamily: FONT }}>
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wide block">FINAMAN ERP</span>
              <span className="text-[10px] text-slate-300">Careers & Assessment Portal</span>
            </div>
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-slate-200 font-medium">
              Assessment Submitted
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md max-w-lg w-full p-6 sm:p-8 text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">General Assessment Submitted!</h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Thank you for completing the Candidate Assessment. Your responses have been securely recorded.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Applicant:</span>
                <strong className="text-slate-900">{formData.full_name}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Position Applied:</span>
                <strong className="text-blue-700">{vacancyInfo?.job_role || "Job Opening"}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mobile Number:</span>
                <span className="font-mono text-slate-800">{formData.mobile}</span>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 text-left space-y-1">
              <span className="font-bold block">What happens next?</span>
              <p className="text-[11.5px] text-blue-800 leading-relaxed">
                Our hiring team will evaluate your submission. If shortlisted, you will receive an invitation for the next interview round via Email / Call.
              </p>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t">
              You may now safely close this browser window.
            </div>
          </div>
        </main>

        <footer className="text-center text-[10.5px] text-slate-400 py-3 shrink-0">
          © {new Date().getFullYear()} FINAMAN ERP Recruitment Portal. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── Render 4: Step 1 - User Verification Screen ──
  if (screen === "verify") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f4f9]" style={{ fontFamily: FONT }}>
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wide block">FINAMAN ERP</span>
              <span className="text-[10px] text-slate-300">Careers & Assessment Portal</span>
            </div>
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-slate-200 font-medium">
              Candidate Verification
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleVerifyCandidate}
            noValidate
            className="bg-white rounded-xl shadow-md max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200"
          >
            <div className="border-b border-slate-100 pb-3.5">
              <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">
                CANDIDATE PORTAL
              </span>
              <h1 className="text-lg font-bold text-slate-900 mt-1">
                Candidate General Assessment
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Please enter your details below to verify and begin your assessment.
              </p>
            </div>

            {/* Position Selection if multiple */}
            {vacancies.length > 1 && (
              <div>
                <label className={labelCls}>
                  Applying Position / Job Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVacancyId}
                  onChange={(e) => {
                    setSelectedVacancyId(e.target.value);
                    const vac = vacancies.find((v) => v.vacancy_id === e.target.value);
                    if (vac) setVacancyInfo(vac);
                  }}
                  className={selectCls}
                >
                  {vacancies.map((v) => (
                    <option key={v.vacancy_id} value={v.vacancy_id}>
                      {v.job_role} ({v.vacancy_no}) - {v.department_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {vacancyInfo && vacancies.length <= 1 && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-md p-2.5 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Applying Role:</span>
                  <span className="font-bold">{vacancyInfo.job_role || vacancyInfo.vacancy_no}</span>
                </div>
                {vacancyInfo.location_name && (
                  <span className="text-[10.5px] text-blue-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {vacancyInfo.location_name}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className={labelCls}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={verifyForm.full_name}
                maxLength={100}
                onChange={(e) =>
                  setVerifyForm((p) => ({
                    ...p,
                    full_name: e.target.value.replace(/[^a-zA-Z\s.-]/g, ""),
                  }))
                }
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className={labelCls}>
                Primary Mobile Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                className={`${inputCls} font-mono`}
                inputMode="numeric"
                value={verifyForm.mobile}
                maxLength={10}
                onChange={(e) =>
                  setVerifyForm((p) => ({
                    ...p,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className={labelCls}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                type="email"
                value={verifyForm.email}
                maxLength={100}
                onChange={(e) => setVerifyForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>

            {verifyError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{verifyError}</div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify & Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </main>

        <footer className="text-center text-[10.5px] text-slate-400 py-3 shrink-0">
          © {new Date().getFullYear()} FINAMAN ERP Recruitment Portal. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── Render 5: Step 2 - Instructions & Overview Screen ──
  if (screen === "instructions") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f4f9]" style={{ fontFamily: FONT }}>
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wide block">FINAMAN ERP</span>
              <span className="text-[10px] text-slate-300">Careers & Assessment Portal</span>
            </div>
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-slate-200 font-medium">
              Candidate Evaluation
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="border-b pb-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Welcome, {formData.full_name || "Candidate"}
              </span>
              <h1 className="text-lg font-bold text-slate-900 mt-1">
                Candidate General Assessment
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Applying for:{" "}
                <strong className="text-slate-800">
                  {vacancyInfo?.job_role || "Selected Position"} ({vacancyInfo?.vacancy_no || "General"})
                </strong>
              </p>
            </div>

            {/* Test Metadata Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">15 - 20 Mins</span>
                <span className="text-[10px] text-slate-500">Estimated Duration</span>
              </div>
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">25 Criteria</span>
                <span className="text-[10px] text-slate-500">5 Form Sections</span>
              </div>
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">45 Marks</span>
                <span className="text-[10px] text-slate-500">Evaluation Score</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-1.5 text-xs text-amber-900">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Important Instructions:
              </span>
              <ul className="list-disc list-inside text-[11.5px] space-y-1 text-amber-800 leading-relaxed">
                <li>Complete all 5 sections accurately to reflect your educational background and work history.</li>
                <li>Enter exact educational percentages and compensation details for correct automated scoring.</li>
                <li>You can navigate between sections using the Previous/Next buttons or the section tabs.</li>
                <li>Click "Submit General Assessment" on the final section to complete your submission.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between border-t">
              <button
                type="button"
                onClick={() => setScreen("verify")}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={() => setScreen("test")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Start Assessment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-[10.5px] text-slate-400 py-3 shrink-0">
          © {new Date().getFullYear()} FINAMAN ERP Recruitment Portal. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── Render 6: Step 3 - Active Test Question Form in Sections (Compact & Well-spaced) ──
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f9]" style={{ fontFamily: FONT }}>
      {/* ── Top Header ── */}
      <header style={{ background: ERP.navy }} className="py-2.5 px-4 shadow-sm text-white shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-wide">Candidate General Assessment</span>
            <span className="text-[10px] text-slate-300 block">
              Applicant: <strong>{formData.full_name}</strong> · Role: {vacancyInfo?.job_role || "General Position"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-md text-xs font-medium text-slate-200">
            <span>Section {activeSection} of {SECTIONS.length}</span>
          </div>
        </div>
      </header>

      {/* ── Main Form Container ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-3">
        {/* Section Navigation Ribbon */}
        <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isCurrent = activeSection === sec.id;
              const isPast = activeSection > sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : isPast
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{sec.label}</span>
                  <span className="sm:hidden">{sec.id}</span>
                  {isPast && <Check className="w-3 h-3 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap pl-2">
            Section {activeSection} / {SECTIONS.length}
          </span>
        </div>

        {/* ── Active Section Card (Clean, compact, no excessive bottom spacing) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-6 space-y-4">
          {/* SECTION 1: Personal & General Eligibility */}
          {activeSection === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  1. Personal & General Eligibility
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>A. Date of Birth / Age *</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>B. Open to Relocate? *</label>
                  <select
                    value={formData.open_to_relocate}
                    onChange={(e) => handleInputChange("open_to_relocate", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Yes">Yes (Fully Open / Local)</option>
                    <option value="No">No (Strictly Not Relocating)</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>C. Laptop / System Available? *</label>
                  <select
                    value={formData.laptop_available}
                    onChange={(e) => handleInputChange("laptop_available", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Yes">Yes (Has Working Laptop)</option>
                    <option value="No">No (Requires Office System)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Academic & Education Profile */}
          {activeSection === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  2. Academic & Education Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>D. Highest Qualification *</label>
                  <input
                    type="text"
                    value={formData.highest_qualification}
                    onChange={(e) => handleInputChange("highest_qualification", e.target.value)}
                    placeholder="e.g. B.Tech Computer Science, B.Com, MBA"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>I. College / University Tier *</label>
                  <select
                    value={formData.college_name}
                    onChange={(e) => handleInputChange("college_name", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Tier-1 (IIT/IIM/NIT/BITS)">Tier-1 (IIT / IIM / NIT / Top Govt)</option>
                    <option value="Tier-2 (Reputed State/Pvt)">Tier-2 (Reputed State / Pvt Univ)</option>
                    <option value="Recognized University / College">Recognized University / College</option>
                    <option value="Distance / Open University">Distance / Open University</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>E. 10th Percentage (%) *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.tenth_percentage}
                    onChange={(e) => handleInputChange("tenth_percentage", e.target.value)}
                    placeholder="e.g. 75"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>F. 12th / Diploma Percentage (%) *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.twelfth_percentage}
                    onChange={(e) => handleInputChange("twelfth_percentage", e.target.value)}
                    placeholder="e.g. 75"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>G. Graduation Percentage (%) *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.graduation_percentage}
                    onChange={(e) => handleInputChange("graduation_percentage", e.target.value)}
                    placeholder="e.g. 70"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>H. Post-Graduation % (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pg_percentage}
                    onChange={(e) => handleInputChange("pg_percentage", e.target.value)}
                    placeholder="e.g. 72"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Experience & Compensation */}
          {activeSection === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-1.5 h-4 bg-purple-600 rounded-full"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  3. Experience & Compensation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>J. Total Experience (Years) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.total_experience_years}
                    onChange={(e) => handleInputChange("total_experience_years", e.target.value)}
                    placeholder="e.g. 2.5"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>K. Relevant Work Experience *</label>
                  <select
                    value={formData.relevant_work_experience}
                    onChange={(e) => handleInputChange("relevant_work_experience", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Relevant">Directly Relevant Experience</option>
                    <option value="Partially Relevant">Partially Relevant / Adjacent</option>
                    <option value="Different Domain">Different Domain / Career Switch</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>L. Notice Period *</label>
                  <select
                    value={formData.notice_period_days}
                    onChange={(e) => handleInputChange("notice_period_days", e.target.value)}
                    className={selectCls}
                  >
                    <option value="0">Immediate Joiner (0 Days)</option>
                    <option value="15">15 Days</option>
                    <option value="30">30 Days (1 Month)</option>
                    <option value="60">60 Days (2 Months)</option>
                    <option value="90">90 Days (3 Months)</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>M. Current Annual CTC (₹) *</label>
                  <input
                    type="number"
                    value={formData.current_ctc}
                    onChange={(e) => handleInputChange("current_ctc", e.target.value)}
                    placeholder="e.g. 300000"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>N. Expected Annual CTC (₹) *</label>
                  <input
                    type="number"
                    value={formData.expected_ctc}
                    onChange={(e) => handleInputChange("expected_ctc", e.target.value)}
                    placeholder="e.g. 360000"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Domain & Background */}
          {activeSection === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-1.5 h-4 bg-amber-600 rounded-full"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  4. Domain & Industry Background
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>O. Current / Last Company Name</label>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={(e) => handleInputChange("current_company", e.target.value)}
                    placeholder="e.g. Tech Corp Ltd."
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>P. Current Company Industry / Sector</label>
                  <select
                    value={formData.current_company_industry}
                    onChange={(e) => handleInputChange("current_company_industry", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Information Technology">Information Technology / Software</option>
                    <option value="Manufacturing / Core">Manufacturing / Industrial</option>
                    <option value="Services / Consulting">Services / Financial / Consulting</option>
                    <option value="Other">Other Sector</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Q. Current Designation</label>
                  <input
                    type="text"
                    value={formData.current_designation}
                    onChange={(e) => handleInputChange("current_designation", e.target.value)}
                    placeholder="e.g. Software Engineer, Sales Executive"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>R. Previous Company Products / Domain Fit</label>
                  <select
                    value={formData.previous_company_products}
                    onChange={(e) => handleInputChange("previous_company_products", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Relevant ERP / Software">Relevant ERP / B2B Software</option>
                    <option value="Consumer / B2C">Consumer / B2C Products</option>
                    <option value="Non-Tech">Non-Tech / Traditional Goods</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: Role-Specific Technical & Practical Competencies */}
          {activeSection === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-1.5 h-4 bg-teal-600 rounded-full"></div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  5. Role-Specific & Practical Competencies
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>S. 12-Month Service Bond Agreement *</label>
                  <select
                    value={formData.agree_for_bond}
                    onChange={(e) => handleInputChange("agree_for_bond", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Yes">Yes (Agreed to 12-Month Service Agreement)</option>
                    <option value="No">No (Disagree)</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>T. Willingness to Travel for Role *</label>
                  <select
                    value={formData.willing_to_travel}
                    onChange={(e) => handleInputChange("willing_to_travel", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Yes">Yes (Willing to Travel as required)</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>U. ERP & Software Knowledge *</label>
                  <select
                    value={formData.erp_knowledge}
                    onChange={(e) => handleInputChange("erp_knowledge", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Hands-on ERP Experience">Hands-on Working Experience (ERP/CRM)</option>
                    <option value="Basic ERP">Basic Conceptual Understanding</option>
                    <option value="No ERP Experience">No Prior ERP Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>V. Languages Known *</label>
                  <input
                    type="text"
                    value={formData.languages_known}
                    onChange={(e) => handleInputChange("languages_known", e.target.value)}
                    placeholder="e.g. English, Hindi, Marathi"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>W. Email & Chat Handling Proficiency *</label>
                  <select
                    value={formData.email_chat_handling}
                    onChange={(e) => handleInputChange("email_chat_handling", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Strong / Professional">Strong / Professional Business Communication</option>
                    <option value="Average">Acceptable Writing Skills</option>
                    <option value="Poor">Basic / Minimal</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>X. MS Excel / Word / Docs Proficiency *</label>
                  <select
                    value={formData.ms_office_knowledge}
                    onChange={(e) => handleInputChange("ms_office_knowledge", e.target.value)}
                    className={selectCls}
                  >
                    <option value="Strong Practical Knowledge (Excel Formulas, Docs)">
                      Strong (Formulas, VLOOKUP, Pivots, Docs)
                    </option>
                    <option value="Basic Entry">Basic Entry & Formatting</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Y. Programming Languages (If Tech Role)</label>
                  <input
                    type="text"
                    value={formData.programming_languages}
                    onChange={(e) => handleInputChange("programming_languages", e.target.value)}
                    placeholder="e.g. JavaScript, React, SQL, Node"
                    className={inputCls}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Z. Monthly Sales Target Track Record (If Sales Role)</label>
                  <input
                    type="text"
                    value={formData.monthly_sales_target}
                    onChange={(e) => handleInputChange("monthly_sales_target", e.target.value)}
                    placeholder="e.g. Achieved 100%+ monthly target of ₹5 Lakhs"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Section Navigation Actions Bar (Placed right below fields, no empty gap) ── */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={() => setActiveSection((p) => Math.max(1, p - 1))}
              disabled={activeSection === 1}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous Section
            </button>

            <div>
              {activeSection < SECTIONS.length ? (
                <button
                  type="button"
                  onClick={() => setActiveSection((p) => Math.min(SECTIONS.length, p + 1))}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Section</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to submit your General Assessment? Please confirm that all details are correct."
                      )
                    ) {
                      handleSubmit();
                    }
                  }}
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit General Assessment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-[10.5px] text-slate-400 py-3 shrink-0">
        © {new Date().getFullYear()} FINAMAN ERP Recruitment Portal. All rights reserved.
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  X, CheckCircle2, AlertCircle, Award, Briefcase, User, Calendar, 
  Sparkles, Save, RefreshCw, Layers, ShieldCheck, ChevronRight, Calculator
} from "lucide-react";
import { api } from "../../../../utils/api";
import { evaluateGeneralAssessment } from "./logixGeneralAssessmentRules";
import { showToast } from "../../../../components/Reusable/alert";

export default function GeneralAssessmentModal({
  assessmentId,
  initialCandidate,
  initialVacancy,
  onClose,
  onSaved
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Header details
  const [candidate, setCandidate] = useState(initialCandidate || null);
  const [vacancy, setVacancy] = useState(initialVacancy || null);
  const [vacanciesList, setVacanciesList] = useState([]);
  const [candidatesList, setCandidatesList] = useState([]);

  // Candidate Answers / Inputs
  const [formAnswers, setFormAnswers] = useState({
    dob: "",
    open_to_relocate: "Yes",
    laptop_available: "Yes",
    highest_qualification: "Graduate",
    tenth_percentage: "80",
    twelfth_percentage: "75",
    graduation_percentage: "70",
    pg_percentage: "",
    college_name: "Standard Recognized University",
    current_ctc: "300000",
    expected_ctc: "350000",
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
    ms_office_knowledge: "Basic",
    programming_languages: "",
    monthly_sales_target: ""
  });

  const [evaluation, setEvaluation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusOverride, setStatusOverride] = useState("");

  // Load Metadata or Single Assessment details
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (assessmentId) {
          const res = await api.get(`/api/recruitment/general-assessment/${assessmentId}`);
          if (res.data?.success && res.data.data) {
            const data = res.data.data;
            setCandidate({
              candidate_id: data.candidate_id,
              candidate_code: data.candidate_code,
              candidate_name: data.candidate_name,
              mobile: data.candidate_mobile,
              email: data.candidate_email
            });
            setVacancy({
              vacancy_id: data.vacancy_id,
              vacancy_no: data.vacancy_no,
              job_role: data.job_role,
              department_name: data.department_name
            });
            setRemarks(data.evaluation_remarks || "");
            setStatusOverride(data.evaluation_status || "");

            // Reconstruct form answers if available in responses_json
            if (data.answers && Array.isArray(data.answers)) {
              setEvaluation({
                applicable_max_marks: data.applicable_max_marks,
                obtained_marks: data.obtained_marks,
                percentage: data.percentage,
                evaluation_status: data.evaluation_status,
                answers: data.answers
              });
            }
          }
        } else {
          // Load meta dropdowns
          const metaRes = await api.get("/api/recruitment/general-assessment/meta");
          if (metaRes.data?.success) {
            setVacanciesList(metaRes.data?.data?.vacancies || []);
            setCandidatesList(metaRes.data?.data?.candidates || []);
            
            if (!vacancy && metaRes.data?.data?.vacancies?.length) {
              handleSelectVacancy(metaRes.data.data.vacancies[0].vacancy_id);
            }
          }
        }
      } catch (err) {
        console.error("GeneralAssessmentModal init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [assessmentId]);

  // When vacancy changes, load dynamic JD criteria
  const handleSelectVacancy = async (vid) => {
    if (!vid) return;
    try {
      const res = await api.get(`/api/recruitment/general-assessment/vacancy-criteria/${vid}`);
      if (res.data?.success) {
        setVacancy(res.data.data);
      }
    } catch (e) {
      console.error("handleSelectVacancy error:", e);
    }
  };

  // When candidate changes, auto-fill defaults
  const handleSelectCandidate = async (cid) => {
    if (!cid) return;
    try {
      const res = await api.get(`/api/recruitment/general-assessment/candidate-data/${cid}`);
      if (res.data?.success) {
        const c = res.data.data;
        setCandidate(c);
        setFormAnswers((prev) => ({
          ...prev,
          dob: c.dob ? String(c.dob).split("T")[0] : prev.dob,
          highest_qualification: c.highest_qualification || prev.highest_qualification,
          total_experience_years: c.total_experience_years ? String(c.total_experience_years) : prev.total_experience_years,
          current_ctc: c.current_ctc ? String(c.current_ctc) : prev.current_ctc,
          expected_ctc: c.expected_ctc ? String(c.expected_ctc) : prev.expected_ctc,
          notice_period_days: c.notice_period_days ? String(c.notice_period_days) : prev.notice_period_days,
          current_company: c.current_company || prev.current_company,
          current_designation: c.current_designation || prev.current_designation
        }));
        if (c.vacancy_id && (!vacancy || vacancy.vacancy_id !== c.vacancy_id)) {
          handleSelectVacancy(c.vacancy_id);
        }
      }
    } catch (e) {
      console.error("handleSelectCandidate error:", e);
    }
  };

  // Reactive real-time calculation whenever formAnswers or vacancy changes
  useEffect(() => {
    if (vacancy) {
      const result = evaluateGeneralAssessment(formAnswers, vacancy);
      setEvaluation(result);
      if (!statusOverride) {
        setStatusOverride(result.evaluation_status);
      }
    }
  }, [formAnswers, vacancy]);

  const handleInputChange = (field, value) => {
    setFormAnswers((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!candidate?.candidate_id) {
      showToast({ icon: "error", title: "Please select a candidate" });
      return;
    }
    if (!vacancy?.vacancy_id) {
      showToast({ icon: "error", title: "Please select a vacancy" });
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/api/recruitment/general-assessment/save", {
        candidate_id: candidate.candidate_id,
        vacancy_id: vacancy.vacancy_id,
        pipeline_id: candidate.pipeline_id || null,
        candidate_data: formAnswers,
        vacancy_criteria: vacancy,
        remarks: remarks,
        evaluation_status_override: statusOverride
      });

      if (res.data?.success) {
        showToast({ icon: "success", title: "General Assessment saved successfully!" });
        if (onSaved) onSaved();
        onClose();
      } else {
        showToast({ icon: "error", title: res.data?.message || "Failed to save assessment" });
      }
    } catch (err) {
      console.error("Save assessment error:", err);
      showToast({ icon: "error", title: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-none animate-in fade-in duration-100">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-300 flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="bg-[#0f2137] text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-amber-500 flex items-center justify-center text-white font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white">
                  CANDIDATE GENERAL ASSESSMENT SCORECARD
                </h3>
                <span className="px-2 py-0.2 rounded-none text-[9.5px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LOGIX Standard
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Hardcoded 25-Point Profile & Qualification Evaluation Engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-none bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          
          {/* Header Metadata Card */}
          <div className="bg-white rounded-none p-3.5 border border-slate-300 grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Candidate Selector / View */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-500" /> Candidate
              </label>
              {!assessmentId && candidatesList.length > 0 ? (
                <select
                  value={candidate?.candidate_id || ""}
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-none border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Select Candidate --</option>
                  {candidatesList.map((c) => (
                    <option key={c.candidate_id} value={c.candidate_id}>
                      {c.candidate_name} ({c.candidate_code || c.mobile})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-slate-800 text-xs">
                  {candidate?.candidate_name || candidate?.full_name || "—"}
                  <span className="block text-[10.5px] font-normal text-slate-500">
                    {candidate?.candidate_code} · {candidate?.mobile}
                  </span>
                </div>
              )}
            </div>

            {/* Vacancy Selector / View */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-500" /> Vacancy / Position
              </label>
              {!assessmentId && vacanciesList.length > 0 ? (
                <select
                  value={vacancy?.vacancy_id || ""}
                  onChange={(e) => handleSelectVacancy(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 rounded-none border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Vacancy --</option>
                  {vacanciesList.map((v) => (
                    <option key={v.vacancy_id} value={v.vacancy_id}>
                      {v.vacancy_no} - {v.job_role}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-slate-800 text-xs">
                  {vacancy?.job_role || vacancy?.vacancy_no || "—"}
                  <span className="block text-[10.5px] font-normal text-slate-500">
                    {vacancy?.vacancy_no} · {vacancy?.department_name || "Department"}
                  </span>
                </div>
              )}
            </div>

            {/* Live Scorecard Metrics Card */}
            <div className="md:col-span-2 bg-[#0f2137] text-white rounded-none p-3 flex items-center justify-between border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                  Total Assessment Score
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">
                    {evaluation?.obtained_marks ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    / {evaluation?.applicable_max_marks ?? 0} Applicable Marks
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-amber-400">
                  {evaluation?.percentage ?? 0}%
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10.5px] font-bold leading-4 mt-0.5 ${
                  (statusOverride || evaluation?.evaluation_status) === "Shortlisted"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : (statusOverride || evaluation?.evaluation_status) === "Hold"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {statusOverride || evaluation?.evaluation_status || "Hold"}
                </span>
              </div>
            </div>

          </div>

          {/* Detailed Question-by-Question Scorecard Table */}
          <div className="bg-white rounded-none border border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
              <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                LOGIX General Assessment 25-Point Breakdown
              </h4>
              <span className="text-[10.5px] text-slate-500">
                Excluded N/A questions do not count against total score
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 uppercase font-bold text-[9.5px] tracking-wider">
                    <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">#</th>
                    <th className="py-2 px-2.5 w-52 border-r border-slate-200">Question Parameter</th>
                    <th className="py-2 px-2.5 w-48 border-r border-slate-200">Candidate Answer</th>
                    <th className="py-2 px-2.5 w-48 border-r border-slate-200">Required Vacancy Value</th>
                    <th className="py-2 px-2.5 w-24 text-center border-r border-slate-200">Max / Awarded</th>
                    <th className="py-2 px-2.5">Evaluation Rule & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {evaluation?.answers?.map((row, idx) => {
                    const isZero = row.is_applicable && row.awarded_marks === 0;
                    const isFull = row.is_applicable && row.awarded_marks === row.max_marks;
                    const isNA = !row.is_applicable || row.max_marks === 0;

                    return (
                      <tr 
                        key={row.code || idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isNA ? "bg-slate-50/50 text-slate-400" : isZero ? "bg-rose-50/20" : ""
                        }`}
                      >
                        <td className="py-1.5 px-2.5 text-center text-slate-400 font-bold text-[10px] border-r border-slate-200">
                          {String.fromCharCode(65 + idx)}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-200">
                          <span className="font-bold text-slate-800 block text-[11.5px]">
                            {row.name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 uppercase font-mono">
                            {row.code}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900 border-r border-slate-200 text-[11px]">
                          {row.candidate_answer || "—"}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 border-r border-slate-200 text-[11px]">
                          {row.required_jd_value || "—"}
                        </td>
                        <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                          {isNA ? (
                            <span className="px-1.5 py-0.2 rounded-none bg-slate-200 text-slate-600 text-[10px] font-bold">
                              N/A
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded-none text-[10.5px] font-extrabold leading-4 ${
                              isFull 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : isZero
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}>
                              {row.awarded_marks} / {row.max_marks}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-[11px] text-slate-600">
                          {row.evaluation_note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluator Notes & Status Controls */}
          <div className="bg-white rounded-none p-3.5 border border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                HR Evaluator Remarks & Observations
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Add qualitative candidate background notes or decision remarks..."
                className="w-full text-xs p-2 rounded-none border border-slate-300 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                Evaluation Decision
              </label>
              <select
                value={statusOverride}
                onChange={(e) => setStatusOverride(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-none border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Shortlisted">✅ Shortlisted (Proceed to Round 1 / Interview)</option>
                <option value="Hold">⏳ Hold / Under Review</option>
                <option value="Rejected">❌ Rejected (Does Not Meet Criteria)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Auto-calculated status: <strong className="text-slate-700">{evaluation?.evaluation_status}</strong> ({evaluation?.percentage}%)
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-white px-4 py-2.5 border-t border-slate-300 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-none text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-300 cursor-pointer"
          >
            Cancel / Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !candidate?.candidate_id || !vacancy?.vacancy_id}
              className="px-4 py-1.5 rounded-none text-xs font-bold bg-[#0f2137] hover:bg-[#1a3455] text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Assessment & Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

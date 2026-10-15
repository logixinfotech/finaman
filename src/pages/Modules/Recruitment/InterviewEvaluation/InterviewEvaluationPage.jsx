import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import Table from "../../../../components/Reusable/table/Table";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Check,
  X,
  XCircle,
  Save,
  Layers,
} from "lucide-react";
import {
  getEvaluationCandidateList,
  getCandidateAssessments,
  getCandidateAssessmentDetail,
  submitHRGrades,
} from "../../../../utils/recruitmentApi";
import { showToast, alertSuccess, alertError } from "../../../../components/Reusable/alert";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

export default function InterviewEvaluationPage({ tab, onOpenPage }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search] = useState(""); // top search removed; table's own search is used
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail Modal / Review Panel State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateAssessments, setCandidateAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState("");

  // Single Assessment Detailed Breakdown State
  const [activeAssessmentDetail, setActiveAssessmentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // HR Grading Form State
  const [gradingState, setGradingState] = useState({}); // { [question_id]: { awarded_marks, evaluator_feedback } }
  const [overallRemarks, setOverallRemarks] = useState("");
  const [isPassedOverride, setIsPassedOverride] = useState(null);
  const [submittingGrades, setSubmittingGrades] = useState(false);

  // ── Load Candidates List (Only those with dispatched assessments) ───────────
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEvaluationCandidateList({
        search,
        status_filter: statusFilter,
      });
      setCandidates(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch evaluation candidates:", err);
      showToast({ icon: "error", title: "Failed to load candidate evaluations" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // ── Open Candidate Review & Fetch All Their Assessments ──────────────────────
  const handleOpenCandidateReview = async (cand) => {
    setSelectedCandidate(cand);
    setActiveAssessmentId("");
    setActiveAssessmentDetail(null);
    setCandidateAssessments([]);

    try {
      setLoadingAssessments(true);
      const targetId = cand.candidate_id || cand.candidate_code || cand.mobile;
      const res = await getCandidateAssessments(targetId);
      const list = res?.data || [];
      setCandidateAssessments(list);

      // Select first assessment by default
      if (list.length > 0) {
        handleSelectAssessment(list[0].candidate_assessment_id);
      }
    } catch (err) {
      console.error("Failed to load candidate assessments:", err);
      alertError("Error", "Could not load candidate assignments");
    } finally {
      setLoadingAssessments(false);
    }
  };

  // ── Select an Assessment to Review ─────────────────────────────────────────
  const handleSelectAssessment = async (assessmentId) => {
    if (!assessmentId) return;
    setActiveAssessmentId(assessmentId);
    try {
      setLoadingDetail(true);
      const res = await getCandidateAssessmentDetail(assessmentId);
      const detail = res?.data || null;
      setActiveAssessmentDetail(detail);

      // Pre-fill grading state from saved responses
      const initialGrades = {};
      (detail?.questions || []).forEach((q) => {
        initialGrades[q.assessment_question_id] = {
          awarded_marks:
            q.awarded_marks !== null && q.awarded_marks !== undefined ? String(q.awarded_marks) : "",
          evaluator_feedback: q.evaluator_feedback || "",
        };
      });
      setGradingState(initialGrades);
      setOverallRemarks(detail?.evaluation_remarks || "");
      setIsPassedOverride(detail?.is_passed ?? null);
    } catch (err) {
      console.error("Failed to load assessment detail:", err);
      alertError("Error", "Could not load assignment detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Save HR Grades & Remarks ────────────────────────────────────────────────
  const handleSaveEvaluation = async () => {
    if (!activeAssessmentDetail) return;
    try {
      setSubmittingGrades(true);
      const gradesArray = Object.entries(gradingState).map(([qId, val]) => ({
        assessment_question_id: qId,
        awarded_marks: val.awarded_marks !== "" ? parseFloat(val.awarded_marks) : 0,
        evaluator_feedback: val.evaluator_feedback || "",
      }));

      const res = await submitHRGrades({
        candidate_assessment_id: activeAssessmentDetail.candidate_assessment_id,
        grades: gradesArray,
        evaluation_remarks: overallRemarks,
        is_passed: isPassedOverride !== null ? isPassedOverride : undefined,
      });

      if (res?.success) {
        alertSuccess("Evaluation Saved", "HR grades and feedback saved successfully!");
        // Refresh detail and candidate list
        handleSelectAssessment(activeAssessmentDetail.candidate_assessment_id);
        fetchCandidates();
      } else {
        alertError("Failed", res?.message || "Could not save evaluation");
      }
    } catch (err) {
      alertError("Error", err.message || "Failed to submit evaluation");
    } finally {
      setSubmittingGrades(false);
    }
  };

  // ── Status Badges Renderer ──────────────────────────────────────────────────
  const renderStatusBadge = (status, evalStatus) => {
    const s = status || "Issued";
    if (s === "Submitted") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Submitted & Under Review
        </span>
      );
    }
    if (s === "Evaluated" || evalStatus === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Evaluated
        </span>
      );
    }
    if (s === "Started") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
          In Progress
        </span>
      );
    }
    if (s === "Expired") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Clock className="w-3 h-3 text-slate-500" />
        Link Dispatched
      </span>
    );
  };

  // ── Table Columns Configuration ─────────────────────────────────────────────
  // Rows are a fixed height in the shared Table, so every cell is a single truncated line
  const columns = useMemo(
    () => [
      {
        key: "candidate_code",
        label: "Candidate Code",
        width: 130,
        render: (row) => (
          <span className="font-mono text-[11px] font-bold text-blue-700 whitespace-nowrap">
            {row.candidate_code || "—"}
          </span>
        ),
      },
      {
        key: "full_name",
        label: "Candidate Name",
        width: 240,
        render: (row) => (
          <span
            className="block min-w-0 truncate"
            title={`${row.full_name || ""}${row.email ? " · " + row.email : ""}`}
          >
            <span className="font-bold text-slate-900 text-xs">{row.full_name || "—"}</span>
            {row.email && <span className="text-[10.5px] text-slate-400"> · {row.email}</span>}
          </span>
        ),
      },
      {
        key: "mobile",
        label: "Mobile No.",
        width: 130,
        render: (row) => (
          <span className="font-mono text-[11px] text-slate-700 font-medium whitespace-nowrap">
            {row.mobile ? `+91 ${row.mobile}` : "—"}
          </span>
        ),
      },
      {
        key: "vacancy_no",
        label: "Vacancy / Role",
        width: 230,
        render: (row) => (
          <span
            className="block min-w-0 truncate"
            title={`${row.job_title || ""} ${row.vacancy_no || ""}`}
          >
            <span className="text-xs font-semibold text-slate-800">
              {row.job_title || row.vacancy_no || "General"}
            </span>
            {row.vacancy_no && (
              <span className="text-[10px] text-slate-400 font-mono"> · {row.vacancy_no}</span>
            )}
          </span>
        ),
      },
      {
        key: "total_assessments",
        label: "Assignments Sent",
        width: 140,
        render: (row) => (
          <span className="inline-flex items-center gap-1 h-[20px] px-2 rounded-full text-[10.5px] font-bold leading-none bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            <Layers className="w-3 h-3 text-slate-500" />
            {row.total_assessments || 1} {row.total_assessments > 1 ? "Tests" : "Test"}
          </span>
        ),
      },
      {
        key: "submitted_count",
        label: "Submissions",
        width: 130,
        render: (row) => {
          const sub = row.submitted_count || 0;
          return (
            <span
              className={`inline-flex items-center h-[20px] px-2.5 rounded-full text-[10.5px] font-semibold leading-none whitespace-nowrap ${sub > 0
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-slate-50 text-slate-500 border border-slate-200"
                }`}
            >
              {sub} Submitted
            </span>
          );
        },
      },
      {
        key: "latest_assessment_name",
        label: "Latest Assignment",
        width: 230,
        render: (row) => (
          <span
            className="block min-w-0 truncate"
            title={row.latest_assessment_name || ""}
          >
            <span className="text-xs font-medium text-slate-800">
              {row.latest_assessment_name || "—"}
            </span>
            {row.latest_issued_at && (
              <span className="text-[10.5px] text-slate-400">
                {" "}· {new Date(row.latest_issued_at).toLocaleDateString("en-IN")}
              </span>
            )}
          </span>
        ),
      },
      {
        key: "latest_status",
        label: "Status",
        width: 200,
        render: (row) => (
          <span className="whitespace-nowrap">
            {renderStatusBadge(row.latest_status, row.latest_evaluation_status)}
          </span>
        ),
      },
      {
        key: "latest_score",
        label: "Score / Result",
        width: 130,
        render: (row) => {
          if (row.latest_total_score === null || row.latest_total_score === undefined) {
            return <span className="text-slate-400 text-xs">—</span>;
          }
          const pct = row.latest_percentage || 0;
          const passed = row.latest_is_passed === 1 || row.latest_is_passed === true;
          return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="font-mono text-[11px] font-bold text-slate-800">
                {row.latest_total_score} / {row.latest_total_marks || "--"}
              </span>
              <span
                className={`inline-flex items-center h-[18px] px-1.5 rounded-full text-[10px] font-bold leading-none ${passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
              >
                {pct}%
              </span>
            </span>
          );
        },
      },
      {
        key: "action",
        label: "Review",
        width: 110,
        render: (row) => (
          <button
            type="button"
            onClick={() => handleOpenCandidateReview(row)}
            className="h-[22px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Eye className="w-3 h-3" />
            <span>Review</span>
          </button>
        ),
      },
    ],
    []
  );
  return (
    <div
      style={{ fontFamily: FONT }}
      className="w-full h-full flex flex-col bg-[#f0f4f9] overflow-hidden text-slate-800 select-none"
    >
      {/* ── Top Header Bar ── */}
      {/* <ERPHeader
        title="INTERVIEW EVALUATION & ASSESSMENT REVIEW"
        isHidden={true}
        onRefresh={fetchCandidates}
        activeTab="search"
      /> */}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col p-0 overflow-hidden gap-0">
        {/* Filter Ribbon (top search removed) */}


        {/* ── Table View: Candidate Rows (Only Candidates with Dispatched Assessments) ── */}
        <div className="flex-1 min-h-0 bg-white overflow-hidden flex flex-col">
          <Table
            title="Candidates with Submitted Online Assessments"
            TitleIcon={Award}
            isHidden={true}
            data={candidates}
            columns={columns}
            loading={loading}
            onRowClick={(row) => handleOpenCandidateReview(row)}
            onRowDoubleClick={(row) => handleOpenCandidateReview(row)}
          />
        </div>
      </div>

      {/* ── Detailed Candidate Review Modal / Drawer ── */}
      {/* ── Detailed Candidate Review Modal / Drawer ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white shadow-2xl w-full sm:max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col overflow-hidden border border-slate-300 rounded-none sm:rounded-xl animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 bg-[#0f2137] text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[13px] truncate">{selectedCandidate.full_name}</span>
                    <span className="font-mono text-[10.5px] text-blue-300 bg-blue-950/60 px-1.5 py-px rounded border border-blue-500/30">
                      {selectedCandidate.candidate_code || "—"}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-300 flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedCandidate.mobile || "—"}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedCandidate.email || "—"}
                    </span>
                    <span className="flex items-center gap-1 min-w-0">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {selectedCandidate.job_title || selectedCandidate.vacancy_no || "General Vacancy"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Assignments ribbon */}
            <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-1 shrink-0">
                Assignments ({candidateAssessments.length}):
              </span>
              {loadingAssessments ? (
                <span className="text-xs text-slate-400 italic">Loading assignments...</span>
              ) : candidateAssessments.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No assignments found</span>
              ) : (
                candidateAssessments.map((a, idx) => {
                  const isSelected = a.candidate_assessment_id === activeAssessmentId;
                  const isSub = a.status === "Submitted" || a.status === "Evaluated";
                  return (
                    <button
                      key={a.candidate_assessment_id}
                      onClick={() => handleSelectAssessment(a.candidate_assessment_id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer border shrink-0 ${isSelected
                          ? "bg-white text-blue-900 border-blue-400 font-bold shadow-xs"
                          : "bg-slate-50/70 text-slate-700 hover:bg-white border-slate-200 font-medium"
                        }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[130px] sm:max-w-[200px]">{a.assessment_name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-px rounded font-semibold ${a.status === "Evaluated"
                            ? "bg-emerald-100 text-emerald-800"
                            : isSub
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                      >
                        {a.status}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 bg-[#f8fafc] space-y-2.5">
              {loadingDetail ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Loading assessment submission details...</span>
                </div>
              ) : !activeAssessmentDetail ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Award className="w-8 h-8 text-slate-300" />
                  <span>Select an assignment from the ribbon above to inspect details</span>
                </div>
              ) : (
                <>
                  {/* Summary ribbon (compact) */}
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[13px] font-bold text-slate-900">
                          {activeAssessmentDetail.assessment_name}
                        </h3>
                        {renderStatusBadge(
                          activeAssessmentDetail.status,
                          activeAssessmentDetail.evaluation_status
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          Issued:{" "}
                          <strong>
                            {activeAssessmentDetail.issued_at
                              ? new Date(activeAssessmentDetail.issued_at).toLocaleString()
                              : "—"}
                          </strong>
                        </span>
                        {activeAssessmentDetail.submitted_at && (
                          <span>
                            Submitted:{" "}
                            <strong>{new Date(activeAssessmentDetail.submitted_at).toLocaleString()}</strong>
                          </span>
                        )}
                        {activeAssessmentDetail.duration_seconds_taken && (
                          <span>
                            Time Taken:{" "}
                            <strong>{Math.round(activeAssessmentDetail.duration_seconds_taken / 60)} mins</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                      <div className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-semibold leading-tight">
                          Total Marks
                        </span>
                        <span className="text-[13px] font-bold text-slate-800 leading-tight">
                          {activeAssessmentDetail.total_marks || 0}
                        </span>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1 text-center">
                        <span className="text-[9px] text-blue-700 block uppercase font-semibold leading-tight">
                          Obtained
                        </span>
                        <span className="text-[13px] font-extrabold text-blue-900 leading-tight">
                          {activeAssessmentDetail.total_score ?? "—"}
                        </span>
                      </div>

                      <div
                        className={`border rounded-md px-2.5 py-1 text-center ${activeAssessmentDetail.is_passed
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-rose-50 border-rose-200 text-rose-900"
                          }`}
                      >
                        <span className="text-[9px] block uppercase font-semibold leading-tight">Result</span>
                        <span className="text-[11px] sm:text-xs font-extrabold leading-tight block">
                          {activeAssessmentDetail.percentage !== null &&
                            activeAssessmentDetail.percentage !== undefined
                            ? `${activeAssessmentDetail.percentage}% (${activeAssessmentDetail.is_passed ? "PASSED" : "FAILED"
                            })`
                            : "UNDER REVIEW"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Incomplete notice (compact) */}
                  {activeAssessmentDetail.status !== "Submitted" &&
                    activeAssessmentDetail.status !== "Evaluated" && (
                      <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-[11px] text-amber-900">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />
                        <div>
                          <strong>Assessment Incomplete:</strong> The candidate has not yet submitted responses for
                          this assessment. Current status is{" "}
                          <span className="font-semibold">{activeAssessmentDetail.status}</span>.
                        </div>
                      </div>
                    )}

                  {/* Questions */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Responses & Grading ({activeAssessmentDetail.questions?.length || 0} Questions)
                      </h4>
                      <span className="hidden sm:inline text-[10.5px] text-slate-500 italic">
                        Review candidate responses and enter evaluator marks below
                      </span>
                    </div>

                    {(activeAssessmentDetail.questions || []).map((q, idx) => {
                      const qId = q.assessment_question_id;
                      const resp = q.response || {};
                      const grade = gradingState[qId] || { awarded_marks: "", evaluator_feedback: "" };
                      const isFileResp = Boolean(resp.saved_file_name && resp.saved_file_path);
                      const hasOptionAnswer =
                        (resp.selected_option_id !== undefined && resp.selected_option_id !== null && resp.selected_option_id !== "") ||
                        (resp.answer_json !== undefined && resp.answer_json !== null && resp.answer_json !== "");

                      return (
                        <div
                          key={qId}
                          className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs space-y-1.5 transition-all hover:border-slate-300"
                        >
                          {/* Question header */}
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <div className="flex items-start gap-1.5 min-w-0 flex-1 basis-[200px]">
                              <span className="min-w-[26px] h-5 px-1 rounded bg-blue-50 text-blue-700 font-bold text-[10.5px] flex items-center justify-center shrink-0">
                                Q{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="text-[12px] font-bold text-slate-900 leading-snug block">
                                  {q.question_text}
                                </span>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">
                                  <span>Type: <strong>{q.question_type}</strong></span>
                                  <span>Max: <strong>+{q.marks}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              <label className="text-[10.5px] font-semibold text-slate-600 hidden sm:block">
                                Award Marks:
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={q.marks}
                                step={0.5}
                                placeholder="Mark"
                                value={grade.awarded_marks}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [qId]: { ...prev[qId], awarded_marks: e.target.value },
                                  }))
                                }
                                className="w-14 h-6 px-1.5 text-[16px] sm:text-[11px] font-bold text-center border border-slate-300 rounded focus:border-blue-500 outline-none"
                              />
                              <span className="text-[11px] text-slate-400">/ {q.marks}</span>
                            </div>
                          </div>

                          {/* Candidate response */}
                          <div className="bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1.5 text-[11.5px] space-y-1">
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide block">
                              Candidate Submission
                            </span>

                            {q.options && q.options.length > 0 ? (
                              <div className="space-y-1">
                                {q.options.map((opt, oi) => {
                                  const isSelected =
                                    hasOptionAnswer &&
                                    opt.option_id !== undefined &&
                                    opt.option_id !== null &&
                                    (resp.selected_option_id === opt.option_id ||
                                      (resp.answer_json && String(resp.answer_json).includes(opt.option_id)));
                                  return (
                                    <div
                                      key={opt.option_id ?? oi}
                                      className={`px-2 py-1 rounded flex items-center justify-between gap-2 text-[11.5px] font-medium border ${isSelected
                                          ? "bg-blue-100 text-blue-900 border-blue-300 font-bold"
                                          : "bg-white text-slate-700 border-slate-200"
                                        }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div
                                          className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                              ? "border-blue-600 bg-blue-600 text-white"
                                              : "border-slate-300"
                                            }`}
                                        >
                                          {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                        </div>
                                        <span className="truncate">{opt.option_text}</span>
                                      </div>
                                      {isSelected && (
                                        <span className="text-[9px] text-blue-700 uppercase font-bold tracking-wide shrink-0">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}

                            {resp.answer_text ? (
                              <div className="bg-white border rounded px-2 py-1.5 text-slate-800 whitespace-pre-wrap leading-snug">
                                {resp.answer_text}
                              </div>
                            ) : null}

                            {resp.answer_numeric !== null && resp.answer_numeric !== undefined && !resp.answer_text ? (
                              <div className="font-semibold text-slate-800">
                                Numeric / Rating Value:{" "}
                                <span className="font-mono text-blue-700 font-bold">{resp.answer_numeric}</span>
                              </div>
                            ) : null}

                            {isFileResp ? (
                              <div className="bg-blue-50/80 border border-blue-200 rounded-md px-2 py-1.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-blue-950 block text-[11.5px] truncate">
                                      {resp.saved_file_name}
                                    </span>
                                    <span className="text-[9.5px] text-blue-700">
                                      Candidate uploaded solved file response
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={resp.saved_file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 h-6 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shadow-2xs"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download / View</span>
                                </a>
                              </div>
                            ) : null}

                            {!hasOptionAnswer &&
                              !resp.answer_text &&
                              (resp.answer_numeric === null || resp.answer_numeric === undefined) &&
                              !isFileResp && (
                                <span className="text-slate-400 italic block">No answer provided</span>
                              )}
                          </div>

                          {/* Evaluator feedback */}
                          <input
                            type="text"
                            placeholder="Evaluator remarks / feedback (optional)..."
                            value={grade.evaluator_feedback}
                            onChange={(e) =>
                              setGradingState((prev) => ({
                                ...prev,
                                [qId]: { ...prev[qId], evaluator_feedback: e.target.value },
                              }))
                            }
                            className="w-full h-6 px-2 text-[16px] sm:text-[11px] border border-slate-200 rounded focus:border-blue-400 outline-none placeholder:text-slate-400 font-normal"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall decision */}
                  <SectionCard
                    title="Overall Evaluator Decision & Final Recommendation"
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    theme="emerald"
                    bodyClassName="p-2.5 space-y-2"
                  >
                    <FormField label="HR / Evaluator Overall Recommendation & Qualitative Review">
                      <textarea
                        rows={2}
                        placeholder="Enter interview feedback, technical suitability, communication comments..."
                        value={overallRemarks}
                        onChange={(e) => setOverallRemarks(e.target.value)}
                        className={`${formInputClass()} !h-auto py-1.5`}
                      />
                    </FormField>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-700">Final Result Decision:</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsPassedOverride(true)}
                            className={`h-6 px-2.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${isPassedOverride === true
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                              }`}
                          >
                            Qualified / Passed
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsPassedOverride(false)}
                            className={`h-6 px-2.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${isPassedOverride === false
                                ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                              }`}
                          >
                            Rejected / Failed
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={submittingGrades}
                        onClick={handleSaveEvaluation}
                        className="h-7 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-md shadow-sm flex items-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto justify-center"
                      >
                        {submittingGrades ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Saving Evaluation...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            <span>Save HR Evaluation & Grades</span>
                          </>
                        )}
                      </button>
                    </div>
                  </SectionCard>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 sm:px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0">
              <span className="text-slate-500 text-[10.5px] truncate min-w-0">
                Reviewing: <strong className="text-slate-800">{selectedCandidate.full_name}</strong> (
                {selectedCandidate.candidate_code || "—"})
              </span>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="h-7 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
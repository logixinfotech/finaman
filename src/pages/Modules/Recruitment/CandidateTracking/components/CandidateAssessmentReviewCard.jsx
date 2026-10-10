import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Check,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Link2,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  getCandidateAssessmentsByPipeline,
  getCandidateAssessmentDetail,
  submitHRGrades,
} from "../../../../../utils/recruitmentApi";
import { showToast, alertError } from "../../../../../components/Reusable/alert";
import { copyToClipboard } from "../../../../../utils/helpers";

// Public (no-login) candidate link, built from the stored secure token
const buildPublicLink = (token) => {
  if (!token) return "";
  let tenantDb = "";
  try {
    tenantDb = JSON.parse(localStorage.getItem("user") || "{}")?.database || "";
  } catch (_) { }
  return `${window.location.origin}/assessment?db=${encodeURIComponent(tenantDb)}&token=${encodeURIComponent(token)}`;
};

const CandidateAssessmentReviewCard = ({ pipelineId, candidateId, onRefreshPipeline }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAsmId, setSelectedAsmId] = useState(null);
  const [asmDetail, setAsmDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [grades, setGrades] = useState({}); // { [response_id]: { awarded_marks, evaluator_feedback } }
  const [evalRemarks, setEvalRemarks] = useState("");

  const loadAssessments = useCallback(async () => {
    if (!pipelineId) return;
    try {
      setLoading(true);
      const res = await getCandidateAssessmentsByPipeline(pipelineId);
      const list = res?.data || [];
      setAssessments(list);
      if (list.length > 0) {
        setSelectedAsmId(list[0].candidate_assessment_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const loadDetail = useCallback(async (caId) => {
    if (!caId) return;
    try {
      setLoadingDetail(true);
      const res = await getCandidateAssessmentDetail(caId);
      if (res?.success && res?.data) {
        const data = res.data;
        setAsmDetail(data);
        setEvalRemarks(data.evaluation_remarks || "");

        // Initialize grade inputs
        const initialGrades = {};
        (data.responses || []).forEach((r) => {
          initialGrades[r.response_id] = {
            awarded_marks: r.awarded_marks ?? "",
            evaluator_feedback: r.evaluator_feedback || "",
          };
        });
        setGrades(initialGrades);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (selectedAsmId) {
      loadDetail(selectedAsmId);
    }
  }, [selectedAsmId, loadDetail]);

  const handleGradeChange = (responseId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [responseId]: {
        ...(prev[responseId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedAsmId) return;
    try {
      setSavingGrades(true);
      const gradesList = Object.keys(grades).map((rid) => ({
        response_id: rid,
        awarded_marks: grades[rid].awarded_marks,
        evaluator_feedback: grades[rid].evaluator_feedback,
      }));

      const res = await submitHRGrades({
        candidate_assessment_id: selectedAsmId,
        grades: gradesList,
        evaluation_remarks: evalRemarks,
      });

      if (res?.success) {
        showToast({ icon: "success", title: "Grades and score updated successfully" });
        await loadDetail(selectedAsmId);
        if (onRefreshPipeline) onRefreshPipeline();
      } else {
        alertError("Error", res?.message || "Failed to update grades");
      }
    } catch (err) {
      alertError("Grade Save Failed", err.message);
    } finally {
      setSavingGrades(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading assessment records...</span>
      </div>
    );
  }

  if (assessments.length === 0) {
    return null; // No assessment issued yet
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
      {/* ── Header Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Candidate Assessment & Scoring Review
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {assessments.length > 1 && (
            <select
              value={selectedAsmId || ""}
              onChange={(e) => setSelectedAsmId(e.target.value)}
              className="h-7 px-2 text-xs bg-slate-50 border border-slate-300 rounded outline-none"
            >
              {assessments.map((a) => (
                <option key={a.candidate_assessment_id} value={a.candidate_assessment_id}>
                  {a.assessment_name} ({a.status})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => loadDetail(selectedAsmId)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDetail ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Public link for the selected issued assessment ── */}
      {(() => {
        const selected = assessments.find((a) => a.candidate_assessment_id === selectedAsmId);
        const link = buildPublicLink(selected?.access_token);
        if (!link) return null;
        return (
          <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-200 rounded-md px-2.5 py-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 shrink-0">Public Link</span>
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 h-6 px-2 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                await copyToClipboard(link);
                showToast({ icon: "success", title: "Assessment link copied" });
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          </div>
        );
      })()}

      {/* ── Assessment Performance Summary Card ── */}
      {asmDetail && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="bg-slate-50 border rounded-lg p-2.5">
              <span className="text-[10.5px] text-slate-500 block">Assessment Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                  asmDetail.status === "Submitted" || asmDetail.status === "Evaluated"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : asmDetail.status === "Started"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {asmDetail.status}
              </span>
            </div>

            <div className="bg-slate-50 border rounded-lg p-2.5">
              <span className="text-[10.5px] text-slate-500 block">Total Score</span>
              <span className="text-base font-extrabold text-emerald-700">
                {asmDetail.total_score ?? "—"} / {asmDetail.total_marks}
              </span>
            </div>

            <div className="bg-slate-50 border rounded-lg p-2.5">
              <span className="text-[10.5px] text-slate-500 block">Percentage</span>
              <span className="text-base font-bold text-slate-800">
                {asmDetail.percentage !== null && asmDetail.percentage !== undefined
                  ? `${asmDetail.percentage}%`
                  : "—"}
              </span>
            </div>

            <div className="bg-slate-50 border rounded-lg p-2.5">
              <span className="text-[10.5px] text-slate-500 block">Result</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                  asmDetail.is_passed === true
                    ? "bg-emerald-100 text-emerald-800"
                    : asmDetail.is_passed === false
                    ? "bg-red-100 text-red-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {asmDetail.is_passed === true
                  ? "Passed"
                  : asmDetail.is_passed === false
                  ? "Below Benchmark"
                  : "Under Review"}
              </span>
            </div>

            <div className="bg-slate-50 border rounded-lg p-2.5">
              <span className="text-[10.5px] text-slate-500 block">Evaluation Mode</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold mt-0.5 ${
                  asmDetail.evaluation_status === "Completed"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {asmDetail.evaluation_status === "Completed" ? "Evaluated" : "Pending Manual Grade"}
              </span>
            </div>
          </div>

          {/* ── Questions and Answers Breakdown ── */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Question-by-Question Evaluation ({asmDetail.responses?.length || 0} Answered)
            </h4>

            <div className="space-y-3">
              {(asmDetail.responses || []).map((resp, idx) => {
                const qType = resp.question_type;
                const isAuto = resp.evaluation_mode === "Auto";
                const awarded = grades[resp.response_id]?.awarded_marks ?? resp.awarded_marks;

                return (
                  <div
                    key={resp.response_id || idx}
                    className="border rounded-lg p-3.5 bg-slate-50/60 space-y-3 text-xs"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">Q{idx + 1}.</span>
                        <span className="font-semibold text-slate-800">{resp.question_text}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {qType}
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-600">
                          Max: +{resp.question_marks}
                        </span>
                      </div>
                    </div>

                    {/* Question Attachment if provided by HR */}
                    {resp.attachment_file_name && resp.attachment_file_path && (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2 text-blue-900 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">Reference Problem File: {resp.attachment_file_name}</span>
                        <a
                          href={resp.attachment_file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-blue-700 font-bold hover:underline"
                        >
                          View File
                        </a>
                      </div>
                    )}

                    {/* Candidate Submitted Answer */}
                    <div className="bg-white border rounded p-2.5 space-y-1.5">
                      <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block">
                        Candidate Answer:
                      </span>

                      {/* Choice answer */}
                      {["SingleChoice", "MultipleChoice", "TrueFalse"].includes(qType) && (
                        <div className="space-y-1">
                          <div className="font-medium text-slate-800">
                            Selected: <strong>{resp.selected_option_text || "Option Selected"}</strong>
                          </div>
                          {resp.is_correct === true && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Auto-Correct (+{resp.awarded_marks} Marks)
                            </span>
                          )}
                          {resp.is_correct === false && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" /> Incorrect (0 Marks)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Numeric answer */}
                      {qType === "Numeric" && (
                        <div className="space-y-1">
                          <div>
                            Candidate Value: <strong>{resp.answer_numeric}</strong> (Expected:{" "}
                            {resp.expected_numeric_answer} ±{resp.numeric_tolerance || 0})
                          </div>
                          {resp.is_correct ? (
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              Correct (+{resp.awarded_marks})
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                              Incorrect Value
                            </span>
                          )}
                        </div>
                      )}

                      {/* Text answer */}
                      {["ShortText", "LongText", "PracticalTask"].includes(qType) && (
                        <div className="space-y-1 text-slate-800 whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-2 rounded border">
                          {resp.answer_text || "No written response provided."}
                        </div>
                      )}

                      {/* Candidate Uploaded File (Excel / PDF) */}
                      {resp.response_file_name && resp.response_file_path && (
                        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded p-2 text-emerald-900 mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold">Candidate Solved File: {resp.response_file_name}</span>
                          </div>
                          <a
                            href={resp.response_file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded"
                          >
                            <Download className="w-3 h-3" />
                            Download Candidate File
                          </a>
                        </div>
                      )}
                    </div>

                    {/* HR Marks Awarding / Manual Evaluation Input */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-700">Awarded Marks:</label>
                        <input
                          type="number"
                          step="0.25"
                          max={resp.question_marks}
                          min="0"
                          value={awarded}
                          onChange={(e) =>
                            handleGradeChange(resp.response_id, "awarded_marks", e.target.value)
                          }
                          className="w-20 h-7 px-2 text-center text-xs bg-white border border-slate-300 rounded font-bold text-emerald-700 outline-none"
                        />
                        <span className="text-[11px] text-slate-400">/ {resp.question_marks}</span>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={grades[resp.response_id]?.evaluator_feedback || ""}
                          onChange={(e) =>
                            handleGradeChange(resp.response_id, "evaluator_feedback", e.target.value)
                          }
                          placeholder="Evaluator remarks / feedback for this question..."
                          className="w-full h-7 px-2.5 text-xs bg-white border border-slate-300 rounded outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall HR Remarks & Save Grades Button */}
            <div className="border-t pt-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Overall Evaluation Summary Remarks
              </label>
              <textarea
                rows={2}
                value={evalRemarks}
                onChange={(e) => setEvalRemarks(e.target.value)}
                placeholder="Final evaluator summary or recommendation..."
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded outline-none resize-y"
              />

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveGrades}
                  disabled={savingGrades}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-2xs cursor-pointer transition-colors"
                >
                  {savingGrades ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Grades & Update Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateAssessmentReviewCard;

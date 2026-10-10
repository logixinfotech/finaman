import React, { useState, useEffect } from "react";
import { X, Award, Send, Copy, Check, Loader2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { getAssessments, issueCandidateAssessment, updatePipelineStatus } from "../../../../../utils/recruitmentApi";
import { showToast, alertError } from "../../../../../components/Reusable/alert";
import { copyToClipboard } from "../../../../../utils/helpers";

const SendAssessmentModal = ({ isOpen, onClose, pipelineRow, onSuccess }) => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedLink("");
      setCopied(false);
      (async () => {
        try {
          setLoading(true);
          const res = await getAssessments({ status: "Active" });
          const list = res?.data || [];
          setAssessments(list);
          if (list.length > 0) {
            setSelectedAssessmentId(list[0].assessment_id);
          }
        } catch (err) {
          console.error("Failed to load assessments:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen || !pipelineRow) return null;

  const handleIssueAndDispatch = async () => {
    if (!selectedAssessmentId) {
      showToast({ icon: "warning", title: "Please select an assessment" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await issueCandidateAssessment({
        pipeline_id: pipelineRow.pipeline_id,
        candidate_id: pipelineRow.candidate_id,
        vacancy_id: pipelineRow.vacancy_id,
        assessment_id: selectedAssessmentId,
      });

      if (res?.success && res?.data) {
        const token = res.data.access_token;
        const tenantDb =
          localStorage.getItem("tenantDb") ||
          sessionStorage.getItem("tenantDb") ||
          "LOGIXINFOTECH";
        const link = `${window.location.origin}/assessment?db=${encodeURIComponent(tenantDb)}&token=${encodeURIComponent(token)}`;
        setGeneratedLink(link);

        // Advance pipeline status to "Assessment - Link Dispatched"
        try {
          await updatePipelineStatus(pipelineRow.pipeline_id, {
            to_status: "Assessment - Link Dispatched",
            remarks: `Assessment link dispatched (${res.data.assessment_name})`,
          });
        } catch (e) {
          console.warn("Pipeline status auto-update note:", e.message);
        }

        showToast({ icon: "success", title: "Assessment link generated & dispatched!" });
        if (onSuccess) onSuccess();
      } else {
        alertError("Error", res?.message || "Failed to generate assessment token");
      }
    } catch (err) {
      alertError("Dispatch Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    const ok = await copyToClipboard(generatedLink);
    if (ok) {
      setCopied(true);
      showToast({ icon: "success", title: "Assessment link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const selectedAsm = assessments.find((a) => a.assessment_id === selectedAssessmentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0f2137] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">Dispatch Online Assessment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Candidate Info Summary */}
          <div className="bg-slate-50 border rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{pipelineRow.candidate_name}</span>
              <span className="font-mono text-[11px] text-blue-700 font-semibold">{pipelineRow.candidate_code}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span>Vacancy: {pipelineRow.vacancy_no || "General"}</span>
              <span>Email: {pipelineRow.email || "—"}</span>
              <span>Mobile: {pipelineRow.mobile || "—"}</span>
            </div>
          </div>

          {/* Assessment Selection */}
          {!generatedLink ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select Assessment Template <span className="text-red-500">*</span>
                </label>
                {loading ? (
                  <div className="h-8 flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading active assessments...</span>
                  </div>
                ) : (
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-md focus:border-blue-500 outline-none text-slate-800 font-medium"
                  >
                    {assessments.map((a) => (
                      <option key={a.assessment_id} value={a.assessment_id}>
                        {a.assessment_name} ({a.total_questions || a.question_count || 0} Qs · {a.total_marks || 0} Marks · {a.estimated_duration_minutes || 30} mins)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedAsm && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-2.5 text-blue-900 space-y-1">
                  <span className="font-bold block">{selectedAsm.assessment_name}</span>
                  <div className="flex items-center gap-4 text-[11px] text-blue-800">
                    <span>Questions: <strong>{selectedAsm.total_questions || selectedAsm.question_count || 0}</strong></span>
                    <span>Total Marks: <strong>{selectedAsm.total_marks || 0}</strong></span>
                    <span>Passing: <strong>{selectedAsm.passing_marks || 0}</strong></span>
                    <span>Duration: <strong>{selectedAsm.estimated_duration_minutes || 30} mins</strong></span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Issuing this test will generate a secure one-time link with <strong>24-hour expiry</strong> and advance the candidate to stage <strong>Assessment - Link Dispatched</strong>.
                </span>
              </div>
            </div>
          ) : (
            /* Generated Link Display */
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5 text-emerald-900">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Assessment Link Generated & Ready
                </span>
                <p className="text-[11px] text-emerald-800">
                  Share this private link with the candidate via WhatsApp, SMS, or Email:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono text-slate-700 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`h-8 px-3 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-100 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
          >
            {generatedLink ? "Done" : "Cancel"}
          </button>

          {!generatedLink && (
            <button
              type="button"
              onClick={handleIssueAndDispatch}
              disabled={submitting || !selectedAssessmentId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-2xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Generate & Dispatch Link
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendAssessmentModal;

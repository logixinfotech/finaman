import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Paperclip,
  Download,
  X,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  Square,
  HelpCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  ListChecks,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
const QUESTION_TYPES = [
  { value: "SingleChoice", label: "Single Choice (Radio)" },
  { value: "MultipleChoice", label: "Multiple Choice (Checkbox)" },
  { value: "TrueFalse", label: "True / False" },
  { value: "Numeric", label: "Numeric Calculation (Tolerance)" },
  { value: "ShortText", label: "Short Text Answer (Manual)" },
  { value: "LongText", label: "Long Text / Essay (Manual)" },
  { value: "PracticalTask", label: "Practical Task / Case Study (Excel/PDF File + Text)" },
];
/* ── Read-only renderer: shows a question exactly as the candidate will see it ── */
const PreviewQuestion = ({ q, index }) => {
  if (!q) return null;
  const isChoice = ["SingleChoice", "MultipleChoice", "TrueFalse"].includes(q.question_type);
  const isMulti = q.question_type === "MultipleChoice";
  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-white font-bold text-[10.5px] flex items-center justify-center">
            {index + 1}
          </span>
          <p className="text-xs font-semibold text-slate-800 leading-snug">
            {q.question_text || <span className="text-slate-400 font-normal italic">Question statement will appear here…</span>}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
          +{q.marks ?? 1}
          {Number(q.negative_marks) > 0 && <span className="text-red-600"> / -{q.negative_marks}</span>}
        </span>
      </div>
      {q.attachment_file_name && (
        <div className="flex items-center gap-1.5 text-[10.5px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 ml-7">
          <Paperclip className="w-3 h-3" />
          <span className="truncate">{q.attachment_file_name}</span>
        </div>
      )}
      {isChoice && (
        <div className="space-y-1.5 ml-7">
          {(q.options || []).map((opt, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700"
            >
              {isMulti ? (
                <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className="truncate">
                {opt.option_text || <span className="text-slate-300 italic">Option {String.fromCharCode(65 + i)}</span>}
              </span>
            </div>
          ))}
          {(q.options || []).length === 0 && (
            <div className="text-[11px] text-slate-400 italic">No options added yet</div>
          )}
        </div>
      )}
      {q.question_type === "Numeric" && (
        <div className="ml-7">
          <input
            disabled
            placeholder="Candidate enters a numeric value…"
            className="w-full h-7 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-400"
          />
        </div>
      )}
      {q.question_type === "ShortText" && (
        <div className="ml-7">
          <input
            disabled
            placeholder="Candidate types a short answer…"
            className="w-full h-7 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-400"
          />
        </div>
      )}
      {(q.question_type === "LongText" || q.question_type === "PracticalTask") && (
        <div className="ml-7">
          <textarea
            disabled
            rows={3}
            placeholder={
              q.question_type === "PracticalTask"
                ? "Candidate writes notes and/or uploads a solved file…"
                : "Candidate writes a detailed answer…"
            }
            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-400 resize-none"
          />
        </div>
      )}
    </div>
  );
};
const AssessmentMasterForm = ({
  formData,
  setFormData,
  errors = {},
  isViewMode = false,
  questionFiles = {},
  setQuestionFiles,
}) => {
  const questions = formData.questions || [];
  // Which question the right-hand "candidate view" preview is currently showing
  const [previewIdx, setPreviewIdx] = useState(0);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  // Track which questions are expanded (not collapsed)
  const [expandedQuestions, setExpandedQuestions] = useState(new Set([0]));
  useEffect(() => {
    if (previewIdx > questions.length - 1) {
      setPreviewIdx(Math.max(0, questions.length - 1));
    }
  }, [questions.length, previewIdx]);
  const handleHeaderChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  // ── Question Operations ──
  const handleAddQuestion = () => {
    const newQ = {
      display_order: questions.length + 1,
      question_type: "SingleChoice",
      question_text: "",
      marks: 1,
      negative_marks: 0,
      evaluation_mode: "Auto",
      explanation: "",
      numeric_answer: "",
      numeric_tolerance: 0,
      attachment_file_name: null,
      attachment_file_path: null,
      options: [
        { option_text: "", is_correct: true, display_order: 1 },
        { option_text: "", is_correct: false, display_order: 2 },
        { option_text: "", is_correct: false, display_order: 3 },
        { option_text: "", is_correct: false, display_order: 4 },
      ],
    };
    const next = [...questions, newQ];
    recalculateTotals(next);
    setPreviewIdx(next.length - 1);
  };
  const handleDuplicateQuestion = (idx) => {
    const q = questions[idx];
    const cloned = {
      ...q,
      display_order: questions.length + 1,
      question_text: `${q.question_text || ""} (Copy)`,
      options: (q.options || []).map((opt) => ({ ...opt })),
    };
    const next = [...questions, cloned];
    recalculateTotals(next);
    setPreviewIdx(next.length - 1);
  };
  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return;
    const next = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, display_order: i + 1 }));
    recalculateTotals(next);
  };
  const handleMoveQuestion = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const items = [...questions];
    const [moved] = items.splice(idx, 1);
    items.splice(targetIdx, 0, moved);
    const updated = items.map((item, i) => ({ ...item, display_order: i + 1 }));
    setFormData((p) => ({ ...p, questions: updated }));
  };
  const handleQuestionChange = (idx, field, value) => {
    const next = [...questions];
    const currentQ = { ...next[idx], [field]: value };
    // Auto switch evaluation mode & setup default options
    if (field === "question_type") {
      if (["ShortText", "LongText", "PracticalTask"].includes(value)) {
        currentQ.evaluation_mode = "Manual";
      } else {
        currentQ.evaluation_mode = "Auto";
      }
      if (value === "TrueFalse") {
        currentQ.options = [
          { option_text: "True", is_correct: true, display_order: 1 },
          { option_text: "False", is_correct: false, display_order: 2 },
        ];
      } else if (value === "SingleChoice" || value === "MultipleChoice") {
        if (!currentQ.options || currentQ.options.length === 0) {
          currentQ.options = [
            { option_text: "", is_correct: true, display_order: 1 },
            { option_text: "", is_correct: false, display_order: 2 },
            { option_text: "", is_correct: false, display_order: 3 },
            { option_text: "", is_correct: false, display_order: 4 },
          ];
        }
      }
    }
    next[idx] = currentQ;
    if (field === "marks") {
      recalculateTotals(next);
    } else {
      setFormData((p) => ({ ...p, questions: next }));
    }
  };
  // ── Choice Option Operations ──
  const handleOptionTextChange = (qIdx, optIdx, text) => {
    const next = [...questions];
    const opts = [...(next[qIdx].options || [])];
    opts[optIdx] = { ...opts[optIdx], option_text: text };
    next[qIdx].options = opts;
    setFormData((p) => ({ ...p, questions: next }));
  };
  const handleCorrectToggle = (qIdx, optIdx) => {
    if (isViewMode) return;
    const next = [...questions];
    const qType = next[qIdx].question_type;
    const opts = (next[qIdx].options || []).map((opt, i) => {
      if (qType === "SingleChoice" || qType === "TrueFalse") {
        return { ...opt, is_correct: i === optIdx };
      } else if (qType === "MultipleChoice") {
        return i === optIdx ? { ...opt, is_correct: !opt.is_correct } : opt;
      }
      return opt;
    });
    next[qIdx].options = opts;
    setFormData((p) => ({ ...p, questions: next }));
  };
  const handleAddOption = (qIdx) => {
    const next = [...questions];
    const opts = [...(next[qIdx].options || [])];
    opts.push({ option_text: "", is_correct: false, display_order: opts.length + 1 });
    next[qIdx].options = opts;
    setFormData((p) => ({ ...p, questions: next }));
  };
  const handleRemoveOption = (qIdx, optIdx) => {
    const next = [...questions];
    const opts = (next[qIdx].options || []).filter((_, i) => i !== optIdx).map((o, i) => ({ ...o, display_order: i + 1 }));
    next[qIdx].options = opts;
    setFormData((p) => ({ ...p, questions: next }));
  };
  // ── Attachment Handling for Questions ──
  const handleFileChange = (qIdx, file) => {
    if (file) {
      setQuestionFiles((prev) => ({ ...prev, [qIdx]: file }));
      const next = [...questions];
      next[qIdx] = {
        ...next[qIdx],
        attachment_file_name: file.name,
        attachment_file_size: file.size,
      };
      setFormData((p) => ({ ...p, questions: next }));
    }
  };
  const handleRemoveFile = (qIdx) => {
    setQuestionFiles((prev) => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
    const next = [...questions];
    next[qIdx] = {
      ...next[qIdx],
      attachment_file_name: null,
      attachment_file_path: null,
      attachment_file_size: null,
    };
    setFormData((p) => ({ ...p, questions: next }));
  };
  const recalculateTotals = (qList) => {
    const totMarks = qList.reduce((acc, q) => acc + parseFloat(q.marks || 0), 0);
    setFormData((p) => ({
      ...p,
      questions: qList,
      total_questions: qList.length,
      total_marks: totMarks,
      passing_marks: p.passing_marks || Math.round(totMarks * 0.5),
    }));
  };
  const totalPossibleMarks = questions.reduce((acc, q) => acc + parseFloat(q.marks || 0), 0);
  const previewQuestion = questions[previewIdx] || questions[0] || null;
  // Check if question is "complete" (auto-collapse when filled)
  // Requires: text, type, marks set, and for choice types: options with correct answer
  const isQuestionComplete = (q) => {
    if (!q.question_text?.trim() || !q.question_type || q.marks <= 0) return false;
    const isChoice = ["SingleChoice", "MultipleChoice", "TrueFalse"].includes(q.question_type);
    const isNumeric = q.question_type === "Numeric";
    if (isChoice) {
      const hasOptions = (q.options || []).length > 0;
      const hasCorrect = (q.options || []).some((o) => o.is_correct);
      return hasOptions && hasCorrect;
    }
    if (isNumeric) {
      return q.numeric_answer !== null && q.numeric_answer !== undefined && q.numeric_answer !== "";
    }
    // Text/Practical types: just need text, type, and marks
    return true;
  };
  // Toggle question expand/collapse
  const toggleQuestionExpand = (qIdx) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qIdx)) {
        next.delete(qIdx);
      } else {
        next.add(qIdx);
      }
      return next;
    });
  };
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start lg:min-h-[calc(100vh-24px)]">
        {/* ══════════════ LEFT: BUILDER ══════════════ */}
        <div className="lg:col-span-7 space-y-3">
          {/* ── Section 1: Assessment Header Settings ── */}
          <SectionCard
            title="Assessment Details & Rules"
            icon={<Award className="w-3 h-3" />}
            theme="indigo"
            bodyClassName="grid grid-cols-1 sm:grid-cols-4 gap-3"
            collapsed={detailsCollapsed}
            onToggle={() => setDetailsCollapsed((c) => !c)}
          >
            <FormField label="Assessment Code">
              <input
                type="text"
                disabled
                value={formData.assessment_code || ""}
                className={`${formInputClass(true, false)} font-mono`}
              />
            </FormField>
            <FormField label="Assessment Title" required error={errors.assessment_name} className="sm:col-span-2">
              <input
                type="text"
                disabled={isViewMode}
                value={formData.assessment_name || ""}
                onChange={(e) => handleHeaderChange("assessment_name", e.target.value)}
                placeholder="e.g. Accounts Executive Practical Test, React Developer Exam"
                className={`${formInputClass(isViewMode, errors.assessment_name)} font-medium`}
              />
            </FormField>
            <FormField label="Status">
              <select
                disabled={isViewMode}
                value={formData.status || "Active"}
                onChange={(e) => handleHeaderChange("status", e.target.value)}
                className={formInputClass(isViewMode, false)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
            <FormField label="Duration (Minutes)">
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="5"
                  disabled={isViewMode}
                  value={formData.estimated_duration_minutes || 30}
                  onChange={(e) => handleHeaderChange("estimated_duration_minutes", e.target.value)}
                  className={`${formInputClass(isViewMode, false)} pl-7`}
                />
              </div>
            </FormField>
            <FormField label="Passing Marks" hint={totalPossibleMarks > 0 ? `out of ${totalPossibleMarks}` : ""}>
              <input
                type="number"
                step="any"
                min="0"
                disabled={isViewMode}
                value={formData.passing_marks ?? Math.round(totalPossibleMarks * 0.5)}
                onChange={(e) => handleHeaderChange("passing_marks", e.target.value)}
                className={`${formInputClass(isViewMode, false)} font-bold text-emerald-700`}
              />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <input
                type="text"
                disabled={isViewMode}
                value={formData.description || ""}
                onChange={(e) => handleHeaderChange("description", e.target.value)}
                placeholder="Short description for candidate or internal notes..."
                className={formInputClass(isViewMode, false)}
              />
            </FormField>
            <FormField label="Candidate Instructions" hint="Shown on start screen" className="sm:col-span-4">
              <textarea
                rows={2}
                disabled={isViewMode}
                value={formData.instructions || ""}
                onChange={(e) => handleHeaderChange("instructions", e.target.value)}
                placeholder="Instructions for candidate (e.g. Read questions carefully, submission is final...)"
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded outline-none resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </FormField>
          </SectionCard>
          {/* ── Section 2: All-in-One Inline Question Builder ── */}
          <SectionCard
            title={`Assessment Questions (${questions.length})`}
            icon={<HelpCircle className="w-3 h-3" />}
            theme="indigo"
            bodyClassName="space-y-3"
            right={
              !isViewMode && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Question
                </button>
              )
            }
          >
            {questions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-lg bg-slate-50">
                No questions added yet. {!isViewMode && <span>Click <button type="button" onClick={handleAddQuestion} className="font-semibold text-blue-600 hover:underline">"Add Question"</button> to start building the test paper.</span>}
              </div>
            ) : (
              (() => {
                const q = questions[previewIdx];
                const qIdx = previewIdx;
                const isSingle = q.question_type === "SingleChoice" || q.question_type === "TrueFalse";
                const isMulti = q.question_type === "MultipleChoice";
                const isExpanded = true; // Always show full form for selected question
                const isComplete = isQuestionComplete(q);
                return (
                  <div
                    key={qIdx}
                    className={`border rounded-lg relative transition-all ${previewIdx === qIdx ? "border-blue-400 ring-1 ring-blue-100" : "border-slate-200 hover:border-blue-300"
                      } ${isExpanded ? "bg-slate-50/50 p-3 space-y-3" : "bg-white p-2"}`}
                  >
                    {/* Question Header (clickable to expand/collapse) */}
                    <div
                      onClick={() => {
                        toggleQuestionExpand(qIdx);
                        setPreviewIdx(qIdx);
                      }}
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`w-5 h-5 rounded-full ${isComplete ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-blue-100 text-blue-700 border-blue-200"} font-bold text-[11px] flex items-center justify-center border`}>
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Question #{qIdx + 1}</span>
                        {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {previewIdx === qIdx && !isExpanded && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                            <Eye className="w-2.5 h-2.5" /> Previewing
                          </span>
                        )}
                        {isExpanded && q.question_text && (
                          <span className="text-[11px] text-slate-500 truncate ml-2 italic">
                            {q.question_text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{q.marks ?? 1}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    {/* Expanded Question Content */}
                    {isExpanded && (
                      <>
                        <div className="border-t border-slate-200" />
                        {!isViewMode && (
                          <div className="flex justify-end items-center gap-1">
                            <button
                              type="button"
                              disabled={qIdx === 0}
                              onClick={() => handleMoveQuestion(qIdx, -1)}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-50"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={qIdx === questions.length - 1}
                              onClick={() => handleMoveQuestion(qIdx, 1)}
                              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-50"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateQuestion(qIdx)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                title="Remove Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        {/* Question fields */}
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_190px_82px_82px] gap-3 items-start">
                          <div className="min-w-0">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Question Statement <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={2}
                              disabled={isViewMode}
                              value={q.question_text || ""}
                              onChange={(e) => handleQuestionChange(qIdx, "question_text", e.target.value)}
                              placeholder="Type question text or case study details here..."
                              className="w-full h-12 p-2 text-xs bg-white border border-slate-300 rounded focus:border-blue-500 outline-none resize-none font-medium disabled:bg-[#eef1f6] disabled:text-slate-500"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Question Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              disabled={isViewMode}
                              value={q.question_type || "SingleChoice"}
                              onChange={(e) => handleQuestionChange(qIdx, "question_type", e.target.value)}
                              className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded font-medium text-slate-800 outline-none focus:border-blue-500 disabled:bg-[#eef1f6] disabled:text-slate-500"
                            >
                              {QUESTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="min-w-0">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Positive (+)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              disabled={isViewMode}
                              value={q.marks ?? 1}
                              onChange={(e) => handleQuestionChange(qIdx, "marks", e.target.value)}
                              className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded font-bold text-emerald-700 outline-none focus:border-blue-500 disabled:bg-[#eef1f6]"
                            />
                          </div>
                          <div className="min-w-0">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Negative (-)</label>
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              disabled={isViewMode}
                              value={q.negative_marks ?? 0}
                              onChange={(e) => handleQuestionChange(qIdx, "negative_marks", e.target.value)}
                              className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded text-red-600 outline-none focus:border-blue-500 disabled:bg-[#eef1f6]"
                            />
                          </div>
                        </div>
                        {/* ── Question Problem Document Attachment (Excel / PDF / Doc) ── */}
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-700 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {q.attachment_file_name ? (
                              <span className="font-semibold text-blue-800 truncate">Attached: {q.attachment_file_name}</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Attach problem Excel file or PDF document for candidate to solve</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {q.attachment_file_path && (
                              <a
                                href={q.attachment_file_path}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded"
                              >
                                <Download className="w-3 h-3" /> View File
                              </a>
                            )}
                            {!isViewMode && (
                              <>
                                <input
                                  type="file"
                                  id={`q-file-${qIdx}`}
                                  onChange={(e) => handleFileChange(qIdx, e.target.files?.[0])}
                                  accept=".xlsx,.xls,.pdf,.docx,.doc,.zip,.png,.jpg"
                                  className="hidden"
                                />
                                {q.attachment_file_name ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(qIdx)}
                                    className="p-1 text-slate-400 hover:text-red-600"
                                    title="Remove file"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <label
                                    htmlFor={`q-file-${qIdx}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold cursor-pointer shadow-2xs"
                                  >
                                    <Paperclip className="w-3 h-3" /> Attach Excel/PDF
                                  </label>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {/* ── Choice Options Section (Single, Multiple, True/False) ── */}
                        {["SingleChoice", "MultipleChoice", "TrueFalse"].includes(q.question_type) && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Answer Options ({isSingle ? "Click radio to mark correct" : "Check all correct answers"}):</span>
                              {!isViewMode && q.question_type !== "TrueFalse" && (
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(qIdx)}
                                  className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Option
                                </button>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              {(q.options || []).map((opt, optIdx) => {
                                const isCorrect = Boolean(opt.is_correct);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center gap-2 p-1.5 rounded border text-xs ${isCorrect
                                      ? "bg-emerald-50/60 border-emerald-300"
                                      : "bg-white border-slate-200"
                                      }`}
                                  >
                                    <button
                                      type="button"
                                      disabled={isViewMode}
                                      onClick={() => handleCorrectToggle(qIdx, optIdx)}
                                      className={`shrink-0 ${isCorrect ? "text-emerald-600" : "text-slate-300 hover:text-slate-500"
                                        }`}
                                    >
                                      {isCorrect ? (
                                        <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                                      ) : (
                                        <Circle className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span className="font-mono text-[11px] text-slate-400 font-semibold w-4">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <input
                                      type="text"
                                      disabled={isViewMode || q.question_type === "TrueFalse"}
                                      value={opt.option_text || ""}
                                      onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)} statement`}
                                      className="flex-1 h-6 px-1.5 text-xs bg-transparent border-none outline-none font-medium"
                                    />
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      disabled={isViewMode}
                                      value={opt.marks ?? 0}
                                      onChange={(e) => {
                                        const next = [...questions];
                                        const opts = [...(next[qIdx].options || [])];
                                        opts[optIdx] = { ...opts[optIdx], marks: e.target.value };
                                        next[qIdx].options = opts;
                                        const sumMarks = opts.reduce((acc, o) => acc + parseFloat(o.marks || 0), 0);
                                        next[qIdx].marks = sumMarks;
                                        recalculateTotals(next);
                                      }}
                                      placeholder="0"
                                      className="w-12 h-6 px-1 text-xs bg-white border border-slate-300 rounded outline-none text-right font-semibold text-emerald-700"
                                      title="Marks for this option"
                                    />
                                    {!isViewMode && q.question_type !== "TrueFalse" && (q.options || []).length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(qIdx, optIdx)}
                                        className="text-slate-300 hover:text-red-500 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* ── Numeric Calculation Fields ── */}
                        {q.question_type === "Numeric" && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Expected Numeric Answer <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="any"
                                disabled={isViewMode}
                                value={q.numeric_answer ?? ""}
                                onChange={(e) => handleQuestionChange(qIdx, "numeric_answer", e.target.value)}
                                placeholder="e.g. 1500.50"
                                className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Tolerance Margin (±)
                              </label>
                              <input
                                type="number"
                                step="any"
                                disabled={isViewMode}
                                value={q.numeric_tolerance ?? 0}
                                onChange={(e) => handleQuestionChange(qIdx, "numeric_tolerance", e.target.value)}
                                placeholder="e.g. 0.05"
                                className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded outline-none"
                              />
                            </div>
                          </div>
                        )}
                        {/* ── Subjective / Task Notice ── */}
                        {["ShortText", "LongText", "PracticalTask"].includes(q.question_type) && (
                          <div className="bg-slate-50 border rounded p-2 text-[11px] text-slate-500">
                            Candidate will write text and/or upload solved files. HR can evaluate and award marks manually in Candidate Tracking.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()
            )}
          </SectionCard>
          {/* ── Totals Summary Footer Bar ── */}
          <SectionCard
            title="Totals"
            icon={<BarChart3 className="w-3 h-3" />}
            theme="slate"
            bodyClassName="flex flex-wrap items-center gap-6"
          >
            <div>
              <span className="text-slate-500 block text-[10.5px] font-semibold">Total Questions</span>
              <span className="font-bold text-slate-800 text-sm">{questions.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10.5px] font-semibold">Total Marks</span>
              <span className="font-bold text-emerald-700 text-sm">{totalPossibleMarks}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10.5px] font-semibold">Passing Marks</span>
              <span className="font-bold text-blue-700 text-sm">
                {formData.passing_marks ?? Math.round(totalPossibleMarks * 0.5)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10.5px] font-semibold">Duration</span>
              <span className="font-bold text-slate-800 text-sm">
                {formData.estimated_duration_minutes || 30} mins
              </span>
            </div>
          </SectionCard>
        </div>
        {/* ══════════════ RIGHT: LIVE CANDIDATE PREVIEW ══════════════ */}
        <div className="lg:col-span-5 lg:sticky lg:top-3 lg:h-[calc(100vh-24px)] flex flex-col">
          <SectionCard
            title="Candidate View – Live Preview"
            icon={<Eye className="w-3 h-3" />}
            theme="violet"
            className="flex-1 min-h-0 flex flex-col"
            bodyClassName="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden"
          >
            {/* Mock assessment start screen strip */}
            <div className="space-y-1.5 pb-2.5 border-b border-dashed border-slate-200">
              <h4 className="text-xs font-bold text-slate-800">
                {formData.assessment_name || "Untitled Assessment"}
              </h4>
              {formData.description && (
                <p className="text-[11px] text-slate-500">{formData.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                  <ListChecks className="w-3 h-3" /> {questions.length} Questions
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                  <Clock className="w-3 h-3" /> {formData.estimated_duration_minutes || 30} mins
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5">
                  <Award className="w-3 h-3" /> {totalPossibleMarks} marks
                </span>
              </div>
              {formData.instructions && (
                <p className="text-[10.5px] text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                  {formData.instructions}
                </p>
              )}
            </div>
            {/* Questions List (clickable to switch editing) */}
            {/* Questions List */}
            {questions.length > 0 && (
              <div className="flex flex-col min-h-0 flex-1 space-y-2 pb-3 border-b">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-slate-700">Questions ({questions.length})</span>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isComplete = isQuestionComplete(q);
                    const isSelected = idx === previewIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewIdx(idx)}
                        className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium transition-all ${isSelected
                          ? "bg-blue-100 border border-blue-400 text-blue-900"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                            {idx + 1}
                          </span>
                          <span className="truncate flex-1">{q.question_text || `Question ${idx + 1}`}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">+{q.marks ?? 1}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Selected question, rendered as the candidate will see it */}
            {previewQuestion ? (
              <div className="shrink-0 max-h-[40%] overflow-y-auto space-y-2">
                <div className="text-[10.5px] font-semibold text-slate-400">
                  Question {previewIdx + 1} of {questions.length}
                </div>
                <PreviewQuestion q={previewQuestion} index={previewIdx} />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed rounded-lg bg-slate-50">
                Add a question on the left to preview how it will look to the candidate.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
export default AssessmentMasterForm;

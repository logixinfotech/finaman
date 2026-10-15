import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Paperclip,
  Check,
  ShieldAlert,
  HelpCircle,
  Smartphone,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  validateAssessmentToken,
  verifyAssessmentPhone,
  startAssessment,
  saveCandidateAnswer,
  submitCandidateAssessment,
  registerForAssessment,
  getOpenAssessmentInfo,
} from "../../utils/publicAssessmentApi";

const ERP = {
  navy: "#0f2137",
  page: "#f0f4f9",
};

export default function PublicCandidateAssessment() {
  const [searchParams] = useSearchParams();
  const db = searchParams.get("db") || searchParams.get("database") || "default";
  const assessmentIdParam = searchParams.get("aid") || "";
  // Token comes from the URL (per-candidate link) or from /register (open assessment link)
  const [token, setToken] = useState(searchParams.get("token") || "");

  const [openInfo, setOpenInfo] = useState(null);
  const [regForm, setRegForm] = useState({ full_name: "", mobile: "", email: "" });
  const [regError, setRegError] = useState("");
  const [registering, setRegistering] = useState(false);

  const [screen, setScreen] = useState("loading"); // loading | register | verify_phone | instructions | test | submitted | error
  const [validationData, setValidationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [verifyMobile, setVerifyMobile] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyPhoneError, setVerifyPhoneError] = useState("");

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: { selected_option_id, answer_text, answer_numeric, answer_json, file } }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // ── Step 1: Validate Token on Mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      // Open assessment link (?aid=...): show the candidate details form first
      if (assessmentIdParam) {
        (async () => {
          try {
            setScreen("loading");
            const info = await getOpenAssessmentInfo(db, assessmentIdParam);
            setOpenInfo(info?.data || null);
            setScreen("register");
          } catch (err) {
            setErrorMessage(err.response?.data?.message || "This assessment link is not available.");
            setScreen("error");
          }
        })();
        return;
      }
      setErrorMessage("No assessment access token provided in the URL.");
      setScreen("error");
      return;
    }

    (async () => {
      try {
        setScreen("loading");
        const res = await validateAssessmentToken(db, token);
        if (res?.valid && res?.data) {
          setValidationData(res.data);
          if (res.data.phone_verified) {
            setScreen("instructions");
          } else {
            setScreen("verify_phone");
          }
        } else {
          setErrorMessage(res?.message || "Invalid or expired assessment link.");
          setScreen("error");
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || err.message || "Failed to validate assessment link.");
        setScreen("error");
      }
    })();
  }, [db, token, assessmentIdParam]);

  // ── Step 1.5: Candidate Phone Verification Handlers ─────────────────────────
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setVerifyPhoneError("");
    const cleaned = (verifyMobile || "").replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setVerifyPhoneError("Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      setVerifyingPhone(true);
      const res = await verifyAssessmentPhone(db, token, cleaned);
      if (res?.success) {
        setValidationData((prev) => ({
          ...prev,
          phone_verified: true,
          candidate_name: res.data?.candidate_name || prev?.candidate_name,
        }));
        setScreen("instructions");
      } else {
        setVerifyPhoneError(res?.message || "Entered mobile number does not match registered details.");
      }
    } catch (err) {
      setVerifyPhoneError(
        err.response?.data?.message || err.message || "Mobile verification failed. Please try again."
      );
    } finally {
      setVerifyingPhone(false);
    }
  };

  // ── Open-link registration: candidate enters details, backend issues a token ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    const name = regForm.full_name.trim();
    const em = regForm.email.trim();
    if (name.length < 2) return setRegError("Enter your full name");
    if (regForm.mobile.length !== 10) return setRegError("Enter a valid 10-digit mobile number");
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return setRegError("Enter a valid email address");
    }
    try {
      setRegistering(true);
      const res = await registerForAssessment(db, {
        assessment_id: assessmentIdParam,
        full_name: name,
        mobile: regForm.mobile,
        email: regForm.email.trim(),
        honeypot,
      });
      if (res?.success && res?.data?.token) {
        setToken(res.data.token); // triggers validation effect → instructions screen
      } else {
        setRegError(res?.message || "Could not register. Please try again.");
      }
    } catch (err) {
      setRegError(err.response?.data?.message || err.message || "Could not register. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  // ── Auto Save Single Answer ─────────────────────────────────────────────────
  const saveCurrentAnswer = useCallback(
    async (qId, answerObj) => {
      if (!token || !qId || !answerObj) return;
      try {
        setSavingAnswer(true);
        let payload;
        if (answerObj.file) {
          payload = new FormData();
          payload.append("token", token);
          payload.append("question_id", qId);
          if (answerObj.selected_option_id) payload.append("selected_option_id", answerObj.selected_option_id);
          if (answerObj.answer_text) payload.append("answer_text", answerObj.answer_text);
          if (answerObj.answer_numeric !== undefined) payload.append("answer_numeric", answerObj.answer_numeric);
          if (answerObj.answer_json) payload.append("answer_json", answerObj.answer_json);
          payload.append("response_file", answerObj.file);
        } else {
          payload = {
            token,
            question_id: qId,
            selected_option_id: answerObj.selected_option_id || null,
            answer_text: answerObj.answer_text || null,
            answer_numeric: answerObj.answer_numeric !== undefined ? answerObj.answer_numeric : null,
            answer_json: answerObj.answer_json || null,
          };
        }
        await saveCandidateAnswer(db, payload);
      } catch (err) {
        console.warn("Autosave response error:", err);
      } finally {
        setSavingAnswer(false);
      }
    },
    [db, token]
  );

  // ── Final Submission ────────────────────────────────────────────────────────
  const handleSubmitAssessment = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await submitCandidateAssessment(db, {
        token,
        honeypot,
        duration_seconds_taken: elapsedSeconds,
      });
      if (res?.success) {
        if (timerRef.current) clearInterval(timerRef.current);
        setScreen("submitted");
      } else {
        alert(res?.message || "Failed to submit assessment");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  }, [db, token, honeypot, submitting]);

  // ── Timer Effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === "test" && timeLeftSeconds !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, timeLeftSeconds, handleSubmitAssessment]);

  // ── Step 2: Start Test Action ───────────────────────────────────────────────
  const handleStartTest = async () => {
    try {
      setScreen("loading");
      const res = await startAssessment(db, token, honeypot);
      if (res?.success && res?.data) {
        const data = res.data;
        setAssessment(data);
        const qList = data.questions || [];
        setQuestions(qList);

        // Pre-fill existing saved answers if any
        const initialAnswers = {};
        // API returns saved answers as an object keyed by question id
        Object.values(data.saved_responses || {}).forEach((r) => {
          initialAnswers[r.question_id] = {
            selected_option_id: r.selected_option_id,
            answer_text: r.answer_text,
            answer_numeric: r.answer_numeric ?? undefined,
            answer_json: r.answer_json,
            saved_file_name: r.saved_file_name,
            saved_file_path: r.saved_file_path,
          };
        });
        setAnswers(initialAnswers);

        // Set duration timer
        const durationMins = data.estimated_duration_minutes || 30;
        setTimeLeftSeconds(durationMins * 60);
        startTimeRef.current = Date.now();
        setScreen("test");
      } else {
        setErrorMessage(res?.message || "Could not start assessment.");
        setScreen("error");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Could not start assessment.");
      setScreen("error");
    }
  };

  // ── Answer Change Handlers ──────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex] || null;

  const handleSelectOption = (optId) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.question_id;

    if (currentQuestion.question_type === "MultipleChoice") {
      const currentAnswerObj = answers[qId] || {};
      let selectedList = [];
      try {
        selectedList = currentAnswerObj.answer_json ? JSON.parse(currentAnswerObj.answer_json) : [];
      } catch (e) {
        selectedList = [];
      }
      if (selectedList.includes(optId)) {
        selectedList = selectedList.filter((id) => id !== optId);
      } else {
        selectedList.push(optId);
      }
      const updated = {
        ...currentAnswerObj,
        selected_option_id: selectedList[0] || null,
        answer_json: JSON.stringify(selectedList),
      };
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
      saveCurrentAnswer(qId, updated);
    } else {
      // Single Choice / True False
      const updated = {
        ...(answers[qId] || {}),
        selected_option_id: optId,
      };
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
      saveCurrentAnswer(qId, updated);
    }
  };

  const handleTextAnswerChange = (text) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.question_id;
    const updated = { ...(answers[qId] || {}), answer_text: text };
    setAnswers((prev) => ({ ...prev, [qId]: updated }));
  };

  const handleNumericAnswerChange = (num) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.question_id;
    const updated = { ...(answers[qId] || {}), answer_numeric: num };
    setAnswers((prev) => ({ ...prev, [qId]: updated }));
    saveCurrentAnswer(qId, updated);
  };

  const handleRatingAnswerChange = (rating) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.question_id;
    const updated = {
      ...(answers[qId] || {}),
      answer_numeric: rating,
      answer_json: JSON.stringify({ rating }),
    };
    setAnswers((prev) => ({ ...prev, [qId]: updated }));
    saveCurrentAnswer(qId, updated);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentQuestion) return;
    const qId = currentQuestion.question_id;
    const updated = {
      ...(answers[qId] || {}),
      file,
      temp_file_name: file.name,
    };
    setAnswers((prev) => ({ ...prev, [qId]: updated }));
    saveCurrentAnswer(qId, updated);
  };

  // ── Navigation ──
  const handleNext = () => {
    if (currentQuestion) {
      saveCurrentAnswer(currentQuestion.question_id, answers[currentQuestion.question_id]);
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion) {
      saveCurrentAnswer(currentQuestion.question_id, answers[currentQuestion.question_id]);
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Format timer HH:MM:SS
  const formatTime = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Render Screens ──────────────────────────────────────────────────────────

  // 1. Loading
  if (screen === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9]">
        <div className="bg-white p-6 rounded-xl shadow-sm flex items-center gap-3 text-xs font-semibold text-slate-700">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Verifying Assessment Link...</span>
        </div>
      </div>
    );
  }

  // 1b. Open-link registration (candidate enters details before the test)
  if (screen === "register") {
    const inputCls =
      "w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f4f9] font-sans">
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white">
          <div className="max-w-4xl mx-auto">
            <span className="text-xs font-bold tracking-wide block">FINAMAN ERP</span>
            <span className="text-[10px] text-slate-300">Careers & Assessment Portal</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <form
            onSubmit={handleRegister}
            noValidate
            className="bg-white rounded-xl shadow-md max-w-md w-full p-6 space-y-4 border border-slate-200"
          >
            <div className="border-b pb-3">
              <h1 className="text-base font-bold text-slate-900">
                {openInfo?.assessment_name || "Candidate Assessment"}
              </h1>
              {openInfo?.description && <p className="text-xs text-slate-500 mt-1">{openInfo.description}</p>}
              <p className="text-[11px] text-slate-500 mt-1.5">
                {openInfo?.total_questions || "--"} questions · {openInfo?.estimated_duration_minutes || 30} minutes
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={regForm.full_name}
                maxLength={100}
                onChange={(e) => setRegForm((p) => ({ ...p, full_name: e.target.value.replace(/[^a-zA-Z\s.-]/g, "") }))}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mobile Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                className={`${inputCls} font-mono`}
                inputMode="numeric"
                value={regForm.mobile}
                maxLength={10}
                onChange={(e) => setRegForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                placeholder="10-digit mobile number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                type="email"
                value={regForm.email}
                maxLength={100}
                onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </div>

            {/* Hidden honeypot */}
            <input
              type="text"
              name="honeypot_field"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: "none" }}
              tabIndex="-1"
              autoComplete="off"
            />

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{regError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={registering}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2"
            >
              {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </main>
      </div>
    );
  }

  // 2. Error Screen
  if (screen === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] p-4 font-sans">
        <div className="bg-white rounded-xl shadow-md max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
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

  // 3. Submitted Confirmation Screen
  if (screen === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] p-4 font-sans">
        <div className="bg-white rounded-xl shadow-md max-w-lg w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assessment Submitted Successfully!</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Thank you for completing your evaluation. Your responses have been securely recorded and sent to our recruitment team for review.
            </p>
          </div>
          <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 text-left space-y-1">
            <span className="font-bold block">What happens next?</span>
            <p className="text-[11.5px] text-blue-800">
              Our hiring team will evaluate your submission. If shortlisted, you will receive an invitation for the next round via Email.
            </p>
          </div>
          <div className="pt-3 text-[11px] text-slate-400">
            You may now safely close this browser window.
          </div>
        </div>
      </div>
    );
  }

  // 4. Verify with Phone Screen (Mandatory identity check)
  if (screen === "verify_phone") {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f0f4f9] font-sans">
        {/* Navy Header */}
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wide block">FINAMAN ERP</span>
              <span className="text-[10px] text-slate-300">Careers & Assessment Portal</span>
            </div>
            <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded text-slate-200 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              Candidate Verification
            </span>
          </div>
        </header>

        {/* Verification Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-13 h-13 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">
                Verify Your Mobile Number
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Please enter your registered mobile number to verify your identity before taking the assessment.
              </p>
            </div>

            {/* Assessment Info Pill */}
            {validationData?.assessment_name && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{validationData.assessment_name}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Questions: <strong>{validationData.total_questions || "--"}</strong></span>
                  <span>Duration: <strong>{validationData.estimated_duration_minutes || 30} mins</strong></span>
                  <span>Marks: <strong>{validationData.total_marks || "--"}</strong></span>
                </div>
              </div>
            )}

            {/* Hint if masked mobile available */}
            {validationData?.masked_mobile && (
              <div className="px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center gap-2 text-xs text-blue-800">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Registered phone hint: <strong className="font-mono tracking-wider">{validationData.masked_mobile}</strong>
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyPhone} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1.5">
                  Enter Registered Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex rounded-md shadow-2xs">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-600 font-medium text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    autoFocus
                    placeholder="Enter 10-digit mobile number"
                    value={verifyMobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setVerifyMobile(val);
                      if (verifyPhoneError) setVerifyPhoneError("");
                    }}
                    className="flex-1 min-w-0 block w-full px-3 py-2 text-xs border border-slate-300 rounded-none rounded-r-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium tracking-wider"
                  />
                </div>
              </div>

              {verifyPhoneError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{verifyPhoneError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingPhone || verifyMobile.length !== 10}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifyingPhone ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-[11px] text-slate-400 border-t">
              This verification ensures your submission is linked to your candidate profile.
            </div>
          </div>
        </main>

        <footer className="text-center text-[10.5px] text-slate-400 py-3">
          © {new Date().getFullYear()} FINHRMS Recruitment. All rights reserved.
        </footer>
      </div>
    );
  }

  // 5. Instructions / Welcome Screen
  if (screen === "instructions") {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f0f4f9] font-sans">
        {/* Navy Header */}
        <header style={{ background: ERP.navy }} className="py-3 px-4 shadow-sm text-white">
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

        {/* Instructions Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-md max-w-2xl w-full p-6 space-y-5 border border-slate-200">
            <div className="border-b pb-4">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Welcome, {validationData.candidate_name || "Candidate"}
              </span>
              <h1 className="text-lg font-bold text-slate-900 mt-1">
                {validationData.assessment_name || "Candidate Assessment"}
              </h1>
              {validationData.description && (
                <p className="text-xs text-slate-500 mt-1">{validationData.description}</p>
              )}
            </div>

            {/* Test Metadata Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">
                  {validationData.estimated_duration_minutes || 30} Minutes
                </span>
                <span className="text-[10px] text-slate-500">Duration</span>
              </div>
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <HelpCircle className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">
                  {validationData.total_questions || "--"} Questions
                </span>
                <span className="text-[10px] text-slate-500">Total Questions</span>
              </div>
              <div className="bg-slate-50 border rounded-lg p-2.5">
                <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 block">
                  {validationData.total_marks || "--"} Marks
                </span>
                <span className="text-[10px] text-slate-500">Total Marks</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3.5 space-y-2 text-xs text-amber-900">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Important Instructions:
              </span>
              <ul className="list-disc list-inside text-[11.5px] space-y-1 text-amber-800 leading-relaxed">
                <li>Ensure a stable internet connection before beginning.</li>
                <li>The timer will start automatically once you click "Start Assessment".</li>
                <li>Your answers are auto-saved as you progress through each question.</li>
                <li>
                  {validationData.instructions ||
                    "Read all questions carefully. You may review and change your answers before final submission."}
                </li>
              </ul>
            </div>

            {/* Hidden Honeypot */}
            <input
              type="text"
              name="honeypot_field"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: "none" }}
              tabIndex="-1"
              autoComplete="off"
            />

            {/* Start Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartTest}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Start Assessment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-[10.5px] text-slate-400 py-3">
          © {new Date().getFullYear()} FINHRMS Recruitment. All rights reserved.
        </footer>
      </div>
    );
  }

  // 5. Active Test Screen
  const qAns = currentQuestion ? answers[currentQuestion.question_id] || {} : {};
  const isMulti = currentQuestion?.question_type === "MultipleChoice";
  let multiSelectedIds = [];
  if (isMulti) {
    try {
      multiSelectedIds = qAns.answer_json ? JSON.parse(qAns.answer_json) : [];
    } catch (e) {
      multiSelectedIds = [];
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f9] font-sans">
      {/* ── Test Top Bar ── */}
      <header style={{ background: ERP.navy }} className="py-2.5 px-4 shadow-sm text-white shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-wide">{assessment?.assessment_name || "Assessment"}</span>
            <span className="text-[10px] text-slate-300 block">
              Candidate: {validationData?.candidate_name}
            </span>
          </div>

          {/* Live Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold shadow-xs ${
              timeLeftSeconds !== null && timeLeftSeconds < 300
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white/15 text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>
        </div>
      </header>

      {/* ── Main Question Panel ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-3">
        {/* Progress & Question Palette Ribbon */}
        <div className="bg-white border rounded-lg p-2.5 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {questions.map((q, idx) => {
              const hasAns = Boolean(
                answers[q.question_id]?.selected_option_id ||
                  answers[q.question_id]?.answer_text ||
                  answers[q.question_id]?.answer_numeric !== undefined ||
                  answers[q.question_id]?.file ||
                  answers[q.question_id]?.saved_file_name
              );
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    saveCurrentAnswer(currentQuestion.question_id, answers[currentQuestion.question_id]);
                    setCurrentIndex(idx);
                  }}
                  className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300 font-bold"
                      : hasAns
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* ── Active Question Card ── */}
        {currentQuestion && (
          <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-xs font-bold text-blue-700 font-mono">
                  QUESTION #{currentIndex + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    {currentQuestion.difficulty || "Medium"}
                  </span>
                  <span className="text-[10.5px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    +{currentQuestion.marks} Marks
                  </span>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.question_text}
              </div>

              {/* ── Question Reference Document (Excel / PDF / Doc Download) ── */}
              {currentQuestion.attachment_file_name && currentQuestion.attachment_file_path && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-blue-950">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold block">{currentQuestion.attachment_file_name}</span>
                      <span className="text-[10.5px] text-blue-700">
                        Reference problem document provided for this question
                      </span>
                    </div>
                  </div>
                  <a
                    href={currentQuestion.attachment_file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </a>
                </div>
              )}

              {/* ── Type-Specific Answer Inputs ── */}

              {/* 1. Choice Options (Single Choice, Multiple Choice, True/False) */}
              {["SingleChoice", "MultipleChoice", "TrueFalse"].includes(currentQuestion.question_type) && (
                <div className="space-y-2.5 pt-1">
                  {(currentQuestion.options || []).map((opt, idx) => {
                    const isSelected = isMulti
                      ? multiSelectedIds.includes(opt.option_id)
                      : String(qAns.selected_option_id).toLowerCase() === String(opt.option_id).toLowerCase();

                    return (
                      <div
                        key={opt.option_id || idx}
                        onClick={() => handleSelectOption(opt.option_id)}
                        className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-200 shadow-2xs font-semibold"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-${isMulti ? "md" : "full"} border flex items-center justify-center transition-colors ${
                            isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-mono text-slate-400 font-semibold w-4">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="flex-1">{opt.option_text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Numeric Input */}
              {currentQuestion.question_type === "Numeric" && (
                <div className="space-y-2 pt-1 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700">Enter Numeric Answer</label>
                  <input
                    type="number"
                    step="any"
                    value={qAns.answer_numeric ?? ""}
                    onChange={(e) => handleNumericAnswerChange(e.target.value)}
                    placeholder="Type number here..."
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none font-semibold text-slate-800"
                  />
                </div>
              )}

              {/* 3. Rating Scale */}
              {currentQuestion.question_type === "Rating" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: (currentQuestion.rating_max || 5) - (currentQuestion.rating_min || 1) + 1 },
                      (_, i) => (currentQuestion.rating_min || 1) + i
                    ).map((r) => {
                      const isSel = qAns.answer_numeric === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRatingAnswerChange(r)}
                          className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all ${
                            isSel
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 max-w-sm">
                    <span>{currentQuestion.rating_min_label || "Min"}</span>
                    <span>{currentQuestion.rating_max_label || "Max"}</span>
                  </div>
                </div>
              )}

              {/* 4. Text and Practical Task */}
              {["ShortText", "LongText", "PracticalTask"].includes(currentQuestion.question_type) && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Written Answer / Explanation
                    </label>
                    <textarea
                      rows={currentQuestion.question_type === "LongText" ? 6 : 3}
                      value={qAns.answer_text || ""}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={() => saveCurrentAnswer(currentQuestion.question_id, qAns)}
                      placeholder="Type your response or detailed solution here..."
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none resize-y"
                    />
                  </div>

                  {/* Candidate Solved File Upload (Excel / PDF / Doc) */}
                  {currentQuestion.question_type === "PracticalTask" && (
                    <div className="border border-dashed border-slate-300 rounded-lg p-3.5 bg-slate-50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        Upload Solved Task / Spreadsheet (Optional)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        You may attach your completed Excel file, calculation workbook, or PDF report.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="file"
                          id={`file-upload-${currentQuestion.question_id}`}
                          onChange={handleFileUpload}
                          accept=".xlsx,.xls,.pdf,.docx,.doc,.zip,.png,.jpg"
                          className="hidden"
                        />
                        <label
                          htmlFor={`file-upload-${currentQuestion.question_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          Choose Solved File
                        </label>

                        {(qAns.temp_file_name || qAns.saved_file_name) && (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {qAns.temp_file_name || qAns.saved_file_name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Navigation Actions Footer ── */}
            <div className="border-t pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {savingAnswer && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Next Question
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to submit your assessment? You cannot change your answers after submission.")) {
                        handleSubmitAssessment();
                      }
                    }}
                    disabled={submitting}
                    className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Assessment
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

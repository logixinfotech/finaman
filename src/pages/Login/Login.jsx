import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Eye, EyeOff, LogIn,
  AlertCircle,  Loader2,
  MonitorX, Building2, CalendarDays, Hash,
  X as CloseIcon,  
} from "lucide-react";
import { authenticateUser, selectCompany } from "../../utils/api";
import { useAuth } from "../../theme/AuthContext";

const errorVariant = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1, height: "auto", marginBottom: 14,
    transition: { duration: 0.22 }
  },
  exit: {
    opacity: 0, height: 0, marginBottom: 0,
    transition: { duration: 0.18 }
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
}; 
const fieldsVariant = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1, height: "auto", marginBottom: 4,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0, height: 0, marginBottom: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
  },
};

const DEFAULT_ACC_YEAR = "2024-2025"; 

function LoginPage({ onLoginSuccess }) {
   const { login } = useAuth();
  const [step, setStep] = useState("credentials");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForceLogin, setShowForceLogin] = useState(false); 
  const [companies, setCompanies] = useState([]);
  const [preToken, setPreToken] = useState("");
  const [selecting, setSelecting] = useState(null);
  const [search, setSearch] = useState("");

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const passwordRef = useRef(null);
  const searchRef = useRef(null);
  const rowRefs = useRef([]);
  const srNoBodyRef = useRef(null);
  const yearBodyRef = useRef(null);
  const nameBodyRef = useRef(null);

  const handleColumnScroll = (source) => {
    const top = source.current?.scrollTop || 0;
    [srNoBodyRef, yearBodyRef, nameBodyRef].forEach(ref => {
      if (ref.current && ref !== source) ref.current.scrollTop = top;
    });
  };

  const isPicking = step === "pick-company";

  const filteredCompanies = companies.filter(c =>
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.com_code?.toLowerCase().includes(search.toLowerCase())
  ); 
  useEffect(() => {
    if (highlightedIndex >= filteredCompanies.length) {
      setHighlightedIndex(filteredCompanies.length - 1);
    }
  }, [filteredCompanies.length, highlightedIndex]);

  useEffect(() => {
    if (highlightedIndex >= 0 && rowRefs.current[highlightedIndex]) {
      rowRefs.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const handleLogin = async (e, force = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authenticateUser({
        user_id: userId,
        user_pass: password,
        forceLogin: force,
      });

      if (res.cancelled) return;

      if (res.alreadyLoggedIn) {
        setShowForceLogin(true);
        setError("User is already logged in on another device.");
        setLoading(false);
        return;
      }

      if (res?.requiresCompanySelection) {
        setCompanies(res.companies);
        setPreToken(res.preAuthToken);
        setHighlightedIndex(-1);
        setStep("pick-company");
        return;
      }

const token = res?.token;
if (!token) throw new Error("No token received from server");

login(token, res.user, res.permissions);
onLoginSuccess();

    } catch (err) {
      console.error("Login Component Error:", err);
      setError(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleUserIdKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (loading) return;
      if (!userId || !password) return;
      handleLogin(null, showForceLogin);
    }
  };

  const handleCompanySelect = async (company) => {
    if (selecting) return;
    setSelecting(company.com_id);
    setError("");
    try {
const res = await selectCompany({
  preAuthToken: preToken,
  com_id: company.com_id,
});
if (!res.success) throw new Error(res.message || "Company selection failed");

login(res.token, res.user, res.permissions);
onLoginSuccess();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to select company. Please try again.");
      setSelecting(null);
    }
  };

  const handlePickerKeyDown = (e) => {
    if (selecting) return;
    const count = filteredCompanies.length;
    if (count === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => (i <= 0 ? count - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < count) {
        handleCompanySelect(filteredCompanies[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      goBack();
    }
  };

  const goBack = () => {
    setStep("credentials");
    setError("");
    setShowForceLogin(false);
    setPreToken("");
    setCompanies([]);
    setSelecting(null);
    setSearch("");
    setHighlightedIndex(-1);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
        onKeyDown={isPicking ? handlePickerKeyDown : undefined}
        className="w-full max-w-[480px] bg-white rounded-2xl
                   shadow-[0_25px_50px_rgba(30,64,175,0.25)]
                   border border-white/80 overflow-hidden"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500" />

        <div className="px-8 py-3">
          <div className="w-[100px] mx-auto shrink-0 flex flex-col items-center justify-center
                            gap-2 hidden sm:flex">
            <img
              src="/finaman-logo.png"
              alt="Finaman ERP"
              className="h-12 w-12 object-contain drop-shadow-sm"
              onError={e => e.target.style.display = "none"}
            />
            <span className="text-[25px] font-bold text-[#1e3a8a] text-center min-w-[200px] leading-tight">
              Finaman ERP
            </span>
            <span className="text-[11px] text-slate-400 text-center leading-tight min-w-[200px]">
              Secure enterprise platform
            </span>
          </div>
          <AnimatePresence initial={false}>
            {!isPicking && (
              <motion.div
                key="credential-fields"
                variants={fieldsVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="flex gap-6 items-center mb-1">
                  <div className="flex-1 flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#eff6ff] border border-blue-100 mt-[20px]
                                      flex items-center justify-center shrink-0">
                        <User size={17} className="text-[#2563eb]" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[12.5px] font-semibold text-[#1e3a8a] mb-1">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={userId}
                          onChange={e => setUserId(e.target.value)}
                          onKeyDown={handleUserIdKeyDown}
                          autoComplete="username"
                          required
                          className="w-full h-[42px] px-3.5 rounded-lg border text-[14.5px]
                                     outline-none transition-all duration-200
                                     bg-white border-slate-200 text-slate-800
                                     focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#eff6ff] border border-blue-100 mt-[20px]
                                      flex items-center justify-center shrink-0">
                        <Lock size={17} className="text-[#2563eb]" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[12.5px] font-semibold text-[#1e3a8a] mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handlePasswordKeyDown}
                            autoComplete="current-password"
                            required
                            className="w-full h-[42px] pl-3.5 pr-10 rounded-lg border text-[14.5px]
                                       outline-none transition-all duration-200
                                       bg-white border-slate-200 text-slate-800
                                       focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                variants={errorVariant}
                initial="hidden" animate="visible" exit="exit"
                className="flex items-center gap-2 bg-red-50 border border-red-100
                           rounded-xl px-3.5 py-2.5 text-red-700 text-[13px] mt-4"
              >
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence >
            {step === "credentials" && (
              <motion.form
                key="login-form"
                variants={sectionVariants}
                initial="hidden" animate="visible" exit="exit"
                onSubmit={e => handleLogin(e, false)}
                className="mt-5"
              >
                {!showForceLogin && (
                  <motion.button
                    whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(37,99,235,0.32)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !userId || !password}
                    className="w-[200px] h-[42px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8]
                               text-white text-[15px] font-semibold mx-auto
                               disabled:opacity-60 disabled:cursor-not-allowed
                               transition-all duration-200
                               flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Authenticating…</>
                      : <><LogIn size={16} /> Login</>
                    }
                  </motion.button>
                )}

                {showForceLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleLogin(null, true)}
                      disabled={loading}
                      className="w-full h-[42px] rounded-xl bg-red-500 hover:bg-red-600
                                 text-white text-[14px] font-semibold
                                 disabled:opacity-60 disabled:cursor-not-allowed
                                 transition-all duration-200
                                 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Resetting session…</>
                        : <><MonitorX size={15} /> Logout other device &amp; Login</>
                      }
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setShowForceLogin(false); setError(""); }}
                      className="text-[13px] text-slate-400 hover:text-slate-600
                                 transition-colors text-center py-0.5"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </motion.form>
            )}

            {step === "pick-company" && (
              <motion.div
                key="company-section"
                variants={sectionVariants}
                initial="hidden" animate="visible" exit="exit"
                onAnimationComplete={(def) => {
                  if (def === "visible") searchRef.current?.focus();
                }}
                className="mt-2"
              >
                <div className="flex flex-1 gap-2">

                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-2 px-6 h-[42px] rounded-lg
                               border border-slate-200 bg-white text-[14px] font-semibold
                               text-red-500 hover:bg-red-50 transition-colors mr-2px"
                  >
                    <CloseIcon size={15} />
                  </button>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by company name or code…  (↑ ↓ to navigate, Enter to select)"
                    className="w-full h-[42px] px-3.5 mb-4 rounded-xl border border-slate-200 bg-white
                             text-[13.5px] text-slate-700 outline-none placeholder:text-slate-300
                             focus:border-blue-400
                             focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]
                             transition-all duration-200"
                  />
                </div>

                <div className="flex gap-0 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="w-[60px] shrink-0 border-r border-slate-200">
                    <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                    tracking-[0.08em] uppercase px-3 py-2.5
                    flex items-center gap-1.5">
                      <Hash size={12} />Sr.
                    </div>
                    <div
                      ref={srNoBodyRef}
                      onScroll={() => handleColumnScroll(srNoBodyRef)}
                      className="max-h-[260px] overflow-y-auto"
                    >
                      {filteredCompanies.map((company, i) => (
                        <div
                          key={company.com_id}
                          className={`px-3 py-2.5 text-[13px] font-semibold text-center
                      border-b border-slate-100 last:border-b-0
                      ${i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-[100px] shrink-0 border-r border-slate-200">
                    <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                    tracking-[0.08em] uppercase px-3 py-2.5
                    flex items-center gap-1.5">
                      <CalendarDays size={12} /> A/C Year
                    </div>
                    <div
                      ref={yearBodyRef}
                      onScroll={() => handleColumnScroll(yearBodyRef)}
                      className="max-h-[260px] overflow-y-auto"
                    >
                      {filteredCompanies.map((company, i) => (
                        <div
                          key={company.com_id}
                          className={`px-3 py-2.5 text-[13px] font-medium text-center
                      border-b border-slate-100 last:border-b-0
                      ${i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
                        >
                          {company.acc_year || DEFAULT_ACC_YEAR}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                    tracking-[0.08em] uppercase px-4 py-2.5
                    flex items-center gap-1.5">
                      <Building2 size={12} /> Company Name
                    </div>

                    <div
                      ref={nameBodyRef}
                      onScroll={() => handleColumnScroll(nameBodyRef)}
                      className="max-h-[260px] overflow-y-auto divide-y divide-slate-100"
                    >
                      {filteredCompanies.length === 0 && (
                        <p className="text-[13px] text-slate-400 text-center py-8">
                          No companies match your search.
                        </p>
                      )}

                      {filteredCompanies.map((company, i) => {
                        const isThisSelecting = selecting === company.com_id;
                        const isDisabled = !!selecting;
                        const isHighlighted = i === highlightedIndex;

                        return (
                          <motion.button
                            key={company.com_id}
                            ref={el => (rowRefs.current[i] = el)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleCompanySelect(company)}
                            onMouseEnter={() => setHighlightedIndex(i)}
                            disabled={isDisabled}
                            className={`
              w-full px-4 py-2.5 text-left transition-colors duration-150
              disabled:cursor-not-allowed
              ${isThisSelecting || isHighlighted
                                ? "bg-blue-50"
                                : "hover:bg-blue-50/60 active:bg-blue-100/60"
                              }
            `}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {isThisSelecting && (
                                <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
                              )}
                              <span className={`text-[14px] font-medium truncate
                ${isThisSelecting || isHighlighted ? "text-blue-700" : "text-slate-800"}`}>
                                {company.company}
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[12px] text-slate-400 mt-6">
            © {new Date().getFullYear()} Finaman ERP
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;

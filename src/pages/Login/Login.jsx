import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Eye, EyeOff, LogIn,
  AlertCircle, ArrowLeft, Loader2,
  MonitorX, Building2, CalendarDays, Hash
} from "lucide-react";
import { authenticateUser, selectCompany } from "../../utils/api";
 
const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,
             transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -16, scale: 0.98,
             transition: { duration: 0.25 } },
};

const slideIn = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0,
             transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -32, transition: { duration: 0.22 } },
};

const errorVariant = {
  hidden:  { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: "auto", marginBottom: 14,
             transition: { duration: 0.22 } },
  exit:    { opacity: 0, height: 0, marginBottom: 0,
             transition: { duration: 0.18 } },
};
 
const DEFAULT_ACC_YEAR = "2024-2025"; 
function LoginPage({ onLoginSuccess }) {
  const [step,           setStep]           = useState("credentials");
  const [userId,         setUserId]         = useState("");
  const [password,       setPassword]       = useState("");
  const [showPassword,   setShowPassword]   = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [showForceLogin, setShowForceLogin] = useState(false);

  const [companies,  setCompanies]  = useState([]);
  const [preToken,   setPreToken]   = useState("");
  const [selecting,  setSelecting]  = useState(null);
  const [search,     setSearch]     = useState("");
 
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const passwordRef = useRef(null);
  const searchRef   = useRef(null);
  const rowRefs     = useRef([]);   // refs for each company row, for scroll-into-view

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
        user_id:    userId,
        user_pass:  password,
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
        setHighlightedIndex(-1);   // nothing highlighted until user arrows down
        setStep("pick-company");
        return;
      }

      const token = res?.token;
      if (!token) throw new Error("No token received from server");

      sessionStorage.setItem("token",       token);
      sessionStorage.setItem("user",        JSON.stringify(res.user));
      sessionStorage.setItem("permissions", JSON.stringify(res.permissions));
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
      // In the force-login state, Enter triggers the force login.
      handleLogin(null, showForceLogin);
    }
  };

  // ── Step 2: company selected ──────────────────────────────────────────────
  const handleCompanySelect = async (company) => {
    if (selecting) return;
    setSelecting(company.com_id);
    setError("");
    try {
      const res = await selectCompany({
        preAuthToken: preToken,
        com_id:       company.com_id,
      });
      if (!res.success) throw new Error(res.message || "Company selection failed");

      sessionStorage.setItem("token",       res.token);
      sessionStorage.setItem("user",        JSON.stringify(res.user));
      sessionStorage.setItem("permissions", JSON.stringify(res.permissions));
      onLoginSuccess();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to select company. Please try again.");
      setSelecting(null);
    }
  }; 
  const handlePickerKeyDown = (e) => {
    if (selecting) return;                       // ignore while a selection is in flight
    const count = filteredCompanies.length;
    if (count === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % count);          // wraps to top
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => (i <= 0 ? count - 1 : i - 1)); // wraps to bottom
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-[420px]">
        <AnimatePresence mode="wait"> 
          {step === "credentials" && (
            <motion.div
              key="credentials"
              variants={cardVariants}
              initial="hidden" animate="visible" exit="exit"
              className="w-full bg-white/85 backdrop-blur-xl rounded-2xl
                         shadow-[0_20px_40px_rgba(0,0,0,0.15)]
                         border border-white/80 overflow-hidden"
            > 
              <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500" />

              <div className="px-8 py-8"> 
                <div className="flex flex-col items-center mb-7">
                  <img
                    src="/finaman-logo.png"
                    alt="Finaman ERP"
                    className="h-12 mb-3 object-contain drop-shadow-sm"
                    onError={e => e.target.style.display = "none"}
                  />
                  <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1e3a8a]">
                    <LogIn size={20} /> Finaman ERP
                  </h1>
                  <p className="text-[12.5px] text-slate-500 mt-1">
                    Secure enterprise resource platform
                  </p>
                </div> 
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="err"
                      variants={errorVariant}
                      initial="hidden" animate="visible" exit="exit"
                      className="flex items-center gap-2 bg-red-50 border border-red-100
                                 rounded-xl px-3.5 py-2.5 text-red-700 text-[12.5px]"
                    >
                      <AlertCircle size={14} className="shrink-0 text-red-500" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence> 
                <form onSubmit={e => handleLogin(e, false)} className="flex flex-col gap-3.5">
                  {/* User ID */}
                  <div className="flex items-center gap-2.5 px-3.5 h-[46px] rounded-xl
                                  border border-slate-200 bg-white
                                  focus-within:border-blue-500
                                  focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]
                                  transition-all duration-200">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="User ID"
                      value={userId}
                      onChange={e => setUserId(e.target.value)}
                      onKeyDown={handleUserIdKeyDown}
                      autoComplete="username"
                      required
                      className="flex-1 text-[13.5px] text-slate-800 bg-transparent
                                 outline-none placeholder:text-slate-300"
                    />
                  </div> 
                  <div className="flex items-center gap-2.5 px-3.5 h-[46px] rounded-xl
                                  border border-slate-200 bg-white
                                  focus-within:border-blue-500
                                  focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]
                                  transition-all duration-200">
                    <Lock size={16} className="text-slate-400 shrink-0" />
                    <input
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={handlePasswordKeyDown}
                      autoComplete="current-password"
                      required
                      className="flex-1 text-[13.5px] text-slate-800 bg-transparent
                                 outline-none placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(p => !p)}
                      className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div> 
                  {!showForceLogin && (
                    <motion.button
                      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(37,99,235,0.32)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || !userId || !password}
                      className="mt-1 w-full h-[46px] rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8]
                                 text-white text-[14px] font-semibold
                                 disabled:opacity-60 disabled:cursor-not-allowed
                                 transition-all duration-200
                                 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader2 size={15} className="animate-spin" /> Authenticating…</>
                        : "Login"
                      }
                    </motion.button>
                  )}

                  {/* Force login section */}
                  {showForceLogin && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2 mt-1"
                    >
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                                      rounded-xl px-3.5 py-2.5 text-amber-700 text-[12px]">
                        <MonitorX size={14} className="shrink-0" />
                        <span>Active session detected on another device.</span>
                      </div>
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleLogin(null, true)}
                        disabled={loading}
                        className="w-full h-[46px] rounded-xl bg-red-500 hover:bg-red-600
                                   text-white text-[13px] font-semibold
                                   disabled:opacity-60 disabled:cursor-not-allowed
                                   transition-all duration-200
                                   flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><Loader2 size={15} className="animate-spin" /> Resetting session…</>
                          : <><MonitorX size={14} /> Logout other device &amp; Login</>
                        }
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => { setShowForceLogin(false); setError(""); }}
                        className="text-[12px] text-slate-400 hover:text-slate-600
                                   transition-colors text-center py-0.5"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </form>

                {/* Footer */}
                <p className="text-center text-[11.5px] text-slate-400 mt-6">
                  © {new Date().getFullYear()} Finaman ERP
                </p>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 2: Company picker — table style ══ */}
          {step === "pick-company" && (
            <motion.div
              key="pick-company"
              variants={slideIn}
              initial="hidden" animate="visible" exit="exit"
              onKeyDown={handlePickerKeyDown}
              // Focus the search box exactly when the entrance animation finishes —
              // more reliable than a fixed setTimeout, which can fire before the
              // ref is attached or before the previous card's exit completes.
              onAnimationComplete={(def) => {
                if (def === "visible") searchRef.current?.focus();
              }}
              // wider card for the table
              className="w-full max-w-[600px] mx-auto bg-white/85 backdrop-blur-xl rounded-2xl
                         shadow-[0_20px_40px_rgba(0,0,0,0.15)]
                         border border-white/80 overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500" />

              <div className="px-7 py-6">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-1">
                  <button
                    onClick={goBack}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400
                               hover:text-blue-600 transition-colors"
                    title="Back to login"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="text-[18px] font-bold text-slate-800 leading-tight"
                        style={{ fontFamily: "'Georgia','Times New Roman',serif" }}>
                      Select Company
                    </h2>
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      Logged in as <strong className="text-slate-600">{userId}</strong>
                      {" "}· {companies.length} compan{companies.length === 1 ? "y" : "ies"} available
                    </p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="err2"
                      variants={errorVariant}
                      initial="hidden" animate="visible" exit="exit"
                      className="flex items-center gap-2 bg-red-50 border border-red-100
                                 rounded-xl px-3.5 py-2.5 text-red-700 text-[12px] mt-3"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div className="mt-4 mb-3">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by company name or code…  (↑ ↓ to navigate, Enter to select)"
                    className="w-full h-9 px-3.5 rounded-xl border border-slate-200 bg-white
                               text-[12.5px] text-slate-700 outline-none placeholder:text-slate-300
                               focus:border-blue-400
                               focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]
                               transition-all duration-200"
                  />
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Table head */}
                  <div className="grid grid-cols-[2fr_1fr_1fr] bg-slate-50
                                  border-b border-slate-200 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold
                                    tracking-[0.1em] uppercase text-slate-400">
                      <Building2 size={11} /> Company
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold
                                    tracking-[0.1em] uppercase text-slate-400">
                      <Hash size={11} /> Code
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold
                                    tracking-[0.1em] uppercase text-slate-400">
                      <CalendarDays size={11} /> Acc. Year
                    </div>
                  </div>

                  {/* Table body */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                    {filteredCompanies.length === 0 && (
                      <p className="text-[12px] text-slate-400 text-center py-8">
                        No companies match your search.
                      </p>
                    )}

                    {filteredCompanies.map((company, i) => {
                      const isThisSelecting = selecting === company.com_id;
                      const isDisabled      = !!selecting;
                      const isHighlighted   = i === highlightedIndex;

                      return (
                        <motion.button
                          key={company.com_id}
                          ref={el => (rowRefs.current[i] = el)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleCompanySelect(company)}
                          onMouseEnter={() => setHighlightedIndex(i)}
                          disabled={isDisabled}
                          className={`
                            w-full grid grid-cols-[2fr_1fr_1fr] px-4 py-3
                            text-left transition-colors duration-150
                            disabled:cursor-not-allowed
                            ${isThisSelecting || isHighlighted
                              ? "bg-blue-50"
                              : "hover:bg-blue-50/60 active:bg-blue-100/60"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isThisSelecting
                              ? <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
                              : <span className={`w-[5px] h-[5px] rounded-full shrink-0
                                  ${isHighlighted ? "bg-blue-600" : "bg-blue-400"}`} />
                            }
                            <span className={`text-[13px] font-medium truncate leading-tight
                              ${isThisSelecting || isHighlighted ? "text-blue-700" : "text-slate-800"}`}>
                              {company.company}
                            </span>
                          </div>

                          {/* Code */}
                          <div className="flex items-center">
                            <span className="text-[11.5px] font-mono text-slate-500 truncate">
                              {company.com_code || "—"}
                            </span>
                          </div>

                          {/* Accounting year — default until DB column added */}
                          <div className="flex items-center">
                            <span className={`
                              text-[11.5px] px-2 py-0.5 rounded-md font-medium
                              ${isThisSelecting || isHighlighted
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                              }
                            `}>
                              {/* Replace DEFAULT_ACC_YEAR with company.acc_year once DB column added */}
                              {company.acc_year || DEFAULT_ACC_YEAR}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-center text-[11px] text-slate-400 mt-4">
                  © {new Date().getFullYear()} Finaman ERP 
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default LoginPage;

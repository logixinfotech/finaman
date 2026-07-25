import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  FaBell,
  FaMoon,
  FaSun,
  FaPalette,
  FaSearch,
  FaUser,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaBars,
  FaExchangeAlt,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaBuilding,
  FaHashtag,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNotifications } from "../../theme/NotificationContext";
import NotificationPanel from "../../pages/NotificationPanel";
import GlobalSearch from "./GlobalSearch";
import { fetchSwitchableCompanies, switchCompany } from "../../utils/api";

const DEFAULT_ACC_YEAR = "2024-2025";

function Header({
  theme,
  setTheme,
  onLogout,
  onOpenPage,
  allMenus = [],
  onToggleSidebar,
  onOpenMobileSidebar,
}) {
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [username, setUsername] = useState("");
  const [companyInfo, setCompanyInfo] = useState({
    name: "Demo Company Private Limited",
    loc: "Uttar Pradesh",
    fy: "2026-27",
  });

  // ── Company switcher state ────────────────────────────────────────────────
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [switchSearch, setSwitchSearch] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentComId, setCurrentComId] = useState(null);

  const searchRef = useRef(null);
  const rowRefs = useRef([]);
  const srNoBodyRef = useRef(null);
  const yearBodyRef = useRef(null);
  const nameBodyRef = useRef(null);

  const menuRef = useRef(null);
  const userChipRef = useRef(null);
  const notifyRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      setUsername(user.user_name || user.username || user.user_id || "User");
      setCurrentComId(user.com_id || user.selected_company_id || null);
      if (user.com_name || user.com_code) {
        setCompanyInfo({
          name: user.com_name || user.com_code,
          loc: user.location || "Noida, UP",
          fy: user.fy || "2026-27",
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !userChipRef.current?.contains(e.target)
      )
        setIsMenuOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLightDark = (e) => {
    e.stopPropagation();
    setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark");
  };

  const toggleAccentColor = (e) => {
    e.stopPropagation();
    const themes = ["theme-blue", "theme-teal", "theme-corporate"];
    const nextTheme =
      themes[(themes.indexOf(theme) + 1) % themes.length] || "theme-blue";
    setTheme(nextTheme);
  };

 const filteredCompanies = useMemo(
  () =>
    companies.filter(c =>
      c.company?.toLowerCase().includes(switchSearch.toLowerCase()) ||
      c.com_code?.toLowerCase().includes(switchSearch.toLowerCase())
    ),
  [companies, switchSearch]
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

  const handleColumnScroll = (source) => {
    const top = source.current?.scrollTop || 0;
    [srNoBodyRef, yearBodyRef, nameBodyRef].forEach(ref => {
      if (ref.current && ref !== source) ref.current.scrollTop = top;
    });
  };

  const openSwitcher = async () => {
    setIsMenuOpen(false);
    setShowSwitcher(true);
    setSwitchError("");
    setSwitchSearch("");
    setHighlightedIndex(-1);
    setCompaniesLoading(true);
    try {
      const res = await fetchSwitchableCompanies();
      setCompanies(res.companies || []);
      if (res.current_com_id) setCurrentComId(res.current_com_id);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setSwitchError("Could not load company list. Please try again.");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const closeSwitcher = () => {
    if (switching) return;
    setShowSwitcher(false);
    setSwitchError("");
    setSwitchSearch("");
  };

  const handleCompanySwitch = async (company) => {
    if (switching) return;
    if (String(company.com_id) === String(currentComId)) return;

    setSwitching(company.com_id);
    setSwitchError("");
    try {
      const res = await switchCompany(company.com_id);
      if (!res.success) throw new Error(res.message || "Failed to switch company.");

      sessionStorage.setItem("token", res.token);
      sessionStorage.setItem("user", JSON.stringify(res.user));
      sessionStorage.setItem("permissions", JSON.stringify(res.permissions));

      // Full reload guarantees every tenant-scoped screen/state resets cleanly
      window.location.reload();
    } catch (err) {
      console.error("Switch company error:", err);
      setSwitchError(err.response?.data?.message || err.message || "Failed to switch company.");
      setSwitching(null);
    }
  };

  const handlePickerKeyDown = (e) => {
    if (switching) return;
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
        handleCompanySwitch(filteredCompanies[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSwitcher();
    }
  };

  return (
    <header
      className="relative z-[500] h-[44px] w-full flex items-center justify-between px-3 md:px-5 shadow-md border-b-2 border-blue-700"
      style={{ background: "var(--sidebar-top-bg)" }}
    >
      {/* LEFT - mobile hamburger + brand */}
      <div className="flex items-center gap-2 md:gap-3">
        {isMobile && (
          <button
            onClick={onOpenMobileSidebar}
            className="  p-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Open menu"
          >
            <img
              src="/finaman-logo.png"
              alt="Logo"
              className="h-6 w-6 object-contain"
            />
          </button>
        )}

        {!isMobile && (
          <button
            onClick={onToggleSidebar}
            className=" p-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Open menu"
          >
            <img
              src="/finaman-logo.png"
              alt="Logo"
              className="h-6 w-6 object-contain"
            />
          </button>
        )}

        <div className="flex flex-col leading-none  sm:flex">
          <span className="relative inline-block text-[12px] font-bold uppercase tracking-wider text-white/90">
            FINAMAN ERP
          </span>
          <span className="text-[9px] text-white/50 font-medium pt-[2px] tracking-wide hidden md:block">
            Process Manufacturing Management Software
          </span>
        </div>
      </div>

      {/* CENTER - COMPANY INFO (smaller) */}
      <div className="hidden lg:flex flex-col items-center justify-center leading-none">
        <span className="relative inline-block text-[12px] font-bold uppercase tracking-wider text-white/90">
          {companyInfo.name}
          <span className="absolute left-0 -bottom-[1px] w-full h-[1px] bg-blue-500/50 rounded-full"></span>
        </span>
        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-semibold text-white/60">
          <span className="flex items-center gap-1">
            <FaMapMarkerAlt className="text-blue-400 text-[8px]" />
            {companyInfo.loc}
          </span>
          <span className="opacity-30 text-white">|</span>
          <span className="bg-white/10 px-1 py-px rounded text-white/80">
            FY {companyInfo.fy}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5">

          <GlobalSearch allMenus={allMenus} onOpenPage={onOpenPage} />
          <div className="relative" ref={notifyRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white relative"
            >
              <FaBell className="text-base" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-600 text-[8px] font-bold px-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 z-[1000]">
                <NotificationPanel
                  onOpenAll={() =>
                    onOpenPage({
                      masmnu_id: "NOTIFICATIONS",
                      bar_name: "Notifications",
                      appl_name: "NOTIFICATIONS_PAGE",
                    })
                  }
                  onNavigate={(link) => {
                    setShowNotifications(false);
                    onOpenPage(link);
                  }}
                />
              </div>
            )}
          </div>
          <div className="relative">
            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              ref={userChipRef}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 cursor-pointer transition border border-white/10"
            >
              <div className="h-6 w-6 rounded bg-white/30 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                {username?.charAt(0)}
              </div>
              <span className="text-white text-[11px] font-semibold hidden sm:block uppercase tracking-tight">
                {username}
              </span>
            </div>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded shadow-xl border border-slate-100 py-1 overflow-hidden"
              >
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Settings
                  </p>
                </div>
                <button
                  onClick={toggleLightDark}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === "theme-dark" ? (
                      <FaSun className="text-orange-500" />
                    ) : (
                      <FaMoon className="text-blue-500" />
                    )}{" "}
                    Mode
                  </span>
                  <span className="text-[10px] opacity-40 uppercase font-bold">
                    {theme.split("-")[1]}
                  </span>
                </button>
                <button
                  onClick={toggleAccentColor}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FaPalette className="text-teal-500" /> Change Accent
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={openSwitcher}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FaExchangeAlt className="text-indigo-500" /> Switch Company
                </button>
                <button
                  onClick={() =>
                    onOpenPage({
                      masmnu_id: "PROFILE",
                      bar_name: "Profile",
                      appl_name: "PROFILE",
                    })
                  }
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <FaUser className="opacity-40" /> Profile
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold"
                >
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Switch Company modal — same 3-column table UI as the login picker ── */}
      {showSwitcher && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeSwitcher}
          onKeyDown={handlePickerKeyDown}
        >
          <div
            className="w-full max-w-[520px] min-h-[300px] bg-white rounded-2xl shadow-[0_25px_50px_rgba(30,64,175,0.25)]
                       border border-white/80 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500" />

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Switch Company</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Currently working in <span className="font-semibold text-slate-600">{companyInfo.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSwitcher}
                  disabled={!!switching}
                  className="h-8 w-8 flex items-center justify-center rounded-lg
                             border border-slate-200 bg-white text-red-500
                             hover:bg-red-50 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-[12px]" />
                <input
                  ref={searchRef}
                  type="text"
                  autoFocus
                  value={switchSearch}
                  onChange={e => setSwitchSearch(e.target.value)}
                  placeholder="Search by company name or code…  (↑ ↓ to navigate, Enter to select)"
                  disabled={!!switching}
                  className="w-full h-[34px] pl-9 pr-3.5 rounded-xl border border-slate-200 bg-white
                             text-[12.5px] text-slate-700 outline-none placeholder:text-slate-300
                             focus:border-blue-400
                             focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]
                             transition-all duration-200 disabled:bg-slate-50"
                />
              </div>

              {/* Error */}
              {switchError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100
                                rounded-xl px-3.5 py-2.5 text-red-700 text-[12.5px] mb-3">
                  <FaExclamationCircle className="shrink-0 text-red-500" size={13} />
                  <span>{switchError}</span>
                </div>
              )}

              {/* Table */}
              <div className="flex gap-0 rounded-xl border border-slate-200 overflow-hidden">
                {/* Sr No. */}
                <div className="w-[60px] shrink-0 border-r border-slate-200">
                  <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                                  tracking-[0.08em] uppercase px-3 py-2.5
                                  flex items-center gap-1.5">
                    <FaHashtag size={10} />Sr.
                  </div>
                  <div
                    ref={srNoBodyRef}
                    onScroll={() => handleColumnScroll(srNoBodyRef)}
                    className="max-h-[360px] overflow-y-auto"
                  >
                    {companiesLoading ? (
                      <div className="py-8" />
                    ) : (
                      filteredCompanies.map((company, i) => (
                        <div
                          key={company.com_id}
                          className={`px-3 py-2.5 text-[13px] font-semibold text-center
                                      border-b border-slate-100 last:border-b-0
                                      ${i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-slate-500"}`}
                        >
                          {i + 1}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* A/C Year */}
                <div className="w-[100px] shrink-0 border-r border-slate-200">
                  <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                                  tracking-[0.08em] uppercase px-3 py-2.5
                                  flex items-center gap-1.5">
                    <FaCalendarAlt size={10} /> A/C Year
                  </div>
                  <div
                    ref={yearBodyRef}
                    onScroll={() => handleColumnScroll(yearBodyRef)}
                    className="max-h-[360px] overflow-y-auto"
                  >
                    {companiesLoading ? (
                      <div className="py-8" />
                    ) : (
                      filteredCompanies.map((company, i) => (
                        <div
                          key={company.com_id}
                          className={`px-3 py-2.5 text-[13px] font-medium text-center
                                      border-b border-slate-100 last:border-b-0
                                      ${i === highlightedIndex ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
                        >
                          {company.acc_year || DEFAULT_ACC_YEAR}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div className="flex-1 min-w-0">
                  <div className="bg-[#2563eb] text-white text-[11px] font-semibold
                                  tracking-[0.08em] uppercase px-4 py-2.5
                                  flex items-center gap-1.5">
                    <FaBuilding size={10} /> Company Name
                  </div>

                  <div
                    ref={nameBodyRef}
                    onScroll={() => handleColumnScroll(nameBodyRef)}
                    className="max-h-[360px] overflow-y-auto divide-y divide-slate-100"
                  >
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-8 text-slate-400 text-[13px] gap-2">
                        <FaSpinner className="animate-spin" /> Loading companies…
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <p className="text-[13px] text-slate-400 text-center py-8">
                        No companies match your search.
                      </p>
                    ) : (
                      filteredCompanies.map((company, i) => {
                        const isCurrent = String(company.com_id) === String(currentComId);
                        const isThisSwitching = switching === company.com_id;
                        const isDisabled = !!switching || isCurrent;
                        const isHighlighted = i === highlightedIndex;

                        return (
                          <button
                            key={company.com_id}
                            ref={el => (rowRefs.current[i] = el)}
                            type="button"
                            onClick={() => handleCompanySwitch(company)}
                            onMouseEnter={() => setHighlightedIndex(i)}
                            disabled={isDisabled}
                            className={`w-full px-4 py-2.5 text-left transition-colors duration-150
                                        disabled:cursor-not-allowed flex items-center justify-between gap-2
                                        ${isCurrent
                                ? "bg-indigo-50"
                                : isThisSwitching || isHighlighted
                                  ? "bg-blue-50"
                                  : "hover:bg-blue-50/60 active:bg-blue-100/60"}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {isThisSwitching && (
                                <FaSpinner className="text-blue-500 animate-spin shrink-0" size={12} />
                              )}
                              <span className={`text-[14px] font-medium truncate
                                                ${isCurrent
                                  ? "text-indigo-700"
                                  : isThisSwitching || isHighlighted
                                    ? "text-blue-700"
                                    : "text-slate-800"}`}>
                                {company.company}
                              </span>
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-indigo-600 bg-white
                                               px-2 py-0.5 rounded-full shrink-0">
                                Current
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;

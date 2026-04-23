import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  FaBell, FaMoon, FaSun, FaPalette, FaSearch,
  FaUser, FaSignOutAlt, FaMapMarkerAlt, FaChevronDown
} from "react-icons/fa";
import { useNotifications } from "../../theme/NotificationContext";
import NotificationPanel from "../../pages/NotificationPanel";

/**
 * Professional Header Component
 * Features: Command Palette Search, Glassmorphism, Theme Management, Adaptive UX
 */
function Header({ theme, setTheme, onLogout, onOpenPage, allMenus = [] }) {
  const { unreadCount } = useNotifications();

  // States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [companyInfo, setCompanyInfo] = useState({
    name: "Demo Company Pvt Ltd",
    loc: "Uttar Pradesh"
  });

  // Refs
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const userChipRef = useRef(null);
  const notifyRef = useRef(null);

  // Memoized Search Logic
  const filteredResults = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];
    return allMenus
      .filter((m) => m.menu_hide !== "Y" && m.bar_name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchText, allMenus]);

  const handleOpenPage = useCallback((item) => {
    onOpenPage(item);
    setShowSearch(false);
    setSearchText("");
  }, [onOpenPage]);

  // Load User Data
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      setUsername(user.user_name || user.username || user.user_id || "User");
      if (user.com_name || user.com_code) {
        setCompanyInfo({
          name: user.com_name,
          loc: user.location || "Noida, UP"
        });
      }
    }
  }, []);

  // Event Listeners (Hotkeys & Click Outside)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
        searchRef.current?.focus();
      }
      if (showSearch && filteredResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightIndex((p) => (p + 1) % filteredResults.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightIndex((p) => (p === 0 ? filteredResults.length - 1 : p - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleOpenPage(filteredResults[highlightIndex]);
        } else if (e.key === "Escape") {
          setShowSearch(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !userChipRef.current?.contains(e.target)) setIsMenuOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.parentElement.contains(e.target)) setShowSearch(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch, filteredResults, highlightIndex, handleOpenPage]);

  // Handlers
  const toggleLightDark = () => setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark");

  const toggleAccentColor = (e) => {
    e.stopPropagation();
    const themes = [
      "theme-green",
      "theme-blue",
      "theme-purple",
      "theme-teal", "theme-corporate", "theme-soft-light"
    ];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length] || "theme-blue";
    setTheme(nextTheme);
  };

  return (
    <header
      className="relative z-[500] h-14 w-full flex items-center justify-between px-6 backdrop-blur-md border-b border-white/10 shadow-sm"
      style={{ background: "var(--sidebar-top-bg, #1e293b)" }}
    >
      {/* LEFT: Branding */}
      <div className="flex items-center gap-4">
        <div className="group relative h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 shadow-inner overflow-hidden transition-all duration-300 hover:scale-105">
          <img src="/finaman-logo.png" alt="Logo" className="h-6 w-6 object-contain z-10" />
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex flex-col">
          <h1 className="text-[15px] font-black tracking-wider text-white leading-none">
            FINAMAN <span className="text-blue-400">ERP</span>
          </h1>
          <p className="text-[9px] text-white/40 font-medium uppercase mt-1 tracking-tighter">
            Smart Manufacturing Suite
          </p>
        </div>
      </div>

      {/* CENTER: Context Info (Company & FY) */}
      <div className="hidden lg:flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-black/10 border border-white/5">
          <span className="text-xs font-bold text-blue-100 tracking-wide uppercase">
            {companyInfo.name}
          </span>
          <span className="h-3 w-[1px] bg-white/20"></span>
          <div className="flex items-center gap-1 text-[10px] text-white/60">
            <FaMapMarkerAlt className="text-blue-400" />
            {companyInfo.loc}
          </div>
        </div>
        <div className="mt-1 text-[9px] font-bold text-white/30 tracking-widest uppercase">
          Financial Year 2026-27
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3">

        {/* Modern Search Bar */}
        <div className="relative hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search... (Ctrl+K)"
            value={searchText}
            onFocus={() => setShowSearch(true)}
            onChange={(e) => { setSearchText(e.target.value); setHighlightIndex(0); }}
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-blue-500/50 text-white text-xs outline-none transition-all duration-200"
          />

          {/* Search Dropdown */}
          {showSearch && filteredResults.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 animate-in fade-in slide-in-from-top-2">
              {filteredResults.map((item, index) => (
                <div
                  key={item.masmnu_id}
                  onClick={() => handleOpenPage(item)}
                  className={`px-4 py-2 text-xs flex justify-between items-center cursor-pointer ${index === highlightIndex ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/5"
                    }`}
                >
                  <span>{item.bar_name}</span>
                  {index === highlightIndex && <span className="text-[10px] opacity-60">Enter ↵</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifyRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white relative">
            <FaBell className="text-lg" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-600 text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 z-[1000]">
              <NotificationPanel
                onOpenAll={() => handleOpenPage({ masmnu_id: "NOTIFICATIONS", bar_name: "Notifications", appl_name: "NOTIFICATIONS_PAGE" })}
                onNavigate={(link) => { setShowNotifications(false); handleOpenPage(link); }}
              />
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            ref={userChipRef}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg">
              {username.charAt(0)}
            </div>
            <span className="text-white/90 text-xs font-medium hidden sm:block truncate max-w-[80px]">
              {username}
            </span>
            <FaChevronDown className={`text-[10px] text-white/30 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* User Menu Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-[1001] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Session</p>
                <p className="text-xs text-white font-semibold truncate">{username}</p>
              </div>

              <div className="p-1">
                <button onClick={toggleLightDark} className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    {theme.includes("dark") ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-blue-400" />}
                    Mode
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10">{theme.split("-")[1]}</span>
                </button>

                <button onClick={toggleAccentColor} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                  <FaPalette className="text-teal-500" /> Change Accent
                </button>

                <hr className="my-1 border-slate-800" />

                <button onClick={() => handleOpenPage({ masmnu_id: "PROFILE", bar_name: "Profile", appl_name: "PROFILE" })} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 rounded-lg">
                  <FaUser className="opacity-40" /> Profile
                </button>
              </div>

              <div className="border-t border-white/5 mt-1 p-1">
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition-colors">
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
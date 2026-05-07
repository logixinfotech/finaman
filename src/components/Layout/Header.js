import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FaBell, FaMoon, FaSun, FaPalette, FaSearch, FaUser, FaSignOutAlt, FaMapMarkerAlt } from "react-icons/fa";
import { useNotifications } from "../../theme/NotificationContext";
import NotificationPanel from "../../pages/NotificationPanel";
import GlobalSearch from "./GlobalSearch"
  
function Header({ theme, setTheme, onLogout, onOpenPage, allMenus = [] }) {
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [username, setUsername] = useState("");
  const [companyInfo, setCompanyInfo] = useState({ 
    name: "Demo Company Private Limited", 
    loc: "Uttar Pradesh",
    fy: "2026-27"
  });

  const menuRef = useRef(null);
  const userChipRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      setUsername(user.user_name || user.username || user.user_id || "User");
      if (user.com_name || user.com_code) {
        setCompanyInfo({
          name: user.com_name || user.com_code,
          loc: user.location || "Noida, UP",
          fy: user.fy || "2026-27"
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !userChipRef.current?.contains(e.target)) setIsMenuOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setShowNotifications(false);
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
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length] || "theme-blue";
    setTheme(nextTheme);
  };

  return (
    <header 
      className="relative z-[500] h-[52px] w-full flex items-center justify-between px-5 shadow-lg border-b border-white/5"
      style={{ background: "var(--sidebar-top-bg)" }}
    >
      {/* LEFT - BRAND */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 shadow-md hover:scale-105 transition">
          <img src="/finaman-logo.png" alt="Logo" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight uppercase text-white">FINAMAN ERP</span>
          <span className="text-[10px] text-white/50 font-medium tracking-wide">Process Manufacturing Management Software</span>
        </div>
      </div>

      {/* CENTER - COMPANY INFO */}
      <div className="hidden lg:flex flex-col items-center justify-center">
        <span className="relative inline-block text-[14px] font-bold uppercase tracking-widest text-white/90">
          {companyInfo.name}
          <span className="absolute left-0 -bottom-[1px] w-full h-[1.5px] bg-blue-500/50 rounded-full"></span>
        </span>
        <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold text-white/60">
          <span className="flex items-center gap-1">
            <FaMapMarkerAlt className="text-blue-400" />
            {companyInfo.loc}
          </span>
          <span className="opacity-30 text-white">|</span>
          <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">FY {companyInfo.fy}</span>
        </div>
      </div>
 
      <div className="flex items-center gap-4">
        <GlobalSearch allMenus={allMenus} onOpenPage={onOpenPage} />

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifyRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white relative">
              <FaBell className="text-lg" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-600 text-[9px] font-bold px-1 rounded-full">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 z-[1000]">
                <NotificationPanel
                  onOpenAll={() => onOpenPage({ masmnu_id: "NOTIFICATIONS", bar_name: "Notifications", appl_name: "NOTIFICATIONS_PAGE" })}
                  onNavigate={(link) => { setShowNotifications(false); onOpenPage(link); }}
                />
              </div>
            )}
          </div>

          {/* User Chip */}
          <div className="relative">
            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              ref={userChipRef}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 cursor-pointer transition border border-white/10"
            >
              <div className="h-7 w-7 rounded bg-white/30 text-white flex items-center justify-center font-bold text-xs uppercase">
                {username?.charAt(0)}
              </div>
              <span className="text-white text-xs font-semibold hidden sm:block uppercase tracking-tight">{username}</span>
            </div>

            {isMenuOpen && (
              <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded shadow-xl border border-slate-100 py-1 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Settings</p>
                </div>
                <button onClick={toggleLightDark} className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="flex items-center gap-2">
                    {theme === "theme-dark" ? <FaSun className="text-orange-500" /> : <FaMoon className="text-blue-500" />} Mode
                  </span>
                  <span className="text-[10px] opacity-40 uppercase font-bold">{theme.split("-")[1]}</span>
                </button>
                <button onClick={toggleAccentColor} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <FaPalette className="text-teal-500" /> Change Accent
                </button>
                <hr className="my-1 border-slate-100" />
                <button onClick={() => onOpenPage({ masmnu_id: "PROFILE", bar_name: "Profile", appl_name: "PROFILE" })} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <FaUser className="opacity-40" /> Profile
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold">
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
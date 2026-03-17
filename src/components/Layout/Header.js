import { useEffect, useRef, useState } from "react";
import { FaBell, FaMoon, FaSun, FaPalette, FaSearch } from "react-icons/fa";
import { useNotifications } from "../../theme/NotificationContext";
import NotificationPanel from "../../pages/NotificationPanel";

function Header({ theme, setTheme, onLogout, onOpenPage, allMenus = [] }) {
  const { unreadCount } = useNotifications();
  const [blink, setBlink] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSearch || searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % searchResults.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev === 0 ? searchResults.length - 1 : prev - 1
        );
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = searchResults[highlightIndex];
        if (selected) {
          onOpenPage(selected);
          setShowSearch(false);
          setSearchText("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, searchResults, highlightIndex, onOpenPage]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));

    if (user) {
      setUsername(user.user_name || user.username || user.user_id);
    }
  }, []);

  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const userChipRef = useRef(null);
  const notifyRef = useRef(null);

  useEffect(() => {
    if (unreadCount > 0) {
      const interval = setInterval(() => setBlink((p) => !p), 1000);
      return () => clearInterval(interval);
    }
    setBlink(false);
  }, [unreadCount]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !userChipRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.parentElement.contains(e.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = allMenus
      .filter(
        (m) =>
          m.menu_hide !== "Y" &&
          m.bar_name.toLowerCase().includes(searchText.toLowerCase())
      )
      .slice(0, 8);

    setSearchResults(filtered);
  }, [searchText, allMenus]);

  const toggleLightDark = () =>
    setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark");

  const toggleAccentColor = () => {
    const themes = [
      "theme-green",
      "theme-blue",
      "theme-purple",
      "theme-teal",
      "theme-orange",
    ];
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length] || "theme-blue");
  };

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchRef.current) {
          searchRef.current.focus();
          setShowSearch(true);
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  return (
    <header
      className="relative z-[500] h-[50px] w-full flex items-center justify-between px-4 shadow-md"
      style={{
        background: "var(--sidebar-top-bg)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm p-1">
          <img
            src="/finaman-logo.png"
            alt="Logo"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="flex flex-col text-white leading-tight">
          <span className="text-sm font-bold tracking-wide">
            FINAMAN ERP
          </span>
          <span className="text-[9px] opacity-80 uppercase tracking-widest">
            Process Manufacturing
          </span>
        </div>
      </div>
      <div className="relative w-[260px] hidden md:block">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-xs" />

        <input
          ref={searchRef}
          type="text"
          placeholder="Search menu... (Ctrl + K)"
          value={searchText}
          onFocus={() => setShowSearch(true)}
          onChange={(e) => {
            setSearchText(e.target.value);
            setHighlightIndex(0);
          }}
          className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white placeholder-white/60 outline-none focus:bg-white/25 focus:ring-1 focus:ring-white/30 transition-all text-sm backdrop-blur-md"
        />

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-10 w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {searchResults.map((item, index) => (
              <div
                key={item.masmnu_id}
                onClick={() => {
                  onOpenPage(item);
                  setShowSearch(false);
                  setSearchText("");
                }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors
          ${index === highlightIndex
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                {item.bar_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-white/10 rounded-full p-1 border border-white/10">
          <button
            onClick={toggleLightDark}
            className="p-1.5 rounded-full text-white hover:bg-white/20 transition"
          >
            {theme === "theme-dark" ? <FaSun /> : <FaMoon />}
          </button>

          <button
            onClick={toggleAccentColor}
            className="p-1.5 rounded-full text-white hover:bg-white/20 transition"
          >
            <FaPalette />
          </button>
        </div>
        <div className="relative" ref={notifyRef}>
          <div
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full cursor-pointer bg-white/10 hover:bg-white/20 transition border border-white/10 text-white ${blink ? "animate-pulse opacity-60" : ""
              }`}
          >
            <FaBell className="text-lg" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {showNotifications && (
            <div className="absolute right-0 mt-2 z-[1000]">
              <NotificationPanel
                onOpenAll={() => {
                  setShowNotifications(false);
                  onOpenPage({
                    masmnu_id: "NOTIFICATIONS",
                    bar_name: "Notifications",
                    appl_name: "NOTIFICATIONS_PAGE",
                  });
                }}
                onNavigate={(link) => {
                  setShowNotifications(false);
                  onOpenPage(link);
                }}
              />
            </div>
          )}
        </div>
        <div className="relative group">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            ref={userChipRef}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/20 hover:bg-white/30 border border-white/10 cursor-pointer transition backdrop-blur-md"
          >
            <div className="h-7 w-7 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs">
              {username?.charAt(0).toUpperCase()}
            </div>

            <span className="text-white text-sm font-semibold hidden lg:block">
              {username}
            </span>
          </div>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-100 py-2"
            >
              <button
                onClick={() =>
                  onOpenPage({
                    masmnu_id: "PROFILE",
                    bar_name: "Profile",
                    appl_name: "PROFILE",
                  })
                }
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Profile
              </button>

              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
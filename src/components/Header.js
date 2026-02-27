import { useEffect, useRef, useState } from "react";
import "./Header.css";
import {
  FaBell,
  FaMoon,
  FaSun,
  FaPalette,
  FaBars,
  FaSearch,
} from "react-icons/fa";
import { useNotifications } from "../theme/NotificationContext";
import NotificationPanel from "../pages/NotificationPanel";

function Header({
  theme,
  setTheme,
  onToggleSidebar,
  onLogout,
  onOpenPage,
  allMenus = [], // 🔥 ADD THIS
}) {
  const { unreadCount } = useNotifications();

  const [blink, setBlink] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  /* ---------------- GLOBAL SEARCH STATE ---------------- */

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const searchRef = useRef(null);

  const menuRef = useRef(null);
  const userChipRef = useRef(null);
  const notifyRef = useRef(null);

  /* ---------------- BLINK LOGIC ---------------- */

  useEffect(() => {
    if (unreadCount > 0) {
      const interval = setInterval(() => {
        setBlink((p) => !p);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setBlink(false);
    }
  }, [unreadCount]);

  /* ---------------- OUTSIDE CLICK HANDLERS ---------------- */

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        userChipRef.current &&
        !userChipRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        notifyRef.current &&
        !notifyRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.parentElement.contains(e.target)
      ) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- GLOBAL SEARCH LOGIC ---------------- */

  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = allMenus
      .filter(
        (m) =>
          m.menu_hide !== "Y" &&
          m.bar_name
            .toLowerCase()
            .includes(searchText.toLowerCase())
      )
      .slice(0, 8);

    setSearchResults(filtered);
  }, [searchText, allMenus]);

  const handleSelectSearch = (menu) => {
    setSearchText("");
    setShowSearch(false);
    onOpenPage(menu);
  };

  const handleSearchKeyDown = (e) => {
    if (!searchResults.length) return;

    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter") {
      handleSelectSearch(searchResults[highlightIndex]);
    }
  };

  /* Ctrl + K Shortcut */

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------------- THEME ---------------- */

  const toggleLightDark = () => {
    setTheme(theme === "theme-dark" ? "theme-light" : "theme-dark");
  };

  const toggleAccentColor = () => {
    setTheme((prev) => {
      const themes = [
        "theme-green",
        "theme-blue",
        "theme-purple",
        "theme-teal",
        "theme-orange",
      ];
      const idx = themes.indexOf(prev);
      return themes[(idx + 1) % themes.length];
    });
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  const openNotificationsPage = () => {
    setShowNotifications(false);
    onOpenPage({
      masmnu_id: "NOTIFICATIONS",
      bar_name: "Notifications",
      appl_name: "NOTIFICATIONS_PAGE",
    });
  };
 
return (
  <header className="erp-header relative z-50">

    {/* LEFT */}
    <div className="erp-header-left">  
      <div className="erp-logo-block">
        <div className="rounded-full border border-white p-1 flex items-center justify-center">
          <img
            src="/finaman-logo.png"
            alt="FINAMAN Logo"
            className="h-9 w-9 object-contain"
          />
        </div>

        <div>
          <div className="erp-product-name">
            FINAMAN ERP
          </div>
          <div className="erp-product-sub">
            Process Manufacturing Suite
          </div>
        </div>
      </div>
    </div>

    {/* CENTER - GLOBAL SEARCH */}
    <div className="relative w-[380px]">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 text-sm" />

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
        onKeyDown={handleSearchKeyDown}
        className="w-full pl-9 pr-4 py-2 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
      />

      {showSearch && searchResults.length > 0 && (
        <div className="absolute top-12 w-full bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
          {searchResults.map((item, index) => (
            <div
              key={item.masmnu_id}
              onClick={() => handleSelectSearch(item)}
              className={`px-4 py-2 text-sm cursor-pointer transition ${
                index === highlightIndex
                  ? "bg-[var(--bg-active)] text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.bar_name}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* RIGHT */}
    <div className="erp-header-right relative">

      {/* THEME TOGGLE */}
      <button onClick={toggleLightDark} className="icon-button">
        {theme === "theme-dark" ? <FaSun /> : <FaMoon />}
      </button>

      <button onClick={toggleAccentColor} className="icon-button">
        <FaPalette />
      </button>

      {/* NOTIFICATIONS */}
      <div className="relative" ref={notifyRef}>
        <div
          onClick={() => setShowNotifications((p) => !p)}
          className={`notification-wrap ${blink ? "blink" : ""}`}
        >
          <FaBell className="notification-icon" />

          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount}
            </span>
          )}
        </div>

        {showNotifications && (
          <div className="absolute right-0 mt-3 z-50">
            <NotificationPanel
              onOpenAll={openNotificationsPage}
              onNavigate={(link) => {
                setShowNotifications(false);
                onOpenPage(link);
              }}
            />
          </div>
        )}
      </div>

      {/* USER CHIP */}
      <div
        onClick={() => setIsMenuOpen((p) => !p)}
        ref={userChipRef}
        className="erp-user-chip"
      >
        <div className="avatar">
          S
        </div>
        <div className="user-name">
          Suman
        </div>
      </div>

      {/* USER DROPDOWN */}
      {isMenuOpen && (
        <div ref={menuRef} className="user-menu">
          <ul>
            <li
              onClick={() => {
                setIsMenuOpen(false);
                onOpenPage({
                  masmnu_id: "PROFILE",
                  bar_name: "Profile",
                  appl_name: "PROFILE",
                });
              }}
            >
              Profile
            </li>

            <li>Settings</li>

            <li
              onClick={handleLogout}
              style={{ color: "#dc2626" }}
            >
              Log Out
            </li>
          </ul>
        </div>
      )}
    </div>
  </header>
);
}

export default Header;
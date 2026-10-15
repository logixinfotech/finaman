import { useEffect, useState, useCallback, memo } from "react";
import { fetchSidebarMenu } from "../../utils/api";
import DynamicIcon from "./DynamicIcon";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../../theme/AuthContext";
function Sidebar({ onMenuItemClick, collapsed = false, onToggleSidebar }) {
  const [modules, setModules] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
      const { token } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const isCollapsed = isMobile ? false : collapsed;

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);

      try {
      
        if (!token) throw new Error("No token found");

        const data = await fetchSidebarMenu(token);
     

        const visibleModules = (data || [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0));

        setModules(visibleModules);
      } catch (err) {
        setError(err.message || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const handleClick = useCallback(
    (module) => {
      setActiveId(module.masmod_id);
      onMenuItemClick && onMenuItemClick(module);
    },
    [onMenuItemClick]
  );

  const iconColors = [
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#60a5fa", "#818cf8", "#a78bfa",
    "#f472b6", "#fb7185", "#fdba74", "#facc15", "#4ade80",
    "#34d399", "#2dd4bf", "#22d3ee", "#38bdf8", "#93c5fd",
  ];

  function getIconColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return iconColors[Math.abs(hash % iconColors.length)];
  }

  return (
    <aside
     className={`relative h-full flex flex-col transition-all duration-300 ease-in-out border-r
  ${isCollapsed ? "w-[64px]" : "w-[220px]"}`}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-main)",
        color: "var(--sidebar-text)",
        
      }}
    >
      {!isMobile && (
        <button
          onClick={onToggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm z-50 cursor-pointer transition-transform hover:scale-110"
          style={{
            background: "var(--bg-sidebar)",
            borderColor: "var(--border-main)",
            color: "var(--sidebar-text)",
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <FaChevronRight className="text-[length:calc(10px*var(--fs,1))]" />
          ) : (
            <FaChevronLeft className="text-[length:calc(10px*var(--fs,1))]" />
          )}
        </button>
      )}
   <div
  className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 no-scrollbar"
  style={{
    WebkitOverflowScrolling: "touch",
    paddingBottom: "120px",
  }}
>
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 text-center px-3 mt-4">{error}</div>
        )}

        {modules.map((module) => {
          const isActive = activeId === module.masmod_id;

          return (
            <div
              key={module.masmod_id}
              onClick={() => handleClick(module)}
              title={isCollapsed ? module.mod_name : ""}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                transition-all duration-200 hover:translate-x-[2px]
                ${isActive ? "shadow-sm" : ""}`}
              style={{
                background: isActive ? "var(--bg-active)" : "transparent",
                color: isActive ? "var(--text-active)" : "var(--sidebar-text)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Active indicator strip */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r animate-pulse"
                  style={{ background: "var(--text-active)" }}
                />
              )}

              {/* Icon */}
              <div
                className={`flex items-center justify-center transition-transform duration-200
                  group-hover:scale-110
                  ${isCollapsed ? "w-full" : "w-6"}`}
                style={{
                  color: isActive ? "#fff" : getIconColor(module.mod_name),
                  background: isActive
                    ? "rgba(255,255,255,.15)"
                    : "rgba(255,255,255,.05)",
                  borderRadius: "8px",
                  padding: "4px",
                  fontSize: "18px",
                }}
              >
                <DynamicIcon name={module.icon_name} />
              </div>
              {!isCollapsed && (
                <span className="text-[length:calc(13px*var(--fs,1))] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {module.mod_name}
                </span>
              )}
              {isCollapsed && (
                <div className="fixed left-[70px] bg-gray-900 text-white text-xs px-2 py-1
                  rounded opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity shadow z-[200]">
                  {module.mod_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
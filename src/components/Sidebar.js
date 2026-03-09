import { useEffect, useState, useCallback, memo } from "react";
import { fetchSidebarMenu } from "../utils/api";
import DynamicIcon from "./DynamicIcon";
import { FaBars } from "react-icons/fa";

function Sidebar({ onMenuItemClick, collapsed = false, onToggleSidebar }) {
  const [modules, setModules] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);

      try {
        const token = sessionStorage.getItem("token");
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

  return (
    <aside
      className={`h-full flex flex-col border-r transition-all duration-300 ease-in-out
      ${collapsed ? "w-[64px]" : "w-[220px]"}`}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-main)",
        color: "var(--text-main)"
      }}
    >
      <div
        className="h-[50px] flex items-center px-4 shadow-sm"
        style={{ background: "var(--sidebar-top-bg)" }}
      >
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-3 w-full text-white hover:opacity-90 transition"
        >
          <FaBars className="text-lg" />

          {!collapsed && (
            <span className="font-semibold tracking-wide text-sm">
              Navigator
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 no-scrollbar">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 text-center px-3">
            {error}
          </div>
        )}

        {modules.map((module) => {
          const isActive = activeId === module.masmod_id;

          return (
            <div
              key={module.masmod_id}
              onClick={() => handleClick(module)}
              title={collapsed ? module.mod_name : ""}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
              hover:translate-x-[2px]
              ${isActive ? "shadow-sm" : ""}`}
              style={{
                background: isActive ? "var(--bg-active)" : "transparent",
                color: isActive ? "var(--text-active)" : "var(--text-main)"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r animate-pulse"
                  style={{ background: "var(--text-active)" }}
                />
              )}

              <div
                className={`flex items-center justify-center transition-transform duration-200 group-hover:scale-110
                ${collapsed ? "w-full" : "w-6"}`}
                style={{
                  color: isActive ? "var(--text-active)" : "var(--icon-color)",
                  fontSize: "18px"
                }}
              >
                <DynamicIcon name={module.icon_name} />
              </div>

              {!collapsed && (
                <span className="text-[13px] font-medium whitespace-nowrap">
                  {module.mod_name}
                </span>
              )}

              {collapsed && (
                <div className="fixed left-[70px] bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow">
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
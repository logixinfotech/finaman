import React, { useEffect, useState } from "react";
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

        const visible = (data || [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0));

        setModules(visible);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const handleClick = (module) => {
    setActiveId(module.masmod_id);
    onMenuItemClick && onMenuItemClick(module);
  };

  return (
    <aside
      className={`
        h-full
        transition-all duration-300
        ${collapsed ? "w-[72px]" : "w-[260px]"}
        flex flex-col
        border-r
      `}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-main)",
        color: "var(--text-main)",
      }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center px-3 border-b"
        style={{ borderColor: "var(--border-main)" }}
      >
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all"
          style={{ background: "transparent" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <FaBars />
          {!collapsed && <span className="font-semibold">Modules</span>}
        </button>
      </div>

      {/* Menu */}
     <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-1">
        {loading && (
          <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        )}

        {error && (
          <div className="text-xs text-center text-red-500">
            {error}
          </div>
        )}

        {modules.map((m) => {
          const isActive = activeId === m.masmod_id;

          return (
            <div
              key={m.masmod_id}
              onClick={() => handleClick(m)}
              className={`
                group relative flex items-center gap-3
                px-3 py-2.5
                rounded-xl
                cursor-pointer
                transition-all duration-200
              `}
              style={{
                background: isActive ? "var(--bg-active)" : "transparent",
                color: isActive
                  ? "var(--text-active)"
                  : "var(--text-main)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
              title={collapsed ? m.mod_name : ""}
            >
              {/* Active Left Indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                  style={{ background: "var(--icon-color)" }}
                />
              )}

              {/* Icon */}
              <div
                className="text-lg transition-transform duration-200 group-hover:scale-110"
                style={{
                  color: isActive
                    ? "var(--text-active)"
                    : "var(--icon-color)",
                }}
              >
                <DynamicIcon name={m.icon_name} />
              </div>

              {/* Label */}
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {m.mod_name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
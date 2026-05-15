/**
 * pages/NotificationPanel.jsx
 * ═══════════════════════════════════════════════════════════════
 * UI updated to match boss's reference design:
 *   • Colored left border per notification type (like border-l-[6px])
 *   • Type icon in colored circle (info=blue, warning=yellow, etc.)
 *   • "New" green badge on unread items
 *   • Per-item "Mark as Read" button
 *   • Animated pulse ring on newest notification
 *   • Search bar in panel
 *
 * All existing features kept:
 *   • resolveMenu navigation (masmnu lookup)
 *   • Category filter tabs
 *   • menusFromBackend from context
 *   • Framer Motion animations
 *   • Mute / mark-all / clear-all / refresh
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, VolumeX, Volume2, RefreshCw,
  Info, AlertTriangle, XCircle, CheckCircle2, CircleCheck,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotifications, CATEGORIES } from "../theme/NotificationContext";

dayjs.extend(relativeTime);

// ─── Helpers ─────────────────────────────────────────────────
function groupByDay(list) {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today     = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");
  list.forEach(n => {
    const d = dayjs(n.created_at);
    if (d.isSame(today, "day"))          groups.Today.push(n);
    else if (d.isSame(yesterday, "day")) groups.Yesterday.push(n);
    else                                  groups.Earlier.push(n);
  });
  return groups;
}

// Fixed resolveMenu — no fake fallback, returns real masmnu row or null
function resolveMenu(action_url, menusFromBackend) {
  if (!action_url || !menusFromBackend?.length) return null;
  return menusFromBackend.find(
    m => m.appl_name?.trim() === action_url?.trim()
  ) || null;
}

// ─── Type → icon + colors (matches reference UI) ─────────────
const TYPE_CONFIG = {
  info:    { Icon: Info,         bg: "bg-blue-100",   text: "text-blue-500",   border: "#3b82f6" },
  warning: { Icon: AlertTriangle,bg: "bg-yellow-100", text: "text-yellow-500", border: "#f59e0b" },
  error:   { Icon: XCircle,      bg: "bg-red-100",    text: "text-red-500",    border: "#ef4444" },
  success: { Icon: CircleCheck,  bg: "bg-green-100",  text: "text-green-500",  border: "#22c55e" },
  default: { Icon: Bell,         bg: "bg-gray-100",   text: "text-gray-500",   border: "#9ca3af" },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

// ─── Single row ───────────────────────────────────────────────
const NotifRow = ({ n, onRead, onDismiss, onNavigate, menusFromBackend, isNewest }) => {
  const cat      = CATEGORIES[n.category] || CATEGORIES.system;
  const resolved = resolveMenu(n.action_url, menusFromBackend);
  const tc       = getTypeConfig(n.type);
  const IconComp = tc.Icon;

  const handleClick = () => {
    onRead(n.id);
    if (resolved) onNavigate(resolved);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={handleClick}
      className={`
        group flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer
        transition-all duration-150 bg-white
        ${isNewest ? "ring-2 ring-green-400 animate-pulse" : ""}
      `}
      style={{
        borderLeft: `4px solid ${n.is_read ? "transparent" : tc.border}`,
        boxShadow: n.is_read ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = n.is_read ? "none" : "0 1px 4px rgba(0,0,0,0.06)"}
    >
      {/* Type icon in colored circle */}
      <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${tc.bg}`}>
        <IconComp className={`w-4 h-4 ${tc.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + New badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-[13px] leading-snug ${n.is_read ? "text-gray-600 font-normal" : "text-gray-800 font-semibold"}`}>
            {n.title}
          </p>
          {!n.is_read && (
            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
              New
            </span>
          )}
        </div>

        {/* Message preview — single line */}
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">
          {n.message}
        </p>

        {/* Meta: time + category + open link */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-gray-400">
            {dayjs(n.created_at).fromNow()}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          {resolved && (
            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: tc.border }}>
              Open →
            </span>
          )}
        </div>
      </div>

      {/* Right: mark-as-read button + dismiss */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {!n.is_read && (
          <button
            onClick={e => { e.stopPropagation(); onRead(n.id); }}
            className="flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded-md hover:bg-green-50 transition-all font-medium"
            title="Mark as read"
          >
            <CheckCircle2 size={11} />
            Read
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[10px] text-gray-400 hover:text-gray-600"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────
const NotificationPanel = ({ onOpenAll, onNavigate }) => {
  const {
    notifications, unreadCount, muted, loading,
    menusFromBackend,
    markAsRead, markAllAsRead, dismissById, clearAll,
    toggleMute, fetchNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText,   setSearchText]   = useState("");
  const [newestId,     setNewestId]     = useState(null);

  // Track newest notification for pulse ring
  const prevLength = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > prevLength.current) {
      const newest = notifications[0];
      if (newest && !newest.is_read) {
        setNewestId(newest.id);
        setTimeout(() => setNewestId(null), 5000);
      }
    }
    prevLength.current = notifications.length;
  }, [notifications]);

  // Filter + search
  const filtered = notifications
    .filter(n => {
      if (activeFilter === "unread") return !n.is_read;
      if (activeFilter !== "all")   return n.category === activeFilter;
      return true;
    })
    .filter(n => {
      if (!searchText) return true;
      const s = searchText.toLowerCase();
      return n.title?.toLowerCase().includes(s) || n.message?.toLowerCase().includes(s);
    });

  const recent = filtered.slice(0, 8);
  const groups = groupByDay(recent);

  const activeCats = [...new Set(notifications.map(n => n.category))].filter(c => CATEGORIES[c]);
  const filterTabs = [
    { key: "all",    label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    ...activeCats.map(c => ({ key: c, label: CATEGORIES[c].label })),
  ];

  return (
    <div
      className="w-[360px] flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "#f9fafb",
        border:     "1px solid #e5e7eb",
        boxShadow:  "0 10px 40px rgba(0,0,0,0.14)",
        maxHeight:  "540px",
      }}
    >
      {/* ── Header (uses your sidebar-top-bg theme color) ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: "var(--sidebar-top-bg)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="relative flex-shrink-0">
          <Bell
            size={16}
            className={unreadCount > 0 ? "text-white animate-bounce" : "text-white/60"}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <span className="text-[12px] font-bold uppercase tracking-widest flex-1 text-white/90">
          Notifications
        </span>

        {/* Action buttons */}
        {[
          { icon: <RefreshCw size={13} className={loading ? "animate-spin" : ""} />, fn: fetchNotifications, tip: "Refresh" },
          { icon: muted ? <VolumeX size={13} /> : <Volume2 size={13} />,             fn: toggleMute,         tip: muted ? "Unmute" : "Mute" },
          { icon: <CheckCheck size={13} />,                                           fn: markAllAsRead,      tip: "Mark all read" },
          { icon: <Trash2     size={13} />,                                           fn: clearAll,           tip: "Clear all" },
        ].map((b, i) => (
          <button key={i} onClick={b.fn} title={b.tip}
            className="p-1.5 rounded-lg transition-all text-white/40 hover:text-white hover:bg-white/10">
            {b.icon}
          </button>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0 bg-white" style={{ borderBottom: "1px solid #f3f4f6" }}>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-xs rounded-lg border bg-gray-50 text-gray-700 outline-none transition-all"
            style={{ border: "1px solid #e5e7eb" }}
            onFocus={e => e.target.style.borderColor = "var(--sidebar-top-bg)"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
          {searchText && (
            <button onClick={() => setSearchText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter tabs ── */}
      <div
        className="flex gap-1 px-3 py-2 overflow-x-auto flex-shrink-0 bg-white"
        style={{ borderBottom: "1px solid #e5e7eb", scrollbarWidth: "none" }}
      >
        {filterTabs.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
            style={{
              background:  activeFilter === f.key ? "var(--sidebar-top-bg)" : "transparent",
              borderColor: activeFilter === f.key ? "var(--sidebar-top-bg)" : "#e5e7eb",
              color:       activeFilter === f.key ? "#fff"                  : "#6b7280",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Notification list ── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        style={{ scrollbarWidth: "thin", background: "#f9fafb" }}
      >
        <AnimatePresence mode="popLayout">
          {!recent.length ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-10">
              <Bell size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">
                {loading ? "Loading..." : searchText ? "No results found" : "No notifications"}
              </p>
            </motion.div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <p className="px-1 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {label}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(n => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        onRead={markAsRead}
                        onNavigate={onNavigate}
                        onDismiss={dismissById}
                        menusFromBackend={menusFromBackend}
                        isNewest={n.id === newestId}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <button
        onClick={onOpenAll}
        className="w-full text-center text-[11px] font-bold py-3 transition-all flex-shrink-0 bg-white hover:bg-gray-50"
        style={{
          borderTop: "1px solid #e5e7eb",
          color: "var(--sidebar-top-bg)",
        }}
      >
        View all notifications →
      </button>
    </div>
  );
};

export default NotificationPanel;

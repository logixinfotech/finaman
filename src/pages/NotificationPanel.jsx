/**
 * NotificationPanel.jsx  (pages/NotificationPanel.jsx)
 * ─────────────────────────────────────────────────────────────────
 * Your existing Header already does:
 *
 *   import NotificationPanel from "../../pages/NotificationPanel";
 *   <NotificationPanel
 *     onOpenAll={() => onOpenPage({ masmnu_id:"NOTIFICATIONS", bar_name:"Notifications", appl_name:"NOTIFICATIONS_PAGE" })}
 *     onNavigate={(link) => { setShowNotifications(false); onOpenPage(link); }}
 *   />
 *
 * onNavigate receives the appl_name string from notification.action_url,
 * so it opens the correct tab in your PageRegistry system.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck, Trash2, VolumeX, Volume2, Bell,
  RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotifications, CATEGORIES } from "../theme/NotificationContext";

dayjs.extend(relativeTime);

// ─── Day grouping helper ──────────────────────────────────────────
function groupByDay(list) {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");
  list.forEach((n) => {
    const d = dayjs(n.created_at);
    if (d.isSame(today, "day"))     groups.Today.push(n);
    else if (d.isSame(yesterday, "day")) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
}

// ─── Single row ───────────────────────────────────────────────────
const NotifRow = ({ n, onRead, onDismiss, onNavigate }) => {
  const cat = CATEGORIES[n.category] || CATEGORIES.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onClick={() => {
        onRead(n.id);
        // action_url = appl_name in your tab system
        if (n.action_url) {
          onNavigate?.({
            masmnu_id: n.action_url,
            bar_name: n.title,
            appl_name: n.action_url,
          });
        }
      }}
      className={`
        group flex items-start gap-3 px-3 py-2.5 rounded-xl
        cursor-pointer transition-colors duration-150
        ${n.is_read
          ? "hover:bg-white/5"
          : "bg-blue-500/10 hover:bg-blue-500/15"
        }
      `}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
        style={{ background: cat.bg + "33" }}
      >
        {cat.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug truncate ${
          n.is_read ? "text-white/60 font-normal" : "text-white font-semibold"
        }`}>
          {n.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/35">
            {dayjs(n.created_at).fromNow()}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ color: cat.color, background: cat.bg + "30" }}
          >
            {cat.label}
          </span>
        </div>
      </div>

      {/* Unread dot + dismiss */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/80 p-0.5 rounded text-xs"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────
const NotificationPanel = ({ onOpenAll, onNavigate }) => {
  const {
    notifications, unreadCount, connected,
    muted, markAsRead, markAllAsRead,
    dismissById, clearAll, toggleMute, fetchNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.is_read;
    if (activeFilter !== "all")   return n.category === activeFilter;
    return true;
  });

  const recent = filtered.slice(0, 8);
  const groups = groupByDay(recent);

  // Build filter tabs: All + Unread + categories that have at least 1 notification
  const activeCats = [...new Set(notifications.map((n) => n.category))];
  const filterTabs = [
    { key: "all",    label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    ...activeCats
      .filter((c) => CATEGORIES[c])
      .map((c) => ({ key: c, label: CATEGORIES[c].label })),
  ];

  return (
    <div
      className="w-[340px] flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "var(--sidebar-top-bg, #0f172a)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        maxHeight: "520px",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Bell
          size={14}
          className={unreadCount > 0 ? "text-blue-400 animate-pulse" : "text-white/40"}
        />
        <span className="text-sm font-bold text-white flex-1 tracking-wide uppercase" style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
          Notifications
        </span>

        {/* WS status dot */}
        <span
          title={connected ? "Live (WebSocket)" : "Polling"}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: connected ? "#22c55e" : "#f59e0b" }}
        />

        {unreadCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">
            {unreadCount} new
          </span>
        )}

        {/* Action buttons */}
        <button onClick={fetchNotifications} title="Refresh"
          className="text-white/30 hover:text-white/80 p-1 rounded-lg hover:bg-white/5 transition-colors">
          <RefreshCw size={12} />
        </button>
        <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"}
          className="text-white/30 hover:text-white/80 p-1 rounded-lg hover:bg-white/5 transition-colors">
          {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <button onClick={markAllAsRead} title="Mark all read"
          className="text-white/30 hover:text-white/80 p-1 rounded-lg hover:bg-white/5 transition-colors">
          <CheckCheck size={12} />
        </button>
        <button onClick={clearAll} title="Clear all"
          className="text-white/30 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="flex gap-1 px-3 py-2 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}
      >
        {filterTabs.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-150"
            style={{
              background:   activeFilter === f.key ? "rgba(255,255,255,0.12)" : "transparent",
              borderColor:  activeFilter === f.key ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
              color:        activeFilter === f.key ? "rgba(255,255,255,0.9)"  : "rgba(255,255,255,0.4)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3" style={{ scrollbarWidth: "thin" }}>
        <AnimatePresence mode="popLayout">
          {!recent.length ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <Bell size={28} className="mx-auto mb-2 text-white/15" />
              <p className="text-xs text-white/30">No notifications</p>
            </motion.div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((n) => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        onRead={markAsRead}
                        onNavigate={onNavigate}
                        onDismiss={dismissById}
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
        className="w-full text-center text-[11px] font-bold py-3 transition-colors tracking-wide uppercase"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.4)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        View all notifications →
      </button>
    </div>
  );
};

export default NotificationPanel;

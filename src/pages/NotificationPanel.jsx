/**
 * NotificationPanel.jsx
 * ─────────────────────────────────────────────────────────────
 * Dropdown panel that opens from the bell icon.
 * Features:
 *   • Category filter tabs (All, Payroll, Accounts, …)
 *   • Grouped Today / Yesterday / Earlier
 *   • Unread highlight + blue dot indicator
 *   • Mark-all and Clear-all in header
 *   • Framer Motion slide + scale entrance
 *   • Click-outside to close (handled by parent)
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   onOpenAll   () => void  — navigates to full NotificationsPage
 *   onNavigate  (url: string) => void
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, VolumeX, Volume2,
  Info, CheckCircle, AlertTriangle, AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { useNotifications, CATEGORIES } from "../theme/NotificationContext";
import { groupByDay } from "../components/Layout/Notification/useNotificationTime";

dayjs.extend(relativeTime);

// ─── Type → icon map ─────────────────────────────────────────
const TYPE_ICONS = {
  info:    <Info    size={14} />,
  success: <CheckCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  error:   <AlertCircle size={14} />,
};

// ─── Single notification row ─────────────────────────────────
const NotifRow = ({ n, onRead, onNavigate, onDismiss }) => {
  const cat = CATEGORIES[n.category] || CATEGORIES.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
      onClick={() => {
        onRead(n.id);
        if (n.action_url) onNavigate?.(n.action_url);
      }}
      className={`
        group flex items-start gap-3 px-3 py-2.5 rounded-xl
        cursor-pointer transition-colors duration-150
        ${n.is_read
          ? "hover:bg-slate-100 dark:hover:bg-slate-800"
          : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
        }
      `}
    >
      {/* Category icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
        style={{ background: cat.bg }}
      >
        {cat.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug truncate ${
          n.is_read
            ? "text-slate-600 dark:text-slate-300 font-normal"
            : "text-slate-800 dark:text-white font-medium"
        }`}>
          {n.title}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-400">
            {dayjs(n.created_at).fromNow()}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
            style={{ color: cat.color, borderColor: cat.color + "33", background: cat.bg }}
          >
            {cat.label}
          </span>
        </div>
      </div>

      {/* Right: unread dot + dismiss on hover */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────
const NotificationPanel = ({ isOpen, onClose, onOpenAll, onNavigate }) => {
  const {
    notifications,
    unreadCount,
    muted,
    markAsRead,
    markAllAsRead,
    dismissById,
    clearAll,
    toggleMute,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");

  // Filter list
  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.is_read;
    if (activeFilter !== "all")    return n.category === activeFilter;
    return true;
  });

  const recent = filtered.slice(0, 8);
  const groups = groupByDay(recent);

  const categoryFilters = [
    { key: "all",    label: "All" },
    { key: "unread", label: "Unread" },
    ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: -6,  scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ transformOrigin: "top right" }}
          className="
            absolute right-0 top-full mt-2 z-50
            w-80 flex flex-col
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            rounded-2xl shadow-2xl overflow-hidden
          "
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <Bell size={15} className={unreadCount > 0 ? "text-blue-500 animate-pulse" : "text-slate-400"} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">
              Notifications
            </span>

            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-semibold">
                {unreadCount} new
              </span>
            )}

            <button
              onClick={toggleMute}
              title={muted ? "Unmute" : "Mute"}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CheckCheck size={14} />
            </button>

            <button
              onClick={clearAll}
              title="Clear all"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* ── Category filter tabs ── */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-slate-800">
            {categoryFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`
                  flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full
                  border transition-all duration-150
                  ${activeFilter === f.key
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900"
                    : "bg-transparent text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:hover:border-slate-500 dark:text-slate-400"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Notification list ── */}
          <div className="flex-1 overflow-y-auto max-h-[360px] px-2 py-2 space-y-3">
            <AnimatePresence mode="popLayout">
              {!recent.length ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-slate-400 py-10"
                >
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  No notifications
                </motion.div>
              ) : (
                Object.entries(groups).map(([label, items]) =>
                  items.length > 0 && (
                    <div key={label}>
                      <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
            onClick={() => { onClose(); onOpenAll?.(); }}
            className="
              w-full text-center text-xs font-semibold py-3
              text-blue-600 dark:text-blue-400
              border-t border-slate-100 dark:border-slate-800
              hover:bg-slate-50 dark:hover:bg-slate-800
              transition-colors
            "
          >
            View all notifications →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

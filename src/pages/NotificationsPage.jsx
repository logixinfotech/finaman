/**
 * NotificationsPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Full-page notification centre.
 *
 * Features:
 *   • All/Unread/Read tabs + category tabs
 *   • Keyboard navigation (↑ ↓ Enter to mark read, R = read all)
 *   • Per-item dismiss button
 *   • Staggered Framer Motion list entrance
 *   • Priority badge (critical / high / medium / low)
 *   • Message body expand on click
 *   • Connection status indicator (WS live / polling)
 *
 * Route it to: /notifications
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, RefreshCw,
  Info, CheckCircle, AlertTriangle, AlertCircle,
  Wifi, WifiOff,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { useNotifications, CATEGORIES, PRIORITIES } from "../theme/NotificationContext";
import { groupByDay } from "../components/Layout/Notification/useNotificationTime";

dayjs.extend(relativeTime);

// ─── Priority badge ───────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const p = PRIORITIES[priority] || PRIORITIES.low;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
      style={{ color: p.color, borderColor: p.color + "40", background: p.color + "12" }}
    >
      {p.label}
    </span>
  );
};

// ─── Type icon ────────────────────────────────────────────────
const TypeIcon = ({ type, size = 16 }) => {
  const icons = {
    info:    <Info    size={size} className="text-blue-500" />,
    success: <CheckCircle size={size} className="text-green-500" />,
    warning: <AlertTriangle size={size} className="text-amber-500" />,
    error:   <AlertCircle size={size} className="text-red-500" />,
  };
  return icons[type] || icons.info;
};

// ─── Single full-page row ─────────────────────────────────────
const NotifItem = ({ n, isActive, onRead, onDismiss, onNavigate, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[n.category] || CATEGORIES.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`
        group relative flex items-start gap-4 px-4 py-4 rounded-2xl
        cursor-pointer transition-colors duration-150
        ${isActive ? "ring-2 ring-blue-400/30 ring-offset-0" : ""}
        ${n.is_read
          ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
          : "bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
        }
      `}
      onClick={() => {
        onRead(n.id);
        setExpanded((v) => !v);
      }}
    >
      {/* Left: unread bar */}
      {!n.is_read && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-blue-500" />
      )}

      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: cat.bg }}
      >
        {cat.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          <PriorityBadge priority={n.priority} />
          <TypeIcon type={n.type} size={13} />
        </div>

        <p className={`text-sm leading-snug mt-1.5 ${
          n.is_read
            ? "text-slate-600 dark:text-slate-300 font-normal"
            : "text-slate-800 dark:text-white font-semibold"
        }`}>
          {n.title}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0,   height: 0 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed overflow-hidden"
            >
              {n.message}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-slate-400">
            {dayjs(n.created_at).fromNow()}
          </span>
          {n.action_url && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate?.(n.action_url); }}
              className="text-[11px] text-blue-500 hover:underline font-medium"
            >
              View →
            </button>
          )}
          {n.metadata && (
            <span className="text-[11px] text-slate-400">
              {Object.entries(n.metadata).map(([k, v]) => `${v}`).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* Right: dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
        title="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const NotificationsPage = ({ onNavigate }) => {
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    dismissById,
    clearAll,
    fetchNotifications,
  } = useNotifications();

  const [filter,     setFilter]     = useState("all");
  const [catFilter,  setCatFilter]  = useState("all");
  const [activeIdx,  setActiveIdx]  = useState(0);
  const itemRefs = useRef([]);

  // Apply filters
  const filtered = notifications.filter((n) => {
    const readMatch =
      filter === "all" ? true :
      filter === "unread" ? !n.is_read :
      n.is_read;
    const catMatch = catFilter === "all" ? true : n.category === catFilter;
    return readMatch && catMatch;
  });

  const groups   = groupByDay(filtered);
  const flatList = Object.values(groups).flat();

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flatList.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { const n = flatList[activeIdx]; if (n && !n.is_read) markAsRead(n.id); }
      if (e.key === "r" || e.key === "R") markAllAsRead();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIdx, flatList, markAsRead, markAllAsRead]);

  // Auto-scroll to active
  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  const tabs = [
    { key: "all",    label: "All",    count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read",   label: "Read",   count: notifications.length - unreadCount },
  ];

  const catTabs = [
    { key: "all", label: "All categories" },
    ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon })),
  ];

  let globalIdx = -1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
            <Bell size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Notifications
            </h1>
            <p className="text-xs text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              {" · "}
              <span className="inline-flex items-center gap-1">
                {connected
                  ? <><Wifi size={10} className="text-green-500" /> Live</>
                  : <><WifiOff size={10} className="text-amber-500" /> Polling</>
                }
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={12} /> Clear all
            </button>
          </div>
        </div>

        {/* ── Read/Unread tabs ── */}
        <div className="flex gap-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setActiveIdx(0); }}
              className={`
                flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl
                border transition-all duration-150
                ${filter === t.key
                  ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
                }
              `}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === t.key
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Category filter pills ── */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {catTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setCatFilter(t.key); setActiveIdx(0); }}
              className={`
                flex-shrink-0 flex items-center gap-1 text-[11px] font-medium
                px-3 py-1.5 rounded-full border transition-all duration-150
                ${catFilter === t.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                }
              `}
            >
              {t.icon && <span>{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Keyboard hint ── */}
        <p className="text-[11px] text-slate-400 mb-4 flex gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Enter</kbd> mark read</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">R</kbd> read all</span>
        </p>

        {/* ── List ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {!flatList.length ? (
            <div className="text-center py-16">
              <Bell size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">No notifications</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {Object.entries(groups).map(([label, items]) =>
                items.length > 0 && (
                  <div key={label}>
                    {/* Day label */}
                    <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {label}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((n) => {
                        globalIdx++;
                        const idx = globalIdx;
                        return (
                          <div
                            key={n.id}
                            ref={(el) => (itemRefs.current[idx] = el)}
                          >
                            <NotifItem
                              n={n}
                              index={idx}
                              isActive={idx === activeIdx}
                              onRead={markAsRead}
                              onDismiss={dismissById}
                              onNavigate={onNavigate}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationsPage;

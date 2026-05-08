/**
 * NOTIFICATIONS_PAGE.jsx
 * ─────────────────────────────────────────────────────────────────
 * Fixed to work inside your Dashboard tab system.
 *
 * Root element: h-full flex flex-col overflow-hidden
 *   — fills whatever height Dashboard gives it (no min-h-screen)
 *   — only the list scrolls, header/filters are sticky
 *
 * Registered in PageRegistry as:
 *   NOTIFICATIONS_PAGE: lazy(() => import("./pages/NOTIFICATIONS_PAGE"))
 * ─────────────────────────────────────────────────────────────────
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

dayjs.extend(relativeTime);

// ─── Helpers ─────────────────────────────────────────────────────
function groupByDay(list) {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today     = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");
  list.forEach((n) => {
    const d = dayjs(n.created_at);
    if (d.isSame(today, "day"))          groups.Today.push(n);
    else if (d.isSame(yesterday, "day")) groups.Yesterday.push(n);
    else                                  groups.Earlier.push(n);
  });
  return groups;
}

const TYPE_ICONS = {
  info:    <Info           size={12} className="text-blue-400"  />,
  success: <CheckCircle   size={12} className="text-green-400" />,
  warning: <AlertTriangle size={12} className="text-amber-400" />,
  error:   <AlertCircle   size={12} className="text-red-400"   />,
};

// ─── Priority badge ───────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const p = PRIORITIES[priority] || PRIORITIES.low;
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide"
      style={{ color: p.color, borderColor: p.color + "40", background: p.color + "15" }}
    >
      {p.label}
    </span>
  );
};

// ─── Single row ───────────────────────────────────────────────────
const NotifItem = ({ n, isActive, onRead, onDismiss, onOpenPage, index }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[n.category] || CATEGORIES.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ delay: index * 0.02, duration: 0.16 }}
      onClick={() => { onRead(n.id); setExpanded((v) => !v); }}
      className={`
        group relative flex items-start gap-3 px-4 py-3
        cursor-pointer transition-colors duration-150
        ${isActive ? "ring-1 ring-inset ring-blue-400/25" : ""}
        ${n.is_read
          ? "hover:bg-white/[0.03]"
          : "bg-blue-500/[0.06] hover:bg-blue-500/[0.09]"
        }
      `}
    >
      {/* Unread left accent bar */}
      {!n.is_read && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-blue-400" />
      )}

      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
        style={{ background: cat.bg + "22" }}
      >
        {cat.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Badge row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
            style={{ color: cat.color, background: cat.bg + "25" }}
          >
            {cat.label}
          </span>
          <PriorityBadge priority={n.priority} />
          {TYPE_ICONS[n.type]}
        </div>

        {/* Title */}
        <p className={`text-[13px] leading-snug ${
          n.is_read
            ? "text-white/50 font-normal"
            : "text-white/90 font-semibold"
        }`}>
          {n.title}
        </p>

        {/* Expanded message */}
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16 }}
              className="text-[12px] text-white/35 mt-1 leading-relaxed overflow-hidden"
            >
              {n.message}
              {n.metadata && (
                <span className="ml-2 text-white/20">
                  {Object.values(n.metadata).join(" · ")}
                </span>
              )}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-white/25">
            {dayjs(n.created_at).fromNow()}
          </span>
          {n.action_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRead(n.id);
                onOpenPage?.({
                  masmnu_id: n.action_url,
                  bar_name:  n.title,
                  appl_name: n.action_url,
                });
              }}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold hover:underline"
            >
              Open →
            </button>
          )}
          <span className="text-[10px] text-white/15">
            {expanded ? "↑ collapse" : "↓ details"}
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60 p-1 rounded flex-shrink-0 text-xs"
        title="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────
// Receives { tab, module, onOpenPage } from your Dashboard tab system
const NOTIFICATIONS_PAGE = ({ tab, module, onOpenPage }) => {
  const {
    notifications, unreadCount, connected,
    markAsRead, markAllAsRead, dismissById,
    clearAll, fetchNotifications,
  } = useNotifications();

  const [readFilter, setReadFilter] = useState("all");
  const [catFilter,  setCatFilter]  = useState("all");
  const [activeIdx,  setActiveIdx]  = useState(0);
  const itemRefs = useRef([]);

  const filtered = notifications.filter((n) => {
    const r =
      readFilter === "all"    ? true :
      readFilter === "unread" ? !n.is_read : n.is_read;
    const c = catFilter === "all" ? true : n.category === catFilter;
    return r && c;
  });

  const groups   = groupByDay(filtered);
  const flatList = Object.values(groups).flat();

  // Keyboard nav
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

  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  const activeCats = [...new Set(notifications.map((n) => n.category))];

  const readTabs = [
    { key: "all",    label: "All",    count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read",   label: "Read",   count: notifications.length - unreadCount },
  ];

  let globalIdx = -1;

  return (
 
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--content-bg, #093e31)" }}
    >

      {/* ══ STICKY HEADER ══════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Icon + title */}
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Bell size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[11px] font-bold text-white/80 uppercase tracking-widest leading-none">
            Notifications
          </h2>
          <p className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            <span className="opacity-40">·</span>
            {connected
              ? <><Wifi    size={8} className="text-green-400" />Live</>
              : <><WifiOff size={8} className="text-amber-400" />Polling</>
            }
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[
            { icon: <RefreshCw  size={11} />, tip: "Refresh",       fn: fetchNotifications },
            { icon: <CheckCheck size={11} />, tip: "Mark all read",  fn: markAllAsRead },
            { icon: <Trash2     size={11} />, tip: "Clear all",      fn: clearAll, danger: true },
          ].map((b) => (
            <button
              key={b.tip}
              onClick={b.fn}
              title={b.tip}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: b.danger ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = b.danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)";
                e.currentTarget.style.color      = b.danger ? "#ef4444" : "rgba(255,255,255,0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color      = b.danger ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.3)";
              }}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ══ READ / UNREAD TABS ══════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center gap-1 px-5 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {readTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setReadFilter(t.key); setActiveIdx(0); }}
            className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-lg border transition-all uppercase tracking-wide"
            style={{
              background:  readFilter === t.key ? "rgba(255,255,255,0.08)" : "transparent",
              borderColor: readFilter === t.key ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
              color:       readFilter === t.key ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)",
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className="text-[9px] px-1 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}

        {/* Keyboard hints — pushed to right */}
        <div className="ml-auto flex items-center gap-3">
          {["↑↓ Nav", "Enter Mark", "R All"].map((h) => (
            <span key={h} className="text-[9px] text-white/15 font-mono">{h}</span>
          ))}
        </div>
      </div>

      {/* ══ CATEGORY PILLS ═════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 overflow-x-auto"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          scrollbarWidth: "none",
        }}
      >
        {[
          { key: "all", label: "All", icon: null },
          ...activeCats
            .filter((c) => CATEGORIES[c])
            .map((c) => ({ key: c, label: CATEGORIES[c].label, icon: CATEGORIES[c].icon })),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setCatFilter(t.key); setActiveIdx(0); }}
            className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide transition-all"
            style={{
              background:  catFilter === t.key ? "rgba(59,130,246,0.12)" : "transparent",
              borderColor: catFilter === t.key ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)",
              color:       catFilter === t.key ? "rgba(96,165,250,0.9)"  : "rgba(255,255,255,0.28)",
            }}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ SCROLLABLE LIST — only this div scrolls ════════════════ */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
      >
        {!flatList.length ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Bell size={28} className="text-white/10 mb-2" />
            <p className="text-xs text-white/20">No notifications</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(groups).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  {/* Day separator */}
                  <div
                    className="flex items-center gap-3 px-5 py-1.5 sticky top-0 z-10"
                    style={{
                      background: "var(--content-bg, #0f172a)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                      {label}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                    <span className="text-[9px] text-white/15">{items.length}</span>
                  </div>

                  {/* Rows */}
                  {items.map((n) => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <div
                        key={n.id}
                        ref={(el) => (itemRefs.current[idx] = el)}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <NotifItem
                          n={n}
                          index={idx}
                          isActive={idx === activeIdx}
                          onRead={markAsRead}
                          onDismiss={dismissById}
                          onOpenPage={onOpenPage}
                        />
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
};

export default NOTIFICATIONS_PAGE;

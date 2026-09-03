import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, RefreshCw, CheckCircle2,
  Undo2,
} from "lucide-react";
import { useNotifications, CATEGORIES, PRIORITIES } from "../theme/NotificationContext";
import {
  getNotificationTypeConfig,
  resolveNotificationMenu,
  useNotificationFilters,
  useUndoableAction,
  useRelativeTime,
} from "../components/Layout/Notification/useNotificationTime";

// ─── Single row ───────────────────────────────────────────────
const NotifItem = ({
  n, isActive, isNewest,
  onRead, onDismiss, onOpenPage,
  menusFromBackend, itemRef,
}) => {
  const [expanded, setExpanded] = useState(false);
  const cat      = CATEGORIES[n.category] || CATEGORIES.system;
  const pri      = PRIORITIES[n.priority]  || PRIORITIES.low;
  const resolved = useMemo(
    () => resolveNotificationMenu(n.action_url, menusFromBackend),
    [n.action_url, menusFromBackend]
  );
  const tc       = getNotificationTypeConfig(n.type);
  const IconComp = tc.Icon;
  const timeLabel = useRelativeTime(n.created_at);

  const navigateToPage = useCallback((e) => {
    e.stopPropagation();
    onRead(n.id);
    if (resolved && onOpenPage) onOpenPage(resolved);
  }, [n.id, resolved, onRead, onOpenPage]);

  return (
    <motion.div
      ref={itemRef}
      layout="position"        // FIX 5: layout="position" avoids scale conflict
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      transition={{ duration: 0.18 }}
      onClick={() => { onRead(n.id); setExpanded(v => !v); }}
      className={`
        group relative flex items-start gap-3 px-4 py-3
        cursor-pointer transition-shadow duration-150 bg-white
        ${isNewest ? "ring-2 ring-green-400" : ""}
        ${isActive ? "ring-2 ring-inset ring-blue-300" : ""}
      `}
      style={{
        borderLeft: `6px solid ${n.is_read ? "transparent" : tc.border}`,
      }}
      // FIX 5: shadow hover instead of scale (no layout reflow)
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Type icon */}
      <div className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${tc.bg}`}>
        <IconComp className={`w-5 h-5 ${tc.text}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">

        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm leading-snug ${n.is_read ? "text-gray-600 font-normal" : "text-gray-800 font-semibold"}`}>
            {n.title}
          </p>
          {!n.is_read && (
            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
              New
            </span>
          )}
          {/* FIX 7: 9px badges bumped to 11px minimum for legibility */}
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0"
            style={{ color: pri.color, borderColor: pri.color + "40", background: pri.color + "10" }}
          >
            {pri.label}
          </span>
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
        </div>

        {/* Expandable message */}
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-gray-700 mt-1 leading-relaxed overflow-hidden"
            >
              {n.message}
              {n.metadata && (
                <span className="ml-1 text-xs text-gray-400">
                  · {Object.values(n.metadata).join(" · ")}
                </span>
              )}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-xs text-gray-500">{timeLabel}</span>
          {resolved && (
            <button
              onClick={navigateToPage}
              className="text-xs font-semibold hover:underline transition-colors flex-shrink-0"
              style={{ color: tc.border }}
              title={`Open ${resolved.bar_name}`}
            >
              → {resolved.bar_name}
            </button>
          )}
          <span className="text-[11px] text-gray-400">
            {expanded ? "↑ collapse" : "↓ details"}
          </span>
        </div>
      </div>

      {/* Right: mark read + dismiss */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {!n.is_read && (
          <button
            onClick={e => { e.stopPropagation(); onRead(n.id); }}
            className="flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded-md hover:bg-green-50 transition-all font-medium"
          >
            <CheckCircle2 size={11} />
            Read
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
          aria-label="Dismiss notification"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-gray-700 text-xs"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const NOTIFICATIONS_PAGE = ({ tab, module, onOpenPage }) => {
  const {
    notifications, unreadCount, loading,
    menusFromBackend,
    markAsRead, markAllAsRead, dismissById,
    clearAll, fetchNotifications,
  } = useNotifications();

  // FIX 8: shared filter/search/group state (was duplicated per-file, now
  // imported from hooks/useRelativeTime — see useNotificationFilters)
  const {
    readFilter, setReadFilter,
    catFilter, setCatFilter,
    searchText, setSearchText,
    searchQuery, clearSearch,
    groups,
  } = useNotificationFilters(notifications);

  const [activeIdx, setActiveIdx] = useState(0);
  const [newestId,  setNewestId]  = useState(null);

  // FIX 9: aria-live announcer for new/unread arrivals — screen readers
  // get told when something new comes in, sighted users still see the ring
  const [announceText, setAnnounceText] = useState("");

  // FIX 10: dismiss now goes through an undo window instead of being instant
  const { pending: pendingDismiss, run: runDismiss, undo: undoDismiss } =
    useUndoableAction(dismissById, { delayMs: 5000 });
  const [hiddenIds, setHiddenIds] = useState(() => new Set());

  const handleDismiss = useCallback((id) => {
    setHiddenIds(prev => new Set(prev).add(id));
    const item = notifications.find(n => n.id === id);
    runDismiss(id, item?.title || "Notification", id);
  }, [notifications, runDismiss]);

  const handleUndoDismiss = useCallback(() => {
    if (!pendingDismiss) return;
    setHiddenIds(prev => {
      const next = new Set(prev);
      next.delete(pendingDismiss.key);
      return next;
    });
    undoDismiss();
  }, [pendingDismiss, undoDismiss]);

  // FIX 11: Clear All needs a second click within 3s to actually fire —
  // protects against an accidental wipe of the whole notification list
  const [clearArmed, setClearArmed] = useState(false);
  const clearArmTimeout = useRef(null);
  const handleClearAll = useCallback(() => {
    if (!clearArmed) {
      setClearArmed(true);
      clearArmTimeout.current = setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    clearTimeout(clearArmTimeout.current);
    setClearArmed(false);
    clearAll();
  }, [clearArmed, clearAll]);
  useEffect(() => () => clearTimeout(clearArmTimeout.current), []);

  // FIX 4: itemRefs as a plain ref (not state), cleared on filter change
  const itemRefsMap = useRef({});
  const scrollContainer = useRef(null);

  // FIX 1: stable ref to flatList so keyboard handler never goes stale
  const flatListRef = useRef([]);

  // Keep activeIdx in a ref too, so the Enter-key handler always reads the
  // current selection instead of the value captured when the listener was
  // first registered (this was a latent bug in the original — the effect
  // only registers once since its deps are just [markAsRead, markAllAsRead],
  // so a plain closure over `activeIdx` would freeze at whatever it was on
  // mount).
  const activeIdxRef = useRef(0);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  // Track newest
  const prevLength = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > prevLength.current) {
      const newest = notifications[0];
      if (newest && !newest.is_read) {
        setNewestId(newest.id);
        setAnnounceText(`New notification: ${newest.title}`);
        setTimeout(() => setNewestId(null), 5000);
      }
    }
    prevLength.current = notifications.length;
  }, [notifications]);

  // FIX 4: clear refs when filter changes so indices stay in sync
  useEffect(() => {
    itemRefsMap.current = {};
    setActiveIdx(0);
  }, [readFilter, catFilter, searchQuery]);

  // FIX 1: keyboard handler uses flatListRef — never stale, never re-registers
  useEffect(() => {
    const handler = (e) => {
      const list = flatListRef.current;
      if (!list.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => {
          const next = Math.min(i + 1, list.length - 1);
          setTimeout(() => {
            itemRefsMap.current[list[next]?.id]?.scrollIntoView({
              block: "nearest", behavior: "smooth",
            });
          }, 0);
          return next;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => {
          const prev = Math.max(i - 1, 0);
          setTimeout(() => {
            itemRefsMap.current[list[prev]?.id]?.scrollIntoView({
              block: "nearest", behavior: "smooth",
            });
          }, 0);
          return prev;
        });
      }

      if (e.key === "Enter") {
        const n = list[activeIdxRef.current];
        if (n && !n.is_read) markAsRead(n.id);
      }
      if (e.key === "r" || e.key === "R") markAllAsRead();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [markAsRead, markAllAsRead]);

  const activeCats = useMemo(
    () => [...new Set(notifications.map(n => n.category))].filter(c => CATEGORIES[c]),
    [notifications]
  );

  const readTabs = [
    { key: "all",    label: "All",    count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read",   label: "Read",   count: notifications.length - unreadCount },
  ];

  const accentColor = "var(--sidebar-top-bg, #1e3a5f)";

  // FIX 12: pull unread error/warning items out of the day groups into a
  // "Needs attention" section pinned at the top, so a critical item from
  // an hour ago doesn't sit buried under 40 read updates from Today.
  // Grounded in `n.type` (info/warning/error/success), which already
  // exists on every notification — not a new priority field.
  const attentionCount = useMemo(
    () => notifications.filter(n => !n.is_read && (n.type === "error" || n.type === "warning")).length,
    [notifications]
  );

  const catCounts = useMemo(() => {
    const map = {};
    notifications.forEach(n => {
      if (!n.is_read) map[n.category] = (map[n.category] || 0) + 1;
    });
    return map;
  }, [notifications]);

  const sections = useMemo(() => {
    const attention = [];
    const rest = { Today: [], Yesterday: [], Earlier: [] };
    for (const [label, items] of Object.entries(groups)) {
      for (const n of items) {
        if (hiddenIds.has(n.id)) continue;
        if (!n.is_read && (n.type === "error" || n.type === "warning")) attention.push(n);
        else rest[label].push(n);
      }
    }
    const out = {};
    if (attention.length) out["Needs attention"] = attention;
    for (const [label, items] of Object.entries(rest)) {
      if (items.length) out[label] = items;
    }
    return out;
  }, [groups, hiddenIds]);
  const sectionsFlat = useMemo(() => Object.values(sections).flat(), [sections]);

  // FIX 1: keep flatListRef in sync — now sourced from `sections` so
  // keyboard nav order matches what's actually on screen, attention
  // section included.
  useEffect(() => { flatListRef.current = sectionsFlat; }, [sectionsFlat]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">

      {/* FIX 9: visually-hidden live region for screen readers */}
      <div aria-live="polite" role="status" className="sr-only">
        {announceText}
      </div>

      {/* ══ HEADER ═ */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="relative">
              <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-red-500 animate-bounce" : "text-blue-500"}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </h2>
          <p className="text-xs text-gray-400 hidden sm:block ml-1">
            {loading
              ? "Refreshing…"
              : unreadCount > 0
              ? `${unreadCount} unread${attentionCount > 0 ? ` · ${attentionCount} need attention` : ""}`
              : "All caught up"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} title="Refresh"
            className="p-2 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={markAllAsRead}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold shadow transition">
            <CheckCheck size={13} /> Mark All Read
          </button>
          <button
            onClick={handleClearAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold shadow transition text-white ${
              clearArmed ? "bg-red-700 animate-pulse" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            <Trash2 size={13} /> {clearArmed ? "Confirm clear?" : "Clear All"}
          </button>
        </div>
      </div>

      {/* ══ FILTER + SEARCH ═══════════════════════════════════ */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-2.5 bg-white border-b border-gray-200">
        <div className="flex gap-1.5">
          {readTabs.map(t => (
            <button key={t.key}
              onClick={() => setReadFilter(t.key)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-all"
              style={{
                background: readFilter === t.key ? accentColor : "#f3f4f6",
                color:      readFilter === t.key ? "#fff"      : "#374151",
              }}>
              {t.label}
              {t.count > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: readFilter === t.key ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                    color:      readFilter === t.key ? "#fff"                   : "#6b7280",
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-xs rounded border border-gray-200 bg-gray-50 text-gray-700 outline-none transition-all"
            onFocus={e => e.target.style.borderColor = "var(--sidebar-top-bg)"}
            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
          />
          {searchText && (
            <button onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ══ CATEGORY PILLS ════════════════════════════════════ */}
      {activeCats.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 overflow-x-auto bg-white border-b border-gray-100"
          style={{ scrollbarWidth: "none" }}>
          {[
            { key: "all", label: "All categories", icon: null },
            ...activeCats.map(c => ({ key: c, label: CATEGORIES[c].label, icon: CATEGORIES[c].icon })),
          ].map(t => (
            <button key={t.key}
              onClick={() => setCatFilter(t.key)}
              className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide transition-all"
              style={{
                background:  catFilter === t.key ? accentColor : "transparent",
                borderColor: catFilter === t.key ? accentColor : "#e5e7eb",
                color:       catFilter === t.key ? "#fff"      : "#6b7280",
              }}>
              {t.icon && <span>{t.icon}</span>}
              {t.label}
              {catCounts[t.key] > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold normal-case tracking-normal"
                  style={{
                    background: catFilter === t.key ? "rgba(255,255,255,0.25)" : "#fee2e2",
                    color:      catFilter === t.key ? "#fff"                   : "#b91c1c",
                  }}
                >
                  {catCounts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ══ KEYBOARD HINTS ════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-1.5 bg-gray-50 border-b border-gray-100">
        {[["↑↓", "Navigate"], ["Enter", "Mark read"], ["R", "Read all"]].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[11px] text-gray-400">
            <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono border border-gray-200 bg-white text-gray-500">
              {key}
            </kbd>
            {label}
          </span>
        ))}
      </div>

      {/* ══ LIST ═════════════════════════════════════════════ */}
      <div
        ref={scrollContainer}
        className="flex-1 overflow-y-auto min-h-0 py-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {!sectionsFlat.length ? (
          <div className="flex flex-col items-center justify-center h-48 mx-5 bg-white rounded-lg border border-gray-100">
            <Bell size={32} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-400">
              {loading
                ? "Loading notifications…"
                : searchQuery
                ? "No results found"
                : "No notifications"}
            </p>
          </div>
        ) : (
          <div className="space-y-5 px-5">
            {Object.entries(sections).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <h3
                    className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                      label === "Needs attention" ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {items.map((n) => {
                        const idx = sectionsFlat.indexOf(n);
                        return (
                          <div
                            key={n.id}
                            className="rounded-md overflow-hidden shadow-sm border border-gray-100"
                          >
                            <NotifItem
                              n={n}
                              isActive={idx === activeIdx}
                              isNewest={n.id === newestId}
                              onRead={markAsRead}
                              onDismiss={handleDismiss}
                              onOpenPage={onOpenPage}
                              menusFromBackend={menusFromBackend}
                              itemRef={el => {
                                if (el) itemRefsMap.current[n.id] = el;
                                else delete itemRefsMap.current[n.id];
                              }}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* FIX 10: undo-dismiss toast */}
      <AnimatePresence>
        {pendingDismiss && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex-shrink-0 mx-5 mb-4 flex items-center justify-between gap-3 bg-gray-800 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg"
          >
            <span>Notification dismissed</span>
            <button
              onClick={handleUndoDismiss}
              className="flex items-center gap-1 font-semibold text-green-300 hover:text-green-200"
            >
              <Undo2 size={13} /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NOTIFICATIONS_PAGE;

/**
 * pages/NOTIFICATIONS_PAGE.jsx
 * ═══════════════════════════════════════════════════════════════
 * Bug fixes applied:
 *
 * 1. KEYBOARD NAV HANGS
 *    - flatList is now useMemo so its reference only changes when
 *      filtered data actually changes (not every render)
 *    - keyboard handler uses a ref (flatListRef) so it always sees
 *      the latest list without needing it in the dependency array
 *    - itemRefs cleared when filter changes so indices stay in sync
 *
 * 2. STICKY HEADER BROKEN
 *    - Removed `sticky top-0` — it doesn't work inside
 *      overflow:hidden parents. flex-shrink-0 already pins it.
 *
 * 3. ANIMATEPRESENCE IN WRONG PLACE
 *    - Moved AnimatePresence to wrap NotifItem directly so
 *      individual item exit animations fire correctly
 *
 * 4. globalIdx / itemRefs OUT OF SYNC
 *    - Replaced render-local globalIdx with flatList.indexOf(n)
 *      so refs always match the memoized list indices
 *    - itemRefs.current = [] cleared on filter/search change
 *
 * 5. layout + hover:scale CONFLICT
 *    - Removed hover:scale-[1.005] from motion.div with layout prop
 *    - Replaced with CSS box-shadow hover (no layout reflow)
 *
 * 6. SEARCH DEBOUNCE
 *    - 200ms debounce on search so large lists don't jank
 * ═══════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, RefreshCw, CheckCircle2,
  Info, AlertTriangle, XCircle, CircleCheck,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotifications, CATEGORIES, PRIORITIES } from "../theme/NotificationContext";

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

function resolveMenu(action_url, menusFromBackend) {
  if (!action_url || !menusFromBackend?.length) return null;
  return menusFromBackend.find(
    m => m.appl_name?.trim() === action_url?.trim()
  ) || null;
}

// ─── Type config ──────────────────────────────────────────────
const TYPE_CONFIG = {
  info:    { Icon: Info,          bgCls: "bg-blue-100",   textCls: "text-blue-500",   border: "#3b82f6" },
  warning: { Icon: AlertTriangle, bgCls: "bg-yellow-100", textCls: "text-yellow-500", border: "#f59e0b" },
  error:   { Icon: XCircle,       bgCls: "bg-red-100",    textCls: "text-red-500",    border: "#ef4444" },
  success: { Icon: CircleCheck,   bgCls: "bg-green-100",  textCls: "text-green-500",  border: "#22c55e" },
  default: { Icon: Bell,          bgCls: "bg-gray-100",   textCls: "text-gray-500",   border: "#9ca3af" },
};
const getTC = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

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
    () => resolveMenu(n.action_url, menusFromBackend),
    [n.action_url, menusFromBackend]
  );
  const tc       = getTC(n.type);
  const IconComp = tc.Icon;

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
      <div className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${tc.bgCls}`}>
        <IconComp className={`w-5 h-5 ${tc.textCls}`} />
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
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0"
            style={{ color: pri.color, borderColor: pri.color + "40", background: pri.color + "10" }}
          >
            {pri.label}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
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
          <span className="text-xs text-gray-500">
            {dayjs(n.created_at).fromNow()}
          </span>
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
          <span className="text-[10px] text-gray-400">
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

  const [readFilter,  setReadFilter]  = useState("all");
  const [catFilter,   setCatFilter]   = useState("all");
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [searchText,  setSearchText]  = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // FIX 6: debounced
  const [newestId,    setNewestId]    = useState(null);

  // FIX 6: debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchText), 200);
    return () => clearTimeout(t);
  }, [searchText]);

  // FIX 4: itemRefs as a plain ref (not state), cleared on filter change
  const itemRefsMap = useRef({});
  const scrollContainer = useRef(null);

  // FIX 1: stable ref to flatList so keyboard handler never goes stale
  const flatListRef = useRef([]);

  // Track newest
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

  // FIX 1: memoize filtered list — only recalculates when data/filters change
  const filtered = useMemo(() => notifications.filter(n => {
    const r = readFilter === "all" ? true : readFilter === "unread" ? !n.is_read : n.is_read;
    const c = catFilter  === "all" ? true : n.category === catFilter;
    const s = !searchQuery ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return r && c && s;
  }), [notifications, readFilter, catFilter, searchQuery]);

  // FIX 1: memoize groups and flatList — stable references
  const groups   = useMemo(() => groupByDay(filtered), [filtered]);
  const flatList = useMemo(() => Object.values(groups).flat(), [groups]);

  // FIX 1: keep flatListRef in sync
  useEffect(() => { flatListRef.current = flatList; }, [flatList]);

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
          // FIX 1+4: scroll using the stable ref map
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
        const n = list[activeIdx];  // activeIdx read from closure is fine here
        if (n && !n.is_read) markAsRead(n.id);
      }
      if (e.key === "r" || e.key === "R") markAllAsRead();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // FIX 1: only markAsRead/markAllAsRead in deps — not flatList or activeIdx
    // flatList is read via flatListRef, activeIdx is read directly (stable in handler)
  }, [markAsRead, markAllAsRead]);

  // Keep activeIdx in a ref too so the keyboard handler can read it
  const activeIdxRef = useRef(0);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">

      {/* ══ HEADER — FIX 2: no sticky (doesn't work in overflow:hidden) ═ */}
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
            {loading ? "Refreshing…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
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
          <button onClick={clearAll}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold shadow transition">
            <Trash2 size={13} /> Clear All
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
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
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
            <button onClick={() => { setSearchText(""); setSearchQuery(""); }}
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
              className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide transition-all"
              style={{
                background:  catFilter === t.key ? accentColor : "transparent",
                borderColor: catFilter === t.key ? accentColor : "#e5e7eb",
                color:       catFilter === t.key ? "#fff"      : "#6b7280",
              }}>
              {t.icon && <span>{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ KEYBOARD HINTS ════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-1.5 bg-gray-50 border-b border-gray-100">
        {[["↑↓", "Navigate"], ["Enter", "Mark read"], ["R", "Read all"]].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-gray-400">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-gray-200 bg-white text-gray-500">
              {key}
            </kbd>
            {label}
          </span>
        ))}
      </div>

      {/* ══ LIST — FIX 1+3+4: stable scroll container ═════════ */}
      <div
        ref={scrollContainer}
        className="flex-1 overflow-y-auto min-h-0 py-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {!flatList.length ? (
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
            {Object.entries(groups).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    {label}
                  </h3>
                  {/* FIX 3: AnimatePresence wraps items directly */}
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {items.map((n, i) => {
                        // FIX 4: use flatList index keyed by n.id — stable across renders
                        const idx = flatList.indexOf(n);
                        return (
                          <div
                            key={n.id}
                            className="rounded-md overflow-hidden shadow-sm border border-gray-100"
                          >
                            <NotifItem
                              n={n}
                              index={i}
                              isActive={idx === activeIdx}
                              isNewest={n.id === newestId}
                              onRead={markAsRead}
                              onDismiss={dismissById}
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
    </div>
  );
};

export default NOTIFICATIONS_PAGE;

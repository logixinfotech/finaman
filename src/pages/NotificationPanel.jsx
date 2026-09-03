import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, VolumeX, Volume2, RefreshCw,
  CheckCircle2, Undo2,
} from "lucide-react";
import { useNotifications, CATEGORIES } from "../theme/NotificationContext";
import {
  getNotificationTypeConfig,
  resolveNotificationMenu,
  useNotificationFilters,
  useUndoableAction,
  useRelativeTime,
} from "../components/Layout/Notification/useNotificationTime";

// ─── Single row ───────────────────────────────────────────────
const NotifRow = ({ n, onRead, onDismiss, onNavigate, menusFromBackend, isNewest }) => {
  const cat      = CATEGORIES[n.category] || CATEGORIES.system;
  const resolved = useMemo(
    () => resolveNotificationMenu(n.action_url, menusFromBackend),
    [n.action_url, menusFromBackend]
  );
  const tc       = getNotificationTypeConfig(n.type);
  const IconComp = tc.Icon;
  const timeLabel = useRelativeTime(n.created_at);

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
          <span className="text-[11px] text-gray-400">{timeLabel}</span>
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.label}
          </span>
          {resolved && (
            <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
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
          aria-label="Dismiss notification"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-[11px] text-gray-400 hover:text-gray-600"
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

  // FIX 1 (backported from NOTIFICATIONS_PAGE): shared debounced search +
  // memoized filtering, instead of re-filtering the whole array on every
  // render with no debounce on the search box.
  const {
    catFilter, setCatFilter,
    searchText, setSearchText,
    groups: allGroups,
  } = useNotificationFilters(notifications, { debounceMs: 200 });

  const [readFilterOnly, setReadFilterOnly] = useState(false); // "unread"-only quick toggle, kept separate from catFilter tabs below
  const [newestId, setNewestId] = useState(null);
  const [announceText, setAnnounceText] = useState("");

  // FIX 2 (backported): undo-on-dismiss instead of instant removal
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

  // Track newest notification for pulse ring + screen-reader announcement
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

  // FIX 3 (backported): unread error/warning items get pulled into a
  // "Needs attention" section pinned above Today/Yesterday/Earlier — same
  // logic as NOTIFICATIONS_PAGE.jsx, so a critical item never scrolls out
  // of view in a dropdown that only shows 8 items total.
  const attentionAll = useMemo(() => {
    const flat = Object.values(allGroups).flat();
    return flat.filter(n => !n.is_read && (n.type === "error" || n.type === "warning") && !hiddenIds.has(n.id));
  }, [allGroups, hiddenIds]);

  // Everything else, filtered + capped to fill whatever's left of the
  // 8-item dropdown budget after attention items take their share.
  const recentCapped = useMemo(() => {
    const attentionIds = new Set(attentionAll.map(n => n.id));
    const restByLabel = {};
    const restFlat = [];
    for (const [label, items] of Object.entries(allGroups)) {
      const filtered = items.filter(n =>
        (!readFilterOnly || !n.is_read) && !hiddenIds.has(n.id) && !attentionIds.has(n.id)
      );
      restByLabel[label] = filtered;
      restFlat.push(...filtered);
    }
    const remainingSlots = Math.max(0, 8 - attentionAll.length);
    const cappedIds = new Set(restFlat.slice(0, remainingSlots).map(n => n.id));

    const out = {};
    if (attentionAll.length) out["Needs attention"] = attentionAll;
    for (const [label, items] of Object.entries(restByLabel)) {
      const capped = items.filter(n => cappedIds.has(n.id));
      if (capped.length) out[label] = capped;
    }
    return out;
  }, [allGroups, readFilterOnly, hiddenIds, attentionAll]);
  const recentFlat = useMemo(() => Object.values(recentCapped).flat(), [recentCapped]);

  const activeCats = [...new Set(notifications.map(n => n.category))].filter(c => CATEGORIES[c]);
  const filterTabs = [
    { key: "all",    label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    ...activeCats.map(c => ({ key: c, label: CATEGORIES[c].label })),
  ];
  const activeFilter = readFilterOnly ? "unread" : catFilter;
  const setActiveFilter = (key) => {
    if (key === "unread") { setReadFilterOnly(true); setCatFilter("all"); }
    else { setReadFilterOnly(false); setCatFilter(key); }
  };

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
      {/* Visually-hidden live region for screen readers */}
      <div aria-live="polite" role="status" className="sr-only">
        {announceText}
      </div>

      {/* ── Header ── */}
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

        {[
          { icon: <RefreshCw size={13} className={loading ? "animate-spin" : ""} />, fn: fetchNotifications, tip: "Refresh" },
          { icon: muted ? <VolumeX size={13} /> : <Volume2 size={13} />,             fn: toggleMute,         tip: muted ? "Unmute" : "Mute" },
          { icon: <CheckCheck size={13} />,                                           fn: markAllAsRead,      tip: "Mark all read" },
          { icon: <Trash2     size={13} />,                                           fn: clearAll,           tip: "Clear all" },
        ].map((b, i) => (
          <button key={i} onClick={b.fn} title={b.tip} aria-label={b.tip}
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
          {!recentFlat.length ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-10">
              <Bell size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-400">
                {loading ? "Loading..." : searchText ? "No results found" : "No notifications"}
              </p>
            </motion.div>
          ) : (
            Object.entries(recentCapped).map(([label, items]) =>
              items.length > 0 && (
                <div key={label}>
                  <p
                    className={`px-1 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-widest ${
                      label === "Needs attention" ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(n => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        onRead={markAsRead}
                        onNavigate={onNavigate}
                        onDismiss={handleDismiss}
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

      {/* Undo-dismiss toast */}
      <AnimatePresence>
        {pendingDismiss && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex-shrink-0 mx-3 mb-2 flex items-center justify-between gap-3 bg-gray-800 text-white text-[11px] px-3 py-2 rounded-lg shadow-lg"
          >
            <span>Notification dismissed</span>
            <button
              onClick={handleUndoDismiss}
              className="flex items-center gap-1 font-semibold text-green-300 hover:text-green-200"
            >
              <Undo2 size={12} /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

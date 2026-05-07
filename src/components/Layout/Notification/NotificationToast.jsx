/**
 * NotificationToast.jsx
 * ─────────────────────────────────────────────────────────────
 * Real-time toast that pops up in the bottom-right corner
 * whenever a new notification arrives (from WebSocket push or
 * manual addNotification() call).
 *
 * • Consumes `toastQueue` from context one-at-a-time
 * • Auto-dismisses after 5 seconds with a progress bar
 * • Click to mark as read + navigate
 * • Stacks gracefully (max 3 visible)
 *
 * Mount once near the root — typically in App.jsx or Layout.jsx:
 *   <NotificationToast onNavigate={(url) => navigate(url)} />
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { useNotifications, CATEGORIES } from "../theme/NotificationContext";

const TYPE_STYLES = {
  success: { bar: "#22c55e" },
  error:   { bar: "#ef4444" },
  warning: { bar: "#f59e0b" },
  info:    { bar: "#3b82f6" },
  action:  { bar: "#8b5cf6" },
};

const TOAST_DURATION = 5000; // ms

const SingleToast = ({ notification: n, onDismiss, onNavigate, onMarkRead }) => {
  const [progress, setProgress] = useState(100);
  const cat   = CATEGORIES[n.category] || CATEGORIES.system;
  const style = TYPE_STYLES[n.type]    || TYPE_STYLES.info;

  // Countdown progress bar
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
      else onDismiss();
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0,  x: 20, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="
        relative w-80 overflow-hidden
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        rounded-2xl shadow-xl
        cursor-pointer
      "
      onClick={() => {
        onMarkRead(n.id);
        if (n.action_url) onNavigate?.(n.action_url);
        onDismiss();
      }}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-0.5 transition-none"
        style={{ width: `${progress}%`, background: style.bar }}
      />

      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: cat.bg }}
        >
          {cat.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ color: cat.color, background: cat.bg }}
            >
              {cat.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 leading-snug">
            {n.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {n.message}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded flex-shrink-0 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Action hint */}
      {n.action_url && (
        <div className="flex items-center gap-1 px-4 pb-3 text-[11px] text-slate-400">
          <ExternalLink size={11} />
          Click to view
        </div>
      )}
    </motion.div>
  );
};

// ─── Toast Container ─────────────────────────────────────────
const NotificationToast = ({ onNavigate }) => {
  const { toastQueue, consumeToast, markAsRead } = useNotifications();

  // Show max 3 toasts at a time
  const visible = toastQueue.slice(0, 3);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visible.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <SingleToast
              notification={n}
              onDismiss={consumeToast}
              onNavigate={onNavigate}
              onMarkRead={markAsRead}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;

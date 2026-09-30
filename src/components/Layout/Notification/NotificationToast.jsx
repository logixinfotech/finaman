 
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNotifications, CATEGORIES } from "../../../theme/NotificationContext";

const DURATION = 5000;

const TYPE_ACCENT = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#3b82f6",
  action:  "#8b5cf6",
};

const SingleToast = ({ notification: n, onDismiss, onOpenPage, onMarkRead }) => {
  const [progress, setProgress] = useState(100);
  const cat    = CATEGORIES[n.category] || CATEGORIES.system;
  const accent = TYPE_ACCENT[n.type]    || TYPE_ACCENT.info;

  useEffect(() => {
    const start = Date.now();
    let raf;
    const tick = () => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
      else onDismiss();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0,   x: 20, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="relative w-[300px] overflow-hidden rounded-xl cursor-pointer"
      style={{
        background:  "var(--sidebar-top-bg, #0f172a)",
        border:      "1px solid rgba(255,255,255,0.1)",
        boxShadow:   "0 8px 32px rgba(0,0,0,0.4)",
      }}
      onClick={() => {
        onMarkRead(n.id);
        if (n.action_url) {
          onOpenPage?.({
            masmnu_id: n.action_url,
            bar_name:  n.title,
            appl_name: n.action_url,
          });
        }
        onDismiss();
      }}
    >
      <div
        className="absolute top-0 left-0 h-[2px] transition-none"
        style={{ width: `${progress}%`, background: accent }}
      />

      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: cat.bg + "25" }}
        >
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: cat.color, background: cat.bg + "20" }}
          >
            {cat.label}
          </span>
          <p className="text-[13px] font-semibold text-white mt-1 leading-snug line-clamp-1">
            {n.title}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
            {n.message}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="text-white/25 hover:text-white/70 p-0.5 rounded flex-shrink-0 mt-0.5 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {n.action_url && (
        <p className="px-4 pb-2.5 text-[10px] text-white/25 font-medium">
          Click to open →
        </p>
      )}
    </motion.div>
  );
};
const NotificationToast = ({ onOpenPage }) => {
  const { toastQueue, consumeToast, markAsRead } = useNotifications();
  const visible = toastQueue.slice(0, 3);

  return (
    <div
      className="fixed z-[9999] flex flex-col-reverse gap-2"
      style={{ bottom: "24px", right: "24px", pointerEvents: "none" }}
    >
      <AnimatePresence mode="popLayout">
        {visible.map((n) => (
          <div key={n.id} style={{ pointerEvents: "all" }}>
            <SingleToast
              notification={n}
              onDismiss={consumeToast}
              onOpenPage={onOpenPage}
              onMarkRead={markAsRead}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;

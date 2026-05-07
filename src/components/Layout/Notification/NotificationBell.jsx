/**
 * NotificationBell.jsx
 * ─────────────────────────────────────────────────────────────
 * The bell icon that lives in your app header / navbar.
 * Shows an animated red badge with unread count.
 * Clicking it toggles the NotificationPanel.
 *
 * Usage:
 *   <NotificationBell onToggle={() => setPanelOpen(o => !o)} isOpen={panelOpen} />
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotifications } from "../../../theme/NotificationContext";

const NotificationBell = ({ onToggle, isOpen }) => {
  const { unreadCount } = useNotifications();
  const prevCount = useRef(unreadCount);
  const badgeKey  = useRef(0);   // force re-mount to replay animation

  useEffect(() => {
    if (unreadCount > prevCount.current) badgeKey.current += 1;
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <motion.button
      onClick={onToggle}
      aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ""}`}
      aria-expanded={isOpen}
      whileTap={{ scale: 0.92 }}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-xl
        border transition-colors duration-150
        ${isOpen
          ? "bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600"
          : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
        }
      `}
    >
      {/* Bell icon — pulses when there are unread notifications */}
      <motion.span
        animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Bell
          size={16}
          className={`transition-colors ${
            unreadCount > 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        />
      </motion.span>

      {/* Unread badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key={badgeKey.current}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="
              absolute -top-1.5 -right-1.5
              min-w-[18px] h-[18px] px-1
              flex items-center justify-center
              rounded-full text-[10px] font-semibold
              bg-red-500 text-white
              border-2 border-white dark:border-slate-900
              pointer-events-none
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default NotificationBell;

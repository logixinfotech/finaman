import { useState } from "react";
import { useNotifications } from "../theme/NotificationContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

dayjs.extend(relativeTime);

const typeIconMap = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
};

const NotificationPanel = ({ onOpenAll, onNavigate }) => {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [filter] = useState("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const recent = filtered.slice(0, 5);

  const isToday = (d) => dayjs(d).isSame(dayjs(), "day");
  const isYesterday = (d) =>
    dayjs(d).isSame(dayjs().subtract(1, "day"), "day");

  const groups = { Today: [], Yesterday: [], Earlier: [] };

  recent.forEach((n) => {
    if (isToday(n.created_at)) groups.Today.push(n);
    else if (isYesterday(n.created_at)) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });

  return (
    <div
      className="absolute right-0 mt-3 w-80 max-h-[500px]
                 flex flex-col
                 bg-white dark:bg-slate-900
                 border border-slate-200 dark:border-slate-700
                 rounded-2xl shadow-2xl
                 z-50 overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-slate-200 dark:border-slate-700">

        <div className="flex items-center gap-2 text-sm font-semibold
                        text-slate-700 dark:text-slate-200">
          <Bell
            size={16}
            className={unreadCount > 0 ? "animate-pulse text-blue-600" : ""}
          />
          Notifications
        </div>

        {unreadCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full
                           bg-blue-100 text-blue-700
                           dark:bg-blue-900 dark:text-blue-300
                           font-medium">
            {unreadCount}
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">

        {!recent.length && (
          <div className="text-center text-xs text-slate-400 py-6">
            No notifications
          </div>
        )}

        {Object.entries(groups).map(
          ([label, items]) =>
            items.length > 0 && (
              <div key={label}>
                <div className="px-2 mb-2 text-[11px] uppercase tracking-wide
                                text-slate-400 font-semibold">
                  {label}
                </div>

                <div className="space-y-1">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) onNavigate?.(n.link);
                      }}
                      className={`flex items-start gap-3 px-3 py-2 rounded-xl
                                  cursor-pointer transition-all duration-200
                                  hover:bg-slate-100 dark:hover:bg-slate-800
                                  ${
                                    !n.is_read
                                      ? "bg-blue-50 dark:bg-blue-950/40"
                                      : ""
                                  }`}
                    >
                      <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                        {typeIconMap[n.type] || <Bell size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm truncate
                                      ${
                                        !n.is_read
                                          ? "font-semibold text-slate-800 dark:text-white"
                                          : "text-slate-600 dark:text-slate-300"
                                      }`}
                        >
                          {n.title}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {dayjs(n.created_at).fromNow()}
                        </div>
                      </div>

                      {!n.is_read && (
                        <div className="w-2 h-2 mt-1 rounded-full bg-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      {/* FOOTER */}
      <div
        onClick={onOpenAll}
        className="text-center text-xs font-medium py-3
                   border-t border-slate-200 dark:border-slate-700
                   text-blue-600 hover:bg-slate-50
                   dark:hover:bg-slate-800
                   cursor-pointer transition"
      >
        View all notifications →
      </div>
    </div>
  );
};

export default NotificationPanel;

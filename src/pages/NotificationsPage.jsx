import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../theme/NotificationContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";

dayjs.extend(relativeTime);

const typeIconMap = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
};

const NotificationsPage = () => {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const itemRefs = useRef([]); 
  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  }); 
  const isToday = (d) => dayjs(d).isSame(dayjs(), "day");
  const isYesterday = (d) =>
    dayjs(d).isSame(dayjs().subtract(1, "day"), "day");

  const groups = { Today: [], Yesterday: [], Earlier: [] };

  filtered.forEach((n) => {
    if (isToday(n.created_at)) groups.Today.push(n);
    else if (isYesterday(n.created_at)) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });

  const flatList = Object.values(groups).flat();
 
  useEffect(() => {
    const handler = (e) => {
      if (!flatList.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          Math.min(i + 1, flatList.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }

      if (e.key === "Enter") {
        const n = flatList[activeIndex];
        if (n && !n.is_read) markAsRead(n.id);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, flatList, markAsRead]);
 
  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]); 
  const markAllAsRead = () => {
    flatList.forEach((n) => {
      if (!n.is_read) markAsRead(n.id);
    });
  };

  let globalIndex = -1;

  return (
    <div className="notifications-page">
      <div className="notifications-card">
        {/* ================= HEADER ================= */}
        <div className="np-header">
          <div className="np-title">
            <Bell size={18} />
            <span>Notifications</span>
          </div>

          <div className="np-header-actions">
            {unreadCount > 0 && (
              <>
                <span className="np-unread-pill">
                  {unreadCount} unread
                </span>

                <button
                  className="np-mark-all"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                  Mark all
                </button>
              </>
            )}
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="np-filters segmented">
          {["all", "unread", "read"].map((f) => (
            <button
              key={f}
              className={`np-filter-btn ${
                filter === f ? "active" : ""
              }`}
              onClick={() => {
                setFilter(f);
                setActiveIndex(0);
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ================= LIST ================= */}
        <div className="np-page-list">
          {!filtered.length && (
            <div className="np-empty">
              No notifications available
            </div>
          )}

          {Object.entries(groups).map(
            ([label, items]) =>
              items.length > 0 && (
                <div key={label} className="np-group">
                  <div className="np-group-label">{label}</div>

                  {items.map((n) => {
                    globalIndex += 1;
                    const isActive = globalIndex === activeIndex;

                    return (
                      <div
                        key={n.id}
                        ref={(el) =>
                          (itemRefs.current[globalIndex] = el)
                        }
                        className={`np-item ${
                          !n.is_read ? "unread" : ""
                        } ${isActive ? "active" : ""}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="np-icon">
                          {typeIconMap[n.type] || (
                            <Bell size={18} />
                          )}
                        </div>

                        <div className="np-content">
                          <div className="np-text">
                            {n.title}
                          </div>
                          <div className="np-time">
                            {dayjs(n.created_at).fromNow()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

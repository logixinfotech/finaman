import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const NotificationContext = createContext(null);

/* ================= MOCK DATA ================= */
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Menu Master Updated",
    message: "Menu Master record has been modified",
    type: "info",
    is_read: false,
    created_at: new Date().toISOString(),
    link: "MENU_MASTER",
  },
  {
    id: "2",
    title: "New User Created",
    message: "A new user has been added successfully",
    type: "success",
    is_read: false,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    link: "USER_MASTER",
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [muted, setMuted] = useState(
    () => localStorage.getItem("vms_mute") === "true"
  );

  const audioRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  /* ================= FETCH ================= */
  const fetchNotifications = () => {
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
    }, 300);
  };

  /* ================= ACTIONS ================= */
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const clearAll = () => setNotifications([]);

  const toggleMute = () => {
    setMuted(prev => {
      localStorage.setItem("vms_mute", String(!prev));
      return !prev;
    });
  };

useEffect(() => {
  fetchNotifications();
}, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        muted,
        toggleMute,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {/* 🔊 Sound from PUBLIC folder */}
      <audio
        ref={audioRef}
        src="/notifysound.mp3"
        preload="auto"
      />
      {children}
    </NotificationContext.Provider>
  );
};

/* ================= HOOK ================= */
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
};

 
import React, {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from "react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../utils/api";

export const CATEGORIES = {
  payroll:    { label: "Payroll",    color: "#185FA5", bg: "#E6F1FB", icon: "💰" },
  accounts:   { label: "Accounts",  color: "#0F6E56", bg: "#E1F5EE", icon: "📊" },
  sales:      { label: "Sales",     color: "#993C1D", bg: "#FAECE7", icon: "📈" },
  production: { label: "Production",color: "#854F0B", bg: "#FAEEDA", icon: "🏭" },
  quality:    { label: "Quality",   color: "#3B6D11", bg: "#EAF3DE", icon: "✅" },
  logistics:  { label: "Logistics", color: "#534AB7", bg: "#EEEDFE", icon: "🚚" },
  planning:   { label: "Planning",  color: "#993556", bg: "#FBEAF0", icon: "📅" },
  masters:    { label: "Masters",   color: "#5F5E5A", bg: "#F1EFE8", icon: "⚙️"  },
  system:     { label: "System",    color: "#5F5E5A", bg: "#F1EFE8", icon: "🔧" },
};

export const PRIORITIES = {
  low:      { label: "Low",      color: "#888780" },
  medium:   { label: "Medium",   color: "#BA7517" },
  high:     { label: "High",     color: "#D85A30" },
  critical: { label: "Critical", color: "#A32D2D" },
};

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications,    setNotifications]    = useState([]);
  const [toastQueue,       setToastQueue]       = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [menusFromBackend, setMenusFromBackendRaw] = useState([]);
  const [muted,    setMuted]  = useState(() => localStorage.getItem("vms_mute")  === "true");
  const [soundEnabled, setSound] = useState(() => localStorage.getItem("vms_sound") !== "false");

  const audioRef  = useRef(null);
  const pollRef   = useRef(null);
  const isMounted = useRef(true);

  const unreadCount = notifications.filter(n => !n.is_read).length; 
  const setMenusFromBackend = useCallback((data) => {
    setMenusFromBackendRaw(data);
  }, []); 
  const fetchNotifications = useCallback(async () => {
    if (!sessionStorage.getItem("token")) return;
    try {
      setLoading(true);
      const res  = await getNotifications({ pageSize: 100 });
      if (!isMounted.current) return;
      const body = res?.data;
      if (Array.isArray(body))  setNotifications(body);
      else if (body?.success)   setNotifications(body.data || []);
    } catch (err) {
      if (err?.response?.status !== 401)
        console.error("[Notifications] Fetch error:", err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30_000);
    return () => { isMounted.current = false; clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  // ── Actions ────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try { await markNotificationRead(id); }
    catch { setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n)); }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try { await markAllNotificationsRead(); }
    catch { fetchNotifications(); }
  }, [fetchNotifications]);

  const dismissById = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await deleteNotification(id); }
    catch { fetchNotifications(); }
  }, [fetchNotifications]);

  const clearAll = useCallback(async () => {
    const backup = [...notifications];
    setNotifications([]);
    try { await deleteAllNotifications(); }
    catch { setNotifications(backup); }
  }, [notifications]);

  const addNotification = useCallback((notif) => {
    const n = {
      id: `local-${Date.now()}`, is_read: false,
      created_at: new Date().toISOString(),
      priority: "medium", category: "system", type: "info",
      ...notif,
    };
    setNotifications(prev => [n, ...prev]);
    if (!muted) {
      setToastQueue(q => [...q, n]);
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [muted, soundEnabled]);

  const consumeToast = useCallback(() => setToastQueue(q => q.slice(1)), []);
  const toggleMute   = useCallback(() => setMuted(p  => { localStorage.setItem("vms_mute",  String(!p)); return !p; }), []);
  const toggleSound  = useCallback(() => setSound(p  => { localStorage.setItem("vms_sound", String(!p)); return !p; }), []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, toastQueue, loading,
      muted, soundEnabled,
      menusFromBackend,
      setMenusFromBackend,   // ← stable reference, safe in useEffect deps
      fetchNotifications, markAsRead, markAllAsRead,
      dismissById, clearAll, addNotification,
      consumeToast, toggleMute, toggleSound,
    }}>
      <audio ref={audioRef} src="/notifysound.mp3" preload="auto" />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};

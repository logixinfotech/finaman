/**
 * NotificationContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * VMS Enterprise ERP — Global Notification System
 *
 * Drop-in replacement for your existing NotificationContext.
 * Uses sessionStorage("token") just like the rest of your app.
 * action_url maps to appl_name in your PageRegistry / tab system.
 * ─────────────────────────────────────────────────────────────────
 */

import React, {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from "react";

// ─── Category config — matches your ERP modules ───────────────────
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

// ─── Mock data — swap out once your backend endpoint is ready ─────
const MOCK_NOTIFICATIONS = [
  {
    id: "1", title: "April Payroll Processed",
    message: "Salary disbursement for 248 employees completed successfully.",
    type: "success", category: "payroll", priority: "high", is_read: false,
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    // action_url = appl_name value from your PageRegistry / masmnu table
    action_url: "PAYROLL_RUNS",
    metadata: { employees: 248, amount: "₹48,24,000" },
  },
  {
    id: "2", title: "Invoice #INV-2840 Overdue",
    message: "Payment of ₹1,24,500 from Sharma Industries is 7 days overdue.",
    type: "error", category: "accounts", priority: "critical", is_read: false,
    created_at: new Date(Date.now() - 18 * 60_000).toISOString(),
    action_url: "ACCOUNTS_INVOICE",
    metadata: { invoice: "INV-2840", amount: "₹1,24,500" },
  },
  {
    id: "3", title: "Production Target Achieved",
    message: "Unit B reached 98.4% efficiency — monthly record.",
    type: "success", category: "production", priority: "medium", is_read: false,
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    action_url: "PRODUCTION_REPORT",
    metadata: { unit: "B", efficiency: "98.4%" },
  },
  {
    id: "4", title: "QC Batch #B-2291 Rejected",
    message: "Batch failed tensile strength test. Routed for rework.",
    type: "warning", category: "quality", priority: "high", is_read: true,
    created_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    action_url: "QUALITY_BATCH", metadata: { batch: "B-2291" },
  },
  {
    id: "5", title: "Shipment SHP-998 Delayed",
    message: "Mumbai warehouse delay — delivery pushed to 12 May.",
    type: "warning", category: "logistics", priority: "high", is_read: true,
    created_at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    action_url: "LOGISTICS_SHIPMENT", metadata: { shipment: "SHP-998" },
  },
  {
    id: "6", title: "GST Return Due in 3 Days",
    message: "Monthly GST return due on 20th. Verify before submission.",
    type: "warning", category: "accounts", priority: "critical", is_read: true,
    created_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    action_url: "ACCOUNTS_GST", metadata: { dueDate: "20th May" },
  },
];

const NotificationContext = createContext(null);

export const NotificationProvider = ({
  children,
  wsUrl  = null,   // "wss://your-api.com/ws/notifications"
  apiUrl = null,   // "https://your-api.com/api"
}) => {
  const [notifications, setNotifications] = useState([]);
  const [toastQueue,    setToastQueue]    = useState([]);
  const [connected,     setConnected]     = useState(false);
  const [muted,         setMuted]         = useState(
    () => localStorage.getItem("vms_mute") === "true"
  );
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("vms_sound") !== "false"
  );

  const wsRef             = useRef(null);
  const reconnectRef      = useRef(null);
  const audioRef          = useRef(null);
  const reconnectAttempts = useRef(0);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (apiUrl) {
      try {
        const token = sessionStorage.getItem("token");
        const res   = await fetch(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotifications(data);
        return;
      } catch (err) {
        console.warn("[Notif] API failed, using mock data");
      }
    }
    setTimeout(() => setNotifications(MOCK_NOTIFICATIONS), 200);
  }, [apiUrl]);

  // ── WebSocket ─────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!wsUrl) return;
    const token = sessionStorage.getItem("token");
    const ws    = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "notification") {
          const n = msg.payload;
          setNotifications((prev) => [n, ...prev]);
          if (!muted) setToastQueue((q) => [...q, n]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }
        if (msg.type === "refresh") setNotifications(msg.payload);
      } catch (e) { /* ignore */ }
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
      reconnectAttempts.current += 1;
      reconnectRef.current = setTimeout(connectWS, delay);
    };
    ws.onerror = () => ws.close();
  }, [wsUrl, muted, soundEnabled]);

  useEffect(() => {
    fetchNotifications();
    connectWS();
    return () => { wsRef.current?.close(); clearTimeout(reconnectRef.current); };
  }, [fetchNotifications, connectWS]);

  // Polling fallback when no WebSocket
  useEffect(() => {
    if (wsUrl || !apiUrl) return;
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [wsUrl, apiUrl, fetchNotifications]);

  // ── Actions ───────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    if (apiUrl) {
      const token = sessionStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [apiUrl]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (apiUrl) {
      const token = sessionStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [apiUrl]);

  const dismissById = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (apiUrl) {
      const token = sessionStorage.getItem("token");
      await fetch(`${apiUrl}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [apiUrl]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (apiUrl) {
      const token = sessionStorage.getItem("token");
      await fetch(`${apiUrl}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [apiUrl]);

  // Call from any ERP module: addNotification({ title, message, category, type, action_url })
  const addNotification = useCallback((notif) => {
    const n = {
      id: String(Date.now()),
      is_read: false,
      created_at: new Date().toISOString(),
      priority: "medium",
      category: "system",
      type: "info",
      ...notif,
    };
    setNotifications((prev) => [n, ...prev]);
    if (!muted) setToastQueue((q) => [...q, n]);
  }, [muted]);

  const consumeToast = useCallback(() => setToastQueue((q) => q.slice(1)), []);
  const toggleMute   = useCallback(() => {
    setMuted((prev) => { localStorage.setItem("vms_mute", String(!prev)); return !prev; });
  }, []);
  const toggleSound  = useCallback(() => {
    setSoundEnabled((prev) => { localStorage.setItem("vms_sound", String(!prev)); return !prev; });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, toastQueue, connected,
      muted, soundEnabled,
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

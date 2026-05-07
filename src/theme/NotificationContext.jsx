/**
 * NotificationContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Enterprise ERP – Global Notification System
 *
 * Features:
 *  • Real-time WebSocket support (auto-reconnect with exponential back-off)
 *  • Polling fallback when WS is unavailable
 *  • Category-aware (payroll, accounts, sales, production, quality, logistics…)
 *  • Priority levels: low | medium | high | critical
 *  • Per-user mute + sound toggle (persisted in localStorage)
 *  • markAsRead / markAllAsRead / dismissById / clearAll
 *  • Incoming-toast queue (consumed by NotificationToast)
 *  • Easy to drop-in replace mock data with real API calls
 * ─────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Constants ────────────────────────────────────────────────────
export const CATEGORIES = {
  payroll:    { label: "Payroll",    color: "#185FA5", bg: "#E6F1FB", darkBg: "#0C3260", icon: "💰" },
  accounts:   { label: "Accounts",  color: "#0F6E56", bg: "#E1F5EE", darkBg: "#064033", icon: "📊" },
  sales:      { label: "Sales",     color: "#993C1D", bg: "#FAECE7", darkBg: "#5A1E0A", icon: "📈" },
  production: { label: "Production",color: "#854F0B", bg: "#FAEEDA", darkBg: "#4A2C04", icon: "🏭" },
  quality:    { label: "Quality",   color: "#3B6D11", bg: "#EAF3DE", darkBg: "#1E3D08", icon: "✅" },
  logistics:  { label: "Logistics", color: "#534AB7", bg: "#EEEDFE", darkBg: "#2A266B", icon: "🚚" },
  planning:   { label: "Planning",  color: "#993556", bg: "#FBEAF0", darkBg: "#5A1A30", icon: "📅" },
  masters:    { label: "Masters",   color: "#5F5E5A", bg: "#F1EFE8", darkBg: "#2C2C2A", icon: "⚙️"  },
  system:     { label: "System",    color: "#5F5E5A", bg: "#F1EFE8", darkBg: "#2C2C2A", icon: "🔧" },
};

export const PRIORITIES = {
  low:      { label: "Low",      color: "#888780" },
  medium:   { label: "Medium",   color: "#BA7517" },
  high:     { label: "High",     color: "#D85A30" },
  critical: { label: "Critical", color: "#A32D2D" },
};

// ─── Mock Data (replace with real API) ───────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "April Payroll Processed",
    message: "Salary disbursement for 248 employees completed successfully.",
    type: "success",
    category: "payroll",
    priority: "high",
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    action_url: "/payroll/runs",
    metadata: { employeeCount: 248, amount: "₹48,24,000" },
  },
  {
    id: "2",
    title: "Invoice #INV-2840 Overdue",
    message: "Payment of ₹1,24,500 from Sharma Industries is 7 days overdue.",
    type: "error",
    category: "accounts",
    priority: "critical",
    is_read: false,
    created_at: new Date(Date.now() - 18 * 60_000).toISOString(),
    action_url: "/accounts/invoices/2840",
    metadata: { invoiceNo: "INV-2840", amount: "₹1,24,500", days: 7 },
  },
  {
    id: "3",
    title: "Production Target Achieved",
    message: "Unit B reached 98.4% efficiency — monthly record.",
    type: "success",
    category: "production",
    priority: "medium",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    action_url: "/production/reports",
    metadata: { unit: "B", efficiency: "98.4%" },
  },
  {
    id: "4",
    title: "QC Batch #B-2291 Rejected",
    message: "Batch failed tensile strength test. Routed for rework.",
    type: "warning",
    category: "quality",
    priority: "high",
    is_read: true,
    created_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    action_url: "/quality/batches/B-2291",
    metadata: { batchNo: "B-2291", reason: "Tensile strength" },
  },
  {
    id: "5",
    title: "Shipment SHP-998 Delayed",
    message: "Mumbai warehouse delay — expected delivery pushed to 12 May.",
    type: "warning",
    category: "logistics",
    priority: "high",
    is_read: true,
    created_at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    action_url: "/logistics/shipments/SHP-998",
    metadata: { shipmentNo: "SHP-998", newDate: "12 May" },
  },
  {
    id: "6",
    title: "New Purchase Order Received",
    message: "PO #PO-7821 received from Tata Motors — ₹8,40,000.",
    type: "info",
    category: "sales",
    priority: "medium",
    is_read: true,
    created_at: new Date(Date.now() - 28 * 3_600_000).toISOString(),
    action_url: "/sales/orders/PO-7821",
    metadata: { poNo: "PO-7821", customer: "Tata Motors", amount: "₹8,40,000" },
  },
  {
    id: "7",
    title: "GST Return Due in 3 Days",
    message: "Monthly GST return due on 20th. Verify data before submission.",
    type: "warning",
    category: "accounts",
    priority: "critical",
    is_read: true,
    created_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    action_url: "/accounts/gst",
    metadata: { dueDate: "20th May" },
  },
];

// ─── Context ──────────────────────────────────────────────────────
const NotificationContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────
export const NotificationProvider = ({ children, wsUrl = null, apiUrl = null }) => {
  const [notifications, setNotifications] = useState([]);
  const [toastQueue, setToastQueue]       = useState([]);   // consumed by NotificationToast
  const [connected, setConnected]         = useState(false); // WS connection status
  const [muted, setMuted] = useState(
    () => localStorage.getItem("erp_mute") === "true"
  );
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("erp_sound") !== "false"
  );

  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const audioRef     = useRef(null);
  const reconnectAttempts = useRef(0);

  // ── Derived ──────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch (REST fallback / initial load) ─────────────────────
  const fetchNotifications = useCallback(async () => {
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/notifications`);
        const data = await res.json();
        setNotifications(data);
        return;
      } catch (err) {
        console.warn("[Notifications] API fetch failed, using mock data", err);
      }
    }
    // Mock fallback
    setTimeout(() => setNotifications(MOCK_NOTIFICATIONS), 200);
  }, [apiUrl]);

  // ── WebSocket ────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
      console.log("[Notifications] WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);

        // Server can send a single notification or a full refresh
        if (incoming.type === "notification") {
          const n = incoming.payload;
          setNotifications((prev) => [n, ...prev]);
          // Add to toast queue if not muted
          if (!muted) setToastQueue((q) => [...q, n]);
          // Play sound
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }

        if (incoming.type === "refresh") {
          setNotifications(incoming.payload);
        }

        if (incoming.type === "mark_read") {
          setNotifications((prev) =>
            prev.map((n) =>
              incoming.payload.ids.includes(n.id) ? { ...n, is_read: true } : n
            )
          );
        }
      } catch (err) {
        console.warn("[Notifications] WS message parse error", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Exponential back-off: 1s, 2s, 4s, 8s … max 30s
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
      reconnectAttempts.current += 1;
      console.log(`[Notifications] WS closed. Reconnecting in ${delay}ms…`);
      reconnectRef.current = setTimeout(connectWS, delay);
    };

    ws.onerror = (err) => {
      console.warn("[Notifications] WS error", err);
      ws.close();
    };
  }, [wsUrl, muted, soundEnabled]);

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    connectWS();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectRef.current);
    };
  }, [fetchNotifications, connectWS]);

  // ── Polling fallback when no WS ──────────────────────────────
  useEffect(() => {
    if (wsUrl || !apiUrl) return; // WS handles it, or no API
    const interval = setInterval(fetchNotifications, 30_000); // every 30s
    return () => clearInterval(interval);
  }, [wsUrl, apiUrl, fetchNotifications]);

  // ── Actions ──────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    if (apiUrl) {
      await fetch(`${apiUrl}/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    }
    // Also tell WS server if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "mark_read", ids: [id] }));
    }
  }, [apiUrl]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (apiUrl) {
      await fetch(`${apiUrl}/notifications/read-all`, { method: "PATCH" }).catch(() => {});
    }
  }, [apiUrl]);

  const dismissById = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (apiUrl) {
      await fetch(`${apiUrl}/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    }
  }, [apiUrl]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (apiUrl) {
      await fetch(`${apiUrl}/notifications`, { method: "DELETE" }).catch(() => {});
    }
  }, [apiUrl]);

  const addNotification = useCallback((notif) => {
    const n = { id: Date.now().toString(), is_read: false, created_at: new Date().toISOString(), ...notif };
    setNotifications((prev) => [n, ...prev]);
    if (!muted) setToastQueue((q) => [...q, n]);
  }, [muted]);

  const consumeToast = useCallback(() => {
    setToastQueue((q) => q.slice(1));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      localStorage.setItem("erp_mute", String(!prev));
      return !prev;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      localStorage.setItem("erp_sound", String(!prev));
      return !prev;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toastQueue,
        connected,
        muted,
        soundEnabled,
        // actions
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissById,
        clearAll,
        addNotification,
        consumeToast,
        toggleMute,
        toggleSound,
      }}
    >
      <audio ref={audioRef} src="/notifysound.mp3" preload="auto" />
      {children}
    </NotificationContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};

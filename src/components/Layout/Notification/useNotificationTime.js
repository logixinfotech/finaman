import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Bell, Info, AlertTriangle, XCircle, CircleCheck } from "lucide-react";

dayjs.extend(relativeTime);
export function useRelativeTime(isoString) {
  const [label, setLabel] = useState(() => dayjs(isoString).fromNow());

  useEffect(() => {
    const id = setInterval(() => setLabel(dayjs(isoString).fromNow()), 60_000);
    return () => clearInterval(id);
  }, [isoString]);

  return label;
}

 
export function groupByDay(notifications) {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today     = dayjs().startOf("day");
  const yesterday = today.subtract(1, "day");

  notifications.forEach((n) => {
    const d = dayjs(n.created_at);
    if (d.isSame(today, "day"))          groups.Today.push(n);
    else if (d.isSame(yesterday, "day")) groups.Yesterday.push(n);
    else                                  groups.Earlier.push(n);
  });

  return groups;
}
export const NOTIFICATION_TYPE_CONFIG = {
  info:    { Icon: Info,          bg: "bg-blue-100",   text: "text-blue-500",   border: "#3b82f6" },
  warning: { Icon: AlertTriangle, bg: "bg-yellow-100", text: "text-yellow-500", border: "#f59e0b" },
  error:   { Icon: XCircle,       bg: "bg-red-100",    text: "text-red-500",    border: "#ef4444" },
  success: { Icon: CircleCheck,   bg: "bg-green-100",  text: "text-green-500",  border: "#22c55e" },
  default: { Icon: Bell,          bg: "bg-gray-100",   text: "text-gray-500",   border: "#9ca3af" },
};

export function getNotificationTypeConfig(type) {
  return NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.default;
}
export function resolveNotificationMenu(action_url, menusFromBackend) {
  if (!action_url || !menusFromBackend?.length) return null;
  return (
    menusFromBackend.find((m) => m.appl_name?.trim() === action_url?.trim()) ||
    null
  );
}
export function useNotificationFilters(notifications, { debounceMs = 200 } = {}) {
  const [readFilter, setReadFilter]   = useState("all");
  const [catFilter, setCatFilter]     = useState("all");
  const [searchText, setSearchText]   = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchText), debounceMs);
    return () => clearTimeout(t);
  }, [searchText, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSearchQuery("");
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notifications.filter((n) => {
      const r = readFilter === "all" ? true : readFilter === "unread" ? !n.is_read : n.is_read;
      const c = catFilter === "all" ? true : n.category === catFilter;
      const s = !searchQuery ||
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q);
      return r && c && s;
    });
  }, [notifications, readFilter, catFilter, searchQuery]);

  const groups   = useMemo(() => groupByDay(filtered), [filtered]);
  const flatList = useMemo(() => Object.values(groups).flat(), [groups]);

  return {
    readFilter, setReadFilter,
    catFilter, setCatFilter,
    searchText, setSearchText,
    searchQuery, clearSearch,
    filtered, groups, flatList,
  };
}
 
export function useUndoableAction(action, { delayMs = 5000 } = {}) {
  const [pending, setPending] = useState(null); // { key, label, timeoutId, actionArg }

  const run = useCallback((key, label, actionArg) => {
    setPending((prev) => {
      if (prev) {
        clearTimeout(prev.timeoutId);
        action(prev.actionArg);
      }
      const timeoutId = setTimeout(() => {
        action(actionArg);
        setPending((p) => (p && p.key === key ? null : p));
      }, delayMs);
      return { key, label, timeoutId, actionArg };
    });
  }, [action, delayMs]);

  const undo = useCallback(() => {
    setPending((prev) => {
      if (prev) clearTimeout(prev.timeoutId);
      return null;
    });
  }, []);

  useEffect(() => () => { if (pending) clearTimeout(pending.timeoutId); }, [pending]);

  return { pending, run, undo };
}
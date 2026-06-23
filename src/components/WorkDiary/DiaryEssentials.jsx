// DiaryEssentials.jsx — Screen components
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyTasks, fetchAssignedByMeTasks, updateTaskLineStatus, deleteTaskLine } from "../../utils/api";
import { alertError } from "../Reusable/alert";
import {
  F, FD, FM, C, STAT_BADGE, PRIO_CFG,
  Avtar, PDot, ProgressRing, useToast,
  TaskCard, TaskRow, DetailPanel, TaskModal, QuickAddBar,
  todayStr, fmtHrs, fmtDate, newTask, getTimeAlert,
  btnPrimary, btnSecondary, useIsMobile,
} from "./WorkDiaryForm";
import { generateId } from "../../utils/helpers";
import {
  ClipboardList, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  LayoutGrid, List, Search, X, RotateCcw, Plus,
  Circle, Flag, BookOpen, Layers, ChevronRight, UserCheck, CornerDownLeft,
} from "lucide-react";

// ─── getCurrentUser ───────────────────────────────────────────────
export const getCurrentUser = () => {
  try {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
};
// ─── SectionGroup ─────────────────────────────────────────────────
const SectionGroup = ({ label, count, accentColor, badgeBg, badgeColor, lineBg, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div> 
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          paddingBottom: 10, cursor: "pointer", userSelect: "none",
        }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "1.6px",
          textTransform: "uppercase", color: accentColor, fontFamily: F,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: FM, fontSize: 10, fontWeight: 700,
          padding: "1px 8px", borderRadius: 999,
          background: badgeBg, color: badgeColor,
        }}>
          {count}
        </span>
        <div style={{ flex: 1, height: 1, background: lineBg }} />
        <ChevronRight
          size={13}
          color={accentColor}
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s", flexShrink: 0 }}
        />
      </div>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: .2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// ─── SidebarContent ───────────────────────────────────────────────
export const SidebarContent = ({
  NAV, activeNav, setActiveNav, setSidebarOpen,
  categoryList, activeCategory, setActiveCategory,
}) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.surface }}>

    {/* Brand */}
    <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: C.blueLight, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${C.blueBorder}`
        }}>
          <BookOpen size={16} color={C.blue} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: "-.2px", lineHeight: 1 }}>Work Diary</div>
          <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>FINAMAN ERP</div>
        </div>
      </div>
    </div>

    {/* Nav */}
    <div style={{ padding: "10px 8px 6px", flexShrink: 0 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase",
        color: C.t4, padding: "0 6px 6px"
      }}>Menu</div>
      {NAV.map(n => {
        const active = activeNav === n.k;
        return (
          <button key={n.k}
            onClick={() => { setActiveNav(n.k); setSidebarOpen?.(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px",
              borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 500,
              transition: "all .14s", marginBottom: 1, fontFamily: F, border: "none", textAlign: "left",
              background: active ? C.blueLight : "transparent",
              color: active ? C.blue : C.t3, position: "relative",
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = C.t1; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t3; } }}>
            {active && <div style={{
              position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3,
              background: C.blue, borderRadius: "0 3px 3px 0"
            }} />}
            <n.Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.l}</span>
          </button>
        );
      })}
    </div>

    <div style={{ margin: "4px 12px", borderTop: `1px solid ${C.border}` }} />

    {/* Categories */}
    <div style={{ padding: "6px 8px 4px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px 6px" }}>
        <Layers size={11} color={C.t4} />
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "1.8px",
          textTransform: "uppercase", color: C.t4
        }}>Categories</span>
      </div>
    </div>

    <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px", minHeight: 0 }}>
      {/* "All" option */}
      {(() => {
        const isAll = !activeCategory;
        return (
          <button onClick={() => setActiveCategory(null)}
            style={{
              width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8,
              border: "1.5px solid", cursor: "pointer", fontFamily: F, marginBottom: 2,
              background: isAll ? C.blueLight : "transparent",
              borderColor: isAll ? C.blueBorder : "transparent",
              color: isAll ? C.blue : C.t3,
            }}
            onMouseEnter={e => { if (!isAll) e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={e => { if (!isAll) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center",
                justifyContent: "center", background: isAll ? C.blue : "#e2e8f0",
                fontSize: 9, fontWeight: 800, color: isAll ? "#fff" : C.t3, flexShrink: 0
              }}>
                ALL
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isAll ? C.blue : C.t1 }}>All Categories</span>
            </div>
          </button>
        );
      })()}

      {categoryList.map(({ category, task_count }) => {
        const isActive = activeCategory === category;
        return (
          <button key={category} onClick={() => setActiveCategory(isActive ? null : category)}
            style={{
              width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 8,
              border: "1.5px solid", cursor: "pointer", fontFamily: F, marginBottom: 2,
              background: isActive ? C.blueLight : "transparent",
              borderColor: isActive ? C.blueBorder : "transparent",
              color: isActive ? C.blue : C.t3,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5, background: isActive ? C.blue : "#e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 800, color: isActive ? "#fff" : C.t3, flexShrink: 0
              }}>
                {category.slice(0, 2).toUpperCase()}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, flex: 1, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: isActive ? C.blue : C.t1
              }}>{category}</span>
              <span style={{
                fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 6px",
                borderRadius: 999, background: isActive ? C.blue : "#e2e8f0",
                color: isActive ? "#fff" : C.t4, flexShrink: 0
              }}>{task_count}</span>
            </div>
          </button>
        );
      })}

      {categoryList.length === 0 && (
        <div style={{ fontSize: 12, color: C.t4, padding: "8px 6px", fontStyle: "italic" }}>
          No categories yet
        </div>
      )}
    </div>
  </div>
);

// ─── MyTasksScreen ────────────────────────────────────────────────
export const MyTasksScreen = ({
  currentUser, employees = [],
  onSaveAndSubmit, categoryList = [], activeCategory, setActiveCategory,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState("to_me");
  const [myTasks, setMyTasks] = useState([]);
  const [byMeTasks, setByMeTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [detailKey, setDetailKey] = useState(null);
  const [modal, setModal] = useState(null);
 
  const [byMeLoaded, setByMeLoaded] = useState(false); 
  const isMobile = useIsMobile();
  const { show: toast, ToastUI } = useToast();
  const tod = todayStr();
 
  const loadMyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const rMe = await fetchMyTasks();
      const normalize = arr =>
        (Array.isArray(arr) ? arr : arr?.data || []).map(t => ({ ...t, _key: t._key || String(t.line_id) }));
      setMyTasks(normalize(rMe));
    } catch { alertError("Error", "Failed to load tasks"); }
    finally { setLoading(false); }
  }, []);

  const loadByMeTasks = useCallback(async () => {
    try {
      const rBy = await fetchAssignedByMeTasks();
      const normalize = arr =>
        (Array.isArray(arr) ? arr : arr?.data || []).map(t => ({ ...t, _key: t._key || String(t.line_id) }));
      setByMeTasks(normalize(rBy));
    } catch { /* non-fatal — by_me tab can retry on next manual refresh */ }
  }, []);
 
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.allSettled([loadMyTasks(), loadByMeTasks()]);
      setByMeLoaded(true);
    } catch { alertError("Error", "Failed to load tasks"); }
    finally { setLoading(false); }
  }, [loadMyTasks, loadByMeTasks]);
 
  useEffect(() => {
    loadMyTasks();
    setByMeLoaded(false);
  }, []);
 
  useEffect(() => {
    if (activeTab === "by_me" && !byMeLoaded) {
      setByMeLoaded(true);
      loadByMeTasks();
    }
  }, [activeTab, byMeLoaded, loadByMeTasks]);

  useEffect(() => { setFilter("all"); setSearch(""); setDetailKey(null); }, [activeTab]);

  const tabTasks = activeTab === "to_me" ? myTasks : byMeTasks;

  // Stats
  const inProgress = tabTasks.filter(t => t.status === "In Progress").length;
  const completed = tabTasks.filter(t => t.status === "Completed" || t.status === "Resolved" || t.status === "Closed").length;
  const overdue = tabTasks.filter(t => t.due_date && t.due_date < tod && t.status !== "Completed" && t.status !== "Cancelled").length;
  const todayDue = tabTasks.filter(t => t.due_date === tod && t.status !== "Completed").length;

  // Assignee breakdown (by_me)
  const assigneeBreakdown = useMemo(() => {
    if (activeTab !== "by_me") return [];
    const map = {};
    byMeTasks.forEach(t => {
      const name = t.assigned_to_name || "Unknown";
      if (!map[name]) map[name] = { name, total: 0, done: 0, inprog: 0, overdue: 0 };
      map[name].total++;
      if (t.status === "Completed" || t.status === "Resolved" || t.status === "Closed") map[name].done++;
      if (t.status === "In Progress") map[name].inprog++;
      if (t.due_date && t.due_date < tod && t.status !== "Completed" && t.status !== "Cancelled") map[name].overdue++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [byMeTasks, activeTab, tod]);

  // Filtered list
  const filtered = useMemo(() => {
    let l = [...tabTasks];
    if (activeCategory) l = l.filter(t => t.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      l = l.filter(t =>
        (t.work_plan || "").toLowerCase().includes(q) ||
        (t.target || "").toLowerCase().includes(q) ||
        (t.assigned_by || "").toLowerCase().includes(q) ||
        (t.assigned_to_name || "").toLowerCase().includes(q)
      );
    }
    switch (filter) {
      case "own": return l.filter(t => !t.assigned_by || t.assign_type === "self");   // ← new
      case "delegated": return l.filter(t => t.assigned_by && t.assign_type === "assign");  // ← new
      case "inprogress": return l.filter(t => t.status === "In Progress");
      case "completed": return l.filter(t => t.status === "Completed" || t.status === "Resolved" || t.status === "Closed");
      case "overdue": return l.filter(t => t.due_date && t.due_date < tod && t.status !== "Completed" && t.status !== "Cancelled");
      case "today": return l.filter(t => t.due_date === tod && t.status !== "Completed");
      case "high": return l.filter(t => t.priority === "High");
      case "pending": return l.filter(t => t.status === "Pending" || t.status === "Open");
      default: return l;
    }
  }, [tabTasks, filter, search, tod, activeCategory]);

  const detailTask = tabTasks.find(t => t._key === detailKey || String(t.line_id) === String(detailKey)) || null;
  const detailOpen = !!detailTask;

  // Handlers
  const toggle = useCallback(async key => {
    const allT = [...myTasks, ...byMeTasks];
    const task = allT.find(t => t._key === key || String(t.line_id) === String(key));
    if (!task) return;
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    const upd = p => p.map(t => (t._key === key || String(t.line_id) === String(key))
      ? { ...t, status: newStatus } : t);
    setMyTasks(upd); setByMeTasks(upd);
    if (task.line_id) {
      try { await updateTaskLineStatus(task.line_id, newStatus); }
      catch {
        const revert = p => p.map(t => (t._key === key || String(t.line_id) === String(key))
          ? { ...t, status: task.status } : t);
        setMyTasks(revert); setByMeTasks(revert);
        toast("Could not update status", "error");
      }
    }
  }, [myTasks, byMeTasks, toast]);

  useEffect(() => {
    const handler = e => {
      // Alt+N → open new task modal
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        setModal(newTask(currentUser));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [currentUser]);

  const handleStatusChange = useCallback(async (key, newStatus) => {
    const upd = p => p.map(t => (t._key === key || String(t.line_id) === String(key)) ? { ...t, status: newStatus } : t);
    setMyTasks(upd); setByMeTasks(upd);
    const allT = [...myTasks, ...byMeTasks];
    const task = allT.find(t => t._key === key || String(t.line_id) === String(key));
    if (task?.line_id) {
      try { await updateTaskLineStatus(task.line_id, newStatus); }
      catch {
        const revert = p => p.map(t => (t._key === key || String(t.line_id) === String(key)) ? { ...t, status: task.status } : t);
        setMyTasks(revert); setByMeTasks(revert);
        toast("Status update failed", "error");
      }
    }
  }, [myTasks, byMeTasks, toast]); 
  const delTask = useCallback(async key => {
    const allT = [...myTasks, ...byMeTasks];
    const task = allT.find(t => t._key === key || String(t.line_id) === String(key));

    // ── Block deletion if assigned by someone else ──
    if (task?.assigned_by && task.assigned_by !== currentUser?.user_id) {
      toast(`Cannot delete — assigned by ${task.assigned_by}`, "error");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${task?.work_plan || "this task"}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    // Optimistic update
    setMyTasks(p => p.filter(t => t._key !== key && String(t.line_id) !== String(key)));
    setByMeTasks(p => p.filter(t => t._key !== key && String(t.line_id) !== String(key)));
    setDetailKey(k => k === key ? null : k);

    if (task?.line_id) {
      try {
        await deleteTaskLine(task.line_id);
        toast("Task deleted");
      } catch {
        setMyTasks(p => [...p, task]);
        toast("Delete failed", "error");
      }
    } else {
      toast("Task deleted");
    }
  }, [myTasks, byMeTasks, toast, currentUser]);

  // ── perf: stable callback so React.memo on TaskCard / TaskRow actually works ──
  const openDetail = useCallback(k => setDetailKey(k), []);
  const noopDelete = useCallback(() => {}, []);

  const saveModal = useCallback(f => {
    const subtaskMap = {};
    if (f._pendingSubtasks?.length) subtaskMap[f._key] = f._pendingSubtasks;
    const matchFn = t => (f._key && t._key === f._key) || (f.line_id && String(t.line_id) === String(f.line_id));

    if (f.assign_type === "assign") {
      setByMeTasks(p => { const ex = p.find(matchFn); return ex ? p.map(t => matchFn(t) ? { ...f, _key: t._key } : t) : [f, ...p]; });
    } else {
      setMyTasks(p => { const ex = p.find(matchFn); return ex ? p.map(t => matchFn(t) ? { ...f, _key: t._key } : t) : [f, ...p]; });
    }

    // ── perf: removed unused `currentTasks` variable — allCurrent below already does this work ──
    const allCurrent = [...myTasks, ...byMeTasks];
    const ex = allCurrent.find(matchFn);
    const toSave = ex
      ? allCurrent.map(t => matchFn(t) ? { ...f, _key: t._key } : t)
      : [f, ...allCurrent];
    onSaveAndSubmit?.(toSave, subtaskMap);
    setModal(null);
    setTimeout(() => loadAll(), 1000);
    toast(f.work_plan ? "Task saved!" : "Task updated!");
  }, [myTasks, byMeTasks, setMyTasks, setByMeTasks, onSaveAndSubmit, loadAll, toast]);

 
 
  const categoryOptions = useMemo(() => categoryList.map(c => c.category), [categoryList]);

  const STATS = useMemo(() => [
    { l: "Total", v: tabTasks.length, pct: 100, color: C.blue, trackColor: C.blueLight, iconBg: C.blueLight, iconColor: C.blue, bottomColor: C.blue, Icon: ClipboardList,  k: "all" },
    { l: "In Progress", v: inProgress, pct: tabTasks.length ? Math.round(inProgress / tabTasks.length * 100) : 0, color: "#0369a1", trackColor: "#e0f2fe", iconBg: "#e0f2fe", iconColor: "#0369a1", bottomColor: "#0369a1", Icon: RefreshCw,  k: "inprogress" },
    { l: "Completed", v: completed, pct: tabTasks.length ? Math.round(completed / tabTasks.length * 100) : 0, color: "#15803d", trackColor: "#dcfce7", iconBg: "#dcfce7", iconColor: "#15803d", bottomColor: "#22c55e", Icon: CheckCircle2,  k: "completed" },
    { l: "Overdue", v: overdue, pct: tabTasks.length ? Math.round(overdue / tabTasks.length * 100) : 0, color: "#b91c1c", trackColor: "#fee2e2", iconBg: "#fee2e2", iconColor: "#b91c1c", bottomColor: "#ef4444", Icon: AlertTriangle,  k: "overdue" },
    { l: "Due Today", v: todayDue, pct: tabTasks.length ? Math.round(todayDue / tabTasks.length * 100) : 0, color: "#b45309", trackColor: "#fef3c7", iconBg: "#fef3c7", iconColor: "#b45309", bottomColor: "#f59e0b", Icon: Clock,  k: "today" },

  ], [tabTasks, inProgress, completed, overdue, todayDue, tod, filter]);
  const FPILLS = [
    { k: "all", l: "All", Icon: ClipboardList },
    { k: "own", l: "My Own", Icon: UserCheck, show: "to_me" },  // ← new
    { k: "delegated", l: "From Others", Icon: CornerDownLeft, show: "to_me" }, // ← new
    { k: "pending", l: "Pending", Icon: Circle },
    { k: "inprogress", l: "In Progress", Icon: RefreshCw },
    { k: "completed", l: "Completed", Icon: CheckCircle2 },
    { k: "overdue", l: "Overdue", Icon: AlertTriangle },
    { k: "today", l: "Today", Icon: Clock },
    { k: "high", l: "High Prio", Icon: Flag },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg }}>
      <ToastUI />

      {/* Header bar */}
      <div style={{
        background: C.surface, borderBottom: `1.5px solid ${C.border}`, padding: "10px 16px",
        flexShrink: 0, boxShadow: "0 1px 4px rgba(12,25,52,.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2, flex: 1, minWidth: 200 }}>
            {[
              { v: "to_me", label: "My Task", count: myTasks.length },
              { v: "by_me", label: "Assign Task", count: byMeTasks.length },
            ].map(({ v, label, count }) => (
              <button key={v} onClick={() => setActiveTab(v)}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: F, fontSize: 12, fontWeight: activeTab === v ? 700 : 500,
                  background: activeTab === v ? C.surface : "transparent",
                  color: activeTab === v ? C.t1 : C.t3,
                  boxShadow: activeTab === v ? "0 1px 4px rgba(12,25,52,.1)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "all .16s"
                }}>
                {label}
                <span style={{
                  fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 7px",
                  borderRadius: 999, background: activeTab === v ? C.blueLight : "#e2e8f0",
                  color: activeTab === v ? C.blueDark : C.t4
                }}>{count}</span>
              </button>
            ))}
          </div> 
          {/* New Task */}
          <button onClick={() => setModal(newTask(currentUser))} style={{ ...btnPrimary, flexShrink: 0, fontSize: 12 }}>
            <Plus size={14} color="#fff" />
            {!isMobile && "New Task"}
          </button>

          {/* Refresh */}
          <button onClick={loadAll} disabled={loading}
            style={{ ...btnSecondary, padding: "8px 10px", flexShrink: 0, opacity: loading ? .6 : 1 }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

<div style={{
  padding: isMobile ? "6px 10px 4px" : (detailOpen ? "6px 16px 4px" : "12px 16px 8px"),
  display: "grid",
  gridTemplateColumns: isMobile ? "repeat(5,1fr)" : "repeat(5,1fr)",
  gap: isMobile ? 3 : (detailOpen ? 6 : 8),
  flexShrink: 0,
  position: "relative",
  zIndex: 50,
}}>
  {STATS.map(({ l, v, pct, color, trackColor, iconBg, iconColor, bottomColor, Icon: StatIcon, tasks: ttTasks, ttLabel, k }) => {
    const size = isMobile ? 28 : (detailOpen ? 34 : 44), stroke = 3;
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ; 
    const stColors = {
      "In Progress": { bg: "#e0f2fe", color: "#0369a1" },
      "Pending": { bg: "#ede9fe", color: "#6d28d9" },
      "Completed": { bg: "#dcfce7", color: "#15803d" },
      "Open": { bg: "#fef3c7", color: "#b45309" },
    };
    const prioColors = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

    return (
      <div key={l} data-statcard="1"
      onClick={() => setFilter(k)}
        style={{
          padding: isMobile ? "6px 4px" : (detailOpen ? "8px 10px" : "13px 14px 12px"),
          borderRadius: isMobile ? 10 : 14,
          border: "1.5px solid",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: F,
          transition: "all .15s",
          position: "relative",
          overflow: "visible",
          background: filter === k ? iconBg : C.surface,
          borderColor: filter === k ? color + "55" : C.border,
          boxShadow: filter === k ? `0 2px 10px ${color}22` : "0 1px 3px rgba(12,25,52,.04)",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; }}> 
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: iconBg,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <StatIcon size={13} color={iconColor} strokeWidth={2} />
            </div>
            <div style={{
              fontFamily: FD, fontSize: 16, fontWeight: 800, lineHeight: 1,
              color: filter === k ? color : C.t1
            }}>{v}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.t4, lineHeight: 1, textAlign: "center" }}>{l}</div>
          </div>
        ) : (
          /* Desktop — full card */
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{
                  width: detailOpen ? 22 : 28, height: detailOpen ? 22 : 28,
                  borderRadius: 8, background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <StatIcon size={14} color={iconColor} strokeWidth={2} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.t3, lineHeight: 1.2 }}>{l}</div>
              </div>
              <div style={{
                fontFamily: FD, fontSize: detailOpen ? 20 : 26, fontWeight: 800, lineHeight: 1,
                color: filter === k ? color : C.t1, paddingLeft: 2
              }}>{v}</div>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 700, fontFamily: FM, color, lineHeight: 1 }}>{pct}%</span>
              </div>
            </div>
          </div>
        )} 
      </div>
    );
  })}
</div>
 
 
    <div style={{
  padding: detailOpen ? "0 16px 4px" : "0 16px 10px", display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0, flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", gap: 5, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
          {FPILLS.filter(fp => !fp.show || fp.show === activeTab).map(fp => (
            <button key={fp.k} onClick={() => setFilter(fp.k)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,padding: detailOpen ? "3px 9px" : "5px 12px",
                borderRadius: 999, border: "1.5px solid", fontSize: detailOpen ? 11 : 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: F, transition: "all .14s",
                // ── special colors for own/delegated pills ──
                background: filter === fp.k
                  ? (fp.k === "own" ? "#185FA5" : fp.k === "delegated" ? "#8b5cf6" : C.blue)
                  : C.surface,
                borderColor: filter === fp.k
                  ? (fp.k === "own" ? "#185FA5" : fp.k === "delegated" ? "#8b5cf6" : C.blue)
                  : C.border,
                color: filter === fp.k ? "#fff" : C.t3,
              }}>
              <fp.Icon size={11} color={filter === fp.k ? "#fff" : fp.k === "own" ? "#185FA5" : fp.k === "delegated" ? "#8b5cf6" : C.t3} />
              {fp.l}
            </button>
          ))}
        </div>
 
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: C.bg,
          border: `1.5px solid ${C.border}`, borderRadius: 999, padding: detailOpen ? "3px 10px" : "5px 12px", flexShrink: 0
        }}>
          <Search size={13} color={C.t4} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{
              background: "none", border: "none", outline: "none", fontSize: 12,
              color: C.t1, width: 120, fontFamily: F
            }} />
          {search && <button onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.t4, display: "flex", padding: 0 }}>
            <X size={13} />
          </button>}
        </div>

        {/* View toggle */}
        <div style={{
          display: "flex", background: C.bg, border: `1.5px solid ${C.border}`,
          borderRadius: 9, padding: 3, gap: 2, flexShrink: 0
        }}>
          {[{ v: "grid", Icon: LayoutGrid }, { v: "list", Icon: List }].map(({ v, Icon: Ic }) => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{
               padding: detailOpen ? "3px 7px" : "5px 9px" ,borderRadius: 6, cursor: "pointer", border: "none",
                display: "flex", alignItems: "center", fontFamily: F,
                background: viewMode === v ? C.surface : "none",
                color: viewMode === v ? C.blue : C.t4,
                boxShadow: viewMode === v ? "0 1px 3px rgba(12,25,52,.09)" : "none"
              }}>
              <Ic size={13} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>


          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0",
              color: C.t4, fontSize: 13, fontFamily: F
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, border: `3px solid ${C.blueLight}`,
                  borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin .8s linear infinite"
                }} />
                <span>Loading tasks…</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "48px 24px", color: C.t4, textAlign: "center", gap: 8
            }}>
              <div style={{ opacity: .18 }}><CheckCircle2 size={48} color={C.blue} strokeWidth={1.5} /></div>
              <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: C.t3 }}>
                {activeTab === "by_me" ? "No tasks delegated yet" : "No tasks here"}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, maxWidth: 220 }}>
                {filter === "all" ? "Add a task using the box above" : "Try a different filter"}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <AnimatePresence mode="popLayout">
              {activeTab === "to_me" ? ( 
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(() => {
                    const selfTasks = filtered.filter(t => !t.assigned_by || t.assign_type === "self");
                    const delegatedTasks = filtered.filter(t => t.assigned_by && t.assign_type === "assign");

                    const renderCard = t => (
                      <TaskCard key={t._key || t.line_id} task={t}
                        onOpen={openDetail}
                        onToggle={toggle}
                        onDelete={delTask}
                        onStatusChange={handleStatusChange}
                        isAssignedToMe={false}
                        isSelected={detailKey !== null && (t._key === detailKey || String(t.line_id) === String(detailKey))} />
                    );

                    return (
                      <>
                        {/* ── My Own Tasks ── */}
                        {selfTasks.length > 0 && (
                          <SectionGroup
                            label="My own tasks"
                            count={selfTasks.length}
                            accentColor="#185FA5"
                            badgeBg="#E6F1FB"
                            badgeColor="#0C447C"
                            lineBg="#E6F1FB">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                              {selfTasks.map(renderCard)}
                            </div>
                          </SectionGroup>
                        )}

                        {/* ── Assigned to me by others ── */}
                        {delegatedTasks.length > 0 && (
                          <SectionGroup
                            label="Assigned to me by others"
                            count={delegatedTasks.length}
                            accentColor="#8b5cf6"
                            badgeBg="#ede9fe"
                            badgeColor="#6d28d9"
                            lineBg="#ede9fe">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                              {delegatedTasks.map(renderCard)}
                            </div>
                          </SectionGroup>
                        )}

                        {/* ── Both empty after filter ── */}
                        {selfTasks.length === 0 && delegatedTasks.length === 0 && (
                          <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            padding: "48px 24px", color: C.t4, textAlign: "center", gap: 8
                          }}>
                            <div style={{ opacity: .18 }}><CheckCircle2 size={48} color={C.blue} strokeWidth={1.5} /></div>
                            <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: C.t3 }}>No tasks here</div>
                            <div style={{ fontSize: 12 }}>Try a different filter</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                // ── Assigned by me tab — flat grid, no sections ─────────
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                  {filtered.map(t => (
                    <TaskCard key={t._key || t.line_id} task={t}
                      onOpen={openDetail}
                      onToggle={toggle}
                      onDelete={noopDelete}
                      onStatusChange={handleStatusChange}
                      isAssignedToMe={false}
                      isSelected={detailKey !== null && (t._key === detailKey || String(t.line_id) === String(detailKey))} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="popLayout">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(t => (
                  <TaskRow key={t._key || t.line_id} task={t}
                    onOpen={openDetail}
                    onToggle={toggle}
                    onDelete={activeTab === "to_me" ? delTask : noopDelete}
                    isAssignedToMe={activeTab === "to_me" && t.assign_type === "assign"} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {detailTask && (
            <DetailPanel
              key={detailTask._key}
              task={detailTask}
              onClose={() => setDetailKey(null)}
              onEdit={() => { setModal(detailTask); setDetailKey(null); }}
              onDelete={activeTab === "to_me" ? delTask : noopDelete}
              onToggle={toggle}
              readOnly={false}
              isMobile={isMobile}

            />
          )}
        </AnimatePresence>
      </div>

      {/* Task modal */}
      <AnimatePresence>
        {modal !== null && (
          <TaskModal
            task={modal}
            onClose={() => setModal(null)}
            onSave={saveModal}
            currentUser={currentUser}
            employees={employees}
            categoryOptions={categoryList.map(c => c.category)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}; 
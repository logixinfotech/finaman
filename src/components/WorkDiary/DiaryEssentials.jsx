import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyTasks, fetchAssignedByMeTasks, updateTaskLineStatus, deleteTaskLine } from "../../utils/api";
import { alertError } from "../Reusable/alert";
import {
  F, FD, FM, C, useToast,
  TaskCard, DetailPanel,
  todayStr,
  btnPrimary, btnSecondary, useIsMobile, TaskTable,
} from "./WorkDiaryForm";
import {
  ClipboardList, RefreshCw, CheckCircle2,
  LayoutGrid, Search, X, Plus,
  BookOpen, Layers, ChevronRight, UserCheck, CornerDownLeft, Table2, ChevronDown,
  Filter, ChevronsLeft, ChevronsRight,
} from "lucide-react";
 
export const BP = { mobile: 1024, compact: 1440 };
const readBp = () => {
  const w = window.innerWidth;
  return w < BP.mobile ? "mobile" : w < BP.compact ? "compact" : "wide";
};
export const useBreakpoint = () => {
  const [bp, setBp] = useState(readBp);
  useEffect(() => {
    const fn = () => setBp(readBp());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
};
export const getCurrentUser = () => {
  try {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
};
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
const CategoryList = ({ categoryList, activeCategory, onPick }) => {
  const isAll = !activeCategory;
  return (
    <>
      <button onClick={() => onPick(null)}
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

      {categoryList.map(({ category, task_count }) => {
        const isActive = activeCategory === category;
        return (
          <button key={category} onClick={() => onPick(isActive ? null : category)}
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
    </>
  );
};
const RailBtn = ({ active, title, onClick, children, dot }) => (
  <button onClick={onClick} title={title} aria-label={title}
    style={{
      width: 40, height: 40, margin: "0 auto 4px", borderRadius: 9, border: "none",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? C.blueLight : "transparent", color: active ? C.blue : C.t3,
      position: "relative", transition: "all .14s", fontFamily: F,
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = C.t1; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t3; } }}>
    {active && <div style={{
      position: "absolute", left: -8, top: "22%", bottom: "22%", width: 3,
      background: C.blue, borderRadius: "0 3px 3px 0"
    }} />}
    {children}
    {dot && <span style={{
      position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%",
      background: C.blue, border: `1.5px solid ${C.surface}`,
    }} />}
  </button>
);
export const SidebarContent = ({
  NAV, activeNav, setActiveNav, setSidebarOpen,
  categoryList, activeCategory, setActiveCategory,
  collapsed = false, onToggleCollapse,
}) => {
  const [catFly, setCatFly] = useState(null); // { top, left } when flyout open

  const openCatFly = e => {
    const r = e.currentTarget.getBoundingClientRect();
    setCatFly(p => p ? null : { top: r.top, left: r.right + 10 });
  };
  const pickCategory = c => { setActiveCategory(c); setCatFly(null); };
  if (collapsed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "10px 8px", background: C.surface }}>
        <div title="Work Diary — FINAMAN ERP" style={{
          width: 34, height: 34, borderRadius: 10, background: C.blueLight, margin: "0 auto 10px",
          display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.blueBorder}`
        }}>
          <BookOpen size={16} color={C.blue} strokeWidth={2} />
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, margin: "0 2px 10px" }} />

        {NAV.map(n => (
          <RailBtn key={n.k} active={activeNav === n.k} title={n.l}
            onClick={() => { setActiveNav(n.k); setSidebarOpen?.(false); }}>
            <n.Icon size={17} strokeWidth={activeNav === n.k ? 2.2 : 1.8} />
          </RailBtn>
        ))}

        <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 2px 10px" }} />

        <RailBtn active={!!catFly || !!activeCategory} title={activeCategory ? `Category: ${activeCategory}` : "Categories"}
          onClick={openCatFly} dot={!!activeCategory && !catFly}>
          <Layers size={17} strokeWidth={1.8} />
        </RailBtn>

        {catFly && (
          <>
            <div onClick={() => setCatFly(null)} style={{ position: "fixed", inset: 0, zIndex: 69 }} />
            <div style={{
              position: "fixed", top: catFly.top, left: catFly.left, zIndex: 70, width: 236,
              maxHeight: "min(420px, calc(100vh - 120px))", overflowY: "auto",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              boxShadow: "0 10px 32px rgba(12,25,52,.16)", padding: "8px 8px 6px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 6px 8px" }}>
                <Layers size={11} color={C.t4} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: C.t4 }}>Categories</span>
              </div>
              <CategoryList categoryList={categoryList} activeCategory={activeCategory} onPick={pickCategory} />
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {onToggleCollapse && (
          <RailBtn title="Expand sidebar" onClick={onToggleCollapse}>
            <ChevronsRight size={16} strokeWidth={2} />
          </RailBtn>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.surface }}>
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
        <CategoryList categoryList={categoryList} activeCategory={activeCategory} onPick={setActiveCategory} />
      </div>

      {onToggleCollapse && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "6px 8px", flexShrink: 0 }}>
          <button onClick={onToggleCollapse} title="Collapse sidebar"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              borderRadius: 8, border: "none", background: "transparent", cursor: "pointer",
              fontFamily: F, fontSize: 12, fontWeight: 500, color: C.t4, transition: "all .14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.t4; }}>
            <ChevronsLeft size={15} strokeWidth={2} />
            <span>Collapse</span>
          </button>
        </div>
      )}
    </div>
  );
};
export const MyTasksScreen = ({
  currentUser, employees = [],
  categoryList = [], activeCategory, setActiveNav,
  isSaving = false, onEditTask,
}) => {
  const [scope, setScope] = useState("all");           // "all" | "self" | "others"
  const [scopeOpen, setScopeOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [myTasks, setMyTasks] = useState([]);
  const [byMeTasks, setByMeTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");   // "table" | "grid"
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [detailKey, setDetailKey] = useState(null);

  const isMobile = useIsMobile();
  const bp = useBreakpoint();
  const overlayPanel = bp === "compact";   // small laptop: panel floats over table instead of pushing it
  const { show: toast, ToastUI } = useToast();
  const tod = todayStr();

  const loadMyTasks = useCallback(async () => {
    try {
      const rMe = await fetchMyTasks();
      const normalize = arr =>
        (Array.isArray(arr) ? arr : arr?.data || []).map(t => ({ ...t, _key: t._key || String(t.line_id) }));
      setMyTasks(normalize(rMe));
    } catch { alertError("Error", "Failed to load tasks"); }
  }, []);

  const loadByMeTasks = useCallback(async () => {
    try {
      const rBy = await fetchAssignedByMeTasks();
      const normalize = arr =>
        (Array.isArray(arr) ? arr : arr?.data || []).map(t => ({ ...t, _key: t._key || String(t.line_id) }));
      setByMeTasks(normalize(rBy));
    } catch { /* non-fatal */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.allSettled([loadMyTasks(), loadByMeTasks()]);
    } catch { alertError("Error", "Failed to load tasks"); }
    finally { setLoading(false); }
  }, [loadMyTasks, loadByMeTasks]);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { setFilter("all"); setSearch(""); setDetailKey(null); }, [scope]);

  const scopedTasks = useMemo(() => {
    if (scope === "self") return myTasks;
    if (scope === "others") return byMeTasks;
    return [...myTasks, ...byMeTasks];
  }, [scope, myTasks, byMeTasks]);

  const filtered = useMemo(() => {
    let l = [...scopedTasks];
    if (activeCategory) l = l.filter(t => t.category === activeCategory);
    if (filterEmployee) l = l.filter(t => t.assigned_to_name === filterEmployee);

    if (filterCategory) l = l.filter(t => t.category === filterCategory);
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
      case "inprogress": return l.filter(t => t.status === "In Progress");
      case "completed": return l.filter(t => t.status === "Completed" || t.status === "Resolved" || t.status === "Closed");
      case "overdue": return l.filter(t => t.due_date && t.due_date < tod && t.status !== "Completed" && t.status !== "Cancelled");
      case "today": return l.filter(t => t.due_date && t.due_date.slice(0, 10) === tod && t.status !== "Completed");
      case "high": return l.filter(t => t.priority === "High");
      case "pending": return l.filter(t => t.status === "Pending" || t.status === "Open");
      default: return l;
    }
  }, [scopedTasks, filter, search, tod, activeCategory, filterEmployee, filterCategory]);

  const detailTask = scopedTasks.find(t => t._key === detailKey || String(t.line_id) === String(detailKey)) || null;

  const isMine = useCallback(id =>
    id === currentUser?.user_id || id === currentUser?.employee_name,
    [currentUser]);

  const isAssignedToMe = useCallback(t =>
    t.assign_type === "assign" && t.assigned_by && !isMine(t.assigned_by),
    [isMine]);

  const toggle = useCallback(async key => {
    const allT = [...myTasks, ...byMeTasks];
    const task = allT.find(t => t._key === key || String(t.line_id) === String(key));
    if (!task) return;
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    const upd = p => p.map(t => (t._key === key || String(t.line_id) === String(key)) ? { ...t, status: newStatus } : t);
    setMyTasks(upd); setByMeTasks(upd);
    if (task.line_id) {
      try { await updateTaskLineStatus(task.line_id, newStatus); }
      catch {
        const revert = p => p.map(t => (t._key === key || String(t.line_id) === String(key)) ? { ...t, status: task.status } : t);
        setMyTasks(revert); setByMeTasks(revert);
        toast("Could not update status", "error");
      }
    }
  }, [myTasks, byMeTasks, toast]);

  useEffect(() => {
    const handler = e => {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        setActiveNav?.("diaryentry");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setActiveNav]);

  const employeeOptions = useMemo(() => {
    const set = new Set(scopedTasks.map(t => t.assigned_to_name).filter(Boolean));
    return [...set].sort();
  }, [scopedTasks]);


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
    if (task?.assigned_by && !isMine(task.assigned_by)) {
      toast(`Cannot delete — assigned by ${task.assigned_by}`, "error");
      return;
    }

    const confirmed = window.confirm(`Delete "${task?.work_plan || "this task"}"?\n\nThis cannot be undone.`);
    if (!confirmed) return;

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
  }, [myTasks, byMeTasks, toast, isMine]);

  const openDetail = useCallback(k => setDetailKey(k), []);

  const categoryOptions = useMemo(() => categoryList.map(c => c.category), [categoryList]);
  const FPILLS = [
    { k: "all", l: "All" },
    { k: "pending", l: "Pending" },
    { k: "inprogress", l: "In Progress" },
    { k: "completed", l: "Completed" },
  ];
  const MORE_FPILLS = [
    { k: "overdue", l: "Overdue" },
    { k: "today", l: "Due today" },
    { k: "high", l: "High priority" },
  ];

  const SCOPE_OPTIONS = [
    { v: "all", label: "All tasks", Icon: ClipboardList, count: myTasks.length + byMeTasks.length },
    { v: "self", label: "My tasks", Icon: UserCheck, count: myTasks.length },
    { v: "others", label: "Assigned by me", Icon: CornerDownLeft, count: byMeTasks.length },
  ];
  const activeScope = SCOPE_OPTIONS.find(s => s.v === scope);

  const gridSections = useMemo(() => {
    const own = filtered.filter(t => !isAssignedToMe(t) && !(t.assigned_by && isMine(t.assigned_by) && t.assign_type === "assign"));
    const toMe = filtered.filter(t => isAssignedToMe(t));
    const byMe = filtered.filter(t => t.assign_type === "assign" && t.assigned_by && isMine(t.assigned_by));
    return { own, toMe, byMe };
  }, [filtered, isAssignedToMe, isMine]);

  const hasMoreFiltersActive = filterEmployee || filterCategory || ["overdue", "today", "high"].includes(filter);
  const moreFilterCount = [filterEmployee, filterCategory, ["overdue", "today", "high"].includes(filter) ? filter : null].filter(Boolean).length;
  const detailPanelEl = detailTask && (
    <DetailPanel
      key={detailTask._key}
      task={detailTask}
      onClose={() => setDetailKey(null)}
      onEdit={() => { onEditTask?.(detailTask); setDetailKey(null); }}
      onDelete={delTask}
      onToggle={toggle}
      readOnly={!(!detailTask.assigned_by || isMine(detailTask.assigned_by))}
      isMobile={isMobile}
      employees={employees}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg }}>
      <ToastUI />

      <div className="wd-toolbar" style={{
        padding: "10px 20px", display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0, flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, background: C.surface,
      }}>
        <div className="wd-left-group" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setScopeOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 11px",
                borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface,
                cursor: "pointer", fontFamily: F,
              }}>
              <activeScope.Icon size={13} color={C.blue} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{activeScope.label}</span>
              <span style={{
                fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 6px",
                borderRadius: 999, background: C.blueLight, color: C.blueDark,
              }}>{activeScope.count}</span>
              <ChevronDown size={13} color={C.t4} style={{ transform: scopeOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>

            {scopeOpen && (
              <>
                <div onClick={() => setScopeOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 190, zIndex: 61,
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9,
                  boxShadow: "0 8px 24px rgba(12,25,52,.14)", overflow: "hidden",
                }}>
                  {SCOPE_OPTIONS.map(opt => (
                    <button key={opt.v} onClick={() => { setScope(opt.v); setScopeOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8, padding: "9px 12px", border: "none", cursor: "pointer", textAlign: "left",
                        background: scope === opt.v ? C.blueLight : "transparent", fontFamily: F,
                      }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <opt.Icon size={13} color={scope === opt.v ? C.blue : C.t3} />
                        <span style={{ fontSize: 12.5, fontWeight: scope === opt.v ? 700 : 500, color: C.t1 }}>{opt.label}</span>
                      </span>
                      <span style={{ fontFamily: FM, fontSize: 10.5, fontWeight: 700, color: C.t4 }}>{opt.count}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="wd-pills" style={{ display: "flex", gap: 5, flexShrink: 0, overflowX: "auto", scrollbarWidth: "none" }}>
            {(isMobile ? FPILLS.filter(fp => fp.k === "pending") : FPILLS).map(fp => {
              const active = filter === fp.k;
              return (
                <button key={fp.k} onClick={() => setFilter(fp.k)}
                  style={{
                    padding: "6px 11px", borderRadius: 999, border: `1px solid ${active ? C.blue : C.border}`,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: F,
                    background: active ? C.blueLight : "transparent",
                    color: active ? C.blueDark : C.t3, transition: "all .14s", flexShrink: 0,
                  }}>
                  {fp.l}
                </button>
              );
            })}
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setMoreFiltersOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 11px",
                borderRadius: 999, cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 600,
                border: `1px solid ${hasMoreFiltersActive ? C.blue : C.border}`,
                background: hasMoreFiltersActive ? C.blueLight : "transparent",
                color: hasMoreFiltersActive ? C.blueDark : C.t3, whiteSpace: "nowrap",
              }}>
              <Filter size={12} />
              More filters
              {moreFilterCount > 0 && (
                <span style={{
                  fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 6px",
                  borderRadius: 999, background: C.blue, color: "#fff",
                }}>{moreFilterCount}</span>
              )}
            </button>

            {moreFiltersOpen && (
              <>
                <div onClick={() => setMoreFiltersOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 240, maxWidth: "calc(100vw - 40px)", zIndex: 61,
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(12,25,52,.14)", padding: 12,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {(isMobile ? [...FPILLS.filter(fp => fp.k !== "pending"), ...MORE_FPILLS] : MORE_FPILLS).map(fp => {
                      const active = filter === fp.k;
                      return (
                        <button key={fp.k} onClick={() => setFilter(active ? "all" : fp.k)}
                          style={{
                            padding: "5px 10px", borderRadius: 999, border: `1px solid ${active ? C.blue : C.border}`,
                            fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: F,
                            background: active ? C.blueLight : "transparent",
                            color: active ? C.blueDark : C.t3,
                          }}>
                          {fp.l}
                        </button>
                      );
                    })}
                  </div>

                  <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12.5, fontFamily: F, color: C.t2, background: C.bg, cursor: "pointer" }}>
                    <option value="">All employees</option>
                    {employeeOptions.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>

                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12.5, fontFamily: F, color: C.t2, background: C.bg, cursor: "pointer" }}>
                    <option value="">All categories</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  {hasMoreFiltersActive && (
                    <button onClick={() => { setFilterEmployee(""); setFilterCategory(""); if (["overdue", "today", "high"].includes(filter)) setFilter("all"); }}
                      style={{
                        padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
                        fontSize: 12, fontFamily: F, color: C.t3, background: C.bg, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      }}>
                      <X size={12} /> Clear filters
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="wd-spacer" style={{ flex: 1 }} />
        <div className="wd-right-group" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          <div className="wd-search-wrap" style={{
            display: "flex", alignItems: "center", gap: 7, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 11px", flexShrink: 0, minWidth: 150,
          }}>
            <Search size={13} color={C.t4} style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ background: "none", border: "none", outline: "none", fontSize: 12.5, color: C.t1, width: 110, fontFamily: F }} />
            {search && <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.t4, display: "flex", padding: 0, flexShrink: 0 }}>
              <X size={13} />
            </button>}
          </div>
          <button onClick={() => setActiveNav?.("diaryentry")} style={{ ...btnPrimary, fontSize: 12.5, flexShrink: 0 }}>
            <Plus size={14} color="#fff" />
            <span className="wd-new-task-label">{!isMobile && "New task"}</span>
          </button>
          <button onClick={loadAll} disabled={loading}
            style={{ ...btnSecondary, padding: "8px 10px", flexShrink: 0, opacity: loading ? .6 : 1 }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
            {[{ v: "table", Icon: Table2 }, { v: "grid", Icon: LayoutGrid }].map(({ v, Icon: Ic }) => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{
                  padding: "5px 9px", borderRadius: 6, cursor: "pointer", border: "none",
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
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px", minWidth: 0 }}>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: C.t4, fontSize: 13, fontFamily: F }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, border: `3px solid ${C.blueLight}`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                <span>Loading tasks…</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", color: C.t4, textAlign: "center", gap: 8 }}>
              <div style={{ opacity: .18 }}><CheckCircle2 size={48} color={C.blue} strokeWidth={1.5} /></div>
              <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: C.t3 }}>
                {scope === "others" ? "No tasks delegated yet" : "No tasks here"}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, maxWidth: 220 }}>
                {filter === "all" ? "Add a task using the box above" : "Try a different filter"}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <AnimatePresence mode="popLayout">
              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 16 }}>
                {gridSections.own.length > 0 && (
                  <SectionGroup label="My own tasks" count={gridSections.own.length} accentColor="#185FA5" badgeBg="#E6F1FB" badgeColor="#0C447C" lineBg="#E6F1FB">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                      {gridSections.own.map(t => (
                        <TaskCard key={t._key || t.line_id} task={t} onOpen={openDetail} onToggle={toggle} onDelete={delTask}
                          onStatusChange={handleStatusChange} isAssignedToMe={false}
                          isSelected={detailKey !== null && (t._key === detailKey || String(t.line_id) === String(detailKey))} />
                      ))}
                    </div>
                  </SectionGroup>
                )}
                {gridSections.toMe.length > 0 && (
                  <SectionGroup label="Assigned to me by others" count={gridSections.toMe.length} accentColor="#8b5cf6" badgeBg="#ede9fe" badgeColor="#6d28d9" lineBg="#ede9fe">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                      {gridSections.toMe.map(t => (
                        <TaskCard key={t._key || t.line_id} task={t} onOpen={openDetail} onToggle={toggle} onDelete={delTask}
                          onStatusChange={handleStatusChange} isAssignedToMe={true}
                          isSelected={detailKey !== null && (t._key === detailKey || String(t.line_id) === String(detailKey))} />
                      ))}
                    </div>
                  </SectionGroup>
                )}
                {gridSections.byMe.length > 0 && (
                  <SectionGroup label="Assigned by me to others" count={gridSections.byMe.length} accentColor="#0f766e" badgeBg="#ccfbf1" badgeColor="#0f766e" lineBg="#ccfbf1">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                      {gridSections.byMe.map(t => (
                        <TaskCard key={t._key || t.line_id} task={t} onOpen={openDetail} onToggle={toggle} onDelete={delTask}
                          onStatusChange={handleStatusChange} isAssignedToMe={false}
                          isSelected={detailKey !== null && (t._key === detailKey || String(t.line_id) === String(detailKey))} />
                      ))}
                    </div>
                  </SectionGroup>
                )}
              </div>
            </AnimatePresence>
          ) : (
            <div style={{ paddingTop: 16 }}>
              <TaskTable tasks={filtered} onOpen={openDetail} onDelete={delTask} onStatusChange={handleStatusChange} selectedKey={detailKey}
                isEditable={t => !t.assigned_by || isMine(t.assigned_by)} />
            </div>
          )}
        </div>
        <AnimatePresence>
          {detailTask && (overlayPanel ? (
            <motion.div key="wd-panel-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: .15 }}
              style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", justifyContent: "flex-end" }}>
              <div onClick={() => setDetailKey(null)}
                style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.18)" }} />
              <motion.div
                initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }}
                transition={{ duration: .18, ease: "easeOut" }}
                style={{
                  position: "relative", height: "100%", maxWidth: "100%", display: "flex",
                  background: C.surface, boxShadow: "-10px 0 30px rgba(15,23,42,.16)",
                }}>
                {detailPanelEl}
              </motion.div>
            </motion.div>
          ) : detailPanelEl)}
        </AnimatePresence>
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}} 
        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .wd-search-wrap { min-width: 130px; }
          .wd-search-wrap input { width: 90px; }
        }

        /* ── Mobile: force left group and right group onto their own lines ── */
        @media (max-width: 640px) {
          .wd-left-group { flex-basis: 100%; }
          .wd-spacer { display: none; }
          .wd-right-group { flex-basis: 100%; }
          .wd-search-wrap { flex: 1; min-width: 0; }
          .wd-search-wrap input { width: 100%; }
        }
      `}</style>
    </div>
  );
};

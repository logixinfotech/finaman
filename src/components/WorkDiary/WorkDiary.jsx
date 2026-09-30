import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchWorkDiaries, fetchWorkDiaryById, createWorkDiary, updateWorkDiary,
  fetchUsers, addSubtask, fetchWorkDiaryCategories, updateSubtask
} from "../../utils/api";
import { alertError } from "../Reusable/alert";
import TaskTableEntry from "./TaskTableEntry";
import { setERPHandlers } from "../../utils/erpShortcuts";
import {
  C, F, newTask, todayStr, useIsMobile,
} from "./WorkDiaryForm";
import {
  SidebarContent, MyTasksScreen, getCurrentUser, useBreakpoint,
} from "./DiaryEssentials";
import { ReportScreen } from "./WorkDiaryReports";
import {
  BookOpen, CheckSquare, BarChart2, Menu, X,
} from "lucide-react";

const NAV = [
  { k: "mytasks", l: "My Tasks", Icon: CheckSquare },
  { k: "report", l: "Analytics", Icon: BarChart2 },

];
const SIDEBAR_W = 220;
const SIDEBAR_RAIL_W = 56;
const SIDEBAR_PREF_KEY = "wd_sidebar";

const MobileTopBar = ({ activeNav, onHamburger }) => {
  const current = NAV.find(n => n.k === activeNav);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: C.surface, borderBottom: `1.5px solid ${C.border}`,
      flexShrink: 0, boxShadow: "0 1px 4px rgba(15,23,42,.06)"
    }}>
      <button onClick={onHamburger}
        style={{
          background: "none", border: "none", cursor: "pointer", color: C.t2,
          display: "flex", alignItems: "center", padding: 4, borderRadius: 7
        }}>
        <Menu size={20} strokeWidth={2} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: C.blueLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${C.blueBorder}`
        }}>
          <BookOpen size={14} color={C.blue} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, lineHeight: 1 }}>Work Diary</div>
          <div style={{ fontSize: 10, color: C.t4 }}>FINAMAN ERP</div>
        </div>
      </div>
      {current && (
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
          color: C.blue, fontSize: 12, fontWeight: 600
        }}>
          <current.Icon size={14} strokeWidth={2} />{current.l}
        </div>
      )}
    </div>
  );
};
const BottomNav = ({ activeNav, setActiveNav }) => (
  <div style={{
    display: "flex", background: C.surface, borderTop: `1.5px solid ${C.border}`,
    flexShrink: 0, boxShadow: "0 -2px 10px rgba(12,25,52,.07)",
  }}>
    {NAV.map(n => {
      const active = activeNav === n.k;
      return (
        <button key={n.k} onClick={() => setActiveNav(n.k)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 3, padding: "10px 0 8px", border: "none", cursor: "pointer",
            background: "none", transition: "all .14s",
            color: active ? C.blue : C.t4, fontFamily: F
          }}>
          <n.Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{n.l}</span>
          {active && <div style={{ width: 20, height: 2, borderRadius: 1, background: C.blue }} />}
        </button>
      );
    })}
  </div>
);

const initialDiaryState = {
  diary_id: null,
  employee_id: "",
  employee_name: "",
  department: "",
  diary_date: "",
  period_type: "Daily",
  diary_status: "Submitted",
  notes: "",
  manager_remarks: "",
  task_lines: [],
};

function WorkDiary({ tab }) {
  const [activeNav, setActiveNav] = useState("mytasks");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [list, setList] = useState([]);
  const [allList, setAllList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState(initialDiaryState);
  const [categoryList, setCategoryList] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMobile = useIsMobile();
  const bp = useBreakpoint(); 
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [editingTask, setEditingTask] = useState(null);
  const [sidebarPref, setSidebarPref] = useState(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_PREF_KEY);
      return v === "collapsed" ? true : v === "expanded" ? false : null;
    } catch { return null; }
  });
  const sidebarCollapsed = sidebarPref ?? (bp === "compact");
  const toggleSidebar = useCallback(() => {
    const next = !sidebarCollapsed;
    setSidebarPref(next);
    try { localStorage.setItem(SIDEBAR_PREF_KEY, next ? "collapsed" : "expanded"); } catch { }
  }, [sidebarCollapsed]);

  const onEditTask = useCallback((task) => {
    setEditingTask(task);
    setActiveNav("diaryentry");
  }, []);
  const loadCategories = useCallback(async () => {
    try {
      const r = await fetchWorkDiaryCategories();
      setCategoryList(Array.isArray(r) ? r : r?.data || []);
    } catch { }
  }, []);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const d = await fetchWorkDiaries();
      setList(Array.isArray(d) ? d : d?.data || []);
    } catch { alertError("Fetch Error", "Failed to load diaries"); }
    finally { setLoading(false); }
  }, []);

  const loadAllList = useCallback(async () => {
    try {
      const d = await fetchWorkDiaries("all=1&include_lines=1");
      setAllList(Array.isArray(d) ? d : d?.data || []);
    } catch { }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const r = await fetchUsers();
      setEmployees(Array.isArray(r) ? r : r?.data || []);
    } catch { }
  }, []);

  useEffect(() => {
    if (activeNav === "summary" || activeNav === "report") {
      loadAllList();
    }
  }, [activeNav]);

  useEffect(() => {
    loadList();
    loadEmployees();
    loadCategories();
  }, []);
  useEffect(() => {
    setFormData(p => ({
      ...p,
      diary_date: p.diary_date || todayStr(),
      employee_id: currentUser?.userma_id || p.employee_id,
      employee_name: currentUser?.user_id || p.employee_name,
    }));
  }, [currentUser]);
  const handleSave = useCallback(async (taskLines, subtaskMap = {}, updatedSubtasks = []) => {
    if (!Array.isArray(taskLines) || taskLines.length === 0) return;
    if (isSaving) return;
    setIsSaving(true);

    try {
      const newTaskLines = taskLines
        .filter(t => t.work_plan?.trim())
        .map(({ _key, _pendingSubtasks, attachment, ...rest }) => rest);

      if (newTaskLines.length === 0) return;

      const dept = taskLines[0]?.category || formData.department || "";
      const employee_id = currentUser?.userma_id || formData.employee_id;
      const employee_name = currentUser?.user_id || formData.employee_name;
      const diary_date = formData.diary_date || todayStr();

      let existingTaskLines = [];
      let diary_id = formData.diary_id;

      if (diary_id) {
        try {
          const fresh = await fetchWorkDiaryById(diary_id);
          existingTaskLines = fresh?.task_lines || fresh?.data?.task_lines || [];
        } catch { }
      } else {
        try {
          const todayDiaries = await fetchWorkDiaries();
          const rows = Array.isArray(todayDiaries) ? todayDiaries : todayDiaries?.data || [];
          const found = rows.find(d =>
            String(d.employee_id) === String(employee_id) &&
            d.diary_date === diary_date
          );
          if (found?.diary_id) {
            diary_id = found.diary_id;
            setFormData(p => ({ ...p, diary_id: found.diary_id }));
            const fresh = await fetchWorkDiaryById(found.diary_id);
            existingTaskLines = fresh?.task_lines || fresh?.data?.task_lines || [];
          }
        } catch { }
      }

      const mergedLines = [...existingTaskLines, ...newTaskLines];
      const data = {
        ...formData,
        diary_id,
        diary_status: "Submitted",
        task_lines: mergedLines,
        department: dept,
        employee_id,
        employee_name,
        diary_date,
      };

      let isEdit = !!data.diary_id;
      let r = isEdit
        ? await updateWorkDiary(data.diary_id, data)
        : await createWorkDiary(data);

      if (!r?.success) {
        alertError("Save Failed", r?.message || "Unknown error");
        return;
      }

      const savedDiaryId = r.diary_id || data.diary_id;
      if (!isEdit && r.diary_id) {
        setFormData(p => ({ ...p, diary_id: r.diary_id }));
      }
      if (Object.keys(subtaskMap).length > 0 && savedDiaryId) {
        try {
          const freshResp = await fetchWorkDiaryById(savedDiaryId);
          const freshLines = freshResp?.task_lines || freshResp?.data?.task_lines || [];
          const planToKey = {};
          taskLines.forEach(t => {
            if (t.work_plan?.trim()) planToKey[t.work_plan.trim()] = t._key;
          });
          for (const line of freshLines) {
            const matchKey = planToKey[line.work_plan?.trim()];
            if (!matchKey) continue;
            const pending = subtaskMap[matchKey];
            if (!pending?.length) continue;
            for (let i = 0; i < pending.length; i++) {
              const s = pending[i];
              await addSubtask({
                line_id: line.line_id,
                diary_id: savedDiaryId,
                subtask_text: typeof s === "string" ? s : s.subtask_text,
                priority: typeof s === "string" ? "Medium" : (s.priority || "Medium"),
                status: typeof s === "string" ? "Pending" : (s.status || "Pending"),
                due_date: typeof s === "string" ? null : (s.due_date || null),
                expected_time: typeof s === "string" ? 0 : (parseFloat(s.expected_time) || 0),
                sort_order: i,
              });
            }
          }
        } catch (subErr) {
          console.error("[WorkDiary] Subtask save failed:", subErr.message);
        }
      }
      if (updatedSubtasks?.length > 0) {
        try {
          for (const s of updatedSubtasks) {
            await updateSubtask(s.subtask_id, {
              priority: s.priority,
              status: s.status,
              due_date: s.due_date || null,
              expected_time: parseFloat(s.expected_time) || 0,
            });
          }
        } catch (subErr) {
          console.error("[WorkDiary] Subtask update failed:", subErr.message);
        }
      }
      const refreshJobs = [loadList(), loadCategories()];
      if (activeNav === "summary" || activeNav === "report") {
        refreshJobs.push(loadAllList());
      }
      await Promise.all(refreshJobs);

    } catch (err) {
      alertError("Error", err.message);
    } finally {
      setIsSaving(false);
    }
  }, [formData, isSaving, activeNav, loadList, loadAllList, loadCategories, currentUser]);

  useEffect(() => {
    setERPHandlers({
      onNew: () => setActiveNav("mytasks"),
      onEsc: () => setSidebarOpen(false),
    });
  }, []);

  const clearCategory = useCallback(() => setActiveCategory(null), []);
  const sidebarProps = useMemo(() => ({
    NAV,
    activeNav,
    setActiveNav,
    setSidebarOpen,
    categoryList,
    activeCategory,
    setActiveCategory,
  }), [activeNav, categoryList, activeCategory]);

  const myTasksProps = useMemo(() => ({
    currentUser,
    employees,
    onSaveAndSubmit: handleSave,
    categoryList,
    activeCategory,
    setActiveCategory, setActiveNav,
    isSaving, onEditTask,
  }), [currentUser, employees, handleSave, categoryList, activeCategory, isSaving]);

  return (
    <div style={{
      width: "100%",
      height: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 100px)",
      display: "flex", flexDirection: "column",
      background: C.bg, fontFamily: F, overflow: "hidden",
    }}>
      {isMobile && <MobileTopBar activeNav={activeNav} onHamburger={() => setSidebarOpen(true)} />}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {!isMobile && (
          <div style={{
            width: sidebarCollapsed ? SIDEBAR_RAIL_W : SIDEBAR_W,
            flexShrink: 0, background: C.surface,
            borderRight: `1.5px solid ${C.border}`, display: "flex",
            flexDirection: "column", overflow: "hidden",
            boxShadow: "1px 0 4px rgba(15,23,42,.04)",
            transition: "width .18s ease",
          }}>
            <SidebarContent
              {...sidebarProps}
              collapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          </div>
        )}

        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "fixed", inset: 0, zIndex: 40,
                  background: "rgba(15,23,42,.45)", backdropFilter: "blur(4px)"
                }} />
              <motion.div
                initial={{ x: -270 }} animate={{ x: 0 }} exit={{ x: -270 }}
                transition={{ duration: .22, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  left: 0,
                  top: "env(safe-area-inset-top, 0px)",
                  bottom: "env(safe-area-inset-bottom, 0px)",
                  zIndex: 50, width: 270,
                  background: C.surface, borderRight: `1.5px solid ${C.border}`,
                  display: "flex", flexDirection: "column", overflow: "hidden",
                  boxShadow: "8px 0 32px rgba(15,23,42,.14)"
                }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: 14, borderBottom: `1px solid ${C.border}`, flexShrink: 0
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={16} color={C.blue} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>Work Diary</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.t3, display: "flex", padding: 4
                    }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <SidebarContent {...sidebarProps} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {activeCategory && (
            <div style={{
              background: C.blueLight, borderBottom: `1.5px solid ${C.blueBorder}`,
              padding: "5px 16px", display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: C.blue, fontWeight: 600, flexShrink: 0
            }}>
              <span>Category: {activeCategory}</span>
              <button onClick={clearCategory}
                style={{
                  marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                  color: C.blue, opacity: .7, padding: 0
                }}>
                <X size={13} /> Clear
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <AnimatePresence  >
              <motion.div key={activeNav}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: .13 }}
                style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {activeNav === "mytasks" && <MyTasksScreen {...myTasksProps} />}
                {activeNav === "diaryentry" && (
                  <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                    <TaskTableEntry
                      initialTask={editingTask}
                      onClose={() => { setEditingTask(null); setActiveNav("mytasks"); }}
                      onSave={async (tasks) => {
                        const list = Array.isArray(tasks) ? tasks : [tasks];
                        await handleSave(list);         
                        setEditingTask(null);
                        setActiveNav("mytasks");
                      }}
                      currentUser={currentUser}
                      employees={employees}
                      categoryOptions={categoryList.map(c => c.category)}
                    />
                  </div>
                )}

                {activeNav === "report" && <ReportScreen list={allList} employees={employees} />}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isMobile && <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />}
    </div>
  );
}

export default WorkDiary;

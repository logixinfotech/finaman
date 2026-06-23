// WorkDiary.jsx — Root component
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchWorkDiaries, fetchWorkDiaryById, createWorkDiary, updateWorkDiary,
  fetchUsers, addSubtask, fetchWorkDiaryCategories, 
} from "../../utils/api";
import { alertError, showToast } from "../Reusable/alert";
import { setERPHandlers } from "../../utils/erpShortcuts";
import {
  C, F, newTask, todayStr, useIsMobile,
} from "./WorkDiaryForm";
import {
  SidebarContent, MyTasksScreen,  getCurrentUser,
} from "./DiaryEssentials";
import {SummaryScreen, ReportScreen} from "./WorkDiaryReports";
import {
  BookOpen, CheckSquare, BarChart2, LayoutDashboard, Menu, X,
} from "lucide-react";
 
const NAV = [
  { k:"mytasks", l:"My Tasks",  Icon:CheckSquare },
  { k:"summary", l:"Summary",   Icon:LayoutDashboard },
  { k:"report",  l:"Analytics", Icon:BarChart2 },
  
];

// ─── MobileTopBar ─────────────────────────────────────────────────
const MobileTopBar = ({ activeNav, onHamburger }) => {
  const current = NAV.find(n => n.k === activeNav);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
      background:C.surface, borderBottom:`1.5px solid ${C.border}`,
      flexShrink:0, boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
      <button onClick={onHamburger}
        style={{ background:"none", border:"none", cursor:"pointer", color:C.t2,
          display:"flex", alignItems:"center", padding:4, borderRadius:7 }}>
        <Menu size={20} strokeWidth={2} />
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:C.blueLight,
          display:"flex", alignItems:"center", justifyContent:"center",
          border:`1.5px solid ${C.blueBorder}` }}>
          <BookOpen size={14} color={C.blue} />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, lineHeight:1 }}>Work Diary</div>
          <div style={{ fontSize:10, color:C.t4 }}>FINAMAN ERP</div>
        </div>
      </div>
      {current && (
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
          color:C.blue, fontSize:12, fontWeight:600 }}>
          <current.Icon size={14} strokeWidth={2} />{current.l}
        </div>
      )}
    </div>
  );
};

// ─── Mobile Bottom Nav ────────────────────────────────────────────
const BottomNav = ({ activeNav, setActiveNav }) => (
  <div style={{
    display:"flex", background:C.surface, borderTop:`1.5px solid ${C.border}`,
    flexShrink:0, boxShadow:"0 -2px 10px rgba(12,25,52,.07)",
  }}>
    {NAV.map(n => {
      const active = activeNav === n.k;
      return (
        <button key={n.k} onClick={() => setActiveNav(n.k)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            gap:3, padding:"10px 0 8px", border:"none", cursor:"pointer",
            background:"none", transition:"all .14s",
            color:active ? C.blue : C.t4, fontFamily:F }}>
          <n.Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
          <span style={{ fontSize:10, fontWeight:active ? 700 : 500 }}>{n.l}</span>
          {active && <div style={{ width:20, height:2, borderRadius:1, background:C.blue }} />}
        </button>
      );
    })}
  </div>
);
 
const initialDiaryState = {
  diary_id:      null,
  employee_id:   "",
  employee_name: "",
  department:    "",
  diary_date:    "",
  period_type:   "Daily",
  diary_status:  "Submitted",
  notes:         "",
  manager_remarks: "",
  task_lines:    [],
};
 
function WorkDiary({ tab }) {
  const [activeNav,      setActiveNav]      = useState("mytasks");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [list,           setList]           = useState([]);   // own diaries → Summary tab
  const [allList,        setAllList]        = useState([]);   // all diaries → Report tab
  const [loading,        setLoading]        = useState(true);
  const [employees,      setEmployees]      = useState([]);
  const [formData,       setFormData]       = useState(initialDiaryState);
  const [categoryList,   setCategoryList]   = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSaving,       setIsSaving]       = useState(false); // double-save guard

  const isMobile    = useIsMobile();
  const currentUser = useMemo(() => getCurrentUser(), []);

  // ── Loaders ──────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      const r = await fetchWorkDiaryCategories();
      setCategoryList(Array.isArray(r) ? r : r?.data || []);
    } catch {}
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
    } catch {}
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const r = await fetchUsers();
      setEmployees(Array.isArray(r) ? r : r?.data || []);
    } catch {}
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
      diary_date:    p.diary_date    || todayStr(),
      employee_id:   currentUser?.userma_id || p.employee_id,
      employee_name: currentUser?.user_id   || p.employee_name,
    }));
  }, [currentUser]);
 
  const handleSave = useCallback(async (taskLines, subtaskMap = {}) => {
    // Guard: nothing to save
    if (!Array.isArray(taskLines) || taskLines.length === 0) return;
    // Guard: prevent double-save on fast clicks
    if (isSaving) return;

    setIsSaving(true);
    try {
      const task_lines = taskLines
        .filter(t => t.work_plan?.trim())
        .map(({ _key, _pendingSubtasks, attachment, ...rest }) => rest);

      if (task_lines.length === 0) return;

      const dept = taskLines[0]?.category || formData.department || "";
      const data = {
        ...formData,
        diary_status:  "Submitted",
        task_lines,
        department:    dept,
        employee_id:   currentUser?.userma_id || formData.employee_id,
        employee_name: currentUser?.user_id   || formData.employee_name,
        diary_date:    formData.diary_date     || todayStr(),
      };

      let isEdit = !!data.diary_id;
      let r = isEdit
        ? await updateWorkDiary(data.diary_id, data)
        : await createWorkDiary(data); 
      if (!r?.success) {
        let existingId = r?.diary_id || null;

        // Fallback: if handleApi didn't pass diary_id, fetch from list
        if (!existingId && !isEdit) {
          try {
            const todayDiaries = await fetchWorkDiaries();
            const rows = Array.isArray(todayDiaries) ? todayDiaries : todayDiaries?.data || [];
            const today = data.diary_date || todayStr();
            const found = rows.find(d =>
              String(d.employee_id) === String(data.employee_id) &&
              d.diary_date === today
            );
            if (found?.diary_id) existingId = found.diary_id;
          } catch { /* ignore — will fall through to error */ }
        }

        if (existingId) { 
          setFormData(p => ({ ...p, diary_id: existingId }));
          data.diary_id = existingId;
          isEdit = true;
          r = await updateWorkDiary(existingId, { ...data, diary_id: existingId });
        }
      }

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
          const freshResp  = await fetchWorkDiaryById(savedDiaryId);
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
              await addSubtask({
                line_id:      line.line_id,
                diary_id:     savedDiaryId,
                subtask_text: pending[i],
                sort_order:   i,
              });
            }
          }
        } catch (subErr) {
          console.error("[WorkDiary] Subtask save failed:", subErr.message);
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
    setActiveCategory,
    isSaving,
  }), [currentUser, employees, handleSave, categoryList, activeCategory, isSaving]);

  return (
    <div style={{
      width:"100%",
      height: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 100px)",
      display:"flex", flexDirection:"column",
      background:C.bg, fontFamily:F, overflow:"hidden",
    }}>
      {isMobile && <MobileTopBar activeNav={activeNav} onHamburger={() => setSidebarOpen(true)} />}

      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div style={{ width:220, flexShrink:0, background:C.surface,
            borderRight:`1.5px solid ${C.border}`, display:"flex",
            flexDirection:"column", overflow:"hidden",
            boxShadow:"1px 0 4px rgba(15,23,42,.04)" }}>
            <SidebarContent {...sidebarProps} />
          </div>
        )}
 
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setSidebarOpen(false)}
                style={{ position:"fixed", inset:0, zIndex:40,
                  background:"rgba(15,23,42,.45)", backdropFilter:"blur(4px)" }} />
              <motion.div
                initial={{ x:-270 }} animate={{ x:0 }} exit={{ x:-270 }}
                transition={{ duration:.22, ease:"easeOut" }}
                style={{ position:"fixed", left:0, top:0, bottom:0, zIndex:50, width:270,
                  background:C.surface, borderRight:`1.5px solid ${C.border}`,
                  display:"flex", flexDirection:"column", overflow:"hidden",
                  boxShadow:"8px 0 32px rgba(15,23,42,.14)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:14, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <BookOpen size={16} color={C.blue} />
                    <span style={{ fontSize:14, fontWeight:700, color:C.t1 }}>Work Diary</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)}
                    style={{ background:"none", border:"none", cursor:"pointer",
                      color:C.t3, display:"flex", padding:4 }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ flex:1, overflow:"hidden", minHeight:0, display:"flex", flexDirection:"column" }}>
                  <SidebarContent {...sidebarProps} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
 
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}> 
          {activeCategory && (
            <div style={{ background:C.blueLight, borderBottom:`1.5px solid ${C.blueBorder}`,
              padding:"5px 16px", display:"flex", alignItems:"center", gap:8,
              fontSize:12, color:C.blue, fontWeight:600, flexShrink:0 }}>
              <span>Category: {activeCategory}</span>
              <button onClick={clearCategory}
                style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4, fontSize:12,
                  color:C.blue, opacity:.7, padding:0 }}>
                <X size={13} /> Clear
              </button>
            </div>
          )}
 
          <div style={{ flex:1, overflow:"hidden", minHeight:0, display:"flex", flexDirection:"column" }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeNav}
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:.13 }}
                style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {activeNav === "mytasks" && <MyTasksScreen {...myTasksProps} />}
                {activeNav === "summary" && <SummaryScreen list={list} currentUser={currentUser} />}
                {activeNav === "report"  && <ReportScreen  list={allList} employees={employees} />}

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

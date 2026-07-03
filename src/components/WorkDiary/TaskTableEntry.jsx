
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ERPAutocomplete from "../Reusable/input/ERPAutocomplete";
import ERPDateInput from "../Reusable/input/Date";
import { generateId } from "../../utils/helpers";
import { fetchSubtasks, deleteSubtask } from "../../utils/api";
import { newTask } from "./WorkDiaryForm";
import { Plus, Trash2, Save, X, ListChecks, ClipboardList, Loader2 } from "lucide-react";
import { useGroupOptions } from "../../Hooks/useUserGroupOption";
const T = {
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderHov: "#cbd5e1",
  blue: "#2563eb",
  blueLight: "#eff6ff",
  blueMid: "#1d4ed8",
  navy: "#1e3a5f",
  t1: "#0f172a",
  t2: "#334155",
  t3: "#64748b",
  t4: "#94a3b8",
  font: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'Consolas', monospace",
};

const PRIO_OPTS = ["High", "Medium", "Low"];
const STATUS_OPTS = ["Pending", "In Progress", "Completed", "Hold"];

const PRIO_CFG = {
  High: { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", border: "#fecaca", hov: "#fee2e2" },
  Medium: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b", border: "#fde68a", hov: "#fef3c7" },
  Low: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", border: "#bbf7d0", hov: "#dcfce7" },
};

const STATUS_CFG = {
  Pending: { bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6", border: "#ddd6fe", hov: "#ede9fe" },
  "In Progress": { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", border: "#bfdbfe", hov: "#dbeafe" },
  Completed: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", border: "#bbf7d0", hov: "#dcfce7" },
  Hold: { bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", border: "#fecaca", hov: "#fee2e2" },
};

const StyledDropdown = ({ value, options, onChange, cfgMap, placeholder = "Select…", dense = false, id, className }) => {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pos, setPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trigRef = useRef(null);
  const menuRef = useRef(null);
  const cfg = cfgMap?.[value] || {};

  const openMenu = () => {
    const r = trigRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 156) });
    setOpen(true);
    setActiveIndex(options.indexOf(value) >= 0 ? options.indexOf(value) : 0);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (trigRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);



  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={trigRef}
        id={id}
        name={id}
        role="button"
        tabIndex={0}
        className={className}
        onClick={() => open ? setOpen(false) : openMenu()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); setOpen(false); }}
        onKeyDown={e => {
          if (!open) {
            if (e.key === " " || (e.altKey && e.key === "ArrowDown")) {
              e.preventDefault();
              e.stopPropagation();
              openMenu();
            }
          } else {
            if (e.key === "ArrowDown") {
              e.preventDefault(); e.stopPropagation();
              setActiveIndex(p => (p + 1) % options.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault(); e.stopPropagation();
              setActiveIndex(p => (p - 1 + options.length) % options.length);
            } else if (e.key === "Enter") {
              e.preventDefault(); e.stopPropagation();
              if (activeIndex >= 0) onChange(options[activeIndex]);
              setOpen(false);
            } else if (e.key === "Escape" || e.key === "Tab") {
              e.preventDefault(); e.stopPropagation();
              setOpen(false);
            }
          }
        }}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          cursor: "pointer", userSelect: "none", outline: "none",
          fontFamily: T.font, fontSize: dense ? 12 : 13, fontWeight: 600,
          background: value ? (cfg.bg || undefined) : undefined,
          color: value ? (cfg.color || undefined) : undefined,
          border: (open || isFocused) ? `1.5px solid ${T.blue}` : `1.5px solid ${value ? (cfg.border || T.border) : T.border}`,
          boxShadow: (open || isFocused) ? `0 0 0 3px ${T.blue}33` : "none",
          transition: "all .15s",
        }}>
        {cfg.dot && (
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: .5, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && pos && (
        <div ref={menuRef} style={{
          position: "fixed", zIndex: 99999,
          top: pos.top, left: pos.left, minWidth: pos.width,
          background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 8,
          boxShadow: "0 8px 30px rgba(15,23,42,.14), 0 2px 8px rgba(15,23,42,.08)",
          overflow: "hidden", animation: "ddIn .12s ease-out", transformOrigin: "top left",
        }}>
          <div style={{
            padding: "7px 12px 6px", borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
            textTransform: "uppercase", color: T.t4, fontFamily: T.font, background: T.bg,
          }}>
            {placeholder}
          </div>
          {options.map((opt, i) => {
            const oc = cfgMap?.[opt] || {};
            const selected = value === opt;
            const highlighted = activeIndex === i;
            return (
              <div key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px", cursor: "pointer",
                  fontFamily: T.font, fontSize: 12.5, fontWeight: selected ? 700 : 500,
                  background: highlighted ? T.blueLight : (selected ? (oc.bg || T.blueLight) : T.surface),
                  color: selected ? (oc.color || T.blue) : T.t2,
                  borderLeft: selected ? `3px solid ${oc.dot || T.blue}` : "3px solid transparent",
                }}
                onMouseEnter={() => setActiveIndex(i)}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: oc.dot || T.t4,
                  boxShadow: selected ? `0 0 0 3px ${oc.dot || T.blue}33` : "none",
                }} />
                <span style={{ flex: 1 }}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SectionLabel = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 3, height: 14, borderRadius: 2, background: T.blue, display: "inline-block" }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: T.t3, fontFamily: T.font }}>
        {children}
      </span>
    </div>
    {right}
  </div>
);

const Label = ({ children, required }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, marginBottom: 5, fontFamily: T.font, letterSpacing: ".3px", textTransform: "uppercase" }}>
    {children}{required && <span style={{ color: "#ef4444" }}> *</span>}
  </div>
);

export const TaskTableEntry = ({
  onClose, onSave, currentUser, employees = [], categoryOptions = [], initialTask = null,
}) => {
  const isEditMode = !!initialTask;
  const isViewMode = false;
  const firstInputRef = useRef(null);
  const saveBtnRef = useRef(null);

  const [header, setHeader] = useState(() => initialTask ? {
    work_plan: initialTask.work_plan || "",
    target: initialTask.target || "",
    assigned_to_name: initialTask.assigned_to_name ?? (currentUser?.user_name || currentUser?.user_id || ""),
    assigned_to_id: initialTask.assigned_to_id ?? (currentUser?.userma_id || currentUser?.user_id || null),
    priority: initialTask.priority || "Medium",
    category: initialTask.category || "Development",
    due_date: initialTask.due_date || "",
    expected_time: initialTask.expected_time || "",
    status: initialTask.status || "Pending",
  } : {
    work_plan: "", target: "",
    assigned_to_name: currentUser?.user_name || currentUser?.user_id || "",
    assigned_to_id: currentUser?.userma_id || currentUser?.user_id || null,
    priority: "Medium", category: "Development",
    due_date: "", expected_time: "", status: "Pending",
  });

  const [rows, setRows] = useState([{ _key: generateId(), subtask_text: "", priority: "Medium", status: "Pending" }]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isViewMode && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isViewMode]);

  useEffect(() => {
    if (!initialTask?.line_id) return;
    setSubtasksLoading(true);
    fetchSubtasks(initialTask.line_id)
      .then(r => {
        const existing = (Array.isArray(r) ? r : r?.data || []).map(s => ({
          _key: generateId(), subtask_id: s.subtask_id,
          subtask_text: s.subtask_text, is_done: s.is_done,
          priority: "Medium", status: s.is_done ? "Completed" : "Pending",
        }));
        if (existing.length) setRows(existing);
      })
      .catch(() => { })
      .finally(() => setSubtasksLoading(false));
  }, [initialTask?.line_id]);

  const setH = useCallback((field, value) => {
    setHeader(p => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  }, [errors]);

  const getInputClass = (disabled, field, extraClass = "") => {
    const base = "h-[35px] md:h-[30px] px-2 text-[15px] border rounded-md outline-none transition-all w-full";
    const state = disabled ? "bg-gray-100 cursor-not-allowed border-gray-200" : "bg-white";
    const border = errors[field] ? "border-red-500" : "border-gray-300";
    const focus = !disabled ? "focus:border-blue-50 focus:ring-1 focus:ring-[#1a56db]" : "";
    return `${base} ${state} ${border} ${focus} ${extraClass}`.trim();
  };

  const addRow = useCallback(() => setRows(p => [...p, { _key: generateId(), subtask_text: "", priority: "Medium", status: "Pending" }]), []);

  const delRow = useCallback(key => {
    setRows(p => {
      if (p.length === 1) return p;
      const row = p.find(r => r._key === key);
      if (row?.subtask_id) deleteSubtask(row.subtask_id).catch(() => { });

      const filtered = p.filter(r => r._key !== key);

      // DOM update hone ke baad focus shift karein
      requestAnimationFrame(() => {
        const remainingInputs = document.querySelectorAll('input[name^="subtask_text_"]');
        if (remainingInputs.length > 0) {
          // Sabse last subtask description input par focus laayein
          remainingInputs[remainingInputs.length - 1].focus();
        }
      });

      return filtered;
    });
  }, []);
  const updateRow = useCallback((key, field, val) => setRows(p => p.map(r => r._key === key ? { ...r, [field]: val } : r)), []);

  const handleValidateAndSave = useCallback(() => {
    let newErrors = {};
    let firstEmpty = null;

    if (!header.work_plan?.trim()) {
      newErrors.work_plan = "Required";
      firstEmpty = "work_plan";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[name="${firstEmpty}"]`) || document.getElementById(firstEmpty);
        if (el) el.focus();
      });
      return;
    }
    const validSubtasks = rows
  .filter(r => !r.subtask_id && r.subtask_text?.trim())
  .map(r => ({
    subtask_text:  r.subtask_text.trim(),
    priority:      r.priority      || "Medium",
    status:        r.status        || "Pending",
    due_date:      r.due_date      || null,
    expected_time: r.expected_time || 0,
  }));
    const updatedSubtasks = rows
      .filter(r => r.subtask_id)
      .map(r => ({
        subtask_id: r.subtask_id,
        priority: r.priority,
        status: r.status,
        due_date: r.due_date || null,
        expected_time: r.expected_time || 0,
      }));
    const task = {
      ...newTask(currentUser),
      ...(isEditMode ? { _key: initialTask._key, line_id: initialTask.line_id, diary_id: initialTask.diary_id } : { _key: generateId() }),
      work_plan: header.work_plan?.trim() || "",
      target: header.target?.trim() || "",
      priority: header.priority,
      category: header.category,
      due_date: header.due_date,
      expected_time: header.expected_time,
      status: header.status,
      assign_type: (header.assigned_to_id === (currentUser?.userma_id || currentUser?.user_id)) ? "self" : "assign",
      assigned_to_id: header.assigned_to_id,
      assigned_to_name: header.assigned_to_name,
      assigned_by:      currentUser?.user_id || null,        // login ID — comparison ke liye
assigned_by_name: currentUser?.employee_name || currentUser?.user_id || null,  // display ke liye
      _pendingSubtasks: validSubtasks,
      _updatedSubtasks: updatedSubtasks,
    };
    onSave(task);
  }, [header, rows, currentUser, onSave, isEditMode, initialTask]);

  // ── FOOLPROOF GLOBAL KEYBOARD NAVIGATION ──
  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("task-form-container");
    if (!container) return; 
    if (e.shiftKey && e.key === "Enter") {
      if (e.target.closest('#text') || e.target.closest('.subtask-delete-btn')) {
        e.preventDefault();
        addRow();
        setTimeout(() => {
          const newInputs = document.querySelectorAll('input[name^="subtask_text_"]');
          if (newInputs.length > 0) newInputs[newInputs.length - 1].focus();
        }, 50);
      }
      return;
    } 
    const elements = Array.from(
      container.querySelectorAll("input:not([disabled]):not([type='hidden']), button:not([disabled]), div[role='button'][tabindex='0']")
    ).filter(el => el.tabIndex !== -1);

    const currentIndex = elements.findIndex(el => el === e.target);

    // ENTER -> Move to NEXT Field
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      if (currentIndex > -1 && currentIndex < elements.length - 1) {
        elements[currentIndex + 1].focus();
      } else if (currentIndex === elements.length - 1) {

        const btn = document.querySelector("#save-task-btn")
        btn.focus();
      }
    } 
    if (e.shiftKey && e.key === "Backspace") {
      let shouldGoBack = true;
      if (e.target.tagName === "INPUT" && (e.target.type === "text" || e.target.type === "number")) {
        if (e.target.value !== "" && !(e.target.selectionStart === 0 && e.target.selectionEnd === 0)) {
          shouldGoBack = false;
        }
      } 
      e.preventDefault();
      elements[currentIndex - 1].focus();
    }

  }, [isViewMode, addRow, handleValidateAndSave]);

  const { loading, options } = useGroupOptions();
  const validRows = rows.filter(r => r.subtask_text?.trim()).length;


  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }} transition={{ duration: .16 }}
      style={{
        display: "flex", flexDirection: "column",
        background: T.surface, borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: "0 20px 60px rgba(15,23,42,.14), 0 4px 16px rgba(15,23,42,.08)",
        overflow: "hidden", width: "100%", height: "100%",
      }}>

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px", height: 48, background: T.navy, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: "#ffffff18", border: "1px solid #ffffff22",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <ListChecks size={15} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
            {isEditMode ? "Edit task" : "New task"}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close"
          style={{
            width: 28, height: 28, borderRadius: 5, background: "transparent",
            border: "1px solid #ffffff30", cursor: "pointer", color: "#93b8d8",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all .14s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#c0392b"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#93b8d8"; }}>
          <X size={14} />
        </button>
      </div>

      <div id="task-form-container" onKeyDown={handleKeyDown} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        <div className="task-form-wrapper">
          <div className="resp-grid-2 sm:resp-grid-2">
            <div>
              <Label>Assign to</Label>
              <ERPAutocomplete
                name="assigned_to"
                value={header.assigned_to_name || ""}
                options={employees.map(e => e.user_name || e.user_id || e.Led_name).filter(Boolean)}
                onChange={val => {
                  const emp = employees.find(e => (e.user_name || e.user_id || e.Led_name) === val);
                  setH("assigned_to_name", val);
                  setH("assigned_to_id", emp?.userma_id || emp?.user_id || null);
                }}
                placeholder="Search employee…"
                className={getInputClass(isViewMode, 'assigned_to')}
                style={{ fontFamily: T.font, color: T.t1 }}
              />
            </div>
            <div>
              <Label>Category</Label>
              <ERPAutocomplete
                name="category"
                value={header.category}
                options={(options.department || []).map((g) => g.label)}
                onChange={v => setH("category", v)}
                placeholder="Category…"
                className={getInputClass(isViewMode, 'category')}
                style={{ fontFamily: T.font, color: T.t1 }}
              />
            </div>
            <div>
              <Label required>Subject</Label>
              <input
                ref={firstInputRef}
                name="work_plan"
                id="work_plan"
                value={header.work_plan}
                onChange={e => setH("work_plan", e.target.value)}
                placeholder="What needs to be done?"
                className={getInputClass(isViewMode, 'work_plan')}
                style={{ fontFamily: T.font }}
              />
            </div>
            <div>
              <Label>Description</Label>
              <input
                name="target"
                value={header.target}
                onChange={e => setH("target", e.target.value)}
                placeholder="Expected deliverable…"
                className={getInputClass(isViewMode, 'target')}
                style={{ fontFamily: T.font }}
              />
            </div>
          </div>


        </div>

        <div className="subtask-section-wrapper">
          <div className="subtask-table-container">
            <div className="subtask-table-scroll">
              <div className="subtask-table-inner">
                <div className="resp-subtask-grid" style={{
                  background: "#f8fafc", borderBottom: `1.5px solid ${T.border}`,
                  padding: "7px 14px", flexShrink: 0,
                }}>
                  {["Subtask description", "Priority", "Status", "Due Date", "Exp. hrs", ""].map((h, i) => (
                    <div key={i} style={{
                      fontSize: 10, fontWeight: 700, color: T.t4,
                      textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: T.font,
                      paddingRight: i < 3 ? 10 : 0,
                    }}>{h}</div>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: "auto", minHeight: 160 }}>
                  {rows.map((row, idx) => (
                    <div key={row._key}
                      className="resp-subtask-grid"
                      style={{
                        borderBottom: `1px solid #f1f5f9`,
                        background: row.subtask_id ? "#f0f7ff" : (idx % 2 === 0 ? T.surface : T.bg),
                        alignItems: "center", padding: "4px 14px", minHeight: 46,
                        transition: "background .12s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                      onMouseLeave={e => e.currentTarget.style.background = row.subtask_id ? "#f0f7ff" : (idx % 2 === 0 ? T.surface : T.bg)}>

                      <div style={{ paddingRight: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        {row.subtask_id && <ClipboardList size={11} color={T.t4} style={{ flexShrink: 0 }} />}
                        <div style={{ flex: 1 }}>
                          <input
                            name={`subtask_text_${idx}`}
                            type="text"
                            id="text"
                            value={row.subtask_text}
                            onChange={e => updateRow(row._key, "subtask_text", e.target.value)}
                            placeholder={`Subtask ${idx + 1}…`}
                            className={getInputClass(false, `subtask_text_${idx}`)}
                            style={{ fontFamily: T.font }}
                          />
                        </div>
                      </div>

                      <div style={{ paddingRight: 10 }}>
                        <StyledDropdown
                          id={`subtask_priority_${idx}`}
                          className={getInputClass(false, `subtask_priority_${idx}`)}
                          value={row.priority}
                          options={PRIO_OPTS}
                          onChange={v => updateRow(row._key, "priority", v)}
                          cfgMap={PRIO_CFG}
                          placeholder="Priority"
                          dense
                        />
                      </div>

                      <div style={{ paddingRight: 10 }}>
                        <StyledDropdown
                          id={`subtask_status_${idx}`}
                          className={getInputClass(false, `subtask_status_${idx}`)}
                          value={row.status}
                          options={STATUS_OPTS}
                          onChange={v => updateRow(row._key, "status", v)}
                          cfgMap={STATUS_CFG}
                          placeholder="Status"
                          dense
                        />
                      </div>

                      <div style={{ paddingRight: 10 }}>
                        <ERPDateInput
                          name={`due_date_${idx}`}
                          value={row.due_date || ""}
                          onChange={v => updateRow(row._key, "due_date", v)}
                          className={getInputClass(false, `due_date_${idx}`)}
                          style={{ fontFamily: T.font, color: T.t1 }}
                        />
                      </div>

                      <div style={{ paddingRight: 10 }}>
                        <input
                          name={`expected_time_${idx}`}
                          type="text" inputMode="decimal"
                          value={row.expected_time || ""}
                          onChange={e => updateRow(row._key, "expected_time", e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="2.5"
                          className={getInputClass(false, `expected_time_${idx}`)}
                          style={{ fontFamily: T.fontMono, textAlign: "center" }}
                        />
                      </div>

                      <button
                        type="button"
                        name={`subtask_delete_${idx}`}
                        title="Delete subtask"
                        onClick={() => delRow(row._key)}
                        className="subtask-delete-btn"
                        style={{
                          width: 28, height: 28, borderRadius: 6, outline: "none",
                          border: `1px solid ${T.border}`, background: T.bg,
                          cursor: rows.length === 1 ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: rows.length === 1 ? T.t4 : "#b91c1c",
                          opacity: rows.length === 1 ? .4 : 1, transition: "all .14s",
                        }}
                        onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blue}33`}
                        onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                        onMouseEnter={e => { if (rows.length > 1) { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border; }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-wrapper">
        <button
          type="button"
          onClick={addRow}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 15px",
            borderRadius: 6, border: `1.5px dashed ${T.blue}66`,
            background: T.blueLight, color: T.blue, outline: "none",
            cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: T.font,
            transition: "all .14s",
          }}
          onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blue}33`}
          onBlur={e => e.currentTarget.style.boxShadow = 'none'}
          onMouseEnter={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.blue; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.blueLight; e.currentTarget.style.color = T.blue; e.currentTarget.style.borderColor = `${T.blue}66`; }}>
          <Plus size={13} />Subtask<sub>(Shift+enter)</sub>
        </button>

        <div className="footer-actions">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: 6, outline: "none",
              border: `1.5px solid ${T.border}`, background: "transparent",
              color: T.t3, cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: T.font,
              transition: "all .14s",
            }}
            onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blue}33`}
            onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            onMouseEnter={e => { e.currentTarget.style.background = T.bg; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            Cancel
          </button>

          <button
            type="button"
            id="save-task-btn"
            ref={saveBtnRef}
            onClick={handleValidateAndSave}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && e.shiftKey) {
                e.preventDefault();
                const container = document.getElementById("task-form-container");
                if (container) {
                  const elements = Array.from(
                    container.querySelectorAll("input:not([disabled]):not([type='hidden']), button:not([disabled]), div[role='button'][tabindex='0']")
                  ).filter(el => el.tabIndex !== -1);
                  if (elements.length > 0) elements[elements.length - 1].focus();
                }
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 22px", borderRadius: 6, border: "none", outline: "none",
              background: T.blue, color: "#fff", cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, fontFamily: T.font,
              boxShadow: `0 4px 14px ${T.blue}40`, transition: "all .15s",
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blue}33, 0 4px 14px ${T.blue}40`; }}
            onBlur={e => { e.currentTarget.style.boxShadow = `0 4px 14px ${T.blue}40`; }}
            onMouseEnter={e => { e.currentTarget.style.background = T.blueMid; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.blue; }}>
            <Save size={13} />
            {isEditMode ? "Update task" : "Save task"}
            {validRows > 0 ? ` + ${validRows}` : ""}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ddIn { from { opacity:0; transform:scale(.97) translateY(-3px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes tteSpin { to { transform:rotate(360deg); } }

        .task-form-wrapper { padding: 18px 18px 14px; border-bottom: 1px solid ${T.border}; flex-shrink: 0; }
        .subtask-section-wrapper { flex: 1; display: flex; flex-direction: column; padding: 16px 18px 0; }
        
        .resp-grid-2 { display: grid; grid-template-columns: 150px 150px 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .resp-grid-6 { display: grid; grid-template-columns: 1.2fr 0.9fr 1fr 1fr 0.6fr 0.9fr; gap: 12px; }
        
        .subtask-table-container { border: 1.5px solid ${T.border}; border-radius: 8px; overflow: hidden; flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .subtask-table-scroll { overflow-x: auto; flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .subtask-table-inner { min-width: 600px; display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .resp-subtask-grid { display: grid; grid-template-columns: 1fr 100px 100px 125px 60px 38px; }
        
        .footer-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-top: 1.5px solid ${T.border}; background: ${T.surface}; flex-shrink: 0; margin-top: 16px; flex-wrap: wrap; gap: 12px; }
        .footer-actions { display: flex; align-items: center; gap: 10px; }

        @media (max-width: 1024px) {
          .resp-grid-6 { grid-template-columns: 1fr 1fr 1fr; }
        }
        
        @media (max-width: 768px) {
          .task-form-wrapper { padding: 14px 14px 10px; }
          .subtask-section-wrapper { padding: 12px 14px 0; }
          .resp-grid-2 { grid-template-columns: 1fr 1fr; }
          .resp-grid-6 { grid-template-columns: 1fr 1fr; }
          
          .footer-wrapper { padding: 12px 14px; flex-direction: column; }
          .footer-wrapper > button { width: 100%; justify-content: center; margin-bottom: 8px; }
          .footer-actions { width: 100%; justify-content: space-between; gap: 12px; }
          .footer-actions > button { flex: 1; justify-content: center; }
        }

        @media (max-width: 480px) {
          .resp-grid-6 { grid-template-columns: 1fr 1fr; }
          .footer-actions { flex-direction: column; }
          .footer-actions > button { width: 100%; }
        }
      `}</style>
    </motion.div>
  );
};

export default TaskTableEntry;
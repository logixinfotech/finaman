import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ERPAutocomplete from "../Reusable/input/ERPAutocomplete";
import { generateId } from "../../utils/helpers";
import { fetchSubtasks, deleteSubtask } from "../../utils/api";
import { newTask } from "./WorkDiaryForm";
import {
  Plus, Trash2, Save, X, ListChecks, ClipboardList, ListTree,
  CalendarDays, ChevronLeft, ChevronRight, Clock3,
} from "lucide-react";
import { useGroupOptions } from "../../Hooks/useUserGroupOption";

// ── Professional light palette — borders now carry a bit more structure so the form
// doesn't read as flat/all-white, while staying clean ──
const T = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  fieldBg: "#F3F4F6",
  fieldBgHover: "#ECEDF1",
  line: "#E5E7EB",
  lineStrong: "#D7DAE0",
  lineSoft: "#F1F2F4",
  accent: "#4F46E5",
  accentHover: "#4338CA",
  accentTint: "#EEF2FF",
  danger: "#DC2626",
  dangerTint: "#FEF2F2",
  t1: "#111827",
  t2: "#374151",
  t3: "#6B7280",
  t4: "#9CA3AF",
  font: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'Consolas', monospace",
};

const PRIO_OPTS = ["High", "Medium", "Low"];
const STATUS_OPTS = ["Pending", "In Progress", "Completed", "Hold"];

const PRIO_CFG = {
  High: { bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
  Medium: { bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  Low: { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
};

const STATUS_CFG = {
  Pending: { bg: "#F5F3FF", color: "#6D28D9", dot: "#8B5CF6" },
  "In Progress": { bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  Completed: { bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
  Hold: { bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
};

const autoResize = (el) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
};

const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const todayISO = () => {
  const t = new Date();
  return toISODate(t.getFullYear(), t.getMonth(), t.getDate());
};
// DD-MM-YYYY ↔ ISO helpers — matches the manual-entry convention already used on the PO form
const formatISOtoDMY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};
const autoFormatTyping = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return digits;
};
const parseDMY = (text) => {
  const m = text.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10) - 1, yyyy = parseInt(m[3], 10);
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return null;
  return toISODate(yyyy, mm, dd);
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
 
const ProDateInput = ({ name, value, onChange, placeholder = "DD-MM-YYYY", error, dense = true }) => {
  const [text, setText] = useState(() => formatISOtoDMY(value));
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [viewDate, setViewDate] = useState(() => value ? new Date(`${value}T00:00:00`) : new Date());
  const wrapRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    setText(formatISOtoDMY(value));
    setInvalid(false);
  }, [value]);

  const commit = (raw) => {
    if (!raw.trim()) { setInvalid(false); onChange(""); return; }
    const iso = parseDMY(raw);
    if (iso) { setInvalid(false); onChange(iso); }
    else { setInvalid(true); }
  };

  const openCal = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) {
      const popWidth = 260;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - popWidth - 8);
      setPos({ top: r.bottom + 6, left });
    }
    setViewDate(value ? new Date(`${value}T00:00:00`) : new Date());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        className={`field-input ${dense ? "field-dense" : ""} ${(error || invalid) ? "field-error" : ""}`}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
        <input
          name={name}
          value={text}
          onChange={(e) => setText(autoFormatTyping(e.target.value))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { commit(e.target.value); return; }
            if (e.key === "Escape" && open) { e.preventDefault(); setOpen(false); }
          }}
          placeholder={placeholder}
          style={{
            border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0,
            fontFamily: T.fontMono, fontSize: dense ? 12.5 : 13.5, color: T.t1,
          }}
        />
        <button type="button" data-nav-skip="true" aria-label="Open calendar"
          onClick={() => (open ? setOpen(false) : openCal())}
          style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", padding: 0, flexShrink: 0 }}>
          <CalendarDays size={13} color={value ? T.accent : T.t4} />
        </button>
      </div>

      {open && pos && (
        <div ref={popRef} className="date-popover" style={{
          position: "fixed", zIndex: 99999, top: pos.top, left: pos.left, width: 260,
          background: T.surface, borderRadius: 10, border: `1px solid ${T.line}`,
          boxShadow: "0 12px 32px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.05)",
          padding: 12, fontFamily: T.font,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" data-nav-skip="true" onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={navBtnStyle}><ChevronLeft size={14} /></button>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1 }}>{MONTH_NAMES[month]} {year}</div>
            <button type="button" data-nav-skip="true" onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={navBtnStyle}><ChevronRight size={14} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ fontSize: 10, fontWeight: 700, color: T.t4, textAlign: "center", padding: "4px 0" }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISODate(year, month, d);
              const selected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  type="button" key={i} data-nav-skip="true"
                  onClick={() => { onChange(iso); setOpen(false); }}
                  style={{
                    height: 28, borderRadius: 7, border: "none", cursor: "pointer",
                    fontSize: 12, fontFamily: T.font, fontWeight: selected ? 700 : 500,
                    background: selected ? T.accent : (isToday ? T.accentTint : "transparent"),
                    color: selected ? "#fff" : (isToday ? T.accent : T.t2),
                  }}>{d}</button>
              );
            })}
          </div>
          <button type="button" data-nav-skip="true" onClick={() => { onChange(today); setOpen(false); }}
            style={{
              marginTop: 8, width: "100%", padding: "7px 0", borderRadius: 7,
              border: `1px solid ${T.line}`, background: "transparent",
              color: T.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            }}>
            Today
          </button>
        </div>
      )}
    </div>
  );
};

const navBtnStyle = {
  width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent",
  color: "#6B7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};

const StyledDropdown = ({ value, options, onChange, cfgMap, placeholder = "Select…", dense = false, id, error }) => {
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
        data-nav-skip={open ? "true" : undefined}
        className={`field-input ${dense ? "field-dense" : ""} ${error ? "field-error" : ""}`}
        onClick={() => open ? setOpen(false) : openMenu()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); setOpen(false); }}
        onKeyDown={e => {
          if (!open) {
            if (e.key === " " || (e.altKey && e.key === "ArrowDown")) {
              e.preventDefault(); e.stopPropagation();
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
          cursor: "pointer", userSelect: "none",
          fontWeight: 600,
          background: value ? (cfg.bg || undefined) : undefined,
          color: value ? (cfg.color || undefined) : undefined,
          borderColor: (open || isFocused) ? T.accent : T.line,
          boxShadow: (open || isFocused) ? `0 0 0 3px ${T.accentTint}` : "none",
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
        <div ref={menuRef} className="dropdown-popover" style={{
          position: "fixed", zIndex: 99999,
          top: pos.top, left: pos.left, minWidth: pos.width,
          background: T.surface, border: `1px solid ${T.line}`, borderRadius: 8,
          boxShadow: "0 8px 30px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.05)",
          overflow: "hidden", transformOrigin: "top left",
        }}>
          <div style={{
            padding: "7px 12px 6px", borderBottom: `1px solid ${T.lineSoft}`,
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
                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px", cursor: "pointer",
                  fontFamily: T.font, fontSize: 12.5, fontWeight: selected ? 700 : 500,
                  background: highlighted ? T.accentTint : (selected ? (oc.bg || T.accentTint) : T.surface),
                  color: selected ? (oc.color || T.accent) : T.t2,
                  borderLeft: selected ? `3px solid ${oc.dot || T.accent}` : "3px solid transparent",
                }}
                onMouseEnter={() => setActiveIndex(i)}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: oc.dot || T.t4,
                  boxShadow: selected ? `0 0 0 3px ${oc.dot || T.accent}33` : "none",
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

const Label = ({ children, required }) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.t3, marginBottom: 6, fontFamily: T.font, letterSpacing: ".2px" }}>
    {children}{required && <span style={{ color: T.danger }}> *</span>}
  </div>
);

export const TaskTableEntry = ({
  onClose, onSave, currentUser, employees = [], categoryOptions = [], initialTask = null,
}) => {
  const isEditMode = !!initialTask;
  const isViewMode = false;
  const assignRef = useRef(null);
  const saveBtnRef = useRef(null);

  const [header, setHeader] = useState(() => initialTask ? {
    assigned_to_name: initialTask.assigned_to_name ?? (currentUser?.user_name || currentUser?.user_id || ""),
    assigned_to_id: initialTask.assigned_to_id ?? (currentUser?.userma_id || currentUser?.user_id || null),
    category: initialTask.category || "Development",
  } : {
    assigned_to_name: currentUser?.user_name || currentUser?.user_id || "",
    assigned_to_id: currentUser?.userma_id || currentUser?.user_id || null,
    category: "Development",
  });

  const makeEmptyRow = () => ({
    _key: generateId(),
    subtask_id: null,
    subtask_text: "",
    priority: "Medium",
    status: "Pending",
    due_date: "",
    due_time: "",
    assign_date: todayISO(),
  });

  const [rows, setRows] = useState(() => {
    if (initialTask) {
      const dueRaw = initialTask.due_date || "";
      const assignRaw = initialTask.assign_datetime || initialTask.created_at || "";
      const first = {
        _key: generateId(),
        subtask_id: initialTask.line_id || null,
        subtask_text: initialTask.work_plan || "",
        priority: initialTask.priority || "Medium",
        status: initialTask.status || "Pending",
        due_date: dueRaw ? dueRaw.slice(0, 10) : "",
        due_time: dueRaw.length > 10 ? dueRaw.slice(11, 16) : "",
        assign_date: assignRaw ? assignRaw.slice(0, 10) : todayISO(),
      };
      return [first, ...Array.from({ length: 4 }, makeEmptyRow)];
    }
    return Array.from({ length: 5 }, makeEmptyRow);
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isViewMode && assignRef.current) assignRef.current.focus?.();
  }, [isViewMode]);

  const setH = useCallback((field, value) => setHeader(p => ({ ...p, [field]: value })), []);

  const addRow = useCallback(() => setRows(p => [...p, makeEmptyRow()]), []);

  const delRow = useCallback(key => {
    setRows(p => {
      if (p.length === 1) return p;
      const filtered = p.filter(r => r._key !== key);
      requestAnimationFrame(() => {
        const remaining = document.querySelectorAll('[name^="subtask_text_"]');
        if (remaining.length > 0) remaining[remaining.length - 1].focus();
      });
      return filtered;
    });
  }, []);

  const updateRow = useCallback((key, field, val) => setRows(p => p.map(r => r._key === key ? { ...r, [field]: val } : r)), []);

  // ── Row ke andar jitne bhi focusable fields hain unhe DOM order me dhoondo.
  // Delete button aur calendar/dropdown popovers ko [data-nav-skip] se exclude kiya hai.
  const getRowFocusables = useCallback((rowEl) => {
    if (!rowEl) return [];
    return Array.from(
      rowEl.querySelectorAll(
        'input:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([data-nav-skip]), [tabindex]:not([tabindex="-1"]):not([data-nav-skip])'
      )
    );
  }, []);

  const focusNextInRow = useCallback((currentEl, rowIdx) => {
    const container = document.getElementById("task-form-container");
    if (!container) return;

    const rowEl = container.querySelector(`[data-row="${rowIdx}"]`);
    const focusables = getRowFocusables(rowEl);
    const curIdx = currentEl ? focusables.indexOf(currentEl) : -1;

    if (curIdx !== -1 && curIdx < focusables.length - 1) {
      focusables[curIdx + 1]?.focus();
      return;
    }

    const nextRowEl = container.querySelector(`[data-row="${rowIdx + 1}"]`);
    if (nextRowEl) {
      const nextFocusables = getRowFocusables(nextRowEl);
      nextFocusables[0]?.focus();
      return;
    }

    addRow();
    setTimeout(() => {
      const newRowEl = document.querySelector(`[data-row="${rowIdx + 1}"]`);
      const newFocusables = getRowFocusables(newRowEl);
      newFocusables[0]?.focus();
    }, 60);
  }, [addRow, getRowFocusables]);
  const handleTextareaKeyDown = useCallback((e, rowKey, rowIdx) => {
    if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      const { selectionStart, selectionEnd, value } = el;
      const beforeCursor = value.slice(0, selectionStart);
      const lastLine = beforeCursor.slice(beforeCursor.lastIndexOf("\n") + 1);
      const bulletMatch = lastLine.match(/^(\s*)-\s/);

      let insert;
      if (bulletMatch) {
        // pichli line already bullet thi -> agli line bhi bullet se shuru hogi
        insert = `\n${bulletMatch[1]}- `;
      } else if (lastLine.trim() === "") {
        // khali line pe Shift+Enter -> list khatam, plain newline
        insert = "\n";
      } else {
        // pehli bar list shuru ho rahi hai
        insert = "\n- ";
      }

      const newValue = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
      updateRow(rowKey, "subtask_text", newValue);

      requestAnimationFrame(() => {
        const caret = selectionStart + insert.length;
        el.selectionStart = el.selectionEnd = caret;
        autoResize(el);
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      focusNextInRow(e.target, rowIdx);
      return;
    }
  }, [focusNextInRow, updateRow]);

  const handleValidateAndSave = useCallback(() => {
    const filledRows = rows.filter(r => r.subtask_text?.trim());

    if (filledRows.length === 0) {
      setErrors({ subtask_text_0: "Required" });
      requestAnimationFrame(() => {
        const el = document.querySelector(`[name="subtask_text_0"]`);
        if (el) el.focus();
      });
      return;
    }
    setErrors({});

    const tasks = filledRows.map(r => ({
      ...newTask(currentUser),
      ...(r.subtask_id
        ? { _key: r._key, line_id: r.subtask_id, diary_id: initialTask?.diary_id }
        : { _key: r._key }),
      work_plan: r.subtask_text.trim(),
      target: "",
      priority: r.priority,
      category: header.category,
      due_date: r.due_date ? `${r.due_date}T${r.due_time || "00:00"}:00` : null,
      assign_datetime: r.assign_date ? `${r.assign_date}T00:00:00` : null,
      expected_time: 0,
      status: r.status,
      assign_type: (header.assigned_to_id === (currentUser?.userma_id || currentUser?.user_id)) ? "self" : "assign",
      assigned_to_id: header.assigned_to_id,
      assigned_to_name: header.assigned_to_name,
      assigned_by: currentUser?.user_id || null,
      assigned_by_name: currentUser?.employee_name || currentUser?.user_id || null,
    }));

    onSave(tasks);
  }, [rows, header, currentUser, onSave, initialTask]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;

    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      handleValidateAndSave();
      return;
    }

    if (e.target.tagName === "TEXTAREA") return;

    const rowEl = e.target.closest("[data-row]");
    const rowIdx = rowEl ? parseInt(rowEl.dataset.row, 10) : null;

    if (e.key === "Enter" && !e.shiftKey && rowIdx !== null) {
      e.preventDefault();
      e.stopPropagation();
      focusNextInRow(e.target, rowIdx);
    }
  }, [isViewMode, focusNextInRow, handleValidateAndSave]);

  const { loading, options } = useGroupOptions();
  const validRows = rows.filter(r => r.subtask_text?.trim()).length;

  // ── Grid template depends on mode — Status column only in Edit mode ──
  const gridTemplate = isEditMode
    ? "26px 1fr 132px 132px 88px 108px 108px 34px"
    : "26px 1fr 132px 132px 88px 108px 34px";

  const colHeaders = isEditMode
    ? ["#", "Task", "Assigned on", "Due date", "Due time", "Priority", "Status", ""]
    : ["#", "Task", "Assigned on", "Due date", "Due time", "Priority", ""];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }} transition={{ duration: .16 }}
      style={{
        display: "flex", flexDirection: "column",
        background: T.surface, borderRadius: 12,
        border: `1px solid ${T.line}`,
        boxShadow: "0 12px 32px rgba(15,23,42,.08), 0 2px 8px rgba(15,23,42,.04)",
        overflow: "hidden", width: "100%", height: "100%",
      }}>

<div style={{
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 16px", flexShrink: 0, borderBottom: `1px solid ${T.line}`,
  background: T.bg,
}}>
  <div style={{
    width: 26, height: 26, borderRadius: 7,
    background: T.accentTint, border: `1px solid ${T.accent}22`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <ListChecks size={14} color={T.accent} strokeWidth={2.2} />
  </div>
  <div style={{ minWidth: 0, flex: 1 }}>
    <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.t1, lineHeight: 1.2 }}>
      {isEditMode ? "Edit task" : "New task"}
    </div>
  </div>
  {validRows > 0 && (
    <div style={{
      fontFamily: T.fontMono, fontSize: 10.5, color: T.accent, background: T.accentTint,
      border: `1px solid ${T.accent}33`,
      padding: "2px 8px", borderRadius: 20, fontWeight: 600,
    }}>
      {validRows}/{rows.length} filled
    </div>
  )}
  <button onClick={onClose} aria-label="Close"
    style={{
      width: 26, height: 26, borderRadius: 7, background: T.surface,
      border: `1px solid ${T.line}`, cursor: "pointer", color: T.t3,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = T.dangerTint; e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = `${T.danger}55`; }}
    onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.t3; e.currentTarget.style.borderColor = T.line; }}>
    <X size={15} />
  </button>
</div>

      <div id="task-form-container" onKeyDown={handleKeyDown} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        <div className="task-form-wrapper">
          <div className="resp-grid-2">
            <div>
              <Label>Assign to</Label>
              <ERPAutocomplete
                ref={assignRef}
                name="assigned_to"
                value={header.assigned_to_name || ""}
                options={employees.map(e => e.user_name || e.user_id || e.Led_name).filter(Boolean)}
                onChange={val => {
                  const emp = employees.find(e => (e.user_name || e.user_id || e.Led_name) === val);
                  setH("assigned_to_name", val);
                  setH("assigned_to_id", emp?.userma_id || emp?.user_id || null);
                }}
                placeholder="Search employee…"
                className="field-input"
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
                className="field-input"
              />
            </div>
          </div>

        </div>

        <div className="subtask-section-wrapper">
          <div className="subtask-table-container">
            <div className="subtask-table-scroll">
              <div className="subtask-table-inner" style={{ minWidth: isEditMode ? 860 : 760 }}>
                <div className="resp-subtask-grid subtask-header-row" style={{
                  gridTemplateColumns: gridTemplate,
                  borderBottom: `1px solid ${T.line}`,
                  padding: "9px 14px", flexShrink: 0,
                  background: T.bg,
                }}>
                  {colHeaders.map((h, i) => (
                    <div key={i} style={{
                      fontSize: 10.5, fontWeight: 700, color: T.t4,
                      textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: T.font,
                      paddingRight: i < colHeaders.length - 1 ? 10 : 0,
                    }}>{h}</div>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
                  {rows.map((row, idx) => (
                    <div key={row._key}
                      data-row={idx}
                      className="resp-subtask-grid subtask-data-row"
                      style={{
                        gridTemplateColumns: gridTemplate,
                        borderBottom: `1px solid ${T.lineSoft}`,
                        background: row.subtask_id ? T.accentTint : "transparent",
                        borderLeft: row.subtask_id ? `3px solid ${T.accent}` : "3px solid transparent",
                        alignItems: "start", padding: "10px 14px", minHeight: 52,
                        transition: "background .12s",
                      }}
                      onMouseEnter={e => { if (!row.subtask_id) e.currentTarget.style.background = T.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = row.subtask_id ? T.accentTint : "transparent"; }}>

                      <div className="subtask-idx-cell" style={{ fontFamily: T.fontMono, fontSize: 11, color: T.t4, paddingTop: 11 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>

                      <div className="subtask-cell" data-label="Task" style={{ paddingRight: 10, display: "flex", alignItems: "start", gap: 6 }}>
                        {row.subtask_id && <ClipboardList size={12} color={T.accent} style={{ flexShrink: 0, marginTop: 10 }} />}
                        <textarea
                          ref={el => autoResize(el)}
                          name={`subtask_text_${idx}`}
                          rows={1}
                          value={row.subtask_text}
                          onChange={e => { updateRow(row._key, "subtask_text", e.target.value); autoResize(e.target); }}
                          onKeyDown={e => handleTextareaKeyDown(e, row._key, idx)}
                          placeholder={`Task ${idx + 1}…  `}
                          className={`field-input field-textarea ${errors[`subtask_text_${idx}`] ? "field-error" : ""}`}
                        />
                      </div>

                     <div className="subtask-cell" data-label="Assigned on" style={{ paddingRight: 10 }}>
  <ProDateInput
    name={`assign_date_${idx}`}
    value={row.assign_date || ""}
    onChange={v => updateRow(row._key, "assign_date", v)}
    placeholder="DD-MM-YYYY"
  />
</div>

<div className="subtask-cell" data-label="Due date" style={{ paddingRight: 10 }}>
  <ProDateInput
    name={`due_date_${idx}`}
    value={row.due_date || ""}
    onChange={v => updateRow(row._key, "due_date", v)}
    placeholder="DD-MM-YYYY"
  />
</div>

                      <div className="subtask-cell" data-label="Due time" style={{ paddingRight: 10 }}>
                        <div className="field-input field-dense" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>

                          <input
                            name={`due_time_${idx}`}
                            type="time"
                            value={row.due_time || ""}
                            onChange={e => updateRow(row._key, "due_time", e.target.value)}
                            style={{
                              border: "none", outline: "none", background: "transparent",
                              width: "100%", fontFamily: T.fontMono, fontSize: 12, color: T.t1,
                            }}
                          />
                        </div>
                      </div>

                      <div className="subtask-cell" data-label="Priority" style={{ paddingRight: 10 }}>
                        <StyledDropdown
                          id={`subtask_priority_${idx}`}
                          value={row.priority}
                          options={PRIO_OPTS}
                          onChange={v => updateRow(row._key, "priority", v)}
                          cfgMap={PRIO_CFG}
                          placeholder="Priority"
                          dense
                        />
                      </div>

                      {isEditMode && (
                        <div className="subtask-cell" data-label="Status" style={{ paddingRight: 10 }}>
                          <StyledDropdown
                            id={`subtask_status_${idx}`}
                            value={row.status}
                            options={STATUS_OPTS}
                            onChange={v => updateRow(row._key, "status", v)}
                            cfgMap={STATUS_CFG}
                            placeholder="Status"
                            dense
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        name={`subtask_delete_${idx}`}
                        title="Remove row"
                        data-nav-skip="true"
                        onClick={() => delRow(row._key)}
                        className="subtask-delete-btn"
                        style={{
                          width: 30, height: 30, borderRadius: 7, outline: "none", marginTop: 3,
                          border: `1px solid ${T.line}`, background: T.surface,
                          cursor: rows.length === 1 ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: rows.length === 1 ? T.t4 : T.t3,
                          opacity: rows.length === 1 ? .4 : 1, transition: "all .14s",
                        }}
                        onMouseEnter={e => { if (rows.length > 1) { e.currentTarget.style.background = T.dangerTint; e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = `${T.danger}55`; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.t3; e.currentTarget.style.borderColor = T.line; }}>
                        <Trash2 size={13} />
                        <span className="subtask-delete-label">Remove row</span>
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
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
            borderRadius: 8, border: `1px dashed ${T.accent}66`,
            background: T.accentTint, color: T.accent, outline: "none",
            cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: T.font,
            transition: "all .14s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.accentTint; e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = `${T.accent}66`; }}>
          <Plus size={13} />Add row
        </button>

        <div className="footer-actions">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 8, outline: "none",
              border: `1px solid ${T.line}`, background: T.surface,
              color: T.t3, cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: T.font,
              transition: "all .14s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.fieldBg; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}>
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
                    container.querySelectorAll("input:not([disabled]):not([type='hidden']), textarea:not([disabled]), button:not([disabled]), div[role='button'][tabindex='0']")
                  ).filter(el => el.tabIndex !== -1);
                  if (elements.length > 0) elements[elements.length - 1].focus();
                }
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 24px", borderRadius: 8, border: "none", outline: "none",
              background: T.accent, color: "#fff", cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, fontFamily: T.font,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.accentHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.accent; }}>
            <Save size={13} />
            {isEditMode ? "Update tasks" : "Save tasks"}
            {validRows > 0 ? ` (${validRows})` : ""}
          </button>
        </div>
      </div>

      <style>{`
        .field-input {
          height: 40px; padding: 0 12px; width: 100%;
          border: 1px solid ${T.line}; border-radius: 8px;
          background: ${T.fieldBg}; color: ${T.t1}; font-family: ${T.font}; font-size: 13.5px;
          outline: none; transition: background .15s, border-color .15s, box-shadow .15s;
        }
        .field-input:hover { background: ${T.fieldBgHover}; border-color: ${T.lineStrong}; }
        .field-input:focus, .field-input:focus-within { background: #fff; border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentTint}; }
        .field-error { background: ${T.dangerTint} !important; border-color: ${T.danger} !important; }
        .field-dense { height: 36px; font-size: 12.5px; padding: 0 10px; }
        .field-textarea {
          resize: none; overflow: hidden; line-height: 1.5; padding: 9px 10px;
          min-height: 40px; height: auto; font-size: 13.5px;
        }

        .task-form-wrapper { padding: 18px 20px 12px; border-bottom: 1px solid ${T.lineSoft}; flex-shrink: 0; }
        .subtask-section-wrapper { flex: 1; display: flex; flex-direction: column; padding: 16px 20px; }

        .resp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 10px; max-width: 520px; }

        .subtask-table-container {
          flex: 1; display: flex; flex-direction: column; min-height: 0;
          border: 1px solid ${T.line}; border-radius: 10px; overflow: hidden;
          background: ${T.surface};
        }
        .subtask-table-scroll { overflow-x: auto; flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .subtask-table-inner { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .resp-subtask-grid { display: grid; }

        .subtask-delete-label { display: none; }

        .footer-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid ${T.line}; background: ${T.bg}; flex-shrink: 0; margin-top: 16px; flex-wrap: wrap; gap: 12px; }
        .footer-actions { display: flex; align-items: center; gap: 10px; }

        /* ── Tablet: keep the table but tighten paddings a touch ── */
        @media (max-width: 900px) {
          .subtask-table-inner { min-width: 0 !important; }
        }

        /* ── Mobile: header fields stack, and each subtask row becomes a
             labelled card instead of a cramped horizontal-scroll row ── */
   /* ── Mobile: header fields stack; each subtask row becomes a compact card
     with a 2-column grid — Task full width, then Date pair, then Time+Priority pair ── */
@media (max-width: 680px) {
  .task-form-wrapper { padding: 12px 14px 8px; }
  .subtask-section-wrapper { padding: 10px 14px; }
  .resp-grid-2 { grid-template-columns: 1fr; max-width: none; gap: 10px; }

  .subtask-table-container { border: none; border-radius: 0; overflow: visible; }
  .subtask-table-scroll { overflow-x: visible !important; }
  .subtask-table-inner { min-width: 0 !important; }

  .resp-subtask-grid.subtask-header-row { display: none !important; }

  .resp-subtask-grid.subtask-data-row {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px 10px !important;
    border: 1px solid ${T.line} !important; border-radius: 10px;
    margin-bottom: 8px; padding: 26px 10px 10px !important; position: relative;
    background: ${T.surface} !important;
  }

  /* Row number + delete button become a slim strip at the top of each card */
  .subtask-idx-cell {
    display: block !important; position: absolute; top: 7px; left: 10px;
    font-size: 10px; padding: 0;
  }
  .subtask-delete-btn {
    position: absolute !important; top: 5px !important; right: 5px !important;
    width: 22px !important; height: 22px !important; margin-top: 0 !important;
    border-radius: 6px !important;
  }
  .subtask-delete-label { display: none !important; }

  .subtask-cell { padding-right: 0 !important; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .subtask-cell[data-label]::before {
    content: attr(data-label);
    font-size: 9.5px; font-weight: 700; letter-spacing: .4px;
    text-transform: uppercase; color: ${T.t4}; font-family: ${T.font};
  }
  /* Task apni poori row le, baaki fields 2-2 ke jode me sit karte hain (auto grid flow) */
  .subtask-cell[data-label="Task"] { grid-column: 1 / -1; }
  .subtask-cell[data-label="Status"] { grid-column: 1 / -1; }

  .footer-wrapper { padding: 10px 14px; flex-direction: column; }
  .footer-wrapper > button { width: 100%; justify-content: center; margin-bottom: 8px; }
  .footer-actions { width: 100%; justify-content: space-between; gap: 12px; }
  .footer-actions > button { flex: 1; justify-content: center; }
}
        /* ── Small phones: date calendar popover should never overflow the viewport ── */
        @media (max-width: 340px) {
          .date-popover { width: calc(100vw - 24px) !important; left: 12px !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default TaskTableEntry;

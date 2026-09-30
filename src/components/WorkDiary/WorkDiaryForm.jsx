
import { useState, useEffect, useCallback, useRef, useMemo, memo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ERPAutocomplete from "../Reusable/input/ERPAutocomplete";
import ERPDateInput from "../Reusable/input/Date";
import {
  fetchSubtasks, addSubtask, toggleSubtask, deleteSubtask,
  fetchComments, addComment,
} from "../../utils/api";
import {
  Plus, Check, X, ChevronRight,   AlertTriangle,
  Calendar, Paperclip, Send, Pencil, Trash2, Save,
  UserCheck, UserPlus, ListChecks, MessageSquare, Zap,
  CheckCircle2,   CornerDownLeft, 
} from "lucide-react";

export const F = "'DM Sans',system-ui,sans-serif";
export const FD = "'Sora',system-ui,sans-serif";
export const FM = "'DM Mono',monospace";

export const C = {
  blue: "#185FA5",
  blueDark: "#0C447C",
  blueLight: "#E6F1FB",
  blueBorder: "#85B7EB",
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderS: "#cbd5e1",
  t1: "#0f172a",
  t2: "#334155",
  t3: "#64748b",
  t4: "#94a3b8",
};

export const STAT_BADGE = {
  Pending: { bg: "#ede9fe", color: "#6d28d9" },
  "In Progress": { bg: "#e0f2fe", color: "#0369a1" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c" },
  Hold: { bg: "#fee2e2", color: "#b91c1c" },
  Open: { bg: "#fef3c7", color: "#b45309" },
  Resolved: { bg: "#dcfce7", color: "#15803d" },
  Closed: { bg: "#f1f5f9", color: "#475569" },
  Submitted: { bg: "#e0f2fe", color: "#0369a1" },
  Approved: { bg: "#dcfce7", color: "#15803d" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c" },
  Draft: { bg: "#ede9fe", color: "#6d28d9" },
};

export const PRIO_CFG = {
  High: { dot: "#ef4444", badge: { bg: "#fee2e2", color: "#b91c1c" } },
  Medium: { dot: "#f59e0b", badge: { bg: "#fef3c7", color: "#b45309" } },
  Low: { dot: "#22c55e", badge: { bg: "#dcfce7", color: "#15803d" } },
};

export const todayStr = () => new Date().toISOString().split("T")[0];
export const fmtHrs = v => { const n = parseFloat(v); return isNaN(n) ? "0.0" : n.toFixed(1); };
export const fmtDate = d => {
  if (!d) return "No due date";
  const dt = new Date(d + "T00:00:00"), now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((dt - now) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff <= 7) return `In ${diff}d`;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const initials = n => (n || "").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
const AV_GRADS = [
  ["#185FA5", "#8b5cf6"], ["#0ea5e9", "#185FA5"],
  ["#22c55e", "#14b8a6"], ["#f59e0b", "#ef4444"],
];
const avGrad = n => {
  let h = 0;
  for (let i = 0; i < (n || "").length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = AV_GRADS[Math.abs(h) % AV_GRADS.length];
  return `linear-gradient(135deg,${a},${b})`;
};

export const generateId = () => Math.random().toString(36).slice(2, 9);

export const newTask = (u = null) => ({
  _key: generateId(), item_type: "task",
  work_plan: "", target: "", priority: "Medium", category: "",
  expected_time: "", actual_time: "", status: "Pending", due_date: "", remarks: "",
  assign_type: "self",
  assigned_to_id: u?.userma_id || null,
  assigned_to_name: u?.user_id || null,
  assigned_by: null,
});
export const useIsMobile = () => {
  const [m, setM] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
};
export const Avtar = ({ name, size = 30 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: avGrad(name),
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.33, fontWeight: 700, color: "#fff", fontFamily: FM,
    flexShrink: 0, boxShadow: "0 2px 8px rgba(24,95,165,.2)",
  }}>
    {initials(name)}
  </div>
);
export const PDot = ({ color, size = 7 }) => (
  <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
);
export const ProgressRing = ({ pct = 0, size = 44, stroke = 4, color = "#185FA5" }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
};
function ToastList({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
            style={{
              background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 15px",
              display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500,
              color: "#334155", boxShadow: "0 8px 28px rgba(12,25,52,.13)", minWidth: 220, fontFamily: F
            }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.dot, flexShrink: 0 }} />
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    const dot = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#185FA5";
    setToasts(p => [...p, { id, msg, dot }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  const ToastUI = useCallback(() => <ToastList toasts={toasts} />, [toasts]);
  return { show, ToastUI };
};
export const btnPrimary = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
  borderRadius: 9, border: "none", background: C.blue, color: "#fff",
  cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: F,
  boxShadow: "0 4px 14px rgba(24,95,165,.3)",
};
export const btnSecondary = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
  borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.surface,
  color: C.t3, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F,
};
export const getTimeAlert = (task) => {
  const exp = parseFloat(task.expected_time) || 0;
  const act = parseFloat(task.actual_time) || 0;
  if (exp <= 0) return null;
  const pct = act / exp;
  if (pct >= 1) return "over";    
  if (pct >= 0.8) return "warning";  
  return null;
};


const winp = {
  background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 9,
  padding: "9px 13px", color: C.t1, fontFamily: F, fontSize: 13, outline: "none", width: "100%",
  transition: "border-color .14s, box-shadow .14s",
};
const CtxMenu = ({ x, y, onClose, items }) => {
  useEffect(() => {
    const h = () => onClose();
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - 200),
      background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12,
      boxShadow: "0 10px 36px rgba(12,25,52,.14)", zIndex: 800, minWidth: 168, overflow: "hidden",
    }}>
      {items.map((it, i) => it === "sep"
        ? <div key={i} style={{ borderTop: `1px solid ${C.border}`, margin: "3px 0" }} />
        : <div key={i}
          onClick={it.fn}
          style={{
            display: "flex", alignItems: "center", gap: 9, padding: "9px 14px",
            fontSize: 13, cursor: "pointer", color: it.red ? "#b91c1c" : C.t3,
            fontWeight: 500, fontFamily: F, transition: "background .12s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = it.red ? "#fee2e2" : C.bg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {it.Icon && <it.Icon size={13} />}{it.label}
        </div>
      )}
    </div>
  );
};

const taskStatusOpts = ["Pending", "In Progress", "Completed", "Hold"];
const ticketStatusOpts = ["Open", "In Progress", "Resolved", "Closed"];
 
 

const Th = ({ children, w, minW, align = "left" }) => (
  <th style={{
    textAlign: align, padding: "9px 14px", fontSize: 10, fontWeight: 700,
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".7px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    borderBottom: "1.5px solid #e2e8f0",
    background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
    position: "sticky", top: 0, zIndex: 2,
    whiteSpace: "nowrap", width: w, minWidth: minW,
    boxShadow: "0 1px 0 #e2e8f0",
  }}>{children}</th>
);

const PRIO_COLORS = { High: { bg: "#fee2e2", c: "#b91c1c" }, Medium: { bg: "#fef3c7", c: "#b45309" }, Low: { bg: "#dcfce7", c: "#15803d" } };
const STATUS_COLORS = { "Pending": { bg: "#f1f5f9", c: "#475569" }, "In Progress": { bg: "#e0f2fe", c: "#0369a1" }, "Completed": { bg: "#dcfce7", c: "#15803d" }, "Open": { bg: "#fef3c7", c: "#b45309" } };
const fmtDT = (raw) => {
  if (!raw) return "";
  const hasTime = raw.length > 10;
  const d = new Date(hasTime ? raw : `${raw}T00:00:00`);
  if (isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  if (!hasTime) return `${dd}-${mm}-${yyyy}`;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${dd}-${mm}-${yyyy}, ${h}:${m} ${ap}`;
};

const TaskRows = memo(({ t, onOpen, onEdit, onDelete, canEdit, selected, hide = {} }) => {
  const dueDT = fmtDT(t.due_date);
  const assignDT = fmtDT(t.assign_datetime);
  const prioStyle = PRIO_COLORS[t.priority] || PRIO_COLORS.Medium;
  const statusStyle = STATUS_COLORS[t.status] || STATUS_COLORS.Pending;
  const key = t._key || t.line_id;
  const clickTimer = useRef(null);

  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []); 
  const handleClick = () => {
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => {
      onOpen(key);
      clickTimer.current = null;
    }, 220);
  };
  const handleDoubleClick = (e) => {
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(t);
  };

  return (
    <tr
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`task-row${selected ? " selected" : ""}`}>

      <td data-label="Assignee">
        {t.assigned_to_name ? (
          <span style={{
            fontSize: 12, fontWeight: 500, color: "#334155",
            overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", maxWidth: 100, display: "inline-block",
          }}>
            {t.assigned_to_name}
          </span>
        ) : (
          <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>—</span>
        )}
      </td>
      <td data-label="Task" className="task-col">
        <div title={t.work_plan || ""} style={{
          fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", wordBreak: "break-word",
        }}>
          {t.work_plan || "Untitled task"}
        </div>
        {t.target && (
          <div style={{
            fontSize: 11, color: "#94a3b8", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {t.target}
          </div>
        )}
      </td>
      <td data-label="Due Date">
        {dueDT ? (
          <span style={{ fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>{dueDT}</span>
        ) : (
          <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>—</span>
        )}
      </td>
      {!hide.assignedBy && (
        <td data-label="Assigned By">
          {t.assigned_by ? (
            <span style={{
              fontSize: 12, fontWeight: 500, color: "#334155",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: 100, display: "inline-block",
            }}>
              {t.assigned_by}
            </span>
          ) : (
            <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>—</span>
          )}
        </td>
      )}
      {!hide.assignedOn && (
        <td data-label="Assigned On">
          {assignDT ? (
            <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{assignDT}</span>
          ) : (
            <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>—</span>
          )}
        </td>
      )}
      <td data-label="Priority">
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: prioStyle.bg, color: prioStyle.c, whiteSpace: "nowrap",
        }}>{t.priority || "—"}</span>
      </td>
      <td data-label="Status">
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: statusStyle.bg, color: statusStyle.c, whiteSpace: "nowrap",
        }}>{t.status || "—"}</span>
      </td>
      <td className="task-del-cell">
        {canEdit && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(key); }}
            title="Delete task"
            className="task-del-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
});

export const TaskTable = ({ tasks, onOpen, onEdit, onDelete, onStatusChange, selectedKey, isEditable }) => {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(9999);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWrapW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hide = isMobile
    ? {}
    : { assignedOn: wrapW < 900, assignedBy: wrapW < 760 };
  const colCount = 8 - (hide.assignedOn ? 1 : 0) - (hide.assignedBy ? 1 : 0);

  return (
    <div className="task-table-wrap" ref={wrapRef}>
      <table className="task-table">
        <thead>
          <tr>
            <Th w="12%">Assignee</Th>
            <Th w="30%" minW={200}>Task</Th>
            <Th w="14%">Due Date</Th>
            {!hide.assignedBy && <Th w="12%">Assigned By</Th>}
            {!hide.assignedOn && <Th w="14%">Assigned On</Th>}
            <Th w="8%">Priority</Th>
            <Th w="8%">Status</Th>
            <Th w="34px" />
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "48px 24px", gap: 10,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#eff6ff", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>No tasks found</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Try adjusting your filters</div>
                </div>
              </td>
            </tr>
          ) : tasks.map(t => {
            const key = t._key || t.line_id;
            return (
              <TaskRows
                key={key}
                t={t}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
                hide={hide}
                canEdit={isEditable ? isEditable(t) : !t.assigned_by}
                selected={selectedKey !== null && selectedKey !== undefined &&
                  (key === selectedKey || String(t.line_id) === String(selectedKey))}
              />
            );
          })}
        </tbody>
      </table>

      <style>{`
        .task-table-wrap {
          border: 1px solid #e2e8f0; border-radius: 10px;
          overflow: auto; background: #ffffff;
        }
        .task-table {
          width: 100%; border-collapse: collapse;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        /* Desktop: never let the table crush below a readable width —
           it scrolls horizontally instead of wrapping Task to one word per line */
        @media (min-width: 681px) {
          .task-table { min-width: 560px; }
        }
        .task-table td {
          padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top;
        }
        .task-row { background: #fff; cursor: pointer; }
        .task-row:hover:not(.selected) { background: #f8fafc; }
        .task-row.selected {
          background: #EFF6FF;
          box-shadow: inset 3px 0 0 #185FA5;
        }

        .task-del-cell { text-align: center; padding: 6px 8px !important; }
        .task-del-btn {
          width: 24px; height: 24px; border-radius: 6px;
          border: 1px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #94a3b8;
        }
        .task-del-btn:hover { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }

        /* ── Mobile: each row becomes a compact card, fields paired 2-per-row
             (Task always full width on top) instead of stacking one-per-line ── */
        @media (max-width: 680px) {
          .task-table-wrap { border: none; background: transparent; overflow: visible; }
          .task-table, .task-table thead, .task-table tbody { display: block; width: 100%; }
          .task-table thead { display: none; }

          .task-table tbody tr {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 7px 10px;
            background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
            margin-bottom: 8px; padding: 10px 32px 10px 12px; position: relative;
          }
          .task-table td {
            display: block; width: auto; padding: 0 !important; border-bottom: none;
            min-width: 0;
          }
          .task-table td[data-label]::before {
            content: attr(data-label);
            display: block; font-size: 9px; font-weight: 700; letter-spacing: .4px;
            text-transform: uppercase; color: #94a3b8; margin-bottom: 2px;
          }
          /* Task sabse pehle aur poori width leta hai, baaki fields DOM order me
             apne aap 2-2 ke jode me sit ho jaate hain */
          .task-table td[data-label="Task"] { grid-column: 1 / -1; order: -1; }
          /* Cards me clamp hata do — poora text dikhe */
          .task-table td[data-label="Task"] > div:first-child { -webkit-line-clamp: unset; display: block; }

          .task-del-cell {
            position: absolute; top: 8px; right: 8px;
          }
        }
      `}</style>
    </div>
  );
};


const TaskCardMemo = ({ task, onOpen, onDelete, onStatusChange, isAssignedToMe = false, isSelected = false }) => {
  const [ctx, setCtx] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const statusRef = useRef(null);

  const isTicket = task.item_type === "ticket";
  const pc = PRIO_CFG[task.priority] || PRIO_CFG.Medium;
  const done = isTicket ? task.status === "Resolved" || task.status === "Closed" : task.status === "Completed";
  const stCfg = STAT_BADGE[task.status] || { bg: "#f1f5f9", color: "#475569" };
  const statusOpts = isTicket ? ticketStatusOpts : taskStatusOpts;
  useEffect(() => {
    if (!showStatus) return;
    const h = (e) => { if (!statusRef.current?.contains(e.target)) setShowStatus(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showStatus]);

  const handleDelete = () => onDelete(task._key);

  return (
    <div
      onClick={() => onOpen(task._key)}
      onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
      style={{
        background: isSelected ? "#f0f7ff" : C.surface,
        borderRadius: 12,
        cursor: "pointer",
        opacity: done ? 0.55 : 1,
        border: `1px solid ${isSelected ? C.blue : C.border}`,
        boxShadow: isSelected ? `0 0 0 2px rgba(24,95,165,.18)` : "0 1px 3px rgba(12,25,52,.04)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        borderLeft: `3px solid ${isTicket ? "#8b5cf6" : pc.dot}`,
        transition: "box-shadow .14s, border-color .14s",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 2px 8px rgba(12,25,52,.08)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 1px 3px rgba(12,25,52,.04)"; }}
    >
      {/* ── Body ── */}
      <div style={{ padding: "11px 14px 10px" }}>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
          <div style={{
            flex: 1, minWidth: 0,
            fontFamily: F, fontSize: 14, fontWeight: 700,
            color: done ? C.t4 : C.t1,
            textDecoration: done ? "line-through" : "none",
            lineHeight: 1.35,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {task.work_plan || (isTicket ? "Untitled ticket" : "Untitled task")}
          </div>

          {isAssignedToMe && (
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {[
                { Icon: Pencil, fn: () => onOpen(task._key), hBg: "#E6F1FB", hColor: C.blue, hBorder: "#85B7EB" },
                { Icon: Trash2, fn: handleDelete, hBg: "#fee2e2", hColor: "#b91c1c", hBorder: "#fca5a5" },
              ].map(({ Icon: Ic, fn, hBg, hColor, hBorder }, i) => (
                <button key={i} onClick={fn}
                  style={{
                    width: 24, height: 24, borderRadius: 5,
                    border: `1px solid ${C.border}`, background: C.bg,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: C.t3,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = hBg; e.currentTarget.style.color = hColor; e.currentTarget.style.borderColor = hBorder; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.t3; e.currentTarget.style.borderColor = C.border; }}>
                  <Ic size={11} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {task.target && (
          <div style={{
            fontSize: 13, color: C.t3, lineHeight: 1.5,
            marginBottom: 9, marginLeft: 1,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {task.target}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 4,
            fontSize: 11, fontWeight: 700, fontFamily: FM,
            background: pc.badge.bg, color: pc.badge.color,
          }}>
            <PDot color={pc.dot} size={5} />
            {task.priority}
          </span>
          <div ref={statusRef} style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowStatus(p => !p)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 4,
                fontSize: 11, fontWeight: 700, fontFamily: FM,
                cursor: "pointer",
                border: `1px solid ${stCfg.color ? stCfg.color + "44" : C.border}`,
                background: stCfg.bg || "#f1f5f9",
                color: stCfg.color || "#475569",
              }}>
              {task.status}
              <ChevronRight size={8} style={{
                transform: showStatus ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform .15s",
              }} />
            </button>

            {showStatus && (
              <div style={{
                position: "fixed",
                top: (() => {
                  const el = statusRef.current;
                  if (!el) return 0;
                  const r = el.getBoundingClientRect();
                  return r.bottom + 6;
                })(),
                left: (() => {
                  const el = statusRef.current;
                  if (!el) return 0;
                  return el.getBoundingClientRect().left;
                })(),
                zIndex: 1000,
                minWidth: 160,
                background: "#fff",
                borderRadius: 9,
                boxShadow: "0 8px 28px rgba(12,25,52,.14)",
                border: `1.5px solid ${C.border}`,
                overflow: "hidden",
              }}>
                {statusOpts.map(s => {
                  const sc = STAT_BADGE[s] || { bg: "#f1f5f9", color: "#475569" };
                  const isAct = task.status === s;
                  return (
                    <div key={s}
                      onClick={() => { setShowStatus(false); onStatusChange?.(task._key, s); }}
                      style={{
                        padding: "8px 12px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        gap: 7, fontFamily: F,
                        background: isAct ? sc.bg : "transparent",
                        color: isAct ? sc.color : C.t2,
                      }}
                      onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                      {s}
                      {isAct && <Check size={10} color={sc.color} style={{ marginLeft: "auto" }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category badge */}
          {task.category && (
            <span style={{
              padding: "3px 8px", borderRadius: 4,
              fontSize: 11, fontWeight: 600, fontFamily: FM,
              background: C.bg, color: C.t3,
              border: `1px solid ${C.border}`,
            }}>
              {task.category}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 14px",
        borderTop: `1px solid ${C.bg}`,
        background: "#fafbfc",
        borderRadius: "0 0 12px 12px",
      }}>
        <Calendar size={9} strokeWidth={2} color={C.borderS} />
        <span style={{
          fontFamily: FM, fontSize: 11, fontWeight: 500, color: C.t4,
        }}>
          {fmtDate(task.due_date)}
        </span>

        {task.attachment_name && (
          <Paperclip size={9} color={C.t4} />
        )}

        <div style={{ flex: 1 }} />

        {/* Full employee name with avatar */}
        {task.assigned_to_name && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            maxWidth: 140, overflow: "hidden",
          }}>
            <Avtar name={task.assigned_to_name} size={18} />
            <span style={{
              fontFamily: F, fontSize: 11, fontWeight: 600,
              color: C.t3, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {task.assigned_to_name}
            </span>
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctx && (
        <CtxMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} items={[
          { label: "Open detail", Icon: Pencil, fn: () => { onOpen(task._key); setCtx(null); } },
          "sep",
          ...(task.assigned_by ? [] : [{ label: "Delete task", Icon: Trash2, red: true, fn: handleDelete }]),
        ]} />
      )}
    </div>
  );
};

export const TaskCard = memo(TaskCardMemo);
// ─── TaskRow ─────────────────────────────────────────────────────
export const TaskRow = ({ task, onOpen, onToggle, onDelete, isAssignedToMe = false }) => {
  const isTicket = task.item_type === "ticket";
  const pc = PRIO_CFG[task.priority] || PRIO_CFG.Medium;
  const done = isTicket ? (task.status === "Resolved" || task.status === "Closed") : task.status === "Completed";
  const over = task.due_date && task.due_date < todayStr() && !done && task.status !== "Cancelled";
  const stCfg = STAT_BADGE[task.status] || { bg: "#f1f5f9", color: "#475569" };
  const timeAlert = getTimeAlert(task);

  return (
    <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      onClick={() => onOpen(task._key)}
      style={{
        background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10,
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", opacity: done ? .55 : 1,
        borderLeft: `3px solid ${isTicket ? "#8b5cf6" : pc.dot}`,
        transition: "all .14s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.borderS; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}>

      <div onClick={e => { e.stopPropagation(); onToggle(task._key); }}
        style={{
          width: 18, height: 18, borderRadius: 5, border: `2px solid ${done ? "#22c55e" : C.borderS}`,
          background: done ? "#22c55e" : C.bg, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, transition: "all .13s"
        }}>
        {done && <Check size={10} color="#fff" strokeWidth={3.5} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FD, fontSize: 13, fontWeight: 700, color: done ? C.t4 : C.t1,
          textDecoration: done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {task.work_plan || "Untitled"}
        </div>
        {task.target && (
          <div style={{ fontSize: 11, color: C.t4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.target}</div>
        )}
      </div>

      {isAssignedToMe && task.assigned_by && (
        <span style={{
          fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
          background: "#e0f2fe", color: "#0369a1", display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0
        }}>
          <CornerDownLeft size={9} /> {task.assigned_by}
        </span>
      )}

      {timeAlert && (
        <span style={{
          fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, flexShrink: 0,
          background: timeAlert === "over" ? "#fee2e2" : "#fef3c7",
          color: timeAlert === "over" ? "#b91c1c" : "#b45309",
          animation: timeAlert === "warning" ? "pulse 2s ease-in-out infinite" : "none",
        }}>
          {timeAlert === "over" ? "OVER" : "~80%"}
        </span>
      )}

      <span style={{
        fontFamily: FM, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
        background: stCfg.bg, color: stCfg.color, flexShrink: 0
      }}>{task.status}</span>

      <span style={{
        fontFamily: FM, fontSize: 11, color: over ? "#b91c1c" : C.t4,
        fontWeight: over ? 700 : 400, flexShrink: 0, minWidth: 72, textAlign: "right",
        display: "flex", alignItems: "center", gap: 3
      }}>
        {over && <AlertTriangle size={10} color="#b91c1c" />}{fmtDate(task.due_date)}
      </span>

      <button onClick={e => { e.stopPropagation(); onDelete(task._key); }}
        style={{
          width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`,
          background: C.bg, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", color: C.t4, flexShrink: 0, transition: "all .12s"
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#b91c1c"; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.t4; }}>
        <Trash2 size={12} />
      </button>
    </motion.div>
  );
}; 
const renderFormatted = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let current = null;

  lines.forEach(raw => {
    const bullet = raw.match(/^\s*-\s+(.*)$/);
    const numbered = raw.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      if (!current || current.type !== "ul") { current = { type: "ul", items: [] }; blocks.push(current); }
      current.items.push(bullet[1]);
    } else if (numbered) {
      if (!current || current.type !== "ol") { current = { type: "ol", items: [] }; blocks.push(current); }
      current.items.push(numbered[1]);
    } else {
      current = null;
      blocks.push({ type: "p", text: raw });
    }
  });

  return blocks.map((b, i) => {
    if (b.type === "ul") return <ul key={i} className="dp-list">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>;
    if (b.type === "ol") return <ol key={i} className="dp-list">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ol>;
    return b.text.trim() ? <p key={i} className="dp-line">{b.text}</p> : null;
  });
};

export const DetailPanel = ({ task, onClose, onEdit, onDelete, onToggle, readOnly = false, isMobile = false, fullHeight = false }) => {
  const [cmt, setCmt] = useState("");
  const [cmts, setCmts] = useState([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [addingCmt, setAddingCmt] = useState(false);
  const [subTasks, setSubTasks] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subInp, setSubInp] = useState("");

  useEffect(() => {
    if (!task?.line_id) return;
    setSubLoading(true);
    fetchSubtasks(task.line_id)
      .then(r => setSubTasks(Array.isArray(r) ? r : r?.data || []))
      .catch(() => { })
      .finally(() => setSubLoading(false));
    setCmtLoading(true);
    fetchComments(task.line_id)
      .then(r => setCmts(Array.isArray(r) ? r : r?.data || []))
      .catch(() => { })
      .finally(() => setCmtLoading(false));
  }, [task?.line_id]);

  useEffect(() => {
    if (isMobile) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile]);

  if (!task) return null;

  const isTicket = task.item_type === "ticket";
  const done = isTicket ? (task.status === "Resolved" || task.status === "Closed") : task.status === "Completed";
  const stCfg = STAT_BADGE[task.status] || {};
  const subDone = subTasks.filter(s => s.is_done).length;
  const timeAlert = getTimeAlert(task);
  const exp = parseFloat(task.expected_time) || 0;
  const act = parseFloat(task.actual_time) || 0;

  const handleToggleSub = async (subtask_id, current) => {
    setSubTasks(p => p.map(s => s.subtask_id === subtask_id ? { ...s, is_done: !current } : s));
    try { await toggleSubtask(subtask_id, !current); }
    catch { setSubTasks(p => p.map(s => s.subtask_id === subtask_id ? { ...s, is_done: current } : s)); }
  };

  const handleDeleteSub = async (subtask_id) => {
    setSubTasks(p => p.filter(s => s.subtask_id !== subtask_id));
    try { await deleteSubtask(subtask_id); } catch { }
  };

  const handleAddSub = async () => {
    const text = subInp.trim();
    if (!text || !task.line_id || !task.diary_id) return;
    const temp = { subtask_id: `tmp_${Date.now()}`, subtask_text: text, is_done: false };
    setSubTasks(p => [...p, temp]);
    setSubInp("");
    try {
      const r = await addSubtask({ line_id: task.line_id, diary_id: task.diary_id, subtask_text: text, sort_order: subTasks.length });
      const saved = r?.data || r;
      setSubTasks(p => p.map(s => s.subtask_id === temp.subtask_id ? saved : s));
    } catch { setSubTasks(p => p.filter(s => s.subtask_id !== temp.subtask_id)); }
  };

  const handleAddCmt = async () => {
    const text = cmt.trim();
    if (!text || !task.line_id || !task.diary_id) return;
    setAddingCmt(true);
    try {
      const r = await addComment({ line_id: task.line_id, diary_id: task.diary_id, comment_text: text });
      setCmts(p => [...p, r?.data || r]);
      setCmt("");
    } catch { } finally { setAddingCmt(false); }
  };

  const fmtCmtTime = ts => {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch { return ts; }
  };

  const panelContent = (
    <div className="dp-root" style={{ display: "flex", flexDirection: "column", height: "100%", background: C.surface, overflow: "hidden" }}>
      {/* Header */}
      <div className="dp-header" style={{ padding: "16px 44px 12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: "relative" }}>
        {stCfg.label && (
          <span style={{
            display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".3px",
            padding: "2px 8px", borderRadius: 6, marginBottom: 7,
            background: stCfg.bg || C.blueLight, color: stCfg.color || C.blueDark,
          }}>
            {stCfg.label || task.status}
          </span>
        )}

        <div className="dp-title" style={{
          fontFamily: FD, fontSize: 15, fontWeight: 700, color: C.t1, lineHeight: 1.45,
          textDecoration: done ? "line-through" : "none", opacity: done ? .6 : 1,
        }}>
          {renderFormatted(task.work_plan || "Untitled task")}
        </div>

        {task.target && (
          <div className="dp-target" style={{ fontSize: 12.5, color: C.t3, marginTop: 6, lineHeight: 1.6, fontFamily: F }}>
            {renderFormatted(task.target)}
          </div>
        )}

        <button onClick={onClose} className="dp-close-btn" aria-label="Close">
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Hours progress */}
        {exp > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.t4, fontFamily: F }}>
                Time Budget
              </div>
              <span style={{
                fontFamily: FM, fontSize: 11, fontWeight: 700,
                color: timeAlert === "over" ? "#b91c1c" : timeAlert === "warning" ? "#b45309" : "#15803d"
              }}>
                {fmtHrs(act)}h / {fmtHrs(exp)}h
              </span>
            </div>
            <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: timeAlert === "over" ? "#ef4444" : timeAlert === "warning" ? "#f59e0b" : "#22c55e",
                width: `${Math.min(100, exp > 0 ? (act / exp) * 100 : 0)}%`,
              }} />
            </div>
          </div>
        )}

        {task.remarks && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.t4, marginBottom: 6 }}>Remarks</div>
            <div className="dp-remarks" style={{
              fontSize: 12.5, color: C.t3, background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "10px 12px", lineHeight: 1.6
            }}>{renderFormatted(task.remarks)}</div>
          </div>
        )}

        {/* Subtasks */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
              color: C.t4, display: "flex", alignItems: "center", gap: 6
            }}>
              <ListChecks size={12} color={C.t4} /> Sub-tasks
              {subTasks.length > 0 && (
                <span style={{
                  fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                  background: subDone === subTasks.length ? "#dcfce7" : C.blueLight,
                  color: subDone === subTasks.length ? "#15803d" : C.blueDark
                }}>
                  {subDone}/{subTasks.length}
                </span>
              )}
            </div>
          </div>

          {!task.line_id ? (
            <div style={{ fontSize: 12, color: C.t4, fontStyle: "italic" }}>Save the task first to add sub-tasks</div>
          ) : (
            <>
              {subTasks.length > 0 && (
                <div style={{ height: 4, background: C.bg, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{
                    height: "100%", borderRadius: 2, background: "#22c55e",
                    width: `${subTasks.length ? Math.round((subDone / subTasks.length) * 100) : 0}%`,
                  }} />
                </div>
              )}

              {subLoading
                ? <div style={{ fontSize: 12, color: C.t4, padding: "8px 0" }}>Loading…</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                    {subTasks.map(s => (
                      <div key={s.subtask_id} className="dp-sub-row"
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                          background: s.is_done ? "#f0fdf4" : C.bg,
                          border: `1px solid ${s.is_done ? "#bbf7d0" : C.border}`,
                          borderRadius: 8,
                        }}>
                        <div onClick={() => handleToggleSub(s.subtask_id, s.is_done)}
                          className="dp-checkbox"
                          style={{
                            width: 16, height: 16, borderRadius: 4,
                            border: `2px solid ${s.is_done ? "#22c55e" : C.borderS}`,
                            background: s.is_done ? "#22c55e" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", flexShrink: 0,
                          }}>
                          {s.is_done && <Check size={9} color="#fff" strokeWidth={3.5} />}
                        </div>
                        <span style={{
                          flex: 1, fontSize: 13, color: s.is_done ? C.t4 : C.t2,
                          textDecoration: s.is_done ? "line-through" : "none", fontFamily: F, lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}>
                          {s.subtask_text}
                        </span>
                        {!readOnly && (
                          <span onClick={() => handleDeleteSub(s.subtask_id)} className="dp-sub-del"
                            style={{ cursor: "pointer", color: C.border, display: "flex", flexShrink: 0, padding: 2 }}>
                            <X size={12} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }

              {!readOnly && (
                <div className="dp-sub-input" style={{
                  display: "flex", alignItems: "center", gap: 8, background: C.bg,
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px"
                }}>
                  <Plus size={13} color={C.t4} strokeWidth={2.5} />
                  <input value={subInp} onChange={e => setSubInp(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSub(); } }}
                    placeholder="Add a sub-task, press Enter…"
                    style={{
                      border: "none", background: "none", outline: "none", fontSize: 13,
                      color: C.t1, flex: 1, fontFamily: F
                    }} />
                  {subInp && (
                    <button onClick={handleAddSub} className="dp-sub-add-btn">
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
            color: C.t4, marginBottom: 8, display: "flex", alignItems: "center", gap: 6
          }}>
            <MessageSquare size={12} color={C.t4} /> Comments
            {cmts.length > 0 && (
              <span style={{
                fontFamily: FM, fontSize: 10, fontWeight: 700, padding: "1px 7px",
                borderRadius: 999, background: C.blueLight, color: C.blueDark
              }}>{cmts.length}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
            {cmtLoading
              ? <div style={{ fontSize: 12, color: C.t4 }}>Loading…</div>
              : cmts.length === 0
                ? <div style={{ fontSize: 12, color: C.borderS }}>No comments yet</div>
                : cmts.map((cm, i) => (
                  <div key={cm.comment_id || i} style={{ display: "flex", gap: 9 }}>
                    <Avtar name={cm.display_name || cm.commented_by || "?"} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: C.t4, marginBottom: 3, display: "flex", alignItems: "center", gap: 6, fontFamily: F }}>
                        <span style={{ color: C.t2, fontWeight: 600, fontSize: 12 }}>{cm.display_name || cm.commented_by}</span>
                        <span style={{ fontSize: 10 }}>{fmtCmtTime(cm.created_at)}</span>
                      </div>
                      <div style={{
                        fontSize: 13, color: C.t2, lineHeight: 1.6,
                        background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: "0 8px 8px 8px", padding: "8px 10px", fontFamily: F, wordBreak: "break-word",
                      }}>
                        {renderFormatted(cm.comment_text)}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>

          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <Avtar name="You" size={26} />
            <input value={cmt} onChange={e => setCmt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddCmt()}
              placeholder="Write a comment…"
              className="dp-comment-input"
              style={{
                flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "8px 12px", fontSize: 12, outline: "none", color: C.t1, fontFamily: F,
              }} />
            <button onClick={handleAddCmt} disabled={addingCmt}
              style={{ ...btnSecondary, padding: "7px 10px", flexShrink: 0 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8, flexShrink: 0, background: C.surface
      }}>
        {!readOnly ? (
          <>
            <button onClick={() => onToggle(task._key)}
              style={{
                ...btnSecondary, flex: 1, justifyContent: "center", fontSize: 12,
                background: done ? C.bg : "#ECFDF5",
                borderColor: done ? C.border : "#A7F3D0",
                color: done ? C.t3 : "#15803D",
              }}>
              {done
                ? <><CornerDownLeft size={13} />Reopen</>
                : <><CheckCircle2 size={13} />Complete</>}
            </button>
            <button onClick={onEdit}
              style={{
                ...btnSecondary, flex: 1, justifyContent: "center", fontSize: 12,
                background: "#FEFCE8", borderColor: "#FDE68A", color: "#A16207",
              }}>
              <Pencil size={13} /> Edit
            </button>
            <button onClick={() => onDelete(task._key)} className="dp-delete-btn">
              <Trash2 size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => onToggle(task._key)}
            style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>
            <CheckCircle2 size={14} /> Mark complete
          </button>
        )}
      </div>

      <style>{`
        .dp-line { margin: 0 0 4px; }
        .dp-line:last-child { margin-bottom: 0; }
        .dp-list { margin: 4px 0; padding-left: 18px; }
        .dp-list li { margin-bottom: 3px; font-weight: 500; }
        .dp-list li:last-child { margin-bottom: 0; }
        .dp-title .dp-list li, .dp-title .dp-line { font-size: 13.5px; font-weight: 500; }
        .dp-target .dp-list, .dp-remarks .dp-list { font-size: inherit; }

        .dp-close-btn {
          position: absolute; top: 14px; right: 14px;
          width: 26px; height: 26px; border-radius: 7px;
          border: 1px solid ${C.border}; background: ${C.surface};
          color: ${C.t3}; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .dp-close-btn:hover { background: ${C.bg}; }

        .dp-checkbox:hover { border-color: #22c55e; }
        .dp-sub-del { }
        .dp-sub-del:hover { color: #ef4444; }
        .dp-sub-add-btn {
          background: ${C.blue}; border: none; border-radius: 6px; padding: 3px 8px;
          cursor: pointer; display: flex; align-items: center;
        }
        .dp-comment-input:focus { border-color: ${C.blue}; }

        .dp-delete-btn {
          padding: 8px 11px; border-radius: 8px; border: 1px solid #fee2e2;
          background: #fff; cursor: pointer; color: #b91c1c;
          display: flex; align-items: center;
        }
        .dp-delete-btn:hover { background: #fef2f2; }

        @media (max-width: 480px) {
          .dp-header { padding: 14px 40px 10px 14px; }
        }
      `}</style>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .15 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,25,52,.35)",
          }} />
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ duration: .22, ease: "easeOut" }}
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 201,
            height: "90dvh", borderRadius: "16px 16px 0 0",
            background: C.surface, border: `1px solid ${C.border}`,
            boxShadow: "0 -8px 24px rgba(12,25,52,.12)",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2, background: C.borderS,
            margin: "10px auto 0", flexShrink: 0
          }} />
          <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
            {panelContent}
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <div style={{
      width: 340, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
      height: "100%", display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {panelContent}
    </div>
  );
};

// ─── ModalShell ───────────────────────────────────────────────────
const ModalShell = ({ onClose, children, isMobile }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = e => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(12,25,52,.35)",

      display: "flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent: "center",
      animation: "fdIn .18s ease",
    }}>
      <div style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        width: "100%",
        maxWidth: isMobile ? "100%" : 540,
        maxHeight: isMobile ? "94dvh" : "92vh",
        borderRadius: isMobile ? "20px 20px 0 0" : 20,
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(12,25,52,.2)",
        animation: isMobile ? "slideUp .18s ease-out" : "popIn .15s ease-out",
        overflow: "hidden",
      }}>
        {isMobile && (
          <div style={{
            width: 40, height: 4, borderRadius: 2, background: C.borderS,
            margin: "10px auto 0", flexShrink: 0
          }} />
        )}
        {children}
      </div>
      <style>{`
        @keyframes fdIn   { from { opacity:0 } to { opacity:1 } }
       @keyframes popIn  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp{ from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.6} }
        .erpac-inp {
          background:${C.bg}; border:1.5px solid ${C.border}; border-radius:9px;
          padding:9px 13px; color:${C.t1}; font-family:${F}; font-size:13px;
          outline:none; width:100%; transition:border-color .14s,box-shadow .14s;
          box-sizing:border-box;
        }
        .erpac-inp:focus { border-color:${C.blue}; box-shadow:0 0 0 3px rgba(24,95,165,.12); }
        .modal-inp:focus { border-color:${C.blue} !important; box-shadow:0 0 0 3px rgba(24,95,165,.1) !important; }
      `}</style>
    </div>
  );
};

function Lbl({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.t2, letterSpacing: ".4px",
      textTransform: "uppercase", marginBottom: 5
    }}>{children}</div>
  );
}
export const TaskModal = ({ task, onClose, onSave, currentUser, employees = [], categoryOptions = [] }) => {
  const isMobile = useIsMobile();
  const isEdit = !!(task?.line_id || (task?._key && task?.work_plan));
  const isAssignedByOther = !!(task?.assigned_by && task?.assigned_by !== currentUser?.user_id);

  const [f, setF] = useState(() => task ? { ...task } : newTask(currentUser));
  const [subtasks, setSubs] = useState(() => Array.isArray(task?._pendingSubtasks) ? task._pendingSubtasks : []);
  const [subInp, setSubInp] = useState("");
  const [touched, setTouched] = useState(false);

  const titleRef = useRef(null);
  const descRef = useRef(null);
  const prioRefs = [useRef(null), useRef(null), useRef(null)];
  const statRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const dueDateRef = useRef(null);
  const targetRef = useRef(null);
  const subInpRef = useRef(null);
  const remarkRef = useRef(null);
  const saveRef = useRef(null);
  const modalBodyRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (isAssignedByOther) {
        statRefs[0].current?.focus();
      } else {
        titleRef.current?.focus();
      }
    }, 30);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (f.assign_type === "self") {
      setF(p => ({
        ...p,
        assigned_to_id: currentUser?.userma_id || null,
        assigned_to_name: currentUser?.user_id || null,
        assigned_by: null,
      }));
    } else {
      setTimeout(() => {
        const inp = modalBodyRef.current?.querySelector("[data-assignee='1'] input")
          ?? modalBodyRef.current?.querySelector("[data-assignee='1']");
        inp?.focus();
      }, 40);
    }
  }, [f.assign_type, currentUser]);
  const handleSave = useCallback(() => {
    if (!f.work_plan?.trim()) { setTouched(true); titleRef.current?.focus(); return; }
    onSave({ ...f, _pendingSubtasks: subtasks });
  }, [f, subtasks, onSave]);
  useEffect(() => {
    const h = e => {
      if (e.altKey && (e.key === "s" || e.key === "S")) { e.preventDefault(); handleSave(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [handleSave]);

  const set = useCallback((k, v) => setF(p => ({ ...p, [k]: v })), []);

  const addSub = useCallback(() => {
    const v = subInp.trim();
    if (v && !subtasks.includes(v)) setSubs(p => [...p, v]);
    setSubInp("");
  }, [subInp, subtasks]);



  const PRIO_VALS = ["High", "Medium", "Low"];
  const STATUS_VALS = ["Pending", "In Progress", "Completed", "Hold"];

  const onTitleKey = useCallback(e => {
    if (e.key === "Enter") { e.preventDefault(); descRef.current?.focus(); }
  }, []);

  const onDescKey = useCallback(e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isAssignedByOther) { statRefs[0].current?.focus(); return; }
      const catInp = modalBodyRef.current?.querySelector("[data-cat='1'] input")
        ?? modalBodyRef.current?.querySelector("[data-cat='1']")
        ?? dueDateRef.current;
      catInp?.focus();
    }
  }, [isAssignedByOther]);

  const onPrioKey = useCallback((e, idx) => {
    if (isAssignedByOther) return;
    if (e.key === "ArrowRight") { e.preventDefault(); prioRefs[Math.min(idx + 1, 2)].current?.focus(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prioRefs[Math.max(idx - 1, 0)].current?.focus(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set("priority", PRIO_VALS[idx]); }
    if (e.key === "Tab") { e.preventDefault(); statRefs[0].current?.focus(); }
  }, [isAssignedByOther, set]);

  const onStatKey = useCallback((e, idx) => {
    if (e.key === "ArrowRight") { e.preventDefault(); statRefs[Math.min(idx + 1, 3)].current?.focus(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); statRefs[Math.max(idx - 1, 0)].current?.focus(); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set("status", STATUS_VALS[idx]); }
    if (e.key === "Tab") {
      e.preventDefault();
      if (isAssignedByOther) { targetRef.current?.focus(); return; }
      const catInp = modalBodyRef.current?.querySelector("[data-cat='1'] input")
        ?? modalBodyRef.current?.querySelector("[data-cat='1']")
        ?? dueDateRef.current;
      catInp?.focus();
    }
  }, [isAssignedByOther, set]);

  const onSubKey = useCallback(e => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); subInp.trim() ? addSub() : remarkRef.current?.focus(); }
    if (e.key === "Backspace" && !subInp && subtasks.length) setSubs(p => p.slice(0, -1));
  }, [subInp, subtasks, addSub]);

  const onRemarkKey = useCallback(e => {
    if (e.key === "Enter") { e.preventDefault(); handleSave(); }
  }, [handleSave]);

  const PRIO_OPTS = useMemo(() => [
    { v: "High", dot: "#ef4444", bg: "#fee2e2", color: "#b91c1c" },
    { v: "Medium", dot: "#f59e0b", bg: "#fef3c7", color: "#b45309" },
    { v: "Low", dot: "#22c55e", bg: "#dcfce7", color: "#15803d" },
  ], []);

  const STATUS_OPTS = useMemo(() => [
    { v: "Pending", bg: "#ede9fe", color: "#6d28d9" },
    { v: "In Progress", bg: "#e0f2fe", color: "#0369a1" },
    { v: "Completed", bg: "#dcfce7", color: "#15803d" },
    { v: "Hold", bg: "#fee2e2", color: "#b91c1c" },
  ], []);

  const inp = useMemo(() => ({ ...winp, padding: "8px 12px", fontSize: 13 }), []);
  const inpFocus = useCallback(e => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = "0 0 0 3px rgba(24,95,165,.1)"; }, []);
  const inpBlur = useCallback(e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }, []);

  // ── Locked field style ──
  const lockedStyle = useMemo(() => ({
    opacity: 0.55,
    cursor: "not-allowed",
    background: "#f1f5f9",
    pointerEvents: "none",
  }), []);

  return (
    <ModalShell onClose={onClose} isMobile={isMobile}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 13px",
        borderBottom: `1.5px solid ${C.border}`, flexShrink: 0,
        background: `linear-gradient(135deg, ${C.blueLight} 0%, ${C.surface} 60%)`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: `0 4px 12px ${C.blue}44`
        }}>
          {isEdit ? <Pencil size={15} color="#fff" /> : <Zap size={15} color="#fff" />}
        </div>
        <div>
          <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 800, color: C.t1, lineHeight: 1.1 }}>
            {isEdit ? "Edit Task" : "New Task"}
          </div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>
            {isAssignedByOther
              ? `Assigned by ${task.assigned_by} · status, hours & remarks editable`
              : isEdit ? "Update task details below" : "Enter key jumps between fields"}
          </div>
        </div>
        <button onClick={onClose}
          style={{
            marginLeft: "auto", width: 30, height: 30, borderRadius: 8,
            background: C.bg, border: `1.5px solid ${C.border}`,
            cursor: "pointer", color: C.t3, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .13s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#b91c1c"; e.currentTarget.style.borderColor = "#fca5a5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.t3; e.currentTarget.style.borderColor = C.border; }}>
          <X size={15} />
        </button>
      </div>

      {/* ── Assigned-by banner ── */}
      {isAssignedByOther && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
          background: "#fef9ec", borderBottom: `1px solid #f59e0b44`, flexShrink: 0,
        }}>
          <CornerDownLeft size={13} color="#b45309" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e", fontFamily: F }}>
            Task assigned by <strong>{task.assigned_by}</strong>
          </span>
          <span style={{
            marginLeft: "auto", fontFamily: FM, fontSize: 10, fontWeight: 700,
            background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 4
          }}>
            RESTRICTED
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div ref={modalBodyRef} style={{
        flex: 1, overflowY: "auto", padding: "14px 16px 10px",
        display: "flex", flexDirection: "column", gap: 12
      }}>

        {/* ── Assign toggle — hidden if assigned by other ── */}
        {!isAssignedByOther && (
          <div style={{
            display: "flex", gap: 6, background: C.bg, borderRadius: 10,
            padding: 3, border: `1.5px solid ${C.border}`
          }}>
            {[{ v: "self", l: "Myself", Icon: UserCheck },
            { v: "assign", l: "Assign to someone", Icon: UserPlus }].map(({ v, l, Icon: Ic }) => (
              <button key={v} type="button" onClick={() => set("assign_type", v)}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8, border: "none",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: f.assign_type === v ? C.surface : "transparent",
                  color: f.assign_type === v ? C.blue : C.t3,
                  boxShadow: f.assign_type === v ? "0 1px 4px rgba(12,25,52,.1)" : "none",
                  transition: "all .14s"
                }}>
                <Ic size={13} strokeWidth={2} />{l}
              </button>
            ))}
          </div>
        )}

        {!isAssignedByOther && f.assign_type === "assign" && (
          <div data-assignee="1">
            <ERPAutocomplete
              value={f.assigned_to_name || ""}
              options={employees.map(e => e.user_name || e.user_id || e.Led_name).filter(Boolean)}
              onChange={val => {
                const emp = employees.find(e => (e.user_name || e.user_id || e.Led_name) === val);
                setF(p => ({
                  ...p, assigned_to_name: val,
                  assigned_to_id: emp?.userma_id || emp?.user_id || null,
                  assigned_by: currentUser?.user_id || null
                }));
              }}
              placeholder="Search employee to delegate…"
              className="erpac-inp" />
          </div>
        )}

        {/* ── Task title ── */}
        <div>
          <Lbl>Task title <span style={{ color: "#ef4444" }}>*</span></Lbl>
          <input ref={titleRef} value={f.work_plan}
            onChange={e => !isAssignedByOther && set("work_plan", e.target.value)}
            onKeyDown={onTitleKey}
            onFocus={isAssignedByOther ? undefined : inpFocus}
            onBlur={e => { if (!isAssignedByOther) { inpBlur(e); setTouched(true); } }}
            placeholder="What needs to be done?"
            disabled={isAssignedByOther}
            style={{
              ...inp, fontWeight: 600, width: "100%",
              ...(isAssignedByOther ? lockedStyle : {}),
              borderColor: touched && !f.work_plan?.trim() ? "#ef4444" : C.border
            }} />
          {touched && !f.work_plan?.trim() && (
            <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={10} /> Title is required
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div>
          <Lbl>Description</Lbl>
          <textarea ref={descRef} value={f.target}
            onChange={e => !isAssignedByOther && set("target", e.target.value)}
            onKeyDown={onDescKey}
            onFocus={isAssignedByOther ? undefined : inpFocus}
            onBlur={isAssignedByOther ? undefined : inpBlur}
            disabled={isAssignedByOther}
            placeholder="Context, links, acceptance criteria…"
            rows={2} style={{
              ...inp, resize: "none", lineHeight: 1.55, width: "100%",
              ...(isAssignedByOther ? lockedStyle : {})
            }} />
        </div>

        {/* ── Priority + Status ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* Priority — locked if assigned by other */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lbl>Priority</Lbl>
              {isAssignedByOther && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#b45309",
                  background: "#fef3c7", padding: "1px 6px", borderRadius: 4
                }}>LOCKED</span>
              )}
            </div>
            <div style={{
              display: "flex", gap: 4,
              ...(isAssignedByOther ? { pointerEvents: "none", opacity: 0.55 } : {})
            }}>
              {PRIO_OPTS.map(({ v, dot, bg, color }, idx) => (
                <button key={v} ref={prioRefs[idx]} type="button"
                  onClick={() => !isAssignedByOther && set("priority", v)}
                  onKeyDown={e => onPrioKey(e, idx)}
                  disabled={isAssignedByOther}
                  style={{
                    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    gap: 4, padding: "7px 4px", borderRadius: 8, border: "1.5px solid",
                    fontSize: 11, fontWeight: 700, fontFamily: F, transition: "all .13s",
                    background: f.priority === v ? bg : C.bg,
                    borderColor: f.priority === v ? color : C.border,
                    color: f.priority === v ? color : C.t4, outline: "none",
                    cursor: isAssignedByOther ? "not-allowed" : "pointer"
                  }}>
                  <PDot color={f.priority === v ? dot : C.t4} size={5} />{v}
                </button>
              ))}
            </div>
          </div>

          {/* Status — always editable */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lbl>Status</Lbl>
              {isAssignedByOther && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#15803d",
                  background: "#dcfce7", padding: "1px 6px", borderRadius: 4
                }}>EDITABLE</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {STATUS_OPTS.map(({ v, bg, color }, idx) => (
                <button key={v} ref={statRefs[idx]} type="button"
                  onClick={() => set("status", v)}
                  onKeyDown={e => onStatKey(e, idx)}
                  style={{
                    flex: 1, padding: "7px 2px", borderRadius: 8, border: "1.5px solid",
                    fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: F,
                    whiteSpace: "nowrap", textAlign: "center", transition: "all .13s",
                    background: f.status === v ? bg : C.bg,
                    borderColor: f.status === v ? color : C.border,
                    color: f.status === v ? color : C.t4, outline: "none"
                  }}>
                  {v === "In Progress" ? "Active" : v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category + Due date + Target hrs ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>

          {/* Category — locked */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lbl>Category</Lbl>
              {isAssignedByOther && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#b45309",
                  background: "#fef3c7", padding: "1px 6px", borderRadius: 4
                }}>LOCKED</span>
              )}
            </div>
            <div data-cat="1" style={isAssignedByOther ? { pointerEvents: "none", opacity: 0.55 } : {}}>
              <ERPAutocomplete value={f.category || ""} options={categoryOptions}
                onChange={v => { set("category", v); setTimeout(() => dueDateRef.current?.focus(), 50); }}
                onKeyDown={e => { if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); dueDateRef.current?.focus(); } }}
                placeholder="Type or select…" className="erpac-inp" />
            </div>
          </div>

          {/* Due date — locked */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lbl>Due date</Lbl>
              {isAssignedByOther && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#b45309",
                  background: "#fef3c7", padding: "1px 6px", borderRadius: 4
                }}>LOCKED</span>
              )}
            </div>
            <div style={isAssignedByOther ? { pointerEvents: "none", opacity: 0.55 } : {}}>
              <ERPDateInput ref={dueDateRef} value={f.due_date}
                onChange={v => { set("due_date", v); setTimeout(() => targetRef.current?.focus(), 50); }}
                onKeyDown={e => { if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); targetRef.current?.focus(); } }}
                className="erpac-inp" />
            </div>
          </div>

          {/* Target hrs — locked */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lbl>Target hrs</Lbl>
              {isAssignedByOther && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: "#b45309",
                  background: "#fef3c7", padding: "1px 6px", borderRadius: 4
                }}>LOCKED</span>
              )}
            </div>
            <input ref={targetRef} type="text" inputMode="decimal" value={f.expected_time}
              onChange={e => !isAssignedByOther && set("expected_time", e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={e => { if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); subInpRef.current?.focus(); } }}
              disabled={isAssignedByOther}
              placeholder="e.g. 2.5" style={{
                ...inp,
                ...(isAssignedByOther ? lockedStyle : {})
              }}
              onFocus={isAssignedByOther ? undefined : inpFocus}
              onBlur={isAssignedByOther ? undefined : inpBlur} />
          </div>
        </div>

        {/* ── Actual hrs — always editable in edit mode ── */}
        {isEdit && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <Lbl>Actual hrs logged</Lbl>
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#0369a1",
                background: "#e0f2fe", padding: "1px 7px", borderRadius: 4
              }}>
                {isAssignedByOther ? "YOU CAN EDIT" : "edit only"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="text" inputMode="decimal" value={f.actual_time}
                onChange={e => set("actual_time", e.target.value.replace(/[^0-9.]/g, ""))}
                onKeyDown={e => { if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); subInpRef.current?.focus(); } }}
                placeholder="Hours actually spent…"
                style={{ ...inp, flex: 1 }} onFocus={inpFocus} onBlur={inpBlur} />
              {parseFloat(f.expected_time) > 0 && parseFloat(f.actual_time) > 0 && (() => {
                const pct = Math.round((parseFloat(f.actual_time) / parseFloat(f.expected_time)) * 100);
                const col = pct > 100 ? "#b91c1c" : pct >= 80 ? "#b45309" : "#15803d";
                return (
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: FM, color: col }}>{pct}%</div>
                    <div style={{ fontSize: 9, color: C.t4 }}>used</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Sub-tasks — always editable ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Lbl>Sub-tasks</Lbl>
            {isAssignedByOther && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#15803d",
                background: "#dcfce7", padding: "1px 6px", borderRadius: 4
              }}>EDITABLE</span>
            )}
            {subtasks.length > 0 && (
              <span style={{
                fontFamily: FM, fontSize: 10, background: C.blueLight,
                color: C.blueDark, padding: "1px 7px", borderRadius: 999, fontWeight: 700
              }}>
                {subtasks.length}
              </span>
            )}
          </div>
          {subtasks.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
              {subtasks.map((s, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: C.blueLight, border: `1px solid ${C.blueBorder}`,
                  color: C.blueDark, padding: "3px 9px", borderRadius: 6,
                  fontSize: 11, fontWeight: 600
                }}>
                  {s}
                  <span onClick={() => setSubs(p => p.filter((_, j) => j !== i))}
                    style={{ cursor: "pointer", opacity: .5, display: "flex" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = ".5"}>
                    <X size={10} />
                  </span>
                </span>
              ))}
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: C.bg,
            border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "7px 12px",
            transition: "border-color .14s"
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = C.blue}
            onBlurCapture={e => e.currentTarget.style.borderColor = C.border}>
            <ListChecks size={12} color={C.t4} />
            <input ref={subInpRef} value={subInp}
              onChange={e => setSubInp(e.target.value)}
              onKeyDown={onSubKey}
              placeholder={subtasks.length ? "Add more…" : "Type sub-task, comma or Enter to add…"}
              style={{
                border: "none", background: "none", outline: "none",
                fontSize: 12, color: C.t1, flex: 1, fontFamily: F
              }} />
            {subInp && (
              <button onClick={addSub}
                style={{
                  background: C.blue, border: "none", borderRadius: 6, padding: "3px 8px",
                  cursor: "pointer", display: "flex", alignItems: "center"
                }}>
                <Check size={10} color="#fff" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* ── Remarks — always editable ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <Lbl>Remarks</Lbl>
            {isAssignedByOther && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#15803d",
                background: "#dcfce7", padding: "1px 6px", borderRadius: 4
              }}>EDITABLE</span>
            )}
          </div>
          <input ref={remarkRef} value={f.remarks}
            onChange={e => set("remarks", e.target.value)}
            onKeyDown={onRemarkKey}
            placeholder="Any additional notes… (Enter = save)"
            style={{ ...inp, width: "100%" }}
            onFocus={inpFocus} onBlur={inpBlur} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px", borderTop: `1.5px solid ${C.border}`,
        flexShrink: 0, background: C.bg
      }}>
        <div style={{
          fontSize: 11, color: C.t4, fontFamily: FM, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200
        }}>
          {isAssignedByOther
            ? `From ${task.assigned_by}${f.due_date ? ` · due ${f.due_date}` : ""}`
            : `${f.assign_type === "assign" && f.assigned_to_name ? `→ ${f.assigned_to_name}` : "Self task"}${f.due_date ? ` · ${f.due_date}` : ""}${f.expected_time ? ` · ${f.expected_time}h` : ""}`
          }
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`,
              background: C.surface, color: C.t3, cursor: "pointer", fontSize: 12,
              fontWeight: 600, fontFamily: F, transition: "all .13s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderS; e.currentTarget.style.color = C.t2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t3; }}>
            Cancel
          </button>
          <button ref={saveRef} onClick={handleSave}
            style={{
              ...btnPrimary, padding: "8px 20px", fontSize: 13,
              opacity: f.work_plan?.trim() ? 1 : .4,
              cursor: f.work_plan?.trim() ? "pointer" : "not-allowed",
              transition: "opacity .15s"
            }}
            disabled={!f.work_plan?.trim()}>
            <Save size={13} color="#fff" />
            {isEdit ? "Update Task" : "Save Task"}
          </button>
        </div>
      </div>

    </ModalShell>
  );
};


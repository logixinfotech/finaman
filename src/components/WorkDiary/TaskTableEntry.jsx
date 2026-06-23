// TaskTableEntry.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ERPAutocomplete from "../Reusable/input/ERPAutocomplete";
import ERPDateInput from "../Reusable/input/Date";
import { generateId } from "../../utils/helpers";
import { fetchSubtasks, deleteSubtask } from "../../utils/api";
import { C, F, FD, FM, newTask } from "./WorkDiaryForm";
import {
  Plus, Trash2, Save, X, ChevronDown, UserCheck, UserPlus, Check,
  ListChecks, ClipboardList, Loader2,
} from "lucide-react";

const PRIO_OPTS = ["High", "Medium", "Low"];
const STATUS_OPTS = ["Pending", "In Progress", "Completed", "Hold"];

const PRIO_COLORS = {
  High:   { bg:"#fef2f2", color:"#b91c1c", dot:"#ef4444", border:"#fecaca" },
  Medium: { bg:"#fffbeb", color:"#b45309", dot:"#f59e0b", border:"#fde68a" },
  Low:    { bg:"#f0fdf4", color:"#15803d", dot:"#22c55e", border:"#bbf7d0" },
};

const STATUS_COLORS = {
  Pending:       { bg:"#f5f3ff", color:"#6d28d9", border:"#ddd6fe" },
  "In Progress": { bg:"#eff8ff", color:"#0369a1", border:"#bae6fd" },
  Completed:     { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  Hold:          { bg:"#fef2f2", color:"#b91c1c", border:"#fecaca" },
};

// ─── Design tokens (local, layered on top of the app's C theme) ───
const SP   = { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24 };
const RAD  = { sm:6, md:8, lg:12, xl:16 };
const SHD  = {
  sm: "0 1px 2px rgba(15,23,42,.06)",
  md: "0 4px 14px rgba(15,23,42,.08)",
  lg: "0 16px 40px rgba(15,23,42,.16)",
};

// ─── SectionLabel ───────────────────────────────────────────────────
const SectionLabel = ({ children, right }) => (
  <div style={{
    display:"flex", alignItems:"center", justifyContent:"space-between",
    marginBottom: SP[3],
  }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ width:3, height:13, borderRadius:2, background:C.blue, display:"inline-block" }} />
      <span style={{
        fontSize:11, fontWeight:700, letterSpacing:"1px",
        textTransform:"uppercase", color:C.t3, fontFamily:F,
      }}>{children}</span>
    </div>
    {right}
  </div>
);

// ─── CellSelect ───────────────────────────────────────────────────
const CellSelect = ({ value, options, onChange, colorMap, dense=false }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const cfg = colorMap?.[value];

  const openMenu = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 140) });
    setOpen(true);
  }, []);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div style={{ position:"relative", width:"100%" }}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open ? setOpen(false) : openMenu(); }
        }}
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding: dense ? "5px 9px" : "6px 10px",
          borderRadius: RAD.sm, cursor:"pointer",
          fontSize:11.5, fontWeight:600, fontFamily:FM,
          background: cfg?.bg || "#f8fafc",
          color: cfg?.color || C.t2,
          border:`1px solid ${cfg?.border || C.border}`,
          whiteSpace:"nowrap", userSelect:"none",
          transition:"box-shadow .12s, border-color .12s",
          boxShadow: open ? `0 0 0 3px ${C.blue}1a` : "none",
        }}>
        {cfg?.dot && <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot, flexShrink:0 }} />}
        <span style={{ flex:1 }}>{value}</span>
        <ChevronDown size={11} style={{ opacity:.55, transform: open ? "rotate(180deg)" : "none", transition:"transform .15s" }} />
      </div>

      {open && pos && (
        <div ref={menuRef}
          style={{
            position:"fixed", zIndex:9999, top:pos.top, left:pos.left, minWidth:pos.width,
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius: RAD.md, boxShadow:SHD.lg,
            overflow:"hidden", animation:"ttePopIn .12s ease-out",
            transformOrigin:"top left",
          }}>
          {options.map(opt => {
            const oc = colorMap?.[opt];
            const selected = value === opt;
            return (
              <div key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  padding:"8px 12px", fontSize:12.5, fontWeight:600,
                  cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                  fontFamily:F,
                  background: selected ? (oc?.bg || "#f8fafc") : "transparent",
                  color: selected ? (oc?.color || C.t1) : C.t2,
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
                {oc?.dot && <span style={{ width:6, height:6, borderRadius:"50%", background:oc.dot, flexShrink:0 }} />}
                {opt}
                {selected && <Check size={12} style={{ marginLeft:"auto" }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── CellInput ────────────────────────────────────────────────────
const CellInput = ({ value, onChange, placeholder, onKeyDown }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={onKeyDown}
      style={{
        width:"100%", border:"1px solid transparent", outline:"none",
        fontSize:13, fontFamily:F, color:C.t1,
        padding:"6px 8px", borderRadius:RAD.sm,
        background: focused ? C.surface : "transparent",
        borderColor: focused ? C.blue : "transparent",
        boxShadow: focused ? `0 0 0 3px ${C.blue}1a` : "none",
        transition:"all .12s",
      }}
    />
  );
};

// ─── Field label ────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <div style={{ fontSize:11.5, fontWeight:600, color:C.t3, marginBottom:5, fontFamily:F }}>
    {children}{required && <span style={{ color:"#ef4444" }}> *</span>}
  </div>
);

// ─── TaskTableEntry ───────────────────────────────────────────────
export const TaskTableEntry = ({
  onClose, onSave, currentUser, employees=[], categoryOptions=[], initialTask=null,
}) => {

  const isEditMode = !!initialTask;

  const [header, setHeader] = useState(() => initialTask ? {
    work_plan:        initialTask.work_plan || "",
    target:           initialTask.target || "",
    priority:         initialTask.priority || "Medium",
    category:         initialTask.category || "Development",
    due_date:         initialTask.due_date || "",
    expected_time:    initialTask.expected_time || "",
    status:           initialTask.status || "Pending",
    assign_type:      initialTask.assign_type || "self",
    assigned_to_id:   initialTask.assigned_to_id ?? (currentUser?.userma_id || null),
    assigned_to_name: initialTask.assigned_to_name ?? (currentUser?.user_id || null),
    assigned_by:      initialTask.assigned_by ?? null,
  } : {
    work_plan: "", target: "", priority: "Medium", category: "Development",
    due_date: "", expected_time: "", status: "Pending", assign_type: "self",
    assigned_to_id: currentUser?.userma_id || null,
    assigned_to_name: currentUser?.user_id || null,
    assigned_by: null,
  });

  const [rows, setRows] = useState([
    { _key: generateId(), subtask_text:"", priority:"Medium", status:"Pending" },
  ]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const setH = useCallback((k, v) => setHeader(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    if (!initialTask?.line_id) return;
    setSubtasksLoading(true);
    fetchSubtasks(initialTask.line_id)
      .then(r => {
        const existing = (Array.isArray(r) ? r : r?.data || []).map(s => ({
          _key: generateId(),
          subtask_id: s.subtask_id,
          subtask_text: s.subtask_text,
          is_done: s.is_done,
          priority: "Medium",
          status: s.is_done ? "Completed" : "Pending",
        }));
        if (existing.length) setRows(existing);
      })
      .catch(() => {})
      .finally(() => setSubtasksLoading(false));
  }, [initialTask?.line_id]);

  const handleAssignType = useCallback(type => {
    if (type === "self") {
      setHeader(p => ({
        ...p, assign_type:"self",
        assigned_to_id:   currentUser?.userma_id || null,
        assigned_to_name: currentUser?.user_id   || null,
        assigned_by:      null,
      }));
    } else {
      setHeader(p => ({
        ...p, assign_type:"assign",
        assigned_to_name:"", assigned_to_id:null,
        assigned_by: currentUser?.user_id || null,
      }));
    }
  }, [currentUser]);

  const addRow = useCallback(() => {
    setRows(p => [...p, { _key: generateId(), subtask_text:"", priority:"Medium", status:"Pending" }]);
  }, []);

  const delRow = useCallback(key => {
    setRows(p => {
      if (p.length === 1) return p;
      const row = p.find(r => r._key === key);
      if (row?.subtask_id) deleteSubtask(row.subtask_id).catch(() => {});
      return p.filter(r => r._key !== key);
    });
  }, []);

  const updateRow = useCallback((key, field, value) => {
    setRows(p => p.map(r => r._key === key ? { ...r, [field]: value } : r));
  }, []);

  const handleLastCellTab = useCallback((e, key) => {
    const isLastRow = rows[rows.length - 1]._key === key;
    if (e.key === "Tab" && !e.shiftKey && isLastRow) {
      e.preventDefault();
      addRow();
    }
  }, [rows, addRow]);

  const handleSave = useCallback(() => {
    if (!header.work_plan?.trim()) { setTouched(true); return; }

    const validSubtasks = rows
      .filter(r => !r.subtask_id && r.subtask_text?.trim())
      .map(r => r.subtask_text.trim());

    const task = {
      ...newTask(currentUser),
      ...(isEditMode
        ? { _key: initialTask._key, line_id: initialTask.line_id, diary_id: initialTask.diary_id }
        : { _key: generateId() }),
      work_plan:        header.work_plan.trim(),
      target:           header.target.trim(),
      priority:         header.priority,
      category:         header.category,
      due_date:         header.due_date,
      expected_time:    header.expected_time,
      status:           header.status,
      assign_type:      header.assign_type,
      assigned_to_id:   header.assigned_to_id,
      assigned_to_name: header.assigned_to_name,
      assigned_by:      header.assigned_by,
      _pendingSubtasks: validSubtasks,
    };

    onSave(task);
  }, [header, rows, currentUser, onSave, isEditMode, initialTask]);

  const validRows = rows.filter(r => r.subtask_text?.trim()).length;
  const savedRows = rows.filter(r => r.subtask_id).length;

  const CAT_OPTIONS = categoryOptions.length
    ? categoryOptions
    : ["Development","Testing","Meeting","Review","Support","Documentation","Other"];

  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:12 }}
      transition={{ duration:.16 }}
      style={{
        display:"flex", flexDirection:"column",
        background:C.surface, borderRadius:RAD.xl,
        border:`1px solid ${C.border}`,
        boxShadow:SHD.lg,
        overflow:"hidden", width:"100%", height:"100%",
      }}>

      {/* ── Header bar ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:SP[3],
        padding:`${SP[3]}px ${SP[4]}px`, borderBottom:`1px solid ${C.border}`,
        background:C.surface, flexShrink:0,
      }}>
        <div style={{
          width:34, height:34, borderRadius:RAD.md, background:C.blue,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 2px 8px ${C.blue}40`, flexShrink:0,
        }}>
          <ListChecks size={16} color="#fff" strokeWidth={2.25} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:FD, fontSize:15, fontWeight:800, color:C.t1, lineHeight:1.2 }}>
            {isEditMode ? "Edit task" : "New task"}
          </div>
          <div style={{ fontSize:11.5, color:C.t4, marginTop:2, display:"flex", alignItems:"center", gap:5, fontFamily:F }}>
            {subtasksLoading
              ? <><Loader2 size={11} style={{ animation:"tteSpin .8s linear infinite" }} /> Loading subtasks…</>
              : "Fill task details, then list subtasks in the table"}
          </div>
        </div>
        <button onClick={onClose}
          aria-label="Close"
          style={{
            marginLeft:"auto", width:30, height:30, borderRadius:RAD.sm,
            background:"transparent", border:`1px solid ${C.border}`,
            cursor:"pointer", color:C.t3, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .14s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; e.currentTarget.style.color="#b91c1c"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.t3; }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* ── Main Task Section ── */}
        <div style={{ padding:`${SP[4]}px ${SP[4]}px ${SP[3]}px`, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <SectionLabel>Task details</SectionLabel>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:SP[3], marginBottom:SP[3] }}>
            <div>
              <Label required>Work plan</Label>
              <input
                value={header.work_plan}
                onChange={e => setH("work_plan", e.target.value)}
                placeholder="What needs to be done?"
                style={{
                  width:"100%", padding:"9px 12px",
                  border:`1px solid ${touched && !header.work_plan?.trim() ? "#ef4444" : C.border}`,
                  borderRadius:RAD.sm, fontSize:13.5, fontFamily:F,
                  outline:"none", background:C.bg, color:C.t1,
                  boxShadow: touched && !header.work_plan?.trim() ? "0 0 0 3px #fee2e2" : "none",
                  transition:"all .12s",
                }}
                onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background=C.surface; e.target.style.boxShadow=`0 0 0 3px ${C.blue}1a`; }}
                onBlur={e => {
                  e.target.style.borderColor = touched && !header.work_plan?.trim() ? "#ef4444" : C.border;
                  e.target.style.background = C.bg;
                  e.target.style.boxShadow = touched && !header.work_plan?.trim() ? "0 0 0 3px #fee2e2" : "none";
                }}
              />
              {touched && !header.work_plan?.trim() && (
                <div style={{ fontSize:11, color:"#ef4444", marginTop:4, fontFamily:F }}>Work plan is required</div>
              )}
            </div>
            <div>
              <Label>Target / output</Label>
              <input
                value={header.target}
                onChange={e => setH("target", e.target.value)}
                placeholder="Expected deliverable…"
                style={{
                  width:"100%", padding:"9px 12px",
                  border:`1px solid ${C.border}`, borderRadius:RAD.sm,
                  fontSize:13.5, fontFamily:F, outline:"none",
                  background:C.bg, color:C.t1, transition:"all .12s",
                }}
                onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background=C.surface; e.target.style.boxShadow=`0 0 0 3px ${C.blue}1a`; }}
                onBlur={e => { e.target.style.borderColor=C.border; e.target.style.background=C.bg; e.target.style.boxShadow="none"; }}
              />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1.3fr 1fr 0.8fr 1.1fr", gap:SP[3], marginBottom:SP[3] }}>
            <div>
              <Label>Priority</Label>
              <div style={{ display:"flex", gap:4, background:C.bg, padding:3, borderRadius:RAD.sm, border:`1px solid ${C.border}` }}>
                {PRIO_OPTS.map(v => {
                  const pc = PRIO_COLORS[v];
                  const active = header.priority === v;
                  return (
                    <button key={v} onClick={() => setH("priority", v)}
                      style={{
                        flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                        padding:"5px 4px", borderRadius:5, border:"none",
                        fontSize:10.5, fontWeight:700, cursor:"pointer", fontFamily:F,
                        background: active ? C.surface : "transparent",
                        color: active ? pc.color : C.t4,
                        boxShadow: active ? SHD.sm : "none",
                        transition:"all .14s",
                      }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:pc.dot, flexShrink:0 }} />
                      {v === "Medium" ? "Med" : v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <ERPAutocomplete
                value={header.category}
                options={CAT_OPTIONS}
                onChange={v => setH("category", v)}
                placeholder="Category…"
                style={{
                  fontSize:12.5, padding:"7px 10px",
                  border:`1px solid ${C.border}`, borderRadius:RAD.sm,
                  background:C.bg, outline:"none", width:"100%",
                }}
              />
            </div>

            <div>
              <Label>Due date</Label>
              <ERPDateInput
                value={header.due_date}
                onChange={v => setH("due_date", v)}
                style={{
                  fontSize:12.5, padding:"7px 10px",
                  border:`1px solid ${C.border}`, borderRadius:RAD.sm,
                  background:C.bg, outline:"none", width:"100%",
                }}
              />
            </div>

            <div>
              <Label>Exp. hrs</Label>
              <input
                type="text" inputMode="decimal"
                value={header.expected_time}
                onChange={e => setH("expected_time", e.target.value.replace(/[^0-9.]/g,""))}
                placeholder="2.5"
                style={{
                  width:"100%", padding:"7px 10px",
                  border:`1px solid ${C.border}`, borderRadius:RAD.sm,
                  fontSize:12.5, fontFamily:F, outline:"none",
                  background:C.bg, color:C.t1, transition:"all .12s",
                }}
                onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.boxShadow=`0 0 0 3px ${C.blue}1a`; }}
                onBlur={e => { e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; }}
              />
            </div>

            <div>
              <Label>Status</Label>
              <CellSelect
                value={header.status}
                options={STATUS_OPTS}
                onChange={v => setH("status", v)}
                colorMap={STATUS_COLORS}
              />
            </div>
          </div>

          <div>
            <Label>Assign to</Label>
            <div style={{ display:"flex", alignItems:"center", gap:SP[2] }}>
              <div style={{ display:"flex", background:C.bg, borderRadius:RAD.sm,
                border:`1px solid ${C.border}`, padding:3, gap:2, flexShrink:0 }}>
                {[
                  { v:"self",   Icon:UserCheck, l:"Myself"  },
                  { v:"assign", Icon:UserPlus,  l:"Someone else" },
                ].map(({ v, Icon, l }) => (
                  <button key={v} onClick={() => handleAssignType(v)}
                    style={{
                      padding:"6px 12px", borderRadius:6, border:"none",
                      fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:F,
                      display:"flex", alignItems:"center", gap:6,
                      background:  header.assign_type===v ? C.surface : "transparent",
                      color:       header.assign_type===v ? C.blue    : C.t4,
                      boxShadow:   header.assign_type===v ? SHD.sm : "none",
                      transition:"all .14s",
                    }}>
                    <Icon size={12} strokeWidth={2.25} />{l}
                  </button>
                ))}
              </div>

              {header.assign_type === "self" ? (
                <div style={{ fontSize:12.5, fontWeight:600, color:C.t2,
                  padding:"7px 14px", background:C.bg,
                  border:`1px solid ${C.border}`, borderRadius:RAD.sm }}>
                  {currentUser?.user_id || "Me"}
                </div>
              ) : (
                <div style={{ flex:1, maxWidth:280 }}>
                  <ERPAutocomplete
                    value={header.assigned_to_name||""}
                    options={employees.map(e=>e.user_name||e.user_id||e.Led_name).filter(Boolean)}
                    onChange={val => {
                      const emp = employees.find(e=>(e.user_name||e.user_id||e.Led_name)===val);
                      setHeader(p => ({
                        ...p,
                        assigned_to_name: val,
                        assigned_to_id:   emp?.userma_id||emp?.user_id||null,
                        assigned_by:      currentUser?.user_id||null,
                      }));
                    }}
                    placeholder="Search employee…"
                    style={{
                      fontSize:12.5, padding:"7px 12px",
                      border:`1px solid ${C.border}`, borderRadius:RAD.sm,
                      background:C.bg, outline:"none", width:"100%",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Subtasks Section ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:`${SP[4]}px ${SP[4]}px 0` }}>
          <SectionLabel right={
            <span style={{ fontSize:11.5, color:C.t4, fontFamily:FM }}>
              {validRows + savedRows > 0
                ? `${validRows + savedRows} subtask${(validRows+savedRows)>1?"s":""}${savedRows ? ` · ${savedRows} saved` : ""}`
                : "No subtasks yet"}
            </span>
          }>
            Subtasks
          </SectionLabel>

          <div style={{ border:`1px solid ${C.border}`, borderRadius:RAD.md, overflow:"hidden", flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            {/* Table header */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 110px 130px 36px", gap:0,
              background:"#f8fafc", borderBottom:`1px solid ${C.border}`,
              padding:"8px 14px", flexShrink:0,
            }}>
              {["Subtask", "Priority", "Status", ""].map((h, i) => (
                <div key={i} style={{
                  fontSize:10, fontWeight:700, color:C.t4,
                  textTransform:"uppercase", letterSpacing:"0.8px", fontFamily:FM,
                  paddingRight: i < 3 ? 10 : 0,
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            <div style={{ flex:1, overflowY:"auto", minHeight:160 }}>
              {rows.map((row, idx) => (
                <div key={row._key}
                  style={{
                    display:"grid", gridTemplateColumns:"1fr 110px 130px 36px", gap:0,
                    borderBottom:`1px solid #f1f5f9`,
                    background: row.subtask_id ? "#fafdff" : (idx%2===0 ? C.surface : "#fbfbfc"),
                    alignItems:"center", padding:"5px 14px", minHeight:42,
                    transition:"background .12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="#f0f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background = row.subtask_id ? "#fafdff" : (idx%2===0?C.surface:"#fbfbfc")}>

                  <div style={{ paddingRight:10, display:"flex", alignItems:"center", gap:6 }}>
                    {row.subtask_id && <ClipboardList size={11} color={C.t4} style={{ flexShrink:0 }} />}
                    <div style={{ flex:1 }}>
                      <CellInput
                        value={row.subtask_text}
                        onChange={v => updateRow(row._key, "subtask_text", v)}
                        placeholder={`Subtask ${idx+1}…`}
                        onKeyDown={e => {
                          if (e.key === "Enter") { e.preventDefault(); addRow(); }
                          handleLastCellTab(e, row._key);
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ paddingRight:10 }}>
                    <CellSelect
                      value={row.priority}
                      options={PRIO_OPTS}
                      onChange={v => updateRow(row._key, "priority", v)}
                      colorMap={PRIO_COLORS}
                      dense
                    />
                  </div>

                  <div style={{ paddingRight:10 }} onKeyDown={e => handleLastCellTab(e, row._key)}>
                    <CellSelect
                      value={row.status}
                      options={STATUS_OPTS}
                      onChange={v => updateRow(row._key, "status", v)}
                      colorMap={STATUS_COLORS}
                      dense
                    />
                  </div>

                  <button onClick={() => delRow(row._key)}
                    disabled={rows.length===1}
                    title={rows.length===1 ? "At least one row is required" : "Delete subtask"}
                    style={{
                      width:26, height:26, borderRadius:RAD.sm,
                      border:`1px solid ${C.border}`, background:C.bg,
                      cursor: rows.length===1 ? "not-allowed" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color: rows.length===1 ? C.t4 : "#b91c1c",
                      opacity: rows.length===1 ? .4 : 1,
                      transition:"all .14s",
                    }}
                    onMouseEnter={e=>{ if(rows.length>1){ e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; }}}
                    onMouseLeave={e=>{ e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border; }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:`${SP[3]}px ${SP[4]}px`, borderTop:`1px solid ${C.border}`,
        background:C.surface, flexShrink:0, marginTop:SP[4],
      }}>
        <button onClick={addRow}
          style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
            borderRadius:RAD.sm, border:`1px dashed ${C.blue}66`,
            background:C.blueLight, color:C.blue,
            cursor:"pointer", fontSize:12.5, fontWeight:700, fontFamily:F,
            transition:"all .14s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background=C.blue; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor=C.blue; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=C.blueLight; e.currentTarget.style.color=C.blue; e.currentTarget.style.borderColor=`${C.blue}66`; }}>
          <Plus size={13} /> Add subtask
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onClose}
            style={{ padding:"9px 16px", borderRadius:RAD.sm,
              border:`1px solid ${C.border}`, background:"transparent",
              color:C.t3, cursor:"pointer", fontSize:12.5, fontWeight:600, fontFamily:F,
              transition:"all .14s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.bg; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}>
            Cancel
          </button>

          <button onClick={handleSave}
            disabled={!header.work_plan?.trim()}
            style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"9px 20px", borderRadius:RAD.sm, border:"none",
              background: header.work_plan?.trim() ? C.blue : "#cbd5e1",
              color:"#fff", cursor: header.work_plan?.trim() ? "pointer" : "not-allowed",
              fontSize:12.5, fontWeight:700, fontFamily:F,
              boxShadow: header.work_plan?.trim() ? `0 4px 14px ${C.blue}40` : "none",
              transition:"all .15s",
            }}>
            <Save size={13} />
            {isEditMode ? "Update task" : "Save task"}
            {(validRows>0) ? ` + ${validRows}` : ""}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ttePopIn { from { opacity:0; transform:scale(.96) translateY(-2px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes tteSpin { to { transform:rotate(360deg); } }
      `}</style>
    </motion.div>
  );
};

export default TaskTableEntry;
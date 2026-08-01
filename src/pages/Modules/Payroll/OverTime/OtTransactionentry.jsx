import React, { useState, useEffect, useCallback, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import {
  getActledList, getOTRules, calculateOT,
} from "../../../../utils/api";

const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastFn = null;
const toast = (msg, type = "success") => { if (_toastFn) _toastFn(msg, type); };

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = Date.now();
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };
    return () => { _toastFn = null; };
  }, []);
  const C = {
    success: { bg:"#f0fdf4", b:"#86efac", tx:"#166534" },
    error:   { bg:"#fef2f2", b:"#fca5a5", tx:"#991b1b" },
    info:    { bg:"#eff6ff", b:"#93c5fd", tx:"#1e40af" },
    warning: { bg:"#fffbeb", b:"#fcd34d", tx:"#92400e" },
  };
  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => {
        const c = C[t.type] || C.info;
        return (
          <div key={t.id} style={{ background:c.bg, border:`1px solid ${c.b}`, borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(0,0,0,0.12)", minWidth:270, fontFamily:FONT, animation:"slideIn 0.2s ease", pointerEvents:"auto" }}>
            <span style={{ fontSize:12, color:c.tx, fontWeight:600 }}>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVT = [["#dbeafe","#1d4ed8"],["#dcfce7","#15803d"],["#fef3c7","#b45309"],["#fce7f3","#be185d"],["#ede9fe","#6d28d9"],["#cffafe","#0e7490"]];
const getAC = (id) => AVT[(parseInt(id,10)||0) % AVT.length];
const getIn = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : p[0].substring(0,2).toUpperCase();
};

const STATUS_CONFIG = {
  Pending:  { bg:"#fffbeb", color:"#92400e", border:"#fcd34d", dot:"#f59e0b" },
  Approved: { bg:"#f0fdf4", color:"#166534", border:"#86efac", dot:"#16a34a" },
  Rejected: { bg:"#fef2f2", color:"#991b1b", border:"#fca5a5", dot:"#dc2626" },
};

const DAY_TYPES = ["Day OT", "Holiday OT", "Weekoff OT"];

// ── Input style helper ────────────────────────────────────────────────────────
const inpStyle = (dis) => ({
  width:"100%", height:34, padding:"0 10px", fontSize:13,
  border:`1px solid ${dis ? "#e2e8f0" : "#cbd5e1"}`,
  borderRadius:6, outline:"none", fontFamily:FONT,
  background: dis ? "#f8fafc" : "#fff",
  color: dis ? "#94a3b8" : "#1e293b",
  cursor: dis ? "not-allowed" : "text",
  transition:"border-color 0.15s, box-shadow 0.15s",
  boxSizing:"border-box",
});

const LBL = {
  fontSize:11, fontWeight:700, color:"#64748b",
  textTransform:"uppercase", letterSpacing:"0.05em",
  marginBottom:4, display:"block",
};

// ═════════════════════════════════════════════════════════════════════════════
const OTTransactionForm = ({
  formData, setFormData,
  mode = "view",
  onSave, onCancel, onDelete, onModify, onNewEntry, onEditCancel,
  saving, canPrint, rights,
  activeTab = "entry", onTabChange,
  currentRecord, totalRecords,onPrevRecord,onNextRecord
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd  = mode === "add";

  const [employees,   setEmployees]   = useState([]);
  const [calculating, setCalculating] = useState(false);
  const firstRef = useRef(null);

  // Load employees
  useEffect(() => {
    (async () => {
      try {
        const res = await getActledList();
        setEmployees(Array.isArray(res) ? res : res?.data || []);
      } catch(e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (isAdd || isEdit) setTimeout(() => firstRef.current?.focus(), 150);
  }, [isAdd, isEdit]);

  // Auto-calculate
  const handleAutoCalc = useCallback(async () => {
    if (!formData.employee_id || !formData.ot_date || !formData.day_type) {
      toast("Employee, Date aur Day Type select karo pehle", "warning");
      return;
    }
    setCalculating(true);
    try {
      const res = await calculateOT({
        employee_id: formData.employee_id,
        ot_date:     formData.ot_date,
        day_type:    formData.day_type,
      });
      if (res?.success && res.data) {
        const d = res.data;
        setFormData(prev => ({
          ...prev,
          shift_id:         d.shift_id,
          actual_ot_hours:  d.actual_ot_hours,
          payable_ot_hours: d.payable_ot_hours,
          rule_id:          d.rule_id,
          ot_multiplier:    d.ot_multiplier,
          hourly_rate:      d.hourly_rate,
          ot_amount:        d.ot_amount,
        }));
        toast(`Auto-calculated ✓  Payable: ${d.payable_ot_hours} hrs  |  ₹${d.ot_amount}`, "success");
      } else {
        toast("Attendance ya Shift data nahi mila is date ke liye", "warning");
      }
    } catch(e) { toast("Calculation failed", "error"); }
    finally { setCalculating(false); }
  }, [formData.employee_id, formData.ot_date, formData.day_type, setFormData]);

  const handleChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleEmployeeSelect = (label) => {
    const emp = employees.find(e => e.Led_name === label);
    if (emp) setFormData(prev => ({
      ...prev,
      employee_id:   emp.Actled_id,
      employee_name: emp.Led_name,
      employee_code: emp.Led_code,
    }));
  };

  // Recalc amount when hours/rate/multiplier change manually
  const recalcAmount = (field, value) => {
    const n = parseFloat(value) || 0;
    setFormData(prev => {
      const updated = { ...prev, [field]: n };
      const amt = (updated.payable_ot_hours||0) * (updated.hourly_rate||0) * (updated.ot_multiplier||1);
      return { ...updated, ot_amount: Math.round(amt*100)/100 };
    });
  };

  const empOptions    = employees.map(e => e.Led_name);
  const selectedName  = employees.find(e => String(e.Actled_id) === String(formData.employee_id))?.Led_name || "";
  const statusCfg     = STATUS_CONFIG[formData.status || "Pending"];
  const [bg0, tc0]    = getAC(formData.employee_id);
  const calcDisabled  = isView || calculating || !formData.employee_id || !formData.ot_date || !formData.day_type;

  return (
    <>
      <ToastContainer />
      <div className="h-full sm:h-calc(100vh-100px)" style={{ fontFamily:FONT, width:"100%",  display:"flex", flexDirection:"column", background:"#f1f5f9", borderRadius:12, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>

        <ERPHeader
          title="OT TRANSACTION"
          isAddMode={isAdd} isEditMode={isEdit} isViewMode={isView}
          activeTab={activeTab} onTabChange={onTabChange}
          rightContent={`${currentRecord||1} / ${totalRecords||1}`}
            currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
        />

        <div style={{ flex:1, overflow:"auto", padding:"14px 18px", display:"flex", flexDirection:"column", gap:12 }}>

          {/* ── EMPLOYEE HEADER CARD ─────────────────────────────────────── */}
          <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"12px 16px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ width:46, height:46, borderRadius:11, background:bg0, color:tc0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, flexShrink:0, letterSpacing:"-0.02em" }}>
              {formData.employee_name ? getIn(formData.employee_name) : "?"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {formData.employee_name || "Select Employee"}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginTop:2 }}>
                {formData.employee_code || "—"}
                {formData.ot_date ? ` • ${new Date(formData.ot_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}` : ""}
              </div>
            </div>
            {/* Status pill */}
            <div style={{ background:statusCfg.bg, border:`1.5px solid ${statusCfg.border}`, borderRadius:20, padding:"5px 14px", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:statusCfg.dot }} />
              <span style={{ fontSize:11, fontWeight:800, color:statusCfg.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {formData.status || "Pending"}
              </span>
            </div>
          </div>

          {/* ── TWO COLUMN GRID ──────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, flex:1 }}>

            {/* LEFT — Basic Details */}
            <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"16px 18px", display:"flex", flexDirection:"column", gap:13, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.08em", paddingBottom:8, borderBottom:"2px solid #e0e7ff" }}>
                Basic Details
              </div>

              {/* Employee */}
              <div>
                <label style={LBL}>Employee <span style={{color:"#ef4444"}}>*</span></label>
                <ERPAutocomplete
                  ref={firstRef}
                  disabled={isView}
                  options={empOptions}
                  value={selectedName}
                  onChange={handleEmployeeSelect}
                  style={inpStyle(isView)}
                />
              </div>

              {/* OT Date */}
              <div>
                <label style={LBL}>OT Date <span style={{color:"#ef4444"}}>*</span></label>
                <input
                  type="date"
                  disabled={isView}
                  value={formData.ot_date || ""}
                  onChange={e => handleChange("ot_date", e.target.value)}
                  onFocus={e => { if(!isView){ e.target.style.borderColor="#6366f1"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.1)"; }}}
                  onBlur={e => { e.target.style.borderColor="#cbd5e1"; e.target.style.boxShadow="none"; }}
                  style={inpStyle(isView)}
                />
              </div>

              {/* Day Type */}
              <div>
                <label style={LBL}>Day Type <span style={{color:"#ef4444"}}>*</span></label>
                <select
                  disabled={isView}
                  value={formData.day_type || ""}
                  onChange={e => handleChange("day_type", e.target.value)}
                  style={{ ...inpStyle(isView), cursor: isView ? "not-allowed" : "pointer" }}
                >
                  <option value="">— Select —</option>
                  {DAY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Status buttons — add/edit only */}
              {(isEdit || isAdd) && (
                <div>
                  <label style={LBL}>Status</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["Pending","Approved","Rejected"].map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const active = (formData.status || "Pending") === s;
                      return (
                        <button key={s} onClick={() => handleChange("status", s)}
                          style={{ flex:1, padding:"7px 0", borderRadius:7, border:`1.5px solid ${active?cfg.border:"#e2e8f0"}`, background:active?cfg.bg:"#f8fafc", color:active?cfg.color:"#94a3b8", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div style={{ flex:1 }}>
                <label style={LBL}>Remarks</label>
                <textarea
                  disabled={isView}
                  value={formData.remarks || ""}
                  onChange={e => handleChange("remarks", e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  style={{ ...inpStyle(isView), height:"auto", padding:"8px 10px", resize:"vertical", lineHeight:1.5 }}
                />
              </div>
            </div>

            {/* RIGHT — Calculation */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Auto-Calculate banner */}
              <div style={{ background:"linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)", borderRadius:10, padding:"14px 18px", color:"#fff", boxShadow:"0 4px 16px rgba(99,102,241,0.3)" }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", opacity:0.85, marginBottom:6 }}>
                  Auto Calculate OT
                </div>
                <div style={{ fontSize:11, opacity:0.7, marginBottom:12, lineHeight:1.6 }}>
                  Attendance + Shift data se actual OT hours automatically calculate hoga
                </div>
                <button
                  disabled={calcDisabled}
                  onClick={handleAutoCalc}
                  style={{
                    background: calculating ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.95)",
                    color:"#4f46e5", border:"none", borderRadius:7, padding:"7px 20px",
                    fontSize:12, fontWeight:700,
                    cursor: calcDisabled ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", gap:7,
                    opacity: calcDisabled ? 0.55 : 1,
                    transition:"all 0.15s", fontFamily:FONT,
                  }}
                >
                  {calculating
                    ? <><svg style={{animation:"spin 1s linear infinite",width:13,height:13}} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Calculating...</>
                    : <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/></svg>Calculate Now</>
                  }
                </button>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>

              {/* OT Calculation fields */}
              <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"16px 18px", flex:1, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#0ea5e9", textTransform:"uppercase", letterSpacing:"0.08em", paddingBottom:8, borderBottom:"2px solid #e0f2fe", marginBottom:14 }}>
                  OT Calculation
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

                  {/* Actual OT Hours */}
                  <div>
                    <label style={LBL}>Actual OT Hrs</label>
                    <div style={{ position:"relative" }}>
                      <input type="number" step="0.01" disabled={isView}
                        value={formData.actual_ot_hours ?? ""}
                        onChange={e => handleChange("actual_ot_hours", parseFloat(e.target.value)||0)}
                        placeholder="0.00"
                        style={{ ...inpStyle(isView), paddingRight:32 }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#94a3b8", fontWeight:600 }}>hrs</span>
                    </div>
                  </div>

                  {/* Payable OT Hours */}
                  <div>
                    <label style={LBL}>Payable OT Hrs</label>
                    <div style={{ position:"relative" }}>
                      <input type="number" step="0.01" disabled={isView}
                        value={formData.payable_ot_hours ?? ""}
                        onChange={e => recalcAmount("payable_ot_hours", e.target.value)}
                        placeholder="0.00"
                        style={{ ...inpStyle(isView), paddingRight:32, borderColor:"#a5f3fc", background: isView ? "#f8fafc" : "#f0f9ff" }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#0ea5e9", fontWeight:600 }}>hrs</span>
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label style={LBL}>Hourly Rate</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#64748b", fontWeight:600, zIndex:1 }}>₹</span>
                      <input type="number" step="0.01" disabled={isView}
                        value={formData.hourly_rate ?? ""}
                        onChange={e => recalcAmount("hourly_rate", e.target.value)}
                        placeholder="0.00"
                        style={{ ...inpStyle(isView), paddingLeft:22 }}
                      />
                    </div>
                  </div>

                  {/* Multiplier */}
                  <div>
                    <label style={LBL}>Multiplier</label>
                    <input type="number" step="0.01" disabled={isView}
                      value={formData.ot_multiplier ?? ""}
                      onChange={e => recalcAmount("ot_multiplier", e.target.value)}
                      placeholder="1.5"
                      style={inpStyle(isView)}
                    />
                  </div>
                </div>

                {/* OT Amount highlight box */}
                <div style={{ marginTop:16, background:"linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)", borderRadius:8, padding:"13px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 12px rgba(14,165,233,0.25)" }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.06em" }}>OT Amount</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", marginTop:2 }}>
                      {formData.payable_ot_hours||0} hrs × ₹{formData.hourly_rate||0} × {formData.ot_multiplier||1}
                    </div>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>
                    ₹{(formData.ot_amount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── VIEW MODE SUMMARY STRIP ──────────────────────────────────── */}
          {isView && (
            <div style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:"12px 18px", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              {[
                ["Day Type",     formData.day_type||"—",                                     "#6366f1"],
                ["Actual Hrs",   `${formData.actual_ot_hours||0} hrs`,                       "#0ea5e9"],
                ["Payable Hrs",  `${formData.payable_ot_hours||0} hrs`,                      "#10b981"],
                ["Rate × Multi", `₹${formData.hourly_rate||0} × ${formData.ot_multiplier||1}`,"#f59e0b"],
                ["OT Amount",    `₹${(formData.ot_amount||0).toLocaleString("en-IN")}`,      "#ef4444"],
              ].map(([lbl,val,color]) => (
                <div key={lbl} style={{ textAlign:"center", padding:"10px 8px", background:"#f8fafc", borderRadius:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{lbl}</div>
                  <div style={{ fontSize:14, fontWeight:800, color }}>{val}</div>
                </div>
              ))}
            </div>
          )}

        </div>

        <ERPFooter
          isAddMode={isAdd} isEditMode={isEdit} isViewMode={isView}
          handleSubmit={onSave}
          onCancel={onCancel}
          onModify={() => onModify?.(formData)}
          onDelete={() => onDelete?.(formData)}
          onNewEntry={onNewEntry}
          onEditCancel={onEditCancel}
          saving={saving} canPrint={canPrint} rights={rights}
          showPrevious={false} showNext={false}
        />
      </div>
    </>
  );
};

export default OTTransactionForm;
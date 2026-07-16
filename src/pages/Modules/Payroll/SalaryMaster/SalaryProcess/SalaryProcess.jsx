import { useState, useEffect, useRef, useMemo } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import TableExport from "../../../../../components/Reusable/table/TableExport";
import { RefreshCw, Search, X, Filter, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import {
  getPayrollMonthly, approvePayroll, bulkUpdatePayrollStatus, calculatePayroll, 
} from "../../../../../utils/api";
import { downloadPayslip } from "../../../../../utils/Payslipdownload";
// ─── DATA ────────────────────────────────────────────────────────────────────
const EMPS = [
  { id: 1, name: "Arjun Mehta", dept: "Engineering", role: "Sr. Engineer", basic: 65000, hra: 26000, special: 12000, travel: 3000 },
  
];

const ATT_BASE = {
  1: { p: 24, w: 26, lop: 2, ot: 8, bonus: 5000, arrear: 0, tds: 4200 },
  2: { p: 26, w: 26, lop: 0, ot: 0, bonus: 8000, arrear: 2000, tds: 6100 },
  3: { p: 22, w: 26, lop: 4, ot: 12, bonus: 0, arrear: 0, tds: 2800 },
  4: { p: 25, w: 26, lop: 1, ot: 0, bonus: 3000, arrear: 0, tds: 3100 },
  5: { p: 26, w: 26, lop: 0, ot: 16, bonus: 0, arrear: 1500, tds: 3800 },
  6: { p: 23, w: 26, lop: 3, ot: 0, bonus: 4000, arrear: 0, tds: 3400 },
  7: { p: 26, w: 26, lop: 0, ot: 4, bonus: 6000, arrear: 0, tds: 4500 },
  8: { p: 24, w: 26, lop: 2, ot: 0, bonus: 2500, arrear: 0, tds: 3000 },
  9: { p: 26, w: 26, lop: 0, ot: 10, bonus: 0, arrear: 2500, tds: 4100 },
  10: { p: 25, w: 26, lop: 1, ot: 0, bonus: 3500, arrear: 0, tds: 3600 },
  11: { p: 26, w: 26, lop: 0, ot: 6, bonus: 9000, arrear: 3000, tds: 7200 },
  12: { p: 21, w: 26, lop: 5, ot: 0, bonus: 0, arrear: 0, tds: 2500 },
};

const INIT_STATUS = ["Draft", "Draft", "Approved", "Draft", "Paid", "Draft", "Approved", "Draft", "Paid", "Draft", "Draft", "Draft"];

const DEPT_COLOR = {
  Engineering: "#3B5BDB", Product: "#7048E8", Design: "#E64980", SOFTWARE: "#48a0e8", SALE: "#E67700",
  HR: "#099268", Sales: "#E67700", Finance: "#0C8599", Marketing: "#862E9C",
};

const STATUS_META = {
  Pending: { color: "#E67700", bg: "#FFF8F0", label: "Pending" },
  Draft: { color: "#868E96", bg: "#F8F9FA", label: "Draft" },
  Approved: { color: "#2F9E44", bg: "#EBFBEE", label: "Approved" },
  Paid: { color: "#1971C2", bg: "#E7F5FF", label: "Paid" },
};

function calc(emp, att) {
  const gross = emp.basic + emp.hra + emp.special + emp.travel;
  const dr = gross / att.w;
  const lop = +(dr * att.lop).toFixed(2);
  const ot = +((emp.basic / (att.w * 8)) * att.ot * 1.5).toFixed(2);
  const pf = +(emp.basic * 0.12).toFixed(2);
  const esi = gross <= 21000 ? +(gross * 0.0075).toFixed(2) : 0;
  const pt = emp.basic > 20000 ? 200 : emp.basic > 15000 ? 150 : 0;
  const ti = gross + ot + att.arrear + att.bonus;
  const td = pf + esi + pt + lop + att.tds;
  return {
    gross, ot, lop, pf, esi, pt, tds: att.tds, bonus: att.bonus, arrear: att.arrear,
    ti, td, net: +(ti - td).toFixed(2), p: att.p, w: att.w, lopD: att.lop, otH: att.ot
  };
}

function buildRows(attOverrides = {}) {
  return EMPS.map((e, i) => {
    const att = { ...ATT_BASE[e.id], ...(attOverrides[e.id] || {}) };
    return { ...e, ...calc(e, att), att, status: INIT_STATUS[i], pid: i + 1 };
  });
}

const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
const ini = n => n.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
const avatarHue = id => [210, 270, 330, 150, 30, 180, 300][id % 7];


function AttInput({ defaultVal, onSave, onCancel }) {
  const [val, setVal] = useState(String(defaultVal));
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <input ref={ref} type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
        style={{ border: "1px solid #3B5BDB", borderRadius: 4, padding: "2px 6px", fontSize: 12, width: 52, fontFamily: "inherit" }}
      />
      <button onClick={() => onSave(val)} style={{ width: 22, height: 22, border: "1px solid #DEE2E6", background: "#fff", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2F9E44" }}>✓</button>
      <button onClick={onCancel} style={{ width: 22, height: 22, border: "1px solid #DEE2E6", background: "#fff", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#868E96" }}>✕</button>
    </div>
  );
}

export default function SalaryProcessing() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(defMonth);
  const [data, setData] = useState([]);
  const [attEdits, setAttEdits] = useState({});
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [deptF, setDeptF] = useState("All");
  const [expandRow, setExpand] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [editingAtt, setEditAtt] = useState(null);
  const [selected, setSel] = useState(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const toggleSel = pid => setSel(prev => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n; });

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  useEffect(() => {
    loadPayroll();
  }, [month]);




  const loadPayroll = async () => {
    console.log("loadPayroll called, month:", month + "-01");
    const res = await getPayrollMonthly(month + "-01");
    console.log("API response:", res);
    console.log("res.data:", res?.data);
    if (res?.data) {
      setData(res.data.map(r => ({
        ...r,
        pid: r.payroll_id || String(r.employee_id),  // unique identifier for React
        payroll_id: r.payroll_id || null,                  // actual DB ID for API calls
        employee_id: r.employee_id,
        name: r.employee_name || `EMP-${r.employee_id}`,
        dept: r.department || "—",
        role: r.designation || "—",
        gross: Number(r.gross_monthly) || 0,
        td: Number(r.computed_ded) || Number(r.total_deduction) || 0,
        net: Number(r.computed_net) || Number(r.structure_net) || 0,
        p: Number(r.present_days) || 0,
        w: Number(r.working_days) || 26,
        lopD: Number(r.lop_days) || 0,
        otH: Number(r.ot_hours) || 0,
        ti: Number(r.computed_income) || Number(r.structure_income) || 0,
        ot: Number(r.computed_ot) || 0,
        bonus: Number(r.bonus_amount) || 0,
        arrear: Number(r.arrear_amount) || 0,
        lop: Number(r.computed_lop) || 0,
        pf: 0, esi: 0, pt: 0, tds: 0, hra: 0, special: 0, travel: 0,
        status: r.status || "Pending",
        weekoff_days: Number(r.weekoff_days) || 0,
        holiday_days: Number(r.holiday_days) || 0,
        half_days: Number(r.half_days) || 0,
        paid_leave_days: Number(r.att_paid_leave) || 0,
        absent_days: Number(r.absent_days) || 0,
        total_days: Number(r.total_days) || 0,

      })));
    }
  };

  // Calculate button
  const handleCalculate = async () => {
    const res = await calculatePayroll({
      month_year: month + "-01",
      working_days: 26,
    });
    if (res?.success) { showToast(`${res.processed} employees processed`); loadPayroll(); }
  };



  const displayMonth = new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const filtered = useMemo(() => data.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.name.toLowerCase().includes(q) || String(r.id).includes(q))
      && (statusF === "All" || r.status === statusF)
      && (deptF === "All" || r.dept === deptF);
  }), [data, search, statusF, deptF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const summary = data.reduce((a, r) => {
    a[r.status.toLowerCase()] = (a[r.status.toLowerCase()] || 0) + 1; return a;
  }, {});

  const DEPTS_LIST = useMemo(() =>
    ["All", ...new Set(data.map(r => r.dept).filter(Boolean))],
    [data]
  );

  const doApprove = async (pids) => {
    // pids = payroll_ids YA employee_ids? 
    // Yahan row.pid = payroll_id (existing) ya employee_id (pending)
    // status "Pending" wale rows ke liye employee_id bhejo
    const pendingRows = data.filter(r =>
      pids.includes(r.pid) && ["Pending"].includes(r.status) && !r.payroll_id
    );
    const draftRows = data.filter(r =>
      pids.includes(r.pid) && r.status === "Draft" &&
      r.payroll_id && r.payroll_id.length === 36
    );
    const existingRows = data.filter(r => pids.includes(r.pid) && r.payroll_id && r.status !== "Pending");

    if (pendingRows.length > 0) {
      await approvePayroll({
        employee_ids: pendingRows.map(r => r.employee_id),
        month_year: month + "-01",
        approved_by: null  // logged-in user ka id yahan
      });
    }

    if (existingRows.length > 0) {
      await bulkUpdatePayrollStatus({
        payroll_ids: existingRows.map(r => r.payroll_id),  // r.pid nahi, r.payroll_id
        status: "Approved"
      });
    }

    setSel(new Set());
    showToast(`${pids.length} record${pids.length > 1 ? "s" : ""} approved`);
    loadPayroll();
  };

  const doPay = async (pids) => {
    const approvedRows = data.filter(r =>
      pids.includes(r.pid) &&
      r.payroll_id &&
      typeof r.payroll_id === "string" &&
      r.payroll_id.length === 36 &&
      r.status === "Approved"
    );
    if (!approvedRows.length) {
      showToast("No approved records with valid payroll ID", "err");
      return;
    }
    await bulkUpdatePayrollStatus({
      payroll_ids: approvedRows.map(r => r.payroll_id),  // payroll_id bhejo, pid nahi
      status: "Paid"
    });
    setSel(new Set());
    showToast(`${pids.length} payment${pids.length > 1 ? "s" : ""} marked paid`);
    loadPayroll();
  };

  const handleApprove = pids => setConfirm({
    title: "Approve Payroll",
    msg: `Are you sure you want to approve payroll for ${pids.length} employee${pids.length > 1 ? "s" : ""}?`,
    danger: false, label: "Approve", fn: () => doApprove(pids)
  });
  const handlePay = pids => setConfirm({
    title: "Mark as Paid",
    msg: `Mark salary as paid for ${pids.length} employee${pids.length > 1 ? "s" : ""}? This action cannot be undone.`,
    danger: true, label: "Mark Paid", fn: () => doPay(pids)
  });

  const saveAttEdit = (id, field, val) => {
    const n = parseInt(val) || 0;
    // Sirf local state update karo — API integration baad mein
    setData(prev => prev.map(r => {
      if (r.employee_id !== id && r.id !== id) return r;
      const updated = { ...r, [field]: n };
      // Net recalculate
      if (field === "lopD") updated.lop = n * (r.gross / (r.w || 26));
      if (field === "otH") updated.ot = n * (r.gross / ((r.w || 26) * 8)) * 1.5;
      updated.td = (r.pf || 0) + (r.esi || 0) + (r.pt || 0) + (updated.lop || 0) + (r.tds || 0);
      updated.ti = r.gross + (updated.ot || 0) + (r.bonus || 0) + (r.arrear || 0);
      updated.net = updated.ti - updated.td;
      return updated;
    }));
    setEditAtt(null);
    showToast("Updated locally — save to recalculate via API");
  };

  const exportCols = [
    { key: "name", label: "Employee" }, { key: "dept", label: "Dept" }, { key: "p", label: "Present" },
    { key: "gross", label: "Gross" }, { key: "td", label: "Deductions" }, { key: "net", label: "Net" }, { key: "status", label: "Status" }
  ];
  const visibleCols = exportCols.reduce((a, c) => ({ ...a, [c.key]: true }), {});

  const S = {
    // S.page mein change karo:
    page: { fontFamily: "'DM Sans',system-ui,sans-serif", background: "#F4F6F9", minHeight: "100vh", color: "#1A1D23", overflowY: "auto" }, btnPri: { background: "#3B5BDB", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    btnGhost: { background: "transparent", color: "#495057", border: "1px solid #DEE2E6", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    btnSucc: { background: "#2F9E44", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
    iconBtn: { width: 28, height: 28, border: "1px solid #DEE2E6", background: "#fff", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#868E96", fontSize: 14 },
  };

  return (
    <div style={S.page}>
      <style>{`
        *{box-sizing:border-box;}
        input,select{outline:none;}
        .trow:hover>td{background:#F8FAFF!important;}
        .ib:hover{background:#F1F3F5!important;border-color:#CED4DA!important;color:#495057!important;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .toast{animation:fadeIn .2s ease;}
      `}</style>

      <ERPHeader
      isHidden={true}
        title="SALARY PROCESSING"
        isViewMode={true} isAddMode={false} isEditMode={false}
        rightContent={displayMonth}
      />

      <div style={{ padding: "16px 20px 40px 20px" }}>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Net Payable", val: inr(data.reduce((a, r) => a + r.net, 0)), sub: `${data.length} employees`, accent: "#3B5BDB", icon: "ti-wallet", big: true },
            { label: "Pending", val: summary.pending || 0, sub: "not yet processed", accent: "#E67700", icon: "ti-clock" },
            { label: "Draft", val: summary.draft || 0, sub: "pending review", accent: "#868E96", icon: "ti-file-text" },
            { label: "Approved", val: summary.approved || 0, sub: "ready to pay", accent: "#2F9E44", icon: "ti-circle-check" },
            { label: "Paid", val: summary.paid || 0, sub: "completed", accent: "#1971C2", icon: "ti-send" },
          ].map((c, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 10, border: "1px solid #E8EAED",
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 1px 3px rgba(0,0,0,.04)", borderLeft: `3px solid ${c.accent}`
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: c.accent + "15", color: c.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <i className={`ti ${c.icon}`} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#ADB5BD", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: c.big ? 20 : 22, fontWeight: 700, color: c.accent, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 10, color: "#ADB5BD", marginTop: 3 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* TABLE CARD */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8EAED", overflow: "visible", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>

          {/* TOOLBAR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #E8EAED", height: 50, background: "#fff", gap: 8, flexWrap: "wrap" }}>

            {/* Left: title */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ width: 4, height: 20, background: "#3B5BDB", borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Salary Processing</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#EEF2FF", color: "#3B5BDB", border: "1px solid #C7D2FE" }}>
                {filtered.length} records
              </span>
              {selected.size > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#3B5BDB", color: "#fff" }}>
                  {selected.size} selected
                </span>
              )}
            </div>

            {/* Right: all controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>

              {/* Approve all drafts */}
              <button style={S.btnGhost} onClick={() => {
                const p = selected.size > 0
                  ? [...selected].filter(pid => ["Draft", "Pending"].includes(data.find(r => r.pid === pid)?.status))
                  : data.filter(r => ["Draft", "Pending"].includes(r.status)).map(r => r.pid);
                p.length ? handleApprove(p) : showToast("No draft records selected", "err");
              }}>
                <i className="ti ti-checks" aria-hidden="true" /> {selected.size > 0 ? `Approve selected` : `Approve all drafts`}
              </button>

              {/* Pay approved */}
              <button style={S.btnSucc} onClick={() => {
                const p = selected.size > 0
                  ? [...selected].filter(pid => data.find(r => r.pid === pid)?.status === "Approved")
                  : data.filter(r => r.status === "Approved").map(r => r.pid);
                p.length ? handlePay(p) : showToast("No approved records selected", "err");
              }}>
                <i className="ti ti-send" aria-hidden="true" /> {selected.size > 0 ? `Pay selected` : `Pay approved`}
              </button>

              <div style={{ width: 1, height: 20, background: "#E8EAED", flexShrink: 0 }} />

              {/* Search */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={12} style={{ position: "absolute", left: 9, color: "#ADB5BD", pointerEvents: "none" }} />
                <input type="text" placeholder="Search records…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ paddingLeft: 28, paddingRight: search ? 26 : 8, fontSize: 11.5, height: 32, width: 185, borderRadius: 6, border: "1px solid #DEE2E6", background: "#F8F9FA", color: "#495057", fontFamily: "inherit" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, background: "none", border: "none", cursor: "pointer", color: "#ADB5BD", display: "flex", padding: 0 }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: "#E8EAED", flexShrink: 0 }} />

              {/* Export */}
              <TableExport title="Salary Processing" columns={exportCols} data={filtered} visibleColumns={visibleCols} />

              <button
                title="Filters"
                style={{
                  ...S.iconBtn,
                  background: showFilter ? "#EEF2FF" : "#fff",
                  borderColor: showFilter ? "#3B5BDB" : "#DEE2E6",
                  color: showFilter ? "#3B5BDB" : "#868E96",
                }}
                className="ib"
                onClick={() => setShowFilter(p => !p)}
              >
                <Filter size={12} />
              </button>
              {/* Refresh */}
              <button title="Refresh" style={S.iconBtn} className="ib"
                onClick={() => { loadPayroll(); showToast("Refreshed"); }}>
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          {showFilter && (
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid #E8EAED",
              background: "#F8F9FA", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em" }}>Filters</span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>Status</span>
                <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
                  style={{ fontSize: 12, padding: "0 10px", height: 30, borderRadius: 6, border: "1px solid #DEE2E6", background: "#fff", color: "#495057", fontFamily: "inherit" }}>
                  {["All", "Draft", "Approved", "Paid"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>Department</span>
                <select value={deptF} onChange={e => { setDeptF(e.target.value); setPage(1); }}
                  style={{ fontSize: 12, padding: "0 10px", height: 30, borderRadius: 6, border: "1px solid #DEE2E6", background: "#fff", color: "#495057", fontFamily: "inherit" }}>
                  {DEPTS_LIST.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>Month</span>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                  style={{ fontSize: 12, padding: "0 8px", height: 30, borderRadius: 6, border: "1px solid #DEE2E6", background: "#fff", color: "#495057", fontFamily: "inherit", cursor: "pointer" }}
                />
              </div>

              {(statusF !== "All" || deptF !== "All") && (
                <button onClick={() => { setStatusF("All"); setDeptF("All"); setPage(1); }}
                  style={{ fontSize: 11, color: "#E03131", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* TABLE */}
          <div style={{ overflowX: "auto", overflowY: "visible" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8F9FA", borderBottom: "2px solid #E8EAED" }}>
                  <th style={{ width: 40, padding: "9px 12px", textAlign: "center" }}>
                    <input type="checkbox"
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onChange={() => setSel(selected.size === paginated.length ? new Set() : new Set(paginated.map(r => r.pid)))}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  {[["Employee", "left", 200], ["Dept", "left", 110], ["Attendance", "center", 110], ["Gross", "right", 110], ["Deductions", "right", 110], ["Net", "right", 130], ["Status", "center", 100], ["Actions", "right", 130]].map(([h, a, w]) => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: a, fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap", width: w }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#ADB5BD" }}>No records match filters</td></tr>
                ) : paginated.map(row => {
                  const sm = STATUS_META[row.status] || STATUS_META.Draft;
                  const hue = avatarHue(row.id);
                  const isExp = expandRow === row.pid;
                  return [
                    <tr key={row.pid} className="trow" style={{ borderBottom: `1px solid ${isExp ? "transparent" : "#F1F3F5"}`, cursor: "pointer", background: selected.has(row.pid) ? "#EEF2FF" : undefined }} onClick={() => setExpand(isExp ? null : row.pid)}>

                      <td style={{ padding: "8px 12px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selected.has(row.pid)}
                          onChange={() => toggleSel(row.pid)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `hsl(${hue},60%,92%)`, color: `hsl(${hue},55%,38%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                            {ini(row.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1A1D23", fontSize: 13 }}>{row.name}</div>
                            <div style={{ fontSize: 10, color: "#ADB5BD", marginTop: 1 }}>{row.role}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: (DEPT_COLOR[row.dept] || "#868E96") + "18", color: DEPT_COLOR[row.dept] || "#868E96" }}>
                          {row.dept}
                        </span>
                      </td>

                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#2F9E44" }}>{row.p}/{row.w}</div>
                        {(row.lopD > 0 || row.otH > 0) && (
                          <div style={{ fontSize: 10, marginTop: 2, display: "flex", gap: 4, justifyContent: "center" }}>
                            {row.lopD > 0 && <span style={{ color: "#E03131" }}>{row.lopD}L</span>}
                            {row.otH > 0 && <span style={{ color: "#1971C2" }}>{row.otH}h</span>}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#495057" }}>{inr(row.gross)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#E03131", fontWeight: 500 }}>−{inr(row.td)}</td>

                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#1A1D23", fontSize: 13 }}>{inr(row.net)}</div>
                        <div style={{ height: 3, borderRadius: 99, background: "#E8EAED", marginTop: 4, overflow: "hidden", width: 60, marginLeft: "auto" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, Math.round(row.net / row.gross * 100))}%`, background: "#2F9E44", borderRadius: 99 }} />
                        </div>
                      </td>

                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                      </td>

                      {/* ACTIONS — rendered directly, no TableRow wrapper */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                          {(row.status === "Draft" || row.status === "Pending") && (
                            <button title="Approve" style={S.iconBtn} className="ib"
                              onClick={e => { e.stopPropagation(); handleApprove([row.pid]); }}>
                              <i className="ti ti-check" style={{ color: "#2F9E44" }} />
                            </button>
                          )}
                          {row.status === "Approved" && (
                            <button title="Mark Paid" style={S.iconBtn} className="ib"
                              onClick={e => { e.stopPropagation(); handlePay([row.pid]); }}>
                              <i className="ti ti-send" style={{ color: "#1971C2" }} />
                            </button>
                          )}
                          <button title={isExp ? "Collapse" : "Expand"} style={{ ...S.iconBtn, borderColor: isExp ? "#7048E8" : "#DEE2E6" }} className="ib"
                            onClick={e => { e.stopPropagation(); setExpand(isExp ? null : row.pid); }}>
                            <i className="ti ti-eye" style={{ color: isExp ? "#7048E8" : "#868E96" }} />
                          </button>
                          <button title="Download payslip" style={S.iconBtn} className="ib"
                            onClick={e => { e.stopPropagation(); downloadPayslip(row, showToast); }}>
                            <i className="ti ti-download" />
                          </button>
                        </div>
                      </td>
                    </tr>,

                    /* EXPAND ROW */
                    isExp && (
                      <tr key={`exp-${row.pid}`}>
                        <td colSpan={9} style={{ padding: "0 16px 16px 60px", borderBottom: "2px solid #E8EAED", background: "#F8FAFF" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, paddingTop: 14 }}>

                            {/* Earnings */}
                            <div style={{ background: "#F8FFF9", border: "1px solid #D3F9D8", borderRadius: 9, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#2F9E44", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Earnings</div>
                              {(row.income_lines && row.income_lines.length > 0
                                ? row.income_lines.map(l => [l.head_name, Number(l.amount) || 0, null])
                                : [["Gross", row.gross, null]]
                              ).map(([l, v, c]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #EBFBEE" }}>
                                  <span style={{ color: "#495057" }}>{l}</span>
                                  <span style={{ fontWeight: 600, color: c || "#1A1D23" }}>₹{Math.round(v).toLocaleString("en-IN")}</span>
                                </div>
                              ))}
                              {/* OT, Bonus, Arrear extra add karo */}
                              {row.ot > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #EBFBEE" }}>
                                  <span style={{ color: "#495057" }}>OT Addition</span>
                                  <span style={{ fontWeight: 600, color: "#2F9E44" }}>+{inr(row.ot)}</span>
                                </div>
                              )}
                              {row.bonus > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #EBFBEE" }}>
                                  <span style={{ color: "#495057" }}>Bonus</span>
                                  <span style={{ fontWeight: 600, color: "#1971C2" }}>+{inr(row.bonus)}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginTop: 6, color: "#2F9E44" }}>
                                <span>Total</span><span>{inr(row.ti)}</span>
                              </div>
                            </div>

                            {/* Deductions */}
                            <div style={{ background: "#FFF5F5", border: "1px solid #FFC9C9", borderRadius: 9, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#E03131", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Deductions</div>
                              {(row.deduction_lines && row.deduction_lines.length > 0
                                ? row.deduction_lines.map(l => [l.head_name, Number(l.amount) || 0, null])
                                : []
                              ).map(([l, v, c]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #FFE8E8" }}>
                                  <span style={{ color: "#495057" }}>{l}</span>
                                  <span style={{ fontWeight: 600, color: "#E03131" }}>−₹{Math.round(v).toLocaleString("en-IN")}</span>
                                </div>
                              ))}
                              {row.lop > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #FFE8E8" }}>
                                  <span style={{ color: "#495057" }}>LOP Deduction</span>
                                  <span style={{ fontWeight: 600, color: "#E03131" }}>−{inr(row.lop)}</span>
                                </div>
                              )}
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginTop: 6, color: "#E03131" }}>
                                <span>Total</span><span>−{inr(row.td)}</span>
                              </div>
                            </div>

                            {/* Attendance editable */}
                            <div style={{ background: "#F8F9FF", border: "1px solid #D0BFFF", borderRadius: 9, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#7048E8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Attendance (editable)</div>
                              {[
                                ["Total days", "total_days", row.total_days || 0],
                                ["Working days", "working_days", row.w || 0],
                                ["Present days", "p", row.p || 0],
                                ["Absent days", "absent_days", row.absent_days || 0],
                                ["Week off", "weekoff_days", row.weekoff_days || 0],
                                ["Holidays", "holiday_days", row.holiday_days || 0],
                                ["LOP days", "lopD", row.lopD || 0],
                                ["OT hours", "otH", row.otH || 0],
                                ["Half days", "half_days", row.half_days || 0],
                                ["Paid leave", "paid_leave", row.paid_leave_days || 0],
                              ].map(([l, f, v]) => (
                                <div key={f} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #EEE8FF" }}>
                                  <span style={{ color: "#495057" }}>{l}</span>
                                  <span style={{ fontWeight: 600, color: "#7048E8", padding: "1px 7px", borderRadius: 4, background: "#EEE8FF" }}>{v}</span>
                                </div>
                              ))}
                            </div>

                            {/* Bank Details */}
                            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "12px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Bank Details</div>
                              {[
                                ["Bank name", row.bank_name || "HDFC Bank"],
                                ["Account no.", row.account_no || "XXXX 4521"],
                                ["IFSC code", row.ifsc_code || "HDFC0001234"],
                                ["Account type", row.account_type || "Savings"],
                              ].map(([l, v]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #DCFCE7" }}>
                                  <span style={{ color: "#495057" }}>{l}</span>
                                  <span style={{ fontWeight: 600, color: "#1A1D23", fontFamily: "monospace", fontSize: 11 }}>{v}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 8, fontSize: 10, color: "#166534" }}>Payment via: {row.payment_mode || "Bank Transfer"}</div>
                            </div>

                            {/* Net */}
                            <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E7F5FF)", border: "1px solid #A5D8FF", borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#1971C2", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Net Salary</div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: "#1971C2", letterSpacing: "-.02em" }}>{inr(row.net)}</div>
                              <div style={{ fontSize: 11, color: "#74C0FC", marginTop: 4 }}>{Math.round(row.net / row.gross * 100)}% of gross {inr(row.gross)}</div>
                              <div style={{ height: 5, borderRadius: 99, background: "#BFDBFE", marginTop: 10, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(100, Math.round(row.net / row.gross * 100))}%`, background: "#1971C2", borderRadius: 99 }} />
                              </div>
                              <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                                {(row.status === "Draft" || row.status === "Pending") && <button style={{ ...S.btnPri, fontSize: 11, padding: "5px 12px" }} onClick={() => handleApprove([row.pid])}><i className="ti ti-check" aria-hidden="true" /> Approve</button>}
                                {row.status === "Approved" && <button style={{ ...S.btnSucc, fontSize: 11, padding: "5px 12px" }} onClick={() => handlePay([row.pid])}><i className="ti ti-send" aria-hidden="true" /> Pay now</button>}
                                <button style={{ ...S.btnGhost, fontSize: 11, padding: "5px 10px" }} onClick={() => downloadPayslip(row, showToast)}>
                                  <i className="ti ti-download" aria-hidden="true" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )
                  ];
                })}
              </tbody>

              {paginated.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#F8F9FA", borderTop: "2px solid #E8EAED" }}>
                    <td colSpan={4} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#868E96" }}>
                      Totals — {filtered.length} employees
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#495057", fontSize: 12 }}>
                      {inr(filtered.reduce((a, r) => a + r.gross, 0))}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#E03131", fontWeight: 700, fontSize: 12 }}>
                      −{inr(filtered.reduce((a, r) => a + r.td, 0))}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#2F9E44", fontSize: 13 }}>
                      {inr(filtered.reduce((a, r) => a + r.net, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: 40, borderTop: "1px solid #E8EAED", background: "#F8F9FA" }}>
            <span style={{ fontSize: 11.5, color: "#64748B" }}>
              {filtered.length > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}` : "0 records"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[[ChevronsLeft, () => setPage(1)], [ChevronLeft, () => setPage(p => p - 1)]].map(([Icon, fn], i) => (
                <button key={i} disabled={page === 1} onClick={fn}
                  style={{ width: 28, height: 28, border: "1px solid #DEE2E6", borderRadius: 5, background: "#fff", color: "#495057", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? 0.3 : 1 }}>
                  <Icon size={12} />
                </button>
              ))}
              <span style={{ height: 28, padding: "0 12px", background: "#3B5BDB", color: "#fff", fontSize: 11.5, fontWeight: 700, borderRadius: 5, display: "flex", alignItems: "center" }}>
                {page} / {totalPages}
              </span>
              {[[ChevronRight, () => setPage(p => p + 1)], [ChevronsRight, () => setPage(totalPages)]].map(([Icon, fn], i) => (
                <button key={i} disabled={page >= totalPages} onClick={fn}
                  style={{ width: 28, height: 28, border: "1px solid #DEE2E6", borderRadius: 5, background: "#fff", color: "#495057", cursor: page >= totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages ? 0.3 : 1 }}>
                  <Icon size={12} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#CED4DA", marginTop: 10 }}>
          Click 👁 icon to expand row details · Click attendance values to edit inline
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirm(null)}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8EAED", padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: confirm.danger ? "#FEF2F2" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {confirm.danger ? "⚠️" : "ℹ️"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1D23", marginBottom: 8 }}>{confirm.title}</div>
            <div style={{ fontSize: 13, color: "#868E96", marginBottom: 24, lineHeight: 1.7 }}>{confirm.msg}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={S.btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
              <button style={confirm.danger ? S.btnSucc : S.btnPri} onClick={() => { setConfirm(null); confirm.fn(); }}>
                {confirm.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast" style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, background: toast.type === "err" ? "#FFF5F5" : "#EBFBEE", color: toast.type === "err" ? "#E03131" : "#2F9E44", border: `1px solid ${toast.type === "err" ? "#FFC9C9" : "#D3F9D8"}`, borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.1)", display: "flex", alignItems: "center", gap: 8 }}>
          {toast.type === "err" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
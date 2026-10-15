
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getPendingRequests } from "../../../utils/api";
import { useAuth } from "../../../theme/AuthContext";
import { useNavigate } from "react-router-dom";

const REQ_KEYS = {
  id: ["id", "transaction_id", "request_id", "approval_id"],
  employeeName: ["employee_name", "emp_name", "name", "Led_name"],
  requestType: [
    "request_type", "type", "category", "approval_type",
    "module", "module_name", "txn_type", "source_type",
    "flow_type", "transaction_type", "request_category",
  ],
  detail: ["detail", "description", "remarks", "amount_display"],
  status: ["status", "Status"],
  requestedDate: ["requested_date", "created_at", "request_date", "applied_on"],
};
const CATEGORY_META = {
  "Leave Request":          { icon: "ti ti-calendar-event", color: "#0C447C", bg: "#E6F1FB" },
  "OT Claim":                { icon: "ti ti-clock-hour-4",   color: "#6B46C1", bg: "#F1EEFE" },
  "Regularization":          { icon: "ti ti-repeat",          color: "#B45309", bg: "#FDEEDA" },
  "Comp Off":                { icon: "ti ti-calendar-plus",  color: "#0F766E", bg: "#E6F7F4" },
  "Investment Declaration":  { icon: "ti ti-file-invoice",   color: "#BE185D", bg: "#FDF2F8" },
  Request:                   { icon: "ti ti-file-text",       color: "#64748B", bg: "#F1F5F9" },
};
const RAW_TYPE_MAP = {
  LEAVE: "Leave Request",
  LEAVEREQUEST: "Leave Request",
  OT: "OT Claim",
  OVERTIME: "OT Claim",
  OTCLAIM: "OT Claim",
  REGULARIZATION: "Regularization",
  ATTENDANCEREGULARIZATION: "Regularization",
  ATTENDREGULAR: "Regularization",
  COMPOFF: "Comp Off",
  COMP_OFF: "Comp Off",
  INVESTMENTDECLARATION: "Investment Declaration",
  INVESTMENT: "Investment Declaration",
};
const detectCategory = (row) => {
  const raw = pick(row, REQ_KEYS.requestType);
  if (raw) {
    const key = String(raw).toUpperCase().replace(/[\s_-]/g, "");
    if (RAW_TYPE_MAP[key]) return RAW_TYPE_MAP[key];
    if (CATEGORY_META[raw]) return raw;  
  }

  if (pick(row, ["leave_type", "leave_type_id", "leave_type_name"])) return "Leave Request";
  if (pick(row, ["ot_hours", "overtime_hours", "ot_date", "ot_amount"])) return "OT Claim";
  if (pick(row, ["punch_in", "punch_out", "regularization_reason", "original_in", "original_out"])) return "Regularization";
  if (pick(row, ["comp_off_date"])) return "Comp Off";
  if (pick(row, ["investment_head", "declared_amount"])) return "Investment Declaration";
  if (pick(row, ["no_of_days", "from_date", "to_date"])) return "Leave Request";  

  return raw || "Request";
};

const detectDetail = (row, category) => {
  const explicit = pick(row, REQ_KEYS.detail);
  if (explicit) return explicit;

  if (category === "Leave Request") {
    const days = pick(row, ["no_of_days", "days", "total_days"]);
    return days ? `${days} day${Number(days) > 1 ? "s" : ""}` : null;
  }
  if (category === "OT Claim") {
    const amt = pick(row, ["ot_amount", "amount", "claim_amount"]);
    if (amt) return `₹${Number(amt).toLocaleString("en-IN")}`;
    const hrs = pick(row, ["ot_hours", "overtime_hours"]);
    return hrs ? `${hrs} hrs` : null;
  }
  if (category === "Regularization") {
    const days = pick(row, ["no_of_days", "days"]);
    if (days) return `${days} day${Number(days) > 1 ? "s" : ""}`;
    return pick(row, ["regularization_reason", "reason"]);
  }
  return null;
};
const OVERDUE_AFTER_DAYS = 3;

const STATUS_STYLE = {
  Pending: { badgeBg: "#FAEEDA", badgeColor: "#854F0B" },
  Review:  { badgeBg: "#E6F1FB", badgeColor: "#0C447C" },
  Overdue: { badgeBg: "#FCEBEB", badgeColor: "#A32D2D" },
};

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
};

const normStatus = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (s.startsWith("over")) return "Overdue";
  if (s.startsWith("rev")) return "Review";
  if (s.startsWith("pend")) return "Pending";
  return null; 
};

const getInitials = (name) => {
  if (!name) return "NA";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};


const ApprovalWorkflow = ({ onManageAllClick,calendarPage="ApprovalTransaction" }) => {
    const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rawRequests, setRawRequests] = useState([]);
  const { user } = useAuth();
   const handleViewCalendar = useCallback(() => {
      if (onManageAllClick) return onManageAllClick(); // parent ne diya ho to wahi
      navigate(`/app?page=${calendarPage}`);
    }, [onManageAllClick, navigate, calendarPage]);
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const approverId = user?.user_id || user?.id || user?.employee_id || user?.Actled_id || null;
      if (!approverId) {
        setError(true);
        return;
      }
      const res = await getPendingRequests(approverId);
      setRawRequests(res?.success ? res.data || [] : []);
    } catch (e) {
      console.error("ApprovalWorkflow fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);  

  useEffect(() => {
    loadData();
  }, [loadData]);
  const APPROVALS = useMemo(() => {
    const today = new Date();
    return rawRequests.map((r) => {
      const name = pick(r, REQ_KEYS.employeeName) || "Unknown"; 
      const category = detectCategory(r);
      const detail = detectDetail(r, category);
      const meta = CATEGORY_META[category] || CATEGORY_META.Request;

      const requestedRaw = pick(r, REQ_KEYS.requestedDate);

      let status = normStatus(pick(r, REQ_KEYS.status));
      if (!status) {
        const reqDate = requestedRaw ? new Date(requestedRaw) : null;
        const daysOld = reqDate && !isNaN(reqDate.getTime())
          ? Math.floor((today - reqDate) / 86400000)
          : 0;
        status = daysOld >= OVERDUE_AFTER_DAYS ? "Overdue" : "Pending";
      }

      const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.Pending;

      return {
        id: pick(r, REQ_KEYS.id) ?? `${name}-${category}`,
        initials: getInitials(name),
        name,
        category,             
        detail, 
        categoryIcon: meta.icon,
        categoryColor: meta.color,
        categoryBg: meta.bg,
        status,
        ...statusStyle,
      };
    });
  }, [rawRequests]);

  const summary = useMemo(() => {
    const counts = { Pending: 0, Overdue: 0, Review: 0 };
    APPROVALS.forEach((a) => {
      if (counts[a.status] === undefined) counts[a.status] = 0;
      counts[a.status] += 1;
    });
    return [
      { label: "Pending", val: counts.Pending, color: "#854F0B", bg: "#FAEEDA" },
      { label: "Overdue", val: counts.Overdue, color: "#A32D2D", bg: "#FCEBEB" },
      { label: "Review", val: counts.Review, color: "#0C447C", bg: "#E6F1FB" },
    ];
  }, [APPROVALS]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHdr}>
        <span style={styles.cardTitle}>Approval workflow</span>
        <span style={styles.action} onClick={handleViewCalendar}>Manage all ↗️</span>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={styles.skeletonRow} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 11, color: "#A32D2D" }}>Couldn't load approvals</span>
        </div>
      )}

      {!loading && !error && APPROVALS.length === 0 && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 11, color: "#888" }}>No pending approvals 🎉</span>
        </div>
      )}

      {!loading && !error && APPROVALS.length > 0 && (
        <div style={styles.list}>
          {APPROVALS.map((a, i) => (
            <div
              key={a.id}
              style={{ ...styles.item, borderBottom: i < APPROVALS.length - 1 ? "0.5px solid rgba(0,0,0,0.07)" : "none" }}
            > 
              <div style={{ ...styles.categoryIcon, background: a.categoryBg, color: a.categoryColor }}>
                <i className={a.categoryIcon}></i>
              </div>

              <div style={styles.info}>
                <div style={styles.nameRow}>
                  <span style={styles.name}>{a.name}</span>
                  <span style={{ ...styles.categoryPill, color: a.categoryColor, background: a.categoryBg }}>
                    {a.category}
                  </span>
                </div>
                {a.detail && <div style={styles.type}>{a.detail}</div>}
              </div>

              <span style={{ ...styles.badge, background: a.badgeBg, color: a.badgeColor }}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={styles.summaryRow}>
        {summary.map((s) => (
          <div key={s.label} style={{ ...styles.summaryBox, background: s.bg }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 10, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.09)",
    borderRadius: 14,
    padding: "13px 14px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 },
  cardTitle: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  action: { fontSize: 10, color: "#185FA5", cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowY: "auto" },
  item: { display: "flex", alignItems: "center", gap: 9, padding: "7px 0" },
  categoryIcon: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 },
  name: { fontSize: 11, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  categoryPill: { fontSize: 8, padding: "1px 6px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, fontWeight: 500 },
  type: { fontSize: 10, color: "#888", marginTop: 1 },
  badge: { fontSize: 9, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 },
  summaryRow: { display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "0.5px solid rgba(0,0,0,0.07)", flexShrink: 0 },
  summaryBox: { flex: 1, borderRadius: 8, padding: "7px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  emptyState: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  skeletonRow: { height: 34, borderRadius: 6, background: "linear-gradient(90deg,#eef0f2 25%,#f7f8f9 37%,#eef0f2 63%)", backgroundSize: "200px 100%" },
};

export default ApprovalWorkflow;
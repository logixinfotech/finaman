// pages/LeaveManagement/ApprovalTransaction/ApprovalTransaction.jsx
import { useEffect, useState, useCallback } from "react";
import { getPendingRequests, getAllApprovalTransactions, approvalAction } from "../../../../utils/api";
import { showToast } from "../../../../components/Reusable/alert";

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-amber-100", text: "text-amber-800" },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  }) : "—";

const daysUntil = (d) => {
  const diff = Math.ceil((new Date(d) - new Date()) / 864e5);
  if (diff <= 0) return { label: "Starting today", color: "red", urgent: true };
  if (diff === 1) return { label: "Starts tomorrow", color: "red", urgent: true };
  if (diff <= 3) return { label: `In ${diff} days`, color: "amber", urgent: true };
  if (diff <= 7) return { label: `In ${diff} days`, color: "amber", urgent: false };
  return { label: `In ${diff} days`, color: "gray", urgent: false };
};

const URGENCY_PILL = {
  red: "bg-red-50   text-red-700   border border-red-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  gray: "bg-slate-50 text-slate-500 border border-slate-200",
};

// const CHAIN_ROLES = [];
const TABS = ["Pending", "Approved", "Forwarded", "Rejected", "All"];

const ACTION_STYLE = {
  Pending: { bg: "bg-[#FAEEDA]", text: "text-[#633806]", border: "border-[#e8c98a]" },
  Approved: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]", border: "border-[#b0d47a]" },
  Forwarded: { bg: "bg-[#EDE9FE]", text: "text-[#4C1D95]", border: "border-[#c4b5fd]" },
  Rejected: { bg: "bg-[#FCEBEB]", text: "text-[#791F1F]", border: "border-[#f5a0a0]" },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, idx, size = "sm" }) => {
  const { bg, text } = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const dim = size === "lg" ? "w-10 h-10 text-[15px]" : "w-8 h-8 text-[13px]";
  return (
    <div className={`${dim} ${bg} ${text} rounded-full flex items-center justify-center font-medium shrink-0`}>
      {initials(name)}
    </div>
  );
};

// ── Status Pill ───────────────────────────────────────────────────────────────
const StatusPill = ({ action }) => {
  const s = ACTION_STYLE[action] || ACTION_STYLE.Pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {action || "Pending"}
    </span>
  );
};

// ── Sidebar (matches POApproval exactly) ─────────────────────────────────────
const Sidebar = ({ allRequests, selected, onSelect, activeTab, setActiveTab }) => {
  const stats = {
    Pending: allRequests.filter(r => r._display === "pending").length,
    Approved: allRequests.filter(r => r._display === "approved").length,
    Rejected: allRequests.filter(r => r._display === "rejected").length,
    Forwarded: allRequests.filter(r => r._display === "forwarded").length,
  };

  const filtered = activeTab === "All"
    ? allRequests
    : allRequests.filter(r =>
      activeTab === "Pending"
        ? (r.action === "Pending" || !r.action)
        : r.action === activeTab
    );

  return (
    <div className="flex flex-col bg-white h-full overflow-hidden">

      {/* Header row: title + stat chips — same as POApproval */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b border-slate-100 gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          Leave Queue
        </span>
        <div className="flex gap-1 shrink-0">
          {[
            { key: "Pending", label: "Pend", bg: "bg-[#FAEEDA]", color: "text-[#633806]" },
            { key: "Approved", label: "Appr", bg: "bg-[#EAF3DE]", color: "text-[#27500A]" },
            { key: "Rejected", label: "Rej", bg: "bg-[#FCEBEB]", color: "text-[#791F1F]" },
            { key: "Forwarded", label: "Fwd", bg: "bg-[#EDE9FE]", color: "text-[#4C1D95]" },
          ].map(({ key, label, bg, color }) => (
            <div key={key} className={`flex-1 text-center py-1 px-1.5 rounded-md ${bg}`}>
              <div className={`text-[13px] font-semibold leading-none ${color}`}>{stats[key]}</div>
              <div className={`text-[9px] mt-0.5 opacity-70 ${color}`}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs — no-scrollbar */}
      <div className="flex px-2 border-b border-slate-100 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-2.5 py-1.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all
              ${activeTab === t
                ? "border-[#0C447C] text-[#0C447C]"
                : "border-transparent text-slate-500"}`}
          >
            {t}
            {t === "Pending" && stats.Pending > 0 && (
              <span className="ml-1 bg-[#FAEEDA] text-[#633806] text-[10px] px-1.5 py-0.5 rounded-full">
                {stats.Pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span className="text-[12px]">No records</span>
          </div>
        ) : (
          filtered.map((req, i) => {
            const globalIdx = allRequests.indexOf(req);
            const urgInfo = daysUntil(req.from_date);
            const isPending = req.action === "Pending" || !req.action;
            const isActive = selected?.request_id === req.request_id
              && selected?.transaction_id === req.transaction_id
              && selected?.action === req.action;

            return (
              <button
                key={`${req.request_id}-${req.transaction_id || i}`}
                onClick={() => onSelect(req)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100 mb-1.5
                  ${isActive
                    ? "border-[#185FA5] bg-[#E6F1FB]"
                    : "border-slate-200 bg-white hover:border-[#85B7EB] hover:bg-[#E6F1FB]/40"}`}
              >
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isPending && urgInfo.urgent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                    <Avatar name={req.employee_name} idx={globalIdx} />
                    <span className="text-[13px] font-medium text-slate-800 truncate">
                      {req.employee_name}
                    </span>
                  </div>
                  <StatusPill action={req.action || "Pending"} />
                </div>
                <div className="text-[11px] text-slate-500 truncate mb-0.5 pl-10">
                  {req.leave_name} · L{req.level_no}
                </div>
                <div className="flex items-center justify-between pl-10">
                  <span className="text-[12px] font-semibold text-slate-700">
                    {req.total_days} {req.total_days > 1 ? "days" : "day"}
                  </span>
                  {isPending && urgInfo.urgent && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${URGENCY_PILL[urgInfo.color]}`}>
                      {urgInfo.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ── Approval Chain ────────────────────────────────────────────────────────────
const ApprovalChain = ({ currentLevel, totalLevels, roles = [], levelActions = {} }) => {
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);
  return (
    <div className="flex flex-col gap-0">
      {levels.map((lvl) => {
        const levelAction = levelActions[lvl]; // "Approved" | "Rejected" | "Forwarded" | undefined
        const done = levelAction === "Approved";
        const isRejected = levelAction === "Rejected";
        const isForwarded = levelAction === "Forwarded";
        const active = !levelAction && lvl === currentLevel;
        const wait = !levelAction && lvl > currentLevel;
        const isLast = lvl === totalLevels;
        const role = roles[lvl - 1] || `Level ${lvl}`;
        return (
          <div key={lvl} className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center w-7 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium
  ${done ? "bg-green-100 text-green-800 border border-green-300" : ""}
  ${active ? "bg-blue-500 text-white" : ""}
  ${wait ? "bg-slate-100 text-slate-400 border border-slate-200" : ""}
  ${isRejected ? "bg-red-100 text-red-700 border border-red-300" : ""}
  ${isForwarded ? "bg-purple-100 text-purple-700 border border-purple-300" : ""}`}>
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isRejected ? "✕" : lvl}
              </div>
              {!isLast && <div className={`w-px flex-1 min-h-[18px] ${done ? "bg-green-200" : "bg-slate-200"}`} />}
            </div>
            <div className={`flex-1 pb-4 ${isLast ? "pb-1" : ""}`}>
              <div className="flex items-center justify-between">
                <p className={`text-[13px] font-medium
  ${done ? "text-green-800" : ""}
  ${active ? "text-blue-700" : ""}
  ${wait ? "text-slate-400" : ""}
  ${isRejected ? "text-red-700" : ""}
  ${isForwarded ? "text-purple-700" : ""}`}>
                  {role}
                  {active && <span className="ml-1.5 text-[13px] font-normal text-blue-800">· you</span>}
                </p>
                {done && <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-800 border border-green-300">Approved</span>}
                {active && <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-300 animate-pulse">Your Turn</span>}
                {wait && <span className="text-[11px] px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-300">Waiting</span>}
                {isRejected && <span className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-300">Rejected</span>}
                {isForwarded && <span className="text-[11px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-300">Forwarded</span>}              </div>
              <p className={`text-[12px] mt-0.5 ${done || active ? "text-slate-500" : "text-slate-400"}`}>
                {done && "Reviewed and approved"}
                {active && "Action required from you"}
                {wait && `Waiting for level ${lvl - 1} action`}
                {isRejected && "Request rejected at this level"}
                {isForwarded && "Forwarded to next level"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Empty Detail ──────────────────────────────────────────────────────────────
const EmptyDetail = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="11" y2="17" />
    </svg>
    <p className="text-[13px]">Select a request to review</p>
  </div>
);

// ── Right Detail Panel ────────────────────────────────────────────────────────
const RequestDetail = ({
  req, allRequests, currentIndex,
  remark, onRemarkChange,
  onAction, acting,
  onNavigate,
  loading, onRefresh,
}) => {
  const totalRecords = allRequests.length;

  if (!req) return <EmptyDetail />;

  const urgInfo = daysUntil(req.from_date);
  const fromFmt = fmtDate(req.from_date);
  const toFmt = fmtDate(req.to_date);
  const sameDay = fromFmt === toFmt;
  const isPending = req.action === "Pending" || !req.action;
  const globalIdx = allRequests.indexOf(req);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      {/* ── Top bar: doc info + nav + refresh (NO separate page header) ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium text-slate-700 truncate">
            {req.employee_name}
          </span>
          {req.leave_name && (
            <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
              · {req.leave_name}
            </span>
          )}
          <StatusPill action={req.action || "Pending"} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400">{currentIndex + 1}/{totalRecords}</span>
          <button
            onClick={() => onNavigate(-1)}
            disabled={currentIndex <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            title="Previous"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate(1)}
            disabled={currentIndex >= totalRecords - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            title="Next"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={onRefresh}
            title="Refresh"
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M9.5 1.5v2.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Blue info header ── */}
      <div className="bg-white-50 border-b border-blue-100 px-5 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={req.employee_name} idx={globalIdx} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-blue-900">{req.employee_name}</p>
            <p className="text-[13px] text-blue-600 mt-0.5">
              {req.leave_name} · Applied {fmtDate(req.applied_on || req.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isPending && urgInfo.urgent && (
              <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${URGENCY_PILL[urgInfo.color]}`}>
                {urgInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "From", value: fromFmt },
            { label: "To", value: sameDay ? "Same day" : toFmt },
            { label: "Days", value: `${req.total_days} day${req.total_days > 1 ? "s" : ""}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-blue-100/60 rounded-lg px-3 py-2">
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-[14px] font-medium text-blue-900 mt-0.5 whitespace-nowrap">{value}</p>
            </div>
          ))}
          {req.reason && (
            <div className="col-span-2 bg-blue-100/60 rounded-lg px-3 py-2 border-l-2 border-blue-200">
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-semibold mb-0.5">Reason</p>
              <p className="text-[13px] text-blue-900 line-clamp-2 leading-tight">{req.reason}</p>
            </div>
          )}
        </div>

        {/* Remarks (if actioned) */}
        {req.remarks && !isPending && (
          <div className="mt-3 bg-blue-100/40 rounded-lg px-3 py-2 border-l-2 border-blue-300">
            <p className="text-[11px] text-blue-600 uppercase tracking-wide font-semibold mb-0.5">Remarks</p>
            <p className="text-[13px] text-blue-900">{req.remarks}</p>
          </div>
        )}
      </div>

      {/* ── Approval chain ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-4">
          Approval chain
        </p>
        <ApprovalChain
          currentLevel={req.level_no}
          levelActions={req.levelActions || {}}
          totalLevels={req.total_levels || 2}
          roles={req.workflow_roles || []}
        />
        {/* Decision details if actioned */}
        {req.action_date && !isPending && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-2">
              Decision details
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-slate-400 w-16 shrink-0">Status</span>
                <StatusPill action={req.action} />
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-slate-400 w-16 shrink-0">Date</span>
                <span className="text-slate-700">{fmtDate(req.action_date)}</span>
              </div>
              {req.approver_name && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-slate-400 w-16 shrink-0">By</span>
                  <span className="text-slate-700">{req.approver_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Action panel (pending only) ── */}
      {isPending ? (
        <div className="bg-white border-t border-slate-200 px-5 py-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-[13px] text-slate-500">Your action</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-300">
              Level {req.level_no} · {req.approver_role || "Approver"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={remark}
              onChange={(e) => onRemarkChange(e.target.value)}
              placeholder="Add remarks (optional)..."
              className="flex-1 h-[38px] px-3 text-[12px] rounded-lg border border-slate-300 bg-slate-50 text-slate-800 outline-none focus:border-blue-300 focus:bg-white transition-colors placeholder-slate-400"
            />
            <button
              disabled={!!acting}
              onClick={() => onAction("Approved")}
              className="h-[36px] px-5 rounded-lg text-[13px] font-medium bg-[#EAF3DE] text-[#27500A] border border-[#b0d47a] hover:bg-[#C0DD97] disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {acting === "Approved" ? "Approving..." : "Approve"}
            </button>
            {Number(req.level_no) < Number(req.total_levels || 99) && (
              <button
                disabled={!!acting}
                onClick={() => onAction("Forwarded")}
                className="h-[36px] px-5 rounded-lg text-[13px] font-medium bg-[#EDE9FE] text-[#4C1D95] border border-[#c4b5fd] hover:bg-[#DDD6FE] disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5h6.5M6 2.5l3 3-3 3" stroke="#6d28d9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Forward
              </button>
            )}
            <button
              disabled={!!acting}
              onClick={() => onAction("Rejected")}
              className="h-[36px] px-5 rounded-lg text-[13px] font-medium bg-[#FCEBEB] text-[#791F1F] border border-[#f5a0a0] hover:bg-[#F7C1C1] disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2.5 2.5l6 6M8.5 2.5l-6 6" stroke="#dc2626" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {acting === "Rejected" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-t border-slate-200 px-5 py-3 shrink-0">
          <div className="flex items-center justify-center gap-2 text-[13px] text-slate-500">
            <StatusPill action={req.action} />
            <span>This request has been {req.action?.toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const getTabFiltered = (list, tab) => {
  if (tab === "All") return list;
  if (tab === "Pending") return list.filter(r => r._display === "pending");
  if (tab === "Approved") return list.filter(r => r._display === "approved");
  if (tab === "Rejected") return list.filter(r => r._display === "rejected");
  // ✅ Forwarded tab mein sirf woh jo actually forwarded hain aur approved/rejected nahi hue
  if (tab === "Forwarded") return list.filter(r =>
    r._display === "forwarded" &&
    r._source === "history"
  );
  return list;
};
// ── Main component ────────────────────────────────────────────────────────────
const ApprovalTransaction = ({ tab }) => {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");
  const [remark, setRemark] = useState("");
  const [acting, setActing] = useState(null);

  const approverId = 1; // TODO: replace with auth context
  const filteredList = getTabFiltered(allRequests, activeTab);


  const currentIndex = selected
    ? filteredList.findIndex(r =>
      r.request_id === selected.request_id &&
      r.transaction_id === selected.transaction_id &&
      r.action === selected.action
    )
    : -1;
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        getPendingRequests(approverId),
        getAllApprovalTransactions(),
      ]);

      const pendingList = pendingRes?.data || [];
      const historyList = allRes?.data || [];

      // ✅ Pending requests — ye woh hain jo abhi current approver ke liye action chahiye
      const pendingMapped = pendingList.map(r => {
        const levelActions = {};
        if (r.completed_levels_str) {
          r.completed_levels_str.split("|").forEach(pair => {
            const [lvl, act] = pair.split(":");
            levelActions[Number(lvl)] = act;
          });
        }
        return {
          ...r,
          action: "Pending",
          _source: "pending",
          _display: "pending",
          workflow_roles: r.workflow_roles_str ? r.workflow_roles_str.split(",") : [],
          levelActions,
        };
      });

      const pendingRequestIds = new Set(pendingList.map(r => r.request_id));

      // ✅ History group by request_id
      const historyByRequest = {};
      historyList.forEach(r => {
        const key = r.request_id;
        if (!historyByRequest[key]) historyByRequest[key] = [];
        historyByRequest[key].push(r);
      });

      const historyMapped = Object.entries(historyByRequest)
        .filter(([requestId]) => !pendingRequestIds.has(requestId))
        .map(([requestId, transactions]) => {
          const sorted = [...transactions].sort(
            (a, b) => new Date(b.action_date || b.created_at) - new Date(a.action_date || a.created_at)
          );
          const latest = sorted[0];

          // ✅ Har level ka apna action — kabhi overwrite nahi hota
          // levelActions[1] = "Approved", levelActions[2] = "Rejected" — dono independent
          const levelActions = {};
          transactions.forEach(t => {
            levelActions[Number(t.level_no)] = t.action;
          });

          const completedLevels = Object.entries(levelActions)
            .filter(([, act]) => act === "Approved")
            .map(([lvl]) => Number(lvl));

          const rejectedEntry = Object.entries(levelActions).find(([, act]) => act === "Rejected");
          const forwardedEntry = Object.entries(levelActions).find(([, act]) => act === "Forwarded");

          const finalAction =
            latest.leave_status === "Approved" ? "Approved"
              : rejectedEntry ? "Rejected"
                : latest.leave_status === "Rejected" ? "Rejected"
                  : forwardedEntry ? "Forwarded"
                    : "Pending";

          const _display =
            finalAction === "Approved" ? "approved"
              : finalAction === "Rejected" ? "rejected"
                : finalAction === "Forwarded" ? "forwarded"
                  : "pending";

          const rolesByLevel = {};
          transactions.forEach(t => {
            if (t.approver_role) rolesByLevel[Number(t.level_no)] = t.approver_role;
          });
          const maxLevel = Number(latest.total_levels || 2);
          const workflow_roles = Array.from(
            { length: maxLevel },
            (_, i) => rolesByLevel[i + 1] || `Level ${i + 1}`
          );

          return {
            ...latest,
            action: finalAction,
            _source: "history",
            _display,
            completedLevels,
            levelActions,   // ✅ naya — har level ka apna status
            rejectedLevel: rejectedEntry ? Number(rejectedEntry[0]) : null,
            forwardedLevel: forwardedEntry ? Number(forwardedEntry[0]) : null,
            workflow_roles,
          };
        });

      // ✅ Forwarded requests jo pending tab mein dikhne chahiye (next level pending)
      // Inhe pending tab mein bhi dikhao agar current approver next level hai
      const forwardedAsPending = historyMapped
        .filter(r => r._display === "forwarded")
        .map(r => ({
          ...r,
          action: "Pending",
          _display: "pending",
        }));

      const merged = [
        ...pendingMapped,
        ...forwardedAsPending,  // ✅ forwarded bhi pending mein dikhe
        ...historyMapped,
      ];

      setAllRequests(merged);

      const tabList = getTabFiltered(merged, activeTab);
      setSelected(tabList.length > 0 ? tabList[0] : null);

    } catch (err) {
      console.error("ApprovalTransaction load error:", err);
    } finally {
      setLoading(false);
    }
  }, [approverId, activeTab]);

  useEffect(() => { loadAll(); }, []);

  const handleSelect = (req) => {
    setSelected(req);
    setRemark("");
    setActing(null);
  };

  const handleTabChange = (t) => {
    setActiveTab(t);
    const newFiltered = getTabFiltered(allRequests, t);
    setSelected(newFiltered.length > 0 ? newFiltered[0] : null);
    setRemark("");
  };

  const handleNavigate = (dir) => {
    const newIdx = currentIndex + dir;
    if (newIdx >= 0 && newIdx < filteredList.length) {
      setSelected(filteredList[newIdx]);
      setRemark("");
      setActing(null);
    }
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setActing(action);
    try {
      await approvalAction({
        request_id: selected.request_id,
        workflow_id: selected.workflow_id,
        level_no: selected.level_no,    // ✅ Ye sahi level aa raha hai?
        approver_id: approverId,
        action,
        remarks: remark,
      });
      showToast({
        icon: action === "Approved" ? "success" : action === "Rejected" ? "error" : "info",
        title: action === "Approved" ? "Leave approved successfully"
          : action === "Rejected" ? "Leave rejected"
            : "Request forwarded to next level",
      });
      setRemark("");
      await loadAll();
    } catch (err) {
      console.error("approvalAction error:", err);
      showToast({ icon: "error", title: "Something went wrong" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-slate-100">

      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex h-full">
        <div className="w-[240px] min-w-[200px] border-r border-slate-200 shrink-0">
          <Sidebar
            allRequests={allRequests}
            selected={selected}
            onSelect={handleSelect}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[13px] text-slate-400">
              Loading...
            </div>
          ) : (
            <RequestDetail
              req={selected}
              allRequests={filteredList}
              currentIndex={currentIndex >= 0 ? currentIndex : 0}
              remark={remark}
              onRemarkChange={setRemark}
              onAction={handleAction}
              acting={acting}
              onNavigate={handleNavigate}
              loading={loading}
              onRefresh={loadAll}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE ──────────────────────────────────────────────────────────── */}
      <div className="flex sm:hidden h-full">
        <div className="h-full w-full">
          <Sidebar
            allRequests={allRequests}
            selected={selected}
            onSelect={handleSelect}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </div>
      </div>

    </div>
  );
};

export default ApprovalTransaction;
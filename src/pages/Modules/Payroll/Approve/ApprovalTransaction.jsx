// pages/LeaveManagement/ApprovalTransaction/ApprovalTransaction.jsx
import { useEffect, useState, useCallback } from "react";
import { getPendingRequests, approvalAction } from "../../../../utils/api";
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
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    })
    : "—";

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

// ── Approval chain config (extend as needed) ──────────────────────────────────
const CHAIN_ROLES = ["Manager", "HR", "Director"];

// ── Sub-components ────────────────────────────────────────────────────────────

const Avatar = ({ name, idx, size = "sm" }) => {
  const { bg, text } = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const dim = size === "lg" ? "w-10 h-10 text-[15px]" : "w-8 h-8 text-[13px]";
  return (
    <div className={`${dim} ${bg} ${text} rounded-full flex items-center
                    justify-center font-medium shrink-0`}>
      {initials(name)}
    </div>
  );
};

// Left sidebar — queue list
const RequestList = ({ requests, selected, onSelect }) => (
  <div className="w-[220px] shrink-0 bg-white border-r border-slate-200
                  flex flex-col overflow-hidden">

    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center
                    justify-between shrink-0">
      <span className="text-[13px] font-medium text-slate-600 uppercase tracking-wide">
        Queue
      </span>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium
                       bg-amber-50 text-amber-700 border border-amber-200">
        {requests.length}
      </span>
    </div>

    <div className="overflow-y-auto flex-1">
      {requests.length === 0 ? (
        <div className="flex items-center justify-center h-24
                        text-[12px] text-slate-400">
          No pending requests
        </div>
      ) : (
        requests.map((req, idx) => {
          const urgInfo = daysUntil(req.from_date);
          const isActive = selected?.request_id === req.request_id;

          return (
            <div
              key={req.request_id}
              onClick={() => onSelect(req)}
              className={`px-3 py-2.5 border-b border-slate-100 cursor-pointer
                          flex gap-2 items-start transition-colors
                          ${isActive
                  ? "bg-blue-50 border-l-2 border-l-blue-400"
                  : "hover:bg-slate-50 border-l-2 border-l-transparent"}`}
            >
              {urgInfo.urgent && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500
                                shrink-0 mt-[5px]" />
              )}

              <Avatar name={req.employee_name} idx={idx} />

              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-medium truncate
                               ${isActive ? "text-blue-800" : "text-slate-800"}`}>
                  {req.employee_name}
                </p>
                <p className="text-[12px] text-slate-600 truncate mt-0.5">
                  {req.leave_name} · L{req.level_no}
                </p>
                <span className={`inline-block mt-1 text-[11px] font-medium
                                  px-1.5 py-0.5 rounded-full
                                  ${URGENCY_PILL[urgInfo.color]}`}>
                  {urgInfo.label}
                </span>
              </div>

              <div className="shrink-0 text-right ml-1">
                <p className={`text-[15px] font-medium leading-none
                               ${isActive ? "text-blue-800" : "text-slate-700"}`}>
                  {req.total_days}
                </p>
                <p className="text-[11px] text-slate-500">
                  {req.total_days > 1 ? "days" : "day"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// Approval chain timeline
const ApprovalChain = ({ currentLevel, totalLevels = 3 }) => {
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-0">
      {levels.map((lvl) => {
        const done = lvl < currentLevel;
        const active = lvl === currentLevel;
        const wait = lvl > currentLevel;
        const isLast = lvl === totalLevels;
        const role = CHAIN_ROLES[lvl - 1] || `Level ${lvl}`;

        return (
          <div key={lvl} className="flex gap-2.5 items-start">
            {/* Circle + connector */}
            <div className="flex flex-col items-center w-7 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                               text-[11px] font-medium
                               ${done ? "bg-green-100 text-green-800 border border-green-300" : ""}
                               ${active ? "bg-blue-500  text-white" : ""}
                               ${wait ? "bg-slate-100 text-slate-400 border border-slate-200" : ""}`}>
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#166534"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : lvl}
              </div>
              {!isLast && (
                <div className={`w-px flex-1 min-h-[18px]
                                 ${done ? "bg-green-200" : "bg-slate-200"}`} />
              )}
            </div>

            {/* Body */}
            <div className={`flex-1 pb-4 ${isLast ? "pb-1" : ""}`}>
              <div className="flex items-center justify-between">
                <p className={`text-[13px] font-medium
                               ${done ? "text-green-800" : ""}
                               ${active ? "text-blue-700" : ""}
                               ${wait ? "text-slate-400" : ""}`}>
                  {role}
                  {active && (
                    <span className="ml-1.5 text-[13px] font-normal text-blue-800">
                      · you
                    </span>
                  )}
                </p>
                {done && (
                  <span className="text-[13px] px-2.5 py-1.5 rounded-full
                                   bg-green-50 text-green-800 border border-green-300">
                    Approved
                  </span>
                )}
                {active && (
                  <span className="text-[13px] px-2.5 py-1.5 rounded-full
                                   bg-blue-50 text-blue-700 border border-blue-300
                                   animate-pulse">
                    Your Turn
                  </span>
                )}
                {wait && (
                  <span className="text-[13px] px-2.5 py-1.5 rounded-full
                                   bg-slate-50 text-slate-500 border border-slate-300">
                    Waiting
                  </span>
                )}
              </div>

              <p className={`text-[13px] mt-0.5
                             ${done || active ? "text-slate-500" : "text-slate-400"}`}>
                {done && "Reviewed and approved"}
                {active && "Action required from you"}
                {wait && `Waiting for level ${currentLevel}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Right detail panel
const RequestDetail = ({ req, idx, remark, onRemarkChange, onAction, acting }) => {
  if (!req) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3
                      bg-slate-50">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center
                        justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="4" width="12" height="10" rx="1.5"
              stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M6 8h6M6 11h4" stroke="#94a3b8" strokeWidth="1.2"
              strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] text-slate-400">Select a request to review</p>
      </div>
    );
  }

  const urgInfo = daysUntil(req.from_date);
  const fromFmt = fmtDate(req.from_date);
  const toFmt = fmtDate(req.to_date);
  const sameDay = fromFmt === toFmt;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      {/* ── Blue info header ── */}
      <div className="bg-blue-50 border-b border-blue-100 px-5 py-4 shrink-0">

        <div className="flex items-center gap-3 mb-3">
          <Avatar name={req.employee_name} idx={idx} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-blue-900">
              {req.employee_name}
            </p>
            <p className="text-[13px] text-blue-600 mt-0.5">
              {req.leave_name} · Applied {fmtDate(req.applied_on || req.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {urgInfo.urgent && (
              <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full
                                ${URGENCY_PILL[urgInfo.color]}`}>
                {urgInfo.label}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[12px] font-medium
                             bg-amber-50 text-amber-700 border border-amber-200">
              Pending
            </span>
          </div>
        </div>

        {/* Meta grid */}
        {/* Meta grid - Charon cheezein ek hi line mein */}
        <div className="grid grid-cols-5 gap-3">
          {/* From, To, Days Section */}
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
              <p className="text-[11px] text-blue-600 uppercase tracking-wide font-semibold mb-0.5">
                Reason
              </p>
              <p className="text-[13px] text-blue-900 line-clamp-2 leading-tight">
                {req.reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Approval chain ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[12px] font-medium text-slate-500 uppercase
                      tracking-wide mb-4">
          Approval chain
        </p>
        <ApprovalChain
          currentLevel={req.level_no}
          totalLevels={req.total_levels || 3}
        />
      </div>

      {/* ── Action panel (pinned bottom) ── */}
      <div className="bg-white border-t border-slate-200 px-5 py-3 shrink-0">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-[14px] text-slate-500">Your action</span>
          <span className="px-2 py-0.5 rounded-full text-[12px] font-medium
                           bg-purple-100 text-purple-800 border border-purple-400">
            Level {req.level_no} · {CHAIN_ROLES[(req.level_no - 1)] || "Approver"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={remark}
            onChange={(e) => onRemarkChange(e.target.value)}
            placeholder="Add remarks (optional)..."
            className="flex-1 h-[40px] px-3 text-[12px] rounded-lg border
                       border-slate-300 bg-slate-50 text-slate-800 outline-none
                       focus:border-blue-300 focus:bg-white transition-colors
                       placeholder-slate-400"
          />

          {/* Approve */}
          <button
            disabled={!!acting}
            onClick={() => onAction("Approved")}
            className="h-[36px] px-6 rounded-lg text-[13px] font-medium
                       bg-green-200 text-green-900 border border-green-400
                       hover:bg-green-300 disabled:opacity-50
                       transition-colors flex items-center gap-.5 shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#166534"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {acting === "Approved" ? "Approving..." : "Approve"}
          </button>

          {/* Forward */}
          <button
            disabled={!!acting}
            onClick={() => onAction("Forwarded")}
            className="h-[36px] px-6 rounded-lg text-[13px] font-medium
                       bg-purple-200 text-purple-900 border border-purple-400
                       hover:bg-purple-300 disabled:opacity-50
                       transition-colors flex items-center gap-1.5 shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5h6.5M6 2.5l3 3-3 3" stroke="#6d28d9"
                strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Forward
          </button>

          {/* Reject */}
          <button
            disabled={!!acting}
            onClick={() => onAction("Rejected")}
            className="h-[36px] px-6 rounded-lg text-[13px] font-medium
                       bg-red-200 text-red-900 border border-red-400
                       hover:bg-red-300 disabled:opacity-50
                       transition-colors flex items-center gap-1.5 shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2.5 2.5l6 6M8.5 2.5l-6 6" stroke="#dc2626"
                strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {acting === "Rejected" ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ApprovalTransaction = ({ tab }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [remark, setRemark] = useState("");
  const [acting, setActing] = useState(null);

  // TODO: replace with real logged-in user ID (e.g. from auth context)
  const approverId = 1;

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPendingRequests(approverId);
      const data = res?.data || [];
      setRequests(data);
      // Auto-select first item
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
        setSelectedIdx(0);
      }
    } catch (err) {
      console.error("ApprovalTransaction load error:", err);
    } finally {
      setLoading(false);
    }
  }, [approverId]);

  useEffect(() => { loadPending(); }, []);

  const handleSelect = (req, idx) => {
    setSelected(req);
    setSelectedIdx(idx);
    setRemark("");
    setActing(null);
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setActing(action);
    try {
      await approvalAction({
        request_id: selected.request_id,
        workflow_id: selected.workflow_id,
        level_no: selected.level_no,
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
      setSelected(null);
      setRemark("");
      await loadPending();
    } catch (err) {
      console.error("approvalAction error:", err);
      showToast({ icon: "error", title: "Something went wrong" });
    } finally {
      setActing(null);
    }
  };

  const urgentCount = requests.filter((r) => daysUntil(r.from_date).urgent).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">

      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200
                      px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-medium text-Black-800">
            Approval Transaction
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             text-[11px] font-medium bg-red-50 text-red-700
                             border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {urgentCount} urgent
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium
                           bg-amber-50 text-amber-700 border border-amber-200">
            {requests.length} pending
          </span>
          <button
            onClick={loadPending}
            title="Refresh"
            className="w-7 h-7 flex items-center justify-center rounded-md
                       border border-slate-200 bg-white hover:bg-slate-50
                       text-slate-400 transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M9.5 1.5v2.5H12" stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center
                        text-[13px] text-slate-400">
          Loading...
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden p-4 gap-1">
          <div className="w-[220px] shrink-0 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <RequestList
              requests={requests}
              selected={selected}
              onSelect={(req, idx) => handleSelect(req, requests.indexOf(req))}
            />
          </div>
          <div className="flex-1 flex flex-col rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white min-w-0">
            <RequestDetail
              req={selected}
              idx={selectedIdx}
              remark={remark}
              onRemarkChange={setRemark}
              onAction={handleAction}
              acting={acting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTransaction;
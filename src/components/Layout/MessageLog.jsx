import React, { useState, useMemo } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, Search, RotateCcw, CheckCircle2, XCircle, Clock, Send, Loader2 } from "lucide-react";
import { useAuth } from "../../theme/AuthContext";
import { DEPARTMENTS, deptName, useToast, Toast } from "./commShared";

// ── Mock data — replace with message log API later ──────────────────────────
const MIN = 60 * 1000;
const NOW = Date.now();
const MOCK_LOG = [
  { id: 1, at: NOW - 4 * MIN, department: "sales", channel: "EMAIL", template: "Order Confirmation", recipient: "accounts@sharmapharma.in", status: "DELIVERED", error: "", sentBy: "Priya Sharma" },
  { id: 2, at: NOW - 11 * MIN, department: "accounts", channel: "WHATSAPP", template: "Payment Reminder", recipient: "+91 98480 22110", status: "DELIVERED", error: "", sentBy: "System" },
  { id: 3, at: NOW - 26 * MIN, department: "sales", channel: "EMAIL", template: "Order Confirmation", recipient: "purchase@medilife.co.in", status: "FAILED", error: "550 Mailbox not found", sentBy: "Raj Verma" },
  { id: 4, at: NOW - 48 * MIN, department: "support", channel: "WHATSAPP", template: "Welcome Message", recipient: "+91 90000 45621", status: "FAILED", error: "Session lost — WhatsApp not linked", sentBy: "Neha Gupta" },
  { id: 5, at: NOW - 75 * MIN, department: "accounts", channel: "WHATSAPP", template: "Payment Reminder", recipient: "+91 99590 11873", status: "SENT", error: "", sentBy: "System" },
  { id: 6, at: NOW - 120 * MIN, department: "sales", channel: "EMAIL", template: "Order Confirmation", recipient: "stores@aarogyalabs.com", status: "DELIVERED", error: "", sentBy: "Karan Mehta" },
  { id: 7, at: NOW - 190 * MIN, department: "hr", channel: "EMAIL", template: "Joining Letter", recipient: "ankit.j@gmail.com", status: "QUEUED", error: "", sentBy: "Sonia Das" },
  { id: 8, at: NOW - 260 * MIN, department: "accounts", channel: "WHATSAPP", template: "Payment Reminder", recipient: "+91 91211 87340", status: "FAILED", error: "Number is not on WhatsApp", sentBy: "System" },
];

const STATUS = {
  QUEUED: { label: "Queued", icon: Clock, cls: "bg-slate-50 text-slate-600 ring-slate-200" },
  SENT: { label: "Sent", icon: Send, cls: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
  DELIVERED: { label: "Delivered", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  FAILED: { label: "Failed", icon: XCircle, cls: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

const fmtTime = (ts) =>
  new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const SELECT_CLS = "h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 outline-none focus:border-indigo-400";

const MessageLog = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const myDeptId = user?.dept_id || "sales";

  const [rows, setRows] = useState(MOCK_LOG);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [retrying, setRetrying] = useState([]);
  const [toast, showToast] = useToast();

  const scoped = useMemo(() => rows.filter((r) => isAdmin || r.department === myDeptId), [rows, isAdmin, myDeptId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scoped.filter((r) => {
      if (channel && r.channel !== channel) return false;
      if (status && r.status !== status) return false;
      if (department && r.department !== department) return false;
      if (q && !`${r.template} ${r.recipient} ${r.sentBy} ${r.error}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scoped, search, channel, status, department]);

  const counts = {
    total: scoped.length,
    delivered: scoped.filter((r) => r.status === "DELIVERED").length,
    failed: scoped.filter((r) => r.status === "FAILED").length,
  };

  const retry = (id) => {
    setRetrying((p) => [...p, id]);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "QUEUED", error: "" } : r)));
    // Mock: re-queue and send — replace with retry API
    setTimeout(() => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "SENT", at: Date.now() } : r)));
      setRetrying((p) => p.filter((x) => x !== id));
      showToast("Message re-sent");
    }, 1200);
  };

  const resetFilters = () => { setSearch(""); setChannel(""); setStatus(""); setDepartment(""); };

  return (
    <div className="space-y-3"> 
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Template, recipient, error…"
              className="h-8 w-56 pl-8 pr-2 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-indigo-400"
            />
          </div>
          {isAdmin && (
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={SELECT_CLS}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={SELECT_CLS}>
            <option value="">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLS}>
            <option value="">All Status</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={resetFilters} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <span className="text-xs text-slate-400">{filtered.length} Records</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 text-slate-500">
              {["Date / Time", "Department", "Channel", "Template", "Recipient", "Sent By", "Status", ""].map((h) => (
                <th key={h} className="bg-slate-50 px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No messages match your filters.</td></tr>
            )}
            {filtered.map((r) => {
              const s = STATUS[r.status];
              const Icon = s.icon;
              const busy = retrying.includes(r.id);
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmtTime(r.at)}</td>
                  <td className="px-4 py-2.5 text-slate-500">{deptName(r.department)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      {r.channel === "EMAIL" ? <Mail className="h-3.5 w-3.5 text-indigo-500" /> : <FaWhatsapp className="h-3.5 w-3.5 text-emerald-500" />}
                      {r.channel === "EMAIL" ? "Email" : "WhatsApp"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{r.template}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.recipient}</td>
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.sentBy}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
                      <Icon className="h-3 w-3" /> {s.label}
                    </span>
                    {r.error && <p className="mt-1 text-[11px] text-rose-600">{r.error}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(r.status === "FAILED" || busy) && (
                      <button
                        onClick={() => retry(r.id)}
                        disabled={busy}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Toast toast={toast} />
    </div>
  );
};

export default MessageLog;
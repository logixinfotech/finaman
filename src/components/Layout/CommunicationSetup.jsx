import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Mail, CheckCircle2, XCircle, Send, Loader2, Building2,
  AlertTriangle, RefreshCw, Smartphone, Power, ShieldCheck, Check,
} from "lucide-react";
import { useAuth } from "../../theme/AuthContext";
import TemplateMaster from "./TemplateMaster";
import MessageLog from "./MessageLog";
import {
  DEPARTMENTS, EMAIL_RE, LABEL_CLS, INPUT_CLS, timeAgo,
  useToast, Toast, useConfirm, Toggle,
} from "./commShared"; 
import { useSaveSlot } from "./Settings/SaveBus";
 
const NAVY = "#0B2447"; 
const NAVY_TINT = "#EEF2F8";
const NAVY_RING = "#C7D4E8";

// ── Config ──────────────────────────────────────────────────────────────────
const SMTP_PRESETS = [
  { id: "office365", label: "Office 365", host: "smtp.office365.com", port: "587", secure: "STARTTLS" },
  { id: "gmail", label: "Gmail / Workspace", host: "smtp.gmail.com", port: "587", secure: "STARTTLS" },
  { id: "zoho", label: "Zoho Mail", host: "smtp.zoho.in", port: "465", secure: "SSL" },
  { id: "custom", label: "Custom" },
];

const ENCRYPTION = [
  { id: "SSL", label: "SSL / TLS" },
  { id: "STARTTLS", label: "STARTTLS" },
  { id: "NONE", label: "None" },
];

const TOP_TABS = [
  { id: "channels", label: "Channels" },
  { id: "templates", label: "Templates" },
  { id: "log", label: "Message Log" },
];

const CHANNEL_TABS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
];

const WA_STEPS = ["Enter Number", "Scan QR", "Connected"];
const QR_SECONDS = 60;

const EMAIL_FIELDS = ["smtpProvider", "smtpHost", "smtpPort", "smtpSecure", "smtpUser", "smtpPwd", "fromName", "fromMail", "useDefault"];
const VERIFY_FIELDS = ["smtpProvider", "smtpHost", "smtpPort", "smtpSecure", "smtpUser", "smtpPwd"];

const DEFAULT_CHANNEL_STATE = {
  smtpProvider: "custom", smtpHost: "", smtpPort: "587", smtpSecure: "STARTTLS",
  smtpUser: "", smtpPwd: "", pwdSaved: false,
  fromName: "", fromMail: "", testTo: "",
  verified: false, verifiedAt: null, verifiedBy: "", lastError: "",
  useDefault: true,
  waNumber: "", waInstId: "", waStatus: "disconnected", waConnectedAt: null,
  sentToday: 0, failedToday: 0,
};
 
const HOUR = 3600 * 1000;
const MOCK_INITIAL = {
  sales: {
    ...DEFAULT_CHANNEL_STATE,
    smtpProvider: "office365", smtpHost: "smtp.office365.com", smtpUser: "sales@logixinfotech.com", pwdSaved: true,
    fromName: "Logix Sales", fromMail: "sales@logixinfotech.com",
    verified: true, verifiedAt: Date.now() - 2 * HOUR, verifiedBy: "Suman", sentToday: 142, failedToday: 1,
    waNumber: "9876543210", waInstId: "LOGIX-9876543210", waStatus: "connected", waConnectedAt: Date.now() - 26 * HOUR,
  },
  accounts: { ...DEFAULT_CHANNEL_STATE },
  support: {
    ...DEFAULT_CHANNEL_STATE,
    waNumber: "9123456780", waInstId: "LOGIX-9123456780", waStatus: "dropped", waConnectedAt: Date.now() - 72 * HOUR,
  },
  hr: { ...DEFAULT_CHANNEL_STATE, useDefault: false },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const emailState = (f) => (f.verified ? "ok" : f.smtpHost ? "bad" : "bad");
const waState = (f) => ({ connected: "ok", pending: "pending", dropped: "warn" }[f.waStatus] || "bad");

const emailBadge = (f) =>
  f.verified ? { state: "ok", label: "Verified" }
  : f.smtpHost ? { state: "bad", label: "Not Verified" }
  : { state: "bad", label: "Not Set" };

const waBadge = (f) =>
  ({
    connected: { state: "ok", label: "Connected" },
    pending: { state: "pending", label: "Waiting for Scan" },
    dropped: { state: "warn", label: "Session Lost" },
  }[f.waStatus] || { state: "bad", label: "Not Connected" });

const DOT_COLOR = { ok: "#10B981", pending: "#F59E0B", warn: "#F59E0B", bad: "#CBD5E1" };

const fmtPhone = (n) => {
  const d = (n || "").replace(/\D/g, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : n;
};

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const initials = (name) =>
  (name || "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
 
function seededGrid(seed, size = 21) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >>> 16) % 3 !== 0);
  }
  return cells;
}

function QrPattern({ seed, size = 160 }) {
  const dim = 21;
  const cell = size / dim;
  const cells = seededGrid(seed || "finaman", dim);
  const finder = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={cell * 7} height={cell * 7} fill="#fff" />
      <rect x={x} y={y} width={cell * 7} height={cell * 7} fill="none" stroke={NAVY} strokeWidth={cell} />
      <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} fill={NAVY} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="WhatsApp pairing QR code">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) => {
        if (!on) return null;
        const x = (i % dim) * cell;
        const y = Math.floor(i / dim) * cell;
        const inCorner =
          (x < cell * 8 && y < cell * 8) ||
          (x > size - cell * 8 && y < cell * 8) ||
          (x < cell * 8 && y > size - cell * 8);
        if (inCorner) return null;
        return <rect key={i} x={x} y={y} width={cell} height={cell} fill={NAVY} />;
      })}
      {finder(0, 0)}
      {finder(size - cell * 7, 0)}
      {finder(0, size - cell * 7)}
    </svg>
  );
}

// ── Small components ────────────────────────────────────────────────────────
const FieldInput = ({ label, ...props }) => (
  <div>
    <label className={LABEL_CLS}>{label}</label>
    <input {...props} className={INPUT_CLS} />
  </div>
);

const StatusBadge = ({ state, label }) => {
  const tone =
    state === "ok" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : state === "pending" || state === "warn" ? "bg-amber-50 text-amber-700 ring-amber-600/20"
    : "bg-slate-50 text-slate-500 ring-slate-200";
  const Icon = state === "ok" ? CheckCircle2 : state === "pending" ? Loader2 : state === "warn" ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      <Icon className={`h-3 w-3 ${state === "pending" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
};
 
const MetaStrip = ({ configured, total, verifiedEmails, connectedWa }) => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-slate-500">
    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
      <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
      {configured} / {total} departments configured
    </span>
    <span className="h-3 w-px bg-slate-200" />
    <span className="inline-flex items-center gap-1.5">
      <Mail className="h-3.5 w-3.5 text-slate-400" /> {verifiedEmails} verified email{verifiedEmails === 1 ? "" : "s"}
    </span>
    <span className="h-3 w-px bg-slate-200" />
    <span className="inline-flex items-center gap-1.5">
      <FaWhatsapp className="h-3.5 w-3.5 text-emerald-500" /> {connectedWa} WhatsApp connected
    </span>
  </div>
);
 
function DepartmentNav({ selectedDept, onSelect, data, dirty }) {
  return (
    <>
      {/* Mobile / tablet — horizontal scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden -mx-1 px-1">
        {DEPARTMENTS.map((d) => {
          const f = data[d.id] || DEFAULT_CHANNEL_STATE;
          const active = d.id === selectedDept;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
              style={
                active
                  ? { background: NAVY, color: "#fff", borderColor: NAVY }
                  : { background: "#fff", color: "#475569", borderColor: "#e2e8f0" }
              }
            >
              {d.name}
              {active && dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? "#ffffffaa" : DOT_COLOR[emailState(f)] }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? "#ffffffaa" : DOT_COLOR[waState(f)] }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop — vertical rail */}
      <nav className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {DEPARTMENTS.map((d) => {
          const f = data[d.id] || DEFAULT_CHANNEL_STATE;
          const active = d.id === selectedDept;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
              style={active ? { background: NAVY_TINT } : undefined}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                style={active ? { background: NAVY, color: "#fff" } : { background: "#F1F5F9", color: "#64748B" }}
              >
                {initials(d.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold" style={{ color: active ? NAVY : "#334155" }}>
                    {d.name}
                  </span>
                  {active && dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT_COLOR[emailState(f)] }} title="Email" />
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT_COLOR[waState(f)] }} title="WhatsApp" />
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

const BTN_PRIMARY = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-white shadow-sm transition-all disabled:opacity-50";
const BTN_SECONDARY = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50";

// ── Main ────────────────────────────────────────────────────────────────────
const CommunicationSetup = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const myDeptId = user?.dept_id || "sales";
  const companyCode = user?.company_code || "LOGIX"; // TODO: confirm real field for company code
  const userName = user?.name || user?.username || "You";

  const [activeTab, setActiveTab] = useState("channels");
  const [activeChannel, setActiveChannel] = useState("email"); // email | whatsapp — device-friendly: one panel at a time
  const [selectedDept, setSelectedDept] = useState(isAdmin ? DEPARTMENTS[0].id : myDeptId);
  const [data, setData] = useState(MOCK_INITIAL);
  const [saved, setSaved] = useState(MOCK_INITIAL);
  const [testingEmail, setTestingEmail] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [qrLeft, setQrLeft] = useState(QR_SECONDS);
  const [toast, showToast] = useToast();
  const [confirmDialog, ask] = useConfirm();
  const linkTimers = useRef({});

  const dept = DEPARTMENTS.find((d) => d.id === selectedDept) || DEPARTMENTS[0];
  const form = data[selectedDept] || DEFAULT_CHANNEL_STATE;
  const savedForm = saved[selectedDept] || DEFAULT_CHANNEL_STATE;
  const isDirty = EMAIL_FIELDS.some((f) => form[f] !== savedForm[f]);
  const presetLocked = form.smtpProvider !== "custom";

  const allForms = DEPARTMENTS.map((d) => data[d.id] || DEFAULT_CHANNEL_STATE);
  const configuredDepts = allForms.filter((f) => f.verified || f.waStatus === "connected").length;
  const verifiedEmails = allForms.filter((f) => f.verified).length;
  const connectedWa = allForms.filter((f) => f.waStatus === "connected").length;

  // ── State helpers ──
  const updateMany = (patch) =>
    setData((prev) => {
      const cur = prev[selectedDept] || DEFAULT_CHANNEL_STATE;
      const next = { ...cur, ...patch };
      if (Object.keys(patch).some((k) => VERIFY_FIELDS.includes(k) && patch[k] !== cur[k])) next.verified = false;
      return { ...prev, [selectedDept]: next };
    });

  const updateField = (field, value) => updateMany({ [field]: value });

  const patchDept = (id, patch, alsoSaved = false) => {
    setData((prev) => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_CHANNEL_STATE), ...patch } }));
    if (alsoSaved) setSaved((prev) => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_CHANNEL_STATE), ...patch } }));
  };

  const applyPreset = (id) => {
    const p = SMTP_PRESETS.find((x) => x.id === id);
    if (id === "custom") updateMany({ smtpProvider: "custom" });
    else updateMany({ smtpProvider: id, smtpHost: p.host, smtpPort: p.port, smtpSecure: p.secure });
  };

  // ── Department switch with unsaved-changes guard ──
  const switchDept = async (id) => {
    if (id === selectedDept) return;
    if (isDirty) {
      const ok = await ask(
        "Discard unsaved changes?",
        `You have unsaved changes in ${dept.name}. Switching department will discard them.`,
        "Discard", "rose"
      );
      if (!ok) return;
      setData((prev) => ({ ...prev, [selectedDept]: savedForm }));
    }
    setEditingPwd(false);
    setSelectedDept(id);
  };
 
  const handleSave = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (form.fromMail && !EMAIL_RE.test(form.fromMail)) { showToast("From Email is not a valid address", "error"); reject(new Error("invalid email")); return; }
      if (form.smtpPort && !/^\d+$/.test(form.smtpPort)) { showToast("Port must be a number", "error"); reject(new Error("invalid port")); return; }
      const id = selectedDept;
      const next = { ...form, pwdSaved: form.pwdSaved || !!form.smtpPwd, smtpPwd: "" };
      setTimeout(() => {
        setData((prev) => ({ ...prev, [id]: { ...prev[id], pwdSaved: next.pwdSaved, smtpPwd: "" } }));
        setSaved((prev) => ({ ...prev, [id]: next }));
        setEditingPwd(false);
        showToast(`${DEPARTMENTS.find((d) => d.id === id)?.name} settings saved`);
        resolve();
      }, 500);
    });
  }, [form, selectedDept, showToast]);
 
  useSaveSlot("communication", isDirty, handleSave);

  const handleDiscard = () => {
    setData((prev) => ({ ...prev, [selectedDept]: savedForm }));
    setEditingPwd(false);
  };

  // ── Email test ──
  const handleTestEmail = () => {
    if (!EMAIL_RE.test(form.testTo || "")) { showToast("Enter a valid address in 'Send test to'", "error"); return; }
    setTestingEmail(true);
    const id = selectedDept;
    const snapshot = form;
    setTimeout(() => {
      setTestingEmail(false);
      let err = "";
      if (!snapshot.smtpHost) err = "Connection refused — SMTP host is empty";
      else if (!snapshot.smtpUser) err = "530 Authentication required — username is empty";
      else if (!snapshot.smtpPwd && !snapshot.pwdSaved) err = "535 Authentication failed — password is empty";
      if (err) {
        patchDept(id, { verified: false, lastError: err });
        showToast("Test failed — see the error on the Email card", "error");
        return;
      }
      patchDept(id, { verified: true, verifiedAt: Date.now(), verifiedBy: userName, lastError: "" }, true);
      showToast(`Test email sent to ${snapshot.testTo}`);
    }, 900);
  };

  // ── WhatsApp ──
  const startLink = () => {
    const num = (form.waNumber || "").replace(/\D/g, "");
    if (num.length !== 10) { showToast("Enter a valid 10-digit WhatsApp number", "error"); return; }
    const id = selectedDept;
    patchDept(id, { waStatus: "pending", waInstId: `${companyCode}-${num}` }, true);
    setQrLeft(QR_SECONDS);
    clearTimeout(linkTimers.current[id]);
    linkTimers.current[id] = setTimeout(() => {
      patchDept(id, { waStatus: "connected", waConnectedAt: Date.now() }, true);
      showToast("WhatsApp connected");
    }, 5000);
  };

  const cancelLink = () => {
    clearTimeout(linkTimers.current[selectedDept]);
    patchDept(selectedDept, { waStatus: "disconnected", waInstId: "" }, true);
  };

  const disconnectWa = async () => {
    const ok = await ask(
      "Disconnect WhatsApp?",
      `${dept.name} will stop sending WhatsApp messages until the number is linked again.`,
      "Disconnect", "rose"
    );
    if (!ok) return;
    clearTimeout(linkTimers.current[selectedDept]);
    patchDept(selectedDept, { waStatus: "disconnected", waInstId: "", waConnectedAt: null }, true);
    showToast("WhatsApp disconnected");
  };

  const handleTestWhatsapp = () => showToast(`Test message sent to ${fmtPhone(form.waNumber)}`);

  useEffect(() => {
    if (form.waStatus !== "pending") return;
    const t = setInterval(() => setQrLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [form.waStatus, selectedDept]);

  useEffect(() => {
    const timers = linkTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const waStepIndex = form.waStatus === "connected" ? 2 : form.waStatus === "pending" ? 1 : 0;

  return (
    <div className="space-y-4">
      {/* Header: title + meta strip + top tabs, all in one compact block */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
           
            {isAdmin ? (
              <div className="mt-1">
                <MetaStrip configured={configuredDepts} total={DEPARTMENTS.length} verifiedEmails={verifiedEmails} connectedWa={connectedWa} />
              </div>
            ) : (
              <p className="mt-0.5 text-[12.5px] text-slate-400">Configuring channels for {dept.name}</p>
            )}
          </div>
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <AlertTriangle className="h-3 w-3" />
              Unsaved in {dept.name}
              <button onClick={handleDiscard} className="font-semibold text-amber-800 underline decoration-amber-400 underline-offset-2 hover:text-amber-900">
                Discard
              </button>
            </span>
          )}
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap border-b-2 py-2 px-1 mr-4 text-[12.5px] font-semibold transition-all"
              style={activeTab === tab.id ? { borderColor: NAVY, color: NAVY } : { borderColor: "transparent", color: "#64748b" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "channels" && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start"> 
          {isAdmin && (
            <DepartmentNav selectedDept={selectedDept} onSelect={switchDept} data={data} dirty={isDirty} />
          )}

          {/* Content column */}
          <div className="min-w-0 flex-1 space-y-4"> 
            <div className="grid grid-cols-2 sm:inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm w-full sm:w-auto">
              {CHANNEL_TABS.map((c) => {
                const active = activeChannel === c.id;
                const Icon = c.icon;
                const badge = c.id === "email" ? emailBadge(form) : waBadge(form);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannel(c.id)}
                    className="relative flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={active ? { background: NAVY, color: "#fff" } : { color: "#475569" }}
                  >
                    <Icon className="h-3 w-3" />
                    {c.label}
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: active ? "#fff" : DOT_COLOR[badge.state] }}
                    />
                  </button>
                );
              })}
            </div>

            {/* ── Email panel ── */}
            {activeChannel === "email" && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
                  {form.verified ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Verified {timeAgo(form.verifiedAt)} by {form.verifiedBy}
                      </span>
                      <span>{form.sentToday} sent today</span>
                      <span className={form.failedToday ? "text-rose-600 font-medium" : ""}>{form.failedToday} failed</span>
                    </>
                  ) : (
                    <span>Not verified — send a test email to verify these settings.</span>
                  )}
                </div>

                {form.lastError && (
                  <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><span className="font-semibold">Last test failed:</span> {form.lastError}</span>
                  </div>
                )}

                <div className="px-5 pt-4">
                  <label className={LABEL_CLS}>Provider</label>
                  <div className="flex flex-wrap">
                    {SMTP_PRESETS.map((p) => {
                      const activePreset = form.smtpProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPreset(p.id)}
                          className="h-7 px-2.5 text-[11px] font-semibold ring-1 ring-inset -ml-px first:ml-0 first:rounded-l-lg last:rounded-r-lg transition-colors"
                          style={
                            activePreset
                              ? { position: "relative", zIndex: 10, background: NAVY_TINT, color: NAVY, boxShadow: `inset 0 0 0 1px ${NAVY_RING}` }
                              : { background: "#fff", color: "#475569", boxShadow: "inset 0 0 0 1px #e2e8f0" }
                          }
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <FieldInput label="SMTP Host" value={form.smtpHost} disabled={presetLocked} onChange={(e) => updateField("smtpHost", e.target.value)} />
                  <FieldInput label="Port" value={form.smtpPort} disabled={presetLocked} onChange={(e) => updateField("smtpPort", e.target.value)} />
                  <div>
                    <label className={LABEL_CLS}>Encryption</label>
                    <select value={form.smtpSecure} disabled={presetLocked} onChange={(e) => updateField("smtpSecure", e.target.value)} className={INPUT_CLS}>
                      {ENCRYPTION.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </select>
                  </div>
                  <FieldInput label="Username" value={form.smtpUser} autoComplete="off" onChange={(e) => updateField("smtpUser", e.target.value)} />
                  <div>
                    <label className={LABEL_CLS}>Password</label>
                    {form.pwdSaved && !editingPwd ? (
                      <div className="flex h-8 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5">
                        <span className="text-[13px] tracking-widest text-slate-400">••••••••</span>
                        <button type="button" onClick={() => setEditingPwd(true)} className="text-[11px] font-semibold hover:underline" style={{ color: NAVY }}>
                          Change
                        </button>
                      </div>
                    ) : (
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder={form.pwdSaved ? "Enter new password" : ""}
                        value={form.smtpPwd}
                        onChange={(e) => updateField("smtpPwd", e.target.value)}
                        className={INPUT_CLS}
                      />
                    )}
                  </div>
                  <FieldInput label="From Name" value={form.fromName} onChange={(e) => updateField("fromName", e.target.value)} />
                  <FieldInput label="From Email" value={form.fromMail} onChange={(e) => updateField("fromMail", e.target.value)} />
                </div>

                <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
                  <div className="w-full sm:w-72">
                    <FieldInput
                      label="Send test to"
                      placeholder="you@company.com"
                      value={form.testTo}
                      onChange={(e) => patchDept(selectedDept, { testTo: e.target.value })}
                    />
                  </div>
                  <button onClick={handleTestEmail} disabled={testingEmail} className={BTN_SECONDARY}>
                    {testingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-slate-400" />}
                    Send Test Email
                  </button>
                </div>
              </div>
            )}

            {/* ── WhatsApp panel ── */}
            {activeChannel === "whatsapp" && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    {WA_STEPS.map((step, i) => (
                      <React.Fragment key={step}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
                              ${i < waStepIndex ? "bg-emerald-500 text-white" : i === waStepIndex ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-slate-100 text-slate-400"}`}
                          >
                            {i < waStepIndex ? "✓" : i + 1}
                          </span>
                          <span className={`text-[11px] font-medium ${i <= waStepIndex ? "text-slate-700" : "text-slate-400"}`}>{step}</span>
                        </div>
                        {i < WA_STEPS.length - 1 && <span className="flex-1 h-px bg-slate-200" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {form.waStatus === "dropped" && (
                  <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Session lost — the linked phone logged out or went offline. Messages are not being sent. Re-link to resume.</span>
                  </div>
                )}

                <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldInput
                    label="WhatsApp Number"
                    placeholder="10-digit mobile number"
                    value={form.waNumber}
                    disabled={form.waStatus !== "disconnected"}
                    onChange={(e) => updateField("waNumber", e.target.value)}
                  />
                  <FieldInput label="Instance ID (auto)" value={form.waInstId} disabled />
                </div>

                {form.waStatus === "pending" && (
                  <div className="mx-5 mt-4 flex flex-col sm:flex-row gap-5 rounded-lg border border-dashed border-slate-300 p-5">
                    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white overflow-hidden self-center sm:self-start">
                      <QrPattern seed={form.waInstId} size={160} />
                      {qrLeft <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-[1px]">
                          <RefreshCw className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] text-slate-600">
                      <p className="font-semibold text-slate-800 mb-2">Link this number</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open WhatsApp on the phone for {fmtPhone(form.waNumber)}</li>
                        <li>Go to Settings → Linked Devices</li>
                        <li>Tap "Link a device" and scan this QR</li>
                      </ol>
                      {qrLeft > 0 ? (
                        <p className="mt-3 text-xs text-slate-400">QR expires in <span className="font-mono font-semibold text-slate-600">{fmtClock(qrLeft)}</span></p>
                      ) : (
                        <button onClick={() => setQrLeft(QR_SECONDS)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: NAVY }}>
                          <RefreshCw className="h-3.5 w-3.5" /> QR expired — Refresh QR
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {form.waStatus === "connected" && (
                  <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-inset ring-emerald-100">
                      <Smartphone className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-[12.5px]">
                      <p className="font-semibold text-slate-800">{fmtPhone(form.waNumber)} · Linked via WhatsApp Web</p>
                      <p className="text-xs text-slate-500">Connected {timeAgo(form.waConnectedAt)}</p>
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {form.waStatus === "disconnected" && (
                    <button onClick={startLink} disabled={!form.waNumber} className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-500`}>
                      Connect
                    </button>
                  )}
                  {form.waStatus === "pending" && (
                    <button onClick={cancelLink} className={BTN_SECONDARY}>Cancel</button>
                  )}
                  {form.waStatus === "connected" && (
                    <>
                      <button onClick={handleTestWhatsapp} className={BTN_SECONDARY}>
                        <Send className="h-3.5 w-3.5 text-slate-400" /> Send Test Message
                      </button>
                      <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                        <Power className="h-3.5 w-3.5" /> Disconnect
                      </button>
                    </>
                  )}
                  {form.waStatus === "dropped" && (
                    <>
                      <button onClick={startLink} className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-500`}>
                        <RefreshCw className="h-3.5 w-3.5" /> Re-link
                      </button>
                      <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                        <Power className="h-3.5 w-3.5" /> Disconnect
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Fallback — compact settings row, not a separate full card */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900">Fallback to company default</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  When {dept.name}'s channel is not configured or fails, send using the company default channel.
                </p>
              </div>
              <Toggle checked={form.useDefault} onChange={(v) => updateField("useDefault", v)} />
            </div>

            {/* Admins only — compact department status table, collapsed under the rail on desktop
                so it doesn't repeat what the rail already shows there. On mobile (no rail visible)
                it's the only overview, so it stays. */}
            {isAdmin && (
              <details className="group rounded-xl border border-slate-200 bg-white shadow-sm lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-[13px] font-semibold text-slate-700">
                  All departments
                  <Check className="h-4 w-4 text-slate-300 group-open:hidden" />
                </summary>
                <div className="overflow-x-auto border-t border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        {["Department", "Email", "WhatsApp", "Last Verified"].map((h) => (
                          <th key={h} className="px-4 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DEPARTMENTS.map((d) => {
                        const f = data[d.id] || DEFAULT_CHANNEL_STATE;
                        return (
                          <tr key={d.id} onClick={() => switchDept(d.id)} className="cursor-pointer hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-slate-800">{d.name}</td>
                            <td className="px-4 py-2"><StatusBadge {...emailBadge(f)} /></td>
                            <td className="px-4 py-2"><StatusBadge {...waBadge(f)} /></td>
                            <td className="px-4 py-2 text-xs text-slate-500">{timeAgo(f.verifiedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {activeTab === "templates" && <TemplateMaster />}
      {activeTab === "log" && <MessageLog />}

      <Toast toast={toast} />
      {confirmDialog}
    </div>
  );
};

export default CommunicationSetup;

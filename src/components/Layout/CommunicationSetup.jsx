import React, { useState, useEffect, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Mail, Lock, CheckCircle2, XCircle, Send, Loader2, QrCode, Building2,
  ChevronRight, AlertTriangle, RefreshCw, Smartphone, Power, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../theme/AuthContext";
import TemplateMaster from "./TemplateMaster";
import MessageLog from "./MessageLog";
import {
  DEPARTMENTS, EMAIL_RE, LABEL_CLS, INPUT_CLS, timeAgo,
  useToast, Toast, useConfirm, Toggle,
} from "./commShared";

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

const TABS = [
  { id: "channels", label: "Channels" },
  { id: "templates", label: "Templates" },
  { id: "log", label: "Message Log" },
];

const WA_STEPS = ["Enter Number", "Scan QR", "Connected"];
const QR_SECONDS = 60;

// Fields saved by the Save bar (drive the unsaved-changes check)
const EMAIL_FIELDS = ["smtpProvider", "smtpHost", "smtpPort", "smtpSecure", "smtpUser", "smtpPwd", "fromName", "fromMail", "useDefault"];
// Changing any of these invalidates the SMTP verification
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

// ── Mock data — replace with INTMAS API later ───────────────────────────────
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

const fmtPhone = (n) => {
  const d = (n || "").replace(/\D/g, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : n;
};

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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

const StatChip = ({ icon: Icon, label, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-50 text-slate-500 ring-slate-200",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const CardHeader = ({ icon: Icon, tone, title, subtitle, badge }) => (
  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset
                    ${tone === "emerald" ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-indigo-50 text-indigo-600 ring-indigo-100"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
    <StatusBadge {...badge} />
  </div>
);

const BTN_PRIMARY = "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50";
const BTN_SECONDARY = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50";

// ── Main ────────────────────────────────────────────────────────────────────
const CommunicationSetup = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const myDeptId = user?.dept_id || "sales";
  const companyCode = user?.company_code || "LOGIX"; // TODO: confirm real field for company code
  const userName = user?.name || user?.username || "You";

  const [activeTab, setActiveTab] = useState("channels");
  const [selectedDept, setSelectedDept] = useState(isAdmin ? DEPARTMENTS[0].id : myDeptId);
  const [data, setData] = useState(MOCK_INITIAL);
  const [saved, setSaved] = useState(MOCK_INITIAL);
  const [saving, setSaving] = useState(false);
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

  // Patch a department directly (used by async actions); optionally mirror into the saved snapshot
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

  // ── Save / Discard ──
  const handleSave = () => {
    if (!isDirty || saving) return;
    if (form.fromMail && !EMAIL_RE.test(form.fromMail)) { showToast("From Email is not a valid address", "error"); return; }
    if (form.smtpPort && !/^\d+$/.test(form.smtpPort)) { showToast("Port must be a number", "error"); return; }
    setSaving(true);
    const id = selectedDept;
    const next = { ...form, pwdSaved: form.pwdSaved || !!form.smtpPwd, smtpPwd: "" };
    setTimeout(() => {
      setData((prev) => ({ ...prev, [id]: { ...prev[id], pwdSaved: next.pwdSaved, smtpPwd: "" } }));
      setSaved((prev) => ({ ...prev, [id]: next }));
      setSaving(false);
      setEditingPwd(false);
      showToast(`${DEPARTMENTS.find((d) => d.id === id)?.name} settings saved`);
    }, 600);
  };

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
    // Mock: gateway reports the scan after a few seconds — replace with status polling
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

  // QR countdown while waiting for scan
  useEffect(() => {
    if (form.waStatus !== "pending") return;
    const t = setInterval(() => setQrLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [form.waStatus, selectedDept]);

  // Clear pending link timers on unmount
  useEffect(() => {
    const timers = linkTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  // Keyboard: Ctrl+S saves the channel settings
  const keyRef = useRef();
  keyRef.current = (e) => {
    if (confirmDialog || activeTab !== "channels") return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
    }
  };
  useEffect(() => {
    const h = (e) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const waStepIndex = form.waStatus === "connected" ? 2 : form.waStatus === "pending" ? 1 : 0;

  return (
    <div className="space-y-5">
      {/* Overview strip — Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatChip icon={Building2} label="Departments Set Up" value={`${configuredDepts} of ${DEPARTMENTS.length}`} />
          <StatChip icon={Mail} label="Verified Emails" value={verifiedEmails} tone="indigo" />
          <StatChip icon={FaWhatsapp} label="WhatsApp Connected" value={connectedWa} tone="emerald" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200">
        <div className="flex space-x-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-all
                          ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "channels" && !isAdmin && (
          <span className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] text-slate-600">
            <Lock className="h-3.5 w-3.5 text-slate-400" /> {dept.name}
          </span>
        )}
      </div>

      {activeTab === "channels" && (
        <div className="space-y-5"> 
          {isAdmin && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Departments</h3>
                <span className="text-xs text-slate-400">Click a department to configure it</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      {["Department", "Email", "WhatsApp", "Last Verified", "Fallback", ""].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DEPARTMENTS.map((d) => {
                      const f = data[d.id] || DEFAULT_CHANNEL_STATE;
                      const active = d.id === selectedDept;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => switchDept(d.id)}
                          className={`cursor-pointer transition-colors ${active ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
                        >
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-2 font-medium text-slate-800">
                              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-indigo-500" : "bg-transparent"}`} />
                              {d.name}
                              {active && isDirty && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-inset ring-amber-200">UNSAVED</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2.5"><StatusBadge {...emailBadge(f)} /></td>
                          <td className="px-4 py-2.5"><StatusBadge {...waBadge(f)} /></td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{timeAgo(f.verifiedAt)}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.useDefault ? "Company default" : "None"}</td>
                          <td className="px-4 py-2.5 text-right">
                            <ChevronRight className={`h-4 w-4 inline ${active ? "text-indigo-400" : "text-slate-300"}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Email card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-indigo-500" />
            <CardHeader icon={Mail} title="Email (SMTP)" subtitle={`Outgoing mail for ${dept.name}`} badge={emailBadge(form)} />

            {/* Health line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-6 py-2.5 text-xs text-slate-500">
              {form.verified ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
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
              <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span><span className="font-semibold">Last test failed:</span> {form.lastError}</span>
              </div>
            )}

            {/* Provider presets */}
            <div className="px-6 pt-5">
              <label className={LABEL_CLS}>Provider</label>
              <div className="flex flex-wrap">
                {SMTP_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={`h-8 px-3 text-xs font-semibold ring-1 ring-inset -ml-px first:ml-0 first:rounded-l-lg last:rounded-r-lg transition-colors
                                ${form.smtpProvider === p.id ? "relative z-10 bg-indigo-50 text-indigo-600 ring-indigo-200" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3">
                    <span className="text-[13.5px] tracking-widest text-slate-400">••••••••</span>
                    <button type="button" onClick={() => setEditingPwd(true)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
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

            <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
              <div className="w-full sm:w-72">
                <FieldInput
                  label="Send test to"
                  placeholder="you@company.com"
                  value={form.testTo}
                  onChange={(e) => patchDept(selectedDept, { testTo: e.target.value })}
                />
              </div>
              <button onClick={handleTestEmail} disabled={testingEmail} className={BTN_SECONDARY}>
                {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-slate-400" />}
                Send Test Email
              </button>
            </div>
          </div>

          {/* WhatsApp card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-emerald-500" />
            <CardHeader icon={FaWhatsapp} tone="emerald" title="WhatsApp" subtitle={`Outgoing messages for ${dept.name}`} badge={waBadge(form)} />

            <div className="px-6 pt-5">
              <div className="flex items-center gap-2 mb-5">
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
              <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Session lost — the linked phone logged out or went offline. Messages are not being sent. Re-link to resume.</span>
              </div>
            )}

            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="mx-6 mt-4 flex flex-col sm:flex-row gap-5 rounded-lg border border-dashed border-slate-300 p-5">
                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                  {qrLeft > 0 ? <QrCode className="h-24 w-24 text-slate-700" /> : <QrCode className="h-24 w-24 text-slate-200" />}
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
                    <button onClick={() => setQrLeft(QR_SECONDS)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                      <RefreshCw className="h-3.5 w-3.5" /> QR expired — Refresh QR
                    </button>
                  )}
                </div>
              </div>
            )}

            {form.waStatus === "connected" && (
              <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-inset ring-emerald-100">
                  <Smartphone className="h-4 w-4" />
                </span>
                <div className="text-[13px]">
                  <p className="font-semibold text-slate-800">{fmtPhone(form.waNumber)} · Linked via WhatsApp Web</p>
                  <p className="text-xs text-slate-500">Connected {timeAgo(form.waConnectedAt)}</p>
                </div>
              </div>
            )}

            <div className="px-6 py-6 flex flex-wrap gap-3">
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
                    <Send className="h-4 w-4 text-slate-400" /> Send Test Message
                  </button>
                  <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                    <Power className="h-4 w-4" /> Disconnect
                  </button>
                </>
              )}
              {form.waStatus === "dropped" && (
                <>
                  <button onClick={startLink} className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-500`}>
                    <RefreshCw className="h-4 w-4" /> Re-link
                  </button>
                  <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                    <Power className="h-4 w-4" /> Disconnect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Fallback */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Fallback to company default</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                When {dept.name}'s channel is not configured or fails, send using the company default channel.
              </p>
            </div>
            <Toggle checked={form.useDefault} onChange={(v) => updateField("useDefault", v)} />
          </div>

          {/* Sticky save bar */}
          {isDirty && (
            <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-5 py-3 shadow-xl">
              <span className="flex items-center gap-2 text-[13px] text-slate-200">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Unsaved changes in {dept.name}
              </span>
              <div className="flex gap-2">
                <button onClick={handleDiscard} className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800">
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-8 items-center gap-2 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save
                  <kbd className="rounded bg-indigo-400/40 px-1.5 py-0.5 text-[10px] font-medium">Ctrl+S</kbd>
                </button>
              </div>
            </div>
          )}
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
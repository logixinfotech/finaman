import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Mail, CheckCircle2, XCircle, Send, Loader2, Building2, AlertTriangle,
  RefreshCw, Smartphone, Power, ShieldCheck, ChevronDown, Search, Copy,
  Eye, EyeOff, Check,
} from "lucide-react";
import { useAuth } from "../../theme/AuthContext";
import TemplateMaster from "./TemplateMaster";
import MessageLog from "./MessageLog";
import {
  EMAIL_RE, LABEL_CLS, INPUT_CLS, timeAgo,
  useToast, Toast, useConfirm, Toggle,
} from "./commShared";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../utils/api";
import { useSaveSlot } from "./Settings/SaveBus";

/* ── Brand tokens ── */
const NAVY = "#0B2447";
const NAVY_TINT = "#EEF2F8";
const NAVY_RING = "#C7D4E8";

/* ── Config ── */
const SMTP_PRESETS = [
  { id: "office365", label: "Office 365", host: "smtp.office365.com", port: "587", secure: "STARTTLS" },
  { id: "gmail", label: "Gmail / Workspace", host: "smtp.gmail.com", port: "587", secure: "STARTTLS" },
  { id: "zoho", label: "Zoho Mail", host: "smtp.zoho.in", port: "465", secure: "SSL" },
  { id: "custom", label: "Custom" },
];
 
const PROVIDER_BY_DOMAIN = {
  "gmail.com": "gmail",
  "googlemail.com": "gmail",
  "outlook.com": "office365",
  "hotmail.com": "office365",
  "live.com": "office365",
  "zoho.in": "zoho",
  "zoho.com": "zoho",
};

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

const QR_SECONDS = 20; 

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

/* ── Helpers ── */
const emailState = (f) => (f.verified ? "ok" : "bad");
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
  (name || "").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const isFormDirty = (f, s) => EMAIL_FIELDS.some((k) => f[k] !== s[k]);

const fromApi = (row) => ({
  ...DEFAULT_CHANNEL_STATE,
  ...row,
  smtpPwd: "", 
  testTo: "",
});

/* ── Small components ── */
const BTN_PRIMARY = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-white shadow-sm transition-all disabled:opacity-50";
const BTN_SECONDARY = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50";

const FieldInput = ({ label, error, hint, className = "", ...props }) => (
  <div className={className}>
    <label className={LABEL_CLS}>{label}</label>
    <input
      {...props}
      className={`${INPUT_CLS} ${error ? "!border-rose-300 !ring-rose-200" : ""}`}
    />
    {error ? (
      <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    ) : null}
  </div>
);

const StatusBadge = ({ state, label }) => {
  const tone =
    state === "ok" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : state === "pending" || state === "warn" ? "bg-amber-50 text-amber-700 ring-amber-600/20"
    : "bg-slate-50 text-slate-500 ring-slate-200";
  const Icon = state === "ok" ? CheckCircle2 : state === "pending" ? Loader2 : state === "warn" ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tone}`}>
      <Icon className={`h-3 w-3 ${state === "pending" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
};

const Dots = ({ f }) => (
  <span className="flex shrink-0 gap-1">
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT_COLOR[emailState(f)] }} title="Email" />
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT_COLOR[waState(f)] }} title="WhatsApp" />
  </span>
);

const useClickAway = (open, onClose) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open, onClose]);
  return ref;
};

/* ── Department dropdown (replaces the sidebar) ── */
function DeptSwitcher({ departments, selectedId, onSelect, data, saved }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const close = useCallback(() => { setOpen(false); setQ(""); }, []);
  const ref = useClickAway(open, close);

  const current = departments.find((d) => d.id === selectedId) || departments[0];
  const list = departments.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 shadow-sm hover:border-slate-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ background: NAVY }}>
          {initials(current?.name)}
        </span>
        <span className="flex-1 truncate text-left text-[13px] font-semibold text-slate-800">{current?.name}</span>
        <Dots f={data[current?.id] || DEFAULT_CHANNEL_STATE} />
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {departments.length > 5 && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search department…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              />
            </div>
          )}
          <ul role="listbox" className="max-h-64 overflow-y-auto p-1">
            {list.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">No department found</li>}
            {list.map((d) => {
              const f = data[d.id] || DEFAULT_CHANNEL_STATE;
              const dirty = isFormDirty(f, saved[d.id] || DEFAULT_CHANNEL_STATE);
              const active = d.id === selectedId;
              return (
                <li key={d.id}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => { close(); onSelect(d.id); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                    style={active ? { background: NAVY_TINT } : undefined}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={active ? { background: NAVY, color: "#fff" } : { background: "#F1F5F9", color: "#64748B" }}
                    >
                      {initials(d.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700">{d.name}</span>
                    {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
                    <Dots f={f} />
                    {active && <Check className="h-3.5 w-3.5" style={{ color: NAVY }} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[10.5px] text-slate-400">
            <span>Dots: Email · WhatsApp</span>
            <span className="ml-auto inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> OK</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Off</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── "Copy email settings from…" popover ── */
function CopyFrom({ departments, selectedId, data, onPick }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickAway(open, close);
  const sources = departments.filter((d) => d.id !== selectedId && (data[d.id] || {}).smtpHost);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} disabled={sources.length === 0} className={BTN_SECONDARY} title={sources.length ? "" : "No other department has email set up"}>
        <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy from…
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Copy SMTP settings from</p>
          <ul className="max-h-56 overflow-y-auto p-1">
            {sources.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => { close(); onPick(d.id); }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-50"
                >
                  <span className="truncate text-[13px] font-medium text-slate-700">{d.name}</span>
                  <span className="truncate text-[11px] text-slate-400">{data[d.id].smtpHost}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
 
const ChannelCard = ({ icon, title, badge, right, children }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
        <StatusBadge {...badge} />
      </div>
      {right}
    </header>
    {children}
  </section>
);

/* ── Main ── */
const CommunicationSetup = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin"; 
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedDept, setSelectedDept] = useState(null);
  const [data, setData] = useState({});
  const [saved, setSaved] = useState({});
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qrLeft, setQrLeft] = useState(QR_SECONDS);
  const [toast, showToast] = useToast();
  const [confirmDialog, ask] = useConfirm();
  const [waQr, setWaQr] = useState("");
  const [waBusy, setWaBusy] = useState(false);

  /* ── Load ── */
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/api/communication/summary");
      const rows = res.data?.data || [];
      const depts = rows.map((r) => ({ id: r.deptGroupId, name: r.deptLabel, isDefault: r.isDefault }));
      const dataMap = {};
      rows.forEach((r) => { dataMap[r.deptGroupId] = fromApi(r); });
      setDepartments(depts);
      setData(dataMap);
      setSaved(dataMap);
      setSelectedDept((prev) => (prev != null && dataMap[prev] ? prev : (depts[0] ? depts[0].id : null)));
    } catch (err) {
      setLoadError(err?.response?.data?.message || err.message || "Could not load communication settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const dept = departments.find((d) => d.id === selectedDept) || departments[0] || { id: null, name: "" };
  const form = data[selectedDept] || DEFAULT_CHANNEL_STATE;
  const savedForm = saved[selectedDept] || DEFAULT_CHANNEL_STATE;
  const isDirty = isFormDirty(form, savedForm);
  const presetLocked = form.smtpProvider !== "custom";
  const advancedOpen = showAdvanced || !presetLocked;

  const stats = useMemo(() => {
    const all = departments.map((d) => data[d.id] || DEFAULT_CHANNEL_STATE);
    return {
      total: departments.length,
      configured: all.filter((f) => f.verified || f.waStatus === "connected").length,
    };
  }, [departments, data]);

  /* ── Inline validation ── */
  const errors = {
    smtpHost: (form.smtpUser || form.fromMail) && !form.smtpHost.trim() ? "SMTP Host is required" : "",
    fromMail: form.fromMail && !EMAIL_RE.test(form.fromMail) ? "Enter a valid email address" : "",
    smtpPort: form.smtpPort && !/^\d+$/.test(form.smtpPort) ? "Port must be a number" : "",
    testTo: form.testTo && !EMAIL_RE.test(form.testTo) ? "Enter a valid email address" : "",
  };

  /* ── State helpers ── */
  const updateMany = (patch) =>
    setData((prev) => {
      const cur = prev[selectedDept] || DEFAULT_CHANNEL_STATE;
      const next = { ...cur, ...patch };
      if (Object.keys(patch).some((k) => VERIFY_FIELDS.includes(k) && patch[k] !== cur[k])) next.verified = false;
      return { ...prev, [selectedDept]: next };
    });

  const updateField = (field, value) => updateMany({ [field]: value });
 
  const onUserChange = (value) => {
    const domain = (value.split("@")[1] || "").toLowerCase();
    const guess = form.smtpProvider === "custom" && !form.smtpHost ? PROVIDER_BY_DOMAIN[domain] : null;
    if (guess) {
      const p = SMTP_PRESETS.find((x) => x.id === guess);
      updateMany({ smtpUser: value, smtpProvider: guess, smtpHost: p.host, smtpPort: p.port, smtpSecure: p.secure });
      setShowAdvanced(false);
    } else {
      updateField("smtpUser", value);
    }
  };

  const patchDept = (id, patch, alsoSaved = false) => {
    setData((prev) => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_CHANNEL_STATE), ...patch } }));
    if (alsoSaved) setSaved((prev) => ({ ...prev, [id]: { ...(prev[id] || DEFAULT_CHANNEL_STATE), ...patch } }));
  };

  const applyPreset = (id) => {
    const p = SMTP_PRESETS.find((x) => x.id === id);
    if (id === "custom") { updateMany({ smtpProvider: "custom" }); setShowAdvanced(true); }
    else { updateMany({ smtpProvider: id, smtpHost: p.host, smtpPort: p.port, smtpSecure: p.secure }); setShowAdvanced(false); }
  };

  const copyFrom = (srcId) => {
    const s = data[srcId];
    if (!s) return;
    updateMany({
      smtpProvider: s.smtpProvider, smtpHost: s.smtpHost, smtpPort: s.smtpPort,
      smtpSecure: s.smtpSecure, smtpUser: s.smtpUser,
    });
    setEditingPwd(true);
    showToast(`Settings copied from ${departments.find((d) => d.id === srcId)?.name}. Enter the password to continue.`);
  };

  /* ── Department switch with unsaved guard ── */
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
    setShowPwd(false);
    setWaQr("");
    setShowAdvanced(false);
    setSelectedDept(id);
  };

  /* ── Save / Discard (wired to common Save Bus) ── */
  const handleSave = useCallback(() => {
    return new Promise((resolve, reject) => {
      if ((form.smtpUser || form.fromMail || form.smtpPwd) && !form.smtpHost.trim()) { showToast("SMTP Host is required", "error"); reject(new Error("host required")); return; }
      if (form.fromMail && !EMAIL_RE.test(form.fromMail)) { showToast("From Email is not a valid address", "error"); reject(new Error("invalid email")); return; }
      if (form.smtpPort && !/^\d+$/.test(form.smtpPort)) { showToast("Port must be a number", "error"); reject(new Error("invalid port")); return; }
      const id = selectedDept;
      setSaving(true);
      api.put(`/api/communication/${id}/email`, {
        smtpProvider: form.smtpProvider,
        smtpHost: form.smtpHost,
        smtpPort: form.smtpPort,
        smtpSecure: form.smtpSecure,
        smtpUser: form.smtpUser,
        smtpPwd: form.smtpPwd || undefined,
        fromName: form.fromName,
        fromMail: form.fromMail,
        useDefault: form.useDefault,
      })
        .then((res) => {
          const next = fromApi(res.data?.data || {});
          setData((prev) => ({ ...prev, [id]: next }));
          setSaved((prev) => ({ ...prev, [id]: next }));
          setEditingPwd(false);
          showToast(res.data?.message || `${departments.find((d) => d.id === id)?.name} settings saved`);
          resolve();
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || err.message || "Could not save settings";
          showToast(msg, "error");
          reject(err);
        })
        .finally(() => setSaving(false));
    });
  }, [form, selectedDept, showToast, departments]);

  useSaveSlot("communication", isDirty, handleSave);

  const handleDiscard = () => {
    setData((prev) => ({ ...prev, [selectedDept]: savedForm }));
    setEditingPwd(false);
  };

  /* ── Email test ── */
  const handleTestEmail = () => {
    if (!form.smtpHost) { showToast("SMTP Host is missing. Fill in the server settings and save before testing", "error"); return; }
    if (!EMAIL_RE.test(form.testTo || "")) { showToast("Enter a valid address in 'Send test to'", "error"); return; }
    if (isDirty) { showToast("Save your changes before sending a test email", "error"); return; }
    const id = selectedDept;
    const testTo = form.testTo;
    setTestingEmail(true);
    api.post(`/api/communication/${id}/email/test`, { testTo })
      .then((res) => {
        showToast(res.data?.message || `Test email sent to ${testTo}`);
        return api.get(`/api/communication/${id}`);
      })
      .then((res) => {
        const next = fromApi(res.data?.data || {});
        setData((prev) => ({ ...prev, [id]: { ...next, testTo } }));
        setSaved((prev) => ({ ...prev, [id]: next }));
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err.message || "Test failed";
        showToast(msg, "error");
        patchDept(id, { verified: false, lastError: msg.replace(/^Test failed\s*—\s*/, "") });
      })
      .finally(() => setTestingEmail(false));
  };
 
  const waPick = (row) => ({
    waNumber: row.waNumber,
    waInstId: row.waInstId,
    waStatus: row.waStatus,
    waConnectedAt: row.waConnectedAt,
  });
  const waError = (err, fallback) => err?.response?.data?.message || err.message || fallback; 
  const syncWa = async (id) => {
    try {
      const res = await api.get(`/api/communication/${id}`);
      patchDept(id, waPick(fromApi(res.data?.data || {})), true);
    } catch (_) { /* best-effort */ }
  };

  const startLink = async () => {
    const num = (form.waNumber || "").replace(/\D/g, "");
    if (num.length !== 10) { showToast("Enter a valid 10-digit WhatsApp number", "error"); return; }
    const id = selectedDept;
    setWaBusy(true);
    try {
      const res = await api.post(`/api/communication/${id}/whatsapp/connect`, { number: num });
      patchDept(id, waPick(fromApi(res.data?.data || {})), true);
      setWaQr(res.data?.qr || "");
      setQrLeft(QR_SECONDS);
    } catch (err) {
      showToast(waError(err, "Could not start WhatsApp linking"), "error");
    } finally {
      setWaBusy(false);
    }
  };

  const verifyWa = async () => {
    const id = selectedDept;
    setWaBusy(true);
    try {
      const res = await api.post(`/api/communication/${id}/whatsapp/verify`);
      patchDept(id, waPick(fromApi(res.data?.data || {})), true);
      setWaQr("");
      showToast(res.data?.message || "WhatsApp connected");
    } catch (err) {
      showToast(waError(err, "Could not verify the WhatsApp link"), "error");
    } finally {
      setWaBusy(false);
    }
  };

  const resetWa = async (id) => {
    const res = await api.post(`/api/communication/${id}/whatsapp/disconnect`);
    patchDept(id, waPick(fromApi(res.data?.data || {})), true);
    setWaQr("");
  };

  const cancelLink = async () => {
    setWaBusy(true);
    try {
      await resetWa(selectedDept);
    } catch (err) {
      showToast(waError(err, "Could not cancel linking"), "error");
    } finally {
      setWaBusy(false);
    }
  };

  const disconnectWa = async () => {
    const ok = await ask(
      "Disconnect WhatsApp?",
      `${dept.name} will stop sending WhatsApp messages until the number is linked again.`,
      "Disconnect", "rose"
    );
    if (!ok) return;
    setWaBusy(true);
    try {
      await resetWa(selectedDept);
      showToast("WhatsApp disconnected");
    } catch (err) {
      showToast(waError(err, "Could not disconnect WhatsApp"), "error");
    } finally {
      setWaBusy(false);
    }
  };

  const handleTestWhatsapp = async () => {
    const id = selectedDept;
    setWaBusy(true);
    try {
      const res = await api.post(`/api/communication/${id}/whatsapp/test`, { to: form.waNumber });
      showToast(res.data?.message || `Test message sent to ${fmtPhone(form.waNumber)}`);
    } catch (err) {
      showToast(waError(err, "Test message failed"), "error");
      syncWa(id);
    } finally {
      setWaBusy(false);
    }
  };

  useEffect(() => {
    if (form.waStatus !== "pending") return;
    const t = setInterval(() => setQrLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [form.waStatus, selectedDept]);

  /* ── Guards ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading communication settings…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-8 text-center">
        <AlertTriangle className="h-5 w-5 text-rose-500" />
        <p className="text-sm font-medium text-rose-700">{loadError}</p>
        <button onClick={loadSummary} className={BTN_SECONDARY}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!dept.id && dept.id !== 0) {
    return <div className="py-16 text-center text-sm text-slate-400">No department is set up for communication yet.</div>;
  }

  const eBadge = emailBadge(form);
  const wBadge = waBadge(form);

  /* ── Render ── */
  return (
    <div className="space-y-3">
      {/* Top bar: department • summary • unsaved • copy */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {isAdmin && departments.length > 1 ? (
          <DeptSwitcher departments={departments} selectedId={selectedDept} onSelect={switchDept} data={data} saved={saved} />
        ) : (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-slate-800 shadow-sm">
            <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} /> {dept.name}
          </span>
        )}

        {isAdmin && (
          <span className="text-[12.5px] text-slate-500">
            <span className="font-semibold text-slate-700">{stats.configured}/{stats.total}</span> departments configured
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <AlertTriangle className="h-3 w-3" />
              Unsaved changes
              <button onClick={handleDiscard} className="font-semibold text-amber-800 underline decoration-amber-400 underline-offset-2 hover:text-amber-900">
                Discard
              </button>
            </span>
          )}
          {isAdmin && activeTab === "channels" && (
            <CopyFrom departments={departments} selectedId={selectedDept} data={data} onPick={copyFrom} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="mr-4 whitespace-nowrap border-b-2 px-1 py-2 text-[12.5px] font-semibold transition-all"
            style={activeTab === tab.id ? { borderColor: NAVY, color: NAVY } : { borderColor: "transparent", color: "#64748b" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "channels" && (
        <fieldset disabled={!isAdmin} className="m-0 min-w-0 space-y-3 border-0 p-0">
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              View only — only an Admin can change communication settings.
            </div>
          )}
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            {/* ───────── EMAIL ───────── */}
            <ChannelCard
              icon={<Mail className="h-4 w-4" style={{ color: NAVY }} />}
              title="Email"
              badge={eBadge}
              right={
                form.verified ? (
                  <span className="hidden items-center gap-1.5 text-[11.5px] text-slate-500 sm:inline-flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    {timeAgo(form.verifiedAt)} · {form.sentToday} sent ·{" "}
                    <span className={form.failedToday ? "font-medium text-rose-600" : ""}>{form.failedToday} failed</span>
                  </span>
                ) : null
              }
            >
              {form.lastError && (
                <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><span className="font-semibold">Last test failed:</span> {form.lastError}</span>
                </div>
              )}

              {/* Provider chips */}
              <div className="px-4 pt-3">
                <label className={LABEL_CLS}>Provider</label>
                <div className="flex flex-wrap">
                  {SMTP_PRESETS.map((p) => {
                    const active = form.smtpProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className="-ml-px h-7 px-2.5 text-[11px] font-semibold ring-1 ring-inset transition-colors first:ml-0 first:rounded-l-lg last:rounded-r-lg"
                        style={
                          active
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

              {/* Essentials */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                <FieldInput
                  label="Username"
                  value={form.smtpUser}
                  autoComplete="off"
                  placeholder="mailer@company.com"
                  onChange={(e) => onUserChange(e.target.value)}
                />
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
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={form.pwdSaved ? "Enter new password" : "App password"}
                        value={form.smtpPwd}
                        onChange={(e) => updateField("smtpPwd", e.target.value)}
                        className={`${INPUT_CLS} pr-8`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
                <FieldInput label="From Name" value={form.fromName} placeholder="Company HR" onChange={(e) => updateField("fromName", e.target.value)} />
                <FieldInput
                  label="From Email"
                  value={form.fromMail}
                  error={errors.fromMail}
                  placeholder="hr@company.com"
                  onChange={(e) => updateField("fromMail", e.target.value)}
                />
              </div>

              {/* Advanced (host / port / encryption) */}
              <div className="border-t border-slate-100 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  disabled={!presetLocked}
                  className="flex w-full items-center justify-between text-left disabled:cursor-default"
                >
                  <span className="text-[12px] font-semibold text-slate-600">Server settings</span>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                    {!advancedOpen && form.smtpHost && `${form.smtpHost} · ${form.smtpPort} · ${form.smtpSecure}`}
                    {presetLocked && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />}
                  </span>
                </button>
                {advancedOpen && (
                  <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FieldInput label="SMTP Host" value={form.smtpHost} error={errors.smtpHost} disabled={presetLocked} onChange={(e) => updateField("smtpHost", e.target.value)} className="sm:col-span-1" />
                    <FieldInput label="Port" value={form.smtpPort} error={errors.smtpPort} disabled={presetLocked} onChange={(e) => updateField("smtpPort", e.target.value)} />
                    <div>
                      <label className={LABEL_CLS}>Encryption</label>
                      <select value={form.smtpSecure} disabled={presetLocked} onChange={(e) => updateField("smtpSecure", e.target.value)} className={INPUT_CLS}>
                        {ENCRYPTION.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Test row */}
              <div className="flex flex-wrap items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                <FieldInput
                  label="Send test to"
                  placeholder="you@company.com"
                  value={form.testTo}
                  error={errors.testTo}
                  className="min-w-[200px] flex-1"
                  onChange={(e) => patchDept(selectedDept, { testTo: e.target.value })}
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail || saving}
                  className={`${BTN_SECONDARY} mt-[18px]`}
                  title={isDirty ? "Save your changes first" : ""}
                >
                  {testingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-slate-400" />}
                  Send Test
                </button>
              </div>
            </ChannelCard>

            {/* ───────── WHATSAPP ───────── */}
            <ChannelCard
              icon={<FaWhatsapp className="h-4 w-4 text-emerald-500" />}
              title="WhatsApp"
              badge={wBadge}
              right={
                form.waStatus === "connected" ? (
                  <span className="hidden text-[11.5px] text-slate-500 sm:inline">Connected {timeAgo(form.waConnectedAt)}</span>
                ) : null
              }
            >
              {form.waStatus === "dropped" && (
                <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Session lost — the linked phone logged out or went offline. Messages are not being sent. Re-link to resume.</span>
                </div>
              )}

              {/* Disconnected / dropped: number + action inline */}
              {(form.waStatus === "disconnected" || form.waStatus === "dropped") && (
                <div className="p-4">
                  <div className="flex flex-wrap items-end gap-2">
                    <FieldInput
                      label="WhatsApp Number"
                      placeholder="10-digit mobile number"
                      value={form.waNumber}
                      inputMode="numeric"
                      maxLength={10}
                      className="min-w-[200px] flex-1"
                      onChange={(e) => updateField("waNumber", e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      onClick={startLink}
                      disabled={form.waNumber.length !== 10 || waBusy}
                      className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-500`}
                    >
                      {form.waStatus === "dropped" ? <><RefreshCw className="h-3.5 w-3.5" /> Re-link</> : "Connect"}
                    </button>
                    {form.waStatus === "dropped" && (
                      <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                        <Power className="h-3.5 w-3.5" /> Disconnect
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-[11.5px] leading-relaxed text-slate-400">
                    Enter the number, press Connect, then scan the QR from WhatsApp → Linked Devices on that phone.
                  </p>
                </div>
              )}

              {/* Pending: QR + steps side by side */}
              {form.waStatus === "pending" && (
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative flex h-[148px] w-[148px] shrink-0 items-center justify-center self-center overflow-hidden rounded-lg border border-slate-200 bg-white sm:self-start">
                    {waQr ? <QRCodeSVG value={waQr} size={132} level="M" /> : null}
                    {(qrLeft <= 0 || !waQr) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-[1px]">
                        <RefreshCw className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="text-[12.5px] text-slate-600">
                    <p className="mb-1.5 font-semibold text-slate-800">Link {fmtPhone(form.waNumber)}</p>
                    <ol className="list-decimal space-y-0.5 pl-4">
                      <li>Open WhatsApp on that phone</li>
                      <li>Settings → Linked Devices</li>
                      <li>Tap "Link a device" and scan this QR</li>
                    </ol>
                    {qrLeft > 0 && waQr ? (
                      <p className="mt-2.5 text-xs text-slate-400">
                        Expires in <span className="font-mono font-semibold text-slate-600">{fmtClock(qrLeft)}</span>
                      </p>
                    ) : (
                      <button onClick={startLink} className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: NAVY }}>
                        <RefreshCw className="h-3.5 w-3.5" /> QR expired — Refresh
                      </button>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={verifyWa} disabled={waBusy} className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-500`}>
                        {waBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        I've scanned it
                      </button>
                      <button onClick={cancelLink} disabled={waBusy} className={BTN_SECONDARY}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Connected: one line + actions */}
              {form.waStatus === "connected" && (
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-inset ring-emerald-100">
                      <Smartphone className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 text-[12.5px]">
                      <p className="truncate font-semibold text-slate-800">{fmtPhone(form.waNumber)}</p>
                      <p className="truncate text-xs text-slate-500">Linked via WhatsApp Web · {form.waInstId}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleTestWhatsapp} disabled={waBusy} className={BTN_SECONDARY}>
                      <Send className="h-3.5 w-3.5 text-slate-400" /> Send Test Message
                    </button>
                    <button onClick={disconnectWa} className={`${BTN_SECONDARY} text-rose-600`}>
                      <Power className="h-3.5 w-3.5" /> Disconnect
                    </button>
                  </div>
                </div>
              )}
            </ChannelCard>
          </div>

          {/* Fallback — one compact row */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-900">Fallback to company default</h3>
              <p className="truncate text-xs text-slate-400">
                If {dept.name}'s channel is not set up or fails, send via the company default.
              </p>
            </div>
            <Toggle checked={form.useDefault} onChange={(v) => updateField("useDefault", v)} />
          </div>
        </fieldset>
      )}

      {activeTab === "templates" && <TemplateMaster />}
      {activeTab === "log" && <MessageLog />}

      <Toast toast={toast} />
      {confirmDialog}
    </div>
  );
};

export default CommunicationSetup;

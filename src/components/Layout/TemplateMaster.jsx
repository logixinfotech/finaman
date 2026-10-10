import React, { useState, useMemo, useRef, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Filter, Maximize2, Minimize2, Printer, Download, Pencil, Search, Plus, X,
  ChevronDown, Users, Mail, Building2, Copy, Zap, Paperclip, FileText,
  AlertTriangle, CheckCheck, SlidersHorizontal, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../theme/AuthContext";
import { DEPARTMENTS, deptName, LABEL_CLS, INPUT_CLS, useToast, Toast, useConfirm, Toggle } from "./commShared";

/* ── Brand tokens — matches CommunicationSetup / ERPHeader navy identity ── */
const NAVY = "#0B2447";
const NAVY_SOFT = "#13335E";
const NAVY_TINT = "#EEF2F8";
const NAVY_RING = "#C7D4E8";

// ── Mock data — replace with TMPMAS API calls later ─────────────────────────
const MOCK_USERS = {
  sales: [{ id: "u1", name: "Priya Sharma" }, { id: "u2", name: "Raj Verma" }, { id: "u4", name: "Karan Mehta" }],
  accounts: [{ id: "u3", name: "Anita Rao" }, { id: "u5", name: "Vikram Singh" }],
  support: [{ id: "u6", name: "Neha Gupta" }],
  hr: [{ id: "u7", name: "Sonia Das" }],
};

// [key, label, sample value]
const VARIABLE_GROUPS = [
  { module: "Customer", vars: [["customerName", "Customer Name", "Sharma Pharma Pvt Ltd"], ["contactPerson", "Contact Person", "Mr. Rakesh Sharma"], ["customerCity", "City", "Hyderabad"]] },
  { module: "Sales Order", vars: [["orderNo", "Order No", "SO/26-27/00142"], ["orderDate", "Order Date", "23-Sep-2026"], ["amount", "Order Amount", "₹ 1,25,400.00"]] },
  { module: "Invoice", vars: [["invoiceNo", "Invoice No", "INV/26-27/00891"], ["dueDate", "Due Date", "08-Oct-2026"], ["balance", "Balance Due", "₹ 42,000.00"]] },
  { module: "Company", vars: [["companyName", "Company Name", "Logix Infotech LLP"], ["senderName", "Sender Name", "Priya Sharma"]] },
];

const SAMPLE = Object.fromEntries(VARIABLE_GROUPS.flatMap((g) => g.vars.map(([k, , s]) => [k, s])));

const TRIGGERS = [
  { id: "MANUAL", label: "Manual send only" },
  { id: "SO_SAVE", label: "On Sales Order save" },
  { id: "SO_APPROVE", label: "On Sales Order approval" },
  { id: "INV_SAVE", label: "On Invoice save" },
  { id: "PAY_DUE", label: "Payment due reminder" },
  { id: "EMP_JOIN", label: "On employee joining" },
];

// Report Studio prints that can be attached as PDF
const ATTACHMENTS = [
  { id: "", label: "No attachment" },
  { id: "SO_PRINT", label: "Sales Order Print" },
  { id: "INV_PRINT", label: "Tax Invoice Print" },
  { id: "STMT", label: "Customer Statement" },
];

const WA_LIMIT = 4096;
const SUBJECT_WARN = 78;

const MOCK_TEMPLATES = [
  {
    id: 1, name: "Order Confirmation", department: "sales", channel: "EMAIL",
    subject: "Your order {{orderNo}} is confirmed",
    body: "Dear {{contactPerson}},\n\nYour order {{orderNo}} dated {{orderDate}} worth {{amount}} has been confirmed and will ship soon.\n\nRegards,\n{{senderName}}\n{{companyName}}",
    trigger: "SO_APPROVE", attachment: "SO_PRINT",
    allUsers: false, allowedUsers: [{ id: "u1", name: "Priya Sharma" }, { id: "u2", name: "Raj Verma" }],
    active: true,
  },
  {
    id: 2, name: "Payment Reminder", department: "accounts", channel: "WHATSAPP",
    subject: "",
    body: "Hi {{contactPerson}}, a gentle reminder that {{balance}} against invoice {{invoiceNo}} is due on {{dueDate}}. Please ignore if already paid.",
    trigger: "PAY_DUE", attachment: "INV_PRINT",
    allUsers: true, allowedUsers: [],
    active: true,
  },
  {
    id: 3, name: "Welcome Message", department: "support", channel: "WHATSAPP",
    subject: "",
    body: "Welcome to {{companyName}}, {{contactPerson}}! We are here to help.",
    trigger: "MANUAL", attachment: "",
    allUsers: false, allowedUsers: [],
    active: false,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;
const fillSample = (text) => (text || "").replace(TOKEN_RE, (m, k) => SAMPLE[k] ?? m);
const unknownVars = (text) => [...new Set([...(text || "").matchAll(TOKEN_RE)].map((m) => m[1]).filter((k) => !(k in SAMPLE)))];
const triggerLabel = (id) => TRIGGERS.find((t) => t.id === id)?.label || "Manual send only";
const attachmentLabel = (id) => ATTACHMENTS.find((a) => a.id === id)?.label || "";

// ── Small components ────────────────────────────────────────────────────────
const ChannelBadge = ({ channel }) => (
  <span
    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
    style={
      channel === "EMAIL"
        ? { background: NAVY_TINT, color: NAVY, boxShadow: `inset 0 0 0 1px ${NAVY_RING}` }
        : { background: "#ECFDF5", color: "#059669", boxShadow: "inset 0 0 0 1px #A7F3D0" }
    }
  >
    {channel === "EMAIL" ? <Mail className="h-3 w-3" /> : <FaWhatsapp className="h-3 w-3" />}
    {channel === "EMAIL" ? "Email" : "WhatsApp"}
  </span>
);

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset
                ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-50 text-slate-500 ring-slate-200"}`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const IconBtn = ({ icon: Icon, active, ...props }) => (
  <button
    {...props}
    className="flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    style={active ? { background: NAVY_TINT, color: NAVY, boxShadow: `inset 0 0 0 1px ${NAVY_RING}` } : { background: "#fff", color: "#64748b", boxShadow: "inset 0 0 0 1px #e2e8f0" }}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

const Kbd = ({ children }) => (
  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{children}</kbd>
);

// ── Main ────────────────────────────────────────────────────────────────────
const TemplateMaster = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const myDeptId = user?.dept_id || "sales"; // TODO: confirm real field once Department Master is wired

  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ department: "", channel: "", activeOnly: false });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [varSearch, setVarSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [toast, showToast] = useToast();
  const [confirmDialog, ask] = useConfirm();

  const bodyRef = useRef(null);
  const subjectRef = useRef(null);
  const searchRef = useRef(null);
  const filterBtnRef = useRef(null);
  const lastFieldRef = useRef("body");
  const origDraftRef = useRef("");

  const visibleDepartments = isAdmin ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.id === myDeptId);
  const activeFilterCount = (filters.department ? 1 : 0) + (filters.channel ? 1 : 0) + (filters.activeOnly ? 1 : 0);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (!isAdmin && t.department !== myDeptId) return false;
      if (filters.department && t.department !== filters.department) return false;
      if (filters.channel && t.channel !== filters.channel) return false;
      if (filters.activeOnly && !t.active) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          triggerLabel(t.trigger).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, filters, search, isAdmin, myDeptId]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));
  const allExpanded = filtered.length > 0 && filtered.every((t) => expandedIds.includes(t.id));

  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filtered.map((t) => t.id));
  const toggleRow = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleExpand = (id) => setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ── Editor open / close ──
  const openEditor = (id, value) => {
    setEditingId(id);
    setDraft(value);
    origDraftRef.current = JSON.stringify(value);
    lastFieldRef.current = "body";
    setVarSearch("");
    setUserSearch("");
    setEditorOpen(true);
  };

  const openNew = () =>
    openEditor(null, {
      name: "", department: isAdmin ? DEPARTMENTS[0].id : myDeptId, channel: "EMAIL",
      subject: "", body: "", trigger: "MANUAL", attachment: "",
      allUsers: false, allowedUsers: [], active: true,
    });

  const openEdit = (id) => {
    const t = templates.find((x) => x.id === id);
    if (t) openEditor(t.id, { ...t, allowedUsers: [...t.allowedUsers] });
  };

  const openClone = () => {
    const t = templates.find((x) => x.id === selectedIds[0]);
    if (t) openEditor(null, { ...t, id: undefined, name: `${t.name} (Copy)`, allowedUsers: [...t.allowedUsers] });
  };

  const closeEditor = async () => {
    if (draft && JSON.stringify(draft) !== origDraftRef.current) {
      const ok = await ask("Discard changes?", "Your changes to this template have not been saved.", "Discard", "rose");
      if (!ok) return;
    }
    setEditorOpen(false);
  };

  // ── Validation + save ──
  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { showToast("Template Name is required", "error"); return; }
    const duplicate = templates.some(
      (t) => t.id !== editingId && t.department === draft.department && t.channel === draft.channel && t.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) { showToast(`"${name}" already exists for ${deptName(draft.department)} / ${draft.channel === "EMAIL" ? "Email" : "WhatsApp"}`, "error"); return; }
    if (draft.channel === "EMAIL" && !draft.subject.trim()) { showToast("Subject is required for Email templates", "error"); return; }
    if (!draft.body.trim()) { showToast("Message Body is required", "error"); return; }
    const unknown = unknownVars(`${draft.channel === "EMAIL" ? draft.subject : ""} ${draft.body}`);
    if (unknown.length) { showToast(`Unknown variable: {{${unknown[0]}}}`, "error"); return; }
    if (draft.channel === "WHATSAPP" && draft.body.length > WA_LIMIT) { showToast(`WhatsApp message exceeds ${WA_LIMIT} characters`, "error"); return; }
    if (!draft.allUsers && draft.allowedUsers.length === 0) { showToast("Select at least one user, or allow all department users", "error"); return; }

    const record = { ...draft, name, subject: draft.channel === "EMAIL" ? draft.subject : "" };
    if (editingId) {
      setTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...record, id: editingId } : t)));
      showToast("Template updated");
    } else {
      setTemplates((prev) => [...prev, { ...record, id: Date.now() }]);
      showToast("Template created");
    }
    setEditorOpen(false);
    setSelectedIds([]);
  };

  // ── Insert variable at the caret of the last focused field ──
  const insertVar = (key) => {
    const token = `{{${key}}}`;
    const field = draft.channel === "EMAIL" && lastFieldRef.current === "subject" ? "subject" : "body";
    const el = field === "subject" ? subjectRef.current : bodyRef.current;
    const value = draft[field] || "";
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setDraft((d) => ({ ...d, [field]: value.slice(0, start) + token + value.slice(end) }));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const toggleUser = (u) =>
    setDraft((d) => ({
      ...d,
      allowedUsers: d.allowedUsers.some((x) => x.id === u.id) ? d.allowedUsers.filter((x) => x.id !== u.id) : [...d.allowedUsers, u],
    }));

  const clearFilters = () => { setFilters({ department: "", channel: "", activeOnly: false }); setSearch(""); };

  // ── Keyboard: N new · / search · Ctrl+S save · Esc close ──
  const keyRef = useRef();
  keyRef.current = (e) => {
    if (confirmDialog) return;
    if (editorOpen) {
      if (e.key === "Escape") { e.preventDefault(); closeEditor(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); }
      return;
    }
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "n" || e.key === "N") { e.preventDefault(); openNew(); }
    else if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
  };
  useEffect(() => {
    const h = (e) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Editor-derived values ──
  const deptUsers = draft ? MOCK_USERS[draft.department] || [] : [];
  const shownUsers = deptUsers.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  const unknown = draft ? unknownVars(`${draft.channel === "EMAIL" ? draft.subject : ""} ${draft.body}`) : [];
  const varGroups = VARIABLE_GROUPS
    .map((g) => ({ ...g, vars: g.vars.filter(([k, label]) => `${k} ${label}`.toLowerCase().includes(varSearch.toLowerCase())) }))
    .filter((g) => g.vars.length);

  return (
    <div className="relative">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Message Templates</h3> 
          </div>
          <div className="flex gap-2">
            {selectedIds.length === 1 && (
              <button
                onClick={openClone}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[12px] font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" /> Clone
              </button>
            )}
            <button
              onClick={openNew}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-white shadow-sm transition-all"
              style={{ background: NAVY }}
            >
              <Plus className="h-3.5 w-3.5" /> New Template
            </button>
          </div>
        </div>

        {/* Single toolbar row: search · filters · view/export · count */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…  ( / )"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-[12.5px] outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div className="relative">
            <button
              ref={filterBtnRef}
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold ring-1 ring-inset transition-colors"
              style={activeFilterCount ? { background: NAVY_TINT, color: NAVY, boxShadow: `inset 0 0 0 1px ${NAVY_RING}` } : { background: "#fff", color: "#475569", boxShadow: "inset 0 0 0 1px #e2e8f0" }}
            >
              <Filter className="h-3.5 w-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: NAVY }}>
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Filter popover — absolute within this component, not a page-level modal */}
            {filtersOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setFiltersOpen(false)} style={{ position: "absolute" }} />
                <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="space-y-3">
                    <div>
                      <label className={LABEL_CLS}>Department</label>
                      <select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))} className={INPUT_CLS}>
                        <option value="">All departments</option>
                        {visibleDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Channel</label>
                      <select value={filters.channel} onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value }))} className={INPUT_CLS}>
                        <option value="">All channels</option>
                        <option value="EMAIL">Email</option>
                        <option value="WHATSAPP">WhatsApp</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between text-[13px] text-slate-600 pt-1">
                      Active only
                      <Toggle checked={filters.activeOnly} onChange={(v) => setFilters((f) => ({ ...f, activeOnly: v }))} />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
                    <button onClick={clearFilters} className="text-[12.5px] font-semibold text-slate-500 hover:text-slate-700">Clear all</button>
                    <button onClick={() => setFiltersOpen(false)} className="h-8 px-3 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: NAVY }}>Done</button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />

          <span className="text-[12.5px] text-slate-400 mr-1">{filtered.length} template{filtered.length === 1 ? "" : "s"}</span>
          <IconBtn icon={allExpanded ? Minimize2 : Maximize2} onClick={() => setExpandedIds(allExpanded ? [] : filtered.map((t) => t.id))} title={allExpanded ? "Collapse all" : "Expand all"} />
          <IconBtn icon={Printer} onClick={() => showToast("Sent to printer")} title="Print" />
          <IconBtn icon={Download} onClick={() => showToast("Exported")} title="Export" />
        </div>

        {/* Grid */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-auto max-h-[52vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="w-10 px-3 py-2.5 text-center bg-slate-50">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="w-6 bg-slate-50"></th>
                {["Template Name", "Department", "Channel", "Trigger", "Subject / Message", "Allowed Users", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider bg-slate-50 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 text-sm">No templates match your search.</td></tr>
              )}
              {filtered.map((t) => {
                const isExpanded = expandedIds.includes(t.id);
                const isSelected = selectedIds.includes(t.id);
                return (
                  <React.Fragment key={t.id}>
                    <tr className="transition-colors hover:bg-slate-50/60" style={isSelected ? { background: NAVY_TINT } : undefined}>
                      <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(t.id)} />
                      </td>
                      <td className="text-center">
                        <button onClick={() => toggleExpand(t.id)} className="text-slate-300 hover:text-slate-500">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-slate-300" />{deptName(t.department)}</span>
                      </td>
                      <td className="px-4 py-2.5"><ChannelBadge channel={t.channel} /></td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Zap className={`h-3 w-3 ${t.trigger === "MANUAL" ? "text-slate-300" : "text-amber-500"}`} />
                          {triggerLabel(t.trigger)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[220px] truncate">{t.subject || t.body}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3 text-slate-300" />
                          {t.allUsers ? "All users" : `${t.allowedUsers.length} Users`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge active={t.active} /></td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => openEdit(t.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                            <div className="space-y-2">
                              {t.subject && (
                                <p><span className="font-semibold text-slate-600">Subject: </span><span className="text-slate-500">{t.subject}</span></p>
                              )}
                              <p className="whitespace-pre-wrap"><span className="font-semibold text-slate-600">Body: </span><span className="text-slate-500">{t.body}</span></p>
                            </div>
                            <div className="space-y-2">
                              <p><span className="font-semibold text-slate-600">Trigger: </span><span className="text-slate-500">{triggerLabel(t.trigger)}</span></p>
                              <p><span className="font-semibold text-slate-600">Attachment: </span><span className="text-slate-500">{attachmentLabel(t.attachment) || "No attachment"}</span></p>
                              <div>
                                <p className="font-semibold text-slate-600 mb-1.5">Allowed Users</p>
                                {t.allUsers ? (
                                  <p className="text-slate-500">All users of {deptName(t.department)}</p>
                                ) : t.allowedUsers.length === 0 ? (
                                  <p className="text-slate-400">No users assigned yet.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.allowedUsers.map((u) => (
                                      <span key={u.id} className="text-xs bg-white ring-1 ring-inset ring-slate-200 rounded-full px-2.5 py-1 text-slate-600">{u.name}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-1 text-[11.5px] text-slate-400">
          <Kbd>N</Kbd> new template <span className="mx-1">·</span> <Kbd>/</Kbd> search
        </div>
      </div>

      {/* ── Template editor — fixed to the viewport (not clipped to this panel's div),
           so it always fits the actual screen and is never cut off by a short panel.
           Responsive: full-screen sheet on mobile, right-side drawer from md up. ── */}
      {editorOpen && draft && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={closeEditor}>
          <div
            className="flex h-full w-full md:w-[min(94vw,1040px)] flex-col overflow-hidden bg-white shadow-2xl md:rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100" style={{ background: NAVY }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={closeEditor} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white md:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="truncate text-[14.5px] font-bold text-white">{editingId ? "Edit Template" : "New Template"}</h3>
                <ChannelBadge channel={draft.channel} />
              </div>
              <button onClick={closeEditor} className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white md:flex">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_380px]">
              {/* LEFT — form */}
              <div className="lg:overflow-y-auto p-5 space-y-4">
                <div>
                  <label className={LABEL_CLS}>Template Name</label>
                  <input type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={INPUT_CLS} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Department</label>
                    <select
                      value={draft.department}
                      disabled={!isAdmin}
                      onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value, allowedUsers: [] }))}
                      className={INPUT_CLS}
                    >
                      {visibleDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Use this template when</label>
                    <select value={draft.trigger} onChange={(e) => setDraft((d) => ({ ...d, trigger: e.target.value }))} className={INPUT_CLS}>
                      {TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLS}>Channel</label>
                  <div className="flex gap-2">
                    {["EMAIL", "WHATSAPP"].map((ch) => {
                      const active = draft.channel === ch;
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => { lastFieldRef.current = "body"; setDraft((d) => ({ ...d, channel: ch })); }}
                          className="h-8 px-3 rounded-lg text-[12.5px] font-semibold inline-flex items-center gap-1.5 ring-1 ring-inset transition-colors"
                          style={active ? { background: NAVY_TINT, color: NAVY, boxShadow: `inset 0 0 0 1px ${NAVY_RING}` } : { background: "#fff", color: "#475569", boxShadow: "inset 0 0 0 1px #e2e8f0" }}
                        >
                          {ch === "EMAIL" ? <Mail className="h-4 w-4" /> : <FaWhatsapp className="h-4 w-4" />}
                          {ch === "EMAIL" ? "Email" : "WhatsApp"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {draft.channel === "EMAIL" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={LABEL_CLS}>Subject</label>
                      <span className={`text-[11px] ${draft.subject.length > SUBJECT_WARN ? "text-amber-600" : "text-slate-400"}`}>
                        {draft.subject.length} chars{draft.subject.length > SUBJECT_WARN ? " — long subjects get cut off in inboxes" : ""}
                      </span>
                    </div>
                    <input
                      ref={subjectRef}
                      type="text"
                      value={draft.subject}
                      onFocus={() => { lastFieldRef.current = "subject"; }}
                      onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                      className={INPUT_CLS}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLS}>Message Body</label>
                    {draft.channel === "WHATSAPP" && (
                      <span className={`text-[11px] ${draft.body.length > WA_LIMIT ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
                        {draft.body.length} / {WA_LIMIT}
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={bodyRef}
                    rows={6}
                    value={draft.body}
                    onFocus={() => { lastFieldRef.current = "body"; }}
                    onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13.5px] text-slate-700 outline-none focus:border-slate-400 resize-y"
                  />
                  {unknown.length > 0 && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Unknown variables will not be filled: {unknown.map((u) => `{{${u}}}`).join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Variable picker */}
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Insert Variable <span className="normal-case font-normal">— goes where the cursor is</span>
                    </span>
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-300 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        value={varSearch}
                        onChange={(e) => setVarSearch(e.target.value)}
                        placeholder="Find variable…"
                        className="h-7 w-36 pl-7 pr-2 rounded-md border border-slate-200 text-[12px] outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {varGroups.length === 0 && <p className="text-[12px] text-slate-400">No variable matches.</p>}
                    {varGroups.map((g) => (
                      <div key={g.module} className="flex flex-wrap items-center gap-1.5">
                        <span className="w-24 shrink-0 text-[11px] font-semibold text-slate-500">{g.module}</span>
                        {g.vars.map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            title={`{{${k}}}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertVar(k)}
                            className="text-xs bg-slate-100 rounded-full px-2.5 py-1 text-slate-600 transition-colors hover:text-white"
                            onMouseEnter={(e) => { e.currentTarget.style.background = NAVY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLS}>Attach Print (Report Studio)</label>
                  <select value={draft.attachment} onChange={(e) => setDraft((d) => ({ ...d, attachment: e.target.value }))} className={INPUT_CLS}>
                    {ATTACHMENTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>

                {/* Allowed users */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Allowed Users — who can send with this template</label>
                  </div>
                  <label className="flex items-center gap-2.5 text-[13px] text-slate-700 mb-3">
                    <Toggle checked={draft.allUsers} onChange={(v) => setDraft((d) => ({ ...d, allUsers: v }))} />
                    All users of {deptName(draft.department)}
                  </label>
                  {!draft.allUsers && (
                    <div className="rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                        <div className="relative flex-1">
                          <Search className="h-3.5 w-3.5 text-slate-300 absolute left-0 top-1/2 -translate-y-1/2" />
                          <input
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search team members…"
                            className="w-full pl-5 text-[13px] outline-none placeholder:text-slate-300"
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{draft.allowedUsers.length} of {deptUsers.length} selected</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto py-1">
                        {shownUsers.length === 0 && <p className="px-3 py-2 text-[12px] text-slate-400">No team members found.</p>}
                        {shownUsers.map((u) => {
                          const checked = draft.allowedUsers.some((x) => x.id === u.id);
                          return (
                            <label key={u.id} className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                              <input type="checkbox" checked={checked} onChange={() => toggleUser(u)} />
                              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: NAVY_TINT, color: NAVY }}>
                                {u.name.split(" ").map((p) => p[0]).join("")}
                              </span>
                              {u.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2.5 text-[13px] text-slate-700 pt-1">
                  <Toggle checked={draft.active} onChange={(v) => setDraft((d) => ({ ...d, active: v }))} />
                  Active
                </label>
              </div>

              {/* RIGHT — live preview */}
              <div className="lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Live Preview</h4>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">Sample data</span>
                </div>

                {draft.channel === "WHATSAPP" ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2.5 text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">RS</span>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">{SAMPLE.contactPerson}</p>
                        <p className="text-[10px] text-white/70">online</p>
                      </div>
                    </div>
                    <div className="min-h-[240px] bg-[#efeae2] p-3">
                      <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5 shadow-sm">
                        {draft.attachment && (
                          <div className="mb-1.5 flex items-center gap-2 rounded bg-white/70 px-2 py-1.5 text-[12px] text-slate-700">
                            <FileText className="h-4 w-4 text-rose-500" /> {attachmentLabel(draft.attachment)}.pdf
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words text-[13px] text-slate-800">
                          {fillSample(draft.body) || <span className="italic text-slate-400">Your message will appear here</span>}
                        </p>
                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                          10:42 <CheckCheck className="h-3 w-3 text-sky-500" />
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 space-y-1 text-[12px]">
                      <p><span className="inline-block w-10 text-slate-400">From</span><span className="text-slate-700">{deptName(draft.department)} Team</span></p>
                      <p><span className="inline-block w-10 text-slate-400">To</span><span className="text-slate-700">{SAMPLE.contactPerson}</span></p>
                      <p className="pt-1.5 text-[14px] font-semibold text-slate-900 break-words">{fillSample(draft.subject) || "(no subject)"}</p>
                    </div>
                    <div className="min-h-[180px] px-4 py-4 text-[13px] text-slate-700 whitespace-pre-wrap break-words">
                      {fillSample(draft.body) || <span className="italic text-slate-400">Your message will appear here</span>}
                    </div>
                    {draft.attachment && (
                      <div className="border-t border-slate-100 px-4 py-3">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600">
                          <Paperclip className="h-3.5 w-3.5 text-slate-400" /> {attachmentLabel(draft.attachment)}.pdf
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-white p-3 text-[12px] space-y-1.5">
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> {triggerLabel(draft.trigger)}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {draft.allUsers ? `All ${deptName(draft.department)} users can send` : `${draft.allowedUsers.length} user(s) can send`}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-white">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400"><Kbd>Ctrl+S</Kbd> save <Kbd>Esc</Kbd> close</span>
              <div className="flex gap-2 ml-auto">
                <button onClick={closeEditor} className="h-8 px-3.5 rounded-lg text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={saveDraft} className="h-8 px-3.5 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: NAVY }}>Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
      {confirmDialog}
    </div>
  );
};

export default TemplateMaster;

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as FaIcons from "react-icons/fa";
import { getHeaderStyle } from "../Utils/QmsValidation";

/* ═══════════════════════════════════════════════════════════════════════
   ERP design tokens — copied from ERPFormBuilder / FormBody so the logbook
   screens look identical to Deviation, CAPA, etc.
   ═══════════════════════════════════════════════════════════════════════ */
export const erp = {
  font: "font-['Segoe_UI',system-ui,Arial,sans-serif]",
  pageBg: "bg-[#eef1f8]",
  // section card + header (FormCard)
  card: "bg-white border border-[#dde1ea] rounded-[6px] shadow-sm",
  cardHead: "px-[14px] py-[7px] flex items-center justify-between border-b rounded-t-[5px]",
  cardTitle: "text-[12.5px] font-bold uppercase tracking-[0.4px]",
  // labels (FormFieldRow)
  label: "text-[#1e293b] font-semibold text-[11px] uppercase tracking-[0.3px] flex items-center mb-[2px]",
  star: "text-[#dc2626] ml-[2px] text-[12px] leading-none",
  // inputs (FormFieldRow -> FieldRenderer className)
  input: "w-full h-[32px] px-[10px] text-[14px] border-[1.5px] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] text-[#0f172a] border-[#c8d2e4] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8] disabled:bg-[#f0f3f8] disabled:text-[#64748b] disabled:border-[#e2e8f4] disabled:cursor-default",
  // dense grid variant of the same input
  gridInput: "w-full h-[30px] px-[8px] text-[13px] border-[1.5px] rounded-[5px] bg-white outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] text-[#0f172a] border-[#b0bed8] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#8a9bc0] disabled:bg-[#f0f3f8] disabled:text-[#94a3b8] disabled:border-[#e2e8f4] disabled:cursor-default",
  // tab bar (FormBody)
  tabBar: "flex items-end gap-[3px] pl-[8px] pr-[14px] pt-[7px] bg-[#e8edf7] border-b border-[#c8d4e8] shrink-0 overflow-x-auto",
  tab: "relative flex items-center gap-[6px] px-[11px] pt-[7px] pb-[6px] min-h-[32px] text-[10.5px] uppercase tracking-[0.3px] font-bold whitespace-nowrap rounded-t-[7px] border border-b-0 transition-all",
  tabOn: "bg-white border-[#c8d4e8] text-[#1a56db] mb-[-1px] pb-[8px] z-10",
  tabOff: "bg-[#f4f7fc] border-transparent text-[#5b6b85] hover:bg-[#fbfcfe] hover:text-[#1e293b]",
  // table (dense ERP grid)
  th: "text-left px-[10px] py-[7px] text-[11px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] bg-[#f4f7fc] border-b border-[#dde1ea] whitespace-nowrap",
  td: "px-[10px] py-[6px] text-[13px] text-[#0f172a] border-b border-[#eef1f8] align-top",
  // buttons (header actions in ERPFormBuilder)
  btn: "inline-flex items-center gap-[6px] h-[32px] px-[12px] text-[12.5px] font-semibold rounded-[5px] border-[1.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  btnPrimary: "bg-[#1a56db] border-[#1a56db] text-white hover:bg-[#1648b8]",
  btnGhost: "bg-white border-[#c8d2e4] text-[#1e293b] hover:bg-[#f4f7fc] hover:border-[#a0b0c8]",
  btnDanger: "bg-white border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2]",
  kbd: "px-[5px] py-[1px] text-[10px] font-semibold rounded-[3px] border border-[#c8d4e8] bg-white text-[#5b6b85]",
  pill: "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
};

export const Btn = ({ kind = "ghost", className = "", ...p }) => (
  <button type="button" className={`${erp.btn} ${kind === "primary" ? erp.btnPrimary : kind === "danger" ? erp.btnDanger : erp.btnGhost} ${className}`} {...p} />
);
export const Kbd = ({ children }) => <kbd className={erp.kbd}>{children}</kbd>;

/* ── search box — same look as the Table header "Search…(Alt+F)" ────────── */
export function SearchBox({ value, onChange, placeholder = "Search…", hotkey = "Alt+F", className = "", autoFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!hotkey) return;
    const h = (e) => { if (e.altKey && e.key.toLowerCase() === "f") { e.preventDefault(); ref.current?.focus(); ref.current?.select(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [hotkey]);
  return (
    <div className={`relative ${className}`}>
      <FaIcons.FaSearch size={11} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#8b9ab5] pointer-events-none" />
      <input ref={ref} autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={`${placeholder}${hotkey ? ` (${hotkey})` : ""}`}
        className={`${erp.input} !pl-[28px] !pr-[26px] !h-[30px] !text-[13px]`} />
      {value && <button type="button" onClick={() => onChange("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#8b9ab5] hover:text-[#dc2626]" title="Clear"><FaIcons.FaTimes size={10} /></button>}
    </div>
  );
}

/* ── status pills (same palette as FormCard access badges) ──────────────── */
const PILL = {
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-[#1a56db]",
  gray: "bg-slate-100 text-slate-500",
};
export function Pill({ tone = "gray", children, title }) {
  return <span title={title} className={`${erp.pill} ${PILL[tone] || PILL.gray}`}>{children}</span>;
}
/** Template lifecycle tone (Draft / InReview / Effective / Superseded / Retired) */
export const templateTone = (s) => ({ Effective: "green", Draft: "amber", InReview: "blue", Retired: "red" }[s] || "gray");
export const statusTone = (s) => (s === "Verified" || s === "Recorded" || s === "Active" ? "green" : s === "Entered" ? "amber" : s === "Cancelled" ? "red" : "gray");

/* ── section card with the same header bar as FormCard ──────────────────── */
export function Section({ title, right, children, className = "", bodyClass = "p-[14px]" }) {
  const hs = getHeaderStyle(title);
  return (
    <div className={`${erp.card} flex flex-col ${className}`}>
      <div className={`${erp.cardHead} ${hs.border} ${hs.barBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${hs.iconBg}`}>{hs.icon}</div>
          <h3 className={`${erp.cardTitle} ${hs.text}`}>{title}</h3>
        </div>
        {right}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

/* ── field wrapper: ERP label + required star ───────────────────────────── */
export function Field({ label, required, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-[3px] ${className}`}>
      <label className={erp.label}>{label}{required && <span className={erp.star}>*</span>}</label>
      {children}
    </div>
  );
}

/* ── Enter → next field (same behaviour as useFieldNavigation, but no ERPFormProvider needed) ── */
export function useEnterNavigation() {
  return useCallback((e) => {
    if (e.key !== "Enter" || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const el = e.target;
    if (!el || el.tagName === "TEXTAREA" || el.tagName === "BUTTON") return;
    const root = e.currentTarget;
    const list = Array.from(root.querySelectorAll("input, select, textarea")).filter((x) => !x.disabled && x.type !== "hidden" && x.tabIndex !== -1);
    const i = list.indexOf(el);
    if (i >= 0 && i < list.length - 1) { e.preventDefault(); list[i + 1].focus(); list[i + 1].select?.(); }
  }, []);
}

/* ── formatting ─────────────────────────────────────────────────────────── */
export const fmtDate = (v) => { if (!v) return "—"; const [y, m, d] = String(v).slice(0, 10).split("-"); return d ? `${d}-${m}-${y}` : "—"; };
export const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v); if (Number.isNaN(d.getTime())) return "—";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
/** "13:05" -> "01:05 PM" (grid display only; inputs stay HH:mm) */
export const fmtTime = (v) => {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(v || "").trim());
  if (!m) return v || "";
  const h = Number(m[1]); const ap = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${m[2]} ${ap}`;
};
/** Entry number shown in the register: LB-2026-0001/007 */
export const entryNo = (recordNo, seq) => `${recordNo}/${String(seq).padStart(3, "0")}`;
/** Client-side mirror of backend validateEntry(): returns { [key]: message } for visible columns */
export const validateDraft = (cols, draft) => {
  const err = {};
  cols.forEach((c) => {
    if (c.type === "duration" || !isVisible(c, draft)) return;   // duration is calculated by the server
    const v = String(draft[c.key] ?? "").trim();
    if (!v) { if (c.required) err[c.key] = `${c.label} is required`; return; }
    if (c.type === "number" && Number.isNaN(Number(v))) err[c.key] = `${c.label} must be a number`;
    if (c.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) err[c.key] = `${c.label} must be a valid time`;
    if (c.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) err[c.key] = `${c.label} must be a valid date`;
  });
  // "must not be before": explicit afterField on the column, plus the legacy StartTime/EndTime & InTime/OutTime pairs
  // (same rule as backend validateEntry)
  const pairs = cols.filter((c) => c.afterField).map((c) => [c.afterField, c.key]);
  [["StartTime", "EndTime"], ["InTime", "OutTime"]].forEach(([a, b]) => {
    const cb = cols.find((c) => c.key === b);
    if (cb && !cb.afterField && cols.some((c) => c.key === a)) pairs.push([a, b]);
  });
  pairs.forEach(([a, b]) => {
    const va = draft[a], vb = draft[b];
    if (va && vb && !err[a] && !err[b] && isVisible(cols.find((c) => c.key === b) || {}, draft) && vb < va) err[b] = `${cols.find((c) => c.key === b)?.label || b} cannot be before ${cols.find((c) => c.key === a)?.label || a}`;
  });
  return err;
};

export const initials = (name) => String(name || "").split(/[\s/]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

/** Mirrors backend isVisible() */
export const isVisible = (col, data) => {
  const s = col.showIf; if (!s || !s.field) return true;
  const v = String(data?.[s.field] ?? "").trim();
  if (s.equals != null) return v === String(s.equals);
  if (s.notEquals != null) return v !== String(s.notEquals);
  return true;
};

export function SignBadge({ name, at }) {
  if (!name) return <span className="text-[#cbd5e1]">—</span>;
  return (
    <span className="inline-flex items-center gap-[6px] whitespace-nowrap">
      <span className="w-[20px] h-[20px] rounded-full bg-[#1a56db] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{initials(name)}</span>
      <span className="leading-tight">
        <span className="block text-[12.5px] text-[#0f172a] font-medium">{name}</span>
        {at && <span className="block text-[10.5px] text-[#64748b]">{fmtDateTime(at)}</span>}
      </span>
    </span>
  );
}

/* ── modal shell — header styled like a FormCard bar ────────────────────── */
export function Modal({ title, subtitle, icon: Icon = FaIcons.FaBook, width = "max-w-2xl", onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose?.(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className={`fixed inset-0 z-[60] flex items-start justify-center bg-[#0f172a]/45 p-4 overflow-y-auto ${erp.font}`}>
      <div className={`w-full ${width} my-6 bg-white rounded-[8px] shadow-2xl border border-[#c8d4e8] overflow-hidden`}>
        <div className="flex items-center gap-3 px-[16px] py-[10px] bg-[#e8edf7] border-b border-[#c8d4e8]">
          <span className="w-[30px] h-[30px] rounded-[5px] bg-white border border-[#c8d4e8] flex items-center justify-center shrink-0"><Icon size={14} className="text-[#1a56db]" /></span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold uppercase tracking-[0.4px] text-[#1e293b]">{title}</div>
            {subtitle && <div className="text-[11.5px] text-[#5b6b85]">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="ml-auto text-[#5b6b85] hover:text-[#dc2626]" aria-label="Close" title="Close (Esc)"><FaIcons.FaTimes size={15} /></button>
        </div>
        <div className={`px-[16px] py-[14px] ${erp.pageBg}`}>{children}</div>
        {footer && <div className="flex items-center gap-2.5 px-[16px] py-[10px] border-t border-[#dde1ea] bg-white">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── print preview — paper-logbook layout inside a modal, prints from the iframe ─ */
export function PrintPreview({ html, title, onClose }) {
  const ref = useRef(null);
  const doPrint = () => { const w = ref.current?.contentWindow; if (w) { w.focus(); w.print(); } };
  return (
    <Modal title="Print Preview" subtitle={title} icon={FaIcons.FaPrint} width="max-w-6xl w-[96vw]" onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[#5b6b85]">A4 landscape · cancelled entries are printed with a strike-through.</span>
        <div className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Close <Kbd>Esc</Kbd></Btn>
          <Btn kind="primary" onClick={doPrint}><FaIcons.FaPrint size={11} /> Print <Kbd>Ctrl+P</Kbd></Btn>
        </div>
      </>}>
      <iframe ref={ref} title="print-preview" srcDoc={html} className="w-full h-[68vh] bg-white border border-[#dde1ea] rounded-[5px]" />
    </Modal>
  );
}
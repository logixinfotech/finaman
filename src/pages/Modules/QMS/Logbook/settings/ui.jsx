import { useEffect, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { TYPE_META } from "./model";

/* ═══════════════════════════════════════════════════════════════════════
   Logbook settings — design system
   Font   : Segoe UI everywhere
   Sizes  : page title 18 · card title 14 · body 13 · label 12 · helper 12 · caption 11
   Colour : one accent (#1a56db), neutral greys, status colours only for status
   Shapes : 8px cards, 6px controls, 1px #e5e7eb borders, no gradients
   ═══════════════════════════════════════════════════════════════════════ */

export const FONT = "font-['Segoe_UI',system-ui,Arial,sans-serif]";
export const C = { accent: "#1a56db", border: "#e5e7eb", page: "#f5f6f8", text: "#111827", sub: "#4b5563", muted: "#6b7280" };

const ctl = "w-full rounded-[6px] border border-[#d1d5db] bg-white text-[13px] text-[#111827] outline-none transition-colors placeholder:text-[#9ca3af] hover:border-[#9ca3af] focus:border-[#1a56db] focus:ring-[3px] focus:ring-[#1a56db]/15 disabled:bg-[#f9fafb] disabled:text-[#6b7280] disabled:border-[#e5e7eb] disabled:cursor-default";
export const inp = `${ctl} h-[34px] px-[10px]`;
export const inpSm = `${ctl} h-[30px] px-[8px]`;
export const area = `${ctl} px-[10px] py-[7px] leading-snug`;

/* ── text ── */
export const Label = ({ children, required, hint }) => (
  <div className="flex items-center gap-1 mb-[5px] text-[12px] font-semibold text-[#374151]">
    {children}{required && <span className="text-[#dc2626]">*</span>}
    {hint && <span title={hint} className="text-[#9ca3af] cursor-help"><FaIcons.FaInfoCircle size={10} /></span>}
  </div>
);
export const Hint = ({ children }) => <div className="mt-[5px] text-[12px] leading-snug text-[#6b7280]">{children}</div>;
export const FieldBox = ({ label, required, hint, children, className = "" }) => (
  <div className={className}><Label required={required} hint={hint}>{label}</Label>{children}</div>
);

/* ── buttons ── */
export function Button({ kind = "secondary", size = "md", icon: I, children, className = "", ...p }) {
  const k = {
    primary: "bg-[#1a56db] border-[#1a56db] text-white hover:bg-[#1748b8] hover:border-[#1748b8]",
    secondary: "bg-white border-[#d1d5db] text-[#111827] hover:bg-[#f9fafb] hover:border-[#9ca3af]",
    danger: "bg-white border-[#fca5a5] text-[#b91c1c] hover:bg-[#fef2f2]",
    success: "bg-[#047857] border-[#047857] text-white hover:bg-[#065f46]",
    ghost: "bg-transparent border-transparent text-[#374151] hover:bg-[#f3f4f6]",
  }[kind];
  return (
    <button type="button" className={`inline-flex items-center justify-center gap-[7px] rounded-[6px] border font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${size === "sm" ? "h-[28px] px-[10px] text-[12px]" : "h-[34px] px-[14px] text-[13px]"} ${k} ${className}`} {...p}>
      {I && <I size={size === "sm" ? 10 : 11} />}{children}
    </button>
  );
}
export const IconBtn = ({ icon: I, title, onClick, disabled, active, size = 30 }) => (
  <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
    className={`inline-flex items-center justify-center rounded-[6px] transition-colors disabled:opacity-35 ${active ? "bg-[#eff6ff] text-[#1a56db]" : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"}`}
    style={{ width: size, height: size }}><I size={12} /></button>
);

/** Dropdown menu: items = [{ label, icon, onClick, danger, disabled, divider }] */
export function Menu({ label = "More", icon = FaIcons.FaEllipsisH, items, align = "right", kind = "secondary" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  const list = items.filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="relative" ref={ref}>
      <Button kind={kind} icon={icon} onClick={() => setOpen((o) => !o)}>{label}</Button>
      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 min-w-[230px] py-1 rounded-[8px] bg-white border border-[#e5e7eb] shadow-[0_10px_30px_rgba(15,23,42,0.14)] z-40`}>
          {list.map((it, i) => it.divider ? <div key={i} className="my-1 h-px bg-[#f3f4f6]" /> : (
            <button key={i} type="button" disabled={it.disabled} onClick={() => { setOpen(false); it.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3 h-[34px] text-left text-[13px] disabled:opacity-40 ${it.danger ? "text-[#b91c1c] hover:bg-[#fef2f2]" : "text-[#111827] hover:bg-[#f9fafb]"}`}>
              {it.icon && <it.icon size={12} className={it.danger ? "" : "text-[#6b7280]"} />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── surfaces ── */
export const Card = ({ title, desc, right, children, bodyClass = "p-5", className = "" }) => (
  <section className={`bg-white border border-[#e5e7eb] rounded-[8px] ${className}`}>
    {(title || right) && (
      <header className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[#f3f4f6]">
        <div className="min-w-0">
          {title && <h3 className="text-[14px] font-semibold text-[#111827]">{title}</h3>}
          {desc && <p className="mt-[2px] text-[12px] text-[#6b7280] leading-snug">{desc}</p>}
        </div>
        {right && <div className="ml-auto flex items-center gap-2 shrink-0">{right}</div>}
      </header>
    )}
    <div className={bodyClass}>{children}</div>
  </section>
);
export const Section = Card;   // older name

/** Settings row: title + explanation on the left, control on the right */
export const SettingRow = ({ title, desc, required, children, last }) => (
  <div className={`grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-8 gap-y-2 py-4 ${last ? "" : "border-b border-[#f3f4f6]"}`}>
    <div>
      <div className="text-[13px] font-semibold text-[#111827]">{title}{required && <span className="text-[#dc2626]"> *</span>}</div>
      {desc && <div className="mt-[2px] text-[12px] leading-snug text-[#6b7280]">{desc}</div>}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);

/** Collapsible block used inside side panels */
export function Accordion({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#f3f4f6] last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 h-[40px] text-left hover:bg-[#f9fafb]">
        <FaIcons.FaChevronRight size={9} className={`text-[#9ca3af] transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="text-[13px] font-semibold text-[#111827]">{title}</span>
        {count != null && <span className="ml-auto text-[12px] text-[#9ca3af]">{count}</span>}
      </button>
      {open && <div className="px-4 pb-4 pt-1 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

/** Underline tabs */
export const Tabs = ({ tabs, value, onChange }) => (
  <nav className="flex items-end gap-1 overflow-x-auto -mb-px">
    {tabs.map((t) => {
      const on = value === t.k;
      return (
        <button key={t.k} type="button" onClick={() => onChange(t.k)}
          className={`relative flex items-center gap-2 h-[42px] px-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${on ? "border-[#1a56db] text-[#1a56db]" : "border-transparent text-[#6b7280] hover:text-[#111827] hover:border-[#d1d5db]"}`}>
          {t.i && <t.i size={12} />}{t.l}
          {t.n != null && t.n !== "" && <span className={`min-w-[20px] h-[18px] px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${on ? "bg-[#dbeafe] text-[#1a56db]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>{t.n}</span>}
          {t.dot && <span className={`w-[7px] h-[7px] rounded-full ${t.dot}`} />}
        </button>
      );
    })}
  </nav>
);

/* ── small parts ── */
export const Toggle = ({ checked, onChange, disabled, label, hint, small }) => (
  <button type="button" role="switch" aria-checked={!!checked} disabled={disabled} onClick={() => onChange(!checked)}
    className="flex items-start gap-2.5 text-left w-full disabled:opacity-55 disabled:cursor-default">
    <span className={`mt-[1px] ${small ? "w-[30px] h-[17px]" : "w-[36px] h-[20px]"} rounded-full relative transition-colors shrink-0 ${checked ? "bg-[#1a56db]" : "bg-[#d1d5db]"}`}>
      <span className={`absolute top-[2px] ${small ? "w-[13px] h-[13px]" : "w-[16px] h-[16px]"} rounded-full bg-white shadow-sm transition-all ${checked ? (small ? "left-[15px]" : "left-[18px]") : "left-[2px]"}`} />
    </span>
    {(label || hint) && <span className="min-w-0"><span className="block text-[13px] text-[#111827] leading-[18px]">{label}</span>{hint && <span className="block mt-[1px] text-[12px] text-[#6b7280] leading-snug">{hint}</span>}</span>}
  </button>
);
export const Check = ({ checked, onChange, label, disabled, extra }) => (
  <label className={`flex items-center gap-2.5 h-[30px] px-2 rounded-[6px] text-[13px] text-[#111827] ${disabled ? "opacity-55" : "cursor-pointer hover:bg-[#f9fafb]"}`}>
    <input type="checkbox" className="w-[15px] h-[15px] accent-[#1a56db]" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <span className="flex-1 truncate">{label}</span>{extra}
  </label>
);

export const Seg = ({ value, options, onChange, disabled }) => (
  <div className="inline-flex p-[3px] rounded-[7px] bg-[#f3f4f6]">
    {options.map((o) => (
      <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
        className={`px-3 h-[26px] rounded-[5px] text-[12px] font-semibold transition-colors disabled:cursor-default ${value === o.v ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}>{o.l}</button>
    ))}
  </div>
);

export const TypeIcon = ({ type, size = 26 }) => {
  const m = TYPE_META[type] || TYPE_META.text; const I = m.icon;
  return <span className="rounded-[6px] bg-[#f3f4f6] flex items-center justify-center shrink-0" style={{ width: size, height: size, color: m.color }}><I size={Math.round(size * 0.44)} /></span>;
};

export const Badge = ({ children, tone = "gray", title }) => {
  const c = { gray: "bg-[#f3f4f6] text-[#4b5563]", blue: "bg-[#eff6ff] text-[#1d4ed8]", amber: "bg-[#fffbeb] text-[#b45309]", green: "bg-[#ecfdf5] text-[#047857]", red: "bg-[#fef2f2] text-[#b91c1c]", outline: "bg-white text-[#4b5563] ring-1 ring-inset ring-[#e5e7eb]" }[tone];
  return <span title={title} className={`inline-flex items-center gap-1 px-[8px] h-[20px] rounded-[10px] text-[11px] font-semibold whitespace-nowrap ${c}`}>{children}</span>;
};
export const StatusDot = ({ tone = "gray", title }) => {
  const c = { gray: "bg-[#9ca3af]", green: "bg-[#10b981]", amber: "bg-[#f59e0b]", blue: "bg-[#3b82f6]", red: "bg-[#ef4444]" }[tone];
  return <span title={title} className={`inline-block w-[8px] h-[8px] rounded-full ${c}`} />;
};
export const Empty = ({ icon: I = FaIcons.FaInbox, title, children }) => (
  <div className="py-10 px-6 text-center">
    <span className="mx-auto mb-3 w-[40px] h-[40px] rounded-full bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center"><I size={15} /></span>
    <div className="text-[13px] font-semibold text-[#374151]">{title}</div>
    {children && <div className="mt-1 text-[12px] text-[#6b7280]">{children}</div>}
  </div>
);
export function Notice({ tone = "blue", icon: I, children, action }) {
  const c = { blue: "bg-[#eff6ff] border-[#bfdbfe] text-[#1e3a8a]", amber: "bg-[#fffbeb] border-[#fde68a] text-[#78350f]", red: "bg-[#fef2f2] border-[#fecaca] text-[#7f1d1d]", gray: "bg-white border-[#e5e7eb] text-[#374151]", green: "bg-[#ecfdf5] border-[#a7f3d0] text-[#064e3b]" }[tone];
  const Ic = I || { blue: FaIcons.FaInfoCircle, amber: FaIcons.FaExclamationTriangle, red: FaIcons.FaBan, gray: FaIcons.FaLock, green: FaIcons.FaCheckCircle }[tone];
  return <div className={`flex flex-wrap items-center gap-3 px-4 py-[10px] border rounded-[8px] text-[13px] ${c}`}><Ic size={13} className="shrink-0 opacity-80" /><span className="flex-1 min-w-[220px] leading-snug">{children}</span>{action}</div>;
}

export function ChipsEditor({ value, onChange, disabled }) {
  const [t, setT] = useState("");
  const add = (raw) => { const parts = String(raw).split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (!parts.length) return; onChange([...new Set([...value, ...parts])]); setT(""); };
  return (
    <div className={`rounded-[6px] border border-[#d1d5db] bg-white p-1.5 ${disabled ? "bg-[#f9fafb]" : ""}`}>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((o) => (
          <span key={o} className="inline-flex items-center gap-1 pl-2 pr-1.5 h-[24px] rounded-[5px] bg-[#f3f4f6] text-[#111827] text-[12px]">{o}
            {!disabled && <button type="button" title="Remove" onClick={() => onChange(value.filter((x) => x !== o))} className="text-[#9ca3af] hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
          </span>
        ))}
        {!value.length && <span className="text-[12px] text-[#9ca3af] px-1 h-[24px] flex items-center">No options yet</span>}
      </div>
      {!disabled && <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Type an option and press Enter" className={`${inpSm} !border-0 !ring-0 !px-1`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} onBlur={() => add(t)}
        onPaste={(e) => { const x = e.clipboardData.getData("text"); if (/[,\n]/.test(x)) { e.preventDefault(); add(x); } }} />}
    </div>
  );
}

export function RolePicker({ value, options, onChange, disabled, emptyText = "Any logged-in user" }) {
  const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
  const list = options.filter((o) => o.role.toLowerCase().includes(q.toLowerCase()));
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className={`rounded-[6px] border border-[#d1d5db] bg-white ${disabled ? "bg-[#f9fafb] opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 min-h-[34px]">
        {value.length === 0 && <span className="text-[13px] text-[#6b7280] px-1">{emptyText}</span>}
        {value.map((r) => {
          const c = options.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
          return (
            <span key={r} title={`${c} active user(s)`} className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 h-[24px] rounded-[5px] text-[12px] ${c === 0 && options.length ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#f3f4f6] text-[#111827]"}`}>
              {r}<span className="text-[11px] opacity-60">{c}</span>
              {!disabled && <button type="button" title="Remove" onClick={() => toggle(r)} className="text-[#9ca3af] hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
            </span>
          );
        })}
        {!disabled && <button type="button" onClick={() => setOpen((o) => !o)} className="ml-auto h-[24px] px-2 rounded-[5px] text-[12px] font-semibold text-[#1a56db] hover:bg-[#eff6ff]">{open ? "Done" : "+ Add"}</button>}
      </div>
      {open && !disabled && (
        <div className="border-t border-[#f3f4f6] p-1.5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user group…" className={inpSm} autoFocus />
          <div className="max-h-[150px] overflow-y-auto mt-1">
            {list.map((o) => (
              <label key={o.role} className="flex items-center gap-2 px-2 h-[30px] rounded-[5px] text-[13px] hover:bg-[#f9fafb] cursor-pointer">
                <input type="checkbox" className="w-[14px] h-[14px] accent-[#1a56db]" checked={value.includes(o.role)} onChange={() => toggle(o.role)} />
                <span className="flex-1 truncate">{o.role}</span><span className={`text-[11px] ${o.userCount ? "text-[#9ca3af]" : "text-[#dc2626]"}`}>{o.userCount} users</span>
              </label>
            ))}
            {list.length === 0 && <div className="text-[12px] text-[#9ca3af] px-2 py-2">No user group found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

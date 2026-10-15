import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { erp } from "../LogbookUi";
import { TYPE_META, SRC_LABEL } from "./model";

/* Small building blocks shared by the template designer screens */

export const inputS = `${erp.input} !h-[30px] !text-[13px] !px-[8px]`;
export const MiniLabel = ({ children }) => <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">{children}</div>;

export const Panel = ({ title, icon: Icon, right, children, bodyClass = "p-3.5", className = "" }) => (
  <div className={`${erp.card} overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-3.5 py-2 border-b border-[#e3e9f4] bg-[#f4f7fc]">
      {Icon && <span className="w-[22px] h-[22px] rounded-[5px] bg-[#e8edf7] text-[#1a56db] flex items-center justify-center shrink-0"><Icon size={11} /></span>}
      <h3 className="text-[12px] font-bold uppercase tracking-[0.4px] text-[#1e293b]">{title}</h3>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
    <div className={bodyClass}>{children}</div>
  </div>
);

export const TypeChip = ({ type, size = 22 }) => {
  const m = TYPE_META[type] || TYPE_META.text; const I = m.icon;
  return <span className="rounded-[5px] flex items-center justify-center shrink-0" style={{ width: size, height: size, color: m.color, background: `${m.color}1f` }}><I size={size * 0.46} /></span>;
};

export const Toggle = ({ checked, onChange, disabled, label, hint }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left w-full disabled:opacity-60 disabled:cursor-default">
    <span className={`mt-0.5 w-9 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-[#1a56db]" : "bg-[#cbd5e1]"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </span>
    <span><span className="block text-[13px] font-semibold text-[#1e293b]">{label}</span>{hint && <span className="block text-[11.5px] text-[#5b6b85] leading-snug">{hint}</span>}</span>
  </button>
);

export const Seg = ({ value, options, onChange, disabled }) => (
  <div className="inline-flex rounded-[5px] border-[1.5px] border-[#c8d2e4] overflow-hidden bg-white">
    {options.map((o) => (
      <button key={o.v} type="button" disabled={disabled} onClick={() => onChange(o.v)}
        className={`px-2.5 h-[26px] text-[11.5px] font-semibold border-r border-[#e3e9f4] last:border-0 disabled:cursor-default ${value === o.v ? "bg-[#1a56db] text-white" : "text-[#475569] hover:bg-[#f4f7fc]"}`}>{o.l}</button>
    ))}
  </div>
);

export function ChipsEditor({ value, onChange, disabled }) {
  const [t, setT] = useState("");
  const add = (raw) => { const parts = String(raw).split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (!parts.length) return; onChange([...new Set([...value, ...parts])]); setT(""); };
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] p-1.5">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((o, i) => (
          <span key={o} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b21b6] text-[11.5px] font-medium">
            {!disabled && i > 0 && <button type="button" title="Move left" onClick={() => move(i, -1)} className="opacity-50 hover:opacity-100"><FaIcons.FaAngleLeft size={9} /></button>}
            {o}
            {!disabled && <button type="button" onClick={() => onChange(value.filter((x) => x !== o))} className="hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
          </span>
        ))}
        {!value.length && <span className="text-[11.5px] text-[#94a3b8] px-1">No options yet</span>}
      </div>
      {!disabled && <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Type option, press Enter (or paste a list)" className={inputS}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} onBlur={() => add(t)}
        onPaste={(e) => { const x = e.clipboardData.getData("text"); if (/[,\n]/.test(x)) { e.preventDefault(); add(x); } }} />}
    </div>
  );
}

export function RolePicker({ value, options, onChange, disabled, emptyText = "Any logged-in user" }) {
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.role.toLowerCase().includes(q.toLowerCase()));
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className={`border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] p-2 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
        {value.length === 0 && <span className="text-[12px] text-[#94a3b8]">{emptyText}</span>}
        {value.map((r) => {
          const c = options.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
          return (
            <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${c === 0 ? "border-red-300 bg-red-50 text-red-700" : "border-[#c8d2e4] bg-white text-[#1e293b]"}`}>
              {r} <span className="text-[10px] opacity-70" title="Active users">{c}</span>
              {!disabled && <button type="button" onClick={() => toggle(r)} className="ml-0.5 text-[#94a3b8] hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
            </span>
          );
        })}
      </div>
      {!disabled && (<>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user group…" className={inputS} />
        <div className="max-h-28 overflow-y-auto mt-1">
          {list.map((o) => (
            <button key={o.role} type="button" onClick={() => toggle(o.role)} className="w-full flex items-center gap-2 px-1.5 py-1 text-left text-[12.5px] hover:bg-[#f4f7fc]">
              <span className={`w-3 h-3 rounded border ${value.includes(o.role) ? "bg-[#1a56db] border-[#1a56db]" : "border-[#c8d2e4]"}`} />
              <span className="flex-1 truncate">{o.role}</span><span className={`text-[10px] ${o.userCount ? "text-[#94a3b8]" : "text-[#dc2626] font-semibold"}`}>{o.userCount}</span>
            </button>
          ))}
          {list.length === 0 && <div className="text-[12px] text-[#94a3b8] px-1.5 py-2">No user group found</div>}
        </div>
      </>)}
    </div>
  );
}

/** Greyed-out stand-in for an input, used on the design canvas */
export function Faux({ c }) {
  const base = "h-[26px] rounded-[4px] border border-[#e2e8f4] bg-[#f6f8fc] px-2 flex items-center justify-between gap-2 text-[11.5px] text-[#94a3b8] overflow-hidden whitespace-nowrap";
  if (c.type === "textarea") return <div className={`${base} !h-[46px] !items-start pt-1`}>Long text…</div>;
  if (c.type === "select") return <div className={base}><span className="truncate">{c.source ? `${SRC_LABEL[c.source] || c.source} master list` : (c.options || []).slice(0, 3).join(" · ") || "No options"}</span><FaIcons.FaChevronDown size={8} /></div>;
  if (c.type === "time") return <div className={base}><span>HH:mm</span><FaIcons.FaClock size={9} /></div>;
  if (c.type === "date") return <div className={base}><span>dd-mm-yyyy</span><FaIcons.FaCalendarAlt size={9} /></div>;
  if (c.type === "number") return <div className={base}><span>0.00</span>{c.unit && <span className="font-semibold text-[#64748b]">{c.unit}</span>}</div>;
  return <div className={base}>Text…</div>;
}
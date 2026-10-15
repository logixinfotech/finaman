import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { NEW_KEY, CAT_ICON } from "./model";
import { StatusDot, IconBtn } from "./ui";

/* ═══════════════════════════════════════════════════════════════════════
   Template navigator (left). Not a table: grouped list like any settings screen.
   Collapses to a slim rail so the form builder gets the full width.
   ═══════════════════════════════════════════════════════════════════════ */

const stateOf = (t, unsaved) => {
  if (unsaved) return { tone: "amber", l: "Unsaved changes" };
  if (t.key === NEW_KEY) return { tone: "amber", l: "New — not saved" };
  if (t.isRetired) return { tone: "red", l: "Retired" };
  if (t.pending?.status === "InReview") return { tone: "blue", l: `v${t.pending.versionNo} awaiting approval` };
  if (t.pending?.status === "Draft" || t.effective === false) return { tone: "amber", l: `Draft v${t.pending?.versionNo ?? 1}` };
  return { tone: "green", l: "Live" };
};
const FILTERS = [["all", "All"], ["company", "Company"], ["standard", "Standard"], ["changes", "In change"], ["retired", "Retired"]];

function Item({ t, active, unsaved, onPick }) {
  const I = CAT_ICON[t.category] || FaIcons.FaClipboardList;
  const st = stateOf(t, unsaved);
  const ver = t.key === NEW_KEY || t.effective === false ? "new" : `v${t.currentVersion ?? t.revision ?? 1}`;
  return (
    <button type="button" onClick={() => onPick(t.key)} title={st.l}
      className={`relative w-full flex items-center gap-3 pl-4 pr-3 py-[9px] text-left transition-colors ${active ? "bg-[#eff6ff]" : "hover:bg-[#f9fafb]"}`}>
      {active && <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r bg-[#1a56db]" />}
      <span className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 ${active ? "bg-white text-[#1a56db] ring-1 ring-[#bfdbfe]" : "bg-[#f3f4f6] text-[#6b7280]"}`}><I size={12} /></span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-semibold truncate ${active ? "text-[#1a56db]" : "text-[#111827]"}`}>{t.key === NEW_KEY ? t.name || "New template" : t.name}</span>
        <span className="block text-[12px] text-[#6b7280] truncate">{t.category} · {(t.columns || []).length} fields{(t.rules || []).length ? ` · ${t.rules.length} rules` : ""}</span>
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[11px] font-semibold text-[#6b7280]">{ver}</span>
        <StatusDot tone={st.tone} title={st.l} />
      </span>
    </button>
  );
}

const Group = ({ title, n }) => <div className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#9ca3af]">{title} <span className="font-normal">({n})</span></div>;

export default function TemplateSidebar({ types, selKey, newItem, unsavedKey, collapsed, onToggle, onPick }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const groups = useMemo(() => {
    const m = (t) => (!q.trim() || `${t.name} ${t.category} ${t.refType} ${t.docNo || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
      && (f === "all" || (f === "company" && t.isCustom) || (f === "standard" && !t.isCustom) || (f === "changes" && !!t.pending) || (f === "retired" && t.isRetired));
    const list = types.filter(m);
    return [
      ["Awaiting approval", list.filter((t) => t.pending?.status === "InReview")],
      ["Company templates", list.filter((t) => t.isCustom && t.pending?.status !== "InReview")],
      ["Standard templates", list.filter((t) => !t.isCustom && t.pending?.status !== "InReview")],
    ].filter(([, l]) => l.length);
  }, [types, q, f]);
  const total = groups.reduce((a, [, l]) => a + l.length, 0);

  if (collapsed) {
    return (
      <aside className="w-[56px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col items-center py-2 gap-1 overflow-y-auto">
        <IconBtn icon={FaIcons.FaAngleDoubleRight} title="Show templates" onClick={onToggle} size={34} />
        <div className="w-6 h-px bg-[#e5e7eb] my-1" />
        {[...(newItem ? [newItem] : []), ...types].map((t) => {
          const I = CAT_ICON[t.category] || FaIcons.FaClipboardList; const on = t.key === selKey;
          return (
            <button key={t.key} type="button" title={t.name || "New template"} onClick={() => onPick(t.key)}
              className={`relative w-[34px] h-[34px] shrink-0 rounded-[7px] flex items-center justify-center ${on ? "bg-[#eff6ff] text-[#1a56db] ring-1 ring-[#bfdbfe]" : "text-[#6b7280] hover:bg-[#f3f4f6]"}`}>
              <I size={12} /><span className="absolute top-[3px] right-[3px]"><StatusDot tone={stateOf(t, unsavedKey === t.key).tone} /></span>
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-[290px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6]">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[14px] font-semibold text-[#111827]">Templates</h2>
          <span className="text-[12px] text-[#9ca3af]">{types.length}</span>
          <select value={f} onChange={(e) => setF(e.target.value)} title="Filter" className="ml-auto h-[28px] pl-2 pr-1 rounded-[6px] border border-[#e5e7eb] bg-white text-[12px] text-[#374151] outline-none focus:border-[#1a56db]">
            {FILTERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <IconBtn icon={FaIcons.FaAngleDoubleLeft} title="Hide list" onClick={onToggle} />
        </div>
        <div className="relative">
          <FaIcons.FaSearch size={11} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates"
            className="w-full h-[32px] pl-[30px] pr-[28px] rounded-[6px] border border-[#d1d5db] bg-white text-[13px] outline-none placeholder:text-[#9ca3af] focus:border-[#1a56db] focus:ring-[3px] focus:ring-[#1a56db]/15" />
          {q && <button type="button" title="Clear" onClick={() => setQ("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827]"><FaIcons.FaTimes size={10} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-3">
        {newItem && <><Group title="New" n={1} /><Item t={newItem} active={selKey === NEW_KEY} unsaved onPick={onPick} /></>}
        {groups.map(([title, list]) => (
          <div key={title}><Group title={title} n={list.length} />{list.map((t) => <Item key={t.key} t={t} active={selKey === t.key} unsaved={unsavedKey === t.key} onPick={onPick} />)}</div>
        ))}
        {total === 0 && <div className="px-4 py-10 text-center text-[12px] text-[#9ca3af]">No template matches.</div>}
      </div>
      <div className="px-4 py-2.5 border-t border-[#f3f4f6] grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#6b7280]">
        <span className="flex items-center gap-1.5"><StatusDot tone="green" /> Live</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="amber" /> Draft / unsaved</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="blue" /> Approval</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="red" /> Retired</span>
      </div>
    </aside>
  );
}

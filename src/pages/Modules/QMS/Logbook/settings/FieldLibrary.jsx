import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { PALETTE, PAL_MIME } from "./model";

/* Vertical field library: search · collapsible groups · click or drag to add */
export default function FieldLibrary({ editing, onAdd, onDragItem, onDragEnd }) {
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState({});
  const s = q.trim().toLowerCase();
  const groups = PALETTE.map((g) => ({ ...g, items: g.items.filter((i) => !s || `${i.label} ${i.hint || ""}`.toLowerCase().includes(s)) })).filter((g) => g.items.length);

  return (
    <aside className="bg-white border border-[#e5e7eb] rounded-[8px] flex flex-col min-h-0 xl:sticky xl:top-0 xl:max-h-[calc(100vh-240px)]">
      <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6]">
        <h3 className="text-[14px] font-semibold text-[#111827]">Field library</h3>
        <p className="mt-[2px] text-[12px] text-[#6b7280]">{editing ? "Click to add below the selected field, or drag onto the form." : "Read only version."}</p>
        <div className="relative mt-3">
          <FaIcons.FaSearch size={11} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fields" disabled={!editing}
            className="w-full h-[32px] pl-[30px] pr-2 rounded-[6px] border border-[#d1d5db] text-[13px] outline-none placeholder:text-[#9ca3af] focus:border-[#1a56db] focus:ring-[3px] focus:ring-[#1a56db]/15 disabled:bg-[#f9fafb]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {groups.map((g) => {
          const open = s || !closed[g.group];
          return (
            <div key={g.group}>
              <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.group]: !c[g.group] }))} className="w-full flex items-center gap-2 px-4 h-[34px] text-left">
                <FaIcons.FaChevronRight size={8} className={`text-[#9ca3af] transition-transform ${open ? "rotate-90" : ""}`} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280]">{g.group}</span>
                <span className="ml-auto text-[11px] text-[#9ca3af]">{g.items.length}</span>
              </button>
              {open && g.items.map((p) => (
                <button key={p.id} type="button" draggable={editing} disabled={!editing} onClick={() => onAdd(p)}
                  onDragStart={(e) => { e.dataTransfer.setData(PAL_MIME, p.id); e.dataTransfer.effectAllowed = "copy"; onDragItem(p.id); }} onDragEnd={onDragEnd}
                  className="group w-full flex items-center gap-3 px-4 py-[7px] text-left hover:bg-[#f9fafb] disabled:cursor-default disabled:opacity-60 cursor-grab active:cursor-grabbing select-none">
                  <span className="w-[28px] h-[28px] rounded-[6px] bg-[#f3f4f6] text-[#4b5563] group-hover:bg-[#eff6ff] group-hover:text-[#1a56db] flex items-center justify-center shrink-0 transition-colors"><p.icon size={12} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-[#111827] truncate">{p.label}</span>
                    {p.hint && <span className="block text-[11px] text-[#9ca3af] truncate">{p.hint}</span>}
                  </span>
                  {editing && <FaIcons.FaPlus size={9} className="text-[#d1d5db] group-hover:text-[#1a56db]" />}
                </button>
              ))}
            </div>
          );
        })}
        {!groups.length && <div className="px-4 py-6 text-center text-[12px] text-[#9ca3af]">No field matches “{q}”.</div>}
      </div>
    </aside>
  );
}

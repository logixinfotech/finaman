// src/components/Layout/RecentMenu.jsx  -> Header me (quick popup)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { History, Star, Trash2, ArrowRight } from "lucide-react";
import { useRecent } from "../../theme/Recentcontext";
import { RecentIcon, agoLabel } from "./recentUtils";

/**
 * onOpen(item)   -> item.page ko onOpenPage me bhejo
 * onViewAll()    -> full Recent page kholo
 * className      -> icon button ka extra style (dark header par "text-white")
 */
export default function RecentMenu({ onOpen, onViewAll, className = "" }) {
  const { items, togglePin, clear } = useRecent();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const list = useMemo(() => {
    const f = items.filter((x) => tab === "all" || (tab === "screens" ? x.kind === "screen" : x.kind === "record"));
    return [...f].sort((a, b) => (b.pinned - a.pinned) || (b.openedAt - a.openedAt));
  }, [items, tab]);
  const pinned = list.filter((x) => x.pinned);
  const recent = list.filter((x) => !x.pinned).slice(0, 8);   // popup me sirf latest 8; baaki full page par

  const Row = ({ it }) => (
    <div className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-slate-50">
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        onClick={() => { setOpen(false); onOpen?.(it); }}>
        <RecentIcon name={it.page?.icon_name} seed={it.title} size="h-8 w-8" icon="h-4 w-4" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-slate-800">{it.recordNo || it.title}</span>
          <span className="block truncate text-[12px] text-slate-400">{it.recordNo ? `${it.title} · ` : ""}{it.moduleKey}</span>
        </span>
        <span className="shrink-0 text-[11.5px] text-slate-400">{agoLabel(it.openedAt)}</span>
      </button>
      <button type="button" onClick={() => togglePin(it)} title={it.pinned ? "Unpin" : "Pin"}
        className={`shrink-0 rounded p-1 ${it.pinned ? "text-amber-500" : "text-slate-300 opacity-0 hover:text-amber-500 group-hover:opacity-100"}`}>
        <Star className="h-4 w-4" fill={it.pinned ? "currentColor" : "none"} />
      </button>
    </div>
  );

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} title="Recent" aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/10 ${open ? "bg-black/10" : ""} ${className}`}>
        <History className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <span className="text-[14px] font-semibold">Recent Module</span>
            <div className="ml-auto flex rounded-md bg-slate-100 p-0.5 text-[12px] font-medium">
              {[["all", "All"], ["screens", "Screens"], ["records", "Records"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={`rounded px-2.5 py-1 ${tab === id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-1.5">
            {list.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-slate-400">No recent activity yet.</p>}
            {pinned.length > 0 && <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Pinned</p>}
            {pinned.map((it) => <Row key={it.key} it={it} />)}
            {recent.length > 0 && pinned.length > 0 && <p className="px-2.5 pb-1 pt-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Recent</p>}
            {recent.map((it) => <Row key={it.key} it={it} />)}
          </div>

          <div className="flex items-center border-t border-slate-100 px-3 py-2">
            <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear recent
            </button>
            {onViewAll && (
              <button type="button" onClick={() => { setOpen(false); onViewAll(); }}
                className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
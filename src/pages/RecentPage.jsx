// src/pages/RecentPage.jsx  -> PageRegistry me "RECENT_PAGE" naam se register hoga
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { History, Search, Star, MoreVertical, Trash2, Lightbulb, X, Clock3, Flame } from "lucide-react";
import { useRecent } from "../theme/Recentcontext";
import { fetchSidebarMenu } from "../utils/api";
import { RecentIcon, whenLabel, startOfDay } from "../components/Layout/recentUtils";

const DAY = 864e5;

export default function RecentPage({ onOpenPage }) {
  const { items, togglePin, clear } = useRecent();
  const [modules, setModules] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [menuKey, setMenuKey] = useState(null);
  const [tipOpen, setTipOpen] = useState(() => localStorage.getItem("recentTipHidden") !== "1");

  // module ka naam + icon dynamic (sidebar menu API se)
  useEffect(() => {
    let alive = true;
    fetchSidebarMenu()
      .then((d) => alive && setModules((Array.isArray(d) ? d : []).filter((m) => m.show_stat === "Y")))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const modOf = useCallback((it) => modules.find((m) => String(m.masmod_id) === String(it.page?.masmod_id)), [modules]);

  const rows = useMemo(() => items.map((it) => {
    const m = modOf(it);
    return { ...it, modName: m?.mod_name || it.moduleKey || "Others", modIcon: m?.icon_name };
  }), [items, modOf]);

  // filter chips: jo modules recent me hain
  const chips = useMemo(() => {
    const c = {};
    rows.forEach((r) => { c[r.modName] = (c[r.modName] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(() => rows
    .filter((r) => (filter === "all" || r.modName === filter) &&
      (!needle || r.title.toLowerCase().includes(needle) || r.modName.toLowerCase().includes(needle)))
    .sort((a, b) => (b.pinned - a.pinned) || (b.openedAt - a.openedAt)), [rows, filter, needle]);

  const now = Date.now();
  const weekCount = rows.filter((r) => r.openedAt >= now - 7 * DAY).length;
  const todayCount = rows.filter((r) => r.openedAt >= startOfDay()).length;
  const frequent = useMemo(() => [...rows].filter((r) => (r.count || 0) > 1).sort((a, b) => b.count - a.count).slice(0, 5), [rows]);

  const open = (r, newTab = false) => { setMenuKey(null); r.page && onOpenPage?.(r.page, newTab ? { newTab: true } : { reuse: true }); };
  const hideTip = () => { localStorage.setItem("recentTipHidden", "1"); setTipOpen(false); };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#eef1f8] p-4 text-[13px] text-slate-800">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><History className="h-5 w-5" /></span>
        <div>
          <h1 className="text-[20px] font-bold leading-tight">Recent</h1>
          <p className="text-[12.5px] text-slate-500">Quickly access the screens you recently opened.</p>
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recent"
            className="h-9 w-[240px] rounded-md border border-slate-200 bg-white pl-8 pr-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <button type="button" onClick={() => window.confirm("Clear all recent history? Pinned items will stay.") && clear()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" /> Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── left: list ── */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
            {[["all", "All Modules", rows.length], ...chips.map(([n, c]) => [n, n, c])].map(([id, label, c]) => (
              <button key={id} type="button" onClick={() => setFilter(id)}
                className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-medium ${filter === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {label} <span className={filter === id ? "text-white/80" : "text-slate-400"}>{c}</span>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_170px_120px] items-center border-b border-slate-100 px-4 py-2.5 text-[12px] font-semibold text-slate-500 max-md:grid-cols-[minmax(0,1fr)_110px]">
              <span>Module / Page</span><span className="max-md:hidden">Accessed On</span><span className="text-right">Action</span>
            </div>

            {shown.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-slate-400">
                <Clock3 className="h-8 w-8" strokeWidth={1.4} />
                <span>{rows.length ? "No match found." : "Nothing here yet. Open any screen and it will show up here."}</span>
              </div>
            )}

            {shown.map((r) => (
              <div key={r.key} className="relative grid grid-cols-[minmax(0,1fr)_170px_120px] items-center border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50/70 max-md:grid-cols-[minmax(0,1fr)_110px]">
                <button type="button" onClick={() => open(r)} className="flex min-w-0 items-center gap-3 text-left">
                  <RecentIcon name={r.page?.icon_name || r.modIcon} seed={r.title} size="h-10 w-10" icon="h-5 w-5" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-slate-800">{r.recordNo || r.title}</span>
                    <span className="block truncate text-[12px] text-slate-400">{r.modName} &gt; {r.recordNo ? r.title : "Screen"}</span>
                  </span>
                </button>
                <span className="text-[12.5px] text-slate-500 max-md:hidden">{whenLabel(r.openedAt)}</span>
                <span className="flex items-center justify-end gap-1.5">
                  {r.pinned && <Star className="h-4 w-4 text-amber-500" fill="currentColor" />}
                  <button type="button" onClick={() => open(r)} disabled={!r.page}
                    className="rounded-md bg-blue-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-40">Open</button>
                  <button type="button" onClick={() => setMenuKey(menuKey === r.key ? null : r.key)} aria-label="More"
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreVertical className="h-4 w-4" /></button>
                </span>

                {menuKey === r.key && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuKey(null)} />
                    <div className="absolute right-4 top-12 z-20 w-[170px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                      <button type="button" onClick={() => open(r)} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Open</button>
                      <button type="button" onClick={() => open(r, true)} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Open in new tab</button>
                      <button type="button" onClick={() => { togglePin(r); setMenuKey(null); }} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">{r.pinned ? "Unpin" : "Pin to top"}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── right: stats ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600"><Clock3 className="h-4 w-4 text-blue-600" /> Recently Accessed</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[40px] font-bold leading-none text-slate-800">{weekCount}</span>
              <span className="pb-1 text-[12.5px] text-slate-500">screens opened<br />in last 7 days</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-[13px] font-semibold text-slate-700">Quick Stats</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Total Modules", modules.length, "bg-blue-50 text-blue-700"],
                ["Recently Opened", rows.length, "bg-emerald-50 text-emerald-700"],
                ["Today", todayCount, "bg-violet-50 text-violet-700"],
                ["This Week", weekCount, "bg-orange-50 text-orange-700"],
              ].map(([label, n, cls]) => (
                <div key={label} className={`rounded-lg p-3 ${cls}`}>
                  <div className="text-[12px] text-slate-500">{label}</div>
                  <div className="text-[22px] font-bold leading-tight">{n}</div>
                </div>
              ))}
            </div>
          </div>

          {frequent.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-700"><Flame className="h-4 w-4 text-orange-500" /> Frequently used</div>
              {frequent.map((r) => (
                <button key={r.key} type="button" onClick={() => open(r)} className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left hover:bg-slate-50">
                  <RecentIcon name={r.page?.icon_name || r.modIcon} seed={r.title} size="h-7 w-7" icon="h-3.5 w-3.5" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">{r.recordNo || r.title}</span>
                  <span className="text-[11.5px] text-slate-400">{r.count}×</span>
                </button>
              ))}
            </div>
          )}

          {tipOpen && (
            <div className="relative rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <button type="button" onClick={hideTip} aria-label="Hide tip" className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
              <div className="flex items-start gap-2.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-700">Tip</div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">Pin the screens you use daily. Pinned items always stay at the top and are not removed by Clear history.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
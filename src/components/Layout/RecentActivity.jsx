// RecentActivity.jsx  (poori file replace karo)
// Panel: [Recent Modules] [Activity] tabs
//  - Recent Modules: row click = PAGE OPEN | pin | activity button = us module ki activity
//  - Activity: event filter, date groups, module filter chip
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHistory, FaCircle, FaStar, FaRegStar, FaTimes, FaThLarge, FaSearch,
  FaTrashAlt, FaBolt, FaChevronRight, FaExternalLinkAlt,
} from 'react-icons/fa';
import { fetchActivity } from '../../utils/api';
import { useRecent } from '../../theme/Recentcontext';
import { RecentIcon, agoLabel, startOfDay } from '../Layout/recentUtils';   // path alag ho to sahi kar lena

const POLL_MS = 60000;
const PAGE = 50;
const DAY = 864e5;

// Recent Page ka menu object. appl_name wahi rakho jo PageRegistry / DB me "Recent Page" menu ka hai
const RECENT_PAGE = { appl_name: 'RECENT_PAGE', bar_name: 'Recent', icon_name: 'FaHistory' };

const EVT_STATUS = {
  ADD: 'info', MOD: 'warning', DEL: 'error', SUBMIT: 'warning',
  APPR: 'success', REJ: 'error', PROCESS: 'success', CLOSE: 'success',
};
const EVT_LABEL = {
  ADD: 'Added', MOD: 'Modified', DEL: 'Deleted', SUBMIT: 'Submitted',
  APPR: 'Approved', REJ: 'Rejected', PROCESS: 'Processed', CLOSE: 'Closed',
};

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
};

const initials = (uid = '') =>
  uid.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase() || '?';

// date -> "Today" / "Yesterday" / "12 Oct 2026"
const dayLabel = (ms) => {
  const diff = Math.round((startOfDay() - startOfDay(new Date(ms))) / DAY);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(ms).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    case 'error': return 'text-rose-500';
    default: return 'text-blue-500';
  }
};

const RecentActivity = ({ activeTab, onOpenPage }) => {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const scopeRef = useRef('');

  const { items: recent, togglePin, clear } = useRecent();
  const [view, setView] = useState('modules');   // 'modules' | 'activity'
  const [focus, setFocus] = useState(null);      // { key, label, scope, page }
  const [q, setQ] = useState('');                // modules search
  const [kind, setKind] = useState('all');       // all | screen | record
  const [evt, setEvt] = useState('all');         // activity event filter

  // Main Menu tab? (tumhare tab object me type alag ho to yahan badal lena)
  const isHome = !activeTab || activeTab.type === 'main' || activeTab.label === 'Main Menu';
  const isModuleTab = !isHome && activeTab.type === 'module';

  const tabKey = isHome ? 'home'
    : isModuleTab ? `m:${activeTab.module?.masmod_id}` : `s:${activeTab.appl_name}`;

  // ERP tab badle to sab reset
  useEffect(() => { setFocus(null); setView('modules'); setQ(''); setKind('all'); setEvt('all'); }, [tabKey]);

  const baseScope = isHome ? {}
    : isModuleTab ? { masmod_id: activeTab.module?.masmod_id }
    : { appl_name: activeTab.appl_name };

  const scope = focus ? focus.scope : baseScope;
  const scopeKey = JSON.stringify(scope);

  // ───────────── Recent Modules data ─────────────
  const scoped = useMemo(() => {
    if (isHome) return recent;
    if (isModuleTab)
      return recent.filter(r => String(r.page?.masmod_id) === String(activeTab.module?.masmod_id));
    return recent.filter(r => (r.applName || r.page?.appl_name) === activeTab.appl_name);
  }, [recent, tabKey]);

  const kindCount = useMemo(() => ({
    all: scoped.length,
    screen: scoped.filter(r => r.kind === 'screen').length,
    record: scoped.filter(r => r.kind === 'record').length,
  }), [scoped]);

  const needle = q.trim().toLowerCase();
  const list = useMemo(() => scoped
    .filter(r => (kind === 'all' || r.kind === kind) &&
      (!needle || `${r.title} ${r.recordNo || ''} ${r.moduleKey || ''}`.toLowerCase().includes(needle)))
    .sort((a, b) => (b.pinned - a.pinned) || (b.openedAt - a.openedAt)), [scoped, kind, needle]);

  // groups: Pinned / Today / Yesterday / Earlier
  const groups = useMemo(() => {
    const g = [];
    const pinned = list.filter(r => r.pinned);
    if (pinned.length) g.push(['Pinned', pinned]);
    const rest = list.filter(r => !r.pinned);
    const map = {};
    rest.forEach(r => {
      const l = dayLabel(r.openedAt);
      const k = l === 'Today' || l === 'Yesterday' ? l : 'Earlier';
      (map[k] = map[k] || []).push(r);
    });
    ['Today', 'Yesterday', 'Earlier'].forEach(k => map[k] && g.push([k, map[k]]));
    return g;
  }, [list]);

  const frequent = useMemo(
    () => [...scoped].filter(r => (r.count || 0) > 1).sort((a, b) => b.count - a.count).slice(0, 3),
    [scoped]
  );

  // ───────────── actions ─────────────
  // ROW CLICK = PAGE OPEN (Ctrl/Cmd+click = new tab)
  const openPage = (r, e) => {
    if (!r.page) return;
    const newTab = !!(e && (e.ctrlKey || e.metaKey));
    onOpenPage?.(r.page, newTab ? { newTab: true } : { reuse: true });
  };

  // ACTIVITY BUTTON = us module ki activity
  const showActivity = (r) => {
    const sc = r.page?.masmod_id
      ? { masmod_id: r.page.masmod_id }
      : { appl_name: r.applName || r.page?.appl_name };
    setEvt('all');
    setFocus({ key: r.key, label: r.moduleKey || r.recordNo || r.title, scope: sc, page: r.page });
    setView('activity');
  };

  const isOpenNow = (r) =>
    !isHome && !isModuleTab && activeTab.appl_name === (r.applName || r.page?.appl_name);

  // ───────────── Activity data ─────────────
  const load = useCallback(async (before = null) => {
    setLoading(true);
    try {
      const res = await fetchActivity({ ...scope, limit: PAGE, ...(before ? { before } : {}) });
      const rows = res?.data || [];
      setItems(prev => before ? [...prev, ...rows] : rows);
      setHasMore(!!res?.hasMore);
    } catch (e) {
      console.error('activity load failed', e);
    } finally {
      setLoading(false);
    }
  }, [scopeKey]);

  useEffect(() => {
    scopeRef.current = scopeKey;
    setItems([]);
    load();
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [scopeKey, load]);

  const evtChips = useMemo(() => {
    const c = {};
    items.forEach(i => { c[i.EvtType] = (c[i.EvtType] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const actGroups = useMemo(() => {
    const g = [];
    items.filter(i => evt === 'all' || i.EvtType === evt).forEach(i => {
      const l = dayLabel(new Date(i.ActOn).getTime());
      const last = g[g.length - 1];
      if (last && last[0] === l) last[1].push(i); else g.push([l, [i]]);
    });
    return g;
  }, [items, evt]);

  const openRow = (item) => {
    if (!onOpenPage || !item.masmnu_id) return;
    onOpenPage({ masmnu_id: item.masmnu_id, bar_name: item.bar_name,
                 appl_name: item.ApplName, icon_name: item.icon_name, appl_para: item.RefNo });
  };

  const scopeTitle = focus ? focus.label : isHome ? 'Main Menu' : activeTab.label;

  const TABS = [
    ['modules', 'Recent Modules', FaThLarge, scoped.length],
    ['activity', 'Activity', FaHistory, `${items.length}${hasMore ? '+' : ''}`],
  ];

  // ───────────── render helpers ─────────────
  const renderRow = (r) => (
    <div key={r.key}
      role="button" tabIndex={0}
      onClick={(e) => openPage(r, e)}
      onKeyDown={(e) => e.key === 'Enter' && openPage(r, e)}
      title={r.page ? 'Open page (Ctrl+click = new tab)' : ''}
      className={`group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors
        ${r.page ? 'cursor-pointer' : 'cursor-default'} ${isOpenNow(r) ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}>
      <RecentIcon name={r.page?.icon_name} seed={r.title} size="h-8 w-8" icon="h-4 w-4" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[12.5px] font-semibold text-slate-700">{r.recordNo || r.title}</span>
          {r.kind === 'record' && <span className="shrink-0 rounded bg-violet-50 px-1 text-[9px] font-bold uppercase text-violet-600">Record</span>}
          {isOpenNow(r) && <span className="shrink-0 rounded bg-emerald-50 px-1 text-[9px] font-bold uppercase text-emerald-600">Open</span>}
        </span>
        <span className="block truncate text-[10.5px] text-slate-400">
          {r.recordNo ? `${r.title} · ` : ''}{r.moduleKey} · {agoLabel(r.openedAt)}
          {r.count > 1 && <span className="ml-1 text-slate-300">· {r.count}×</span>}
        </span>
      </span>

      {/* activity button */}
      <button type="button" title="View activity"
        onClick={(e) => { e.stopPropagation(); showActivity(r); }}
        className="shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-indigo-100 hover:text-indigo-600 group-hover:opacity-100">
        <FaHistory className="text-[11px]" />
      </button>
      {/* pin button */}
      <button type="button" title={r.pinned ? 'Unpin' : 'Pin'}
        onClick={(e) => { e.stopPropagation(); togglePin(r); }}
        className={`shrink-0 rounded-md p-1.5 transition hover:bg-amber-50 ${r.pinned ? 'text-amber-500' : 'text-slate-300 opacity-0 hover:text-amber-500 group-hover:opacity-100'}`}>
        {r.pinned ? <FaStar className="text-[12px]" /> : <FaRegStar className="text-[12px]" />}
      </button>
    </div>
  );

  return (
    <motion.div
      layout
      className="activity-block flex h-full flex-col border-l border-slate-200 bg-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── tab switcher ── */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        {TABS.map(([id, label, Icon, count]) => (
          <button key={id} type="button" onClick={() => setView(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors
              ${view === id ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icon className="text-[11px]" />
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${view === id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ══════════ TAB 1: RECENT MODULES ══════════ */}
      {view === 'modules' && (
        <>
          {/* search + kind filter */}
          <div className="space-y-2 border-b border-slate-100 px-3 py-2.5">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recent..."
                className="h-8 w-full rounded-md border border-slate-200 bg-white pl-7 pr-7 text-[12px] outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              {q && (
                <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <FaTimes className="text-[10px]" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {[['all', 'All'], ['screen', 'Screens'], ['record', 'Records']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setKind(id)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors
                    ${kind === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {label} <span className={kind === id ? 'text-white/70' : 'text-slate-400'}>{kindCount[id]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="custom-dashboard-scrollbar flex-1 overflow-y-auto p-2">
            {/* frequently used */}
            {frequent.length > 0 && !needle && kind === 'all' && (
              <div className="mb-2 rounded-lg border border-orange-100 bg-orange-50/50 p-2">
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wider text-orange-500">
                  <FaBolt className="text-[9px]" /> Frequently used
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {frequent.map(r => (
                    <button key={r.key} type="button" onClick={(e) => openPage(r, e)}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-orange-100 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-orange-300">
                      <span className="truncate">{r.recordNo || r.title}</span>
                      <span className="text-[10px] text-orange-400">{r.count}×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {groups.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <FaHistory className="text-2xl opacity-40" />
                <span className="text-[12px]">{scoped.length ? 'No match found.' : 'No recent modules yet.'}</span>
              </div>
            )}

            {groups.map(([label, rows]) => (
              <div key={label} className="mb-1">
                <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                {rows.map(renderRow)}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-3 py-2">
            <button type="button" onClick={() => onOpenPage?.(RECENT_PAGE, { reuse: true })}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-800">
              View all <FaChevronRight className="text-[9px]" />
            </button>
            <button type="button"
              onClick={() => window.confirm('Clear recent history? Pinned items will stay.') && clear()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600">
              <FaTrashAlt className="text-[10px]" /> Clear
            </button>
          </div>
        </>
      )}

      {/* ══════════ TAB 2: ACTIVITY ══════════ */}
      {view === 'activity' && (
        <>
          {/* scope bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {scopeTitle} Activity
            </span>
            {focus?.page && (
              <button type="button" onClick={() => onOpenPage?.(focus.page, { reuse: true })}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700">
                Open page <FaChevronRight className="text-[8px]" />
              </button>
            )}
            {focus && (
              <button type="button" onClick={() => setFocus(null)} title="Clear filter"
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-200">
                Clear <FaTimes className="text-[8px]" />
              </button>
            )}
          </div>

          {/* event chips */}
          {evtChips.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-3 py-2">
              {[['all', 'All', items.length], ...evtChips.map(([k, c]) => [k, EVT_LABEL[k] || k, c])].map(([id, label, c]) => (
                <button key={id} type="button" onClick={() => setEvt(id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors
                    ${evt === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {label} <span className={evt === id ? 'text-white/70' : 'text-slate-400'}>{c}</span>
                </button>
              ))}
            </div>
          )}

          <div className="activity-list custom-dashboard-scrollbar flex-1 overflow-y-auto p-4">
            {loading && items.length === 0 && (
              <div className="space-y-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex animate-pulse gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-2.5 w-4/5 rounded bg-slate-100" />
                      <div className="h-2 w-1/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && actGroups.length === 0 && (
              <p className="py-6 text-center text-[12px] text-slate-400">No activity yet.</p>
            )}

            <AnimatePresence mode="popLayout" initial={false}>
              {actGroups.map(([label, rows]) => (
                <div key={label} className="mb-3">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  {rows.map((item, index) => {
                    const status = EVT_STATUS[item.EvtType] || 'info';
                    return (
                      <motion.div
                        key={item.ACTLOG_ID}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(index, 10) * 0.03 }}
                        className={`group relative flex gap-4 pb-6 last:pb-0 ${item.masmnu_id ? 'cursor-pointer' : ''}`}
                        onClick={() => openRow(item)}
                      >
                        {index !== rows.length - 1 && (
                          <div className="absolute bottom-0 left-[15px] top-[32px] w-[2px] bg-slate-100 transition-colors group-hover:bg-indigo-100" />
                        )}
                        <div className="relative z-10">
                          <div className="activity-avatar flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-white shadow-md transition-colors group-hover:bg-indigo-600">
                            {initials(item.UserId)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                            <FaCircle className={`text-[8px] ${getStatusColor(status)}`} />
                          </div>
                        </div>
                        <div className="activity-info flex min-w-0 flex-col pt-0.5">
                          <p className="activity-text text-[12.5px] leading-snug text-slate-700 transition-colors group-hover:text-slate-900">
                            <span className="font-semibold text-slate-900">{item.UserId}</span>{' '}
                            {item.Title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="activity-time text-[10px] font-medium text-slate-400" title={new Date(item.ActOn).toLocaleString()}>
                              {timeAgo(item.ActOn)}
                            </span>
                            {isHome && !focus && item.mod_name && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="truncate text-[9px] font-semibold text-slate-400">{item.mod_name}</span>
                              </>
                            )}
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className={`text-[9px] font-bold uppercase ${getStatusColor(status)}`}>{item.EvtType}</span>
                            {item.masmnu_id && (
                              <FaExternalLinkAlt className="ml-auto text-[9px] text-slate-300 opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/30 p-3 text-center">
            <button
              disabled={loading || !hasMore}
              onClick={() => load(items[items.length - 1]?.ACTLOG_ID)}
              className="text-[11px] font-bold uppercase tracking-tight text-indigo-600 transition-all hover:text-indigo-800 disabled:text-slate-300"
            >
              {loading ? 'Loading…' : hasMore ? 'Load more' : 'All caught up'}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default RecentActivity;
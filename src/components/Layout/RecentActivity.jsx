import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaCircle } from 'react-icons/fa';
import { fetchActivity } from '../../utils/api';

const POLL_MS = 60000;
const PAGE = 50;

const EVT_STATUS = {
  ADD: 'info', MOD: 'warning', DEL: 'error', SUBMIT: 'warning',
  APPR: 'success', REJ: 'error', PROCESS: 'success', CLOSE: 'success',
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

const RecentActivity = ({ activeTab, onOpenPage }) => {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const scopeRef = useRef('');

  const scope = !activeTab ? {}
    : activeTab.type === 'module' ? { masmod_id: activeTab.module?.masmod_id }
    : { appl_name: activeTab.appl_name };
  const scopeKey = JSON.stringify(scope);

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
    load();
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [scopeKey, load]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-rose-500';
      default: return 'text-blue-500';
    }
  };

  const openRow = (item) => {
    if (!onOpenPage || !item.masmnu_id) return;
    onOpenPage({ masmnu_id: item.masmnu_id, bar_name: item.bar_name,
                 appl_name: item.ApplName, icon_name: item.icon_name, appl_para: item.RefNo });
  };

  return (
    <motion.div
      layout
      className="activity-block flex flex-col h-full border-l border-slate-200 bg-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="activity-header flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FaHistory className="text-indigo-500 text-xs" />
          <h3 className="activity-title text-xs font-bold uppercase tracking-wider text-slate-600">
            {activeTab ? `${activeTab.label} Activity` : 'Recent Activity'}
          </h3>
        </div>
        <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {items.length}{hasMore ? '+' : ''}
        </span>
      </div>

      <div className="activity-list flex-1 overflow-y-auto p-4 custom-dashboard-scrollbar">
        {!loading && items.length === 0 && (
          <p className="text-[12px] text-slate-400 text-center py-6">No activity yet.</p>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item, index) => {
            const status = EVT_STATUS[item.EvtType] || 'info';
            return (
              <motion.div
                key={item.ACTLOG_ID}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
                className={`relative flex gap-4 pb-6 last:pb-0 group ${item.masmnu_id ? 'cursor-pointer' : ''}`}
                onClick={() => openRow(item)}
              >
                {index !== items.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                )}
                <div className="relative z-10">
                  <div className="activity-avatar w-8 h-8 rounded-lg bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow-md group-hover:bg-indigo-600 transition-colors">
                    {initials(item.UserId)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <FaCircle className={`text-[8px] ${getStatusColor(status)}`} />
                  </div>
                </div>
                <div className="activity-info flex flex-col pt-0.5 min-w-0">
                  <p className="activity-text text-[12.5px] leading-snug text-slate-700 group-hover:text-slate-900 transition-colors">
                    <span className="font-semibold text-slate-900">{item.UserId}</span>{' '}
                    {item.Title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="activity-time text-[10px] font-medium text-slate-400" title={new Date(item.ActOn).toLocaleString()}>
                      {timeAgo(item.ActOn)}
                    </span>
                    {!activeTab && item.mod_name && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[9px] font-semibold text-slate-400 truncate">{item.mod_name}</span>
                      </>
                    )}
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className={`text-[9px] font-bold uppercase ${getStatusColor(status)}`}>
                      {item.EvtType}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
        <button
          disabled={loading || !hasMore}
          onClick={() => load(items[items.length - 1]?.ACTLOG_ID)}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 uppercase tracking-tight transition-all"
        >
          {loading ? 'Loading…' : hasMore ? 'Load more' : 'All caught up'}
        </button>
      </div>
    </motion.div>
  );
};

export default RecentActivity;
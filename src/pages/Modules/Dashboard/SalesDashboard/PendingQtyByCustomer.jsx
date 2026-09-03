import { useMemo } from "react";

// NOTE: same `qo`/`qd` assumption as FulfillmentByCustomer.jsx — pending
// qty = ordered - delivered. Adjust field names together in both files.
export default function PendingQtyByCustomer({ rows, n = 10 }) {
  const data = useMemo(() => {
    const byCust = {};
(rows || []).forEach((r) => {
  const pending = r.qb || 0;
  if (pending <= 0) return;
  byCust[r.cust] = (byCust[r.cust] || 0) + pending;
});
    const max = Math.max(1, ...Object.values(byCust));
    return Object.entries(byCust)
      .map(([cust, qty]) => ({ cust, qty, pct: (qty / max) * 100 }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, n);
  }, [rows, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">⏳ Pending Qty by Customer</h4>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.cust} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-[11px] font-medium text-slate-600">{d.cust}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(3, d.pct)}%` }} />
            </div>
            <span className="w-16 shrink-0 text-right text-[11px] text-slate-500">{Math.round(d.qty).toLocaleString("en-IN")}</span>
          </div>
        ))}
        {!data.length && <p className="text-xs text-slate-400">No pending quantity in this range.</p>}
      </div>
    </div>
  );
}

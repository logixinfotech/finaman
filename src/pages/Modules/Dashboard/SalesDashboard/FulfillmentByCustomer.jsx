import { useMemo } from "react";

// NOTE: assumes each row carries `qo` (qty ordered) and `qd` (qty
// dispatched/delivered) — `qo` is confirmed (used elsewhere as o.qo in
// TopBarChart "Top Customers by Order Qty"), but `qd` is a GUESS. Swap the
// field name below to whatever tracks delivered/fulfilled qty in your rows.
export default function FulfillmentByCustomer({ rows, n = 10 }) {
  const data = useMemo(() => {
    const byCust = {};
(rows || []).forEach((r) => {
  if (!byCust[r.cust]) byCust[r.cust] = { ordered: 0, delivered: 0 };
  byCust[r.cust].ordered += r.qo || 0;
  byCust[r.cust].delivered += r.qs || 0;
});
    return Object.entries(byCust)
      .map(([cust, v]) => ({
        cust,
        ...v,
        pct: v.ordered > 0 ? (v.delivered / v.ordered) * 100 : 0,
      }))
      .sort((a, b) => a.pct - b.pct) // worst fulfillment first
      .slice(0, n);
  }, [rows, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">✅ Fulfillment % by Customer</h4>
      <div className="space-y-2.5">
        {data.map((d) => {
          const low = d.pct < 60;
          return (
            <div key={d.cust}>
              <div className="flex items-center justify-between mb-1">
                <span className="truncate text-xs font-medium text-slate-600">{d.cust}</span>
                <span className={`text-xs font-semibold ${low ? "text-rose-600" : "text-emerald-600"}`}>{d.pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${low ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(2, d.pct)}%` }} />
              </div>
            </div>
          );
        })}
        {!data.length && <p className="text-xs text-slate-400">No order data in this range.</p>}
      </div>
    </div>
  );
}

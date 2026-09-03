import { useMemo } from "react";
import { inrS } from "../../../../utils/helpers";

// NOTE: assumes each row has a `status` field (e.g. "Pending", "Partially
// Dispatched", "Completed", "Cancelled") — same field the existing
// `orderStatus` filter in FiltersBar presumably filters on. Check
// orderHelpers.js (applyOrderFilters) for the real field name and swap
// `r.status` below if it differs.
const STATUS_COLORS = {
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  "partially dispatched": "bg-sky-500",
  cancelled: "bg-rose-500",
  reduced: "bg-orange-500",
};
const fallbackColor = "bg-slate-400";

export default function OrderStatus({ rows }) {
const data = useMemo(() => {
  const byStatus = { Completed: { count: 0, amt: 0 }, Pending: { count: 0, amt: 0 } };
  (rows || []).forEach((r) => {
    const key = r.comple === "Y" ? "Completed" : "Pending";
    byStatus[key].count += 1;
    byStatus[key].amt += r.amt || 0;
  });
  const total = (rows || []).length || 1;
  return Object.entries(byStatus)
    .map(([status, v]) => ({ status, ...v, pct: (v.count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}, [rows]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">🎯 Order Status</h4>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">{d.status}</span>
              <span className="text-xs text-slate-500">{d.count} · {inrS(d.amt)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${STATUS_COLORS[d.status.toLowerCase()] || fallbackColor}`}
                style={{ width: `${Math.max(2, d.pct)}%` }}
              />
            </div>
          </div>
        ))}
        {!data.length && <p className="text-xs text-slate-400">No order data in this range.</p>}
      </div>
    </div>
  );
}

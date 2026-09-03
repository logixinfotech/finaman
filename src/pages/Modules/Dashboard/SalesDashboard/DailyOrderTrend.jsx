import { useMemo } from "react";
import { ordersOf } from "../../../../utils/orderHelpers";
import { inrS } from "../../../../utils/helpers";

// NOTE: assumes each order object from ordersOf() carries a `dt` field (ISO date),
// same as the underlying rows. Check orderHelpers.js and adjust `o.dt` below if not.
export default function DailyOrderTrend({ rows }) {
  const { points, maxAmt } = useMemo(() => {
    const ords = ordersOf(rows);
    const byDay = {};
    ords.forEach((o) => {
      if (!o.dt) return;
      if (!byDay[o.dt]) byDay[o.dt] = { count: 0, amt: 0 };
      byDay[o.dt].count += 1;
      byDay[o.dt].amt += o.amt || 0;
    });
    const days = Object.keys(byDay).sort();
    const points = days.map((d) => ({ date: d, ...byDay[d] }));
    const maxAmt = Math.max(1, ...points.map((p) => p.amt));
    return { points, maxAmt };
  }, [rows]);

  const w = 100, h = 40;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const linePoints = points.map((p, i) => `${i * step},${h - (p.amt / maxAmt) * h}`).join(" ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">📈 Daily Order Trend</h4>
      {points.length ? (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="none">
            <polyline points={linePoints} fill="none" stroke="#6366f1" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{points[0]?.date}</span>
            <span>{points[points.length - 1]?.date}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {points.reduce((s, p) => s + p.count, 0)} orders · {inrS(points.reduce((s, p) => s + p.amt, 0))} total
          </p>
        </>
      ) : (
        <p className="text-xs text-slate-400">No order data in this range.</p>
      )}
    </div>
  );
}
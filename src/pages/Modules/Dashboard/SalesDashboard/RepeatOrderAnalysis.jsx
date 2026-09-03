import { useMemo } from "react";
import { ordersOf } from "../../../../utils/orderHelpers";
import { inrS } from "../../../../utils/helpers";

const BUCKETS = [
  { label: "1 order", test: (n) => n === 1 },
  { label: "2 orders", test: (n) => n === 2 },
  { label: "3–5 orders", test: (n) => n >= 3 && n <= 5 },
  { label: "6–10 orders", test: (n) => n >= 6 && n <= 10 },
  { label: "10+ orders", test: (n) => n > 10 },
];

export default function RepeatOrderAnalysis({ rows }) {
  const stats = useMemo(() => {
    const ords = ordersOf(rows);
    const byCust = {};
    ords.forEach((o) => {
      if (!byCust[o.cust]) byCust[o.cust] = { count: 0, amt: 0 };
      byCust[o.cust].count += 1;
      byCust[o.cust].amt += o.amt || 0;
    });

    const custs = Object.values(byCust);
    const totalCust = custs.length;
    const totalAmt = custs.reduce((s, c) => s + c.amt, 0);

    const repeatCusts = custs.filter((c) => c.count >= 2);
    const repeatAmt = repeatCusts.reduce((s, c) => s + c.amt, 0);

    const buckets = BUCKETS.map((b) => {
      const inBucket = custs.filter((c) => b.test(c.count));
      return { label: b.label, count: inBucket.length, amt: inBucket.reduce((s, c) => s + c.amt, 0) };
    });
    const maxBucketCount = Math.max(1, ...buckets.map((b) => b.count));

    return {
      totalCust,
      repeatCustPct: totalCust ? (repeatCusts.length / totalCust) * 100 : 0,
      repeatAmtPct: totalAmt ? (repeatAmt / totalAmt) * 100 : 0,
      buckets,
      maxBucketCount,
    };
  }, [rows]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">🔁 Repeat Order Analysis</h4>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">Repeat Customers</p>
          <p className="text-xl font-extrabold text-emerald-800">{stats.repeatCustPct.toFixed(1)}%</p>
          <p className="text-[10px] text-emerald-600">of {stats.totalCust} customers</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-[11px] font-semibold text-indigo-700 mb-0.5">Revenue from Repeats</p>
          <p className="text-xl font-extrabold text-indigo-800">{stats.repeatAmtPct.toFixed(1)}%</p>
          <p className="text-[10px] text-indigo-600">of total order value</p>
        </div>
      </div>

      <div className="space-y-2">
        {stats.buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] font-medium text-slate-500">{b.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.max(4, (b.count / stats.maxBucketCount) * 100)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-[11px] text-slate-500">
              {b.count} <span className="text-slate-300">·</span> {inrS(b.amt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
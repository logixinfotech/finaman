import { TrendingUp, TrendingDown } from "lucide-react";
import { inrS, sumRange, isoOf, addD, monday } from "../../../../utils/helpers";

function buildWindows(today) {
  const wkStart = monday(today);
  const lastWkStart = addD(wkStart, -7);
  const lastWkEnd = addD(wkStart, -1);

  const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMEnd = addD(mStart, -1);
  const lastMStart = new Date(lastMEnd.getFullYear(), lastMEnd.getMonth(), 1);

  const yStart = new Date(today.getFullYear(), 0, 1);
  const lastYStart = new Date(today.getFullYear() - 1, 0, 1);
  const lastYEnd = new Date(today.getFullYear() - 1, 11, 31);

  return {
    week: { curA: isoOf(wkStart), curB: isoOf(today), prevA: isoOf(lastWkStart), prevB: isoOf(lastWkEnd) },
    month: { curA: isoOf(mStart), curB: isoOf(today), prevA: isoOf(lastMStart), prevB: isoOf(lastMEnd) },
    year: { curA: isoOf(yStart), curB: isoOf(today), prevA: isoOf(lastYStart), prevB: isoOf(lastYEnd) },
  };
}

export default function ComparisonCards({ rows }) {
  const today = new Date();
  const w = buildWindows(today);

  const cards = [
    { label: "This Week vs Last Week", win: w.week },
    { label: "This Month vs Last Month", win: w.month },
    { label: "This Year vs Last Year", win: w.year },
  ].map(({ label, win }) => {
    const cur = sumRange(rows, win.curA, win.curB);
    const prev = sumRange(rows, win.prevA, win.prevB);
    const pct = prev.amt > 0 ? ((cur.amt - prev.amt) / prev.amt) * 100 : cur.amt > 0 ? 100 : 0;
    return { label, cur, prev, pct };
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      {cards.map((c, i) => {
        const up = c.pct >= 0;
        const barPct = Math.min(100, Math.max(6, (c.cur.amt / (Math.max(c.cur.amt, c.prev.amt) || 1)) * 100));
        return (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</h4>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(c.pct).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-lg font-extrabold text-slate-900">{inrS(c.cur.amt)}</span>
              <span className="text-xs text-slate-400">vs {inrS(c.prev.amt)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${up ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${barPct}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{c.cur.inv} invoices this period · {c.prev.inv} last period</p>
          </div>
        );
      })}
    </div>
  );
}

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { inrS, isoOf, addD, monday, toD } from "../../../../utils/helpers";

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
    week:  { curA: isoOf(wkStart), curB: isoOf(today), prevA: isoOf(lastWkStart), prevB: isoOf(lastWkEnd), gran: "range" },
    month: { curA: isoOf(mStart),  curB: isoOf(today), prevA: isoOf(lastMStart),  prevB: isoOf(lastMEnd),  gran: "month" },
    year:  { curA: isoOf(yStart),  curB: isoOf(today), prevA: isoOf(lastYStart),  prevB: isoOf(lastYEnd),  gran: "year"  },
  };
}

function fmtD(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function rangeLabel(aISO, bISO, gran) {
  if (gran === "year") return `${new Date(aISO).getFullYear()}`;
  if (gran === "month") return new Date(aISO).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return `${fmtD(aISO)} – ${fmtD(bISO)}`;
}

/* One pass over rows -> per-day { amt, invSet }. Har card isi map se padhta hai. */
function buildDailyIndex(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!r.dt) continue;
    let e = m.get(r.dt);
    if (!e) { e = { amt: 0, inv: new Set() }; m.set(r.dt, e); }
    e.amt += r.amt || 0;
    const k = r.invKey || r.inv;
    if (k) e.inv.add(k);
  }
  return m;
}

function sumWindow(daily, dates, a, b) {
  let amt = 0;
  const inv = new Set();
  for (const d of dates) {
    if (d < a) continue;
    if (d > b) break;                       // dates sorted hain
    const e = daily.get(d);
    amt += e.amt;
    for (const v of e.inv) inv.add(v);
  }
  return { amt, inv: inv.size };
}

/* week/month -> daily buckets, year -> monthly buckets (365 points 100px me bekaar hain) */
function buildSparkline(daily, dates, aISO, bISO, gran) {
  const buckets = new Map();
  if (gran === "year") {
    let d = new Date(toD(aISO).getFullYear(), toD(aISO).getMonth(), 1);
    const end = toD(bISO);
    while (d <= end) {
      buckets.set(isoOf(d).slice(0, 7), 0);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  } else {
    let d = toD(aISO);
    const end = toD(bISO);
    while (d <= end) { buckets.set(isoOf(d), 0); d = addD(d, 1); }
  }

  for (const dt of dates) {
    if (dt < aISO) continue;
    if (dt > bISO) break;
    const k = gran === "year" ? dt.slice(0, 7) : dt;
    if (buckets.has(k)) buckets.set(k, buckets.get(k) + daily.get(dt).amt);
  }
  return [...buckets.values()];
}

function Sparkline({ values, up }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 100, h = 28, step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={up ? "#10b981" : "#fb7185"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function ComparisonCards({ rows, refDate }) {
  const daily = useMemo(() => buildDailyIndex(rows), [rows]);
  const dates = useMemo(() => [...daily.keys()].sort(), [daily]);

  // aaj ki date nahi — data ki aakhri date. Warna stale data pe "This Week" hamesha ₹0.
  const anchor = useMemo(() => {
    const iso = refDate || dates[dates.length - 1];
    return iso ? toD(iso) : new Date();
  }, [refDate, dates]);

  const cards = useMemo(() => {
    const w = buildWindows(anchor);
    return [
      { label: "This Week vs Last Week",   win: w.week },
      { label: "This Month vs Last Month", win: w.month },
      { label: "This Year vs Last Year",   win: w.year },
    ].map(({ label, win }) => {
      const cur  = sumWindow(daily, dates, win.curA, win.curB);
      const prev = sumWindow(daily, dates, win.prevA, win.prevB);
      const pct = prev.amt > 0 ? ((cur.amt - prev.amt) / prev.amt) * 100 : cur.amt > 0 ? 100 : 0;

      const avgCur  = cur.inv  ? cur.amt  / cur.inv  : 0;
      const avgPrev = prev.inv ? prev.amt / prev.inv : 0;
      const avgPct = avgPrev > 0 ? ((avgCur - avgPrev) / avgPrev) * 100 : avgCur > 0 ? 100 : 0;

      const spark = buildSparkline(daily, dates, win.curA, win.curB, win.gran);
      return { label, win, cur, prev, pct, avgCur, avgPrev, avgPct, spark };
    });
  }, [daily, dates, anchor]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      {cards.map((c, i) => {
        const up = c.pct >= 0;
        const barPct = Math.min(100, Math.max(6, (c.cur.amt / (Math.max(c.cur.amt, c.prev.amt) || 1)) * 100));
        const avgUp = c.avgPct >= 0;
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
              <span className="text-xs text-slate-500">📍 {rangeLabel(c.win.curA, c.win.curB, c.win.gran)}</span>
              <span className="text-lg font-extrabold text-slate-900">{inrS(c.cur.amt)}</span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-1">
              <div className={`h-full rounded-full ${up ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${barPct}%` }} />
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-slate-400">{rangeLabel(c.win.prevA, c.win.prevB, c.win.gran)}</span>
              <span className="text-xs text-slate-400">{inrS(c.prev.amt)}</span>
            </div>

            <Sparkline values={c.spark} up={up} />

            <div className="flex items-center justify-between mt-2 mb-1">
              <span className="text-[11px] text-slate-500">Avg order value</span>
              <span className={`text-[11px] font-semibold ${avgUp ? "text-emerald-600" : "text-rose-500"}`}>
                {inrS(c.avgCur)} <span className="text-slate-400 font-normal">vs {inrS(c.avgPrev)}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">{c.cur.inv} vs {c.prev.inv} invoices · based on latest data date</p>
          </div>
        );
      })}
    </div>
  );
}
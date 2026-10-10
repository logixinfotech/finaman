// import { useNavigate } from "react-router-dom";
// import { useSalesSummary } from "../../Hooks/useSalesSummary";

// export default function SalesSummaryWidget() {
//   const { kpis, loading, error } = useSalesSummary();
//   const navigate = useNavigate();

//   return (
//     <div className="h-full bg-white rounded-xl border border-gray-100 p-3.5 flex flex-col">
//       <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Sales</p>
//       {loading ? (
//         <p className="text-xs text-gray-400">Loading…</p>
//       ) : error ? (
//         <p className="text-xs text-gray-400">{error}</p>
//       ) : !kpis ? (
//         <p className="text-xs text-gray-400">No data.</p>
//       ) : (
//         // TODO: kpis' real field names aren't known yet (fetchSalesKpis response
//         // shape not seen) — replace the keys below once confirmed. Rendering
//         // raw entries for now so the widget is usable immediately.
//         <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">
//           {Object.entries(kpis).slice(0, 4).map(([key, value]) => (
//             <Stat key={key} label={key} value={typeof value === "number" ? value.toLocaleString("en-IN") : value} />
//           ))}
//         </div>
//       )}
//       <button
//         onClick={() => navigate("/app?page=SalesDashboard")} // TODO: confirm Sales's appl_name
//         className="mt-3 text-[11.5px] font-semibold text-[#0f5c6e]"
//       >
//         Open Sales Dashboard →
//       </button>
//     </div>
//   );
// }
// const Stat = ({ label, value }) => (
//   <div className="min-w-0">
//     <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
//     <p className="text-[10px] text-gray-400 truncate capitalize">{label}</p>
//   </div>
// );
// components/Layout/HomeDashboard/SalesSummaryWidget.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowUp, FaArrowDown, FaRedo } from "react-icons/fa";
import { useSalesSummary } from "../../Hooks/useSalesSummary";

/* ---------- date range chips ---------- */
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

 const RANGES = [
  { key: "7d",  label: "7D",    get: () => { const t = new Date(), f = new Date(); f.setDate(t.getDate() - 6);  return { from_date: iso(f), to_date: iso(t) }; } },
  { key: "30d", label: "30D",   get: () => { const t = new Date(), f = new Date(); f.setDate(t.getDate() - 29); return { from_date: iso(f), to_date: iso(t) }; } },
  { key: "mtd", label: "Month", get: () => { const t = new Date(); return { from_date: iso(new Date(t.getFullYear(), t.getMonth(), 1)), to_date: iso(t) }; } },

  // Calendar year: 1 Jan se aaj tak
  { key: "ytd", label: "YTD",   get: () => { const t = new Date(); return { from_date: iso(new Date(t.getFullYear(), 0, 1)), to_date: iso(t) }; } },

  // Pichle 12 mahine (rolling)
  { key: "1y",  label: "1Y",    get: () => { const t = new Date(), f = new Date(); f.setFullYear(t.getFullYear() - 1); f.setDate(f.getDate() + 1); return { from_date: iso(f), to_date: iso(t) }; } },
];

/* ---------- formatting ---------- */
const inr = (n) => {
  const v = Math.abs(n);
  if (v >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
const num = (n) => Math.round(n).toLocaleString("en-IN");
const prettyLabel = (k) =>
  k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();

/* ---------- KPI auto-detection (field names unknown → match by name) ---------- */
const KPI_DEFS = [
  { label: "Net Sales",  re: /(net|total)?.*(sales|revenue|taxable|amt|amount)/i, money: true, hero: true },
  { label: "Invoices",   re: /(inv|invoice|bill|order)s?(_?count|_?no|$)/i },
  { label: "Customers",  re: /(cust|customer|party|parties)/i },
  { label: "Qty Sold",   re: /(qty|quantity|units)/i },
  { label: "Avg Invoice",re: /(avg|average|aov)/i, money: true },
];
const MONEY_RE = /(amt|amount|sales|revenue|value|taxable|gst|avg|aov|total)/i;

// value can be a number, a numeric string, or {value, change/delta/pct}
const readVal = (raw) => {
  if (raw && typeof raw === "object") {
    const v = raw.value ?? raw.total ?? raw.current;
    const d = raw.change ?? raw.delta ?? raw.pct ?? raw.growth;
    return { v: Number(v), delta: d != null ? Number(d) : null };
  }
  return { v: Number(raw), delta: null };
};

function buildTiles(kpis) {
  const entries = Object.entries(kpis || {})
    .map(([k, raw]) => ({ k, ...readVal(raw) }))
    .filter((e) => Number.isFinite(e.v));
  const used = new Set();
  const tiles = [];

  for (const def of KPI_DEFS) {
    const hit = entries.find((e) => !used.has(e.k) && def.re.test(e.k));
    if (hit) {
      used.add(hit.k);
      tiles.push({ ...hit, label: def.label, money: def.money ?? MONEY_RE.test(hit.k), hero: def.hero });
    }
    if (tiles.length === 4) break;
  }
  // fill remaining slots with whatever numeric keys are left
  for (const e of entries) {
    if (tiles.length >= 4) break;
    if (!used.has(e.k)) tiles.push({ ...e, label: prettyLabel(e.k), money: MONEY_RE.test(e.k) });
  }
  return tiles;
}

/* ---------- small pieces ---------- */
const Delta = ({ value }) => {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
      ${up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
      {up ? <FaArrowUp size={7} /> : <FaArrowDown size={7} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const Skeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-14 rounded-lg bg-gray-100" />
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-gray-100" />)}
    </div>
  </div>
);

/* ---------- widget ---------- */
export default function SalesSummaryWidget({ defaultRange = "30d" }) {
  const navigate = useNavigate();
  const [rangeKey, setRangeKey] = useState(defaultRange);

  // stable object identity → hook won't refetch on every render
  const initialRange = useMemo(
    () => (RANGES.find((r) => r.key === defaultRange) || RANGES[1]).get(),
    [defaultRange]
  );
  const { kpis, loading, error, refetch } = useSalesSummary();
  useEffect(() => {
  refetch?.(RANGES.find((r) => r.key === rangeKey).get());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // sirf mount par

  const pick = useCallback((r) => {
    setRangeKey(r.key);
    refetch?.(r.get());
  }, [refetch]);

  const tiles = useMemo(() => buildTiles(kpis), [kpis]);
  const [hero, ...rest] = tiles;
  const fmt = (t) => (t.money ? inr(t.v) : num(t.v));

  return (
    <div className="h-full flex flex-col gap-3">
      {/* range chips */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => pick(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                rangeKey === r.key ? "bg-white text-[#0f5c6e] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-gray-500">{String(error)}</p>
            <button onClick={() => refetch?.(RANGES.find((r) => r.key === rangeKey).get())}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0f5c6e]">
              <FaRedo size={9} /> Retry
            </button>
          </div>
        ) : !hero ? (
          <p className="h-full flex items-center justify-center text-xs text-gray-400">No sales data for this period.</p>
        ) : (
          <div className="space-y-3">
            {/* hero metric */}
            <div className="rounded-xl bg-gradient-to-br from-[#0f5c6e] to-[#177a91] text-white px-4 py-3">
              <p className="text-[10.5px] uppercase tracking-wide text-white/70 font-semibold">{hero.label}</p>
              <div className="flex items-end justify-between gap-2 mt-0.5">
                <p className="text-[26px] leading-tight font-bold truncate">{fmt(hero)}</p>
                {hero.delta != null && (
                  <span className="mb-1 text-[10px] font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                    {hero.delta >= 0 ? "▲" : "▼"} {Math.abs(hero.delta).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* secondary metrics */}
            <div className="grid grid-cols-3 gap-2">
              {rest.map((t) => (
                <div key={t.k} className="rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2 min-w-0">
                  <p className="text-[15px] font-bold text-gray-800 truncate">{fmt(t)}</p>
                  <p className="text-[10px] text-gray-400 truncate">{t.label}</p>
                  <Delta value={t.delta} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/app?page=SalesDashboard")}
        className="self-start text-[11.5px] font-semibold text-[#0f5c6e] hover:underline"
      >
        Open Sales Dashboard →
      </button>
    </div>
  );
}
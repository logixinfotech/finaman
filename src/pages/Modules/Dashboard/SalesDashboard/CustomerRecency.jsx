import { useMemo } from "react";

const ACTIVE_DAYS = 60;    // last order isse pehle = Active
const INACTIVE_DAYS = 180; // isse pehle (but 60+ din se) = Inactive; isse zyada = Lost

const BANDS = [
  { key: "Active", label: "Active", color: "bg-emerald-500", text: "text-emerald-700", test: (d) => d <= ACTIVE_DAYS },
  { key: "Inactive", label: "Inactive", color: "bg-amber-500", text: "text-amber-700", test: (d) => d > ACTIVE_DAYS && d <= INACTIVE_DAYS },
  { key: "Lost", label: "Lost", color: "bg-rose-500", text: "text-rose-700", test: (d) => d > INACTIVE_DAYS },
];

// NOTE: ACTIVE_DAYS/INACTIVE_DAYS starting defaults hain — client se exact
// definition confirm kar lena ("Active" kitne din tak, "Lost" kab se) aur yahi
// do numbers adjust kar dena.
export default function CustomerRecency({ hist, refDate }) {
  const bands = useMemo(() => {
    const ref = new Date(refDate);
    const withDays = (hist || []).map((h) => ({
      ...h,
      days: Math.floor((ref - new Date(h.last)) / (1000 * 60 * 60 * 24)),
    }));
    const total = withDays.length || 1;
    return BANDS.map((b) => {
      const inBand = withDays.filter((h) => b.test(h.days));
      return { ...b, count: inBand.length, pct: (inBand.length / total) * 100 };
    });
  }, [hist, refDate]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">⏱️ Customer Status — Active / Inactive / Lost</h4>
      <div className="space-y-3">
        {bands.map((b) => (
          <div key={b.key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${b.text}`}>{b.label}</span>
              <span className="text-xs text-slate-500">{b.count} customers · {b.pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.max(2, b.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useMemo } from "react";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { Hourglass } from "lucide-react";

// NOTE: same `qo`/`qd` assumption as FulfillmentByCustomer.jsx — pending
// qty = ordered - delivered. Adjust field names together in both files.
const EXPORT_COLS = [
  { key: "cust", label: "Customer" },
  { key: "qty",  label: "Pending Qty", type: "int" },
];
export default function PendingQtyByCustomer({ rows, n = 10 }) {
  const all = useMemo(() => {
    const byCust = {};
(rows || []).forEach((r) => {
  const pending = r.qb || 0;
  if (pending <= 0) return;
  byCust[r.cust] = (byCust[r.cust] || 0) + pending;
});
    const max = Math.max(1, ...Object.values(byCust));
    return Object.entries(byCust)
      .map(([cust, qty]) => ({ cust, qty, pct: (qty / max) * 100 }))
      .sort((a, b) => b.qty - a.qty);
  }, [rows]);
  const data = useMemo(() => all.slice(0, n), [all, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={Hourglass} accent="amber" title="Pending Qty by Customer" className="mb-4">
        <ExportMenu title="Pending Qty by Customer" columns={EXPORT_COLS} rows={all} />
      </SectionHeader>
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

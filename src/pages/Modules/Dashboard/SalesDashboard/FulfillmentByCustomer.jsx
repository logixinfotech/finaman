import { useMemo } from "react";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { CheckCircle2 } from "lucide-react";
const EXPORT_COLS = [
  { key: "cust",      label: "Customer" },
  { key: "ordered",   label: "Qty Ordered", type: "int" },
  { key: "delivered", label: "Qty Delivered", type: "int" },
  { key: (r) => r.ordered - r.delivered, label: "Qty Pending", type: "int" },
  { key: "pct",       label: "Fulfillment %", type: "pct" },
];
export default function FulfillmentByCustomer({ rows, n = 10 }) {
  const all = useMemo(() => {
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
      .sort((a, b) => a.pct - b.pct);
  }, [rows]);
  const data = useMemo(() => all.slice(0, n), [all, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={CheckCircle2} accent="emerald" title="Fulfillment % by Customer" className="mb-4">
        <ExportMenu title="Fulfillment by Customer" columns={EXPORT_COLS} rows={all} />
      </SectionHeader>
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

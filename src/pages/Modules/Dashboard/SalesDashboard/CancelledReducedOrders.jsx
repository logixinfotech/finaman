import { useMemo } from "react";
import { inrS } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { XCircle } from "lucide-react";
const EXPORT_COLS = [
  { key: "ord",    label: "Order No" },
  { key: "dt",     label: "Date", type: "date" },
  { key: "cust",   label: "Customer" },
  { key: "city",   label: "City" },
  { key: "item",   label: "Item" },
  { key: "status", label: "Status" },
  { key: "qo",     label: "Qty Ordered", type: "int" },
  { key: "amt",    label: "Amount (₹)", type: "num" },
];
export default function CancelledReducedOrders({ rows }) {
  const data = useMemo(() => {
    const flagged = (rows || []).filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s.includes("cancel") || s.includes("reduc");
    });
    const cancelled = flagged.filter((r) => (r.status || "").toLowerCase().includes("cancel"));
    const reduced = flagged.filter((r) => (r.status || "").toLowerCase().includes("reduc"));
    const lostAmt = flagged.reduce((s, r) => s + (r.amt || 0), 0);
    return { cancelled, reduced, lostAmt, flagged };
  }, [rows]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={XCircle} accent="rose" title="Cancelled / Reduced Orders" className="mb-4">
        <ExportMenu title="Cancelled Reduced Orders" columns={EXPORT_COLS} rows={data.flagged} />
      </SectionHeader>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-rose-50 p-3">
          <p className="text-[11px] font-semibold text-rose-700">Cancelled</p>
          <p className="text-xl font-extrabold text-rose-800">{data.cancelled.length}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-[11px] font-semibold text-amber-700">Reduced</p>
          <p className="text-xl font-extrabold text-amber-800">{data.reduced.length}</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-2">Value impacted: {inrS(data.lostAmt)}</p>
      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
        {data.flagged.slice(0, 20).map((r, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 text-[11px]">
            <span className="truncate text-slate-600">{r.cust} — {r.item}</span>
            <span className="text-slate-400">{inrS(r.amt)}</span>
          </div>
        ))}
        {!data.flagged.length && <p className="py-4 text-center text-xs text-slate-400">No cancelled/reduced orders in this range.</p>}
      </div>
    </div>
  );
}
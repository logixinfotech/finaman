import { useMemo } from "react";
import { inrS } from "../../../../utils/helpers";
import { buildPendingOrders } from "../../../../utils/orderHelpers";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { AlertTriangle } from "lucide-react";

const EXPORT_COLS = [
  { key: "ord",   label: "Order No" },
  { key: "dt",    label: "Order Date", type: "date" },
  { key: "cust",  label: "Customer" },
  { key: "city",  label: "City" },
  { key: "item",  label: "Item" },
  { key: (r) => (r.comple === "Y" ? "Completed" : "Pending"), label: "Status" },
  { key: "qo",    label: "Qty Ordered", type: "int" },
  { key: "qs",    label: "Qty Supplied", type: "int" },
  { key: "qb",    label: "Pending Qty", type: "int" },
  { key: "rate",  label: "Rate (₹)", type: "num" },
  { key: "amt",   label: "Amount (₹)", type: "num" },
  { key: "atRisk", label: "Value at Risk (₹)", type: "num" },
  { key: "openDays", label: "Open Days", type: "int" },
];
export default function CustomerWisePendingOrders({ rows, refDate }) {
  const pending = useMemo(() => buildPendingOrders(rows, refDate), [rows, refDate]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={AlertTriangle} accent="rose" title="Customer-wise Pending Orders" className="mb-4">
        <ExportMenu title="Customer-wise Pending Orders" columns={EXPORT_COLS} rows={pending} />
      </SectionHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3 text-right">Pending Qty</th>
              <th className="py-2 pr-3 text-right">Amount</th>
              <th className="py-2 pr-3 text-right">Open Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending.slice(0, 100).map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="py-1.5 pr-3 font-medium text-slate-700">{r.cust}</td>
                <td className="py-1.5 pr-3 text-slate-500">{r.item}</td>
                <td className="py-1.5 pr-3 text-slate-500">{r.comple === "Y" ? "Completed" : "Pending"}</td>
                <td className="py-1.5 pr-3 text-right text-amber-600 font-semibold">{Math.round(r.qb).toLocaleString("en-IN")}</td>
                <td className="py-1.5 pr-3 text-right text-slate-500">{inrS(r.amt)}</td>
                <td className="py-1.5 pr-3 text-right text-slate-400">{r.openDays}d</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!pending.length && <p className="py-6 text-center text-xs text-slate-400">No pending orders</p>}
      </div>
    </div>
  );
}
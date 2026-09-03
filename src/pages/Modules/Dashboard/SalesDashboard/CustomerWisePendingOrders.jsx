import { useMemo } from "react";
import { inrS } from "../../../../utils/helpers";
import { buildPendingOrders } from "../../../../utils/orderHelpers";

export default function CustomerWisePendingOrders({ rows, refDate }) {
  const pending = useMemo(() => buildPendingOrders(rows, refDate), [rows, refDate]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">🚨 Customer-wise Pending Orders</h4>
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
        {!pending.length && <p className="py-6 text-center text-xs text-slate-400">No pending orders 🎉</p>}
      </div>
    </div>
  );
}
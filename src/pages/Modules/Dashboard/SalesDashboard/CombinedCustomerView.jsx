import { useMemo, memo } from "react";
import { buildCombinedView } from "../../../../utils/orderHelpers";
import { inr } from "../../../../utils/helpers";

const STATUS_STYLE = {
  "Repeat": "bg-emerald-50 text-emerald-700",
  "New Customer": "bg-violet-50 text-violet-700",
  "No Current Order": "bg-slate-100 text-slate-500",
};
const ABC_STYLE = { A: "bg-emerald-50 text-emerald-700", B: "bg-amber-50 text-amber-700", C: "bg-slate-100 text-slate-500" };

function CombinedCustomerView({ rows, hist, abcMap, n = 300, onCustomerClick }) {
  const data = useMemo(() => buildCombinedView(rows, hist, abcMap).slice(0, n), [rows, hist, abcMap, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
        Combined Customer View — Current Orders vs Past Sales
      </h4>
      <p className="text-[11px] text-slate-400 mb-4">joined by customer ID · click a customer for drill-down (coming soon)</p>
      <div className="overflow-auto" style={{ maxHeight: 380 }}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-slate-400 text-[11px] uppercase tracking-wide border-b border-slate-100">
            <tr>
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">City / State</th>
              <th className="py-2 pr-3 text-right">Current Orders ₹</th>
              <th className="py-2 pr-3 text-right">Orders</th>
              <th className="py-2 pr-3 text-right">Past Sales ₹</th>
              <th className="py-2 pr-3 text-right">Past Invoices</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400">No data for current filters</td></tr>
            ) : (
              data.map((r, i) => (
                <tr key={r.custId} className="hover:bg-slate-50/60">
                  <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
             <td className="py-2 pr-3 truncate max-w-[220px]" title={r.cust}>
      <span
        onClick={() => onCustomerClick?.(r.custId)}
        className="cursor-pointer underline decoration-dotted decoration-violet-300 underline-offset-2 hover:text-indigo-600"
      >
        {r.cust}
      </span>
      {r.abc && (
        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${ABC_STYLE[r.abc]}`}>{r.abc}</span>
      )}
    </td>
                  <td className="py-2 pr-3 text-slate-500">{r.geo}</td>
                  <td className="py-2 pr-3 text-right font-semibold">{r.curAmt ? inr(r.curAmt) : "—"}</td>
                  <td className="py-2 pr-3 text-right">{r.orders || "—"}</td>
                  <td className="py-2 pr-3 text-right">{r.pastAmt ? inr(r.pastAmt) : "—"}</td>
                  <td className="py-2 pr-3 text-right">{r.pastInv || "—"}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(CombinedCustomerView);
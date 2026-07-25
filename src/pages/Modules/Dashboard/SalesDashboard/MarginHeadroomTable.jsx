import { useMemo, memo } from "react";
import { buildMarginHeadroom } from "../../../../utils/orderHelpers";

function MarginHeadroomTable({ rows, n = 200 }) {
  const data = useMemo(() => buildMarginHeadroom(rows, n), [rows, n]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Rate vs MRP Margin Headroom</h4>
      <p className="text-[11px] text-slate-400 mb-4">(MRP − rate) ÷ MRP · trade margin potential</p>
      <div className="overflow-auto" style={{ maxHeight: 300 }}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-slate-400 text-[11px] uppercase tracking-wide border-b border-slate-100">
            <tr>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3 text-right">Rate ₹</th>
              <th className="py-2 pr-3 text-right">MRP ₹</th>
              <th className="py-2 pr-3 text-right">Headroom %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No data for current filters</td></tr>
            ) : (
              data.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-2 pr-3 truncate max-w-[160px]" title={r.item}>{r.item}</td>
                  <td className="py-2 pr-3 truncate max-w-[160px]" title={r.cust}>{r.cust}</td>
                  <td className="py-2 pr-3 text-right">{r.rate.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right">{r.mrp.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right">
                    <b style={{ color: r.headroom >= 60 ? "#15803d" : r.headroom >= 40 ? "#b7791f" : "#d33636" }}>
                      {r.headroom.toFixed(1)}%
                    </b>
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

export default memo(MarginHeadroomTable);
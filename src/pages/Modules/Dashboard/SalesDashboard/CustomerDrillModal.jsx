import { useMemo, memo } from "react";
import { X } from "lucide-react";
import { ordersOf } from "../../../../utils/orderHelpers";
import { inr, dmy } from "../../../../utils/helpers";

function CustomerDrillModal({ custId, rows, hist, abcMap, onClose }) {
  const custRows = useMemo(
    () => rows.filter((r) => (r.custId ?? r.cust) === custId).sort((a, b) => (a.dt < b.dt ? -1 : 1)),
    [rows, custId]
  );
  const h = useMemo(() => hist.find((x) => x.custId === custId), [hist, custId]);
  const ords = useMemo(() => ordersOf(custRows), [custRows]);

  if (!custId || custRows.length === 0) return null;

  const cust = custRows[0].cust;
  const amt = custRows.reduce((s, r) => s + (r.amt || 0), 0);
  const qo = custRows.reduce((s, r) => s + (r.qo || 0), 0);
  const qs = custRows.reduce((s, r) => s + (r.qs || 0), 0);
  const qb = custRows.reduce((s, r) => s + (r.qb || 0), 0);
  const abc = abcMap?.[custId];

  const kpis = [
    ["Order Value", inr(amt)],
    ["Orders", ords.length],
    ["Qty Ordered", Math.round(qo).toLocaleString("en-IN")],
    ["Dispatched", Math.round(qs).toLocaleString("en-IN")],
    ["Balance", Math.round(qb).toLocaleString("en-IN")],
    ["Fulfillment", qo ? ((qs / qo) * 100).toFixed(1) + "%" : "—"],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-slate-900/55 p-4 pt-10 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-10 text-lg font-extrabold text-slate-900">{cust}</h2>
        <p className="mb-4 text-xs font-semibold text-slate-400">
          {h
            ? `${h.city} / ${h.state} · Past sales ${inr(h.amt)} (${h.inv} invoices, last ${dmy(h.last)})`
            : `${custRows[0].city || ""} / ${custRows[0].state || ""} · New customer — no past sales history`}
          {abc && <> · ABC Class: <b>{abc}</b></>}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map(([t, v]) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t}</div>
              <div className="mt-1 text-[15px] font-extrabold text-slate-800">{v}</div>
            </div>
          ))}
        </div>

        <div className="overflow-auto rounded-lg" style={{ maxHeight: 340 }}>
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-white text-slate-400 text-[10.5px] uppercase tracking-wide border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">Order No</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Group</th>
                <th className="py-2 pr-3 text-right">Ordered</th>
                <th className="py-2 pr-3 text-right">Dispatched</th>
                <th className="py-2 pr-3 text-right">Balance</th>
                <th className="py-2 pr-3 text-right">Rate ₹</th>
                <th className="py-2 pr-3 text-right">Value ₹</th>
                <th className="py-2 pr-3">Pay</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {custRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-2 pr-3">{r.ord}</td>
                  <td className="py-2 pr-3">{dmy(r.dt)}</td>
                  <td className="py-2 pr-3 truncate max-w-[160px]" title={r.item}>{r.item}</td>
                  <td className="py-2 pr-3">{r.grp}</td>
                  <td className="py-2 pr-3 text-right">{Math.round(r.qo).toLocaleString("en-IN")}</td>
                  <td className="py-2 pr-3 text-right">{Math.round(r.qs).toLocaleString("en-IN")}</td>
                  <td className="py-2 pr-3 text-right">
                    {r.qb ? <b className="text-rose-600">{Math.round(r.qb).toLocaleString("en-IN")}</b> : "0"}
                  </td>
                  <td className="py-2 pr-3 text-right">{r.rate?.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-semibold">{inr(r.amt)}</td>
                  <td className="py-2 pr-3">{r.pay}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.comple === "Y" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                      {r.comple === "Y" ? "Completed" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default memo(CustomerDrillModal);
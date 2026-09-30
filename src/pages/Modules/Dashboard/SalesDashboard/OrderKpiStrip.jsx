import { memo } from "react";
import {   inrS } from "../../../../utils/orderHelpers";

const CARDS = [
  { key: "amt",       label: "Order Value",     cls: "k1", fmt: (v) => inrS(v.amt) },
  { key: "orders",    label: "Orders",          cls: "k2", fmt: (v) => v.orders.toLocaleString("en-IN") },
  { key: "nCust",     label: "Customers",       cls: "k3", fmt: (v) => v.nCust.toLocaleString("en-IN") },
  { key: "qo",        label: "Qty Ordered",     cls: "k4", fmt: (v) => Math.round(v.qo).toLocaleString("en-IN") },
  { key: "qs",        label: "Dispatched Qty",  cls: "k7", fmt: (v) => Math.round(v.qs).toLocaleString("en-IN") },
  { key: "qb",        label: "Balance Qty",     cls: "k6", fmt: (v) => Math.round(v.qb).toLocaleString("en-IN") },
];

const GRAD = {
  k1: "from-violet-600 to-purple-400",
  k2: "from-blue-600 to-sky-400",
  k3: "from-emerald-600 to-green-400",
  k4: "from-cyan-600 to-teal-400",
  k7: "from-green-600 to-lime-400",
  k6: "from-rose-600 to-red-400",
};

function OrderKpiStrip({ summary, loading }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className={`rounded-xl bg-gradient-to-br ${GRAD[c.cls]} p-4 text-white shadow-sm`}
        >
          <div className="text-[10.5px] font-bold uppercase tracking-wide opacity-90">{c.label}</div>
          <div className="mt-1.5 text-xl font-extrabold">
            {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-white/30" /> : c.fmt(summary)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(OrderKpiStrip);
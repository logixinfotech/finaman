import { memo, useMemo } from "react";
import { IndianRupee, Receipt, Landmark, FileText, Users, Package } from "lucide-react";
import { inrS } from "../../../../utils/helpers";

const GRADIENTS = [
  "linear-gradient(130deg,#2f6fed,#5b8cff)",
  "linear-gradient(130deg,#0f9d58,#3fc97c)",
  "linear-gradient(130deg,#f59e0b,#fbc148)",
  "linear-gradient(130deg,#8b5cf6,#b18cff)",
  "linear-gradient(130deg,#0ea5b7,#3ecbdc)",
  "linear-gradient(130deg,#ec4899,#ff7ab8)",
];

function KpiStrip({ kpis, loading }) {
  const cards = useMemo(() => {
    const s = kpis || {};
    const avgInv = s.nInv ? s.amt / s.nInv : 0;
    return [
      { icon: IndianRupee, label: "Total Sales (Taxable)", value: inrS(s.amt || 0), sub: "Taxable value" },
      { icon: Receipt, label: "Invoice Value (incl. GST)", value: inrS(s.invAmt || 0), sub: "Net billed amount" },
      { icon: Landmark, label: "Total GST", value: inrS(s.gst || 0), sub: `${s.amt ? ((s.gst / s.amt) * 100).toFixed(1) : 0}% of sales` },
      { icon: FileText, label: "Invoices", value: (s.nInv || 0).toLocaleString("en-IN"), sub: `Avg ${inrS(avgInv)}` },
      { icon: Users, label: "Customers", value: (s.nCust || 0).toLocaleString("en-IN"), sub: `${s.nCity || 0} cities · ${s.nState || 0} states` },
      { icon: Package, label: "Qty Sold", value: (s.qty || 0).toLocaleString("en-IN"), sub: `${s.nProd || 0} products` },
    ];
  }, [kpis]);

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6 mb-6">
      {cards.map((c, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl p-4 text-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5"
          style={{ background: GRADIENTS[i] }}
        >
          <c.icon className="absolute -right-1 -top-1 h-[52px] w-[52px] opacity-[0.28]" strokeWidth={1.5} />
          <div className="relative text-[10.5px] font-bold uppercase tracking-wide text-white/90">{c.label}</div>
          {loading ? (
            <div className="relative mt-2 h-6 w-20 animate-pulse rounded bg-white/25" />
          ) : (
            <div className="relative mt-1.5 text-[22px] font-extrabold tracking-tight drop-shadow-sm">{c.value}</div>
          )}
          <p className="relative mt-1 text-[11.5px] font-medium text-white/85">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default memo(KpiStrip);
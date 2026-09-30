import { useMemo } from "react";
import { ordersOf } from "../../../../utils/orderHelpers";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { BarChart3 } from "lucide-react";

const EXPORT_COLS = [
  { key: "label", label: "Orders" },
  { key: "count", label: "Customers", type: "int" },
];
export default function OrderFrequencyDistribution({ rows }) {
  const data = useMemo(() => {
    const ords = ordersOf(rows);
    const countByCust = {};
    ords.forEach((o) => {
      countByCust[o.cust] = (countByCust[o.cust] || 0) + 1;
    });
    const freq = {};
    Object.values(countByCust).forEach((n) => {
      const key = n >= 6 ? "6+" : String(n);
      freq[key] = (freq[key] || 0) + 1;
    });
    const order = ["1", "2", "3", "4", "5", "6+"];
    const max = Math.max(1, ...order.map((k) => freq[k] || 0));
    return order.map((k) => ({ label: `${k} order${k === "1" ? "" : "s"}`, count: freq[k] || 0, max }));
  }, [rows]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={BarChart3} accent="indigo" title="Order Frequency Distribution" className="mb-4">
        <ExportMenu title="Order Frequency Distribution" columns={EXPORT_COLS} rows={data} />
      </SectionHeader>
      <div className="flex items-end gap-2" style={{ height: 220 }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-semibold text-slate-600">{d.count}</span>
            <div className="w-full rounded-t-md bg-indigo-500" style={{ height: `${Math.max(4, (d.count / d.max) * 170)}px` }} />
            <span className="text-[10px] text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
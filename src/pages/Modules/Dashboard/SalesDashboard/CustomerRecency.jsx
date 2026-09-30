import { useMemo } from "react";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";
import { Clock } from "lucide-react";
const ACTIVE_DAYS = 60;     
const INACTIVE_DAYS = 180; 
const BANDS = [
  { key: "Active", label: "Active", color: "bg-emerald-500", text: "text-emerald-700", test: (d) => d <= ACTIVE_DAYS },
  { key: "Inactive", label: "Inactive", color: "bg-amber-500", text: "text-amber-700", test: (d) => d > ACTIVE_DAYS && d <= INACTIVE_DAYS },
  { key: "Lost", label: "Lost", color: "bg-rose-500", text: "text-rose-700", test: (d) => d > INACTIVE_DAYS },
];
const EXPORT_COLS = [
  { key: "cust",   label: "Customer" },
  { key: "custId", label: "Customer ID" },
  { key: "city",   label: "City" },
  { key: "state",  label: "State" },
  { key: "status", label: "Status" },
  { key: "last",   label: "Last Order", type: "date" },
  { key: "days",   label: "Days Since", type: "int" },
  { key: "inv",    label: "Past Invoices", type: "int" },
  { key: "amt",    label: "Past Sales (₹)", type: "num" },
];
export default function CustomerRecency({ hist, refDate }) {
  const bands = useMemo(() => {
    const ref = new Date(refDate);
    const withDays = (hist || []).map((h) => ({
      ...h,
      days: Math.floor((ref - new Date(h.last)) / (1000 * 60 * 60 * 24)),
    }));
    const total = withDays.length || 1;
    return BANDS.map((b) => {
      const inBand = withDays.filter((h) => b.test(h.days));
      return { ...b, count: inBand.length, pct: (inBand.length / total) * 100 };
    });
  }, [hist, refDate]);

  /* export: one row per customer with its status — this is the Active / Lost list clients ask for */
  const exportRows = useMemo(() => {
    const ref = new Date(refDate);
    return (hist || [])
      .map((h) => {
        const days = Math.floor((ref - new Date(h.last)) / (1000 * 60 * 60 * 24));
        const band = BANDS.find((b) => b.test(days));
        return { cust: h.cust, custId: h.custId, city: h.city, state: h.state, last: h.last, days, inv: h.inv, amt: h.amt, status: band?.label || "" };
      })
      .sort((a, b) => a.days - b.days);
  }, [hist, refDate]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={Clock} accent="sky" title="Customer Status — Active / Inactive / Lost" className="mb-4">
        <ExportMenu title="Customer Status" columns={EXPORT_COLS} rows={exportRows} />
      </SectionHeader>
      <div className="space-y-3">
        {bands.map((b) => (
          <div key={b.key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${b.text}`}>{b.label}</span>
              <span className="text-xs text-slate-500">{b.count} customers · {b.pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.max(2, b.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
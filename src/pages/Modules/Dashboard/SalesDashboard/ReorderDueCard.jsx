import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { fetchReorderDue } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import { StatChip, ErrorNote, DenseTable, money, int, days } from "./CardBits";
import { dmy } from "../../../../utils/helpers";

/* Customers whose next order is expected soon (or is already late), from their own reorder rhythm. */
const EXPORT_COLS = [
  { key: "cust", label: "Customer" }, { key: "city", label: "City" }, { key: "state", label: "State" },
  { key: "status", label: "Status" },
  { key: "lastInv", label: "Last Invoice", type: "date" },
  { key: "daysSince", label: "Days Since", type: "int" },
  { key: "avgGap", label: "Usual Gap (days)", type: "int" },
  { key: "expectedIn", label: "Expected In (days)", type: "int" },
  { key: "orderDays", label: "Past Order Days", type: "int" },
  { key: "amt12m", label: "Sales Last 12M (₹)", type: "num" },
];
const TONE = { Overdue: "text-rose-700 bg-rose-50", "Due this week": "text-amber-700 bg-amber-50", Upcoming: "text-sky-700 bg-sky-50" };

export default function ReorderDueCard({ filters, setFilters }) {
  const params = useMemo(() => ({ ...filterParams(filters), from_date: undefined }), [filters]); // history-based: ignore from date
  const { data, loading, error, refetch } = useDashboardQuery(fetchReorderDue, params, !!filters?.to || !!filters?.from);
  const [status, setStatus] = useState("");
  const rows = useMemo(() => (data?.data || []).filter((r) => !status || r.status === status), [data, status]);
  const exportSpec = useMemo(() => ({ columns: EXPORT_COLS, rows, id: "reorder-due" }), [rows]);
  const onCust = setFilters ? (r) => setFilters((f) => ({ ...f, cust: f.cust === r.cust ? "" : r.cust })) : undefined;
  const s = data?.summary;

  return (
    <CardShell title="Due for Reorder" icon={CalendarClock} accent="amber" exportSpec={exportSpec}
      actions={<span className="hidden text-[10.5px] text-slate-400 sm:inline">from each customer's usual gap</span>}>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["Overdue", s.overdue, "rose"], ["Due this week", s.dueWeek, "amber"], ["Upcoming", s.upcoming, "sky"]].map(([l, v, t]) => (
              <button key={l} type="button" onClick={() => setStatus((x) => (x === l ? "" : l))} className={`text-left ${status === l ? "ring-2 ring-indigo-400 rounded-lg" : ""}`}>
                <StatChip label={l} value={int(v)} tone={t} />
              </button>
            ))}
            <StatChip label="Monthly value at risk" value={money(s.amtAtRisk)} sub="overdue customers, avg month" tone="slate" />
          </div>
          <DenseTable maxHeight={300} rows={rows.slice(0, 200)} onRowClick={onCust} rowKey={(r) => r.custId}
            emptyLabel="No customer is due in the window"
            cols={[
              { key: "cust", label: "Customer", render: (r) => <span className="font-medium text-slate-800">{r.cust}</span> },
              { key: "city", label: "City", cls: "text-slate-500" },
              { key: "status", label: "Status", render: (r) => <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${TONE[r.status]}`}>{r.status}</span> },
              { key: "lastInv", label: "Last order", render: (r) => dmy(r.lastInv) },
              { key: "avgGap", label: "Usual gap", align: "right", render: (r) => days(r.avgGap), cls: "text-slate-500" },
              { key: "expectedIn", label: "Expected", align: "right", render: (r) => (r.expectedIn < 0 ? <span className="font-semibold text-rose-600">{-r.expectedIn}d late</span> : `in ${r.expectedIn}d`) },
              { key: "amt12m", label: "Last 12M", align: "right", render: (r) => money(r.amt12m) },
            ]} />
          <p className="mt-1 text-[10.5px] text-slate-400">Customers with at least 3 order days and a usual gap under 180 days. {onCust && "Click a row to filter."}</p>
        </div>
      )}
    </CardShell>
  );
}

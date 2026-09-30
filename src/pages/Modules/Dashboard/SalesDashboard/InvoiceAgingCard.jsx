import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Hourglass } from "lucide-react";
import { fetchInvoiceAging } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import { StatChip, ErrorNote, DenseTable, Empty, money, int } from "./CardBits";

/* Invoice aging by customer — billing side. Not outstanding (no receipt data). */
const EXPORT_COLS = [
  { key: "cust", label: "Customer" }, { key: "city", label: "City" }, { key: "invoices", label: "Invoices", type: "int" },
  { key: "b0_30", label: "0–30 days (₹)", type: "num" }, { key: "b31_60", label: "31–60 days (₹)", type: "num" },
  { key: "b61_90", label: "61–90 days (₹)", type: "num" }, { key: "b90p", label: "90+ days (₹)", type: "num" },
  { key: "total", label: "Total (₹)", type: "num" }, { key: "oldestDays", label: "Oldest (days)", type: "int" },
];
const BUCKETS = [["b0_30", "0–30", "#10b981"], ["b31_60", "31–60", "#f59e0b"], ["b61_90", "61–90", "#fb923c"], ["b90p", "90+", "#f43f5e"]];

export default function InvoiceAgingCard({ filters, setFilters }) {
  const params = useMemo(() => filterParams(filters), [filters]);
  const { data, loading, error, refetch } = useDashboardQuery(fetchInvoiceAging, params, !!filters?.from);
  const t = data?.totals;
  const rows = data?.data || [];
  const chart = { labels: BUCKETS.map((b) => b[1] + " days"), datasets: [{ data: BUCKETS.map((b) => t?.[b[0]] || 0), backgroundColor: BUCKETS.map((b) => b[2]), borderColor: "#fff", borderWidth: 2 }] };
  const opts = { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { boxWidth: 9, usePointStyle: true, pointStyle: "circle", font: { size: 10.5, weight: "600" }, color: "#64748b" } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${money(c.parsed)}` } } } };
  const exportSpec = useMemo(() => ({ columns: EXPORT_COLS, rows, id: "invoice-aging" }), [rows]);
  const onRow = setFilters ? (r) => setFilters((x) => ({ ...x, cust: x.cust === r.cust ? "" : r.cust })) : undefined;
  const cell = (k) => ({ key: k, align: "right", render: (r) => (r[k] ? money(r[k]) : <span className="text-slate-300">—</span>) });

  return (
    <CardShell title="Invoice Aging" icon={Hourglass} accent="amber" exportSpec={exportSpec}
      actions={<span className="hidden text-[10.5px] text-slate-400 sm:inline">billed value by invoice age{data?.refDate ? ` · as of ${data.refDate.split("-").reverse().join("-")}` : ""}</span>}>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <StatChip label="Total billed" value={money(t.total)} sub={`${int(t.invoices)} invoices`} tone="slate" />
                <StatChip label="Over 60 days" value={money(t.b61_90 + t.b90p)} sub={t.total ? `${(((t.b61_90 + t.b90p) / t.total) * 100).toFixed(0)}% of billed` : ""} tone={t.b90p ? "rose" : "amber"} />
              </div>
              <div style={{ height: 160 }}>{t.total ? <Doughnut data={chart} options={opts} /> : <Empty />}</div>
            </div>
            <div className="min-w-0 xl:col-span-3">
              <DenseTable maxHeight={260} rows={rows.slice(0, 200)} onRowClick={onRow} rowKey={(r) => r.custId}
                cols={[
                  { key: "cust", label: "Customer", render: (r) => <span className="font-medium text-slate-800">{r.cust}</span> },
                  { ...cell("b0_30"), label: "0–30" }, { ...cell("b31_60"), label: "31–60" },
                  { ...cell("b61_90"), label: "61–90" }, { ...cell("b90p"), label: "90+", cls: "text-rose-600 font-semibold" },
                  { key: "total", label: "Total", align: "right", render: (r) => money(r.total) },
                ]} />
            </div>
          </div>
          <p className="mt-1 text-[10.5px] text-slate-400">Shows how old billed amounts are. Unpaid / outstanding needs receipt data and is not included.</p>
        </div>
      )}
    </CardShell>
  );
}

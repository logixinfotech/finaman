import { useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { fetchFreeQty } from "../../../../utils/api";
import { useDashboardQuery, filterParams } from "./useDashboardQuery";
import { CardShell } from "./ChartCards";
import { StatChip, ErrorNote, DenseTable, money, int, pct1 } from "./CardBits";

/* Free-quantity (scheme) analysis. Scheme value = free qty x selling rate of the same line. */
const CUST_COLS = [
  { key: "cust", label: "Customer" }, { key: "city", label: "City" },
  { key: "billedQty", label: "Billed Qty", type: "int" }, { key: "freeQty", label: "Free Qty", type: "int" },
  { key: "freePct", label: "Free %", type: "pct" }, { key: "freeValue", label: "Scheme Value (₹)", type: "num" }, { key: "salesAmt", label: "Sales (₹)", type: "num" },
];
const PROD_COLS = [
  { key: "item", label: "Product" }, { key: "grp", label: "Group" },
  { key: "billedQty", label: "Billed Qty", type: "int" }, { key: "freeQty", label: "Free Qty", type: "int" },
  { key: "freePct", label: "Free %", type: "pct" }, { key: "freeValue", label: "Scheme Value (₹)", type: "num" },
];

export default function FreeQtyCard({ filters, setFilters }) {
  const params = useMemo(() => filterParams(filters), [filters]);
  const { data, loading, error, refetch } = useDashboardQuery(fetchFreeQty, params, !!filters?.from);
  const [view, setView] = useState("cust");
  const t = data?.totals;
  const rows = view === "cust" ? data?.byCustomer || [] : data?.byProduct || [];
  const cols = view === "cust" ? CUST_COLS : PROD_COLS;
  const exportSpec = useMemo(() => ({ columns: cols, rows, id: "free-qty" }), [cols, rows]);
  const onRow = setFilters ? (r) => setFilters((f) => (view === "cust" ? { ...f, cust: f.cust === r.cust ? "" : r.cust } : { ...f, item: f.item === r.item ? "" : r.item })) : undefined;

  return (
    <CardShell title="Free Qty / Schemes" icon={Gift} accent="violet" exportSpec={exportSpec}
      actions={
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
          {[["cust", "Customers"], ["prod", "Products"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setView(k)} className={`rounded-md px-2.5 py-1 transition-colors ${view === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
          ))}
        </div>
      }>
      <ErrorNote error={error} onRetry={refetch} />
      {!data && loading && <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : ""}>
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatChip label="Free qty" value={int(t.freeQty)} sub={`${pct1(t.freePct)} of billed`} tone="violet" />
            <StatChip label="Scheme value" value={money(t.freeValue)} sub="free qty × rate" tone="violet" />
            <StatChip label="Invoices with free" value={int(t.invoicesWithFree)} tone="slate" />
            <StatChip label="Customers" value={int(t.customersWithFree)} sub="received free qty" tone="slate" />
          </div>
          <DenseTable maxHeight={260} rows={rows} onRowClick={onRow} rowKey={(r) => r.custId || r.item} emptyLabel="No free quantity in this range"
            cols={[
              { key: view === "cust" ? "cust" : "item", label: view === "cust" ? "Customer" : "Product", render: (r) => <span className="font-medium text-slate-800">{view === "cust" ? r.cust : r.item}</span> },
              { key: view === "cust" ? "city" : "grp", label: view === "cust" ? "City" : "Group", cls: "text-slate-500" },
              { key: "billedQty", label: "Billed", align: "right", render: (r) => int(r.billedQty) },
              { key: "freeQty", label: "Free", align: "right", render: (r) => <span className="text-violet-700">{int(r.freeQty)}</span> },
              { key: "freePct", label: "%", align: "right", render: (r) => pct1(r.freePct) },
              { key: "freeValue", label: "Value", align: "right", render: (r) => money(r.freeValue) },
            ]} />
        </div>
      )}
    </CardShell>
  );
}

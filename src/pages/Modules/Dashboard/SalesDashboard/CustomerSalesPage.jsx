import { useMemo, useState, useEffect, useCallback } from "react";
import { useOrderDashboard } from "../../../../Hooks/useOrderDashboard";
import FiltersBar from "./FiltersBar";
import OrderKpiStrip from "./OrderKpiStrip";
import IndiaSalesMap from "./IndiaSalesMap";
import { SwitchBarChart, TopBarChart, GroupMixChart } from "./ChartCards";
import GenericAnalysis from "./GenericAnalysis";
import MarginHeadroomTable from "./MarginHeadroomTable";
import ParetoChart from "./ParetoChart";
import CombinedCustomerView from "./CombinedCustomerView";
import CustomerDrillModal from "./CustomerDrillModal";
import LazySection from "./LazySection";
import { applyOrderFilters, summarizeOrders, ordersOf, buildAOV } from "../../../../utils/orderHelpers";
import { exportRows, rangeSuffix } from "./exportUtils";
import Toaster from "./Toaster";
import { ExportRegistryProvider } from "./ExportRegistry";
import { AlertCircle, Inbox } from "lucide-react";

const PAGE_PX = "px-3 sm:px-4 lg:px-6 xl:px-8";
const PAGE_MAX = "mx-auto max-w-[1600px]";

const EXPORT_COLS = [
  { key: "ord",  label: "Order No" },
  { key: "dt",   label: "Date", type: "date" },
  { key: "cust", label: "Customer" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "item", label: "Item" },
  { key: "gen",  label: "Generic" },
  { key: "grp",  label: "Group" },
  { key: "qo",   label: "Qty Ordered", type: "int" },
  { key: "qs",   label: "Qty Supplied", type: "int" },
  { key: "qb",   label: "Balance", type: "int" },
  { key: "rate", label: "Rate (₹)", type: "num" },
  { key: "amt",  label: "Amount (₹)", type: "num" },
  { key: "pay",  label: "Pay Terms" },
  { key: (r) => (r.comple === "Y" ? "Completed" : "Pending"), label: "Status" },
];
function CustomerSalesPageInner() {
  const {
    rows, hist, filterLists, loading, error, lastFetched, refetch,
  } = useOrderDashboard();

  const [filters, setFilters] = useState({
    state: "", city: "", cust: "", grp: "", item: "", gen: "",
    orderStatus: "", payTerms: "", from: "", to: "",
  });

  const [abcMap, setAbcMap] = useState({});
  const [selectedCustId, setSelectedCustId] = useState(null);

  /* Date bounds come from ORDER rows (not sales) — this page shows order data,
     and the order date range can differ from the sales range. */
  const dateBounds = useMemo(() => {
    if (!rows.length) return { min: "", max: "" };
    const dates = rows.map((r) => r.dt).filter(Boolean).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [rows]);

  useEffect(() => {
    if (dateBounds.min && !filters.from) {
      setFilters((f) => ({ ...f, from: dateBounds.min, to: dateBounds.max }));
    }
  }, [dateBounds.min]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => applyOrderFilters(rows, filters), [rows, filters]);

  // ordersOf computed once — summary, AOV and charts all reuse it (it ran 6 times before)
  const ords = useMemo(() => ordersOf(filtered), [filtered]);
  const summary = useMemo(() => summarizeOrders(filtered), [filtered]);
  const aov = useMemo(() => buildAOV(filtered, 10, ords), [filtered, ords]);

  const refDate = useMemo(() => {
    const dates = [...rows.map((r) => r.dt), ...hist.map((h) => h.last)].filter(Boolean).sort();
    return dates[dates.length - 1] || dateBounds.max || new Date().toISOString().slice(0, 10);
  }, [rows, hist, dateBounds.max]);

  const handleRefresh = useCallback(() => {
    refetch(filters.from ? { from_date: filters.from, to_date: filters.to } : undefined);
  }, [refetch, filters.from, filters.to]);

  /* format: "csv" | "xlsx" — passed by the FiltersBar export menu */
  const exportCsv = useCallback((format = "csv") => {
    if (!filtered.length) return;
    exportRows({ format, name: `customer_sales${rangeSuffix(filters)}`, sheet: "Customer Sales", columns: EXPORT_COLS, rows: filtered });
  }, [filtered, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const showEmpty = !loading && !error && rows.length > 0 && filtered.length === 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-12">
      <Toaster />
      <div className={`sticky top-0 z-30 bg-slate-50/95 pb-2 pt-2 backdrop-blur sm:pt-3 ${PAGE_PX}`}>
        <div className={PAGE_MAX}>
          <FiltersBar
            title="Customer Sales"
            filters={filters}
            setFilters={setFilters}
            filterLists={filterLists}
            rows={rows}
            dateBounds={dateBounds}
            recordCount={filtered.length}
            lastFetched={lastFetched}
            loading={loading}
            onRefresh={handleRefresh}
            onExport={exportCsv}
            tab="custsales"
          />
        </div>
      </div>

      <div className={`w-full pt-2 ${PAGE_PX}`}>
        <div className={PAGE_MAX}>
          {error && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-start">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" strokeWidth={2.5} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-800">Unable to load data</p>
                <p className="mt-0.5 break-words text-[13px] text-rose-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
              >
                Retry
              </button>
            </div>
          )}

          <OrderKpiStrip summary={summary} loading={loading} />

          {showEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16">
              <Inbox className="h-9 w-9 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-500">No records match the current filters</p>
              <p className="text-xs text-slate-400">Adjust the filters or press Reset</p>
            </div>
          ) : (
            <>
              {/* Row 1: map + top customers (By Value / By Qty switch) */}
              <LazySection minHeight={380}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2 [&>*]:min-w-0">
                  <IndiaSalesMap rows={filtered} filters={filters} setFilters={setFilters} />
                  <SwitchBarChart
                    accent="indigo"
                    views={[
                      { key: "val", label: "By Value", title: "Top Customers by Order Value", rows: ords, keyFn: (o) => o.cust, valFn: (o) => o.amt, n: 10 },
                      { key: "qty", label: "By Qty",   title: "Top Customers by Order Qty",   rows: ords, keyFn: (o) => o.cust, valFn: (o) => o.qo,  n: 10, accent: "sky",
                        valueFormatter: (v) => Math.round(v).toLocaleString("en-IN") + " units" },
                    ]}
                  />
                </div>
              </LazySection>

              {/* Row 2: products + group mix + payment terms mix */}
              <LazySection minHeight={320}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3 [&>*]:min-w-0">
                  <TopBarChart title="Top Products by Value" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.amt} n={8} />
                  <GroupMixChart rows={filtered} />
                  <GroupMixChart rows={filtered} keyFn={(r) => r.pay || "Not Specified"} title="Payment Terms Mix" />
                </div>
              </LazySection>

              <LazySection minHeight={420}>
                <div className="mb-4 min-w-0">
                  <GenericAnalysis rows={filtered} />
                </div>
              </LazySection>

              <LazySection minHeight={340}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2 [&>*]:min-w-0">
                  <TopBarChart title="Average Order Value by Customer" rows={aov} keyFn={(r) => r.cust} valFn={(r) => r.aov} n={10} height={340} />
                  <MarginHeadroomTable rows={filtered} />
                </div>
              </LazySection>

              <LazySection minHeight={400}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3 [&>*]:min-w-0">
                  <div className="lg:col-span-1">
                    <ParetoChart rows={filtered} onClassed={setAbcMap} />
                  </div>
                  <div className="min-w-0 lg:col-span-2">
                    <CombinedCustomerView
                      rows={filtered} hist={hist} abcMap={abcMap}
                      onCustomerClick={setSelectedCustId}
                    />
                  </div>
                </div>
              </LazySection>
            </>
          )}
        </div>
      </div>

      {selectedCustId && (
        <CustomerDrillModal
          custId={selectedCustId}
          rows={filtered}
          hist={hist}
          abcMap={abcMap}
          onClose={() => setSelectedCustId(null)}
        />
      )}
    </div>
  );
}

/* Own export registry so the FiltersBar "All charts" export works on this page too. */
export default function CustomerSalesPage(props) {
  return (
    <ExportRegistryProvider>
      <CustomerSalesPageInner {...props} />
    </ExportRegistryProvider>
  );
}

import { useMemo, useState, useEffect, useCallback } from "react";
import { useOrderDashboard } from "../../../../Hooks/useOrderDashboard";
import FiltersBar from "./FiltersBar";
import CustomerRecency from "./CustomerRecency";
import ReorderDueCard from "./ReorderDueCard";
import RepeatOrderAnalysis from "./RepeatOrderAnalysis";
import OrderFrequencyDistribution from "./OrderFrequencyDistribution";
import DailyOrderTrend from "./DailyOrderTrend";
import CancelledReducedOrders from "./CancelledReducedOrders";
import DormantLostCustomers from "./DormantLostCustomers";
import LazySection from "./LazySection";
import { applyOrderFilters } from "../../../../utils/orderHelpers";
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
  { key: "amt",  label: "Amount (₹)", type: "num" },
  { key: "pay",  label: "Pay Terms" },
  { key: (r) => (r.comple === "Y" ? "Completed" : "Pending"), label: "Status" },
  { key: "cancelDt", label: "Cancelled On", type: "date" },
];
function OrderPatternPageInner() {
  const {
    rows, hist, filterLists, loading, error, lastFetched, refetch,
  } = useOrderDashboard();

  const [filters, setFilters] = useState({
    state: "", city: "", cust: "", grp: "", item: "", gen: "",
    orderStatus: "", payTerms: "", from: "", to: "",
  });

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
    exportRows({ format, name: `order_pattern${rangeSuffix(filters)}`, sheet: "Order Pattern", columns: EXPORT_COLS, rows: filtered });
  }, [filtered, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const showEmpty = !loading && !error && rows.length > 0 && filtered.length === 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-12">
      <Toaster />
      <div className={`sticky top-0 z-30 bg-slate-50/95 pb-2 pt-2 backdrop-blur sm:pt-3 ${PAGE_PX}`}>
        <div className={PAGE_MAX}>
          <FiltersBar
            title="Order Pattern"
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
            tab="pattern"
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

          {showEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16">
              <Inbox className="h-9 w-9 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-500">No records match the current filters</p>
              <p className="text-xs text-slate-400">Adjust the filters or press Reset</p>
            </div>
          ) : (
            <>
              <LazySection minHeight={380}>
                <div className="mb-4"><ReorderDueCard filters={filters} setFilters={setFilters} /></div>
              </LazySection>

              <LazySection minHeight={400}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2 [&>*]:min-w-0">
                  <CustomerRecency hist={hist} refDate={refDate} />
                  <RepeatOrderAnalysis rows={filtered} />
                </div>
              </LazySection>

              <LazySection minHeight={340}>
                <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3 [&>*]:min-w-0">
                  <OrderFrequencyDistribution rows={filtered} />
                  <DailyOrderTrend rows={filtered} />
                  <CancelledReducedOrders rows={filtered} />
                </div>
              </LazySection>

              <LazySection minHeight={420}>
                <div className="mb-4 min-w-0">
                  <DormantLostCustomers hist={hist} refDate={refDate} />
                </div>
              </LazySection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Own export registry so the FiltersBar "All charts" export works on this page too. */
export default function OrderPatternPage(props) {
  return (
    <ExportRegistryProvider>
      <OrderPatternPageInner {...props} />
    </ExportRegistryProvider>
  );
}

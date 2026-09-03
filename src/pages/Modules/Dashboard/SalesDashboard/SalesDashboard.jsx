import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSalesDashboard } from "../../../../Hooks/useSalesDashboard";
import { useOrderDashboard } from "../../../../Hooks/useOrderDashboard";
import { useSalesSummary } from "../../../../Hooks/useSalesSummary";
import FiltersBar from "./FiltersBar";
import KpiStrip from "./KpiStrip";
import { TabNav, CustomerSalesTab, OrderPatternTab, FulfillmentTab } from "./TabNav";
import ComparisonCards from "./ComparisonCards";
import IndiaSalesMap from "./IndiaSalesMap";
import { TopBarChart, StateBarChart, TrendChart, GroupMixChart } from "./ChartCards";
import PeriodReport from "./PeriodReport";
import { InvoiceRegisterTable, CustomerRankingTable } from "./Tables";
import LazySection from "./LazySection";
import AIInsights from "./AIInsights";
import { applyFilters } from "../../../../utils/helpers";
import { applyOrderFilters } from "../../../../utils/orderHelpers";
import { MapPin, Users, Package, ShoppingBag, AlertCircle, Inbox } from "lucide-react";

const PAGE_PX = "px-3 sm:px-4 lg:px-6 xl:px-8";
const SUMMARY_DEBOUNCE_MS = 300;

export default function SalesDashboard() {
  const { rows, filterLists, loading, error, lastFetched, refetch } = useSalesDashboard();
  const [activeTab, setActiveTab] = useState("sales");

  // Order data sirf tab pehli baar khulne pe fetch hota hai — mount pe 3 API calls bach gaye
  const [ordersEnabled, setOrdersEnabled] = useState(false);
  const {
    rows: orderRows, hist, filterLists: orderFilterLists,
    loading: orderLoading, error: orderError,
    lastFetched: orderLastFetched, refetch: refetchOrders,
  } = useOrderDashboard({}, ordersEnabled);

  const { kpis, loading: kpisLoading, error: kpisError, refetch: refetchSummary } = useSalesSummary();

  const [showInsights, setShowInsights] = useState(false);

  const handleTabChange = useCallback((key) => {
    if (key !== "sales") setOrdersEnabled(true);
    setActiveTab(key);
  }, []);

  const dateBounds = useMemo(() => {
    if (!rows.length) return { min: "", max: "" };
    const dates = rows.map((r) => r.dt).filter(Boolean).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [rows]);

  const [filters, setFilters] = useState({
    state: "", city: "", cust: "", grp: "", item: "",
    orderStatus: "", payTerms: "", from: "", to: "",
  });

  useEffect(() => {
    if (dateBounds.min && !filters.from) {
      setFilters((f) => ({ ...f, from: dateBounds.min, to: dateBounds.max }));
    }
  }, [dateBounds.min]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Summary refetch — sirf sales-relevant fields pe. orderStatus/payTerms se
     trigger hota tha jabki /kpis wo params leta hi nahi. Plus debounce, warna
     har keystroke pe 3 parallel calls. */
  const summaryTimer = useRef(null);
  useEffect(() => {
    if (!filters.from) return;
    clearTimeout(summaryTimer.current);
    summaryTimer.current = setTimeout(() => {
      refetchSummary({
        from_date: filters.from,
        to_date: filters.to,
        state: filters.state || undefined,
        city: filters.city || undefined,
        cust: filters.cust || undefined,
        grp: filters.grp || undefined,
        item: filters.item || undefined,
      });
    }, SUMMARY_DEBOUNCE_MS);
    return () => clearTimeout(summaryTimer.current);
  }, [
    filters.from, filters.to, filters.state, filters.city,
    filters.cust, filters.grp, filters.item, refetchSummary,
  ]);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const filteredOrders = useMemo(() => applyOrderFilters(orderRows, filters), [orderRows, filters]);

  const refDate = useMemo(() => {
    const dates = [...orderRows.map((r) => r.dt), ...hist.map((h) => h.last)].filter(Boolean).sort();
    return dates[dates.length - 1] || dateBounds.max || new Date().toISOString().slice(0, 10);
  }, [orderRows, hist, dateBounds.max]);

  const isSales = activeTab === "sales";
  const activeFilterLists = isSales ? filterLists : orderFilterLists;
  const activeRows = isSales ? rows : orderRows;
  const activeError = isSales ? (error || kpisError) : orderError;
  const activeCount = isSales ? filtered.length : filteredOrders.length;

  // Refresh ab current date range preserve karta hai — pehle 6-month default pe reset ho jaata tha
  const handleRefresh = useCallback(() => {
    const range = filters.from ? { from_date: filters.from, to_date: filters.to } : undefined;
    if (isSales) {
      refetch(range);
      refetchSummary({ from_date: filters.from, to_date: filters.to });
    } else {
      refetchOrders(range);
    }
  }, [isSales, filters.from, filters.to, refetch, refetchOrders, refetchSummary]);

  const exportCsv = useCallback(() => {
    const isS = activeTab === "sales";
    const data = isS ? filtered : filteredOrders;
    if (!data.length) return;

    const header = isS
      ? ["Doc Type", "Invoice", "Date", "Customer", "City", "State", "Item", "Group", "Qty", "Taxable Amt", "GST", "Invoice Amt"]
      : ["Order No", "Date", "Customer", "City", "Item", "Group", "Qty Ordered", "Qty Supplied", "Balance", "Amount", "Status"];

    const pick = isS
      ? (r) => [r.docType || "Sales", r.inv, r.dt, r.cust, r.city, r.state, r.item, r.grp, r.qty, r.amt, r.gst, r.invAmt]
      : (r) => [r.ord, r.dt, r.cust, r.city, r.item, r.grp, r.qo, r.qs, r.qb, r.amt, r.comple === "Y" ? "Completed" : "Pending"];

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header.map(esc).join(","), ...data.map((r) => pick(r).map(esc).join(","))].join("\r\n");

    // \uFEFF BOM — iske bina Excel me Hindi/special chars toot jaate hain
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isS ? "sales" : "orders"}_${filters.from || "all"}_to_${filters.to || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTab, filtered, filteredOrders, filters.from, filters.to]);

  const showEmpty = isSales && !loading && !error && rows.length > 0 && filtered.length === 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-12">
      <div className={`sticky top-0 z-30 space-y-2 bg-slate-50/95 pb-2 pt-2 backdrop-blur sm:pt-3 ${PAGE_PX}`}>
        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          filterLists={activeFilterLists}
          rows={activeRows}
          dateBounds={dateBounds}
          recordCount={activeCount}
          lastFetched={isSales ? lastFetched : orderLastFetched}
          loading={isSales ? loading : orderLoading}
          onRefresh={handleRefresh}
          onExport={exportCsv}
          tab={activeTab}
          showInsights={showInsights}
          onToggleInsights={isSales ? () => setShowInsights((v) => !v) : undefined}
        />
        <TabNav active={activeTab} onChange={handleTabChange} />
      </div>

      <div className={`w-full pt-3 sm:pt-4 ${PAGE_PX}`}>
        {activeError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-start">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-800">Unable to load data</p>
              <p className="mt-0.5 break-words text-[13px] text-rose-600">{activeError}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
            >
              Retry
            </button>
          </div>
        )}

        {isSales && (
          <>
            <KpiStrip kpis={kpis} loading={kpisLoading} />
            <ComparisonCards rows={filtered} refDate={dateBounds.max} />

            {showInsights && (
              <AIInsights rows={filtered} onClose={() => setShowInsights(false)} />
            )}

            {showEmpty ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16">
                <Inbox className="h-9 w-9 text-slate-300" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-slate-500">Current filters se koi record nahi mila</p>
                <p className="text-xs text-slate-400">Filters adjust karo ya Reset dabao</p>
              </div>
            ) : (
              <>
                <LazySection minHeight={400}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <IndiaSalesMap rows={filtered} filters={filters} setFilters={setFilters} />
                    <TopBarChart title="Top Cities by Sales" rows={filtered} keyFn={(r) => r.city || "Unknown"} valFn={(r) => r.amt} n={10} accent="rose" icon={MapPin} />
                    <StateBarChart rows={filtered} />
                  </div>
                </LazySection>

                <LazySection minHeight={340}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <TopBarChart title="Top 10 Customers" rows={filtered} keyFn={(r) => r.cust} valFn={(r) => r.amt} n={10} accent="emerald" icon={Users} />
                    <TopBarChart title="Top 10 Products" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.amt} n={10} accent="teal" icon={Package} />
                  </div>
                </LazySection>

                <LazySection minHeight={340}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <TrendChart rows={filtered} />
                    <GroupMixChart rows={filtered} />
                    <TopBarChart
                      title="Top Products by Qty" rows={filtered}
                      keyFn={(r) => r.item} valFn={(r) => r.qty} n={10}
                      accent="sky" icon={ShoppingBag}
                      valueFormatter={(v) => Math.round(v).toLocaleString("en-IN")}
                    />
                  </div>
                </LazySection>

                <LazySection minHeight={400}>
                  <div className="mb-5"><PeriodReport rows={filtered} /></div>
                </LazySection>

                <LazySection minHeight={500}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <InvoiceRegisterTable rows={filtered} />
                    </div>
                    <CustomerRankingTable rows={filtered} />
                  </div>
                </LazySection>
              </>
            )}
          </>
        )}

        {activeTab === "custsales" && (
          <CustomerSalesTab rows={filteredOrders} hist={hist} refDate={refDate} loading={orderLoading} filters={filters} setFilters={setFilters} />
        )}
        {activeTab === "pattern" && (
          <OrderPatternTab filters={filters} rows={filteredOrders} hist={hist} refDate={refDate} loading={orderLoading} />
        )}
        {activeTab === "fulfillment" && (
          <FulfillmentTab filters={filters} rows={filteredOrders} refDate={refDate} loading={orderLoading} />
        )}
      </div>
    </div>
  );
}
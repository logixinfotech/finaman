import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSalesDashboard } from "../../../../Hooks/useSalesDashboard";
import { useOrderDashboard } from "../../../../Hooks/useOrderDashboard";
import { useSalesSummary, useAgentPerformance } from "../../../../Hooks/useSalesSummary";
import FiltersBar from "./FiltersBar";
import KpiStrip from "./KpiStrip";
import { CustomerSalesTab, OrderPatternTab, FulfillmentTab } from "./TabNav";
import ComparisonCards from "./ComparisonCards";
import IndiaSalesMap from "./IndiaSalesMap";
import { SwitchBarChart, TrendChart, GroupMixChart } from "./ChartCards";
import PeriodReport from "./PeriodReport";
import { InvoiceRegisterTable, CustomerRankingTable } from "./Tables";
import LazySection from "./LazySection";
import AIInsights from "./AIInsights";
import { applyFilters } from "../../../../utils/helpers";
import { applyOrderFilters } from "../../../../utils/orderHelpers";
import { MapPin, Users, Package, ShoppingBag, AlertCircle, Inbox } from "lucide-react";
import AgentPerformance from "./AgentPerformance";
import ReturnsCard from "./ReturnsCard";
import FreeQtyCard from "./FreeQtyCard";
import InvoiceAgingCard from "./InvoiceAgingCard";
import DispatchStatusCard from "./DispatchStatusCard";
import { ExportRegistryProvider } from "./ExportRegistry";
import Toaster from "./Toaster";
import { exportRows, rangeSuffix } from "./exportUtils";
const PAGE_PX = "px-3 sm:px-4 lg:px-6 xl:px-8";

/* ---- URL <-> state. Filters and the active tab live in the query string, so a
   filtered view can be bookmarked / shared and survives a page refresh.
   Only non-empty values are written; "from"/"to" are dropped when they equal
   the data bounds (the default range) to keep links short. ---- */
const EMPTY_FILTERS = {
  state: "", city: "", cust: "", grp: "", item: "",
  orderStatus: "", payTerms: "", from: "", to: "",
};
const URL_FILTER_KEYS = Object.keys(EMPTY_FILTERS);
const TAB_KEYS = new Set(["sales", "custsales", "pattern", "fulfillment", "agents"]);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function readUrlState() {
  const out = { filters: { ...EMPTY_FILTERS }, tab: "sales" };
  if (typeof window === "undefined") return out;
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of URL_FILTER_KEYS) {
      const v = p.get(k);
      if (v == null) continue;
      if ((k === "from" || k === "to") && !ISO_DAY.test(v)) continue;
      out.filters[k] = v.slice(0, 300);
    }
    const t = p.get("tab");
    if (t && TAB_KEYS.has(t)) out.tab = t;
  } catch { /* malformed URL — fall back to defaults */ }
  return out;
}

function writeUrlState(filters, tab, dateBounds) {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of URL_FILTER_KEYS) {
      let v = filters[k];
      if ((k === "from" && v === dateBounds.min) || (k === "to" && v === dateBounds.max)) v = "";
      if (v) p.set(k, v); else p.delete(k);
    }
    if (tab && tab !== "sales") p.set("tab", tab); else p.delete("tab");
    const qs = p.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  } catch { /* history API unavailable — ignore */ }
}
const SUMMARY_DEBOUNCE_MS = 300;

/* raw-row export (FiltersBar "Export" button) */
const SALES_EXPORT_COLS = [
  { key: (r) => r.docType || "Sales", label: "Doc Type" },
  { key: "inv",   label: "Invoice" },
  { key: "dt",    label: "Date", type: "date" },
  { key: "cust",  label: "Customer" },
  { key: "city",  label: "City" },
  { key: "state", label: "State" },
  { key: "item",  label: "Item" },
  { key: "grp",   label: "Group" },
  { key: "qty",   label: "Qty", type: "int" },
  { key: "amt",   label: "Taxable Amt (₹)", type: "num" },
  { key: "gst",   label: "GST (₹)", type: "num" },
  { key: "invAmt", label: "Invoice Amt (₹)", type: "num" },
];
const ORDER_EXPORT_COLS = [
  { key: "ord",  label: "Order No" },
  { key: "dt",   label: "Date", type: "date" },
  { key: "cust", label: "Customer" },
  { key: "city", label: "City" },
  { key: "item", label: "Item" },
  { key: "grp",  label: "Group" },
  { key: "qo",   label: "Qty Ordered", type: "int" },
  { key: "qs",   label: "Qty Supplied", type: "int" },
  { key: "qb",   label: "Balance", type: "int" },
  { key: "amt",  label: "Amount (₹)", type: "num" },
  { key: (r) => (r.comple === "Y" ? "Completed" : "Pending"), label: "Status" },
];

export default function SalesDashboard() {
  const { rows, filterLists, loading, error, lastFetched, refetch } = useSalesDashboard();
  const [initialUrl] = useState(readUrlState);        // read once on mount
  const [activeTab, setActiveTab] = useState(initialUrl.tab);
  const [ordersEnabled, setOrdersEnabled] = useState(!["sales", "agents"].includes(initialUrl.tab));
  const {
    rows: orderRows, hist, filterLists: orderFilterLists,
    loading: orderLoading, error: orderError,
    lastFetched: orderLastFetched, refetch: refetchOrders,
  } = useOrderDashboard({}, ordersEnabled);

  const { kpis, loading: kpisLoading, error: kpisError, refetch: refetchSummary } = useSalesSummary(); 
  const [agentsEnabled, setAgentsEnabled] = useState(initialUrl.tab === "agents");
  const agentPerf = useAgentPerformance(agentsEnabled);
  const [showInsights, setShowInsights] = useState(false);

  const handleTabChange = useCallback((key) => {
    if (key === "agents") setAgentsEnabled(true);
    else if (key !== "sales") setOrdersEnabled(true);
    setActiveTab(key);
  }, []);

  const dateBounds = useMemo(() => {
    if (!rows.length) return { min: "", max: "" };
    const dates = rows.map((r) => r.dt).filter(Boolean).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [rows]);

  const [filters, setFilters] = useState(initialUrl.filters);

  useEffect(() => {
    if (dateBounds.min && !filters.from) {
      setFilters((f) => ({ ...f, from: dateBounds.min, to: dateBounds.max }));
    }
  }, [dateBounds.min]); // eslint-disable-line react-hooks/exhaustive-deps

  /* keep the URL in sync (replaceState — no history entries, no navigation) */
  useEffect(() => {
    writeUrlState(filters, activeTab, dateBounds);
  }, [filters, activeTab, dateBounds.min, dateBounds.max]); // eslint-disable-line react-hooks/exhaustive-deps
 
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
     const activeError = isSales
    ? (error || kpisError)
    : activeTab === "agents"
      ? agentPerf.error
      : orderError;
  const activeCount = isSales ? filtered.length : filteredOrders.length;
  const handleRefresh = useCallback(() => {
    const range = filters.from ? { from_date: filters.from, to_date: filters.to } : undefined;
    if (isSales) {
      refetch(range);
      refetchSummary({ from_date: filters.from, to_date: filters.to });
    } else if (activeTab === "agents") {
      agentPerf.refetch({ from_date: filters.from, to_date: filters.to });
    } else {
      refetchOrders(range);
    }
  }, [isSales, activeTab, filters.from, filters.to, refetch, refetchOrders, refetchSummary, agentPerf.refetch]);
  /* format: "csv" | "xlsx" — the FiltersBar menu passes it; the old CSV path is the default */
  const exportRaw = useCallback((format = "csv") => {
    const isS = activeTab === "sales";
    const data = isS ? filtered : filteredOrders;
    if (!data.length) return;
    exportRows({
      format,
      name: `${isS ? "sales" : "orders"}${rangeSuffix(filters)}`,
      sheet: isS ? "Sales" : "Orders",
      columns: isS ? SALES_EXPORT_COLS : ORDER_EXPORT_COLS,
      rows: data,
    });
  }, [activeTab, filtered, filteredOrders, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const showEmpty = isSales && !loading && !error && rows.length > 0 && filtered.length === 0; 
  const agentTimer = useRef(null);
  useEffect(() => {
    if (!agentsEnabled || !filters.from) return;
    clearTimeout(agentTimer.current);
    agentTimer.current = setTimeout(() => {
      agentPerf.refetch({
        from_date: filters.from,
        to_date: filters.to,
        state: filters.state || undefined,
        city: filters.city || undefined,
        cust: filters.cust || undefined,
        grp: filters.grp || undefined,
        item: filters.item || undefined,
      });
    }, SUMMARY_DEBOUNCE_MS);
    return () => clearTimeout(agentTimer.current);
  }, [
    agentsEnabled, filters.from, filters.to, filters.state,
    filters.city, filters.cust, filters.grp, filters.item, agentPerf.refetch,
  ]); 
  return (
    <ExportRegistryProvider>
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-12">
      <Toaster />
   <div className={`sticky top-0 z-30 bg-slate-50/95 py-1.5 backdrop-blur ${PAGE_PX}`}>
  <div className="mx-auto max-w-[1600px]">
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
          onExport={exportRaw}
          tab={activeTab}
          showInsights={showInsights}
          onToggleInsights={isSales ? () => setShowInsights((v) => !v) : undefined}
        />
     </div>
      </div>

      <div className={`mx-auto w-full max-w-[1600px] pt-2 ${PAGE_PX}`}>
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
                <p className="text-sm font-semibold text-slate-500">No records match the current filters</p>
                <p className="text-xs text-slate-400">Adjust the filters or press Reset</p>
              </div>
            ) : (
              <>
                {/* Row 1: map + geography (Cities / States switch) */}
                <LazySection minHeight={400}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <IndiaSalesMap rows={filtered} filters={filters} setFilters={setFilters} />
                    <SwitchBarChart
                      icon={MapPin}
                      accent="rose"
                      filters={filters}
                      setFilters={setFilters}
                      views={[
                        { key: "city",  label: "Cities", title: "Top Cities by Sales", rows: filtered, keyFn: (r) => r.city || "Unknown",  valFn: (r) => r.amt, n: 10, exportKeyLabel: "City", filterKey: "city" },
                        { key: "state", label: "States", title: "State-wise Sales",    rows: filtered, keyFn: (r) => r.state || "Unknown", valFn: (r) => r.amt, n: 12, accent: "sky", exportKeyLabel: "State", filterKey: "state" },
                      ]}
                    />
                  </div>
                </LazySection>

                {/* Row 2: ranking (Customers / Products ₹ / Products Qty switch) + trend + group mix */}
                <LazySection minHeight={340}>
                  {/* 2 : 2 : 1 — ranking and trend need width for labels; the doughnut does not */}
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
                    <div className="min-w-0 lg:col-span-2">
                    <SwitchBarChart
                      icon={Users}
                      accent="emerald"
                      filters={filters}
                      setFilters={setFilters}
                      views={[
                        { key: "cust", label: "Customers", title: "Top 10 Customers",  rows: filtered, keyFn: (r) => r.cust, valFn: (r) => r.amt, n: 10, exportKeyLabel: "Customer", filterKey: "cust" },
                        { key: "prod", label: "Products",  title: "Top 10 Products",   rows: filtered, keyFn: (r) => r.item, valFn: (r) => r.amt, n: 10, accent: "teal", icon: Package, exportKeyLabel: "Product", filterKey: "item" },
                        { key: "qty",  label: "By Qty",    title: "Top Products by Qty", rows: filtered, keyFn: (r) => r.item, valFn: (r) => r.qty, n: 10, accent: "sky", icon: ShoppingBag, exportKeyLabel: "Product", filterKey: "item",
                          valueFormatter: (v) => Math.round(v).toLocaleString("en-IN") },
                      ]}
                    />
                    </div>
                    <div className="min-w-0 lg:col-span-2"><TrendChart rows={filtered} /></div>
                    <div className="min-w-0 lg:col-span-1"><GroupMixChart rows={filtered} /></div>
                  </div>
                </LazySection>

                <LazySection minHeight={400}>
                  <div className="mb-5"><PeriodReport rows={filtered} /></div>
                </LazySection>

                {/* Row 4: server-aggregated analysis — returns, schemes (side by side only on very wide screens) */}
                <LazySection minHeight={420}>
                  <div className="mb-5 grid grid-cols-1 gap-3 2xl:grid-cols-2">
                    <ReturnsCard filters={filters} setFilters={setFilters} />
                    <FreeQtyCard filters={filters} setFilters={setFilters} />
                  </div>
                </LazySection>

                {/* Row 5: aging + dispatch completeness */}
                <LazySection minHeight={420}>
                  <div className="mb-5 grid grid-cols-1 gap-3 2xl:grid-cols-2">
                    <InvoiceAgingCard filters={filters} setFilters={setFilters} />
                    <DispatchStatusCard filters={filters} setFilters={setFilters} />
                  </div>
                </LazySection>

                <LazySection minHeight={500}>
                  <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                   <div className="min-w-0 lg:col-span-2">
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
          <OrderPatternTab filters={filters} setFilters={setFilters} rows={filteredOrders} hist={hist} refDate={refDate} loading={orderLoading} />
        )}
        {activeTab === "fulfillment" && (
          <FulfillmentTab filters={filters} setFilters={setFilters} rows={filteredOrders} refDate={refDate} loading={orderLoading} />
        )}
                {activeTab === "agents" && (
          <AgentPerformance
            data={agentPerf.data}
            totals={agentPerf.totals}
            months={agentPerf.months}
            unassigned={agentPerf.unassigned}
            loading={agentPerf.loading}
            error={agentPerf.error}
            filters={filters}
          />
        )}
      </div>
    </div>
    </ExportRegistryProvider>
  );
}

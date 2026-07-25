import { useMemo, useState, useEffect } from "react";
import { useSalesDashboard } from "../../../../Hooks/useSalesDashboard";
import { useOrderDashboard } from "../../../../Hooks/useOrderDashboard";
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
import { MapPin, Users, Package, ShoppingBag } from "lucide-react";
const PAGE_PX = "px-3 sm:px-4 lg:px-6 xl:px-8";

export default function SalesDashboard() {
  const { rows, filterLists, loading, error, lastFetched, refetch } = useSalesDashboard();
  const {
    rows: orderRows, hist, filterLists: orderFilterLists,
    loading: orderLoading, lastFetched: orderLastFetched, refetch: refetchOrders,
  } = useOrderDashboard();

  const [activeTab, setActiveTab] = useState("sales");

  const dateBounds = useMemo(() => {
    if (!rows.length) return { min: "", max: "" };
    const dates = rows.map((r) => r.dt).sort();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateBounds.min]);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const filteredOrders = useMemo(() => applyOrderFilters(orderRows, filters), [orderRows, filters]);

  const refDate = useMemo(() => {
    const dates = [...orderRows.map((r) => r.dt), ...hist.map((h) => h.last)].filter(Boolean).sort();
    return dates[dates.length - 1] || new Date().toISOString().slice(0, 10);
  }, [orderRows, hist]);

  const activeFilterLists = activeTab === "sales" ? filterLists : orderFilterLists;
  const activeRows = activeTab === "sales" ? rows : orderRows;

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ["Invoice", "Date", "Customer", "City", "State", "Item", "Group", "Qty", "Amount", "GST", "Invoice Amt"];
    const lines = filtered.map((r) =>
      [r.inv, r.dt, r.cust, r.city, r.state, r.item, r.grp, r.qty, r.amt, r.gst, r.invAmt]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-12">
      <div className={`sticky top-0 z-20 space-y-2 bg-slate-50/95 backdrop-blur pb-2 pt-2 sm:pt-3 ${PAGE_PX}`}>
        <FiltersBar
          filters={filters} setFilters={setFilters} filterLists={activeFilterLists} rows={activeRows} dateBounds={dateBounds}
          recordCount={activeTab === "sales" ? filtered.length : filteredOrders.length}
          lastFetched={activeTab === "sales" ? lastFetched : orderLastFetched}
          loading={activeTab === "sales" ? loading : orderLoading}
          onRefresh={() => (activeTab === "sales" ? refetch() : refetchOrders())}
          onExport={exportCsv}
          tab={activeTab}
        />
        <TabNav active={activeTab} onChange={setActiveTab} />
      </div>
      <div className={`w-full pt-3 sm:pt-4 ${PAGE_PX}`}>
        {activeTab === "sales" && (
          <>
            <KpiStrip rows={filtered} loading={loading} />
            <ComparisonCards rows={rows} />
            <AIInsights rows={filtered} />

            <LazySection minHeight={400}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
                <IndiaSalesMap rows={filtered} filters={filters} setFilters={setFilters} />
                <TopBarChart title="Top Cities by Sales" rows={filtered} keyFn={(r) => r.city || "Unknown"} valFn={(r) => r.amt} n={10} accent="rose" icon={MapPin} />
                <StateBarChart rows={filtered} />
              </div>
            </LazySection>

            <LazySection minHeight={340}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 mb-5">
                <TopBarChart title="Top 10 Customers" rows={filtered} keyFn={(r) => r.cust} valFn={(r) => r.amt} n={10} accent="emerald" icon={Users} />
                <TopBarChart title="Top 10 Products" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.amt} n={10} accent="teal" icon={Package} />
              </div>
            </LazySection>

            <LazySection minHeight={340}>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
  <TrendChart rows={filtered} />
  <GroupMixChart rows={filtered} />
  <TopBarChart title="Top Products by Qty" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.qty} n={10} accent="sky" icon={ShoppingBag} />
</div>
            </LazySection>

            <LazySection minHeight={400}>
              <div className="mb-5"><PeriodReport rows={filtered} /></div>
            </LazySection>

     <LazySection minHeight={500}>
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
    <div className="lg:col-span-2">
      <InvoiceRegisterTable rows={filtered} />
    </div>
    <CustomerRankingTable rows={filtered} />
  </div>
</LazySection>
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
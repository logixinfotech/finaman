import { useMemo, useState, useEffect } from "react";
import { useSalesDashboard } from "../../../../Hooks/useSalesDashboard";
import FiltersBar from "./FiltersBar";
import KpiStrip from "./KpiStrip";
import ComparisonCards from "./ComparisonCards";
import IndiaSalesMap from "./IndiaSalesMap";
import { TopBarChart, StateBarChart, TrendChart, GroupMixChart } from "./ChartCards";
import PeriodReport from "./PeriodReport";
import { InvoiceRegisterTable, CustomerRankingTable } from "./Tables";
import LazySection from "./LazySection";
import AIInsights from "./AIInsights";
import { applyFilters } from "../../../../utils/helpers";

export default function SalesDashboard() {
  const { rows, filterLists, loading, error, lastFetched, refetch } = useSalesDashboard();

  const dateBounds = useMemo(() => {
    if (!rows.length) return { min: "", max: "" };
    const dates = rows.map((r) => r.dt).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [rows]);

  const [filters, setFilters] = useState({ state: "", city: "", cust: "", grp: "", item: "", from: "", to: "" });

  useEffect(() => {
    if (dateBounds.min && !filters.from) {
      setFilters((f) => ({ ...f, from: dateBounds.min, to: dateBounds.max }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateBounds.min]);

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

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
  <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-16">
    {/* Sticky filter bar - no gap from top */}
    <div className="sticky top-0 z-20 bg-slate-50/50 backdrop-blur px-4 sm:px-6 lg:px-8 2xl:px-10 pt-0">
      <FiltersBar
        filters={filters} setFilters={setFilters} filterLists={filterLists} rows={rows} dateBounds={dateBounds}
        recordCount={filtered.length} lastFetched={lastFetched} loading={loading}
        onRefresh={() => refetch()} onExport={exportCsv}
      />
    </div>

    <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-10 pt-4 sm:pt-6 lg:pt-8">
      <KpiStrip rows={filtered} loading={loading} />
      <ComparisonCards rows={rows} />

      <AIInsights rows={filtered} />

        <LazySection minHeight={400}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
            <IndiaSalesMap rows={filtered} filters={filters} setFilters={setFilters} />
            <TopBarChart title="Top Cities by Sales" rows={filtered} keyFn={(r) => r.city || "Unknown"} valFn={(r) => r.amt} n={10} />
            <StateBarChart rows={filtered} />
          </div>
        </LazySection>

        <LazySection minHeight={340}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-6">
            <TopBarChart title="Top 10 Customers" rows={filtered} keyFn={(r) => r.cust} valFn={(r) => r.amt} n={10} />
            <TopBarChart title="Top 10 Products" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.amt} n={10} />
          </div>
        </LazySection>

        <LazySection minHeight={340}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
            <TrendChart rows={filtered} />
            <GroupMixChart rows={filtered} />
            <TopBarChart title="Top Products by Qty" rows={filtered} keyFn={(r) => r.item} valFn={(r) => r.qty} n={10} />
          </div>
        </LazySection>

        <LazySection minHeight={400}>
          <PeriodReport rows={filtered} />
        </LazySection>

        <LazySection minHeight={500}>
          <InvoiceRegisterTable rows={filtered} />
        </LazySection>

        <LazySection minHeight={400}>
          <CustomerRankingTable rows={filtered} />
        </LazySection>
      </div>
    </div>
  );
}

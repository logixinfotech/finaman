import { useMemo, useState , memo } from "react";
import IndiaSalesMap from "./IndiaSalesMap";
import OrderKpiStrip from "./OrderKpiStrip";
import MarginHeadroomTable from "./MarginHeadroomTable";
import ParetoChart from "./ParetoChart";
import CombinedCustomerView from "./CombinedCustomerView";
import CustomerDrillModal from "./CustomerDrillModal";
import { TopBarChart, GroupMixChart } from "./ChartCards";

import LazySection from "./LazySection";

import { summarizeOrders, ordersOf, buildAOV } from "../../../../utils/orderHelpers";



/* ============ TAB DEFINITIONS ============ */
const TABS = [
  { key: "sales", label: "Sales Register", icon: "📄" },
  { key: "custsales", label: "Customer Sales", icon: "📊" },
  { key: "pattern", label: "Order Pattern", icon: "🔁" },
  { key: "fulfillment", label: "Fulfillment", icon: "🚚" },
];

function TabNavBase({ active, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            active === t.key
              ? "border-transparent bg-indigo-600 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>{t.icon}</span> {t.label}
        </button>
      ))}
    </div>
  );
}
const TabNav = memo(TabNavBase);

/* ============ SKELETON PRIMITIVES ============ */
function PlaceholderCard({ title, height = 280, span = "" }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${span}`}>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">{title}</h4>
      <div className="animate-pulse rounded-lg bg-slate-100" style={{ height }} />
    </div>
  );
}

function PlaceholderKpiStrip({ n = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function PlaceholderInsights() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">✨ AI Insights</h4>
      <div className="h-16 animate-pulse rounded-lg bg-slate-100 mb-3" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
 function CustomerSalesTab({ rows, hist, refDate, loading, filters, setFilters }) {
  const summary = useMemo(() => summarizeOrders(rows), [rows]);
  const ords = useMemo(() => ordersOf(rows), [rows]);
  const aov = useMemo(() => buildAOV(rows, 10), [rows]);
  const [abcMap, setAbcMap] = useState({});
  const [selectedCustId, setSelectedCustId] = useState(null);

  return (
    <div>
      <OrderKpiStrip summary={summary} loading={loading} />

      <LazySection minHeight={380}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
          <IndiaSalesMap rows={rows} filters={filters} setFilters={setFilters} />
          <TopBarChart title="Top Customers by Order Value" rows={ords} keyFn={(o) => o.cust} valFn={(o) => o.amt} n={10} />
          <TopBarChart
            title="Top Customers by Order Qty"
            rows={ords} keyFn={(o) => o.cust} valFn={(o) => o.qo} n={10}
            valueFormatter={(v) => Math.round(v).toLocaleString("en-IN") + " units"}
          />
        </div>
      </LazySection>

      <LazySection minHeight={320}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
          <TopBarChart title="Top Products by Value" rows={rows} keyFn={(r) => r.item} valFn={(r) => r.amt} n={8} />
          <GroupMixChart rows={rows} />
          <GroupMixChart rows={rows} keyFn={(r) => r.pay || "Not Specified"} title="Payment Terms Mix" />
        </div>
      </LazySection>

      <LazySection minHeight={340}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 mb-5">
          <TopBarChart title="Average Order Value by Customer" rows={aov} keyFn={(r) => r.cust} valFn={(r) => r.aov} n={10} height={340} />
          <MarginHeadroomTable rows={rows} />
        </div>
      </LazySection>

      <LazySection minHeight={400}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 mb-5">
          <div className="lg:col-span-1">
            <ParetoChart rows={rows} onClassed={setAbcMap} />
          </div>
          <div className="lg:col-span-2">
            <CombinedCustomerView rows={rows} hist={hist} abcMap={abcMap} onCustomerClick={setSelectedCustId} />
          </div>
        </div>
      </LazySection>

      {selectedCustId && (
        <CustomerDrillModal
          custId={selectedCustId}
          rows={rows}
          hist={hist}
          abcMap={abcMap}
          onClose={() => setSelectedCustId(null)}
        />
      )}
    </div>
  );
}
function OrderPatternTab({ filters }) {
  return (
    <div>
      <PlaceholderKpiStrip n={4} />
      <PlaceholderInsights />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-6">
        <PlaceholderCard title="⏱️ Customer Recency — 30/60/90 Days" height={360} />
        <PlaceholderCard title="🔁 Repeat Order Analysis" height={360} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <PlaceholderCard title="📊 Order Frequency Distribution" />
        <PlaceholderCard title="📈 Daily Order Trend" />
        <PlaceholderCard title="❌ Cancelled / Reduced Orders" />
      </div>
      <PlaceholderCard title="💤 Dormant / Lost Customer List" height={400} />
    </div>
  );
}

/* ============ TAB: FULFILLMENT (6.3) ============ */
function FulfillmentTab({ filters }) {
  return (
    <div>
      <PlaceholderKpiStrip n={4} />
      <PlaceholderInsights />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <PlaceholderCard title="🎯 Order Status" />
        <PlaceholderCard title="✅ Fulfillment % by Customer" />
        <PlaceholderCard title="⏳ Pending Qty by Customer" />
      </div>
      <PlaceholderCard title="🚨 Customer-wise Pending Orders" height={420} />
    </div>
  );
}

export { TABS, TabNav, CustomerSalesTab, OrderPatternTab, FulfillmentTab };
export default TabNav;
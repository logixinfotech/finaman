import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip } from "chart.js";
import { TrendingUp } from "lucide-react";
import { ordersOf } from "../../../../utils/orderHelpers";
import { inrS } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";
import SectionHeader from "./SectionHeader";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

/* Auto granularity: the wider the date range, the coarser the buckets.
   Title follows the bucket so it never says "Daily" for a two-year range. */
const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function granularityOf(dates) {
  if (!dates.length) return "day";
  const days = (new Date(dates[dates.length - 1]) - new Date(dates[0])) / 86400000;
  return days <= 62 ? "day" : days <= 400 ? "week" : "month";
}
function keyOf(dt, gran) {
  if (gran === "month") return dt.slice(0, 7);
  if (gran === "week") {
    const [y, m, d] = dt.split("-").map(Number);
    const x = new Date(y, m - 1, d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  return dt;
}
function labelOf(k, gran) {
  if (gran === "month") { const [y, m] = k.split("-"); return `${MN[+m - 1]} ${y.slice(2)}`; }
  const [, m, d] = k.split("-");
  return gran === "week" ? `Wk ${d}/${m}` : `${d}/${m}`;
}
const TITLE = { day: "Daily Order Trend", week: "Weekly Order Trend", month: "Monthly Order Trend" };
const COL   = { day: "Date", week: "Week Starting", month: "Month" };

export default function DailyOrderTrend({ rows }) {
  const { points, gran } = useMemo(() => {
    const ords = ordersOf(rows);
    const dates = [...new Set(ords.map((o) => o.dt).filter(Boolean))].sort();
    const gran = granularityOf(dates);
    const buckets = {};
    ords.forEach((o) => {
      if (!o.dt) return;
      const k = keyOf(o.dt, gran);
      if (!buckets[k]) buckets[k] = { count: 0, amt: 0 };
      buckets[k].count += 1;
      buckets[k].amt += o.amt || 0;
    });
    const points = Object.keys(buckets).sort().map((k) => ({ date: k, ...buckets[k] }));
    return { points, gran };
  }, [rows]);

  const exportCols = useMemo(() => [
    { key: "date",  label: COL[gran], type: gran === "month" ? "text" : "date" },
    { key: "count", label: "Orders", type: "int" },
    { key: "amt",   label: "Order Value (₹)", type: "num" },
  ], [gran]);

  const data = {
    labels: points.map((p) => labelOf(p.date, gran)),
    datasets: [{
      data: points.map((p) => p.amt),
      borderColor: "#6366f1",
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return "transparent";
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, "#6366f133");
        g.addColorStop(1, "#6366f100");
        return g;
      },
      fill: true, tension: 0.4, borderWidth: 2.5,
      pointRadius: gran === "day" ? 0 : 3, pointHoverRadius: 5,
      pointHoverBackgroundColor: "#fff", pointHoverBorderColor: "#6366f1", pointHoverBorderWidth: 2.5,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a", titleFont: { size: 11, weight: "700" }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8, displayColors: false,
        callbacks: { label: (c) => [`${points[c.dataIndex]?.count} orders`, inrS(c.parsed.y)] },
      },
    },
    scales: {
      y: { ticks: { callback: (v) => inrS(v), font: { size: 10.5 }, color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10.5 }, color: "#94a3b8" } },
    },
  };

  const totalOrders = points.reduce((s, p) => s + p.count, 0);
  const totalAmt    = points.reduce((s, p) => s + p.amt, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader icon={TrendingUp} accent="violet" title={TITLE[gran]} className="mb-4">
        <span className="hidden text-[10.5px] text-slate-400 sm:inline">{points.length} {gran === "day" ? "days" : gran === "week" ? "weeks" : "months"}</span>
        <ExportMenu title={TITLE[gran]} id="order-trend" columns={exportCols} rows={points} />
      </SectionHeader>
      {points.length ? (
        <>
          <div style={{ height: 200 }}><Line data={data} options={options} /></div>
          <p className="mt-2 text-[11px] text-slate-500">{totalOrders.toLocaleString("en-IN")} orders · {inrS(totalAmt)} total</p>
        </>
      ) : (
        <p className="text-xs text-slate-400">No order data in this range.</p>
      )}
    </div>
  );
}

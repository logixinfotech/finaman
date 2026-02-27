import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
} from "chart.js";
import "./KPICard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

function KPICard({
  title,
  value,
  trend,
  description,
  subMetrics = [],
  data = [],
  color = "#2563eb"
}) {
  const icon =
    trend === "up" ? "↑" :
    trend === "down" ? "↓" :
    trend === "right" ? "→" : "⚠";

  const chartData = {
    labels: data.map((_, i) => i + 1),
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true
      },
      legend: { display: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  return (
    <div className={`kpi-card ${trend}`}>
      {/* HEADER */}
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <span className={`kpi-trend-icon ${trend}`}>{icon}</span>
      </div>

      {/* VALUE */}
      <div className="kpi-value">{value}</div>

      {/* DESCRIPTION */}
      {description && <div className="kpi-desc">{description}</div>}

      {/* SUB METRICS */}
      {subMetrics.length > 0 && (
        <div className="kpi-submetrics">
          {subMetrics.map((m, i) => (
            <div key={i} className="kpi-submetric">
              <span className="label">{m.label}</span>
              <span className="val">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* MINI GRAPH */}
      <div className="kpi-chart">
        <Line data={chartData} options={chartOptions} height={50} />
      </div>
    </div>
  );
}

export default KPICard;

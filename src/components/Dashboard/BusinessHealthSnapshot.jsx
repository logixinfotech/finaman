import React from "react";
import KPICard from "./KPICard";
import "./KPICard.css";

function BusinessHealthSnapshot() {
  return (
    <div className="bhs-page">
      <h2>Business Health Snapshot</h2>
      <p className="bhs-subtitle">
        Instant understanding of overall business condition through key performance indicators
      </p>

      <div className="bhs-grid">
        <KPICard
          title="Today's Sales"
          value="₹12,45,678"
          trend="up"
          description="Invoice value generated today"
          data={[8, 12, 18, 22, 25]}
          color="#22c55e"
        />

        <KPICard
          title="MTD Sales"
          value="₹35,28,942"
          trend="up"
          description="Month-to-date invoice value"
          data={[15, 20, 28, 32, 35]}
          color="#3b82f6"
        />

        <KPICard
          title="Pending Orders"
          value="142"
          trend="right"
          description="Orders not yet invoiced"
          subMetrics={[{ label: "Overdue", value: "12" }]}
          data={[150, 145, 142]}
          color="#f59e0b"
        />

        <KPICard
          title="Overdue Invoices"
          value="₹87,45,231"
          trend="down"
          description="Payment overdue amount"
          subMetrics={[{ label: "90+ Days", value: "8" }]}
          data={[92, 89, 87]}
          color="#ef4444"
        />

        <KPICard
          title="Production Today"
          value="42"
          trend="up"
          description="Batches / Qty produced"
          subMetrics={[
            { label: "Completion", value: "87%" },
            { label: "On-time", value: "12" }
          ]}
          data={[28, 34, 42]}
          color="#8b5cf6"
        />

        <KPICard
          title="Critical Alerts"
          value="5"
          trend="down"
          description="Total unresolved alerts"
          subMetrics={[
            { label: "RM", value: "Low" },
            { label: "QC", value: "Hold" }
          ]}
          data={[7, 6, 5]}
          color="#ea580c"
        />
      </div>
    </div>
  );
}

export default BusinessHealthSnapshot;

import React from "react";
import { ChevronRight } from "lucide-react";

// Clickable KPI card — filters the table to exactly the records the card counts; click again to clear.
export default function KpiCard({ label, value, sub, tone = "slate", selected = false, onClick }) {
  const tones = { slate: "text-slate-800", blue: "text-blue-700", amber: "text-amber-600", emerald: "text-emerald-600", rose: "text-rose-600", purple: "text-purple-700" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={selected ? "Click to clear this filter" : `Show ${label.toLowerCase()} in the table`}
      className="group rounded-[6px] shadow-sm px-2.5 py-1.5 min-w-0 flex items-center gap-2.5 text-left transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--icon-color)]"
      style={{
        background: selected ? "var(--accent-soft)" : "var(--bg-header)",
        border: `1px solid ${selected ? "var(--icon-color)" : "var(--border-main)"}`,
        boxShadow: selected ? "0 0 0 1px var(--icon-color)" : undefined,
      }}
    >
      <span className={`text-[20px] font-bold leading-6 tabular-nums shrink-0 ${tones[tone]}`}>{value ?? "—"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-semibold text-slate-600 truncate leading-tight">{label}</span>
        <span className="block text-[9.5px] text-slate-400 truncate leading-tight">{sub}</span>
      </span>
      <ChevronRight
        size={13}
        className={`shrink-0 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
        style={{ color: "var(--icon-color)" }}
        aria-hidden="true"
      />
    </button>
  );
}

import React from "react";
import { Search, Filter, Calendar, Users, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const YEARS = [2024, 2025, 2026, 2027];

export const STATUS_LEGEND = [
  { code: "P", label: "Present", bg: "bg-[#C6F6D5] text-[#14532D] border-emerald-300" },
  { code: "H", label: "Holiday", bg: "bg-[#047857] text-white border-emerald-800" },
  { code: "HOT", label: "Holiday OT", bg: "bg-amber-600 text-white border-amber-700" },
  { code: "WO", label: "Week Off", bg: "bg-[#E2E8F0] text-[#1E293B] border-slate-300" },
  { code: "WOT", label: "Week Off OT", bg: "bg-purple-600 text-white border-purple-700" },
  { code: "HD", label: "Half Day", bg: "bg-[#FEFCBF] text-[#713F12] border-yellow-300" },
  { code: "A", label: "Absent", bg: "bg-[#DC2626] text-white border-rose-700" },
  { code: "FH", label: "WFH", bg: "bg-[#86efac] text-[#065f46] border-green-300" },
  { code: "D", label: "WFS", bg: "bg-[#E9D8FD] text-[#581C87] border-purple-300" },
  { code: "L1", label: "Late 1", bg: "bg-[#FEEBC8] text-[#78350F] border-amber-300" },
  { code: "L2", label: "Late 2", bg: "bg-[#FBD38D] text-[#542605] border-amber-400" },
  { code: "REG", label: "Regularized", bg: "bg-emerald-600 text-white border-emerald-700" },
];

/**
 * AttendanceRegularizationFilters
 * Status legend ribbon and discrepancy indicators.
 */
export default function AttendanceRegularizationFilters() {
  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">Status Legend:</span>
        {STATUS_LEGEND.map((item) => (
          <span
            key={item.code}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${item.bg}`}
          >
            <span>{item.code}</span>
            <span className="font-normal opacity-85">({item.label})</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300 animate-pulse" />
          <span className="font-semibold text-rose-700">Red Ring / Pulse</span> = Discrepancy (Click to regularize)
        </span>
      </div>
    </div>
  );
}


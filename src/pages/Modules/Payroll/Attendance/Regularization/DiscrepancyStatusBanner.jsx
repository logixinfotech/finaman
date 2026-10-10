import React from "react";
import { AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Clock, UserX } from "lucide-react";

/**
 * DiscrepancyStatusBanner
 * Shows real-time counts of discrepancies (Missing Out Punch/Half Day vs Absent) with action triggers.
 */
export default function DiscrepancyStatusBanner({
  totalDiscrepancies = 0,
  halfDayCount = 0,
  absentCount = 0,
  onStartRegularizing,
}) {
  if (totalDiscrepancies === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 leading-tight">
              All Attendance Records Verified
            </h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              No unresolved attendance discrepancies or missing punch logs detected for this month.
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-900 font-bold text-xs">
          0 Discrepancies
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-50 to-rose-50 border border-amber-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-extrabold text-amber-950">
              {totalDiscrepancies} {totalDiscrepancies === 1 ? "Discrepancy" : "Discrepancies"} Highlighted
            </h4>
            <span className="text-[10.5px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <Clock size={11} className="text-amber-700" />
              {halfDayCount} Missing Out Punch / Half Day
            </span>
            <span className="text-[10.5px] font-semibold text-rose-800 bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <UserX size={11} className="text-rose-700" />
              {absentCount} Unapproved Absent
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Click any red-ringed cell in the register below, or use quick regularize to resolve them sequentially.
          </p>
        </div>
      </div>

      {onStartRegularizing && (
        <button
          type="button"
          onClick={onStartRegularizing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg shadow-xs transition-all shrink-0"
        >
          <Sparkles size={13} />
          <span>Regularize Next Discrepancy</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

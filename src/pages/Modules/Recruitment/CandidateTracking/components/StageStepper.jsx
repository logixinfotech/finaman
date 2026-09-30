import React, { useMemo } from "react";
import { Check, X } from "lucide-react";
import { STAGES, TOTAL_STAGES, JOINED_STATUS, fmtDate, fmtDateTime } from "../pipelineConstants";

/**
 * Horizontal 7-step stepper with connecting line.
 *  done     → check mark (emerald)      current → highlighted ring (primary / rose if terminal)
 *  upcoming → muted                     Under each: cleared date · scheduled slot · Pending
 */
export default function StageStepper({ currentStage = 1, category = "Active", statusBase = "", history = [], scheduledAt, statusSince }) {
  const cur = Math.min(Math.max(Number(currentStage) || 1, 1), TOTAL_STAGES);
  const joined = statusBase === JOINED_STATUS;
  const terminal = category === "Terminal" && !joined;

  // A stage is "cleared" when the first history row of the NEXT stage was written
  const clearedAt = useMemo(() => {
    const map = {};
    [...history].reverse().forEach((h) => {
      const n = Number(h.stage_no);
      if (n > 1 && !map[n - 1]) map[n - 1] = h.changed_at;
    });
    return map;
  }, [history]);

  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const n = i + 1;
        const done = joined || n < cur;
        const current = !joined && n === cur;
        const circle = done
          ? "bg-emerald-500 border-emerald-500 text-white"
          : current
            ? terminal
              ? "bg-rose-50 border-rose-500 text-rose-600 ring-4 ring-rose-100"
              : "bg-white text-[var(--icon-color)] ring-4"
            : "bg-white border-slate-300 text-slate-400";
        const lineCls = done && (joined || n < cur) ? "bg-emerald-400" : "bg-slate-200";
        const caption = done
          ? `Cleared ${fmtDate(clearedAt[n] || (joined ? statusSince : null))}`
          : current
            ? scheduledAt
              ? fmtDateTime(scheduledAt)
              : terminal
                ? "Closed"
                : "In progress"
            : "Pending";

        return (
          <div key={s.stage_no} className="flex-1 min-w-[96px] flex flex-col items-center relative">
            {i < STAGES.length - 1 && (
              <span className={`absolute top-[13px] left-1/2 w-full h-[2px] ${lineCls}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-[1] w-[27px] h-[27px] rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${circle}`}
              style={current && !terminal ? { borderColor: "var(--icon-color)", boxShadow: "0 0 0 4px var(--accent-soft)" } : undefined}
              aria-current={current ? "step" : undefined}
            >
              {done ? <Check size={13} strokeWidth={3} /> : current && terminal ? <X size={13} strokeWidth={3} /> : n}
            </span>
            <span className={`mt-1.5 text-[11px] font-semibold text-center leading-tight ${current ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"}`}>
              {s.stage_name}
            </span>
            <span className={`text-[10px] text-center leading-tight mt-0.5 ${current ? (terminal ? "text-rose-600" : "text-[var(--icon-color)]") : "text-slate-400"}`}>
              {caption}
            </span>
          </div>
        );
      })}
    </div>
  );
}

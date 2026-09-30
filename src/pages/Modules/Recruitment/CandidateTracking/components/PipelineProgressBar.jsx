import React from "react";
import { STAGES, TOTAL_STAGES, JOINED_STATUS, CATEGORY_STYLES } from "../pipelineConstants";

/**
 * 7-segment pipeline progress bar (one segment per stage).
 *  - cleared stages  → primary (blue)
 *  - current stage   → its status category colour
 *  - upcoming stages → neutral grey
 *  - Joined          → all segments success (emerald)
 *  - Terminal        → current segment danger (rose), later segments stay grey
 *
 * Reusable: <PipelineProgressBar currentStage={4} category="Active" statusBase="..." />
 */
export default function PipelineProgressBar({
  currentStage = 1,
  category = "Active",
  statusBase = "",
  showCaption = true,
  compact = false,
  className = "",
}) {
  const cur = Math.min(Math.max(Number(currentStage) || 1, 1), TOTAL_STAGES);
  const joined = statusBase === JOINED_STATUS;
  const stage = STAGES[cur - 1];
  const currentColor = (CATEGORY_STYLES[category] || CATEGORY_STYLES.Active).bar;

  return (
    <div className={`min-w-0 ${className}`}>
      <div className={`flex items-center ${compact ? "gap-[2px]" : "gap-[3px]"}`} role="img" aria-label={`Stage ${cur} of ${TOTAL_STAGES}: ${stage.stage_name}`}>
        {STAGES.map((s, i) => {
          const n = i + 1;
          const cls = joined
            ? "bg-emerald-500"
            : n < cur
              ? "bg-blue-500"
              : n === cur
                ? currentColor
                : "bg-slate-200";
          return (
            <span
              key={s.stage_no}
              title={`${n}. ${s.stage_name}`}
              className={`flex-1 rounded-sm ${compact ? "h-[5px]" : "h-[7px]"} ${cls}`}
            />
          );
        })}
      </div>
      {showCaption && (
        <div className={`text-slate-500 truncate ${compact ? "text-[10px] mt-0.5" : "text-[11px] mt-1"}`}>
          Stage {cur} of {TOTAL_STAGES} · {joined ? "Joined" : stage.stage_name}
        </div>
      )}
    </div>
  );
}

import React from "react";

export default function WorkflowProgressBar({ stages = [], currentStatus }) {
  const curIdx = stages.indexOf(currentStatus);

  return (
    <div className="flex flex-wrap items-center gap-1.5 my-3">
      {stages.map((s, i) => {
        const isDone = i < curIdx;
        const isCurrent = i === curIdx;
        return (
          <React.Fragment key={s}>
            <span
              className={[
                "text-[11px] px-2.5 py-1 rounded-full border font-medium whitespace-nowrap",
                isDone
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : isCurrent
                  ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                  : "bg-slate-100 text-slate-400 border-slate-200",
              ].join(" ")}
            >
              {i + 1}. {s}
            </span>
            {i < stages.length - 1 && (
              <span className="text-slate-300 text-[12px]">→</span>
            )}
          </React.Fragment>
        );
      })}
      {curIdx === -1 && (
        <span className="text-[11px] text-red-500">
          ⚠ Current status "{currentStatus}" not found in workflow stages — check config.
        </span>
      )}
    </div>
  );
}
import React from "react";
import { styleFor } from "../pipelineConstants";

// Unique-status chip in its category colour. `sub` renders "Category · time" under/next to it.
export default function StatusChip({ status, category, statusBase, sub, className = "", size = "sm" }) {
  const s = styleFor(category, statusBase || status);
  return (
    <span className={`inline-flex flex-col min-w-0 max-w-full ${className}`}>
      <span
        className={`inline-flex items-center max-w-full rounded-full border font-semibold leading-none whitespace-nowrap ${s.chip} ${size === "md" ? "h-[26px] px-3 text-[12px]" : "h-[20px] px-2.5 text-[10.5px]"
          }`}
        title={status}
      >
        <span className="truncate">{status}</span>
      </span>
      {sub && (
        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 leading-3">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {sub}
        </span>
      )}
    </span>
  );
}
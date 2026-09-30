import React from "react";
import { styleFor } from "../pipelineConstants";

// Unique-status chip in its category colour. `sub` renders "Category · time" under/next to it.
export default function StatusChip({ status, category, statusBase, sub, className = "", size = "sm" }) {
  const s = styleFor(category, statusBase || status);
  return (
    <span className={`inline-flex flex-col min-w-0 ${className}`}>
      <span
        className={`inline-block max-w-full truncate rounded border font-semibold leading-4 ${s.chip} ${
          size === "md" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[11px]"
        }`}
        title={status}
      >
        {status}
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

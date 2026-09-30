import React from "react";
import { Check } from "lucide-react";
import { STAGES, CATEGORY_STYLES } from "../pipelineConstants";

/**
 * "Pipeline by Stage" strip — numbered nodes on a track line with per-stage counts.
 *   <count>   active in stage  (theme primary)
 *   <n>P      comm pending      (amber)
 *   <n>R      rejected/dropped  (rose)
 *   Joined    milestone         (emerald, check node)
 * Track / nodes / active chips follow the theme (--icon-color, --accent-soft, --border-main …).
 * Stage 7 and the Joined node are always emerald (milestone colour).
 */
const CHIP = "inline-flex items-center justify-center h-[16px] min-w-[20px] px-[5px] rounded-[4px] text-[10px] font-bold tabular-nums leading-none border";

const TONES = {
  primary: { background: "var(--accent-soft)", color: "var(--icon-color)", borderColor: "var(--accent-hover)" },
  amber: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  rose: { background: "#fff1f2", color: "#be123c", borderColor: "#fecdd3" },
  emerald: { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" },
};

const Chip = ({ value, suffix, tone }) => (
  <span
    className={CHIP}
    style={TONES[tone]}
    title={suffix === "P" ? `${value} comm pending` : suffix === "R" ? `${value} rejected / dropped` : `${value} active`}
  >
    {value}
    {suffix ? <span className="ml-[1px] font-semibold opacity-80">{suffix}</span> : null}
  </span>
);

export default function PipelineStageStrip({ stages = [], selectedStage = "All", onSelectStage, joined = 0, className = "" }) {
  const byNo = Object.fromEntries(stages.map((s) => [s.stage_no, s]));
  const last = STAGES.length;

  return (
    <div
      className={`rounded-[6px] shadow-sm px-2.5 py-1.5 flex items-center gap-3 overflow-x-auto ${className}`}
      style={{ background: "var(--bg-header)", border: "1px solid var(--border-main)" }}
    >
      <span className="text-[10.5px] font-bold uppercase tracking-[0.4px] shrink-0" style={{ color: "var(--text-main)" }}>
        Pipeline by Stage
      </span>

      <ol className="flex-1 flex items-stretch min-w-0" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const d = byNo[s.stage_no] || {};
          const active = Number(d.active ?? d.count ?? 0);
          const pending = Number(d.pending ?? 0);
          const rejected = Number(d.rejected ?? 0);
          const isSel = String(selectedStage) === String(s.stage_no);
          const milestone = s.stage_no === last;
          const color = milestone ? "#059669" : "var(--icon-color)";

          return (
            <li key={s.stage_no} className="flex-1 min-w-[118px] flex flex-col">
              <button
                type="button"
                onClick={() => onSelectStage?.(isSel ? "All" : String(s.stage_no))}
                aria-pressed={isSel}
                title={s.hint}
                className="flex items-center gap-1 h-[20px] px-1 rounded transition-colors whitespace-nowrap"
                style={isSel ? { background: "var(--accent-soft)" } : undefined}
              >
                <span className="text-[11px] font-semibold" style={{ color: isSel ? "var(--icon-color)" : "var(--text-main)" }}>
                  {s.short}
                </span>
                <Chip value={active} tone={milestone ? "emerald" : "primary"} />
                {pending > 0 && <Chip value={pending} suffix="P" tone="amber" />}
                {rejected > 0 && <Chip value={rejected} suffix="R" tone="rose" />}
              </button>

              <div className="relative h-[18px] flex items-center">
                <span
                  className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full"
                  style={{ left: i === 0 ? 12 : 0, right: 0, background: color, opacity: 0.85 }}
                  aria-hidden="true"
                />
                <span
                  className="relative z-[1] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[10px] font-bold ml-[4px]"
                  style={{ borderColor: color, color, background: "var(--bg-header)", boxShadow: isSel ? "0 0 0 3px var(--accent-soft)" : undefined }}
                >
                  {s.stage_no}
                </span>
              </div>
            </li>
          );
        })}

        {/* Joined — terminal milestone node */}
        <li className="min-w-[92px] flex flex-col">
          <span className="flex items-center gap-1 h-[20px] px-1 whitespace-nowrap">
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-main)" }}>Joined</span>
            <Chip value={joined} tone="emerald" />
          </span>
          <div className="relative h-[18px] flex items-center">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full" style={{ width: "calc(100% - 14px)", background: "#059669", opacity: 0.85 }} aria-hidden="true" />
            <span className="relative z-[1] w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-white ml-[4px]" style={{ background: "#059669" }}>
              <Check size={11} strokeWidth={3} />
            </span>
          </div>
        </li>
      </ol>

      <span className="flex items-center gap-2.5 text-[9.5px] shrink-0" style={{ color: "var(--text-muted)" }}>
        {Object.entries(CATEGORY_STYLES).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-sm ${key === "Active" ? "" : s.dot}`} style={key === "Active" ? { background: "var(--icon-color)" } : undefined} />
            {s.label}
          </span>
        ))}
        <span className="opacity-70">P = pending · R = rejected</span>
      </span>
    </div>
  );
}

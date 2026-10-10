import React from "react";
import { Check } from "lucide-react";
import { STAGES } from "../pipelineConstants";

const CHIP = "inline-flex items-center justify-center h-[16px] min-w-[18px] px-[4px] rounded-[3px] text-[9.5px] font-bold tabular-nums leading-none border shrink-0";

const TONES = {
  primary: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
  amber: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  rose: { background: "#fff1f2", color: "#be123c", borderColor: "#fecdd3" },
  emerald: { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" },
  neutral: { background: "#f8fafc", color: "#94a3b8", borderColor: "#e2e8f0" },
};

const Chip = ({ value, suffix, tone }) => (
  <span
    className={CHIP}
    style={TONES[tone] || TONES.neutral}
    title={suffix === "P" ? `${value} comm pending` : suffix === "R" ? `${value} rejected / dropped` : `${value} active`}
  >
    {value}
    {suffix ? <span className="ml-[1px] font-semibold opacity-80">{suffix}</span> : null}
  </span>
);

export default function PipelineStageStrip({
  stages = [],
  selectedStage = "All",
  onSelectStage,
  joined = 0,
  className = "",
}) {
  const byNo = Object.fromEntries(stages.map((s) => [s.stage_no, s]));
  const last = STAGES.length;

  return (
    <div
      className={`rounded-[6px] shadow-xs px-2.5 py-1.5 flex items-center gap-3 overflow-x-auto ${className}`}
      style={{ background: "#ffffff", border: "1px solid #dde1ea" }}
    >
      <span className="text-[10.5px] font-bold uppercase tracking-[0.4px] shrink-0 text-slate-800">
        Pipeline by Stage
      </span>

      <ol className="flex-1 flex items-stretch min-w-[620px]" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const d = byNo[s.stage_no] || {};
          const active = Number(d.active ?? d.count ?? 0);
          const pending = Number(d.pending ?? 0);
          const rejected = Number(d.rejected ?? 0);
          const isSel = String(selectedStage) === String(s.stage_no);
          const isMilestone = s.stage_no === last;
          const hasActivity = active > 0 || pending > 0 || rejected > 0;

          return (
            <li key={s.stage_no} className="flex-1 min-w-[85px] flex flex-col items-center relative">
              {/* Connecting line to the next stage */}
              <span
                className={`absolute top-[28px] left-1/2 w-full h-[2px] z-0 ${
                  hasActivity || isMilestone ? "bg-blue-500" : "bg-slate-200"
                }`}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => onSelectStage?.(isSel ? "All" : String(s.stage_no))}
                aria-pressed={isSel}
                title={s.hint || s.stage_name}
                className={`flex items-center gap-1 h-[20px] px-1.5 rounded transition-colors whitespace-nowrap z-10 ${
                  isSel ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span className={`text-[11px] font-semibold ${isSel ? "text-blue-700 font-bold" : "text-slate-800"}`}>
                  {s.short}
                </span>
                <Chip value={active} tone={isMilestone ? "emerald" : active > 0 ? "primary" : "neutral"} />
                {pending > 0 && <Chip value={pending} suffix="P" tone="amber" />}
                {rejected > 0 && <Chip value={rejected} suffix="R" tone="rose" />}
              </button>

              <div className="relative h-[18px] flex items-center justify-center z-10 mt-0.5">
                <span
                  className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    isMilestone
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : active > 0
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : pending > 0
                      ? "bg-amber-500 border-amber-500 text-white"
                      : rejected > 0
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "bg-white border-slate-300 text-slate-500"
                  } ${isSel ? "ring-2 ring-blue-300" : ""}`}
                >
                  {s.stage_no}
                </span>
              </div>
            </li>
          );
        })}

        {/* Joined — terminal milestone node */}
        <li className="min-w-[75px] flex flex-col items-center relative">
          <span className="flex items-center gap-1 h-[20px] px-1 whitespace-nowrap z-10">
            <span className="text-[11px] font-semibold text-slate-800">Joined</span>
            <Chip value={joined} tone={joined > 0 ? "emerald" : "neutral"} />
          </span>
          <div className="relative h-[18px] flex items-center justify-center z-10 mt-0.5">
            <span
              className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center text-white ${
                joined > 0 ? "bg-emerald-600" : "bg-emerald-600/85"
              }`}
            >
              <Check size={11} strokeWidth={3} />
            </span>
          </div>
        </li>
      </ol>

      <span className="flex items-center gap-2 text-[9.5px] text-slate-500 shrink-0">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-blue-600 inline-block" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-amber-500 inline-block" /> Comm Pending</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-600 inline-block" /> Milestone</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-rose-500 inline-block" /> Terminal</span>
        <span className="opacity-70 hidden xl:inline">P = pending · R = rejected</span>
      </span>
    </div>
  );
}

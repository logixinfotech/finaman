import { memo, useMemo, useState } from "react";
import { FaThLarge, FaChevronDown } from "react-icons/fa";

const LEVEL = (score) => (score <= 6 ? "low" : score <= 12 ? "med" : "high");

const CELL_BG = {
  low: "bg-emerald-100 hover:bg-emerald-200 border-emerald-400",
  med: "bg-amber-100 hover:bg-amber-200 border-amber-400",
  high: "bg-rose-100 hover:bg-rose-200 border-rose-400",
};
const CELL_TEXT = { low: "text-emerald-800", med: "text-amber-800", high: "text-rose-800" };

const SEV_LABEL = ["Negligible", "Minor", "Moderate", "Major", "Critical"];
const PROB_LABEL = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];

/**
 * 5×5 Risk Matrix — open risks ka count har cell me.
 * Cell click → onCellClick({ severity, probability }) — list filter ke liye.
 */
const RiskMatrix = memo(function RiskMatrix({ data = [], onCellClick, activeCell }) {
  const [open, setOpen] = useState(true);

  const { grid, total } = useMemo(() => {
    const g = {};
    let t = 0;
    data.forEach((r) => {
      const closed = ["Closed", "Rejected"].includes(r.Status);
      if (closed) return;
      const s = parseInt(r.Severity, 10);
      const p = parseInt(r.Probability, 10);
      if (!s || !p) return;
      g[`${s}-${p}`] = (g[`${s}-${p}`] || 0) + 1;
      t++;
    });
    return { grid: g, total: t };
  }, [data]);

  const rows = [5, 4, 3, 2, 1];   // P5 upar
  const cols = [1, 2, 3, 4, 5];   // S1 left

  return (
    <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-[12px] py-[7px] bg-[#eef4ff] border-b border-[#dde1ea] flex items-center gap-2 hover:bg-[#e4edfd]"
      >
        <div className="w-[17px] h-[17px] rounded-[3px] bg-[#dce6f5] flex items-center justify-center shrink-0">
          <FaThLarge className="text-[9px] text-[#1a56db]" />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.4px] text-[#1a56db] flex-1 text-left">
          Risk Matrix (Severity × Probability) — Open Risks
        </h3>
        <span className="text-[10px] font-bold px-2 py-[1px] rounded-full bg-[#dce6f5] text-[#1a56db]">
          {total} open
        </span>
        <FaChevronDown className={`text-[9px] text-[#8b9ab5] transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="p-[12px]">
          <div className="flex gap-2">
            {/* Y-axis label */}
            <div className="flex items-center shrink-0">
              <span className="text-[9.5px] font-bold text-[#5b6b85] uppercase tracking-[0.5px]"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                Probability →
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="w-[86px]" />
                    {cols.map((s) => (
                      <th key={s} className="px-1 pb-1.5 text-center">
                        <div className="text-[10.5px] font-bold text-[#334155]">S{s}</div>
                        <div className="text-[8.5px] text-[#8b9ab5] leading-[10px]">{SEV_LABEL[s - 1]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p}>
                      <td className="pr-1.5 text-right align-middle">
                        <div className="text-[10.5px] font-bold text-[#334155]">P{p}</div>
                        <div className="text-[8.5px] text-[#8b9ab5] leading-[10px]">{PROB_LABEL[p - 1]}</div>
                      </td>
                      {cols.map((s) => {
                        const count = grid[`${s}-${p}`] || 0;
                        const lv = LEVEL(s * p);
                        const isActive = activeCell?.severity === s && activeCell?.probability === p;
                        return (
                          <td key={s} className="p-[2px]">
                            <button
                              type="button"
                              disabled={!count}
                              onClick={() => count && onCellClick?.({ severity: s, probability: p })}
                              title={`S${s} × P${p} = ${s * p} · ${count} open risk(s)`}
                              className={`w-full h-[38px] rounded-[4px] border transition-all flex flex-col items-center justify-center
                                ${CELL_BG[lv]}
                                ${count ? "cursor-pointer" : "cursor-default opacity-80"}
                                ${isActive ? "ring-2 ring-[#1a56db] ring-offset-1" : ""}`}
                            >
                              {count > 0 ? (
                                <>
                                  <span className={`text-[14px] font-bold leading-[15px] ${CELL_TEXT[lv]}`}>{count}</span>
                                  <span className={`text-[8px] leading-[9px] ${CELL_TEXT[lv]} opacity-85`}>{s * p}</span>                                </>
                              ) : (
                                <span className={`text-[10px] font-semibold ${CELL_TEXT[lv]} opacity-70`}>{s * p}</span>)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-center mt-1">
                <span className="text-[9.5px] font-bold text-[#5b6b85] uppercase tracking-[0.5px]">Severity →</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2.5 pt-2 border-t border-[#f0f2f7]">
            {[
              ["bg-emerald-200 border-emerald-400", "Low (≤6)"],
              ["bg-amber-200 border-amber-400", "Medium (7–12)"],
              ["bg-rose-200 border-rose-400", "High (>12)"],
            ].map(([cls, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-[11px] h-[11px] rounded-[2px] border ${cls}`} />
                <span className="text-[9.5px] text-[#5b6b85]">{label}</span>
              </span>
            ))}
            {activeCell && (
              <button onClick={() => onCellClick?.(null)}
                className="text-[9.5px] text-[#1a56db] hover:underline font-semibold ml-2">
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default RiskMatrix;
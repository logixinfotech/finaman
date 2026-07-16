import { useEffect, useRef, useState } from "react";
import { buildAISummary, buildInsights } from "../../../../utils/aiInsightsHelpers";

const TYPE_STYLES = {
  "": "bg-slate-50 border-slate-200",
  warn: "bg-amber-50 border-amber-200",
  alert: "bg-rose-50 border-rose-200",
  good: "bg-emerald-50 border-emerald-200",
};

export default function AIInsights({ rows }) {
  const summary = buildAISummary(rows);
  const insights = buildInsights(rows);
  const [typed, setTyped] = useState("");
  const timerRef = useRef(null);
  const prevRowsRef = useRef(null);

  useEffect(() => { 
    const sig = rows.length ? `${rows.length}:${rows[0]?.id}:${rows[rows.length - 1]?.id}` : "empty";
    if (prevRowsRef.current === sig) return;
    prevRowsRef.current = sig;

    if (timerRef.current) clearInterval(timerRef.current);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 3;
      setTyped(summary.slice(0, i));
      if (i >= summary.length) clearInterval(timerRef.current);
    }, 12);

    return () => clearInterval(timerRef.current); 
  }, [rows, summary]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">✨ AI Insights</h4>
        <span className="fd-ai-tag">
          <span className="fd-ai-dot" /> AI GENERATED
        </span>
        <span className="text-[10.5px] text-slate-400">produced automatically · recalculated live with every filter</span>
      </div>

      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 px-4 py-3.5 text-[13px] leading-relaxed text-slate-700 mb-4 min-h-[3rem]">
        <span dangerouslySetInnerHTML={{ __html: typed.replace(/AI recommendation:/, "<b class='text-violet-700'>AI recommendation:</b>") }} />
        {typed.length < summary.length && <span className="fd-ai-cursor" />}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[12.5px] leading-relaxed ${TYPE_STYLES[ins.type]}`}>
            <span className="text-base leading-none">{ins.icon}</span>
            <span dangerouslySetInnerHTML={{ __html: ins.html }} />
          </div>
        ))}
        {insights.length === 0 && <p className="text-sm text-slate-400 col-span-full text-center py-4">No data in current filter</p>}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ChevronUp } from "lucide-react";
import { buildAISummary, buildInsights } from "../../../../utils/aiInsightsHelpers";

const TYPE_STYLES = {
  "": "bg-slate-50 border-slate-200",
  warn: "bg-amber-50 border-amber-200",
  alert: "bg-rose-50 border-rose-200",
  good: "bg-emerald-50 border-emerald-200",
};

/* insights helper HTML string deta hai aur usme DB se aaya customer/product naam hota hai.
   Naam free-text hain (83 spelling variants mile the) — matlab stored-XSS ka raasta.
   Isliye render se pehle sirf formatting tags allow karte hain, baaki unwrap. */
const ALLOWED_TAGS = /^(b|strong|i|em|span|br)$/i;

function sanitize(html) {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html; // template parsing scripts execute nahi karti
  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return;        // text — safe
      if (child.nodeType !== 1) { child.remove(); return; }
      clean(child);                            // pehle bachche saaf
      if (!ALLOWED_TAGS.test(child.tagName)) {
        child.replaceWith(...child.childNodes); // tag hatao, content rakho
      } else {
        [...child.attributes].forEach((a) => {
          if (a.name !== "class") child.removeAttribute(a.name); // on*, style, href sab out
        });
      }
    });
  };
  clean(tpl.content);
  return tpl.innerHTML;
}

export default function AIInsights({ rows, onClose }) {
  // memoized — pehle har render pe poore filtered set pe chalte the
  const summary = useMemo(() => buildAISummary(rows), [rows]);
  const insights = useMemo(
    () => buildInsights(rows).map((i) => ({ ...i, safeHtml: sanitize(i.html) })),
    [rows]
  );
  const safeSummary = useMemo(
    () => sanitize(summary.replace(/AI recommendation:/, "<b class='text-violet-700'>AI recommendation:</b>")),
    [summary]
  );

  const [typed, setTyped] = useState("");
  const timerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    // reduced-motion respect — animation off, seedha full text
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce || !safeSummary) {
      setTyped(safeSummary);
      doneRef.current = true;
      return;
    }

    let i = 0;
    setTyped("");
    timerRef.current = setInterval(() => {
      i += 4;
      setTyped(safeSummary.slice(0, i));
      if (i >= safeSummary.length) {
        clearInterval(timerRef.current);
        doneRef.current = true;
      }
    }, 12);

    return () => clearInterval(timerRef.current);
  }, [safeSummary]);

  // click karo to typing skip
  const skip = () => {
    if (doneRef.current) return;
    clearInterval(timerRef.current);
    setTyped(safeSummary);
    doneRef.current = true;
  };

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" /> AI Insights
        </h4>
        <span className="fd-ai-tag">
          <span className="fd-ai-dot" /> AI GENERATED
        </span>
        <span className="hidden text-[10.5px] text-slate-400 sm:inline">
          produced automatically · recalculated live with every filter
        </span>
        {onClose && (
          <button
            onClick={onClose}
            title="Hide insights"
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        onClick={skip}
        className="mb-4 min-h-[3rem] cursor-default rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-sky-50 px-3 py-3 text-[13px] leading-relaxed text-slate-700 sm:px-4 sm:py-3.5"
      >
        <span dangerouslySetInnerHTML={{ __html: typed }} />
        {typed.length < safeSummary.length && <span className="fd-ai-cursor" />}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed sm:px-3.5 ${TYPE_STYLES[ins.type]}`}
          >
            <span className="shrink-0 text-base leading-none">{ins.icon}</span>
            <span className="min-w-0" dangerouslySetInnerHTML={{ __html: ins.safeHtml }} />
          </div>
        ))}
        {insights.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-slate-400">No data in current filter</p>
        )}
      </div>
    </div>
  );
}
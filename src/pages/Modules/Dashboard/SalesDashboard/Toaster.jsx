import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { subscribe } from "./toast";

const STYLE = {
  success: { ring: "ring-emerald-200", icon: "text-emerald-600", Icon: CheckCircle2 },
  error:   { ring: "ring-rose-200",    icon: "text-rose-600",    Icon: AlertCircle },
  info:    { ring: "ring-sky-200",     icon: "text-sky-600",     Icon: Info },
};

/* Fixed bottom-right stack. Mount once per page (SalesDashboard and each standalone page). */
export default function Toaster() {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);

  useEffect(() => subscribe((t) => {
    setItems((l) => [...l.slice(-4), t]);          // keep at most 5 on screen
    if (t.duration > 0) setTimeout(() => remove(t.id), t.duration);
  }), [remove]);

  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
      {items.map((t) => {
        const s = STYLE[t.type] || STYLE.info;
        return (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg ring-1 ${s.ring}`}>
            <s.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} strokeWidth={2.25} />
            <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-slate-700">{t.message}</p>
            <button type="button" onClick={() => remove(t.id)} title="Dismiss" className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

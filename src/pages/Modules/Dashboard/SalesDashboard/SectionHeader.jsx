import { memo } from "react";

/* Card header used by the order-analysis widgets so they match the Sales tab's
   CardShell look: accent icon tile + title, optional right-side actions. */
const ACCENT = {
  indigo:  "bg-indigo-50 text-indigo-600",
  sky:     "bg-sky-50 text-sky-600",
  violet:  "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  rose:    "bg-rose-50 text-rose-600",
  teal:    "bg-teal-50 text-teal-600",
  slate:   "bg-slate-100 text-slate-600",
};

function SectionHeader({ icon: Icon, accent = "indigo", title, className = "mb-4", children }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ACCENT[accent] || ACCENT.indigo}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}
        <h4 className="truncate text-[13px] font-bold tracking-tight text-slate-700">{title}</h4>
      </div>
      {children && <div className="flex shrink-0 items-center gap-1.5">{children}</div>}
    </div>
  );
}

export default memo(SectionHeader);

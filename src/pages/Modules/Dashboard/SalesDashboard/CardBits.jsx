import { memo } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { inrS } from "../../../../utils/helpers";

/* Small shared pieces for the server-aggregated cards. Dense, no decoration. */

export const StatChip = memo(function StatChip({ label, value, sub, tone = "slate" }) {
  const t = {
    slate:   "bg-slate-50 text-slate-800",
    indigo:  "bg-indigo-50 text-indigo-800",
    emerald: "bg-emerald-50 text-emerald-800",
    amber:   "bg-amber-50 text-amber-800",
    rose:    "bg-rose-50 text-rose-800",
    sky:     "bg-sky-50 text-sky-800",
  }[tone] || "bg-slate-50 text-slate-800";
  return (
    <div className={`min-w-0 rounded-lg px-3 py-2 ${t}`}>
      <p className="truncate text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold tabular-nums leading-tight">{value}</p>
      {sub && <p className="truncate text-[10.5px] opacity-70">{sub}</p>}
    </div>
  );
});

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{error}</span>
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold hover:underline">Retry</button>}
    </div>
  );
}

export function Empty({ label = "No data for the current filters" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-slate-400">
      <Inbox className="h-7 w-7" strokeWidth={1.5} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/* cols: [{ key, label, render?, align?, width? }] — dense table with sticky header, scrolls inside */
export function DenseTable({ cols, rows, maxHeight = 320, rowKey, onRowClick, emptyLabel }) {
  if (!rows?.length) return <Empty label={emptyLabel} />;
  return (
    <div className="overflow-auto rounded-lg border border-slate-200" style={{ maxHeight }}>
      <table className="w-full min-w-[520px] border-collapse text-[12px]">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {cols.map((c) => (
              <th key={c.label} style={c.width ? { width: c.width } : undefined}
                  className={`whitespace-nowrap border-b border-slate-200 px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500 ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={`border-b border-slate-100 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-indigo-50/60" : "hover:bg-slate-50"}`}>
              {cols.map((c) => (
                <td key={c.label} className={`whitespace-nowrap px-2 py-1.5 tabular-nums ${c.align === "right" ? "text-right" : "text-left"} ${c.cls || ""}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const money = (v) => inrS(v || 0);
export const int   = (v) => Math.round(v || 0).toLocaleString("en-IN");
export const pct1  = (v) => `${(v || 0).toFixed(1)}%`;
export const days  = (v) => `${Math.round(v || 0)}d`;

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Check } from "lucide-react";
import { exportRows, rangeSuffix } from "./exportUtils";
import { useExportSource, menuKeyNav } from "./ExportRegistry";
import { toast } from "./toast";

/* ------------------------------------------------------------------
   <ExportMenu title="Top 10 Customers" columns={cols} rows={rows} />

   Renders a compact download button. Click -> CSV / Excel menu.
   - `rows` can be an array or a function returning one (evaluated on
     click, so a big table does not pay the cost on every render).
   - `id` registers the dataset with ExportRegistry (for "Export all").
     Defaults to `title`.
   - `filters` (optional) appends the date range to the file name.
   - `variant`: "icon" (default, for card headers) | "button" (with label)
------------------------------------------------------------------ */

const FORMATS = [
  { key: "csv",  label: "CSV",   hint: ".csv · any tool",     icon: FileText },
  { key: "xlsx", label: "Excel", hint: ".xlsx · formatted",   icon: FileSpreadsheet },
];

function ExportMenu({
  title, columns, rows, id, filters, disabled,
  variant = "icon", align = "right", className = "",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");      // format currently exporting
  const [done, setDone] = useState("");      // brief "✓" feedback
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  const resolveRows = useCallback(() => (typeof rows === "function" ? rows() : rows) || [], [rows]);

  /* "Export all" support */
  useExportSource(id ?? title, () => ({ title, columns, rows: resolveRows() }));

  /* close on outside click / Esc */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus());   // keyboard users land on the first option
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const run = useCallback(async (format) => {
    const data = resolveRows();
    if (!data.length || busy) return;
    setBusy(format);
    try {
      await exportRows({ format, name: `${title}${rangeSuffix(filters)}`, sheet: title, columns, rows: data });
      setDone(format);
      toast.success(`${title} exported (${data.length.toLocaleString("en-IN")} rows)`);
      setTimeout(() => setDone(""), 1400);
    } catch (err) {
      console.error("[ExportMenu] export failed:", err);
      toast.error(
        format === "xlsx"
          ? "Excel export failed. Make sure the 'xlsx' package is installed (npm i xlsx)."
          : "Export failed. See console for details."
      );
    } finally {
      setBusy("");
      setOpen(false);
    }
  }, [resolveRows, busy, title, filters, columns]);

  const count = Array.isArray(rows) ? rows.length : null;   // lazy rows: unknown until click
  const isDisabled = disabled || count === 0;

  const btnBase =
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-default disabled:opacity-40";
  const btnCls =
    variant === "button"
      ? `${btnBase} h-7 bg-white px-2.5 text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50`
      : `${btnBase} h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 ${open ? "bg-indigo-50 text-indigo-600" : ""}`;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={isDisabled ? "No data to export" : `Export "${title}"`}
        className={btnCls}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Download className="h-3.5 w-3.5" />}
        {variant === "button" && <span className="hidden sm:inline">Export</span>}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={menuKeyNav}
          className={`absolute top-full z-40 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Export{count != null ? ` · ${count.toLocaleString("en-IN")} rows` : ""}
          </div>
          {FORMATS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                type="button"
                role="menuitem"
                onClick={() => run(f.key)}
                disabled={!!busy}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none disabled:opacity-50"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${f.key === "xlsx" ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-sky-600"}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800">{f.label}</span>
                  <span className="block text-[10.5px] text-slate-400">{f.hint}</span>
                </span>
                {busy === f.key && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(ExportMenu);

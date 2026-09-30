import { useMemo, useState, useEffect, useCallback, useRef, memo, startTransition } from "react";
import { X, RotateCcw, SlidersHorizontal, ChevronDown, RefreshCw, Download, Sparkles, FileText, FileSpreadsheet, Layers, Loader2 } from "lucide-react";
import { useExportRegistry, menuKeyNav } from "./ExportRegistry";
import { exportWorkbook, rangeSuffix } from "./exportUtils";
import { toast } from "./toast";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { isoOf, addD } from "../../../../utils/helpers";

/* Compact 32px controls — dense, ERP-style. One class string so every input,
   select and date field in the bar stays visually identical. */
const INPUT_CLS =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 " +
  "outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const BTN_BASE =
  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-2.5";
const BTN_GHOST = `${BTN_BASE} bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50`;

const ORDER_STATUS_OPTIONS = ["Completed", "Pending"];
const DEBOUNCE_MS = 280;
const STORE_KEY = "sd.filtersCollapsed";

function buildPresets(bounds) {
  if (!bounds.max) return [];
  const [y, m, d] = bounds.max.split("-").map(Number);
  const anchor = new Date(y, m - 1, d);
  const qStart = new Date(y, Math.floor((m - 1) / 3) * 3, 1);
  const fyStart = m >= 4 ? new Date(y, 3, 1) : new Date(y - 1, 3, 1); // Indian FY: Apr–Mar
  const lastFyStart = new Date(fyStart.getFullYear() - 1, 3, 1);
  const lastFyEnd   = new Date(fyStart.getFullYear(), 2, 31);
  return [
    { key: "td",  label: "Today",        from: bounds.max,                  to: bounds.max },   // latest data day
    { key: "7d",  label: "Last 7 days",  from: isoOf(addD(anchor, -6)),     to: bounds.max },
    { key: "30d", label: "Last 30 days", from: isoOf(addD(anchor, -29)),    to: bounds.max },
    { key: "mo",  label: "This month",   from: isoOf(new Date(y, m - 1, 1)), to: bounds.max },
    { key: "qt",  label: "This quarter", from: isoOf(qStart),               to: bounds.max },
    { key: "fy",  label: "This FY",      from: isoOf(fyStart),              to: bounds.max },
    { key: "lfy", label: "Last FY",      from: isoOf(lastFyStart),          to: isoOf(lastFyEnd) },
    { key: "all", label: "All time",     from: bounds.min,                  to: bounds.max },
  ].filter((p) => !bounds.min || p.to >= bounds.min);   // drop presets entirely outside the data
}

function initialCollapsed() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved != null) return saved === "1";
  } catch { /* private mode / storage blocked */ }
  return typeof window !== "undefined" && window.innerWidth < 768;
}

function FiltersBar({
  title = "Sales Dashboard",
  filters, setFilters, filterLists, rows, dateBounds, tab,
  recordCount, lastFetched, loading, onRefresh, onExport,
  showInsights, onToggleInsights,
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const showOrderFilters = tab !== "sales";

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const presets = useMemo(() => buildPresets(dateBounds), [dateBounds.min, dateBounds.max]);

  const cityByState = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!r.state) continue;
      if (!map.has(r.state)) map.set(r.state, new Set());
      if (r.city) map.get(r.state).add(r.city);
    }
    return map;
  }, [rows]);

  const cityOptions = useMemo(() => {
    if (!filters.state) return filterLists.cities;
    const set = cityByState.get(filters.state);
    return set ? [...set].sort() : [];
  }, [filters.state, cityByState, filterLists.cities]);

  /* State list as a Set so the per-keystroke "is this a real state?" check is O(1). */
  const stateSet = useMemo(() => new Set(filterLists.states || []), [filterLists.states]);

  const update = useCallback((patch) => {
    startTransition(() => setFilters((f) => ({ ...f, ...patch })));
  }, [setFilters]);

  const reset = useCallback(() => {
    startTransition(() => {
      setFilters({
        state: "", city: "", cust: "", grp: "", item: "", gen: "",
        orderStatus: "", payTerms: "",
        from: dateBounds.min, to: dateBounds.max,
      });
    });
  }, [setFilters, dateBounds.min, dateBounds.max]);
 
  const onState   = useCallback((v) => update(stateSet.has(v) ? { state: v, city: "" } : { state: v }), [update, stateSet]);
  const clrState  = useCallback(() => update({ state: "", city: "" }), [update]);
  const onCity    = useCallback((v) => update({ city: v }), [update]);
  const clrCity   = useCallback(() => update({ city: "" }), [update]);
  const onCust    = useCallback((v) => update({ cust: v }), [update]);
  const clrCust   = useCallback(() => update({ cust: "" }), [update]); 
  const onItem    = useCallback((v) => update({ item: v }), [update]);
  const onStatus  = useCallback((v) => update({ orderStatus: v }), [update]);
  const clrStatus = useCallback(() => update({ orderStatus: "" }), [update]);
  const onTerms   = useCallback((v) => update({ payTerms: v }), [update]);
  const clrTerms  = useCallback(() => update({ payTerms: "" }), [update]);
  const onFrom    = useCallback((d) => update({ from: d }), [update]);
  const onTo      = useCallback((d) => update({ to: d }), [update]);
  const onPreset  = useCallback((e) => {
    const p = presets.find((x) => x.key === e.target.value);
    if (p) update({ from: p.from, to: p.to });
  }, [presets, update]);

  const chips = useMemo(() => {
    const base = [
      ["state", "State", filters.state],
      ["city", "City", filters.city],
      ["cust", "Customer", filters.cust], 
      ["item", "Product", filters.item],
    ];
    if (showOrderFilters) {
      base.push(["orderStatus", "Status", filters.orderStatus], ["payTerms", "Pay Terms", filters.payTerms]);
    }
    return base.filter(([, , v]) => v);
  }, [filters, showOrderFilters]);

  const dateChanged = !!dateBounds.min && (filters.from !== dateBounds.min || filters.to !== dateBounds.max);
  const activeCount = chips.length;
  const canReset = activeCount > 0 || dateChanged;

  const activePreset = useMemo(
    () => presets.find((p) => p.from === filters.from && p.to === filters.to)?.key || "",
    [presets, filters.from, filters.to]
  );

  /* Keyboard (page-wide):
       Alt+F  toggle the filter panel
       /      open the panel and focus the first filter
       Esc    close the panel; pressed again with filters active -> reset them
     Typing keys are ignored while the user is inside an input, select or textarea. */
  const panelRef = useRef(null);
  const focusFirst = useCallback(() => {
    requestAnimationFrame(() => panelRef.current?.querySelector("input, select")?.focus());
  }, []);
  useEffect(() => {
    const h = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      if (e.altKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); toggle(); return; }
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (collapsed) toggle();
        focusFirst();
        return;
      }
      if (e.key === "Escape") {
        if (!collapsed) { toggle(); return; }
        if (!typing && canReset) reset();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [collapsed, toggle, focusFirst, canReset, reset]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* ---- header row ---- */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-1.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-[13px] font-bold tracking-tight text-slate-900 sm:text-sm">{title}</h1>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 sm:inline-flex">
            {loading && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />}
            {(recordCount || 0).toLocaleString("en-IN")} records
            {lastFetched && ` · ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            title={`${collapsed ? "Show" : "Hide"} filters (Alt+F · / to search · Esc to reset)`}
            className={`${BTN_BASE} relative shadow-sm ${
              collapsed && activeCount > 0
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>

          {onToggleInsights && (
            <button
              type="button"
              onClick={onToggleInsights}
              title={showInsights ? "Hide AI Insights" : "Show AI Insights"}
              aria-pressed={showInsights}
              className={`${BTN_BASE} relative shadow-sm ${
                showInsights
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">AI</span>
              {!showInsights && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-violet-500 ring-2 ring-white" />
              )}
            </button>
          )}

          <button type="button" onClick={onRefresh} disabled={loading} title="Refresh" className={`${BTN_GHOST} disabled:opacity-50`}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden lg:inline">Refresh</span>
          </button>

          <ExportDropdown onExport={onExport} recordCount={recordCount} filters={filters} title={title} tab={tab} />
        </div>
      </div>

      {/* ---- filter grid ---- */}
      {!collapsed && (
        <div ref={panelRef} className="px-2.5 py-2 sm:px-3"> 
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-9">
            <AutoField options={filterLists.states}    value={filters.state} onChange={onState} onClear={clrState} placeholder="All States" />
            <AutoField options={cityOptions}           value={filters.city}  onChange={onCity}  onClear={clrCity}  placeholder="All Cities" />
            <AutoField options={filterLists.customers} value={filters.cust}  onChange={onCust}  onClear={clrCust}  placeholder="All Customers" />
         
            <DebouncedTextField placeholder="Search product…" value={filters.item} onCommit={onItem} />

            {showOrderFilters && (
              <>
                <AutoField options={ORDER_STATUS_OPTIONS}       value={filters.orderStatus} onChange={onStatus} onClear={clrStatus} placeholder="All Orders" />
                <AutoField options={filterLists.payTerms || []} value={filters.payTerms}    onChange={onTerms}  onClear={clrTerms}  placeholder="All Terms" />
              </>
            )}

            {presets.length > 0 && (
              <select value={activePreset} onChange={onPreset} title="Quick date range" className={`${INPUT_CLS} cursor-pointer`}>
                <option value="">Quick range…</option>
                {presets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            )}

                     <div className="col-span-2 flex items-center gap-1">
              <ERPDateInput value={filters.from} onChange={onFrom} maxDate={filters.to} maxDateLabel="To date" className="h-8 w-[108px] text-xs" />
              <span className="shrink-0 text-slate-300">–</span>
              <ERPDateInput value={filters.to} onChange={onTo} minDate={filters.from} minDateLabel="From date" className="h-8 w-[108px] text-xs" />
            </div>
 
            <button
              type="button"
              onClick={reset}
              disabled={!canReset}
              title="Clear all filters"
              className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-500"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      )}

      {/* ---- active chips ---- */}
      {chips.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1.5 px-2.5 pb-2 sm:px-3 ${collapsed ? "pt-2" : ""}`}>
          {collapsed && (
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Active</span>
          )}
          {chips.map(([key, label, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ [key]: "" })}
              title={`${label}: ${val} — click to remove`}
              className="inline-flex max-w-[calc(100%-8px)] items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:max-w-[220px]"
            >
              <span className="shrink-0 text-indigo-400">{label}:</span>
              <span className="truncate">{val}</span>
              <X className="h-2.5 w-2.5 shrink-0" />
            </button>
          ))}
          {chips.length > 1 && (
            <button type="button" onClick={reset} className="text-[11px] font-semibold text-slate-400 hover:text-rose-600">
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(FiltersBar);

/* ---- Export menu: raw rows (CSV / Excel) + every chart on screen as one workbook ----
   `onExport(format)` keeps working for pages that only pass the old CSV callback:
   they receive "csv" / "xlsx" and may ignore the argument. The "All charts" entry
   appears only inside an ExportRegistryProvider (SalesDashboard). */
const TAB_LABEL = { sales: "Sales", custsales: "Customer Sales", pattern: "Order Pattern", fulfillment: "Fulfillment", agents: "Agent Performance" };

function ExportDropdown({ onExport, recordCount, filters, title, tab }) {
  const registry = useExportRegistry();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => menuRef.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus());
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true); };
  }, [open]);

  const runRaw = useCallback(async (format) => {
    setBusy(format);
    try { await onExport?.(format); }
    catch (err) { console.error("[FiltersBar] export failed:", err); toast.error("Export failed. See console for details."); }
    finally { setBusy(""); setOpen(false); }
  }, [onExport]);

  const runAll = useCallback(async () => {
    if (!registry) return;
    setBusy("all");
    try {
      const sheets = registry.collect();
      if (!sheets.length) { toast.info("Nothing to export yet — scroll the page once so the charts load, then try again."); return; }
      await exportWorkbook({ name: `${title}_${TAB_LABEL[tab] || tab}_charts${rangeSuffix(filters)}`, sheets });
      toast.success(`${sheets.length} charts exported to one workbook`);
    } catch (err) {
      console.error("[FiltersBar] workbook export failed:", err);
      toast.error("Excel export failed. Make sure the 'xlsx' package is installed (npm i xlsx).");
    } finally { setBusy(""); setOpen(false); }
  }, [registry, title, tab, filters]);

  const disabled = !recordCount && !registry;
  const item = "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={disabled ? "No records to export" : "Export"}
        className={`${BTN_BASE} bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        <span className="hidden lg:inline">Export</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div ref={menuRef} role="menu" onKeyDown={menuKeyNav} className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
          <div className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Raw data · {(recordCount || 0).toLocaleString("en-IN")} rows
          </div>
          <button type="button" role="menuitem" disabled={!recordCount || !!busy} onClick={() => runRaw("csv")} className={item}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600"><FileText className="h-3.5 w-3.5" strokeWidth={2.25} /></span>
            <span><span className="block text-xs font-semibold text-slate-800">CSV</span><span className="block text-[10.5px] text-slate-400">.csv · all filtered rows</span></span>
            {busy === "csv" && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />}
          </button>
          <button type="button" role="menuitem" disabled={!recordCount || !!busy} onClick={() => runRaw("xlsx")} className={item}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2.25} /></span>
            <span><span className="block text-xs font-semibold text-slate-800">Excel</span><span className="block text-[10.5px] text-slate-400">.xlsx · all filtered rows</span></span>
            {busy === "xlsx" && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />}
          </button>

          {registry && (
            <>
              <div className="mx-1 my-1 border-t border-slate-100" />
              <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Charts on this tab</div>
              <button type="button" role="menuitem" disabled={!!busy} onClick={runAll} className={item}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600"><Layers className="h-3.5 w-3.5" strokeWidth={2.25} /></span>
                <span><span className="block text-xs font-semibold text-slate-800">All charts → Excel</span><span className="block text-[10.5px] text-slate-400">one sheet per chart, as shown</span></span>
                {busy === "all" && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" />}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const AutoField = memo(function AutoField({ options, value, onChange, onClear, placeholder }) {
  return (
    <div className="relative min-w-0">
      <ERPAutocomplete
        value={value}
        options={options}
        placeholder={placeholder}
        className={`${INPUT_CLS} ${value ? "pr-7" : ""}`}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          title="Clear"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

const DebouncedTextField = memo(function DebouncedTextField({ placeholder, value, onCommit }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef(null);
  useEffect(() => setLocal(value), [value]);

  const commit = (v) => {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onCommit(v), DEBOUNCE_MS);
  };
  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  return (
    <div className="relative min-w-0">
      <input
        type="text"
        placeholder={placeholder}
        className={`${INPUT_CLS} ${local ? "pr-7" : ""}`}
        value={local}
        onChange={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { clearTimeout(timerRef.current); onCommit(local); }
          if (e.key === "Escape" && local) {
            e.stopPropagation();
            clearTimeout(timerRef.current);
            setLocal(""); onCommit("");
          }
        }}
      />
      {local && (
        <button
          type="button"
          onClick={() => { clearTimeout(timerRef.current); setLocal(""); onCommit(""); }}
          title="Clear"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});
import { useMemo, useState, useEffect, useCallback, useRef, memo, startTransition } from "react";
import { X, RotateCcw, SlidersHorizontal, ChevronDown, RefreshCw, Download, Sparkles } from "lucide-react";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { isoOf, addD } from "../../../../utils/helpers";

const INPUT_CLS =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 " +
  "outline-none transition-shadow focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const ORDER_STATUS_OPTIONS = ["Completed", "Pending"];
const DEBOUNCE_MS = 280;
 
function buildPresets(bounds) {
  if (!bounds.max) return [];
  const [y, m, d] = bounds.max.split("-").map(Number);
  const anchor = new Date(y, m - 1, d);
  const qStart = new Date(y, Math.floor((m - 1) / 3) * 3, 1);
  const fyStart = m >= 4 ? new Date(y, 3, 1) : new Date(y - 1, 3, 1);  

  return [
    { key: "7d", label: "Last 7 days", from: isoOf(addD(anchor, -6)), to: bounds.max },
    { key: "30d", label: "Last 30 days", from: isoOf(addD(anchor, -29)), to: bounds.max },
    { key: "mo", label: "This month", from: isoOf(new Date(y, m - 1, 1)), to: bounds.max },
    { key: "qt", label: "This quarter", from: isoOf(qStart), to: bounds.max },
    { key: "fy", label: "This FY", from: isoOf(fyStart), to: bounds.max },
    { key: "all", label: "All time", from: bounds.min, to: bounds.max },
  ];
}

function FiltersBar({
  filters, setFilters, filterLists, rows, dateBounds, tab,
  recordCount, lastFetched, loading, onRefresh, onExport,
  showInsights, onToggleInsights,
}) {
  const [open, setOpen] = useState(false);
  const showOrderFilters = tab !== "sales";  

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

  const update = useCallback((patch) => {
    startTransition(() => setFilters((f) => ({ ...f, ...patch })));
  }, [setFilters]);

  const reset = useCallback(() => {
    startTransition(() => {
      setFilters({
        state: "", city: "", cust: "", grp: "", item: "",
        orderStatus: "", payTerms: "",
        from: dateBounds.min, to: dateBounds.max,
      });
    });
  }, [setFilters, dateBounds.min, dateBounds.max]);

  const chips = useMemo(() => {
    const base = [
      ["state", "State", filters.state],
      ["city", "City", filters.city],
      ["cust", "Customer", filters.cust],
      ["grp", "Group", filters.grp],
      ["item", "Product", filters.item],
    ];
    if (showOrderFilters) {
      base.push(
        ["orderStatus", "Status", filters.orderStatus],
        ["payTerms", "Pay Terms", filters.payTerms]
      );
    }
    return base.filter(([, , v]) => v);
  }, [filters, showOrderFilters]); 
  const dateChanged =
    !!dateBounds.min && (filters.from !== dateBounds.min || filters.to !== dateBounds.max);
  const activeCount = chips.length;
  const canReset = activeCount > 0 || dateChanged;

  const activePreset = useMemo(
    () => presets.find((p) => p.from === filters.from && p.to === filters.to)?.key || "",
    [presets, filters.from, filters.to]
  );

  // Escape se mobile filter panel band
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  return ( 
    <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 shrink-0">Sales Dashboard</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 shrink-0">
            {loading && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />}
            {(recordCount || 0).toLocaleString("en-IN")} records
            {lastFetched && ` · ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleInsights && (
            <button
              onClick={onToggleInsights}
              title={showInsights ? "Hide AI Insights" : "Show AI Insights"}
              aria-pressed={showInsights}
              className={`relative inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:px-2.5 ${showInsights
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-violet-50 hover:text-violet-700"
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
              {!showInsights && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-violet-500 ring-2 ring-white" />
              )}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-white px-2 sm:px-2.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onExport}
            disabled={!recordCount}
            title={recordCount ? "Export CSV" : "No records to export"}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-indigo-600 px-2 sm:px-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div> 
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 md:hidden"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`${open ? "block" : "hidden"} md:block px-3 py-2`}>
        <div className="flex flex-wrap items-center gap-2">
          <AutoField
            options={filterLists.states} value={filters.state}
            onChange={(v) => update({ state: v })}
            onSelect={(v) => update({ state: v, city: "" })}
            onClear={() => update({ state: "", city: "" })}
            placeholder="All States"
          />
          <AutoField
            options={cityOptions} value={filters.city}
            onChange={(v) => update({ city: v })}
            onClear={() => update({ city: "" })}
            placeholder="All Cities"
          />
          <AutoField
            options={filterLists.customers} value={filters.cust}
            onChange={(v) => update({ cust: v })}
            onClear={() => update({ cust: "" })}
            placeholder="All Customers"
            grow
          />
          <AutoField
            options={filterLists.groups} value={filters.grp}
            onChange={(v) => update({ grp: v })}
            onClear={() => update({ grp: "" })}
            placeholder="All Groups"
          />
          <DebouncedTextField
            placeholder="Search product..."
            value={filters.item}
            onCommit={(v) => update({ item: v })}
          />

          {showOrderFilters && (
            <>
              <AutoField
                options={ORDER_STATUS_OPTIONS} value={filters.orderStatus}
                onChange={(v) => update({ orderStatus: v })}
                onClear={() => update({ orderStatus: "" })}
                placeholder="All Orders"
              />
              <AutoField
                options={filterLists.payTerms || []} value={filters.payTerms}
                onChange={(v) => update({ payTerms: v })}
                onClear={() => update({ payTerms: "" })}
                placeholder="All Terms"
              />
            </>
          )} 
          {presets.length > 0 && (
            <select
              value={activePreset}
              onChange={(e) => {
                const p = presets.find((x) => x.key === e.target.value);
                if (p) update({ from: p.from, to: p.to });
              }}
              title="Quick date range"
              className={`${INPUT_CLS} w-[128px] cursor-pointer pr-7`}
            >
              <option value="">Quick range…</option>
              {presets.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <ERPDateInput value={filters.from} onChange={(d) => update({ from: d })} maxDate={filters.to} maxDateLabel="To date" className="h-9 w-[60px] text-xs" />
            <span className="text-slate-300">–</span>
            <ERPDateInput value={filters.to} onChange={(d) => update({ to: d })} minDate={filters.from} minDateLabel="From date" className="h-9 w-[60px] text-xs" />
          </div>

          {canReset && (
            <button
              onClick={reset}
              title="Clear all filters"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map(([key, label, val]) => (
              <button
                key={key}
                onClick={() => update({ [key]: "" })}
                title={`${label}: ${val} — click to remove`}
                className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="shrink-0 text-indigo-400">{label}:</span>
                <span className="truncate">{val}</span>
                <X className="h-2.5 w-2.5 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(FiltersBar);

const AutoField = memo(function AutoField({ options, value, onChange, onSelect, onClear, placeholder, grow }) {
  return (
    <div className={`relative ${grow ? "w-[190px]" : "w-[140px]"}`}>
      <ERPAutocomplete
        value={value}
        options={options}
        placeholder={placeholder}
        className={`${INPUT_CLS} w-full ${value ? "pr-7" : ""}`}
        onChange={(v) => {
          onChange(v);
          if (onSelect && options.includes(v)) onSelect(v);
        }}
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
    <div className="relative w-[160px]">
      <input
        type="text"
        placeholder={placeholder}
        className={`${INPUT_CLS} w-full ${local ? "pr-7" : ""}`}
        value={local}
        onChange={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { clearTimeout(timerRef.current); onCommit(local); }
          if (e.key === "Escape" && local) { clearTimeout(timerRef.current); setLocal(""); onCommit(""); }
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
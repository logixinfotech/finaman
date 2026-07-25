import { useMemo, useState, useEffect, useCallback, useRef, memo, startTransition } from "react";
import { X, RotateCcw, SlidersHorizontal, ChevronDown, RefreshCw, Download } from "lucide-react";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";

const INPUT_CLS =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 " +
  "outline-none transition-shadow focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const ORDER_STATUS_OPTIONS = ["Completed", "Pending"];
const DEBOUNCE_MS = 280;

function FiltersBar({
  filters, setFilters, filterLists, rows, dateBounds, tab,
  recordCount, lastFetched, loading, onRefresh, onExport,
}) {
  const [open, setOpen] = useState(false);
  const showOrderFilters = tab !== "sales"; // Order Status / Pay Terms only relevant on order tabs

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

  const activeCount = chips.length;

  return (
    <div className="sticky top-0 z-30 mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 shrink-0">Sales Dashboard</h1>
          <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 shrink-0">
            {recordCount.toLocaleString("en-IN")} records
            {lastFetched && ` · ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onRefresh} title="Refresh" className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-white px-2 sm:px-2.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={onExport} title="Export CSV" className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-indigo-600 px-2 sm:px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500">
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile-only filters toggle */}
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 md:hidden">
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
          <DebouncedTextField placeholder="Search product..." value={filters.item} onCommit={(v) => update({ item: v })} />

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

          <div className="flex items-center gap-1">
            <ERPDateInput value={filters.from} onChange={(d) => update({ from: d })} maxDate={filters.to} maxDateLabel="To date" className="h-9 w-[110px] text-xs" />
            <span className="text-slate-300">–</span>
            <ERPDateInput value={filters.to} onChange={(d) => update({ to: d })} minDate={filters.from} minDateLabel="From date" className="h-9 w-[110px] text-xs" />
          </div>

          {activeCount > 0 && (
            <button onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
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
                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <span className="text-indigo-400">{label}:</span> {val} <X className="h-2.5 w-2.5" />
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
        <button type="button" onClick={onClear} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
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
  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onCommit(v), DEBOUNCE_MS);
  };
  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);
  return <input type="text" placeholder={placeholder} className={`${INPUT_CLS} w-[160px]`} value={local} onChange={handleChange} />;
});
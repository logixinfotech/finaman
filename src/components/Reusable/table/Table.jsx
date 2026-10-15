import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import TableExport from "./TableExport";
import { HeaderAddButton } from "../button/ActionButon";
import {
  Upload,
  RefreshCw,
  Settings,
  Filter,
  Search,
  FileText,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
  X,
  Inbox,
  Trash2,
  User,
  ArrowUp,
  ArrowDown,
  Copy,
  SlidersHorizontal,
  RotateCcw,
  Lock,
} from "lucide-react";
import { registerShortcutAction } from "../../../utils/erpShortcuts";
import { useShortcutLabel } from "../../../utils/Shortcuts/ShortcutsContext";
import TableRow from "./TableRow";

const TAB_CONFIG_BASE = [
  { id: "entry", Icon: FileText, label: "Entry" },
  { id: "search", Icon: Search, label: "Search" },
];
const SETTINGS_TAB = { id: "settings", Icon: Settings, label: "Settings" };

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 50;
const SEARCH_DEBOUNCE_MS = 400;
const FILTER_DEBOUNCE_MS = 300;

// ── density ──
const DENSITIES = {
  compact: { label: "Compact", height: 28 },
  comfortable: { label: "Normal", height: 34 },
  spacious: { label: "Spacious", height: 42 },
};
const DENSITY_STORAGE_KEY = "erp-table-density";
const readDensity = () => {
  try {
    const v = localStorage.getItem(DENSITY_STORAGE_KEY);
    return DENSITIES[v] ? v : "comfortable";
  } catch {
    return "comfortable";
  }
};

// ── saved layout (per table, per browser) ──
const loadLayout = (k) => {
  try {
    return k ? JSON.parse(localStorage.getItem(k) || "null") : null;
  } catch {
    return null;
  }
};
const buildLayout = (cols, saved) => {
  const keys = cols.map((c) => c.key);
  const savedOrder = Array.isArray(saved?.columnOrder) ? saved.columnOrder : null;
  const order = savedOrder
    ? [...savedOrder.filter((k) => keys.includes(k)), ...keys.filter((k) => !savedOrder.includes(k))]
    : keys;
  const visible = keys.reduce(
    (a, k) => ({ ...a, [k]: saved?.visibleColumns?.[k] ?? true }),
    {},
  );
  return {
    order,
    visible,
    widths: saved?.columnWidths || {},
    locked: (saved?.lockedColumns || []).filter((k) => keys.includes(k)),
  };
};
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const DATE_ISO = /^\d{4}-\d{2}-\d{2}/;
const DATE_DMY = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
const isEmptyVal = (v) => v === null || v === undefined || v === "";
const toNumber = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/[,₹$\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
};
const toDate = (v) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v !== "string") return null;
  if (DATE_ISO.test(v)) {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  const m = v.match(DATE_DMY);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
  return null;
};
const detectType = (rows, key) => {
  let seen = 0;
  let allNum = true;
  let allDate = true;
  for (const r of rows) {
    const v = r[key];
    if (isEmptyVal(v)) continue;
    if (allNum && toNumber(v) === null) allNum = false;
    if (allDate && toDate(v) === null) allDate = false;
    seen++;
    if (seen >= 50 || (!allNum && !allDate)) break;
  }
  if (seen === 0) return "text";
  return allNum ? "number" : allDate ? "date" : "text";
};

// ── column filter: "abc" contains | >100 <=50 != = | 10..20 | "=" (blank) | "!=" (non-blank) ──
const parseFilter = (raw) => {
  const s = (raw || "").trim();
  if (!s) return null;
  if (s === "=") return { op: "empty" };
  if (s === "!=") return { op: "notempty" };
  let m = s.match(/^(.+?)\s*\.\.\s*(.+)$/);
  if (m) return { op: "between", a: m[1].trim(), b: m[2].trim() };
  m = s.match(/^(>=|<=|!=|>|<|=)\s*(.+)$/);
  if (m) return { op: m[1], v: m[2].trim() };
  return { op: "contains", v: s };
};
const makeCmp = (input) => {
  const bn = toNumber(input);
  const bd = toDate(input);
  const bs = String(input);
  return (cell) => {
    if (bn !== null) {
      const a = toNumber(cell);
      if (a !== null) return a - bn;
    }
    if (bd !== null) {
      const d = toDate(cell);
      if (d !== null) return d - bd;
    }
    return collator.compare(String(cell), bs);
  };
};
const buildTest = (f) => {
  switch (f.op) {
    case "empty":
      return (v) => isEmptyVal(v);
    case "notempty":
      return (v) => !isEmptyVal(v);
    case "contains": {
      const q = f.v.toLowerCase();
      return (v) => !isEmptyVal(v) && String(v).toLowerCase().includes(q);
    }
    case "between": {
      const ca = makeCmp(f.a);
      const cb = makeCmp(f.b);
      return (v) => !isEmptyVal(v) && ca(v) >= 0 && cb(v) <= 0;
    }
    default: {
      const c = makeCmp(f.v);
      if (f.op === ">") return (v) => !isEmptyVal(v) && c(v) > 0;
      if (f.op === ">=") return (v) => !isEmptyVal(v) && c(v) >= 0;
      if (f.op === "<") return (v) => !isEmptyVal(v) && c(v) < 0;
      if (f.op === "<=") return (v) => !isEmptyVal(v) && c(v) <= 0;
      if (f.op === "=") return (v) => !isEmptyVal(v) && c(v) === 0;
      return (v) => isEmptyVal(v) || c(v) !== 0; // "!="
    }
  }
};

// ── aggregates ──
const AGG_LABEL = { sum: "Σ", avg: "Avg", count: "Count", min: "Min", max: "Max" };
const computeAgg = (rows, key, op) => {
  if (op === "count") {
    let n = 0;
    for (const r of rows) if (!isEmptyVal(r[key])) n++;
    return n;
  }
  let sum = 0;
  let n = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const r of rows) {
    const v = toNumber(r[key]);
    if (v === null) continue;
    sum += v;
    n++;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!n) return null;
  return op === "sum" ? sum : op === "avg" ? sum / n : op === "min" ? min : max;
};
const fmtNum = (n) =>
  n === null || n === undefined
    ? "—"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// ── default column width ──
const guessColWidth = (c) => {
  const key = (c?.key || "").toLowerCase();
  const label = (c?.label || "").toLowerCase();
  const words = `${key} ${label}`.split(/[^a-z0-9]+/).filter(Boolean);
  if (
    words.some((w) => ["sno", "srno", "slno", "sr", "id", "no"].includes(w)) &&
    words.length <= 2
  ) {
    return 70;
  }
  if (`${key} ${label}`.includes("s.no") || label === "#") return 60;
  return DEFAULT_COL_WIDTH;
};

const ColumnPanel = ({
  columns,
  visibleColumns,
  lockedColumns,
  onToggleVisible,
  onToggleLock,
  density,
  onDensityChange,
  onReset,
}) => (
  <div className="w-64 py-1.5">
    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
      Row density
    </div>
    <div className="flex gap-1 px-3 pb-2 pt-1">
      {Object.entries(DENSITIES).map(([k, d]) => (
        <button
          key={k}
          type="button"
          onClick={() => onDensityChange(k)}
          className={[
            "flex-1 text-[11.5px] py-1 rounded border font-medium transition-colors",
            density === k
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
          ].join(" ")}
        >
          {d.label}
        </button>
      ))}
    </div>
    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100 mb-1">
      Columns
    </div>
    <div className="max-h-[46vh] overflow-y-auto">
      {columns.map((c) => (
        <div
          key={c.key}
          className="flex items-center justify-between px-3 py-[5px] hover:bg-slate-50"
        >
          <label className="flex items-center gap-2 cursor-pointer text-[12.5px] text-slate-700 select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
              checked={!!visibleColumns[c.key]}
              onChange={() => onToggleVisible(c.key)}
            />
            {c.label}
          </label>
          <button
            onClick={() => onToggleLock(c.key)}
            className={[
              "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide transition-colors",
              lockedColumns.includes(c.key)
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            ].join(" ")}
          >
            {lockedColumns.includes(c.key) ? "Locked" : "Lock"}
          </button>
        </div>
      ))}
    </div>
    <div className="border-t border-slate-100 mt-1 px-3 pt-2 pb-1 flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center gap-1.5 h-7 text-[12px] font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        <RotateCcw size={11} /> Reset layout
      </button>
      <p className="text-[11px] text-slate-500 leading-snug">
        Layout (order, width, hide, lock) is table ke liye auto-save hota hai.
        Shift+click header = multi-sort.
      </p>
    </div>
  </div>
);

const Table = ({
  loading = false,
  title,
  data = [],
  columns = [],
  rowKey = "id",
  totalRecords,
  onTabChange,
  serverPagination,
  onPageChange,
  TitleIcon = User,
  onRowClick,
  activeTab,
  showSettingsTab = false,
  onRowDoubleClick,
  onDeleteMultiple,
  onRefresh,
  onExportAll,
  isHidden,
  hideTabs = false,

  onAdd,
  onSearch,
  actions,
  alwaysShowActions = false,
  actionWidth,
  showForm,
  formComponent,
  onToggleFilter,
  onImport,
  logbook,
  pageSizeOptions = [10, 15, 20, 50, 100, 200],
  defaultPageSize = 50,
  storageKey,
  onColumnFilterChange,
  leftPanel = null,
}) => {
  const searchRef = useRef(null);
  const tableContainerRef = useRef(null);
  const dragCol = useRef(null);

  const layoutKey =
    storageKey || title ? `erp-table-layout:${storageKey || title}` : null;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageInput, setPageInput] = useState("1");
  // multi-sort: [{ key, dir: "asc" | "desc" }]
  const [sorts, setSorts] = useState([]);
  const sortField = sorts[0]?.key || "";
  const sortOrder = sorts[0]?.dir || "asc";
  const sortsSig = sorts.map((s) => s.key + s.dir).join("|");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // column filters
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [filters, setFilters] = useState({});
  const [debouncedFilters, setDebouncedFilters] = useState({});
  const canFilter = !serverPagination || !!onColumnFilterChange;

  const columnsSig = columns.map((c) => c.key).join("|");

  const initLayout = useRef(null);
  if (!initLayout.current) initLayout.current = buildLayout(columns, loadLayout(layoutKey));

  const [columnOrder, setColumnOrder] = useState(() => initLayout.current.order);
  const [visibleColumns, setVisibleColumns] = useState(() => initLayout.current.visible);
  const [columnWidths, setColumnWidths] = useState(() => initLayout.current.widths);
  const [lockedColumns, setLockedColumns] = useState(() => initLayout.current.locked);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const anchorRef = useRef(null);

  const [density, setDensity] = useState(readDensity);
  const rowHeight = DENSITIES[density].height;
  const handleDensityChange = useCallback((d) => {
    setDensity(d);
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, d);
    } catch {
      /* ignore */
    }
  }, []);

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = useCallback((m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const TAB_CONFIG = showSettingsTab
    ? [...TAB_CONFIG_BASE, SETTINGS_TAB]
    : TAB_CONFIG_BASE;
  const activeTabConfig =
    TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];

  // ── latest-value refs ──
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;
  const onRowDoubleClickRef = useRef(onRowDoubleClick);
  onRowDoubleClickRef.current = onRowDoubleClick;
  const onDeleteMultipleRef = useRef(onDeleteMultiple);
  onDeleteMultipleRef.current = onDeleteMultiple;
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const onColumnFilterChangeRef = useRef(onColumnFilterChange);
  onColumnFilterChangeRef.current = onColumnFilterChange;
  const searchTextRef = useRef(searchText);
  searchTextRef.current = searchText;
  const focusedRowRef = useRef(focusedRowIndex);
  focusedRowRef.current = focusedRowIndex;
  const memoizedColsRef = useRef([]);

  const stableRowClick = useCallback((row, i) => onRowClickRef.current?.(row, i), []);
  const stableRowDoubleClick = useCallback(
    (row) => onRowDoubleClickRef.current?.(row),
    [],
  );

  // ── mobile tabs dropdown state ──
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const mobileTabsBtnRef = useRef(null);
  const mobileTabsMenuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  // ── column settings dropdown (portal) ──
  const columnBtnRef = useRef(null);
  const columnMenuPanelRef = useRef(null);
  const [columnMenuPos, setColumnMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!showColumnMenu) return;
    const updatePos = () => {
      if (columnBtnRef.current) {
        const rect = columnBtnRef.current.getBoundingClientRect();
        setColumnMenuPos({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [showColumnMenu]);

  useEffect(() => {
    if (!mobileTabsOpen) return;
    const updatePos = () => {
      if (mobileTabsBtnRef.current) {
        const rect = mobileTabsBtnRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [mobileTabsOpen]);

  useEffect(() => {
    if (!mobileTabsOpen) return;
    const handleClickOutside = (e) => {
      const clickedBtn =
        mobileTabsBtnRef.current && mobileTabsBtnRef.current.contains(e.target);
      const clickedMenu =
        mobileTabsMenuRef.current && mobileTabsMenuRef.current.contains(e.target);
      if (!clickedBtn && !clickedMenu) setMobileTabsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileTabsOpen]);

  // ── ERP keyboard shortcuts ──
  const selectedRowsRef = useRef(selectedRows);
  useEffect(() => {
    selectedRowsRef.current = selectedRows;
  }, [selectedRows]);
  const searchShortcutLabel = useShortcutLabel("search");
  const refreshShortcutLabel = useShortcutLabel("refresh");
  const deleteShortcutLabel = useShortcutLabel("delete");

  const visibleDataRef = useRef([]);

  useEffect(
    () =>
      registerShortcutAction("search", () => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }),
    [],
  );

  useEffect(
    () =>
      registerShortcutAction("delete", () => {
        const rows = selectedRowsRef.current;
        if (rows.length > 0) {
          onDeleteMultipleRef.current?.(rows);
          setSelectedRows([]);
          setFocusedRowIndex((p) => {
            const remaining = visibleDataRef.current.length - rows.length;
            return Math.max(0, Math.min(p, remaining - 1));
          });
        }
      }),
    [],
  );

  useEffect(
    () =>
      registerShortcutAction("refresh", () => {
        onRefreshRef.current?.();
      }),
    [],
  );

  // server mode fetch (signature same: page, pageSize, search, sortField, sortOrder)
  useEffect(() => {
    if (serverPagination && onPageChange)
      onPageChange(page, pageSize, searchTextRef.current, sortField, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, serverPagination, sortField, sortOrder]);

  useEffect(() => {
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);
  const firstLayoutRun = useRef(true);
  useEffect(() => {
    if (firstLayoutRun.current) {
      firstLayoutRun.current = false;
      return;
    }
    const l = buildLayout(columnsRef.current, loadLayout(layoutKey));
    setColumnOrder(l.order);
    setVisibleColumns(l.visible);
    setColumnWidths(l.widths);
    setLockedColumns(l.locked);
  }, [columnsSig]);

  useEffect(() => {
    if (!layoutKey) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          layoutKey,
          JSON.stringify({ columnOrder, visibleColumns, columnWidths, lockedColumns }),
        );
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [layoutKey, columnOrder, visibleColumns, columnWidths, lockedColumns]);

  // pehli load par "No records found" ka flash na dikhe (server mode)
  const [awaitingFirstLoad, setAwaitingFirstLoad] = useState(!!serverPagination);
  const wasLoading = useRef(false);
  useEffect(() => {
    if (loading) wasLoading.current = true;
    else if (wasLoading.current) setAwaitingFirstLoad(false);
  }, [loading]);
  useEffect(() => {
    const t = setTimeout(() => setAwaitingFirstLoad(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const lastSearchSent = useRef("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (serverPagination && searchText !== lastSearchSent.current) {
        lastSearchSent.current = searchText;
        setPage(1);
        onSearch?.(searchText);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // ── column filter debounce ──
  const firstFilterRun = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(filters);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters]);

  const activeFilterEntries = useMemo(
    () => Object.entries(debouncedFilters).filter(([, v]) => v && String(v).trim()),
    [debouncedFilters],
  );
  const filtersSig = activeFilterEntries.map(([k, v]) => `${k}=${v}`).join("|");

  // server mode: parent ko batao
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    if (serverPagination && onColumnFilterChangeRef.current) {
      onColumnFilterChangeRef.current(Object.fromEntries(activeFilterEntries));
      setPage(1);
    }
  }, [filtersSig]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortsSig, filtersSig]);

  useEffect(() => {
    setFocusedRowIndex(0);
    setSelectedRows([]);
    anchorRef.current = null;
  }, [page, pageSize, debouncedSearch, sortsSig, filtersSig]);

  useEffect(() => {
    const h = (e) => {
      const clickedBtn =
        columnBtnRef.current && columnBtnRef.current.contains(e.target);
      const clickedMenu =
        columnMenuPanelRef.current &&
        columnMenuPanelRef.current.contains(e.target);
      if (!clickedBtn && !clickedMenu) setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    tableContainerRef.current?.focus();
  }, []);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const searchKeys = useMemo(
    () => columnsRef.current.filter((c) => visibleColumns[c.key]).map((c) => c.key),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnsSig, visibleColumns],
  );

  const compiledFilters = useMemo(() => {
    if (serverPagination) return [];
    const out = [];
    for (const [key, raw] of activeFilterEntries) {
      const f = parseFilter(raw);
      if (f) out.push({ key, test: buildTest(f) });
    }
    return out;
  }, [activeFilterEntries, serverPagination]);

  // ── derived data: filters + search ──
  const filteredData = useMemo(() => {
    if (serverPagination) return safeData;
    const q = debouncedSearch ? debouncedSearch.toLowerCase() : "";
    if (!q && !compiledFilters.length) return safeData;
    return safeData.filter((row) => {
      for (let i = 0; i < compiledFilters.length; i++) {
        const f = compiledFilters[i];
        if (!f.test(row[f.key])) return false;
      }
      if (!q) return true;
      for (let i = 0; i < searchKeys.length; i++) {
        const v = row[searchKeys[i]];
        if (v != null && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [safeData, debouncedSearch, serverPagination, searchKeys, compiledFilters]);

  // ── multi-column sort ──
  const sortedData = useMemo(() => {
    if (serverPagination || !sorts.length) return filteredData;
    const specs = sorts.map((s) => {
      const col = columnsRef.current.find((c) => c.key === s.key);
      return {
        key: s.key,
        dir: s.dir === "asc" ? 1 : -1,
        type: col?.type || detectType(filteredData, s.key),
      };
    });
    const dec = filteredData.map((row, i) => ({
      row,
      i,
      ks: specs.map((sp) => {
        const v = row[sp.key];
        if (isEmptyVal(v)) return null;
        if (sp.type === "number") return toNumber(v);
        if (sp.type === "date") return toDate(v);
        return String(v);
      }),
    }));
    dec.sort((a, b) => {
      for (let j = 0; j < specs.length; j++) {
        const x = a.ks[j];
        const y = b.ks[j];
        if (x === null && y === null) continue;
        if (x === null) return 1; // empty hamesha last
        if (y === null) return -1;
        const c =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : collator.compare(String(x), String(y));
        if (c !== 0) return c * specs[j].dir;
      }
      return a.i - b.i;
    });
    return dec.map((d) => d.row);
  }, [filteredData, sortsSig, serverPagination]);

  const totalPages = serverPagination
    ? Math.ceil((totalRecords || 0) / pageSize)
    : Math.ceil((sortedData?.length || 0) / pageSize);

  const paginatedData = useMemo(() => {
    if (serverPagination) return safeData;
    return (sortedData || []).slice((page - 1) * pageSize, page * pageSize);
  }, [serverPagination, safeData, sortedData, page, pageSize]);

  const curData = serverPagination ? safeData : paginatedData;
  const curDataRef = useRef(curData);
  curDataRef.current = curData;
  visibleDataRef.current = curData;

  const orderedColumns = useMemo(() => {
    const map = Object.fromEntries(columns.map((c) => [c.key, c]));
    return columnOrder.map((k) => map[k]).filter(Boolean);
  }, [columnOrder, columns]);

  const memoizedColumns = useMemo(() => {
    let leftOffset = 0;
    const out = [];
    for (const c of orderedColumns) {
      if (!visibleColumns[c.key]) continue;
      const width = columnWidths[c.key] ?? c.width ?? guessColWidth(c);
      const isFrozen = lockedColumns.includes(c.key);
      out.push({
        ...c,
        width,
        isFrozen,
        stickyLeft: isFrozen ? leftOffset : null,
        align: c.align || (c.type === "number" ? "right" : "left"),
      });
      if (isFrozen) leftOffset += width;
    }
    return out;
  }, [orderedColumns, visibleColumns, columnWidths, lockedColumns]);
  memoizedColsRef.current = memoizedColumns;

  const displayCount = serverPagination ? (totalRecords ?? 0) : sortedData.length;
  const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);
  const visibleColCount = memoizedColumns.length;

  const aggColumns = useMemo(
    () => memoizedColumns.filter((c) => c.aggregate && AGG_LABEL[c.aggregate]),
    [memoizedColumns],
  );
  const footerValues = useMemo(() => {
    if (!aggColumns.length) return null;
    const rows = serverPagination ? safeData : sortedData;
    const out = {};
    for (const c of aggColumns) out[c.key] = computeAgg(rows, c.key, c.aggregate);
    return out;
  }, [aggColumns, serverPagination, safeData, sortedData]);

  const fmtAgg = (c, v) =>
    typeof c.aggFormat === "function" ? c.aggFormat(v) : fmtNum(v);

  // selected rows ka total (selection bar mein)
  const selectedAgg = useMemo(() => {
    if (!selectedRows.length || !aggColumns.length) return [];
    const rows = curData.filter((r) => selectedSet.has(r[rowKey]));
    return aggColumns
      .filter((c) => c.aggregate !== "count")
      .slice(0, 4)
      .map((c) => ({
        key: c.key,
        label: `${c.label} ${AGG_LABEL[c.aggregate]}`,
        text: fmtAgg(c, computeAgg(rows, c.key, c.aggregate)),
      }));
  }, [selectedRows, aggColumns, curData, selectedSet, rowKey]);
  const copyRows = useCallback(
    async (rows) => {
      if (!rows.length) return;
      const cols = memoizedColsRef.current;
      const esc = (v) => String(v ?? "").replace(/[\t\r\n]+/g, " ");
      const lines = rows.map((r) => cols.map((c) => esc(r[c.key])).join("\t"));
      if (rows.length > 1) lines.unshift(cols.map((c) => esc(c.label)).join("\t"));
      const text = lines.join("\n");
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
          /* ignore */
        }
        document.body.removeChild(ta);
      }
      showToast(`${rows.length} row${rows.length > 1 ? "s" : ""} copied`);
    },
    [showToast],
  );

  const copySelected = useCallback(() => {
    const ids = new Set(selectedRowsRef.current);
    copyRows(curDataRef.current.filter((r) => ids.has(r[rowKey])));
  }, [copyRows, rowKey]);

  // ── handlers ──
  const handleRowSelect = useCallback(
    (type, index) => {
      const cur = curDataRef.current;
      const row = cur[index];
      if (!row) return;
      const id = row[rowKey];
      if (type === "single") {
        setSelectedRows([id]);
        anchorRef.current = index;
      } else if (type === "toggle") {
        setSelectedRows((p) =>
          p.includes(id) ? p.filter((r) => r !== id) : [...p, id],
        );
        anchorRef.current = index;
      } else if (type === "range" && anchorRef.current !== null) {
        const start = Math.min(anchorRef.current, index);
        const end = Math.max(anchorRef.current, index);
        setSelectedRows(cur.slice(start, end + 1).map((r) => r[rowKey]));
      } else {
        setSelectedRows([id]);
        anchorRef.current = index;
      }
      setFocusedRowIndex(index);
    },
    [rowKey],
  );

  // ── keyboard navigation ──
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handle = (e) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;

      const cur = curDataRef.current;
      if (!cur.length) return;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((p) => Math.min(p + 1, cur.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusedRowIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setFocusedRowIndex(cur.length - 1);
      } else if (e.key === "Enter") {
        const row = cur[focusedRowRef.current];
        if (row) {
          e.preventDefault();
          onRowDoubleClickRef.current?.(row);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        handleRowSelect("toggle", focusedRowRef.current);
      } else if (e.key === "Escape") {
        setSelectedRows([]);
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedRows(cur.map((r) => r[rowKey]));
      } else if (mod && e.key.toLowerCase() === "c") {
        if (window.getSelection()?.toString()) return; // user ne text select kiya hai
        const ids = new Set(selectedRowsRef.current);
        let rows = ids.size ? cur.filter((r) => ids.has(r[rowKey])) : [];
        if (!rows.length) rows = [cur[focusedRowRef.current]].filter(Boolean);
        e.preventDefault();
        copyRows(rows);
      }
    };

    container.addEventListener("keydown", handle);
    return () => container.removeEventListener("keydown", handle);
  }, [handleRowSelect, rowKey, copyRows]);

  // focused row visible rahe (sirf table container scroll hota hai)
  useEffect(() => {
    const c = tableContainerRef.current;
    const el = c?.querySelector(`tr[data-row-index="${focusedRowIndex}"]`);
    if (!c || !el) return;
    const top = 36 + (showFilterRow && canFilter ? 32 : 0);
    const bottom = aggColumns.length ? 36 : 0;
    const cr = c.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.top < cr.top + top) c.scrollTop -= cr.top + top - er.top;
    else if (er.bottom > cr.bottom - bottom) c.scrollTop += er.bottom - (cr.bottom - bottom);
  }, [focusedRowIndex, showFilterRow, canFilter, aggColumns.length]);

  const handleDragStart = useCallback((key) => {
    dragCol.current = key;
  }, []);
  const handleDrop = useCallback((targetKey) => {
    setColumnOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(dragCol.current);
      const to = arr.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragCol.current);
      return arr;
    });
  }, []);

  const startResize = useCallback(
    (e, key) => {
      e.preventDefault();
      const startX = e.clientX;
      const col = columnsRef.current.find((c) => c.key === key);
      const startW = columnWidths[key] ?? col?.width ?? guessColWidth(col);
      let raf = 0;
      let lastX = startX;
      const apply = () => {
        raf = 0;
        setColumnWidths((p) => ({
          ...p,
          [key]: Math.max(startW + (lastX - startX), MIN_COL_WIDTH),
        }));
      };
      const onMove = (ev) => {
        lastX = ev.clientX;
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const onUp = () => {
        if (raf) cancelAnimationFrame(raf);
        apply();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [columnWidths],
  );

  // header ke resize handle par double-click = content ke hisaab se auto-fit
  const autoFit = useCallback((key) => {
    const col = columnsRef.current.find((c) => c.key === key);
    if (!col) return;
    let max = String(col.label || "").length * 7.5 + 40;
    const rows = curDataRef.current.slice(0, 100);
    for (const r of rows) {
      const v = r[key];
      if (v === null || v === undefined || typeof v === "object") continue;
      const w = String(v).length * 7.2 + 28;
      if (w > max) max = w;
    }
    setColumnWidths((p) => ({ ...p, [key]: Math.round(Math.min(Math.max(max, 60), 520)) }));
  }, []);

  const toggleVisibleColumn = useCallback(
    (key) => setVisibleColumns((p) => ({ ...p, [key]: !p[key] })),
    [],
  );

  const toggleLockColumn = useCallback(
    (key) =>
      setLockedColumns((p) =>
        p.includes(key) ? p.filter((k) => k !== key) : [...p, key],
      ),
    [],
  );

  // click: asc → desc → none | Shift+click: multi-sort mein add / flip / remove
  const handleSortClick = useCallback((key, multi) => {
    setSorts((prev) => {
      const i = prev.findIndex((s) => s.key === key);
      if (multi) {
        if (i === -1) return [...prev, { key, dir: "asc" }];
        if (prev[i].dir === "asc")
          return prev.map((s, j) => (j === i ? { ...s, dir: "desc" } : s));
        return prev.filter((_, j) => j !== i);
      }
      if (prev.length === 1 && i === 0) {
        return prev[0].dir === "asc" ? [{ key, dir: "desc" }] : [];
      }
      return [{ key, dir: "asc" }];
    });
  }, []);

  const resetLayout = useCallback(() => {
    try {
      if (layoutKey) localStorage.removeItem(layoutKey);
    } catch {
      /* ignore */
    }
    const l = buildLayout(columnsRef.current, null);
    setColumnOrder(l.order);
    setVisibleColumns(l.visible);
    setColumnWidths(l.widths);
    setLockedColumns(l.locked);
    setSorts([]);
    setFilters({});
    showToast("Layout reset");
  }, [layoutKey, showToast]);

  const handleDelete = useCallback(() => {
    onDeleteMultipleRef.current?.(selectedRowsRef.current);
    setSelectedRows([]);
    setFocusedRowIndex(0);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setDebouncedFilters({});
  }, []);

  // page jump
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);
  const commitPageInput = () => {
    const n = parseInt(pageInput, 10);
    if (Number.isNaN(n)) {
      setPageInput(String(page));
      return;
    }
    const clamped = Math.min(Math.max(n, 1), totalPages || 1);
    setPage(clamped);
    setPageInput(String(clamped));
  };

  const alignClass = (a) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";
  const justifyClass = (a) =>
    a === "right" ? "justify-end" : a === "center" ? "justify-center" : "";

  const colLabel = (key) => columns.find((c) => c.key === key)?.label || key;
  const filterRowVisible = showFilterRow && canFilter;

  return (
    <div className="relative isolate bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
      {/* loading bar */}
      {loading && (
        <div className="h-[2px] w-full bg-blue-50 overflow-hidden flex-shrink-0">
          <div className="h-full bg-blue-600 w-1/2 animate-[progress_1.4s_ease-in-out_infinite] origin-left" />
        </div>
      )}
      <div
        className="relative flex items-center gap-2 px-2.5 sm:px-3.5 border-b border-slate-200 bg-white rounded-t-xl flex-shrink-0 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
        style={{
          height: 48,
          minHeight: 48,
          maxHeight: 48,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {!isHidden && !hideTabs && (
          <>
            {/* Desktop segmented tabs */}
            <div className="hidden sm:flex shrink-0 items-center gap-0.5 bg-slate-100 rounded-[10px] p-[3px]">
              {TAB_CONFIG.map(({ id, Icon, label }) => {
                const active = activeTab === id;
                const isSettings = id === "settings";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange(id)}
                    className={`
  relative flex items-center gap-1.5 h-[30px] px-3.5 rounded-[8px]
  text-[11px] font-bold tracking-[0.05em] uppercase transition-colors duration-200
  ${active ? "" : "text-slate-500 hover:text-slate-700"}
`}
                    style={
                      active
                        ? { color: isSettings ? "#b45309" : "var(--icon-color)" }
                        : undefined
                    }
                  >
                    {active && (
                      <motion.span
                        layoutId="headerTabHighlight"
                        className="absolute inset-0 rounded-[8px] -z-0"
                        style={{
                          background: "#ffffff",
                          border: "1px solid rgba(15,23,42,0.08)",
                          boxShadow:
                            "0 1px 3px rgba(15,23,42,0.07), 0 1px 1px rgba(15,23,42,0.04)",
                        }}
                        transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                      />
                    )}
                    <Icon size={13} className="relative z-10 shrink-0" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="sm:hidden shrink-0">
              <button
                ref={mobileTabsBtnRef}
                type="button"
                onClick={() => setMobileTabsOpen((v) => !v)}
                className="flex items-center gap-1.5 h-[30px] pl-2.5 pr-2 rounded-[8px] bg-slate-100 text-[12px] font-medium active:scale-[0.97] transition-transform"
                style={{
                  color: activeTab === "settings" ? "#b45309" : "var(--icon-color)",
                }}
              >
                <activeTabConfig.Icon size={13} className="shrink-0" />
                <span>{activeTabConfig.label}</span>
                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform duration-200 ${mobileTabsOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {mobileTabsOpen &&
                createPortal(
                  <motion.div
                    ref={mobileTabsMenuRef}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "fixed",
                      top: menuPos.top,
                      left: menuPos.left,
                      minWidth: Math.max(menuPos.width, 136),
                    }}
                    className="z-[9999] bg-white rounded-[10px] border border-slate-200 shadow-lg p-1"
                  >
                    {TAB_CONFIG.map(({ id, Icon, label }) => {
                      const active = activeTab === id;
                      const isSettings = id === "settings";
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onTabChange(id);
                            setMobileTabsOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-[8px] text-[13px] transition-colors ${active
                              ? "font-medium bg-slate-50"
                              : "text-slate-500 font-normal hover:bg-slate-50"
                            }`}
                          style={
                            active
                              ? { color: isSettings ? "#b45309" : "var(--icon-color)" }
                              : undefined
                          }
                        >
                          <Icon size={13} className="shrink-0" />
                          {label}
                        </button>
                      );
                    })}
                  </motion.div>,
                  document.body,
                )}
            </div>
          </>
        )}
        {!isHidden && Boolean(title) && (
          <div className="hidden sm:flex absolute left-[43%] top-1/2 -translate-x-1/2 -translate-y-1/2 items-center">
            <div
              className="flex items-center gap-1.5 min-w-0 px-2 py-[4px] rounded-md"
              style={{
                border: "1px solid var(--icon-color)",
                background: "var(--accent-soft)",
              }}
            >
              <TitleIcon
                size={14}
                strokeWidth={2.5}
                style={{ color: "var(--icon-color)" }}
              />
              <span
                className="text-[15px] font-medium truncate whitespace-nowrap"
                style={{
                  fontFamily: "'Inter', 'Roboto', 'Segoe UI', system-ui, sans-serif",
                  color: "var(--icon-color)",
                }}
                title={title}
              >
                {title}
              </span>
            </div>
          </div>
        )}
        {isHidden && Boolean(title) && (
          <div
            className="flex items-center gap-3.5 px-4 py-2 self-stretch bg-slate-50/60 rounded-tl-xl mx-auto"
            style={{
              background: "var(--accent-soft, #eff6ff)",
              marginLeft: "-14px",
              marginRight: "14px",
              borderTopLeftRadius: "11px",
            }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 shadow-[0_2px_6px_rgba(37,99,235,0.25)]">
              <TitleIcon size={12} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-[16px] !font-medium text-slate-900 truncate whitespace-nowrap"
                title={title}
              >
                {title}
              </span>
            </div>
          </div>
        )}

        {/* right: controls */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto h-full pr-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="relative flex items-center group shrink-0">
            {loading ? (
              <RefreshCw
                size={12}
                className="absolute left-2.5 text-blue-500 animate-spin pointer-events-none"
              />
            ) : (
              <Search
                size={12}
                className="absolute left-2.5 text-slate-400 pointer-events-none group-focus-within:text-blue-500"
              />
            )}
            <input
              ref={searchRef}
              value={searchText}
              placeholder={`Search${searchShortcutLabel ? ` (${searchShortcutLabel})` : ""}`}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 pl-7 pr-6 text-[12.5px] placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-md w-[110px] sm:w-[185px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
            {searchText && (
              <X
                size={12}
                className="absolute right-2 text-slate-400 cursor-pointer hover:text-slate-700"
                onClick={() => setSearchText("")}
              />
            )}
          </div>

          {canFilter && (
            <button
              onClick={() => setShowFilterRow((v) => !v)}
              title="Column filters (text, >100, 10..20, = blank)"
              className={`relative shrink-0 h-7 min-w-[32px] px-2.5 inline-flex items-center justify-center text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none ${showFilterRow || activeFilterEntries.length
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"
                }`}
            >
              <SlidersHorizontal size={12} />
              {activeFilterEntries.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterEntries.length}
                </span>
              )}
            </button>
          )}

          <div className="shrink-0">
            <TableExport
              title={title}
              columns={columns}
              data={sortedData}
              visibleColumns={visibleColumns}
              serverPagination={serverPagination}
              onExportAll={onExportAll}
              logbook={logbook}
            />
          </div>
          {onImport && (
            <button
              onClick={onImport}
              title="Import data"
              className="shrink-0 h-7 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100"
            >
              <Upload size={12} />
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title={`Refresh${refreshShortcutLabel ? ` (${refreshShortcutLabel})` : ""}`}
              className="shrink-0 h-7 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none bg-pink-50 border-pink-300 text-pink-600 hover:bg-pink-100"
            >
              <RefreshCw size={12} />
            </button>
          )}
          <div className="relative shrink-0">
            <button
              ref={columnBtnRef}
              onClick={() => setShowColumnMenu((p) => !p)}
              title="Columns, density & layout"
              className={`h-7 shrink-0 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none ${showColumnMenu
                  ? "bg-slate-200 border-slate-400 text-slate-700"
                  : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"
                }`}
            >
              <Settings size={12} />
            </button>

            {showColumnMenu &&
              createPortal(
                <div
                  ref={columnMenuPanelRef}
                  style={{
                    position: "fixed",
                    top: columnMenuPos.top,
                    right: columnMenuPos.right,
                  }}
                  className="bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] overflow-hidden"
                >
                  <ColumnPanel
                    columns={columns}
                    visibleColumns={visibleColumns}
                    lockedColumns={lockedColumns}
                    onToggleVisible={toggleVisibleColumn}
                    onToggleLock={toggleLockColumn}
                    density={density}
                    onDensityChange={handleDensityChange}
                    onReset={resetLayout}
                  />
                </div>,
                document.body,
              )}
          </div>

          {onToggleFilter && (
            <button
              onClick={onToggleFilter}
              title="Filters"
              className={`shrink-0 h-7 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none ${showForm
                  ? "bg-amber-100 border-amber-400 text-amber-700"
                  : "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                }`}
            >
              <Filter size={12} />
            </button>
          )}
          {onAdd && (
            <div className="shrink-0">
              <HeaderAddButton compact onClick={onAdd} />
            </div>
          )}
        </div>
      </div>

      {/* filter form */}
      {showForm && <div className="  flex-shrink-0">{formComponent}</div>}

      {/* active column filters bar */}
      {activeFilterEntries.length > 0 && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 border-b border-blue-100 bg-blue-50/60 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {!serverPagination && (
            <span className="text-[12px] font-semibold text-blue-700 whitespace-nowrap">
              {displayCount.toLocaleString()} of {safeData.length.toLocaleString()}
            </span>
          )}
          {activeFilterEntries.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full bg-white border border-blue-200 text-[12px] text-slate-700 whitespace-nowrap"
            >
              <b className="font-semibold">{colLabel(k)}:</b> {v}
              <button
                type="button"
                aria-label={`Remove filter ${colLabel(k)}`}
                onClick={() => {
                  setFilters((p) => ({ ...p, [k]: "" }));
                  setDebouncedFilters((p) => ({ ...p, [k]: "" }));
                }}
                className="w-4 h-4 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto text-[12px] font-medium text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 w-full">
        {leftPanel && (
          <div className="shrink-0 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 bg-white">
            {leftPanel}
          </div>
        )}
        <div
          ref={tableContainerRef}
          tabIndex={0}
          className="overflow-auto flex-1 outline-none bg-white min-h-0"
        >
          <table
            className="w-full border-collapse border-spacing-0 text-[13px]"
            style={{ tableLayout: "fixed" }}
            role="grid"
            aria-label={title}
            aria-rowcount={displayCount}
          >
            <colgroup>
              {memoizedColumns.map((c) => (
                <col key={c.key} style={{ width: c.width }} />
              ))}
              {actions && <col style={{ width: actionWidth || 70 }} />}
            </colgroup>

            <thead className="sticky top-0 z-40">
              <tr>
                {memoizedColumns.map((c) => {
                  const sortIdx = sorts.findIndex((s) => s.key === c.key);
                  const isSorted = sortIdx !== -1;
                  const dir = isSorted ? sorts[sortIdx].dir : null;
                  const stickyStyle = c.isFrozen
                    ? {
                      position: "sticky",
                      left: c.stickyLeft,
                      zIndex: 42,
                      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.07)",
                    }
                    : {};
                  return (
                    <th
                      key={c.key}
                      draggable
                      onDragStart={() => handleDragStart(c.key)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(c.key)}
                      onClick={(e) => handleSortClick(c.key, e.shiftKey)}
                      className={`relative px-3 border-b-2 border-r border-slate-200 bg-slate-100 whitespace-nowrap select-none cursor-pointer hover:bg-slate-200 transition-colors ${alignClass(c.align)}`}
                      style={{ ...stickyStyle, width: c.width, height: 36 }}
                      title={`${c.label} — click: sort, Shift+click: multi-sort`}
                      aria-sort={
                        isSorted ? (dir === "asc" ? "ascending" : "descending") : undefined
                      }
                    >
                      <div className={`flex items-center gap-1 ${justifyClass(c.align)}`}>
                        <span className="text-[12px] font-semibold text-slate-700 truncate">
                          {c.label}
                        </span>
                        {c.isFrozen && <Lock size={10} className="text-blue-500 shrink-0" />}
                        {isSorted && (
                          <span className="inline-flex items-center text-blue-600 shrink-0">
                            {dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {sorts.length > 1 && (
                              <span className="text-[10px] font-bold ml-px">{sortIdx + 1}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          startResize(e, c.key);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          autoFit(c.key);
                        }}
                        title="Drag: resize · Double-click: auto-fit"
                        className="absolute right-0 top-1 bottom-1 w-[4px] cursor-col-resize rounded hover:bg-blue-500 z-10"
                      />
                    </th>
                  );
                })}

                {actions && (
                  <th
                    className="border-b-2 border-l border-slate-200 bg-slate-100 sticky right-0 z-40 text-right px-2.5"
                    style={{
                      width: actionWidth || 70,
                      height: 36,
                      boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.07)",
                    }}
                  >
                    <span className="text-[12px] font-semibold text-slate-700">Actions</span>
                  </th>
                )}
              </tr>

              {/* column filter row */}
              {filterRowVisible && (
                <tr>
                  {memoizedColumns.map((c) => {
                    const stickyStyle = c.isFrozen
                      ? { position: "sticky", left: c.stickyLeft, zIndex: 42 }
                      : {};
                    return (
                      <th
                        key={c.key}
                        className="px-1.5 border-b border-r border-slate-200 bg-slate-50 font-normal"
                        style={{ ...stickyStyle, width: c.width, height: 32 }}
                      >
                        <input
                          value={filters[c.key] ?? ""}
                          onChange={(e) =>
                            setFilters((p) => ({ ...p, [c.key]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Filter"
                          title="Text ya: >100  <=50  10..20  =exact  != (non-blank)  = (blank)"
                          className={`w-full h-6 px-1.5 text-[12px] bg-white border border-slate-200 rounded outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 ${alignClass(c.align)} ${filters[c.key] ? "border-blue-300 bg-blue-50/50" : ""
                            }`}
                        />
                      </th>
                    );
                  })}
                  {actions && (
                    <th
                      className="border-b border-l border-slate-200 bg-slate-50 sticky right-0 z-40"
                      style={{ height: 32 }}
                    />
                  )}
                </tr>
              )}
            </thead>

            <tbody>
              {(loading || awaitingFirstLoad) && paginatedData.length === 0 ? (
                // skeleton rows
                Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100"
                    style={{ height: rowHeight }}
                  >
                    {memoizedColumns.map((c) => (
                      <td key={c.key} className="px-3">
                        <div
                          className="h-3 rounded bg-slate-200/70 animate-pulse"
                          style={{ width: `${45 + ((i * 13 + c.key.length * 7) % 45)}%` }}
                        />
                      </td>
                    ))}
                    {actions && <td />}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColCount + (actions ? 1 : 0)}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Inbox size={36} strokeWidth={1} />
                      <span className="text-[13px] font-medium">
                        {debouncedSearch || activeFilterEntries.length
                          ? "No records match your search / filters"
                          : "No records found"}
                      </span>
                      {(debouncedSearch || activeFilterEntries.length > 0) && (
                        <button
                          className="text-[12px] text-blue-600 hover:underline"
                          onClick={() => {
                            setSearchText("");
                            clearAllFilters();
                          }}
                        >
                          Clear search & filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = row[rowKey];
                  return (
                    <TableRow
                      key={rowId ?? index}
                      row={row}
                      index={index}
                      columns={memoizedColumns}
                      onRowClick={stableRowClick}
                      onRowDoubleClick={stableRowDoubleClick}
                      actions={actions}
                      alwaysShowActions={alwaysShowActions}
                      actionWidth={actionWidth}
                      isFocused={index === focusedRowIndex}
                      isSelected={selectedSet.has(rowId)}
                      onRowSelect={handleRowSelect}
                      searchText={debouncedSearch}
                      rowHeight={rowHeight}
                    />
                  );
                })
              )}
            </tbody>

            {/* footer totals */}
            {footerValues && paginatedData.length > 0 && (
              <tfoot className="sticky bottom-0 z-40">
                <tr>
                  {memoizedColumns.map((c, i) => {
                    const stickyStyle = c.isFrozen
                      ? {
                        position: "sticky",
                        left: c.stickyLeft,
                        zIndex: 42,
                        boxShadow: "2px 0 4px -2px rgba(0,0,0,0.07)",
                      }
                      : {};
                    const hasAgg = !!c.aggregate && AGG_LABEL[c.aggregate];
                    return (
                      <td
                        key={c.key}
                        className={`px-3 border-t-2 border-r border-slate-300 bg-slate-100 whitespace-nowrap overflow-hidden text-ellipsis tabular-nums text-[12.5px] font-semibold text-slate-800 ${alignClass(c.align)}`}
                        style={{ ...stickyStyle, height: 36 }}
                      >
                        {hasAgg ? (
                          <>
                            <span className="text-[11px] font-medium text-slate-500 mr-1">
                              {AGG_LABEL[c.aggregate]}
                            </span>
                            {fmtAgg(c, footerValues[c.key])}
                          </>
                        ) : i === 0 ? (
                          <span className="text-slate-600">
                            {serverPagination ? "Page total" : "Total"}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  {actions && (
                    <td
                      className="border-t-2 border-l border-slate-300 bg-slate-100 sticky right-0 z-40"
                      style={{ height: 36 }}
                    />
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div
          className="flex items-center justify-between px-3.5 border-t border-blue-200 bg-blue-50 flex-shrink-0"
          style={{ height: 38 }}
        >
          <span className="flex items-center min-w-0 text-[12.5px] font-semibold text-blue-700 whitespace-nowrap">
            {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""} selected
            {selectedAgg.length > 0 && (
              <span className="hidden md:flex items-center gap-3 ml-4 font-normal text-blue-800 overflow-hidden">
                {selectedAgg.map((a) => (
                  <span key={a.key} className="whitespace-nowrap">
                    {a.label}: <b className="font-semibold tabular-nums">{a.text}</b>
                  </span>
                ))}
              </span>
            )}
            {deleteShortcutLabel && (
              <span className="hidden lg:inline font-normal text-blue-600 ml-3 text-[11.5px]">
                · {deleteShortcutLabel} to delete
              </span>
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-[12px] font-medium text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
              onClick={() => setSelectedRows([])}
            >
              Clear
            </button>
            <button
              onClick={copySelected}
              title="Copy (Ctrl+C) — Excel mein paste karo"
              className="h-7 px-2.5 bg-white hover:bg-blue-100 text-blue-700 text-[12px] font-semibold rounded-md border border-blue-300 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Copy size={11} /> Copy
            </button>
            <button
              onClick={handleDelete}
              className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-md border-none cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={11} /> Delete selected
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div
        className="flex items-center justify-between px-3.5 border-t border-slate-200 bg-slate-50 flex-shrink-0"
        style={{ height: 40 }}
      >
        <div className="flex items-center gap-3 text-[12px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 bg-white border border-slate-200 rounded px-1.5 text-[12px] outline-none focus:ring-1 focus:ring-blue-400"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span className="hidden sm:inline">
            {paginatedData.length > 0
              ? `${((page - 1) * pageSize + 1).toLocaleString()}–${Math.min(page * pageSize, displayCount).toLocaleString()} of ${displayCount.toLocaleString()}`
              : "0 records"}
          </span>
          <span className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
            {[
              ["↑↓", "navigate"],
              ["Space", "select"],
              ["Ctrl+C", "copy"],
              ...(deleteShortcutLabel ? [[deleteShortcutLabel, "delete"]] : []),
              ["Esc", "clear"],
            ].map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <kbd className="px-1 py-px bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-600">
                  {k}
                </kbd>
                <span>{v}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default"
            disabled={page === 1}
            onClick={() => setPage(1)}
            aria-label="First page"
          >
            <ChevronsLeft size={12} />
          </button>
          <button
            className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={12} />
          </button>
          <span className="h-7 px-2 bg-blue-600 text-white text-[12px] font-bold rounded inline-flex items-center gap-1">
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitPageInput();
                  e.currentTarget.blur();
                }
              }}
              onBlur={commitPageInput}
              onFocus={(e) => e.target.select()}
              aria-label="Go to page"
              title="Page number likho aur Enter dabao"
              className="w-9 h-5 bg-white/15 rounded text-center text-white outline-none focus:bg-white/25"
            />
            / {totalPages || 1}
          </span>
          <button
            className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default"
            disabled={page >= (totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={12} />
          </button>
          <button
            className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default"
            disabled={page >= (totalPages || 1)}
            onClick={() => setPage(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight size={12} />
          </button>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div
          role="status"
          className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-md bg-slate-800 text-white text-[12px] font-medium shadow-lg pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default Table;

import {
  useState, useMemo, useRef, useEffect, useCallback,
} from "react";
import TableExport from "./TableExport";
import { HeaderAddButton, DeleteButton } from "../button/ActionButon";
import TableRow from "./TableRow";
import {
  RefreshCw, Settings, Filter, Search,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  X, Inbox, Trash2,
} from "lucide-react";
import { setERPHandlers } from "../../../utils/erpShortcuts";

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 50;
const SEARCH_DEBOUNCE_MS = 400;

/* ── tiny toolbar button ── */
const TBtn = ({ onClick, active, title, children, className = "" }) => (
  <button
    title={title}
    onClick={onClick}
    className={[
      "h-8 min-w-[32px] px-2.5 inline-flex items-center justify-center gap-1.5",
      "text-[11.5px] font-medium border rounded-md transition-colors duration-75 select-none",
      active
        ? "bg-blue-50 border-blue-400 text-blue-700"
        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-900",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

/* ── column settings panel ── */
const ColumnPanel = ({ columns, visibleColumns, lockedColumns, onToggleVisible, onToggleLock }) => (
  <div className="w-56 py-1.5">
    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
      Columns
    </div>
    {columns.map((c) => (
      <div key={c.key} className="flex items-center justify-between px-3 py-[5px] hover:bg-slate-50">
        <label className="flex items-center gap-2 cursor-pointer text-[12px] text-slate-700 select-none">
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
            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide transition-colors",
            lockedColumns.includes(c.key)
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200",
          ].join(" ")}
        >
          {lockedColumns.includes(c.key) ? "Locked" : "Lock"}
        </button>
      </div>
    ))}
  </div>
);

const Table = ({
  loading = false,
  title,
  data = [],
  columns = [],
  rowKey = "id",
  totalRecords,
  serverPagination,
  onPageChange,
  onRowClick,
  onRowDoubleClick,
  onDeleteMultiple,
  onRefresh,
  onAdd,
  onSearch,
  actions,
  showForm,
  formComponent,
  onToggleFilter,
  pageSizeOptions = [10, 15, 20, 50, 100, 200],
  defaultPageSize = 15,
}) => {
  const searchRef         = useRef(null);
  const columnMenuRef     = useRef(null);
  const tableContainerRef = useRef(null);
  const dragCol           = useRef(null);

  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(defaultPageSize);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [searchText, setSearchText]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [columnOrder, setColumnOrder]       = useState(() => columns.map((c) => c.key));
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((a, c) => ({ ...a, [c.key]: true }), {})
  );
  const [columnWidths, setColumnWidths]   = useState({});
  const [lockedColumns, setLockedColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [selectedRows, setSelectedRows]       = useState([]);
  const [anchorIndex, setAnchorIndex]         = useState(null);

  // FIX: density state — S/M/L tabs now actually work
  const [density, setDensity] = useState("M");
  const rowHeight = { S: 28, M: 34, L: 42 }[density];

  // ── ERP keyboard shortcuts ──
  // NOTE: selectedRows ref so the shortcut always sees latest value
  const selectedRowsRef = useRef(selectedRows);
  useEffect(() => { selectedRowsRef.current = selectedRows; }, [selectedRows]);

  useEffect(() => {
    setERPHandlers({
      onAdd:     () => onAdd?.(),
      onRefresh: () => onRefresh?.(),
      onSearch:  () => searchRef.current?.focus(),
      // FIX: was broken because closure captured stale selectedRows
      onDelete: () => {
        const rows = selectedRowsRef.current;
        if (rows.length > 0) {
          onDeleteMultiple?.(rows);
          setSelectedRows([]);
          // FIX: reset focusedRowIndex so arrow keys don't hang on deleted index
          setFocusedRowIndex(0);
        }
      },
      onExport: () => {},
    });
    return () => setERPHandlers({});
  }, [onAdd, onRefresh, onDeleteMultiple]);

  // ── server pagination trigger ──
  useEffect(() => {
    if (serverPagination && onPageChange) onPageChange(page, pageSize, searchText);
  }, [page, pageSize, serverPagination]);

  useEffect(() => { setPageSize(defaultPageSize); }, [defaultPageSize]);

  // ── sync columns when prop changes ──
  useEffect(() => {
    setColumnOrder(columns.map((c) => c.key));
    setVisibleColumns(columns.reduce((a, c) => ({ ...a, [c.key]: true }), {}));
  }, [columns]);

  // ── search debounce ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (serverPagination) { setPage(1); onSearch?.(searchText); }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => { setPage(1); }, [debouncedSearch, sortField, sortOrder]);

  // ── close column menu on outside click ──
  useEffect(() => {
    const h = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target))
        setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { tableContainerRef.current?.focus(); }, []);

  // ── derived data ──
  const filteredData = useMemo(() => {
    if (serverPagination || !debouncedSearch) return data;
    const q = debouncedSearch.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => v != null && String(v).toLowerCase().includes(q))
    );
  }, [data, debouncedSearch, serverPagination]);

  const sortedData = useMemo(() => {
    if (serverPagination || !sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = String(a[sortField] ?? "");
      const vb = String(b[sortField] ?? "");
      return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filteredData, sortField, sortOrder, serverPagination]);

  const totalPages = serverPagination
    ? Math.ceil((totalRecords || 0) / pageSize)
    : Math.ceil(sortedData.length / pageSize);

  // FIX: paginatedData defined BEFORE the keyboard useEffect that references it
  const paginatedData = useMemo(() => {
    if (serverPagination) return data;
    return sortedData.slice((page - 1) * pageSize, page * pageSize);
  }, [serverPagination, data, sortedData, page, pageSize]);

  const orderedColumns = useMemo(() => {
    const map = Object.fromEntries(columns.map((c) => [c.key, c]));
    return columnOrder.map((k) => map[k]).filter(Boolean);
  }, [columnOrder, columns]);

  const memoizedColumns = useMemo(() => {
    let leftOffset = 0;
    return orderedColumns.map((c) => {
      if (!visibleColumns[c.key]) return null;
      const width    = columnWidths[c.key] || DEFAULT_COL_WIDTH;
      const isFrozen = lockedColumns.includes(c.key);
      const col = { ...c, width, isFrozen, stickyLeft: isFrozen ? leftOffset : null };
      if (isFrozen) leftOffset += width;
      return col;
    });
  }, [orderedColumns, visibleColumns, columnWidths, lockedColumns]);

  // ── keyboard navigation (AFTER paginatedData) ──
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handle = (e) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;

      const curData = serverPagination ? data : paginatedData;
      if (!curData.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((p) => Math.min(p + 1, curData.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        const row = curData[focusedRowIndex];
        if (row) { e.preventDefault(); onRowDoubleClick?.(row); }
      } else if (e.key === " ") {
        e.preventDefault();
        handleRowSelect("toggle", focusedRowIndex);
      } else if (e.key === "Escape") {
        setSelectedRows([]);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedRows(curData.map((r) => r[rowKey]));
      }
      // FIX: Alt+D delete — was not wired to the inline handler at all
      else if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const rows = selectedRowsRef.current;
        if (rows.length > 0) {
          onDeleteMultiple?.(rows);
          setSelectedRows([]);
          // FIX: clamp focusedRowIndex so arrow keys don't get stuck after delete
          setFocusedRowIndex((p) => Math.max(0, Math.min(p, curData.length - rows.length - 1)));
        }
      }
    };

    container.addEventListener("keydown", handle);
    return () => container.removeEventListener("keydown", handle);
  }, [paginatedData, data, focusedRowIndex, onRowDoubleClick, serverPagination, rowKey, onDeleteMultiple]);

  // ── handlers ──
  const handleDragStart = useCallback((key) => { dragCol.current = key; }, []);
  const handleDrop = useCallback((targetKey) => {
    setColumnOrder((prev) => {
      const arr  = [...prev];
      const from = arr.indexOf(dragCol.current);
      const to   = arr.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragCol.current);
      return arr;
    });
  }, []);

  const startResize = useCallback((e, key) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = columnWidths[key] || DEFAULT_COL_WIDTH;
    const onMove = (ev) => requestAnimationFrame(() =>
      setColumnWidths((p) => ({ ...p, [key]: Math.max(startW + (ev.clientX - startX), MIN_COL_WIDTH) }))
    );
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [columnWidths]);

  const toggleVisibleColumn = useCallback((key) =>
    setVisibleColumns((p) => ({ ...p, [key]: !p[key] })), []);

  const toggleLockColumn = useCallback((key) =>
    setLockedColumns((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : [...p, key]), []);

  const handleSortClick = useCallback((key) => {
    setSortField((prev) => {
      if (prev === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return prev; }
      setSortOrder("asc");
      return key;
    });
  }, []);

  const handleRowSelect = useCallback((type, index) => {
    const cur = serverPagination ? data : paginatedData;
    const row = cur[index];
    if (!row) return;
    const id = row[rowKey];
    if (type === "single") {
      setSelectedRows([id]);
    } else if (type === "toggle") {
      setSelectedRows((p) => p.includes(id) ? p.filter((r) => r !== id) : [...p, id]);
    } else if (type === "range" && anchorIndex !== null) {
      const start = Math.min(anchorIndex, index);
      const end   = Math.max(anchorIndex, index);
      setSelectedRows(cur.slice(start, end + 1).map((r) => r[rowKey]));
    }
    setAnchorIndex(index);
  }, [paginatedData, data, rowKey, anchorIndex, serverPagination]);

  const displayCount = serverPagination ? (totalRecords ?? 0) : sortedData.length;

  const handleDelete = useCallback(() => {
    onDeleteMultiple?.(selectedRows);
    setSelectedRows([]);
    setFocusedRowIndex(0); // FIX: reset so ↑↓ don't hang after delete
  }, [selectedRows, onDeleteMultiple]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">

      {/* loading bar */}
      {loading && (
        <div className="h-[2px] w-full bg-blue-50 overflow-hidden flex-shrink-0">
          <div className="h-full bg-blue-600 w-1/2 animate-[progress_1.4s_ease-in-out_infinite] origin-left" />
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between px-3.5 border-b border-slate-200 bg-white flex-shrink-0" style={{ height: 48 }}>

        {/* left: title + count */}
        <div className="flex items-center gap-2.5">
          {/* FIX: accent bar taller + title bigger/bolder */}
          <span className="w-1 h-5 bg-blue-600 rounded-sm flex-shrink-0" aria-hidden="true" />
          <span className="text-[14px] font-bold text-slate-900 tracking-tight">{title}</span>
          <span className="inline-flex items-center h-5 px-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200 uppercase tracking-wide">
            {displayCount?.toLocaleString()} records
          </span>
        </div>

        {/* right: controls */}
        <div className="flex items-center gap-1.5">
          {/* search */}
          <div className="relative flex items-center group">
            {loading
              ? <RefreshCw size={12} className="absolute left-2.5 text-blue-500 animate-spin pointer-events-none" />
              : <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none group-focus-within:text-blue-500" />
            }
            <input
              ref={searchRef}
              value={searchText}
              placeholder="Search records…"
              onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              className="h-8 pl-7 pr-6 text-[11.5px] bg-slate-50 border border-slate-200 rounded-md w-[185px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
            {searchText && (
              <X size={12} className="absolute right-2 text-slate-400 cursor-pointer hover:text-slate-700" onClick={() => setSearchText("")} />
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5" aria-hidden="true" />

          {/* FIX: density S/M/L now actually changes rowHeight via state */}
          <div className="flex border border-slate-200 rounded-md overflow-hidden h-8">
            {["S", "M", "L"].map((k) => (
              <button
                key={k}
                title={{ S: "Compact", M: "Normal", L: "Relaxed" }[k]}
                onClick={() => setDensity(k)}
                className={[
                  "w-7 h-full text-[10px] font-bold border-r last:border-r-0 border-slate-200 transition-colors",
                  density === k
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-700",
                ].join(" ")}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5" aria-hidden="true" />

          <TableExport title={title} columns={columns} data={sortedData} visibleColumns={visibleColumns} />

          {onRefresh && (
            <TBtn onClick={onRefresh} title="Refresh (Alt+R)">
              <RefreshCw size={12} />
            </TBtn>
          )}

          {/* FIX: column menu — was broken because visibleColumns toggle wasn't being called correctly */}
          <div className="relative" ref={columnMenuRef}>
            <TBtn active={showColumnMenu} title="Column settings" onClick={() => setShowColumnMenu((p) => !p)}>
              <Settings size={12} />
            </TBtn>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-[200] overflow-hidden">
                <ColumnPanel
                  columns={columns}
                  visibleColumns={visibleColumns}
                  lockedColumns={lockedColumns}
                  onToggleVisible={toggleVisibleColumn}
                  onToggleLock={toggleLockColumn}
                />
              </div>
            )}
          </div>

          {onToggleFilter && (
            <TBtn active={showForm} title="Filters" onClick={onToggleFilter}>
              <Filter size={12} />
            </TBtn>
          )}

           {onAdd && <HeaderAddButton onClick={onAdd} />}
        </div>
      </div>

      {/* filter form */}
      {showForm && (
        <div className="border-b border-slate-100 bg-slate-50 p-3.5 flex-shrink-0">
          {formComponent}
        </div>
      )}

      {/* ── TABLE ── */}
      <div
        ref={tableContainerRef}
        tabIndex={0}
        className="overflow-auto flex-1 outline-none bg-white"
        style={{ minHeight: 360, maxHeight: "72vh" }}
      >
        <table
          className="w-full border-collapse border-spacing-0 text-[12px]"
          style={{ tableLayout: "fixed" }}
          role="grid"
          aria-label={title}
          aria-rowcount={displayCount}
        >
          <colgroup>
            {memoizedColumns.map((c) => c && <col key={c.key} style={{ width: c.width }} />)}
            {actions && <col style={{ width: 70 }} />}
          </colgroup>

          {/* FIX: header text darker + bolder — was too light */}
          <thead className="sticky top-0 z-40">
            <tr>
              {memoizedColumns.map((c) => {
                if (!c) return null;
                const isSorted = sortField === c.key;
                const stickyStyle = c.isFrozen
                  ? { position: "sticky", left: c.stickyLeft, zIndex: 42, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.07)" }
                  : {};
                return (
                  <th
                    key={c.key}
                    draggable
                    onDragStart={() => handleDragStart(c.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(c.key)}
                    onClick={() => handleSortClick(c.key)}
                    className="relative px-3 border-b-2 border-r border-slate-200 bg-slate-100 text-left whitespace-nowrap select-none cursor-pointer hover:bg-slate-200 transition-colors"
                    style={{ ...stickyStyle, width: c.width, height: 36 }}
                    aria-sort={isSorted ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {/* FIX: column header text now slate-700 + font-bold — was unreadable */}
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.06em]">
                        {c.label}
                      </span>
                      {c.isFrozen && (
                        <span className="text-[9px] text-blue-500" title="Locked">⬛</span>
                      )}
                      {isSorted && (
                        <span className="text-blue-600 text-[12px]">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    <div
                      onMouseDown={(e) => { e.stopPropagation(); startResize(e, c.key); }}
                      className="absolute right-0 top-1 bottom-1 w-[4px] cursor-col-resize rounded hover:bg-blue-500 z-10"
                      aria-hidden="true"
                    />
                  </th>
                );
              })}

              {actions && (
                <th
                  className="border-b-2 border-l border-slate-200 bg-slate-100 sticky right-0 z-40 text-right px-2.5"
                  style={{ height: 36, boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.07)" }}
                >
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.06em]">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && paginatedData.length === 0 ? null
              : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={orderedColumns.length + (actions ? 1 : 0)} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Inbox size={36} strokeWidth={1} />
                      <span className="text-[12px] font-medium">No records found</span>
                      {debouncedSearch && (
                        <button className="text-[11px] text-blue-500 hover:underline" onClick={() => setSearchText("")}>
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
              : paginatedData.map((row, index) => {
                const rowId      = row[rowKey];
                const isSelected = selectedRows.includes(rowId);
                return (
                  <TableRow
                    key={rowId ?? index}
                    row={row}
                    index={index}
                    columns={orderedColumns}
                    visibleColumns={visibleColumns}
                    columnWidths={columnWidths}
                    lockedColumns={lockedColumns}
                    onRowClick={onRowClick}
                    onRowDoubleClick={onRowDoubleClick}
                    actions={actions}
                    isFocused={index === focusedRowIndex}
                    isSelected={isSelected}
                    onRowSelect={handleRowSelect}
                    setAnchorIndex={setAnchorIndex}
                    searchText={debouncedSearch}
                    rowHeight={rowHeight}
                  />
                );
              })
            }
          </tbody>
        </table>
      </div>

      {/* ── SELECTION BAR ── */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between px-3.5 border-t border-blue-200 bg-blue-50 flex-shrink-0" style={{ height: 38 }}>
          <span className="text-[11.5px] font-semibold text-blue-700">
            {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""} selected
            <span className="font-normal text-blue-500 ml-2 text-[10.5px]">· Alt+D to delete</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              className="text-[11px] font-medium text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
              onClick={() => setSelectedRows([])}
            >
              Clear
            </button>
            <button
              onClick={handleDelete}
              className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white text-[11.5px] font-semibold rounded-md border-none cursor-pointer inline-flex items-center gap-1.5 transition-colors"
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
        <div className="flex items-center gap-3 text-[11.5px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 bg-white border border-slate-200 rounded px-1.5 text-[11.5px] outline-none focus:ring-1 focus:ring-blue-400"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="hidden sm:inline opacity-70">
            {paginatedData.length > 0
              ? `${((page - 1) * pageSize + 1).toLocaleString()}–${Math.min(page * pageSize, displayCount).toLocaleString()} of ${displayCount.toLocaleString()}`
              : "0 records"}
          </span>
          {/* keyboard hint */}
          <span className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400">
            {[["↑↓","navigate"],["Space","select"],["Alt+D","delete"],["Esc","clear"]].map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <kbd className="px-1 py-px bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500">{k}</kbd>
                <span>{v}</span>
              </span>
            ))}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default" disabled={page === 1} onClick={() => setPage(1)} aria-label="First page"><ChevronsLeft size={12} /></button>
          <button className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={12} /></button>
          <span className="h-7 px-3 bg-blue-600 text-white text-[11.5px] font-bold rounded inline-flex items-center">
            {page} / {totalPages || 1}
          </span>
          <button className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default" disabled={page >= (totalPages || 1)} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={12} /></button>
          <button className="h-7 w-7 inline-flex items-center justify-center border border-slate-200 rounded bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default" disabled={page >= (totalPages || 1)} onClick={() => setPage(totalPages)} aria-label="Last page"><ChevronsRight size={12} /></button>
        </div>
      </div>
    </div>
  );
};

export default Table;
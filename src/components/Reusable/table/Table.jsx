import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import TableExport from "./TableExport";
import { HeaderAddButton, DeleteButton } from "../button/ActionButon";
import TableRow from "./TableRow";
import {
  RefreshCw,
  Settings,
  Filter,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Inbox,
} from "lucide-react";
import { setERPHandlers } from "../../../utils/erpShortcuts";
const Table = ({
  loading,
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
  pageSizeOptions = [10, 20, 50, 100, 200],
  defaultPageSize = 15,
}) => {
  const searchRef = useRef(null);
  const columnMenuRef = useRef(null);
  const tableContainerRef = useRef(null);
  const dragCol = useRef(null);
  const [anchorIndex, setAnchorIndex] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [lockedColumns, setLockedColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columnOrder, setColumnOrder] = useState(columns.map((c) => c.key));
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((a, c) => ({ ...a, [c.key]: true }), {})
  );
  const [searchText, setSearchText] = useState("");
  const [columnWidths, setColumnWidths] = useState({});
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]); 
  useEffect(() => {
    setERPHandlers({
      onAdd: () => onAdd?.(),
      onRefresh: () => onRefresh?.(),
      onSearch: () => searchRef.current?.focus(),
      onDelete: () => {
        if (selectedRows.length > 0) {
          onDeleteMultiple?.(selectedRows);
          setSelectedRows([]);
        }
      }, 
      onExport: () => { 
      }
    });

    return () => setERPHandlers({}); // Cleanup jab component band ho
  }, [onAdd, onRefresh, selectedRows, onDeleteMultiple]);
 
  useEffect(() => {
    if (serverPagination && onPageChange) {
      onPageChange(page, pageSize, searchText);
    }
  }, [page, pageSize, serverPagination]);

  useEffect(() => {
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  const handleDragStart = (key) => {
    dragCol.current = key;
  };

  const handleDrop = (targetKey) => {
    const newOrder = [...columnOrder];
    const from = newOrder.indexOf(dragCol.current);
    const to = newOrder.indexOf(targetKey);
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, dragCol.current);
    setColumnOrder(newOrder);
  };

  const startResize = (e, key) => {
    const startX = e.clientX;
    const startWidth = columnWidths[key] || 150;

    const onMove = (ev) => {
      requestAnimationFrame(() => {
        setColumnWidths((prev) => ({
          ...prev,
          [key]: Math.max(startWidth + (ev.clientX - startX), 50),
        }));
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleLockColumn = (key) => {
    setLockedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
 
  const filteredData = useMemo(() => {
    if (serverPagination || !debouncedSearch) return data;

    const lowerSearch = debouncedSearch.toLowerCase();

    return data.filter((row) => {
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          const value = row[key];
          if (value != null && String(value).toLowerCase().includes(lowerSearch)) {
            return true;
          }
        }
      }
      return false;
    });
  }, [data, debouncedSearch, serverPagination]);

  const sortedData = useMemo(() => {
    if (serverPagination || !sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = String(a[sortField] ?? "");
      const valB = String(b[sortField] ?? "");
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredData, sortField, sortOrder, serverPagination]);

  const totalPages = serverPagination
    ? Math.ceil(totalRecords / pageSize)
    : Math.ceil(sortedData.length / pageSize);

  const paginatedData = useMemo(() => {
    if (serverPagination) return data;
    return sortedData.slice((page - 1) * pageSize, page * pageSize);
  }, [serverPagination, data, sortedData, page, pageSize]);


  const orderedColumns = useMemo(() => {
    const map = Object.fromEntries(columns.map((c) => [c.key, c]));
    return columnOrder.map((key) => map[key]).filter(Boolean);
  }, [columnOrder, columns]);

  // 5. Action Handlers
  const handleSortClick = useCallback((key) => {
    setSortField((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return key;
    });
  }, []);

  const handleRowSelect = useCallback(
    (type, index) => {
      const currentData = serverPagination ? data : paginatedData;
      const row = currentData[index];
      if (!row) return;

      const id = row[rowKey];

      if (type === "single") {
        setSelectedRows([id]);
      } else if (type === "toggle") {
        setSelectedRows((prev) =>
          prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
      } else if (type === "range" && anchorIndex !== null) {
        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);
        const rangeIds = currentData.slice(start, end + 1).map((r) => r[rowKey]);
        setSelectedRows(rangeIds);
      }
      setAnchorIndex(index);
    },
    [paginatedData, data, rowKey, anchorIndex, serverPagination]
  );
  // 6. Effects for interaction
  useEffect(() => {
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target))
        setShowColumnMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setColumnOrder(columns.map((c) => c.key));
  }, [columns]);

  useEffect(() => {
    tableContainerRef.current?.focus();
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleNavKeys = (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const currentData = serverPagination ? data : paginatedData;
      if (!currentData.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(prev + 1, currentData.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        const currentRow = currentData[focusedRowIndex];
        if (currentRow && onRowDoubleClick) {
          e.preventDefault();
          onRowDoubleClick(currentRow);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        const currentRow = currentData[focusedRowIndex];
        if (currentRow) handleRowSelect("toggle", focusedRowIndex);
      }
    };

    container.addEventListener("keydown", handleNavKeys);
    return () => container.removeEventListener("keydown", handleNavKeys);
  }, [paginatedData, data, focusedRowIndex, onRowDoubleClick, serverPagination, rowKey]);
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchText);

    if (serverPagination) {
      setPage(1);

      if (onSearch) {
        onSearch(searchText);
      }
    }
  }, 500);

  return () => clearTimeout(timer);
}, [searchText]);

  const memoizedColumns = useMemo(() => {
    let leftOffset = 0;
    return orderedColumns.map((c) => {
      if (!visibleColumns[c.key]) return null;

      const width = columnWidths[c.key] || 150;
      const isFrozen = lockedColumns.includes(c.key);

      const columnDef = {
        ...c,
        width,
        isFrozen,
        stickyStyle: isFrozen
          ? { position: "sticky", left: `${leftOffset}px`, zIndex: 50, background: "#f8fafc" }
          : {}
      };

      if (isFrozen) leftOffset += width;
      return columnDef;
    });
  }, [orderedColumns, visibleColumns, columnWidths, lockedColumns]);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      {loading && (
        <div className="absolute top-0 left-0 w-full z-[100]">
          <div className="h-0.5 w-full bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-600 animate-progress-fast origin-left"></div>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold tracking-tight border-l-4 border-blue-600 pl-3 uppercase text-slate-800">
            {title}
          </div>
          <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            {serverPagination ? totalRecords : sortedData.length} Records
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            {loading ? (
              <RefreshCw size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            ) : (
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
            )}
            <input
              ref={searchRef}
              value={searchText}
              placeholder="Search data..."
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchText && <X size={14} className="absolute right-2 top-2 cursor-pointer text-slate-400" onClick={() => setSearchText("")} />}
          </div>

          <TableExport title={title} columns={columns} data={sortedData} visibleColumns={visibleColumns} />

          {onRefresh && (
            <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-all" onClick={onRefresh}>
              <RefreshCw size={14} />
            </button>
          )}

          <div className="relative" ref={columnMenuRef}>
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${showColumnMenu ? "bg-blue-50 border-blue-500 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50"}`}
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              <Settings size={14} />
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] p-2">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Columns</div>
                {columns.map((c) => (
                  <div key={c.key} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-md">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600" checked={visibleColumns[c.key]} onChange={() => setVisibleColumns((p) => ({ ...p, [c.key]: !p[c.key] }))} />
                      {c.label}
                    </label>
                    <button onClick={() => toggleLockColumn(c.key)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${lockedColumns.includes(c.key) ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                      {lockedColumns.includes(c.key) ? "Locked" : "Lock"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {onToggleFilter && (
            <button className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${showForm ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 text-slate-600 border-slate-200"}`} onClick={onToggleFilter}>
              <Filter size={14} />
            </button>
          )}
          {onAdd && <HeaderAddButton onClick={onAdd} />}
        </div>
      </div>

      {showForm && <div className="border-b bg-slate-50/50 p-4 transition-all">{formComponent}</div>}
      <div ref={tableContainerRef} tabIndex={0} className="overflow-auto h-[60vh] min-h-[450px] max-h-[75vh] outline-none relative bg-white scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-slate-50 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr>
              {memoizedColumns.map((c) => {
                if (!c) return null; 

                return (
                  <th
                    key={c.key}
                    draggable
                    onDragStart={() => handleDragStart(c.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(c.key)}
                    onClick={() => handleSortClick(c.key)}
                    style={{ width: c.width, ...c.stickyStyle }}
                    className="px-4 py-2.5 border-b border-slate-200 font-bold text-slate-500 text-left whitespace-nowrap relative tracking-tight cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] tracking-wider">{c.label}</span>
                      {c.isFrozen && <span className="text-[10px] opacity-40">🔒</span>}
                      {sortField === c.key && <span className="text-blue-600">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                    </div>
                    {/* Resize Handle */}
                    <div
                      onMouseDown={(e) => { e.stopPropagation(); startResize(e, c.key); }}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                    />
                  </th>
                );
              })}
              {actions && (
                <th className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 sticky right-0 z-40 text-right uppercase text-[10px] text-slate-500 font-bold shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              null
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length + (actions ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={40} strokeWidth={1} />
                    <span className="text-sm font-medium">No records found</span>
                  </div>
                </td>
              </tr>
            ) : (paginatedData.map((row, index) => {
              const rowId = row[rowKey];
              const isSelected = selectedRows.includes(rowId);

              return (
                <TableRow
                  key={rowId}
                  row={row}
                  data-index={index}
                  index={index}
                  columns={orderedColumns}
                  visibleColumns={visibleColumns}
                  columnWidths={columnWidths}
                  lockedColumns={lockedColumns}
                  rowKey={rowKey}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  actions={actions}
                  isFocused={index === focusedRowIndex}
                  isSelected={isSelected}
                  onRowSelect={handleRowSelect}
                  searchText={debouncedSearch}
                  setAnchorIndex={setAnchorIndex}
                />
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            Rows
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="hidden sm:inline opacity-60">
            Showing {paginatedData.length} of {serverPagination ? totalRecords : sortedData.length} records
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled={page === 1} onClick={() => setPage(1)}>
            <ChevronsLeft size={14} />
          </button>
          <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-0.5 bg-blue-600 text-white rounded-md font-bold">
            {page} / {totalPages || 1}
          </span>
          <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight size={14} />
          </button>
          <button className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
      {selectedRows.length > 0 && (
        <div className="border-t bg-emerald-50 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">{selectedRows.length} items selected</span>
          <DeleteButton
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              onDeleteMultiple?.(selectedRows);
              setSelectedRows([]);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Table;
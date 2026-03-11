import { useState, useMemo, useRef, useEffect } from "react";
import TableExport from "./TableExport";

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
} from "lucide-react";

const Table = ({
  title,
  data = [],
  columns = [],
  rowKey = "id",
  onRowClick,
  selectedRow,
  onRefresh,
  actions,
  headerAction,
  showForm,
  formComponent,
  onToggleFilter,
  pageSizeOptions = [10, 20, 50, 100, 200],
  defaultPageSize = 10,
}) => {

  const searchRef = useRef(null);
  const columnMenuRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columnOrder, setColumnOrder] = useState(columns.map(c => c.key));
  const [columnWidths, setColumnWidths] = useState({});

  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((a, c) => ({ ...a, [c.key]: true }), {})
  );

  useEffect(() => {
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {

    const handleKey = (e) => {

      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        onRefresh?.();
      }

    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

  }, [onRefresh]);

  /* COLUMN DRAG REORDER */
  const dragCol = useRef(null);

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

  /* COLUMN RESIZE */
  const startResize = (e, key) => {

    const startX = e.clientX;
    const startWidth = columnWidths[key] || 150;

    const onMove = (ev) => {

      const newWidth = startWidth + (ev.clientX - startX);

      setColumnWidths((prev) => ({
        ...prev,
        [key]: newWidth
      }));

    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

  };

  /* DATA PROCESSING */
  const processedData = useMemo(() => {

    let rows = [...data];

    if (searchText) {
      rows = rows.filter((row) =>
        columns.some((c) =>
          String(row[c.key] ?? "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )
      );
    }

    if (sortField) {
      rows.sort((a, b) =>
        sortOrder === "asc"
          ? String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""))
          : String(b[sortField] ?? "").localeCompare(String(a[sortField] ?? ""))
      );
    }

    return rows;

  }, [data, searchText, sortField, sortOrder, columns]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;

  const paginatedData = processedData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const orderedColumns = columnOrder
    .map(key => columns.find(c => c.key === key))
    .filter(Boolean);

  const handleSort = (key) => {

    if (sortField === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }

  };

  let leftOffset = 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div
        // className="flex items-center justify-between px-4 py-3 border-b"
        className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-white to-slate-50"
      // style={{ background: "var(--bg-secondary)" }}
      >

        <div className="flex items-center gap-3">

          <div
            className="text-sm font-semibold tracking-wide border-l-4 pl-3 uppercase"
            style={{
              color: "var(--text-main)",
              borderColor: "var(--bg-active)"
            }}
          >
            {title}
          </div>

          <div
            className="text-xs font-medium"
            style={{ color: "var(--bg-active)" }}
          >
            {processedData.length} Records
          </div>

        </div>

        <div className="flex items-center gap-2">

          <div className="relative">

            <Search size={14} className="absolute left-2 top-2 text-slate-400" />

            <input
              ref={searchRef}
              value={searchText}
              placeholder="Search..."
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-7 pr-7 text-xs border border-slate-300 rounded-md w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

            {searchText && (
              <X
                size={14}
                className="absolute right-2 top-2 cursor-pointer text-slate-400"
                onClick={() => setSearchText("")}
              />
            )}

          </div>

          <TableExport
            title={title}
            columns={columns}
            data={processedData}
            visibleColumns={visibleColumns}
          />

          {onRefresh && (
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100 hover:bg-blue-100 transition"
              onClick={onRefresh}
            >
              <RefreshCw size={14} />
            </button>
          )}

          <div className="relative" ref={columnMenuRef}>
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100 hover:bg-blue-100 transition"
              onClick={() => setShowColumnMenu((p) => !p)}
            >
              <Settings size={14} />
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 p-3">
                <div className="text-xs font-semibold mb-2 text-slate-600">
                  Show / Hide Columns
                </div>

                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 text-xs py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[c.key]}
                      onChange={() =>
                        setVisibleColumns((p) => ({
                          ...p,
                          [c.key]: !p[c.key],
                        }))
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {onToggleFilter && (
            <button
              className={`h-8 w-8 flex items-center justify-center border rounded ${showForm ? "bg-blue-50 border-blue-500" : ""
                }`}
              onClick={onToggleFilter}
            >
              <Filter size={14} />
            </button>
          )}

          {headerAction}

        </div>
      </div>

      {showForm && (
        <div className="border-b bg-slate-50 p-4">
          {formComponent}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-auto max-h-[60vh]">

        <table className="w-full text-xs border-collapse">

          <thead className="bg-slate-200/80 backdrop-blur sticky top-0 z-10 border-b border-slate-300">

            <tr>

              {orderedColumns.map((c) => {

                if (!visibleColumns[c.key]) return null;

                const width = columnWidths[c.key] || 150;

                const frozen = c.freeze;

                const style = frozen
                  ? { position: "sticky", left: leftOffset, zIndex: 5, background: "#f1f5f9" }
                  : {};

                if (frozen) leftOffset += width;

                return (

                  <th
                    key={c.key}
                    draggable
                    onDragStart={() => handleDragStart(c.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(c.key)}
                    onClick={() => handleSort(c.key)}
                    style={{ width, ...style }}
                    className="px-3 py-2 border-b border-slate-300 font-semibold text-slate-800 text-left whitespace-nowrap relative tracking-wide bg-slate-100"
                  >

                    {c.label}

                    {sortField === c.key && (
                      <span className="text-[10px] ml-1">
                        {sortOrder === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                    <div
                      onMouseDown={(e) => startResize(e, c.key)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                    />
                  </th>
                );
              })}

              {actions && (
                <th className="px-3 py-2 border text-right">
                  Actions
                </th>
              )}
            </tr>          </thead>
          <tbody>

            {paginatedData.map((row, index) => (

              <tr
                key={row[rowKey]}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-200 hover:bg-blue-50 transition duration-150 cursor-pointer ${selectedRow?.[rowKey] === row[rowKey]
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50/50"
                  }`}
              >

                {orderedColumns.map((c) => {

                  if (!visibleColumns[c.key]) return null;

                  const width = columnWidths[c.key] || 150;

                  return (

                    <td
                      key={c.key}
                      style={{ width }}
                      className="px-3 py-2 border-b border-slate-200 whitespace-nowrap"
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>

                  );

                })}

                {actions && (
                  <td className="px-3 py-2 border text-right">
                    {actions(row)}
                  </td>
                )}

              </tr>

            ))}

          </tbody>

        </table>

      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-xs">

        <div className="flex items-center gap-2">
          Rows
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-1 py-0.5"
          >
            {pageSizeOptions.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">

          <button className="p-1 border rounded" disabled={page === 1} onClick={() => setPage(1)}>
            <ChevronsLeft size={14} />
          </button>

          <button className="p-1 border rounded" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={14} />
          </button>

          <span className="px-2 font-medium">
            {page} / {totalPages}
          </span>

          <button className="p-1 border rounded" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight size={14} />
          </button>

          <button className="p-1 border rounded" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
            <ChevronsRight size={14} />
          </button>

        </div>

      </div>

    </div>
  );
};

export default Table;
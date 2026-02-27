import { useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";

import {
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import TableExport from "./TableExport";


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
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);
  const exportMenuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((a, c) => ({ ...a, [c.key]: true }), {})
  );

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
          ? String(a[sortField] ?? "").localeCompare(
            String(b[sortField] ?? "")
          )
          : String(b[sortField] ?? "").localeCompare(
            String(a[sortField] ?? "")
          )
      );
    }

    return rows;
  }, [data, searchText, sortField, sortOrder, columns]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSort = (key) => {
    if (sortField === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="menu-master-card relative">
      <div className="menu-master-header relative z-40">
        <div className="menu-master-title">{title}</div>

        <div className="menu-master-toolbar-right flex items-center gap-2">
          <input
            className="form-input"
            style={{ height: 22, width: 140 }}
            placeholder="Search..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />

          <div className="download-wrapper" ref={exportMenuRef}>
            <TableExport
              title={title}
              columns={columns}
              data={processedData}
              visibleColumns={visibleColumns}
            />
          </div>

          {onRefresh && (
            <button className="icon-btn" title="Refresh" onClick={onRefresh}>
              <RefreshCw />
            </button>
          )}

          <div className="settings-wrapper" ref={columnMenuRef}>
            <button
              className="icon-btn"
              title="Settings"
              onClick={() => setShowColumnMenu((p) => !p)}
            >
              <Settings />
            </button>

            {showColumnMenu && (
              <div className="settings-dropdown">
                {columns.map((c) => (
                  <label key={c.key} className="settings-dropdown-item">
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
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {onToggleFilter && (
            <button
              className={`icon-btn ${showForm ? "active" : ""}`}
              title="Filter"
              onClick={onToggleFilter}
            >
              <Filter size={16} />
            </button>
          )}

          {headerAction}
        </div>
      </div>

      {showForm && (
        <div className="border-b bg-gray-50 p-4">{formComponent}</div>
      )}

      {/* ================= TABLE ================= */}
      <div className="menu-master-table-wrapper">
        <div className="table-scroll-wrapper">
          <table className="menu-master-table">

            <thead>
              <tr>
                {columns.map(
                  (c) =>
                    visibleColumns[c.key] && (
                      <th
                        key={c.key}
                        onClick={() => {
                          handleSort(c.key);
                          setPage(1);
                        }}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        <span className="flex items-center gap-1">
                          {c.label}
                          {sortField === c.key && (
                            <span>
                              {sortOrder === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </span>
                      </th>
                    )
                )}
                {actions && <th className="text-right">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={() => onRowClick?.(row)}
                  className={
                    selectedRow?.[rowKey] === row[rowKey] ? "selected" : ""
                  }
                >
                  {columns.map(
                    (c) =>
                      visibleColumns[c.key] && (
                        <td key={c.key}>
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      )
                  )}
                  {actions && (
                    <td className="text-right">{actions(row)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="menu-master-footer sticky bottom-0">

        <div className="footer-rows">
          <label>Rows</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="footer-pagination">
          <button
            className="icon-btn"
            disabled={page === 1}
            onClick={() => setPage(1)}
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            className="icon-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="page-indicator">
            {page} / {totalPages || 1}
          </span>

          <button
            className="icon-btn"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>

          <button
            className="icon-btn"
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default Table;

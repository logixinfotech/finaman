import { RefreshCw, Search, Settings, Filter, X } from "lucide-react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import TableExport from "./TableExport";
import { HeaderAddButton } from "../button/ActionButon";

export function TableHeader({
  title, displayCount, loading,
  searchText, setSearchText, searchRef,
  showColumnMenu, setShowColumnMenu, columnMenuRef,
  columns, visibleColumns, setVisibleColumns,
  lockedColumns, toggleLockColumn,
  showForm, onToggleFilter, onRefresh, onAdd, sortedData,
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b bg-white flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="text-[13px] font-bold tracking-tight border-l-4 border-blue-600 pl-2.5 uppercase text-slate-800">
          {title}
        </div>
        <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          {displayCount?.toLocaleString()} Records
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative group">
          {loading
            ? <RefreshCw size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            : <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
          }
          <input
            id="table-search"
            ref={searchRef}
            value={searchText}
            placeholder="Search... (Alt+F)"
            onChange={(e) => setSearchText(e.target.value)}
            className="h-7 pl-7 pr-6 text-[13px] bg-slate-50 border border-slate-200 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchText && (
            <X size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
              onClick={() => setSearchText("")}
            />
          )}
        </div>

        <TableExport title={title} columns={columns} data={sortedData} visibleColumns={visibleColumns} />

        {onRefresh && (
          <button
            className="h-7 w-7 flex items-center justify-center rounded-md bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-all"
            onClick={onRefresh}
            title="Refresh (Alt+R)"
          >
            <RefreshCw size={13} />
          </button>
        )}

        <div className="relative" ref={columnMenuRef}>
          <button
            className={`h-7 w-7 flex items-center justify-center rounded-md border transition-all ${
              showColumnMenu ? "bg-blue-50 border-blue-400 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50"
            }`}
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            title="Column settings"
          >
            <Settings size={13} />
          </button>
          {showColumnMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] p-2">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">
                Columns
              </div>
              {columns.map((c) => (
                <div key={c.key} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-md">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600"
                      checked={visibleColumns[c.key]}
                      onChange={() => setVisibleColumns((p) => ({ ...p, [c.key]: !p[c.key] }))}
                    />
                    {c.label}
                  </label>
                  <button
                    onClick={() => toggleLockColumn(c.key)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      lockedColumns.includes(c.key) ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {lockedColumns.includes(c.key) ? "Locked" : "Lock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {onToggleFilter && (
          <button
            className={`h-7 w-7 flex items-center justify-center border rounded-md transition-all ${
              showForm ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50"
            }`}
            onClick={onToggleFilter}
            title="Toggle filter"
          >
            <Filter size={13} />
          </button>
        )}

        {onAdd && <HeaderAddButton onClick={onAdd} title="Add (Alt+A)" />}
      </div>
    </div>
  );
}

export function TableFooter({
  page, setPage, pageSize, setPageSize,
  totalPages, displayCount, paginatedLength,
  pageSizeOptions = [10, 20, 50, 100, 200],
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t bg-slate-50 text-[12px] text-slate-600 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => {
              // FIX #1: only call setPageSize — Table.jsx handlePageSizeChange
              // already resets page to 1 and triggers server fetch.
              // Do NOT call setPage(1) here — that causes a second fetch.
              setPageSize(Number(e.target.value));
            }}
            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[12px] outline-none focus:ring-1 focus:ring-blue-500"
          >
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <span className="hidden sm:inline text-slate-400">
          {paginatedLength} of {displayCount?.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PagBtn disabled={page === 1} onClick={() => setPage(1)} title="First">
          <ChevronsLeft size={13} />
        </PagBtn>
        <PagBtn disabled={page === 1} onClick={() => setPage(page - 1)} title="Prev">
          <ChevronLeft size={13} />
        </PagBtn>
        <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md text-[12px] font-semibold min-w-[56px] text-center">
          {page} / {totalPages || 1}
        </span>
        <PagBtn disabled={page >= totalPages} onClick={() => setPage(page + 1)} title="Next">
          <ChevronRight size={13} />
        </PagBtn>
        <PagBtn disabled={page >= totalPages} onClick={() => setPage(totalPages)} title="Last">
          <ChevronsRight size={13} />
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, disabled, onClick, title }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 flex items-center justify-center border border-slate-200 rounded-md bg-white disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}

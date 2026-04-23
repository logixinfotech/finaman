import React, { memo } from "react";
import { Inbox } from "lucide-react";
import TableRow from "./TableRow";

const TableBody = memo(({ 
  containerRef, 
  columns, 
  data, 
  rowKey, 
  actions, 
  loading,
  sortField,
  sortOrder,
  onSort,
  onResize,
  onDragStart,
  onDrop,
  focusedRowIndex,
  selectedRows,
  onRowClick,
  onRowDoubleClick,
  onRowSelect,
  setAnchorIndex
}) => {
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex-1 overflow-auto outline-none relative bg-white min-h-0 custom-scrollbar"
    >
      <table className="w-full text-[13px] border-separate border-spacing-0 table-fixed">
        <thead className="sticky top-0 z-40">
          <tr className="bg-slate-50">
            {columns.map((c) => (
              <th
                key={c.key}
                draggable
                onDragStart={() => onDragStart(c.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(c.key)}
                onClick={() => onSort(c.key)}
                style={{ width: c.width, ...c.stickyStyle }}
                className="px-4 py-3 border-b border-slate-200 font-bold text-slate-500 text-left whitespace-nowrap relative cursor-pointer hover:bg-slate-100 transition-colors select-none group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider">{c.label}</span>
                  {c.isFrozen && <span className="text-[10px] text-blue-500">🔒</span>}
                  {sortField === c.key && (
                    <span className="text-blue-600 animate-in fade-in zoom-in">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
                
                {/* Enhanced Resize Handle */}
                <div
                  onMouseDown={(e) => { e.stopPropagation(); onResize(e, c.key); }}
                  className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize group-hover:bg-blue-300/30 opacity-0 group-hover:opacity-100 transition-all"
                />
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 border-b border-slate-200 bg-slate-50 sticky right-0 z-40 text-right text-[11px] uppercase tracking-wider text-slate-400 font-bold shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="py-24 text-center"
              >
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <Inbox size={48} strokeWidth={1} />
                  <p className="text-sm font-medium text-slate-400">No data matches your criteria</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowId = row[rowKey];
              return (
                <TableRow
                  key={rowId}
                  row={row}
                  index={index}
                  columns={columns}
                  rowKey={rowKey}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  actions={actions}
                  isFocused={index === focusedRowIndex}
                  isSelected={selectedRows.includes(rowId)}
                  onRowSelect={onRowSelect}
                  setAnchorIndex={setAnchorIndex}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

export default TableBody;
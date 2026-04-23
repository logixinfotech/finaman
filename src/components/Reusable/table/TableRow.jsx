 
import React from "react";

  

const TableRow = React.memo(({
  row,
  columns,
  visibleColumns,
  columnWidths,
  lockedColumns,
  onRowClick,
  onRowDoubleClick,
  actions,
  index,
  isFocused,
  isSelected,
  onRowSelect,
  searchText 
}) => {
  let leftOffset = 0;

  const highlightMatch = (text) => {
    const stringText = text?.toString() ?? "-";
    if (!searchText || searchText.trim() === "") return stringText;
    const parts = stringText.split(new RegExp(`(${searchText})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchText.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200/80 text-yellow-900 rounded-sm px-0.5 font-medium">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <tr
      onClick={(e) => {
        if (e.shiftKey) onRowSelect?.("range", index);
        else if (e.ctrlKey || e.metaKey) onRowSelect?.("toggle", index);
        else onRowSelect?.("single", index);
        onRowClick?.(row, index);
      }}
      onDoubleClick={() => onRowDoubleClick?.(row)}
      className={`
        group relative border-b border-slate-200/70 cursor-default
        h-10 text-sm transition-all duration-150

        ${isSelected
          ? "bg-emerald-50/90 text-emerald-900 ring-1 ring-inset ring-emerald-200/50"
          : isFocused
            ? "bg-blue-50/80"
            : index % 2 === 0
              ? "bg-white"
              : "bg-slate-50/40"
        }
        hover:bg-blue-50/60
      `}
    >
      {columns.map((c) => {
        if (!visibleColumns[c.key]) return null;

        const width = columnWidths[c.key] || 140;
        const isFrozen = lockedColumns.includes(c.key);

        const stickyStyle = isFrozen
          ? {
              position: "sticky",
              left: leftOffset,
              zIndex: 20,
              background: isSelected 
                ? "linear-gradient(to right, #ecfdf5, #f0fdf4)" 
                : isFocused 
                  ? "#eff6ff" 
                  : "#ffffff",
              boxShadow: "2px 0 8px -3px rgba(0,0,0,0.08)" 
            }
          : {};

        if (isFrozen) leftOffset += width;

        return (
          <td
            key={c.key}
            style={{ width, ...stickyStyle }}
            className={`
              px-4 py-2 border-r border-slate-200/50
              whitespace-nowrap overflow-hidden text-ellipsis
              align-middle relative

              ${isFrozen ? "font-medium text-slate-800" : "text-slate-600"}
              ${isSelected ? "text-emerald-950 font-medium" : ""}
            `}
          >
            {/* 💎 MODERN INDICATORS */}
            {/* Selected Row Left Border */}
            {isSelected && columns[0]?.key === c.key && (
              <div className="absolute left-0 top-0 h-full w-[4px] bg-emerald-500 z-[70] shadow-[1px_0_4px_rgba(16,185,129,0.3)]" />
            )}
            
            {/* Focus Row Left Border */}
            {isFocused && !isSelected && columns[0]?.key === c.key && (
              <div className="absolute left-0 top-0 h-full w-[4px] bg-blue-600 z-[70] shadow-[1px_0_4px_rgba(37,99,235,0.3)]" />
            )}

            <div className="truncate">
              {c.render ? c.render(row) : highlightMatch(row[c.key])}
            </div>
          </td>
        );
      })}

      {/* 🔥 Actions Column - Modernized Background */}
      {actions && (
        <td
          className={`
            px-3 py-2 text-right sticky right-0 z-30
            border-l border-slate-200/60 transition-colors

            ${isSelected
              ? "bg-emerald-50/95 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]"
              : "bg-white group-hover:bg-blue-50/60"}

            shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]
          `}
        >
          <div className="
            flex justify-end items-center gap-2
            opacity-0 group-hover:opacity-100
            transition-all duration-200 transform group-hover:translate-x-0 translate-x-2
          ">
            {actions(row)}
          </div>
        </td>
      )}
    </tr>
  );
});

export default TableRow;
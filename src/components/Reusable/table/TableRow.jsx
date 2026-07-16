import { memo, forwardRef, useCallback } from "react";

const HighlightText = memo(({ text, search }) => {
  if (!search || text == null) return <span>{text ?? "—"}</span>;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return <span>{str}</span>;
  return (
    <span>
      {str.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-800 rounded-[2px] px-[1px]">
        {str.slice(idx, idx + search.length)}
      </mark>
      {str.slice(idx + search.length)}
    </span>
  );
});
HighlightText.displayName = "HighlightText";

const TableRow = memo(
  forwardRef(
    (
      {
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
        searchText,
        setAnchorIndex,
        rowHeight,
      },
      ref
    ) => {
      const baseBg =
        index % 2 === 0
          ? "bg-white"
          : "bg-[#FAFAFA]";

      const handleClick = useCallback(
        (e) => {
          if (!onRowSelect) {
            onRowClick?.(row, index);
            return;
          }
          if (e.shiftKey) {
            onRowSelect("range", index);
          } else if (e.ctrlKey || e.metaKey) {
            onRowSelect("toggle", index);
          } else {
            onRowSelect("single", index);
            onRowClick?.(row, index);
          }
          setAnchorIndex?.(index);
        },
        [onRowSelect, onRowClick, row, index, setAnchorIndex]
      );

      const handleDoubleClick = useCallback(() => {
        onRowDoubleClick?.(row);
      }, [onRowDoubleClick, row]);
      const visibleCols = columns.filter((c) => visibleColumns[c.key]);
      const firstKey = visibleCols[0]?.key;
      let leftOffset = 0;
      const rowClass = [
        "group relative border-b cursor-default transition-colors duration-[60ms]",
        "text-[11.5px]",
        isSelected
          ? "bg-amber-100 outline outline-[1.5px] outline-amber-400 outline-offset-[-1px] z-[1]"
          : [
            isFocused
              ? "bg-[#EFF6FF] outline outline-1 outline-blue-300 outline-offset-[-1px]"
              : baseBg,
            "hover:bg-slate-50",
          ]
            .filter(Boolean)
            .join(" "),
        "border-slate-100",
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <tr
          ref={ref}
          role="row"
          aria-selected={isSelected}
          aria-rowindex={index + 2}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={rowClass}
          style={{ height: rowHeight }}
        >
          {visibleCols.map((c) => {
            const width = columnWidths[c.key] || 150;
            const isFrozen = lockedColumns.includes(c.key);
            const isFirst = c.key === firstKey;
            const frozenBg = isSelected
              ? "#E0E7FF"
              : isFocused
                ? "#EFF6FF"
                : index % 2 === 0
                  ? "#ffffff"
                  : "#FAFAFA";

            const stickyStyle = isFrozen
              ? {
                position: "sticky",
                left: leftOffset,
                zIndex: 5,
                backgroundColor: frozenBg,
                boxShadow: "1px 0 0 0 rgba(226,232,240,1)",
              }
              : {};

            if (isFrozen) leftOffset += width;

            const tdClass = [
              "px-3 py-0 border-r border-slate-100",
              "whitespace-nowrap overflow-hidden text-ellipsis align-middle",
              isSelected
                ? "text-indigo-950 font-semibold"
                : isFrozen
                  ? "font-medium text-slate-800"
                  : "text-slate-700",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <td
                key={c.key}
                role="gridcell"
                style={{
                  width,
                  maxWidth: width,
                  lineHeight: `${rowHeight}px`, 
                  ...stickyStyle
                }}
                className={tdClass}
              >
                {isFirst && (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute left-0 top-0 h-full transition-opacity duration-75",
                      isSelected
                        ? "w-[5px] bg-indigo-600 opacity-100"
                        : isFocused
                          ? "w-[3px] bg-blue-400 opacity-100"
                          : "w-[3px] opacity-0",
                    ].join(" ")}
                  />
                )}

                <div
                  className="truncate flex items-center gap-0"
                  style={{ height: rowHeight }} // Maintains cell height
                >


                  {c.render ? (
                    c.render(row)
                  ) : (
                    <HighlightText
                      text={row[c.key] ?? "—"}
                      search={searchText}
                    />
                  )}
                </div>
              </td>
            );
          })}

          {actions && (
            <td
              role="gridcell"
              className={[
                "px-2 py-0 text-right sticky right-0 z-[6] align-middle",
                "border-l transition-colors duration-[60ms]",
                "shadow-[-1px_0_0_0_rgba(226,232,240,1)]",
                isSelected
                  ? "bg-blue-100 border-blue-200"
                  : "bg-white border-slate-100 group-hover:bg-slate-50",
              ].join(" ")}
              style={{ width: 68, height: rowHeight }}
            >
              <div className="flex justify-end items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
                {actions(row)}
              </div>
            </td>
          )}
        </tr>
      );
    }
  )
);

TableRow.displayName = "TableRow";
export default TableRow;
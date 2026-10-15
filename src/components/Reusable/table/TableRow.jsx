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

/**
 * NOTE (Phase 1): `columns` yahan already FILTERED (sirf visible) aur RESOLVED aati hai
 * — har column mein `width`, `isFrozen`, `stickyLeft`, `align` pehle se calculate hai
 * (Table.jsx ke memoizedColumns se). Isse header aur body ka width/sticky offset
 * hamesha match karega, aur memo sahi kaam karega.
 */
const TableRow = memo(
  forwardRef(
    (
      {
        row,
        columns,
        onRowClick,
        onRowDoubleClick,
        actions,
        alwaysShowActions = false,
        actionWidth,
        index,
        isFocused,
        isSelected,
        onRowSelect,
        searchText,
        rowHeight,
      },
      ref
    ) => {
      const baseBg = index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]";

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
        },
        [onRowSelect, onRowClick, row, index]
      );

      const handleDoubleClick = useCallback(() => {
        onRowDoubleClick?.(row);
      }, [onRowDoubleClick, row]);

      const firstKey = columns[0]?.key;

      const rowClass = [
        "group relative border-b cursor-default transition-colors duration-[60ms]",
        "text-[13px]",
        isSelected
          ? "bg-amber-100 outline outline-[1.5px] outline-amber-400 outline-offset-[-1px] z-[1]"
          : [
              isFocused
                ? "bg-[#EFF6FF] outline outline-1 outline-blue-300 outline-offset-[-1px]"
                : baseBg,
              "hover:bg-slate-50",
            ].join(" "),
        "border-slate-100",
      ].join(" ");

      // frozen cell bg ab selected row ke amber se match karta hai (pehle indigo tha)
      const frozenBg = isSelected
        ? "#FEF3C7"
        : isFocused
          ? "#EFF6FF"
          : index % 2 === 0
            ? "#ffffff"
            : "#FAFAFA";

      return (
        <tr
          ref={ref}
          role="row"
          data-row-index={index}
          aria-selected={isSelected}
          aria-rowindex={index + 2}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={rowClass}
          style={{ height: rowHeight, scrollMarginTop: 36 }}
        >
          {columns.map((c) => {
            const isFirst = c.key === firstKey;
            const isRight = c.align === "right";
            const isCenter = c.align === "center";

            const stickyStyle = c.isFrozen
              ? {
                  position: "sticky",
                  left: c.stickyLeft,
                  zIndex: 5,
                  backgroundColor: frozenBg,
                  boxShadow: "1px 0 0 0 rgba(226,232,240,1)",
                }
              : {};

            const tdClass = [
              "px-3 py-0 border-r border-slate-100 tabular-nums",
              "whitespace-nowrap overflow-hidden text-ellipsis align-middle",
              isSelected
                ? "text-indigo-950 font-semibold"
                : c.isFrozen
                  ? "font-medium text-slate-800"
                  : "text-slate-700",
            ].join(" ");

            const raw = row[c.key];
            const empty = raw === null || raw === undefined || raw === "";
            // truncated value ka poora text hover par dikhe (sirf plain cells ke liye)
            const tip =
              !c.render && !empty && typeof raw !== "object"
                ? String(raw)
                : undefined;

            return (
              <td
                key={c.key}
                role="gridcell"
                title={tip}
                style={{
                  width: c.width,
                  maxWidth: c.width,
                  lineHeight: `${rowHeight}px`,
                  textAlign: c.align || "left",
                  ...stickyStyle,
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
                  className={[
                    "truncate flex items-center gap-0",
                    isRight ? "justify-end" : isCenter ? "justify-center" : "",
                  ].join(" ")}
                  style={{ height: rowHeight }}
                >
                  {c.render ? (
                    c.render(row)
                  ) : empty ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <HighlightText text={raw} search={searchText} />
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
                  ? "bg-amber-100 border-amber-200"
                  : "bg-white border-slate-100 group-hover:bg-slate-50",
              ].join(" ")}
              style={{ width: actionWidth || 68, height: rowHeight }}
            >
              <div
                className={`flex justify-end items-center gap-0.5 ${
                  alwaysShowActions
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                } transition-opacity duration-100`}
              >
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

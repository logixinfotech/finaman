import { useEffect, useRef } from "react";

/**
 * useTableKeyboard
 *
 * Handles:
 *   ArrowUp / ArrowDown  — row navigation
 *   Enter                — open focused row (onRowDoubleClick)
 *   Space                — toggle row selection
 *   Alt+D                — delete selected rows
 *   Alt+A                — add new record
 *   Alt+R                — refresh
 *   Alt+F                — focus search input
 *   Escape               — clear selection
 *
 * FIX #4: Uses useRef for callbacks so the effect never needs to
 * re-register when callbacks change — zero effect re-runs on re-render.
 */
export function useTableKeyboard({
  containerRef,
  currentData,
  focusedRowIndex,
  setFocusedRowIndex,
  onRowDoubleClick,
  handleRowSelect,
  // ERP shortcuts
  onAdd,
  onRefresh,
  onDeleteSelected,
  searchRef,
  clearSelectedRows,
}) {
  // Stable refs — update on every render without re-registering the listener
  const cbRef = useRef({});
  cbRef.current = {
    currentData,
    focusedRowIndex,
    setFocusedRowIndex,
    onRowDoubleClick,
    handleRowSelect,
    onAdd,
    onRefresh,
    onDeleteSelected,
    searchRef,
    clearSelectedRows,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e) => {
      const cb  = cbRef.current;
      const tag = document.activeElement?.tagName.toLowerCase();

      // Alt shortcuts work even when input is focused
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            cb.onDeleteSelected?.();
            return;
          case "a":
            e.preventDefault();
            cb.onAdd?.();
            return;
          case "r":
            e.preventDefault();
            cb.onRefresh?.();
            return;
          case "f":
          case "k":
            e.preventDefault();
            cb.searchRef?.current?.focus();
            return;
          default:
            break;
        }
      }

      // Navigation shortcuts — skip when typing in input
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (!cb.currentData?.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          cb.setFocusedRowIndex((prev) =>
            Math.min(prev + 1, cb.currentData.length - 1)
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          cb.setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
          break;

        case "Enter": {
          const row = cb.currentData[cb.focusedRowIndex];
          if (row && cb.onRowDoubleClick) {
            e.preventDefault();
            cb.onRowDoubleClick(row);
          }
          break;
        }

        case " ":
          e.preventDefault();
          cb.handleRowSelect?.("toggle", cb.focusedRowIndex);
          break;

        case "Escape":
          e.preventDefault();
          cb.clearSelectedRows?.();
          break;

        default:
          break;
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [containerRef]); // only containerRef — everything else via cbRef
}

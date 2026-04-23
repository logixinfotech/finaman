import { useState, useRef, useCallback, useMemo } from "react";

export function useTableState({ columns, defaultPageSize = 15 }) {
  const searchRef         = useRef(null);
  const columnMenuRef     = useRef(null);
  const tableContainerRef = useRef(null);
  const dragCol           = useRef(null); 
  const [page, setPage]                         = useState(1);
  const [pageSize, setPageSize]                 = useState(defaultPageSize);
  const [searchText, setSearchText]             = useState("");
  const [debouncedSearch, setDebouncedSearch]   = useState("");
  const [sortField, setSortField]               = useState("");
  const [sortOrder, setSortOrder]               = useState("asc");
  const [focusedRowIndex, setFocusedRowIndex]   = useState(0);
  const [anchorIndex, setAnchorIndex]           = useState(null);
  const [showColumnMenu, setShowColumnMenu]     = useState(false);
  const [lockedColumns, setLockedColumns]       = useState([]);
  const [columnWidths, setColumnWidths]         = useState({});
 
  const [selectedRowsSet, setSelectedRowsSet] = useState(() => new Set());
 
  const selectedRowsArray = useMemo(
    () => [...selectedRowsSet],
    [selectedRowsSet]
  );

  const setSelectedRows = useCallback((updater) => {
    setSelectedRowsSet((prev) => {
      if (typeof updater === "function") {
        // Support functional update: updater receives current array, returns new array
        const prevArr = [...prev];
        const nextArr = updater(prevArr);
        return new Set(nextArr);
      } 
      return new Set(updater);
    });
  }, []);

  const clearSelectedRows = useCallback(() => {
    setSelectedRowsSet(new Set());
  }, []); 
  const isRowSelected = useCallback(
    (id) => selectedRowsSet.has(id),
    [selectedRowsSet]
  );

  const [columnOrder, setColumnOrder] = useState(() =>
    columns.map((c) => c.key)
  );

  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {})
  );

  const toggleLockColumn = useCallback((key) => {
    setLockedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const handleSortClick = useCallback((key) => {
    if (sortField === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
  }, [sortField]);

  const syncColumnOrder = useCallback((newColumns) => {
    setColumnOrder((prev) => {
      const existingKeys = new Set(prev);
      const newKeys = newColumns
        .map((c) => c.key)
        .filter((k) => !existingKeys.has(k));
      return newKeys.length > 0 ? [...prev, ...newKeys] : prev;
    });
  }, []);

  return { 
    searchRef, columnMenuRef, tableContainerRef, dragCol, 
    page, setPage, pageSize, setPageSize, 
    searchText, setSearchText, debouncedSearch, setDebouncedSearch, 
    sortField, setSortField, sortOrder, setSortOrder, handleSortClick, 
    selectedRows: selectedRowsArray,   // array for bulk actions / count display
    selectedRowsSet,                   // Set for O(1) isSelected check
    setSelectedRows,                   // works with both array and functional updater
    clearSelectedRows,
    isRowSelected,                     // O(1) — use in TableRow
    anchorIndex, setAnchorIndex,
    // columns
    focusedRowIndex, setFocusedRowIndex,
    showColumnMenu, setShowColumnMenu,
    lockedColumns, toggleLockColumn,
    columnWidths, setColumnWidths,
    columnOrder, setColumnOrder, syncColumnOrder,
    visibleColumns, setVisibleColumns,
  };
}

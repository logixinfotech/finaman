import { useState, useMemo, useEffect, useCallback, useRef } from "react";

export const useTableLogic = ({
  data,
  columns,
  rowKey,
  serverPagination,
  onPageChange,
  defaultPageSize,
  totalRecords,
  onDeleteMultiple,
}) => {
  // Original States
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [lockedColumns, setLockedColumns] = useState([]);
  const [columnOrder, setColumnOrder] = useState(columns.map((c) => c.key));
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((a, c) => ({ ...a, [c.key]: true }), {})
  );
  const [columnWidths, setColumnWidths] = useState({});
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorIndex, setAnchorIndex] = useState(null);

  // 1. FIXED: Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 2. FIXED: Bulk Selection Pruning
  // If data refreshes and IDs are gone, remove them from selectedRows
  useEffect(() => {
    if (data.length > 0) {
      const currentIds = new Set(data.map((r) => r[rowKey]));
      setSelectedRows((prev) => prev.filter((id) => currentIds.has(id)));
    }
  }, [data, rowKey]);

  // 3. Pagination & Server Sync
  useEffect(() => {
    if (serverPagination && onPageChange) {
      onPageChange(page, pageSize);
    }
  }, [page, pageSize, serverPagination, onPageChange]);

  // 4. FIXED: Column Lock Safety (Preventing 0px width)
  const toggleLockColumn = useCallback((key) => {
    setLockedColumns((prev) => {
      const isLocked = prev.includes(key);
      if (!isLocked && prev.length >= 4) return prev; // Limit to 4 locks max
      return isLocked ? prev.filter((k) => k !== key) : [...prev, key];
    });
  }, []);

  // Data Processing
  const filteredData = useMemo(() => {
    if (serverPagination || !debouncedSearch) return data;
    const lowerSearch = debouncedSearch.toLowerCase();
    return data.filter((row) =>
      columns.some((c) =>
        String(row[c.key] ?? "").toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, debouncedSearch, columns, serverPagination]);

  const sortedData = useMemo(() => {
    if (serverPagination || !sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = String(a[sortField] ?? "");
      const valB = String(b[sortField] ?? "");
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredData, sortField, sortOrder, serverPagination]);

  const paginatedData = useMemo(() => {
    if (serverPagination) return data;
    return sortedData.slice((page - 1) * pageSize, page * pageSize);
  }, [serverPagination, data, sortedData, page, pageSize]);

  const totalPages = serverPagination
    ? Math.ceil(totalRecords / pageSize)
    : Math.ceil(sortedData.length / pageSize);

  return {
    searchText, setSearchText,
    page, setPage,
    pageSize, setPageSize,
    sortField, setSortField,
    sortOrder, setSortOrder,
    lockedColumns, toggleLockColumn,
    columnOrder, setColumnOrder,
    visibleColumns, setVisibleColumns,
    columnWidths, setColumnWidths,
    focusedRowIndex, setFocusedRowIndex,
    selectedRows, setSelectedRows,
    anchorIndex, setAnchorIndex,
    paginatedData,
    totalPages,
    sortedData // For export
  };
};
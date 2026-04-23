import { useMemo } from "react";
 
export function useTableData({
  data = [],
  columns = [],
  columnOrder,
  visibleColumns,
  columnWidths,
  lockedColumns,
  debouncedSearch,
  sortField,
  sortOrder,
  page,
  pageSize,
  serverPagination,
  totalRecords,
}) { 
  const filteredData = useMemo(() => {
    if (serverPagination || !debouncedSearch) return data;
    const q = debouncedSearch.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [data, debouncedSearch, serverPagination]); 
  const sortedData = useMemo(() => {
    if (serverPagination || !sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = String(a[sortField] ?? "");
      const vb = String(b[sortField] ?? "");
      return sortOrder === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filteredData, sortField, sortOrder, serverPagination]); 
  const totalPages = serverPagination
    ? Math.ceil(totalRecords / pageSize)
    : Math.ceil(sortedData.length / pageSize);

  const paginatedData = useMemo(() => {
    if (serverPagination) return data;
    return sortedData.slice((page - 1) * pageSize, page * pageSize);
  }, [serverPagination, data, sortedData, page, pageSize]); 
  const orderedColumns = useMemo(() => {
    const map = Object.fromEntries(columns.map((c) => [c.key, c]));
    return columnOrder.map((key) => map[key]).filter(Boolean);
  }, [columnOrder, columns]);

  const memoizedColumns = useMemo(() => {
    let leftOffset = 0;
    return orderedColumns
      .filter((c) => visibleColumns[c.key])
      .map((c) => {
        const width     = columnWidths[c.key] || 150;
        const isFrozen  = lockedColumns.includes(c.key);
        const col = {
          ...c,
          width,
          isFrozen,
          stickyStyle: isFrozen
            ? { position: "sticky", left: `${leftOffset}px`, zIndex: 50, background: "#f8fafc" }
            : {},
        };
        if (isFrozen) leftOffset += width;
        return col;
      }); 
  }, [orderedColumns, visibleColumns, columnWidths, lockedColumns]);

  const displayCount = serverPagination ? totalRecords : sortedData.length;

  return {
    filteredData,
    sortedData,
    paginatedData,
    orderedColumns,
    memoizedColumns,
    totalPages,
    displayCount,
  };
}

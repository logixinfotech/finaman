import { useState, useCallback, useRef } from "react";

/**
 * Server-paginated list ke liye reusable hook (har QMS page mein copy-paste ki zaroorat nahi).
 *
 * fetchPage : (params) => Promise<{ data, total }>   — module-level / stable function honi chahiye
 * filters   : { Status: "Closed", ... }  — page ke applied filters (Table ko key={JSON.stringify(filters)} do)
 * mapRow    : (row) => row                — optional (jaise Status default dena)
 *
 * Returns: { rows, total, loading, handlePageChange, refresh }
 */
export function usePagedList({ fetchPage, filters = {}, mapRow }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const last = useRef({ page: 1, pageSize: 50, search: "", sortField: "", sortOrder: "desc" });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;
  const reqId = useRef(0);

  const load = useCallback(async (args) => {
    last.current = args;
    const id = ++reqId.current;          // purane (late aaye) response ko ignore karne ke liye
    setLoading(true);
    try {
      const res = await fetchPage({ ...args, ...filtersRef.current });
      if (id !== reqId.current) return;
      const offset = (args.page - 1) * args.pageSize;
      setRows((res?.data || []).map((r, i) => {
        const row = { ...r, Sr: offset + i + 1 };
        return mapRowRef.current ? mapRowRef.current(row) : row;
      }));
      setTotal(res?.total || 0);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [fetchPage]);

  const handlePageChange = useCallback(
    (page, pageSize, search, sortField, sortOrder) =>
      load({ page, pageSize, search, sortField, sortOrder }),
    [load]
  );
  const refresh = useCallback(() => load(last.current), [load]);

  return { rows, total, loading, handlePageChange, refresh };
}

/* ───────── QmsAPI.js mein ─────────
export const getListPage = (path, params) =>
  handleApi(() => api.get(`/api/qms${path}`, { params }));

export const getDeviationsPage = (p) => getListPage("/deviations", p);
export const getIncidentsPage  = (p) => getListPage("/incidents", p);
export const getCapasPage      = (p) => getListPage("/capas", p);
// ... baaki modules ke liye bhi isi tarah

   ───────── Page mein (Recall wale 40 line ki jagah) ─────────
const { rows, total, loading, handlePageChange, refresh } = usePagedList({
  fetchPage: getDeviationsPage,
  filters: appliedFilters,
  mapRow: (r) => ({ ...r, Status: r.Status || "Initiated" }),
});

<Table key={JSON.stringify(appliedFilters)} storageKey="qms-deviation"
  data={rows} serverPagination totalRecords={total} loading={m.loading || loading}
  onPageChange={handlePageChange} onRefresh={refresh} defaultPageSize={50} ... />
*/
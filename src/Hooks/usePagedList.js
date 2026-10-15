import { useState, useCallback, useRef } from "react";

/**
 * Server-paginated list ke liye reusable hook.
 *
 * fetchPage : (params) => Promise<{ data, total }>   — module-level / stable function honi chahiye
 * filters   : { Status: "Closed", ... }  — applied filters (Table ko key={JSON.stringify(filters)} do)
 * mapRow    : (row) => row                — optional (jaise Status default dena)
 *
 * Returns: { rows, total, loading, handlePageChange, refresh }
 * load/refresh ab mapped rows return karte hain (save ke baad index dhundhne ke kaam aata hai).
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
    if (!fetchPage) return [];
    last.current = args;
    const id = ++reqId.current;          // purane (late aaye) response ko ignore karne ke liye
    setLoading(true);
    try {
      const res = await fetchPage({ ...args, ...filtersRef.current });
      if (id !== reqId.current) return [];
      const offset = (args.page - 1) * args.pageSize;
      const mapped = (res?.data || []).map((r, i) => {
        const row = { ...r, Sr: offset + i + 1 };
        return mapRowRef.current ? mapRowRef.current(row) : row;
      });
      setRows(mapped);
      setTotal(res?.total || 0);
      return mapped;
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

export const getRecallsPage    = (p) => getListPage("/recalls", p);
export const getDeviationsPage = (p) => getListPage("/deviations", p);
// ... baaki modules ke liye bhi isi tarah
*/
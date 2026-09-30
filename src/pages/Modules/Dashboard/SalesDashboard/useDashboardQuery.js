import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ------------------------------------------------------------------
   useDashboardQuery(fetcher, params, enabled)

   One hook for every server-aggregated card:
   - debounced refetch when params change (filters typing)
   - stale-response guard (a slower earlier request can never overwrite
     a newer result)
   - keeps the previous data while reloading, so cards dim instead of
     flashing to a skeleton on every filter change
   - `enabled=false` skips fetching until the card is actually shown
   Returns { data, loading, error, refetch }.
------------------------------------------------------------------ */
const DEBOUNCE_MS = 300;

/* Turn the dashboard `filters` object into API query params (empty -> omitted). */
export function filterParams(filters = {}) {
  return {
    from_date: filters.from || undefined,
    to_date:   filters.to   || undefined,
    state:     filters.state || undefined,
    city:      filters.city  || undefined,
    cust:      filters.cust  || undefined,
    grp:       filters.grp   || undefined,
    item:      filters.item  || undefined,
    payTerms:  filters.payTerms || undefined,
  };
}

export function useDashboardQuery(fetcher, params, enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState(null);
  const seq   = useRef(0);
  const timer = useRef(null);
  const paramsKey = useMemo(() => JSON.stringify(params || {}), [params]);

  const run = useCallback(async (p) => {
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(p);
      if (mySeq !== seq.current) return;
      if (!res?.success) { setError(res?.message || "Request failed"); return; }
      setData(res);
    } catch (err) {
      if (mySeq !== seq.current) return;
      console.error("[useDashboardQuery]", err);
      setError(err.message || "Something went wrong");
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return undefined;
    const p = JSON.parse(paramsKey);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(p), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [enabled, paramsKey, run]);

  const refetch = useCallback(() => run(JSON.parse(paramsKey)), [run, paramsKey]);
  return { data, loading, error, refetch };
}

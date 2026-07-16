import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSalesDashboard, fetchSalesDashboardFilters } from "../utils/api"; 
export const useSalesDashboard = (initialRange = {}) => {
  const [rows, setRows]             = useState([]);
  const [filterLists, setFilterLists] = useState({ states: [], cities: [], customers: [], groups: [] });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const rangeRef = useRef(initialRange);

  const fetchAll = useCallback(async (range) => {
    if (range) rangeRef.current = range;
    setLoading(true);
    setError(null);

    try {
      const [salesRes, filtersRes] = await Promise.all([
        fetchSalesDashboard(rangeRef.current),
        fetchSalesDashboardFilters(),
      ]);

      if (!salesRes || !salesRes.success) {
        setError(salesRes?.message || "Failed to load sales data");
        return;
      }
      if (!filtersRes || !filtersRes.success) { 
        console.warn("[useSalesDashboard] filters fetch failed:", filtersRes?.message);
      }

      setRows(salesRes.data || []);
      setFilterLists(filtersRes?.data || { states: [], cities: [], customers: [], groups: [] });
      setLastFetched(new Date());
    } catch (err) {
      console.error("[useSalesDashboard] EXCEPTION:", err);
      setError(err.message || "Something went wrong loading the dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(initialRange); 
  }, []);

  return {
    rows,
    filterLists,
    loading,
    error,
    lastFetched,
    refetch: fetchAll, // pass a new { from_date, to_date } to re-fetch a different range
  };
};

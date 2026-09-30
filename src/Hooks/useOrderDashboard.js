import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOrderDashboard, fetchOrderDashboardFilters, fetchOrderDashboardHistory } from "../utils/api";

export const useOrderDashboard = (initialRange = {}, enabled = true) => {
  const [rows, setRows] = useState([]);   
  const [hist, setHist] = useState([]);   
  const [filterLists, setFilterLists] = useState({ cities: [], customers: [], groups: [], payTerms: [], states: [] });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const rangeRef = useRef(initialRange);

  const fetchAll = useCallback(async (range) => {
    if (range) rangeRef.current = range;
    setLoading(true);
    setError(null);

    try {
      const [ordersRes, filtersRes, historyRes] = await Promise.all([
        fetchOrderDashboard(rangeRef.current),
        fetchOrderDashboardFilters(),
        fetchOrderDashboardHistory(),
      ]);

      if (!ordersRes || !ordersRes.success) {
        setError(ordersRes?.message || "Failed to load order data");
        return;
      }
      if (!filtersRes || !filtersRes.success) {
        console.warn("[useOrderDashboard] filters fetch failed:", filtersRes?.message);
      }
      if (!historyRes || !historyRes.success) {
        console.warn("[useOrderDashboard] history fetch failed:", historyRes?.message);
      }

      setRows(ordersRes.data || []);
      setHist(historyRes?.data || []);
      setFilterLists(filtersRes?.data || { cities: [], customers: [], groups: [], payTerms: [], states: [] });
      setLastFetched(new Date());
    } catch (err) {
      console.error("[useOrderDashboard] EXCEPTION:", err);
      setError(err.message || "Something went wrong loading the order dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;   
    fetchAll(initialRange);
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, hist, filterLists, loading, error, lastFetched, refetch: fetchAll };
};
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSalesKpis, fetchSalesTrend, fetchSalesSummary } from "../utils/api";

export const useSalesSummary = (initialRange = {}, initialGroupBy = "state", initialGranularity = "day") => {
  const [kpis, setKpis]       = useState(null);
  const [trend, setTrend]     = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const rangeRef = useRef(initialRange);
  const seqRef   = useRef(0);   // har fetch ka sequence number — stale response discard karne ke liye

  const fetchAll = useCallback(async (range, groupBy = initialGroupBy, granularity = initialGranularity) => {
    if (range) rangeRef.current = range;
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);

    try {
      const [kpisRes, trendRes, summaryRes] = await Promise.all([
        fetchSalesKpis(rangeRef.current),
        fetchSalesTrend({ ...rangeRef.current, granularity }),
        fetchSalesSummary({ ...rangeRef.current, groupBy }),
      ]);

      if (seq !== seqRef.current) return;   // beech me naya fetch chala — ye purana result phenk do

      if (!kpisRes?.success)    console.warn("[useSalesSummary] kpis fetch failed:", kpisRes?.message);
      if (!trendRes?.success)   console.warn("[useSalesSummary] trend fetch failed:", trendRes?.message);
      if (!summaryRes?.success) console.warn("[useSalesSummary] summary fetch failed:", summaryRes?.message);

      // KPIs strip ka primary data hai — fail hua to user ko dikhna chahiye, chup na raho
      if (!kpisRes?.success) {
        setError(kpisRes?.message || "Failed to load KPIs");
      }

      setKpis(kpisRes?.data || null);
      setTrend(trendRes?.data || []);
      setSummary(summaryRes?.data || []);
    } catch (err) {
      if (seq !== seqRef.current) return;
      console.error("[useSalesSummary] EXCEPTION:", err);
      setError(err.message || "Something went wrong loading the summary");
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, [initialGroupBy, initialGranularity]);

  useEffect(() => {
    fetchAll(initialRange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { kpis, trend, summary, loading, error, refetch: fetchAll };
};
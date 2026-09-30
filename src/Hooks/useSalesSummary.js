import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchSalesKpis,
  fetchSalesTrend,
  fetchSalesSummary,
  fetchAgentPerformance,
} from "../utils/api";

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
 
export const useAgentPerformance = (enabled = true) => {
  const [data, setData]     = useState([]);
  const [totals, setTotals] = useState({ target: 0, achieved: 0, invoices: 0, pct: 0 });
  const [months, setMonths] = useState(1);
  const [unassigned, setUnassigned] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState(null);
  const seqRef = useRef(0);
  const [bounds, setBounds] = useState({ minDt: "", maxDt: "" });
  const fetchAll = useCallback(async (params = {}) => {
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchAgentPerformance(params);

      if (seq !== seqRef.current) return;   // stale response — discard

      if (!res?.success) {
        setError(res?.message || "Failed to load agent performance");
        return;
      }

      setData(res.data || []);
      setTotals(res.totals || { target: 0, achieved: 0, invoices: 0, pct: 0 });
      setMonths(res.months || 1);
      setUnassigned(res.unassigned || null);
       setBounds(res.bounds || { minDt: "", maxDt: "" });
    } catch (err) {
      if (seq !== seqRef.current) return;
      console.error("[useAgentPerformance] EXCEPTION:", err);
      setError(err.message || "Something went wrong loading agent performance");
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchAll();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, totals, months, unassigned, bounds, loading, error, refetch: fetchAll };
};
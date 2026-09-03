import { useState, useEffect, useCallback } from "react";
import { fetchDashboardSummary } from "../utils/api";

export const useDashboard = () => {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchSummary = useCallback(async () => {
    // console.log("\n[useDashboard] ▶ fetchSummary called");
    setLoading(true);
    setError(null);

    try { 
      const res = await fetchDashboardSummary();
 
      if (!res) {
        console.error("[useDashboard] ❌ Response is null/undefined");
        setError("No response from server");
        return;
      }

      if (!res.success) {
        console.error("[useDashboard] ❌ success: false | message:", res.message);
        setError(res.message || "Failed to load dashboard");
        return;
      }

      if (!res.data) {
        console.error("[useDashboard] ❌ res.success=true but res.data is missing:", res);
        setError("Data missing in response");
        return;
      } 

      setData(res.data);
      setLastFetched(new Date());
      // console.log("[useDashboard] ✅ State updated successfully");

    } catch (err) {
      console.error("[useDashboard] ❌ EXCEPTION:", err);
      console.error("[useDashboard] ❌ message:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      // console.log("[useDashboard] fetchSummary done — loading: false\n");
    }
  }, []);

  useEffect(() => { 
    fetchSummary();
    const interval = setInterval(() => {
      // console.log("[useDashboard] Auto-refresh triggered (5 min)");
      fetchSummary();
    }, 5 * 60 * 1000);
    return () => { 
      clearInterval(interval);
    };
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary, lastFetched };
};
import { useState, useEffect, useCallback } from "react";
import { fetchDashboardSummary } from "../utils/api";

export const useDashboard = () => {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchSummary = useCallback(async () => {
    console.log("\n[useDashboard] ▶ fetchSummary called");
    setLoading(true);
    setError(null);

    try {
      console.log("[useDashboard] Calling fetchDashboardSummary...");
      const res = await fetchDashboardSummary();

      console.log("[useDashboard] Raw API response:", res);

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

      console.log("[useDashboard] ✅ KPI data:", res.data.kpi);
      console.log("[useDashboard] ✅ Work diary stats:", res.data.work_diary?.stats);
      console.log("[useDashboard] ✅ Payroll gross:", res.data.payroll?.gross_total);
      console.log("[useDashboard] ✅ Trend months:", res.data.payroll?.trend?.map(t => t.month_year));
      console.log("[useDashboard] ✅ Grade mix:", res.data.payroll?.grade_mix);
      console.log("[useDashboard] ✅ Team members:", res.data.work_diary?.by_member);

      setData(res.data);
      setLastFetched(new Date());
      console.log("[useDashboard] ✅ State updated successfully");

    } catch (err) {
      console.error("[useDashboard] ❌ EXCEPTION:", err);
      console.error("[useDashboard] ❌ message:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("[useDashboard] fetchSummary done — loading: false\n");
    }
  }, []);

  useEffect(() => {
    console.log("[useDashboard] useEffect mount — calling fetchSummary");
    fetchSummary();
    const interval = setInterval(() => {
      console.log("[useDashboard] Auto-refresh triggered (5 min)");
      fetchSummary();
    }, 5 * 60 * 1000);
    return () => {
      console.log("[useDashboard] Cleanup — clearing interval");
      clearInterval(interval);
    };
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary, lastFetched };
};
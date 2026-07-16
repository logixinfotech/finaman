import { useState, useEffect, useCallback } from "react";
import { fetchDepartmentAttendance } from "../utils/api";

// ^ path apne actual api.js location ke hisaab se adjust karo

export const useDepartmentAttendance = (month) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDepartmentAttendance(month);
      setData(res?.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
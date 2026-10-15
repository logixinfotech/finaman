// import { useState, useEffect, useMemo } from 'react';
// import { fetchPTList, fetchUserGroupsByType, getActledList } from "../utils/api";
// import { getMasterOptions } from "../pages/Modules/QMS/Utils/QmsAPI";

// const QMS_MASTERS = ["product", "supplier", "equipment", "area", "personnel", "instrument"];

// export const useGroupOptions = () => {
//   const [rawData, setRawData] = useState({
//     division: [], department: [], designation: [], grade: [], reporting: [], employees: [],pt:[]
//   });
//   const [masterData, setMasterData] = useState({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [div, dept, desg, grade, reporting, empRes ,pt] = await Promise.all([
//           fetchUserGroupsByType("DIV"),
//           fetchUserGroupsByType("DEP"),
//           fetchUserGroupsByType("DESG"),
//           fetchUserGroupsByType("GRADE"),
//           fetchUserGroupsByType("RME"),
//           getActledList(),
//           fetchPTList(),
//         ]);
//         setRawData({
//           division: div?.data || [],
//           department: dept?.data || [],
//           designation: desg?.data || [],
//           grade: grade?.data || [],
//           reporting: reporting?.data || [],
//           employees: empRes?.data || empRes || [],
//           pt:pt?.data||[]
//         });

//         // Sab QMS masters ek hi generic call se — getMasterOptions already {value,label} deta hai
//         const results = await Promise.all(QMS_MASTERS.map((m) => getMasterOptions(m)));
//         setMasterData(Object.fromEntries(QMS_MASTERS.map((m, i) => [m, results[i] || []])));
//       } catch (err) {
//         console.error("useGroupOptions error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);
//   const options = useMemo(() => {
//     const normalizeGroup = (arr) => (Array.isArray(arr) ? arr.map((item) => ({
//       value: item.group_id || item.statutory_id,
//       label: item.group_name || item.name,
//     })) : []);
//     const normalizeEmp = (arr) => (Array.isArray(arr) ? arr.map((item) => ({
//       value: item.Actledkey || item.Led_code || item.statutory_id,
//       label: item.Led_name || item.emp_name || item.Led_code || item.name,
//     })) : []);

//     return {
//       division: normalizeGroup(rawData.division),
//       department: normalizeGroup(rawData.department),
//       designation: normalizeGroup(rawData.designation),
//       grade: normalizeGroup(rawData.grade),
//       reporting: normalizeGroup(rawData.reporting),
//       employees: normalizeEmp(rawData.employees), 
//       product: masterData.product || [],
//       supplier: masterData.supplier || [],
//       equipment: masterData.equipment || [],
//       area: masterData.area || [],
//       personnel: masterData.personnel || [],
//       instrument: masterData.instrument || [],
//       pt:normalizeGroup(rawData.pt)||[]
//     };
//   }, [rawData, masterData]);

//   return { options, loading };
// };
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchPTList, fetchUserGroupsByType, getActledList } from "../utils/api";
import { getMasterOptions } from "../pages/Modules/QMS/Utils/QmsAPI";

const QMS_MASTERS = ["product", "supplier", "equipment", "area", "personnel", "instrument"];

export const useGroupOptions = () => {
  const [rawData, setRawData] = useState({
    division: [], department: [], designation: [], grade: [], reporting: [], employees: [], pt: [],
  });
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);

  // silent=true: refresh ke time loading flash nahi hota
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [div, dept, desg, grade, reporting, empRes, pt] = await Promise.all([
        fetchUserGroupsByType("DIV"),
        fetchUserGroupsByType("DEP"),
        fetchUserGroupsByType("DESG"),
        fetchUserGroupsByType("GRADE"),
        fetchUserGroupsByType("RME"),
        getActledList(),
        fetchPTList(),
      ]);
      setRawData({
        division: div?.data || [],
        department: dept?.data || [],
        designation: desg?.data || [],
        grade: grade?.data || [],
        reporting: reporting?.data || [],
        employees: empRes?.data || empRes || [],
        pt: pt?.data || [],
      });

      const results = await Promise.all(QMS_MASTERS.map((m) => getMasterOptions(m)));
      setMasterData(Object.fromEntries(QMS_MASTERS.map((m, i) => [m, results[i] || []])));
    } catch (err) {
      console.error("useGroupOptions error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const options = useMemo(() => {
    const normalizeGroup = (arr) => (Array.isArray(arr) ? arr.map((item) => ({
      value: item.group_id || item.statutory_id,
      label: item.group_name || item.name,
    })) : []);
    const normalizeEmp = (arr) => (Array.isArray(arr) ? arr.map((item) => ({
      value: item.Actledkey || item.Led_code || item.statutory_id,
      label: item.Led_name || item.emp_name || item.Led_code || item.name,
    })) : []);

    return {
      division: normalizeGroup(rawData.division),
      department: normalizeGroup(rawData.department),
      designation: normalizeGroup(rawData.designation),
      grade: normalizeGroup(rawData.grade),
      reporting: normalizeGroup(rawData.reporting),
      employees: normalizeEmp(rawData.employees),
      product: masterData.product || [],
      supplier: masterData.supplier || [],
      equipment: masterData.equipment || [],
      area: masterData.area || [],
      personnel: masterData.personnel || [],
      instrument: masterData.instrument || [],
      pt: normalizeGroup(rawData.pt),
    };
  }, [rawData, masterData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { options, loading, refetch };
};
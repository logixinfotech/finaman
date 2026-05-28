
import { useState, useEffect, useMemo } from 'react';
import { fetchUserGroupsByType, getActledList } from "../utils/api"; 

export const useGroupOptions = () => {
  const [rawData, setRawData] = useState({
    division: [], 
    department: [], 
    designation: [], 
    grade: [], 
    reporting: [],
    employees: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [div, dept, desg, grade, reporting, empRes] = await Promise.all([
          fetchUserGroupsByType("DIV"),
          fetchUserGroupsByType("DEP"),
          fetchUserGroupsByType("DESG"),
          fetchUserGroupsByType("GRADE"),
          fetchUserGroupsByType("RME"),
          getActledList() 
        ]);

        setRawData({
          division: div?.data || [],
          department: dept?.data || [],
          designation: desg?.data || [],
          grade: grade?.data || [],
          reporting: reporting?.data || [],
          employees: empRes?.data || empRes || [] 
        });
        console.log("EMPLOYEE RAW DATA:", empRes);
      } catch (err) {
        console.error("API Error in useGroupOptions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options = useMemo(() => {
      const normalizeGroup = (arr) => (Array.isArray(arr) ? arr.map(item => ({
      value: item.group_id,
      label: item.group_name
    })) : []);
    const normalizeEmp = (arr) => {
      const employeeArray = arr || []; 

      return Array.isArray(employeeArray) ? employeeArray.map(item => ({
        value: item.Actledkey || item.Led_code, 
        label: item.Led_name || item.emp_name || item.Led_code 
      })) : [];
    };

    return {
      division: normalizeGroup(rawData.division),
      department: normalizeGroup(rawData.department),
      designation: normalizeGroup(rawData.designation),
      grade: normalizeGroup(rawData.grade),
      reporting: normalizeGroup(rawData.reporting),
      employees: normalizeEmp(rawData.employees) 
    };
  }, [rawData]);

  return { options, loading };
};
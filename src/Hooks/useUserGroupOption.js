
import { useState, useEffect, useMemo } from 'react';
import { fetchPFList, fetchPTList, fetchUserGroupsByType, getActledList } from "../utils/api"; 

export const useGroupOptions = () => {
  const [rawData, setRawData] = useState({
    division: [], 
    department: [], 
    designation: [], 
    grade: [], 
    reporting: [],
    employees: [] ,
    pt:[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [div, dept, desg, grade, reporting, empRes,pt] = await Promise.all([
          fetchUserGroupsByType("DIV"),
          fetchUserGroupsByType("DEP"),
          fetchUserGroupsByType("DESG"),
          fetchUserGroupsByType("GRADE"),
          fetchUserGroupsByType("RME"),
         
          getActledList() ,
           fetchPTList(),
        ]);

        setRawData({
          division: div?.data || [],
          department: dept?.data || [],
          designation: desg?.data || [],
          grade: grade?.data || [],
          reporting: reporting?.data || [],
          employees: empRes?.data || empRes || [] ,
          pt:pt?.data||[]
        });
      
      } catch (err) {
      
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  console.log(rawData.pt)
  const options = useMemo(() => {
      const normalizeGroup = (arr) => (Array.isArray(arr) ? arr.map(item => ({
      value: item.group_id||item.statutory_id,
      label: item.group_name||item.name
    })) : []);
    const normalizeEmp = (arr) => {
      const employeeArray = arr || []; 

      return Array.isArray(employeeArray) ? employeeArray.map(item => ({
        value: item.Actledkey || item.Led_code ||item.statutory_id,
        label: item.Led_name || item.emp_name || item.Led_code ||item.name
      })) : [];
    };

    return {
      division: normalizeGroup(rawData.division),
      department: normalizeGroup(rawData.department),
      designation: normalizeGroup(rawData.designation),
      grade: normalizeGroup(rawData.grade),
      reporting: normalizeGroup(rawData.reporting),
      employees: normalizeEmp(rawData.employees), 
      pt:normalizeEmp(rawData.pt)
    };
  }, [rawData]);

  return { options, loading };
};
// ─────────────────────────────────────────────────────────────────────────────
// FILE: DailyAttendancePage.js
// Parent page — list table + routing to DailyAttendanceEntry form
// No attendance logic here — all logic is in DailyAttendanceEntry.js
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import DailyAttendanceForm from "./DailyAttendanceEntry";
import UniversalFilter from "../../../../components/Reusable/Filter/UnivarsalFilter";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

import {
  getAttendanceList, saveAttendanceLog, updateAttendance, getActledList, fetchUserGroupsByType,
  deleteAttendance, getAttendanceById
} from "../../../../utils/api";
import { alertError, confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";

const initialState = {
  attdayid: null,
  emp_id: "",
  punch_dt: "",
  intime: "",
  outtime: "",
  inmark: "",
  outmark: "",
  lastupdt: "",
  userma_id: "",
  updtype: "",
  log_id: null,
  employee_id: "",
  employee_name: "",
  employee_code: "",
  employee_photo: null,
  designation: "",
  punch_type: "",
  in_time: "",
  out_time: "",
  attendance_status: ""
};

// ── Format SQL datetime without timezone shift ────────────────────────────────
const formatDateTime = (value) => {
  if (!value) return "";
  const clean = value.toString().replace("T", " ").split(".")[0];
  const [datePart, timePart] = clean.split(" ");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-");
  const [hour, min] = (timePart || "00:00").split(":");
  return `${day}-${month}-${year} ${hour}:${min}`;
};

const columns = [
  {
    key: "employee_name",
    label: "Employee Name",
    render: (row) => {
      const parts = [
        row.Led_name || row.employee_name || "",
        row.Middle_name || "",
        row.Led_alias || "",
      ].filter(Boolean);
      return parts.join(" ");
    }
  },
  { key: "employee_code", label: "Emp Code" },
  { key: "department", label: "Department" },
  { key: "date", label: "Date" },         // ✅ mapped field "2026-07-03"
  { key: "in_time_fmt", label: "In Time" },      // ✅ mapped field "10:00"
  { key: "out_time_fmt", label: "Out Time" },     // ✅ mapped field "18:00"
  {
    key: "attendance_status", label: "Status",
    render: (row) => (
      <span className={`px-2 py-1 text-xs rounded font-medium ${row.attendance_status === "PRESENT" ? "bg-green-100 text-green-700" :
          row.attendance_status === "ABSENT" ? "bg-red-100 text-red-700" :
            row.attendance_status === "WFH" ? "bg-sky-100 text-sky-700 font-semibold" :
              row.attendance_status === "WFS" ? "bg-teal-100 text-teal-700 font-semibold" :
                row.attendance_status === "WEEK OFF" ? "bg-purple-100 text-purple-700" :
                  row.attendance_status === "HOLIDAYS" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
        }`}>{row.attendance_status || "—"}</span>
    )
  },
];

const DailyAttendancePage = ({ tab }) => {
  const [list, setList] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    date: today,
    from_date: today,
    to_date: today,
    employee_id: "",
    employee_name: "",
    department_id: "",
    department_name: ""
  });
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);


  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, canPrint, rights,
    handleView, handleAdd,
    handleModify: erpHandleModify,
    performSave,
    handleEditCancel,
  } = useERPMode(
    initialState,
    async (data) => {
      const res = data.log_id
        ? await updateAttendance(data.log_id, data)
        : await saveAttendanceLog(data);
      return { success: true, data: res?.data || data };
    },
    () => loadData(filters, page, pageSize),
    tab?.appl_name
  );

  const handlePrint = (data) => { setPrintData(data); setShowPreview(true); };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    await loadData(newFilters, 1, pageSize);
  };

  // ── Load list ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (
    currentFilters = filters,
    currentPage = page,
    currentPageSize = pageSize
  ) => {
    // `loadData` function ke start mein, try { ... } ke andar yeh line add karein:
    try {
      setLoading(true);

      // 1. Copy original filters
      const apiFilters = { ...currentFilters };
  
      if (currentFilters.from_date && currentFilters.to_date) {
        if (currentFilters.from_date === currentFilters.to_date) {
          apiFilters.date = currentFilters.from_date;
        } else {
          apiFilters.from_date = currentFilters.from_date;
          apiFilters.to_date = currentFilters.to_date;
          delete apiFilters.date;
        }
      } else if (currentFilters.date) {
        apiFilters.date = currentFilters.date;
      } else if (!currentFilters.employee_id && !currentFilters.employee_name &&
        !currentFilters.department_id && !currentFilters.department_name) {
        // only fall back to "today" when there's no employee/department filter at all
        apiFilters.date = today;
      } 
      if (currentFilters.employee_id) {
        apiFilters.emp_id = currentFilters.employee_id;
        apiFilters.employee_id = currentFilters.employee_id;
      }

      if (currentFilters.employee_name) { 
        apiFilters.employee_name = currentFilters.employee_name;
        apiFilters.emp_name = currentFilters.employee_name;
      } 
      if (currentFilters.department_id) {
        apiFilters.dept_id = currentFilters.department_id;
        apiFilters.department_id = currentFilters.department_id;
      }
      if (currentFilters.department_name) {
        apiFilters.department = currentFilters.department_name;
      } 

      const res = await getAttendanceList({
        page: currentPage,
        pageSize: currentPageSize,
        filters: apiFilters
      }); 
      const mapped = (res?.data || []).map(item => {
        const inRaw = item.in_time?.toString().replace("T", " ").split(".")[0] || "";
        const outRaw = item.out_time?.toString().replace("T", " ").split(".")[0] || "";
        const inFmt = inRaw ? inRaw.split(" ")[1]?.slice(0, 5) : "--:--";
        const outFmt = outRaw ? outRaw.split(" ")[1]?.slice(0, 5) : "--:--";
        const hasRealPunch = (inFmt && inFmt !== "--:--" && inFmt !== "00:00") ||
                             (outFmt && outFmt !== "--:--" && outFmt !== "00:00");
        const status = hasRealPunch
          ? (item.attendance_status || "PRESENT")
          : (item.attendance_status === "PRESENT" ? "ABSENT" : (item.attendance_status || "—"));

        return {
          ...item,
          department: item.department || "—",
          date: inRaw ? inRaw.split(" ")[0] : "",
          in_time_fmt: hasRealPunch && inFmt !== "00:00" ? inFmt : "--:--",
          out_time_fmt: hasRealPunch && outFmt !== "00:00" ? outFmt : "--:--",
          attendance_status: status,
        };
      });

      setList(mapped);   
      setTotalRecords(res?.total || mapped.length || 0);
    } catch (err) {
      console.error("Attendance load error", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { loadData(filters, page, pageSize); }, [page, pageSize, loadData]);

  useEffect(() => {
    (async () => {
      const empRes = await getActledList();
      setEmployees(Array.isArray(empRes) ? empRes : empRes?.data || []);
      const deptRes = await fetchUserGroupsByType("DEP");
      setDepartments(deptRes?.data || []);
    })();
  }, []);
 
  useEffect(() => {
    setERPHandlers({
      onNew: () => { setShowForm(true); handleAdd(); },
      onSave: () => performSave("log_id"),
      onEsc: () => setShowForm(false),
    });
  }, []);

  const handlePageChange = (newPage, newPageSize) => {
    if (newPageSize !== pageSize) { setPageSize(newPageSize); setPage(1); }
    else setPage(newPage);
  };

  const handleDelete = async (row) => {
    const id = row?.log_id || formData?.log_id;
    if (!id) return;
    if (!window.confirm("Delete this record?")) return;
    await deleteAttendance(id);
    setShowForm(false);
    loadData(filters, page, pageSize);
  };

  const handleDeleteMultiple = async (selected) => {
    // Normalize: Table may pass an array of row objects OR an array of keys
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.log_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} Attendance(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteAttendance(id)));
      const failed = results.filter((r) => !r?.success).length;

      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadData();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some attendance");
    }
  };
  const formatTimeOnly = (dt) => { if (!dt) return ""; return dt.substring(11, 16); };

  // ── Tab change ───────────────────────────────────────────────────────────────
  const handleTabChange = (targetTab) => {
    if (targetTab === "search") { setShowForm(false); }
    if (targetTab === "entry") {
      setShowForm(true);
      if (!formData?.log_id) handleAdd();
    }
  }; 
  const handleViewMode = async (row) => {
    try {
      const index = list.findIndex(item => item.log_id === row.log_id);
      if (index !== -1) setCurrentIndex(index);

      let data = row;
      if (row?.log_id) {
        const res = await getAttendanceById(row.log_id);
        data = res?.data;
        if (!data) return;
      }

      handleView(data);
      setFormData({
        ...data,
        intime: formatTimeOnly(data.in_time),
        outtime: formatTimeOnly(data.out_time),
        employee_name: data.employee_name || "",
        employee_code: data.employee_code || "",
        employee_id: data.employee_id,
        attendance_day: data.in_time
          ? data.in_time.toString().split("T")[0].split(" ")[0] : ""
      });
      setShowForm(true);
    } catch (err) { console.error(err); }
  };
  const { options } = useGroupOptions();
 
  const handleModify = async (row) => {
    try {
      const index = list.findIndex(item => item.log_id === row.log_id);
      if (index !== -1) setCurrentIndex(index);

      let data = row;
      if (row?.log_id) {
        const res = await getAttendanceById(row.log_id);
        data = res?.data;
        if (!data) return;
      }

      erpHandleModify(data);
      setFormData({
        ...data,
        intime: formatTimeOnly(data.in_time),
        outtime: formatTimeOnly(data.out_time),
        employee_name: data.employee_name || "",
        employee_code: data.employee_code || "",
        employee_id: data.employee_id,
        attendance_day: data.in_time
          ? data.in_time.toString().split("T")[0].split(" ")[0] : ""
      });
      setShowForm(true);
    } catch (err) { console.error("handleModify error:", err); }
  }; 
  const attendancePrintSections = [
    {
      type: "custom",
      render: (data) => (
        <div>
          <h2 className="text-center font-bold text-lg mb-2">EMPLOYEE ATTENDANCE</h2>
          <p className="text-center text-xs mb-4">{data.month} - {data.year}</p>
          <table className="w-full border text-xs">
            <thead>
              <tr>
                <th className="border p-1">Date</th>
                <th className="border p-1">In</th>
                <th className="border p-1">Out</th>
                <th className="border p-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.attendanceData || {}).map(([day, val]) => (
                <tr key={day}>
                  <td className="border p-1">{day}</td>
                  <td className="border p-1">{val.in}</td>
                  <td className="border p-1">{val.out}</td>
                  <td className="border p-1">{val.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  ]; 
  return (
    <div className="h-full">
      {showPreview ? (
        <ERPPrintPreview
          title="Attendance Report"
          data={printData}
          sections={attendancePrintSections}
          onBack={() => setShowPreview(false)}
          logo="/finaman-logo.png"
        />
      ) : showForm ? (
        <DailyAttendanceForm
          formData={formData}
          setFormData={setFormData}
          setShowForm={setShowForm}
          initialData={formData}
          onSave={() => { handleView(formData); }}
          onCancel={() => setShowForm(false)}
          mode={mode}
          activeTab={showForm ? "entry" : "search"}
          onTabChange={handleTabChange}
          onModify={(row) => handleModify(row || formData)}
          onDelete={(row) => handleDelete(row || formData)}
          onPrint={handlePrint}
          onNewEntry={handleAdd}
          onEditCancel={handleEditCancel}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          saving={saving}
          canPrint={canPrint}
          rights={rights}
        />
      ) : (
        <Table
          title="Daily Attendance"
          data={list}
          columns={columns}
          rowKey="log_id"
          onDeleteMultiple={handleDeleteMultiple}
          loading={loading}
          activeTab="search"
          onTabChange={handleTabChange}
          onRefresh={() => loadData(filters, page, pageSize)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}
          serverPagination={true}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          defaultPageSize={pageSize} 
          formComponent={
            <UniversalFilter
              filters={filters}
              visibleFields={["filterType", "employee", "department"]}
              options={options}
              setFilters={setFilters}
              employees={employees}
              departments={departments}
              onApply={(f) => {
                const hasEmpOrDept = f.employee_id || f.employee_name || f.department_id || f.department_name; 
                const normalizedFilters = {
                  ...f,
                  emp_id: f.employee_id || "",
                  employee_id: f.employee_id || "",
                  employee_name: f.employee_name || "",
                  department_id: f.department_id || "",
                  department_name: f.department_name || ""
                };

                if (hasEmpOrDept && f.from_date === today && f.to_date === today) { 
                  delete normalizedFilters.date;
                  delete normalizedFilters.from_date;
                  delete normalizedFilters.to_date;
                } else {
                  normalizedFilters.date = f.from_date || f.date || today;
                }

                setFilters(normalizedFilters);
                loadData(normalizedFilters, 1, pageSize);
              }} onClear={() => {
                const reset = {
                  date: today,
                  from_date: today,
                  to_date: today,
                  employee_id: "",
                  employee_name: "",
                  emp_id: "",
                  department_id: "",
                  department_name: ""
                };
                setFilters(reset);
                loadData(reset, 1, pageSize);
              }}
              onReset={() => {
                const reset = {
                  date: today,
                  from_date: today,
                  to_date: today,
                  employee_id: "",
                  employee_name: "",
                  emp_id: "",
                  department_id: "",
                  department_name: ""
                };
                setFilters(reset);
                loadData(reset, 1, pageSize);
              }}
            />
          }
          onAdd={() => { handleAdd(); setShowForm(true); }}
          onRowDoubleClick={(row) => handleViewMode(row)}
        />
      )}
    </div>
  );
};

export default DailyAttendancePage;
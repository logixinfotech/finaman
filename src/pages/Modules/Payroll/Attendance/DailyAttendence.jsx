// ─────────────────────────────────────────────────────────────────────────────
// FILE: DailyAttendancePage.js
// Parent page — list table + routing to DailyAttendanceEntry form
// No attendance logic here — all logic is in DailyAttendanceEntry.js
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Table from "../../../../components/Reusable/table/Table";
import DailyAttendanceForm from "./DailyAttendanceEntry";
import DailyAttendanceFilter from "./DailyAttendanceFilter";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

import {
  getAttendanceList, saveAttendanceLog, updateAttendance,
  deleteAttendance, getAttendanceById
} from "../../../../utils/api";
import { alertError, confirmDelete, showToast } from "../../../../components/Reusable/alert";

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
  { key: "employee_name", label: "Employee Name" },
  { key: "employee_code", label: "Emp Code" },
  { key: "department", label: "Department" },
  { key: "attendance_date", label: "Date", render: (row) => row.in_time ? formatDateTime(row.in_time).split(" ")[0] : "" },
  { key:"in_time",  label:"In Time",  render:(row)=> row.in_time  ? formatDateTime(row.in_time).split(" ")[1]  : "—" },
{ key:"out_time", label:"Out Time", render:(row)=> row.out_time ? formatDateTime(row.out_time).split(" ")[1] : "—" },
  {
    key: "attendance_status", label: "Status", render: (row) => (
      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${row.attendance_status === "PRESENT" ? "bg-green-100 text-green-700" :
          row.attendance_status === "ABSENT" ? "bg-red-100 text-red-700" :
            row.attendance_status === "WEEK OFF" ? "bg-purple-100 text-purple-700" :
              row.attendance_status === "HOLIDAYS" ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-600"
        }`}>{row.attendance_status || "—"}</span>
    )
  },
];

const DailyAttendancePage = ({ tab }) => {
  const [list, setList] = useState([]);
  const todayStr = new Date().toISOString().split("T")[0]; // "2026-07-03"
  const [filters, setFilters] = useState({ date: todayStr });
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData]               = useState([]);
const [selectedRows, setSelectedRows] = useState([]);

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

  const handleFilterApply = async (newFilters) => {
  setFilters(newFilters);
  setSelectedRows([]);
  const res = await getAttendanceList({ filters: newFilters });  // ✅ res declare
  const mapped = (res?.data || []).map(item => {
    const inRaw  = item.in_time?.toString().replace("T"," ").split(".")[0] || "";
    const outRaw = item.out_time?.toString().replace("T"," ").split(".")[0] || "";
    return {
      ...item,
      department:   item.department || "—",
      date:         inRaw ? inRaw.split(" ")[0] : "",
      in_time_fmt:  inRaw  ? inRaw.split(" ")[1]?.slice(0,5) : "--:--",
      out_time_fmt: outRaw ? outRaw.split(" ")[1]?.slice(0,5) : "--:--",
    };
  });
  setData(mapped);
};

const handleDownload = () => {
  const toExport = selectedRows.length > 0
  ? list.filter(r => selectedRows.includes(r.log_id))  // ← data → list
  : list;        

  const ws = XLSX.utils.json_to_sheet(toExport.map(r => ({
    "Employee Name": r.employee_name,
    "Emp Code":      r.employee_code,
    "Department":    r.department || "—",   // ✅ ADD
    "Date":          r.date,                // "2026-07-03"
    "In Time":       r.in_time_fmt,         // ✅ sirf "10:00" — NO date
    "Out Time":      r.out_time_fmt,        // ✅ sirf "18:00" — NO date
    "Status":        r.attendance_status,
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `Attendance_${filters.date || "all"}.xlsx`);
};

  // ── Load list ────────────────────────────────────────────────────────────────
const loadData = useCallback(async (
  currentFilters = filters,
  currentPage = page,
  currentPageSize = pageSize
) => {
  try {
    setLoading(true);
    const res = await getAttendanceList({
      page: currentPage,
      pageSize: currentPageSize,
      filters: currentFilters
    });

    // ✅ YAHAN ADD KARO — raw data ko map karo
    const mapped = (res?.data || []).map(item => {
      const inRaw  = item.in_time?.toString().replace("T"," ").split(".")[0] || "";
      const outRaw = item.out_time?.toString().replace("T"," ").split(".")[0] || "";
      return {
        ...item,
        department:   item.department || "—",
        date:         inRaw ? inRaw.split(" ")[0] : "",
        in_time_fmt:  inRaw  ? inRaw.split(" ")[1]?.slice(0,5) : "--:--",
        out_time_fmt: outRaw ? outRaw.split(" ")[1]?.slice(0,5) : "--:--",
      };
    });

    setList(mapped);                                        // ← res.data ki jagah mapped
    setTotalRecords(res?.total || mapped.length || 0);
  } catch (err) {
    console.error("Attendance load error", err);
  } finally {
    setLoading(false);
  }
}, [filters, page, pageSize]);

  useEffect(() => { loadData(filters, page, pageSize); }, [page, pageSize, loadData]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
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

  const handleExport = (selectedRows) => {
  // Agar rows select hain to selected export karo, warna current list
  const dataToExport = (selectedRows && selectedRows.length > 0) ? selectedRows : list;
  
  if (!dataToExport.length) { alertError("Export", "No data to export"); return; }

  const headers = ["Employee Name", "Emp Code", "Department", "Date", "In Time", "Out Time", "Status"];
  
  const rows = dataToExport.map(row => [
    row.employee_name || "",
    row.employee_code || "",
    row.department || "",
    row.in_time ? formatDateTime(row.in_time).split(" ")[0] : "",
    row.in_time ? formatDateTime(row.in_time) : "",
    row.out_time ? formatDateTime(row.out_time) : "",
    row.attendance_status || "",
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  // Filename mein date range info daalo
  const dateLabel = filters.date || "all";
  a.download = `Attendance_${dateLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

  // ── View mode ────────────────────────────────────────────────────────────────
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

  // ── Edit (Modify) mode ───────────────────────────────────────────────────────
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

  // ── Print sections ───────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
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
           onExport={handleExport}
          formComponent={
            <DailyAttendanceFilter
              filters={filters}
              setFilters={setFilters}
              onApply={() => loadData(filters)}
              onClear={() => { setFilters({}); loadData({}); }}
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
import { useEffect, useState, useCallback } from "react";
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
  // attendance-specific fields
  log_id: null,
  employee_id: "",
  employee_name: "",
  employee_code: "",
  designation: "",
  punch_type: "",
  in_time: "",
  out_time: "",
  attendance_status: ""
};

// ✅ FIX: Parse SQL datetime string directly without new Date() to avoid
// UTC→local timezone shift (SQL Server returns "2026-05-01 09:00:00.000"
// without a timezone marker; new Date() treats it as UTC and adds +5:30 in IST,
// making 09:00 display as 14:30).
const formatDateTime = (value) => {
  if (!value) return "";
  // value from SQL: "2026-05-01T09:00:00.000Z"  OR  "2026-05-01 09:00:00.000"
  // Strip everything after the decimal/Z and split on T or space
  const clean = value.toString().replace("T", " ").split(".")[0]; // "2026-05-01 09:00:00"
  const [datePart, timePart] = clean.split(" ");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-");
  const [hour, min] = (timePart || "00:00").split(":");
  return `${day}-${month}-${year} ${hour}:${min}`;
};

const columns = [
  { key: "employee_name", label: "Employee Name" },
  { key: "punch_type", label: "Type" },
  {
    key: "in_time",
    label: "In Time",
    render: (row) => formatDateTime(row.in_time)
  },
  {
    key: "out_time",
    label: "Out Time",
    render: (row) => formatDateTime(row.out_time)
  }
];

const DailyAttendancePage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [attendanceData, setAttendanceData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, canPrint, rights,
    handleView, handleAdd,
    handleModify: erpHandleModify,
    performSave,
    handleEditCancel,
    isEditMode
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

  // ─── Open form on first load (add mode) ─────────────────────────────────────

  const handlePrint = (data) => {
    setPrintData(data);
    setShowPreview(true);
  };

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
      setList(res.data || []);
      setTotalRecords(res.total || res.data?.length || 0);
    } catch (err) {
      console.error("Attendance load error", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadData(filters, page, pageSize);
  }, [page, pageSize, loadData]);

  useEffect(() => {
    setERPHandlers({
      onNew: () => {
        setShowForm(true);
        handleAdd();
      },
      onSave: () => performSave("log_id"),
      onEsc: () => setShowForm(false),
    });
  }, []);

  const handlePageChange = (newPage, newPageSize) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    } else {
      setPage(newPage);
    }
  };

  const handleDelete = async (row) => {
    const id = row?.log_id || formData?.log_id;
    if (!id) return;
    const confirmed = window.confirm("Delete this record?");
    if (!confirmed) return;
    await deleteAttendance(id);
    setShowForm(false);
    loadData(filters, page, pageSize);
  };

  const formatTimeOnly = (dt) => {
    if (!dt) return "";
    return dt.substring(11, 16);
  };

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") {
      setShowForm(false);
    }

    if (targetTab === "entry") {
      setShowForm(true);

      // agar koi record open nahi hai to new entry mode
      if (!formData?.log_id) {
        handleAdd();
      }
    }
  };

  const handleViewMode = async (row) => {
    try {
      const index = list.findIndex(item => item.log_id === row.log_id);

      if (index !== -1) {
        setCurrentIndex(index);
      }
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
          ? data.in_time.toString().split("T")[0].split(" ")[0]
          : ""
      });

      setShowForm(true);

    } catch (err) {
      console.error(err);
    }
  };
  const handleModify = async (row) => {
    try {

      const index = list.findIndex(item => item.log_id === row.log_id);

      if (index !== -1) {
        setCurrentIndex(index);
      }
      // If row has a log_id, fetch full record; otherwise use row directly
      let data = row;

      if (row?.log_id) {
        const res = await getAttendanceById(row.log_id);
        data = res?.data;
        if (!data) return;
      }


      // ✅ FIX: Call erpHandleModify first to set mode = "edit"
      erpHandleModify(data);

      // ✅ FIX: Then sync all fields including employee info for autocomplete
      setFormData({
        ...data,
        intime: formatTimeOnly(data.in_time),
        outtime: formatTimeOnly(data.out_time),
        employee_name: data.employee_name || "",
        employee_code: data.employee_code || "",
        employee_id: data.employee_id,
        attendance_day: data.in_time
          ? data.in_time.toString().split("T")[0].split(" ")[0]
          : ""
      });

      const day = parseInt(
        data.in_time.toString().split("T")[0].split("-")[2],
        10
      );

      setAttendanceData({
        [day]: {
          log_id: data.log_id,
          in: formatTimeOnly(data.in_time),
          out: formatTimeOnly(data.out_time),
          status: data.attendance_status,
          punch_type: data.punch_type
        }
      });

      setShowForm(true);

    } catch (err) {
      console.error("handleModify error:", err);
    }
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
    <div>
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
          onSave={() => {
            handleView(formData);
          }}
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
          loading={loading}
          activeTab={"search"}
                    onTabChange={handleTabChange}
          onRefresh={() => loadData(filters, page, pageSize)}

          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}

          serverPagination={true}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          defaultPageSize={pageSize}

          formComponent={
            <DailyAttendanceFilter
              filters={filters}
              setFilters={setFilters}
              onApply={() => loadData(filters)}
              onClear={() => {
                setFilters({});
                loadData({});
              }}
            />
          }

          onAdd={() => { handleAdd(); setShowForm(true); }}
          // ── FIX: Double click properly triggers view + setShowForm ────────────
          onRowDoubleClick={(row) => handleViewMode(row)}
        />
      )}
    </div>
  );
};

export default DailyAttendancePage;
import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import DailyAttendanceForm from "./DailyAttendanceEntry";
import DailyAttendanceFilter from "./DailyAttendanceFilter";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getAttendanceList, saveAttendanceLog, updateAttendance, deleteAttendance, getAttendanceById } from "../../../../utils/api";

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
  updtype: ""
};

const columns = [
  { key: "log_id", label: "Log ID" },
  { key: "employee_id", label: "Employee ID" },
  { key: "punch_type", label: "Type" },
  { key: "in_time", label: "In Time" },
  { key: "out_time", label: "Out Time" }
];

const DailyAttendancePage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, canPrint, rights,
    handleView, handleAdd, performSave, handleEditCancel,
    isEditMode
  } = useERPMode(
    initialState,
    async (data) =>
      data.log_id
        ? await updateAttendance(data.log_id, data)
        : await saveAttendanceLog(data),
    () => loadData(filters, page, pageSize),
    tab?.appl_name
  );

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    // Jab page load ho, automatically entry mode (form) open ho jaye
    setShowForm(true);
  }, [setShowForm]);

  const handlePrint = (data) => {
    setPrintData(data);
    setShowPreview(true);
  };

  const loadData = useCallback(async (currentFilters = filters, currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoading(true);

      const res = await getAttendanceList({
        page: currentPage,
        pageSize: currentPageSize,
        filters: currentFilters
      });
      console.log("API RESPONSE:", res);
      setList(res.data || []);
      setTotalRecords(res.total || 0);

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
      onNew: handleAdd,
      onSave: () => performSave("log_id"),
      onEsc: () => setShowForm(false),
    });
  }, []);

  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);

    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
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
    if (!dt) return "--:--";
    return new Date(dt).toTimeString().slice(0, 5);
  };

  const handleModify = async (row) => {
    try {
      const res = await getAttendanceById(row.log_id);
      const data = res?.data;
      if (!data) return;

      setFormData({
        log_id: data.log_id,
        employee_id: data.employee_id,
        employee_name: data.employee_name || "",   // ✅ MUST FIX
        employee_code: data.employee_code || "",   // optional but important
        intime: formatTimeOnly(data.in_time),
        outtime: formatTimeOnly(data.out_time),
      });

      setShowForm(true);

      // ❌ REMOVE this line completely
      // handleModify(row);

    } catch (err) {
      console.error(err);
    }
  };
  const attendancePrintSections = [
    {
      type: "custom",
      render: (data) => (
        <div>

          <h2 className="text-center font-bold text-lg mb-2">
            EMPLOYEE ATTENDANCE
          </h2>

          <p className="text-center text-xs mb-4">
            {data.month} - {data.year}
          </p>

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
          onSave={() => performSave("log_id")}
          onCancel={() => setShowForm(false)}
          mode={mode}

          // 👇 ADD THESE (IMPORTANT)
          onModify={(row) => handleModify(row)}
          onDelete={(row) => handleDelete(row)} // ✅
          onPrint={handlePrint}
          onNewEntry={handleAdd}
          onEditCancel={handleEditCancel}

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

          onAdd={handleAdd}
          onRowDoubleClick={(row) => {
            handleModify(row);
             
          }}
        />
      )}
    </div>
  );
};

export default DailyAttendancePage;
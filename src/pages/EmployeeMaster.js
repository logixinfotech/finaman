import { useEffect, useState, useCallback } from "react";
import Table from "../components/Reusable/table/Table";
import EmployeeMasterForm from "../components/EmployeeMaster/EmpolyeeMasterForm";

import {
  confirmDelete,
  showToast,
  alertError,
} from "../components/Reusable/alert";

import { setERPHandlers } from "../utils/erpShortcuts";
import { useERPMode } from "../components/Reusable/form/useFormMode";

// ✅ API (replace with real API later)
// const fetchEmployees = async () => [];
const createEmployee = async (data) => ({ success: true });
const updateEmployee = async (id, data) => ({ success: true });
const deleteEmployee = async (id) => ({ success: true });
const fetchEmployees = async () => [
  {
    employee_id: 1,
    employee_name: "Alice Johnson",
    mobile: "123-456-7890",
    email: "alice.johnson@example.com",
    department: "HR",
    designation: "Manager",
    joining_date: "2022-05-01",
    status: "Active",
  },
  {
    employee_id: 2,
    employee_name: "Bob Smith",
    mobile: "987-654-3210",
    email: "bob.smith@example.com",
    department: "IT",
    designation: "Developer",
    joining_date: "2023-01-15",
    status: "Inactive",
  },
  {
    employee_id: 3,
    employee_name: "Carol Lee",
    mobile: "555-555-5555",
    email: "carol.lee@example.com",
    department: "Finance",
    designation: "Analyst",
    joining_date: "2021-09-20",
    status: "inactive",
  },
];

// ✅ INITIAL STATE (MATCHES FORM)
const initialState = {
  employee_id: null,

  employee_name: "",
  gender: "",
  dob: "",

  father_name: "",
  mother_name: "",
  married: "",
  spouse: "",
  blood_group: "",
  religion: "",
  mobile: "",
  email: "",

  address: "",
  city: "",
  state: "",
  pin_code: "",

  permanent_address: "",
  permanent_city: "",
  permanent_state: "",
  permanent_pin_code: "",

  aadhar_no: "",
  pan_no: "",
  voter_id: "",
  driving_license: "",
  passport: "",

  bank_name: "",
  bank_ifsc: "",
  bank_account: "",

  department: "",
  designation: "",
  joining_date: "",
  status: "Active",
};

// ✅ TABLE COLUMNS
const columns = [
  { key: "employee_name", label: "Employee Name" },
  { key: "mobile", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`px-2 py-1 text-xs rounded ${
          row.status === "Active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-600"
        }`}
      >
        {row.status}
      </span>
    ),
  },
];

const EmployeeMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ ERP MODE HOOK
  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    rights = {},
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateEmployee(data.employee_id, data)
        : await createEmployee(data);
    },
    () => loadEmployees(),
    tab?.appl_name
  );

  // ✅ LOAD DATA
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      alertError("Error", "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ✅ SYNC CURRENT RECORD
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  // ✅ ROW SELECT
  const handleRowSelect = (row) => {
    const index = list.findIndex(
      (i) => i.employee_id === row.employee_id
    );
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  // ✅ SAVE
  const handleSave = async () => {
    if (!formData.employee_name) {
      alertError("Validation", "Employee Name required");
      return;
    }

    const res = await performSave("employee_id");

    if (res?.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      loadEmployees();
    }
  };

  // ✅ DELETE
  const handleDelete = async (row) => {
    const confirm = await confirmDelete({
      title: `Delete "${row.employee_name}"?`,
    });

    if (confirm) {
      const res = await deleteEmployee(row.employee_id);

      if (res?.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadEmployees();
        setShowForm(false);
      }
    }
  };

  // ✅ ERP SHORTCUTS
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),

      onPrevRecord: () =>
        setCurrentIndex((p) => Math.max(p - 1, 0)),

      onNew: () => rights?.add && handleAdd(),

      onSave: handleSave,

      onEsc: () => setShowForm(false),
    });
  }, [list, rights, handleAdd]);

  return (
    <div>
      {showForm ? (
        <EmployeeMasterForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
        />
      ) : (
        <Table
          title="Employee Master"
          data={list}
          columns={columns}
          rowKey="employee_id"
          loading={loading}

          onAdd={rights?.add === 1 ? handleAdd : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
};

export default EmployeeMaster;
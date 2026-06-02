import { useEffect, useState, useCallback } from "react";
import Table from "../components/Reusable/table/Table";
import EmployeeMasterForm from "../components/EmployeeMaster/EmpolyeeMasterForm";
import { getActledList, createEmployee, updateEmployee, deleteEmployee, createLeaveBalance } from "../utils/api";
import { transformToBackend } from "../utils/employeeMapper";


import {
  confirmDelete,
  showToast,
  alertError,
} from "../components/Reusable/alert";

import { setERPHandlers } from "../utils/erpShortcuts";
import { useERPMode } from "../components/Reusable/form/useFormMode";

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
        className={`px-2 py-1 text-xs rounded ${row.status === "Active"
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
    canPrint,
    handleEditCancel,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      const backendData = transformToBackend(data);

      if (backendData.Gender) {
        backendData.Gender = backendData.Gender === "Male" ? "M"
          : backendData.Gender === "Female" ? "F"
            : backendData.Gender;
      }

      backendData.Is_bill = data["Married"] === "Yes" ? 1 : 0;
      if (data["Married"] !== "Yes") {
        backendData.Doa = null;
        backendData.Spouse = null;
      }

      // ✅ Sab Op_id fields INT hain
      ["Op_id1", "Op_id2", "Op_id3", "Op_id4", "Op_id5", "Op_id6"].forEach(key => {
        if (backendData[key] !== undefined) {
          const n = Number(backendData[key]);
          backendData[key] = isNaN(n) ? null : n;
        }
      });

      // ✅ Numeric fields
      backendData.Is_tds = backendData.Is_tds && Number(backendData.Is_tds) > 0 ? 1 : 0;
      backendData.Pay_amt = backendData.Pay_amt ? Number(backendData.Pay_amt) : null;
      backendData.Gratuity = backendData.Gratuity ? parseFloat(backendData.Gratuity) : null;


      return isEdit
        ? await updateEmployee(data.employee_id, backendData)
        : await createEmployee(backendData);
    },
    () => loadEmployees(),
    tab?.appl_name
  );

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") {
      setShowForm(false);
    }

    if (targetTab === "entry") {
      setShowForm(true);
    }
  };

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getActledList();

      console.log("API DATA:", res);

      const mappedData = (res || []).map((item) => ({
        ...item,

        employee_id: item.Actled_id,

        // ✅ FORM FIELD MAPPING
        "Title": item.Title || "",
        "Gender":
          item.Gender === "M"
            ? "Male"
            : item.Gender === "F"
              ? "Female"
              : item.Gender || "",

        "First Name": item.Led_name || "",
        "Last Name": item.Led_alias || "",

        "DOB": item.Dob || "",

        "Qualification": item.E_qua || "",
        "Professional": item.P_qua || "",

        "Mother": item.M_name || "",
        "Father": item.F_name || "",

        "Married": item.Is_bill === 1 ? "Yes" : "No",
        "Aniversary": item.Doa || "",
        "Spouse": item.Spouse || "",

        "Mobile No": item.Mobile || "",
        "Email Id": item.Email || "",

        "Driving Licence No": item.Driving || "",
        "Adhar Card No": item.Aadhar || "",
        "Voter Id": item.Voter || "",
        "Pan No": item.Pan_no || "",
        "Passport": item.Passport || "",

        "Basic_Emerg_Contact Person": item.Person || "",
        "Basic_Emerg_Relation": item.Relation || "",
        "Basic_Emerg_Mobile No": item.Phone || "",

        "C_Adress Line": item.Add1 || "",
        "C_City": item.City || "",
        "C_District": item.Area || "",
        "C_Pin Code": item.Pin || "",
        "C_State": item.State || "",

        "P_Adress Line": item.Padd1 || "",
        "P_City": item.Pcity || "",
        "P_District": item.Parea || "",
        "P_Pin Code": item.Ppin || "",
        "P_State": item.Pstate || "",

        "Bank Name": item.Bank_name || "",
        "Bank Ifsc": item.Bank_ifsc || "",
        "Bank Address": item.Bank_add || "",
        "Bank Account": item.Bank_acc || "",

        "Employee Type": item.Emp_type || "",
        "Employee Code": item.Led_code || "",
        "Punch Card No": item.Punch_no || "",

        "Confirm Date": item.Doc || "",

        "Grade": item.Op_id1 || "",
        "Division": item.Op_id2 || "",
        "Department": item.Op_id3 || "",
        "Branch": item.Op_id4 || "",
        "Designation": item.Op_id5 || "",
        "Reporting to": item.Op_id6 || "",

        "EPF Number": item.Epf_no || "",
        "PF Join Date": item.Doepf || "",
        "PF Leaving Date": item.Dolepf || "",
        "PF Reason": item.Epf_rsn || "",

        "EDLI Number": item.Edli_no || "",
        "ESIC Number": item.Esic_no || "",
        "EDLI Join Date": item.Dojesic || "",

        "Gratuity Number": item.Gratuity || "",

        "Status Join Date": item.Doj || "",
        "Status Leaving Date": item.Dol || "",
        "Status Reason": item.Led_rsn || "",

        "Basic Salary": item.Pay_amt || "",
        "TDS": item.Is_tds || "",
        "Remarks": item.Pay_rmks || "",
        "Leave allow names": item.leave_san
          ? item.leave_san.split(",")
          : [],

        // ✅ TABLE DISPLAY
        employee_name: item.Led_name || "",
        mobile: item.Mobile || "",
        email: item.Email || "",
        department: item.Op_id3 || "",
        designation: item.Op_id5 || "",
        joining_date: item.Doj || "",
        status: item.Approved === 1 ? "Active" : "Inactive",
      }));
      setList(mappedData);

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
    if (index !== -1) {
      setCurrentIndex(index);
    }
    handleView(row);
    setShowForm(true); // ✅ IMPORTANT
  };


  // EmployeeMaster.jsx - handleSave
  const handleSave = async () => {
    if (!formData["First Name"]) {
      alertError("Validation", "First Name required");
      return;
    }

    const leaveTypeIds = Array.isArray(formData["Leave allow"])
      ? formData["Leave allow"]
      : [];

    // ✅ performSave alag se call — response ignore karo
    await performSave("employee_id");

    // ✅ Latest Actled_id directly backend se fetch karo
    try {
      const latestRes = await getActledList();
      const allEmployees = latestRes || [];

      // Sabse bada Actled_id = abhi insert hua
      const maxId = Math.max(...allEmployees.map(e => e.Actled_id || 0));
      const newEmployeeId = maxId > 0 ? maxId : null;

      console.log("NEW EMPLOYEE ID =>", newEmployeeId);

      if (leaveTypeIds.length > 0 && newEmployeeId) {
        await createLeaveBalance({
          employee_id: newEmployeeId,
          leave_type_ids: leaveTypeIds,
          financial_year: new Date().getFullYear(),
        });
        console.log("✅ Leave Balance Saved!");
      }
    } catch (err) {
      console.error("Balance save failed:", err);
    }

    showToast({ icon: "success", title: "Saved Successfully" });
    loadEmployees();
    setShowForm(false);
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
    <div className="h-full w-full">
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
          rights={rights}
          canPrint={canPrint}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
        />
      ) : (
      <div className=" bg-slate-50 h-full">
        <Table
          title="Employee Master"
          data={list}
          columns={columns}
          rowKey="employee_id"
          loading={loading}

          onAdd={rights?.add === 1 ? handleAdd : null}
          onRowDoubleClick={handleRowSelect}
          onDeleteMultiple={async (ids) => {
            const confirmed = await confirmDelete({
              title: `Delete ${ids.length} employee${ids.length > 1 ? "s" : ""}?`,
              text: "This action cannot be undone.",
            });

            if (!confirmed) return;

            try {
              setLoading(true);
              await Promise.all(ids.map(id => deleteEmployee(id)));

              showToast({ icon: "success", title: "Deleted successfully" });
            } catch (err) {
              alertError("Delete Error", "Some employees could not be deleted");
            } finally {
              // List ko refresh karein
              await loadEmployees();
            }
          }}
        />
           </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
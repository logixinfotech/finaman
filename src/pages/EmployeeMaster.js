import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../components/Reusable/table/Table";
import EmployeeMasterForm from "../components/EmployeeMaster/EmpolyeeMasterForm";
import {
  getActledListAll,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createLeaveBalance,
  fetchUserGroupsByType,
} from "../utils/api";
import { transformToBackend } from "../utils/employeeMapper";
import EmployeeImportModal from "../components/EmployeeMaster/EmployeeImportModal";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../components/Reusable/alert";
import UnivarsalFilter from "../components/Reusable/Filter/UnivarsalFilter.jsx";
import { setERPHandlers } from "../utils/erpShortcuts";
import { useERPMode } from "../components/Reusable/form/useFormMode";
import { useGroupOptions } from "../Hooks/useUserGroupOption";
import config from "../config";
const initialState = {
  employee_id: null,
  "Employee ID": "",
  Title: "",
  "First Name": "",
  "Middle Name": "",
  "Last Name": "",
  Gender: "",
  "Date of Birth": "",
  "Blood Group": "",
  Nationality: "Indian",
  Religion: "",
  Category: "",
  "Marital Status": "",
  "Spouse Name": "",
  "Anniversary Date": "",
  "No. of Children": "",
  "Mother's Name": "",
  "Father's / Guardian's Name": "",
  Qualification: "",
  "Professional Qualification": "",
  Specialization: "",
  "Mobile No": "",
  "Alternate Mobile": "",
  "Personal Email": "",
  "Work Email": "",
  "PAN Number": "",
  "Aadhaar No": "",
  "Voter ID": "",
  "Driving Licence": "",
  "Passport No": "",
  "C_Address Line 1": "",
  C_City: "",
  C_District: "",
  "C_Pin Code": "",
  C_State: "",
  "P_Address Line 1": "",
  P_City: "",
  P_District: "",
  "P_Pin Code": "",
  P_State: "",
  "Bank Name": "",
  "IFSC Code": "",
  "Account Number": "",
  Department: "",
  Designation: "",
  "Joining Date": "",
  status: "Active",
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
    },
  },
  { key: "employee_code", label: "Emp Code" },
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
  const [showImport, setShowImport] = useState(false);
  const formRef = useRef(null);
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
        backendData.Gender =
          backendData.Gender?.toUpperCase() === "MALE"
            ? "M"
            : backendData.Gender?.toUpperCase() === "FEMALE"
              ? "F"
              : backendData.Gender || null;
      }
      backendData.Is_bill = data["Marital Status"] === "Married" ? 1 : 0;
      if (data["Marital Status"] !== "Married") {
        backendData.Doa = null;
        backendData.Spouse = null;
      }
      ["Op_id1", "Op_id2", "Op_id3", "Op_id5", "Op_id6"].forEach((key) => {
        if (backendData[key] !== undefined) {
          const n = Number(backendData[key]);
          backendData[key] = isNaN(n) ? null : n;
        }
      });

      backendData.Is_tds =
        backendData.Is_tds && Number(backendData.Is_tds) > 0 ? 1 : 0;
      backendData.Pay_amt = backendData.Pay_amt
        ? Number(backendData.Pay_amt)
        : null;
      const dateFields = [
        "Dob",
        "Doj",
        "Doc",
        "Doa",
        "Dol",
        "Passport_expiry",
        "Salary_eff_date",
      ];
      dateFields.forEach((key) => {
        if (!backendData[key] || backendData[key] === "") {
          backendData[key] = null;
        } else {
          const d = new Date(backendData[key]);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            backendData[key] = `${yyyy}-${mm}-${dd}`;
          } else {
            backendData[key] = null;
          }
        }
      });
      const hasLeavingDate = backendData.Dol && backendData.Dol !== "null";
      backendData.Approved = hasLeavingDate
        ? 0
        : data["Status"] === "Active"
          ? 1
          : 0;
      return isEdit
        ? await updateEmployee(data.employee_id, backendData)
        : await createEmployee(backendData);
    },
    () => loadEmployees(),
    tab?.appl_name,
  );
  const [filters, setFilters] = useState({ Status: "Active" });
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const applyFilter = useCallback(() => {
    setPage(1);
  }, []);
  const clearFilter = useCallback(() => {
    setFilters({ Status: "Active" }); // Clear pe bhi default Active hi rahega
    setPage(1);
  }, []);
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      // Employee Name
      if (filters.employee_name) {
        const name = (item.employee_name || "").toLowerCase();
        if (!name.includes(filters.employee_name.toLowerCase())) return false;
      }
      // Department
      if (filters.Department) {
        const dept = String(item.department || "").toLowerCase();
        if (!dept.includes(filters.Department.toLowerCase())) return false;
      }
      // Status
      if (filters.Status && filters.Status !== "All") {
        if (item.status !== filters.Status) return false;
      }
      return true;
    });
  }, [list, filters]);
  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };
  const formatDateOnly = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    // YYYY-MM-DD format — ERPDateInput isi format mein kaam karta hai
    return d.toISOString().split("T")[0];
  };
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const [res, deptRes, desgRes] = await Promise.all([
        getActledListAll(),
        fetchUserGroupsByType("DEP"),
        fetchUserGroupsByType("DESG"),
      ]);
      const deptList = deptRes?.data || [];
      const desgList = desgRes?.data || [];
      const getGroupName = (list, id) => {
        if (!id) return "";
        const found = list.find((g) => String(g.group_id) === String(id));
        return found ? found.group_name : id;
      };
      const mappedData = (res?.data || res || []).map((item) => ({
        ...item,
        employee_id: item.Actled_id,
        "Employee ID": item.Led_code || "",
        Title: item.Title || "",
        "First Name": item.Led_name || "",
        "Last Name": item.Led_alias || "",
        Gender:
          item.Gender === "M"
            ? "Male"
            : item.Gender === "F"
              ? "Female"
              : item.Gender || "",
        "Date of Birth": formatDateOnly(item.Dob),
        "Marital Status": item.Is_bill === 1 ? "Married" : "Single",
        "Spouse Name": item.Spouse || "",
        "Anniversary Date": formatDateOnly(item.Doa),
        "Father's / Guardian's Name": item.F_name || "",
        "Mother's Name": item.M_name || "",
        Qualification: item.E_qua || "",
        "Mobile No": item.Mobile || "",
        "Personal Email": item.Email || "",
        "PAN Number": item.Pan_no || "",
        "Aadhaar No": item.Aadhar || "",
        "Voter ID": item.Voter || "",
        "Driving Licence": item.Driving || "",
        "Passport No": item.Passport || "",
        "Emerg_Contact Person": item.Person || "",
        Emerg_Relationship: item.Relation || "",
        "Emerg_Mobile No": item.Phone || "",
        "Emerg_Alternate No": item.Alt_phone || "",
        "C_Address Line 1": item.Add1 || "",
        C_City: item.City || "",
        C_District: item.Area || "",
        "C_Pin Code": item.Pin || "",
        C_State: item.State || "",
        "P_Address Line 1": item.Padd1 || "",
        P_City: item.Pcity || "",
        P_District: item.Parea || "",
        "P_Pin Code": item.Ppin || "",
        P_State: item.Pstate || "",
        "Bank Name": item.Bank_name || "",
        "IFSC Code": item.Bank_ifsc || "",
        "Account Number": item.Bank_acc || "",
        "Branch Name": item.Bank_add || "",
        Department: item.Op_id3 || "",
        Designation: item.Op_id5 || "",
        "Grade / Level": item.Op_id1 || "",
        Division: item.Op_id2 || "",
        "Branch / Location": item.Branch_location || "",
        "Reporting Manager": item.Op_id6 || "",
        "Employment Type": item.Emp_type || "",
        "Joining Date": formatDateOnly(item.Doj),
        "Confirmation Date": formatDateOnly(item.Doc),
        "Status Leaving Date": formatDateOnly(item.Dol),
        "Status Reason": item.Led_rsn || "",
        "PF Number": item.Epf_no || "",
        "ESI Number": item.Esic_no || "",
        Basic: item.Pay_amt || "",
        Remarks: item.Pay_rmks || "",
        "Leave allow names": item.leave_san ? item.leave_san.split(",") : [],
        Status: item.Approved === 1 ? "Active" : "Inactive",
        photo_url: item.Ledimg
          ? `${config.apiUrl}${item.Ledimg}`
          : "",
        "Middle Name": item.Middle_name || "",
        Nationality: item.Nationality || "Indian",
        Category: item.Category || "",
        "No. of Children": item.No_of_children || "",
        "Passport Expiry": formatDateOnly(item.Passport_expiry),
        Specialization: item.Specialization || "",
        "Alternate Mobile": item.Alt_mobile || "",
        "Work Email": item.Work_email || "",
        "Phone Extension": item.Phone_ext || "",
        "C_Address Line 2": item.C_Address2 || "",
        C_Country: item.C_Country || "",
        "P_Address Line 2": item.P_Address2 || "",
        P_Country: item.P_Country || "",
        "Cost Centre": item.Cost_centre || "",
        "Work Shift": item.Work_shift || "",
        "Work Location Type": item.Work_loc_type || "",
        "Employee Category": item.Emp_category || "",
        "Probation Period": item.Probation_period || "",
        "Notice Period": item.Notice_period || "",
        "Previous Company": item.Prev_company || "",
        "Last Designation": item.Last_desig || "",
        "Last CTC": item.Last_ctc || "",
        "Reason for Leaving": item.Reason_leaving || "",
        "PF Account": item.Pf_account_prev || "",
        "Account Type": item.Account_type || "",
        "Holder Name": item.Holder_name || "",
        "MICR Code": item.Micr_code || "",
        CTC: item.Ctc || "",
        HRA: item.Hra || "",
        "Special Allowance": item.Special_allow || "",
        "Salary Effective Date": formatDateOnly(item.Salary_eff_date),
        UAN: item.Uan || "",
        "PT State": item.Pt_state || "",
        "PF Applicable": item.Pf_applicable || "",
        "ESI Applicable": item.Esi_applicable || "",
        "Gratuity Eligible": item.Gratuity_eligible || "",
        "TDS Category": item.Tds_category || "",
        "Previous Experience": item.Prev_exp || "",
        "Total Experience": (() => {
          if (!item.Doj) return "";
          const join = new Date(item.Doj);
          if (isNaN(join)) return "";
          const now = new Date();
          const years = now.getFullYear() - join.getFullYear();
          const months = now.getMonth() - join.getMonth();
          const totalMonths = years * 12 + months;
          const y = Math.floor(totalMonths / 12);
          const m = totalMonths % 12;
          return `${y}y ${m}m`;
        })(),
        "Blood Group": item.Blood || "",
        "Phone (Residence)": item.Phone_residence || "",
        employee_name: item.Led_name || "",
        employee_code: item.Led_code || "",
        mobile: item.Mobile || "",
        email: item.Email || "",
        department: getGroupName(deptList, item.Op_id3),
        designation: getGroupName(desgList, item.Op_id5),
        joining_date: item.Doj || "",
        status: item.Approved === 1 ? "Active" : "Inactive",
      }));
      setList(mappedData);
      return mappedData;
    } catch (err) {
      alertError("Error", "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      const current = list[currentIndex];
      if (current) {
        setFormData(current);
      }
    }
  }, [currentIndex]);

  const handleRowSelect = (row) => {
    const index = list.findIndex((i) => i.employee_id === row.employee_id);
    if (index !== -1) {
      setCurrentIndex(index);
      const freshRow = { ...list[index] };
      // Photo URL mein cache bust add karo
      if (freshRow.photo_url) {
        freshRow.photo_url = `${freshRow.photo_url}?t=${Date.now()}`;
      }
      handleView(freshRow);
      setFormData(freshRow);
    }
    setShowForm(true);
  };
  const handleSave = async () => {
    if (saving) return;
    if (!formData["First Name"]) {
      alertError("Validation", "First Name required");
      return;
    }
    const leaveTypeIds = Array.isArray(formData["Leave allow"])
      ? formData["Leave allow"]
      : [];
    await performSave("employee_id");
    try {
      const latestRes = await getActledListAll();
const allEmployees = latestRes?.data || latestRes || [];   // ✅ fix
      let savedEmployeeId = formData.employee_id;
      if (!savedEmployeeId) {
        const maxId = Math.max(...allEmployees.map((e) => e.Actled_id || 0));
        savedEmployeeId = maxId > 0 ? maxId : null;
      }
      if (leaveTypeIds.length > 0 && savedEmployeeId) {
        await createLeaveBalance({
          employee_id: savedEmployeeId,
          leave_type_ids: leaveTypeIds,
          financial_year: new Date().getFullYear(),
        });
      }
      const updatedList = await loadEmployees();
      if (savedEmployeeId && updatedList.length > 0) {
        const matchIdx = updatedList.findIndex(
          (e) => e.employee_id === savedEmployeeId,
        );
        const safeIdx = matchIdx !== -1 ? matchIdx : 0;
        setCurrentIndex(safeIdx);
        let photoUrl = null;
        if (formRef.current?.hasPendingPhoto?.()) {
          photoUrl = await formRef.current.uploadPendingPhoto(savedEmployeeId);
        }
        const freshList = await loadEmployees();
        const freshRecord = freshList?.find(
          (e) => e.employee_id === savedEmployeeId,
        );
        const recordToShow = freshRecord || updatedList[safeIdx];
        if (photoUrl && recordToShow) {
          recordToShow.photo_url = photoUrl;
        }
        handleView(recordToShow);
        setFormData(recordToShow);
        showToast({ icon: "success", title: "Saved Successfully" });
        return;
      }
    } catch (err) {
      console.error("Post-save pipeline breakdown:", err);
    }
    showToast({ icon: "success", title: "Saved Successfully" });
    loadEmployees();
    setShowForm(false);
  };
  const handleDelete = async (row) => {
    const confirm = await confirmDelete({
      title: `Delete "${row.employee_name}"?`,
    });
    if (!confirm) return;
    try {
      const res = await deleteEmployee(row.employee_id);
      if (res?.data?.success) {
        await loadEmployees();
        showToast({
          icon: "success",
          title: "Deleted Successfully",
        });
        setShowForm(false);
      }
    } catch (err) {
      showToast({
        icon: "error",
        title: err?.response?.data?.message || "Employee cannot be deleted.",
      });
    }
  };
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => rights?.add && handleAdd(),
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list, rights, handleAdd]);
  const { options } = useGroupOptions();
  return (
    <div className="h-full w-full">
      {showForm ? (
        <EmployeeMasterForm
          ref={formRef}
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
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() =>
            setCurrentIndex((p) => Math.min(p + 1, list.length - 1))
          }
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            activeTab="search"
            onTabChange={handleTabChange}
            title="Employee Master"
            data={filteredList}
            columns={columns}
            rowKey="employee_id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onImport={() => setShowImport(true)}
            onRowDoubleClick={handleRowSelect}
            onToggleFilter={() => setShowFilter((p) => !p)}
            showForm={showFilter}
            formComponent={
              <UnivarsalFilter
                options={options}
                filters={filters}
                visibleFields={["employee", "department", "status"]}
                setFilters={setFilters}
                onApply={applyFilter}
                onClear={clearFilter}
              />
            }
            onDeleteMultiple={async (ids) => {
              const confirmed = await confirmDelete({
                title: `Delete ${ids.length} employee${ids.length > 1 ? "s" : ""}?`,
                text: "This action cannot be undone.",
              });
              if (!confirmed) return;

              try {
                setLoading(true);
                const results = await Promise.allSettled(
                  ids.map((id) => deleteEmployee(id)),
                );

                const failed = results.filter(
                  (r) => r.status === "rejected" || !r.value?.data?.success,
                );
                const succeeded = results.length - failed.length;

                if (failed.length === 0) {
                  showToast({
                    icon: "success",
                    title: `${succeeded} employee(s) deleted successfully`,
                  });
                } else {
                  // ✅ Failed ones ka error message dikhao
                  const firstError =
                    failed[0]?.reason?.response?.data?.message ||
                    failed[0]?.value?.data?.message ||
                    "Some employees could not be deleted due to existing dependencies.";

                  alertError(
                    "Partial Delete",
                    `${succeeded} deleted. ${failed.length} could not be deleted: ${firstError}`,
                  );
                }
              } catch (err) {
                alertError(
                  "Delete Error",
                  err?.response?.data?.message ||
                    "Some employees could not be deleted.",
                );
              } finally {
                await loadEmployees();
              }
            }}
          />

          {showImport && (
            <EmployeeImportModal
              onClose={() => setShowImport(false)}
              onSuccess={() => {
                loadEmployees();
                showToast({ icon: "success", title: "Import completed" });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;

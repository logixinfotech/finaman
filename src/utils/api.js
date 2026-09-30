import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import { handleApi } from "./apiHandler";
import { transformToBackend } from "./employeeMapper";

export const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.database) {
    config.headers["x-tenant-db"] = user.database;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes("/api/authenticate");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.clear();

      await Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "You have been logged in from another device.",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#3085d6",
      });

      window.location.href = "/login"; // full reload — AuthContext fresh state se re-init hoga
    }

    return Promise.reject(error);
  }
);

export const authenticateUser = async ({
  user_id,
  user_pass,
  forceLogin = false,
}) => {
  try {
    const response = await api.post("/api/authenticate", {
      user_id,
      user_pass,
      forceLogin,
    });
    return response.data;
  } catch (error) {
    console.error("Auth Error:", error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/api/authenticate/logout");
  } catch (error) {
    console.error("Logout API error:", error.message);
  } finally {
    localStorage.clear();
    window.location.href = "/login";
  }
};
export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/api/profile",);

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
export const selectCompany = async (body) => {
  try {
    const response = await api.post("/api/authenticate/select-company", body);
    return response.data;
  } catch (error) {
    console.error("Select Company Error:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchSwitchableCompanies = async () => {
  try {
    const response = await api.get("/api/authenticate/companies");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching companies:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

export const switchCompany = async (com_id) => {
  try {
    const response = await api.post("/api/authenticate/switch-company", {
      com_id,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Switch Company Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
export const fetchActivity = (params) =>
  handleApi(() => api.get("/api/activity", { params }));
export const getNotifications = (params = {}) =>
  handleApi(() =>
    api.get("/api/notifications", {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 100,
        filter: params.filter || "all",
        category: params.category || "all",
      },
    })
  );

export const getNotificationCount = () =>
  handleApi(() => api.get("/api/notifications/count"));
export const markNotificationRead = (id) =>
  handleApi(() => api.patch(`/api/notifications/${id}/read`));
export const markAllNotificationsRead = () =>
  handleApi(() => api.patch("/api/notifications/read-all"));

export const deleteNotification = (id) =>
  handleApi(() => api.delete(`/api/notifications/${id}`));
export const deleteAllNotifications = () =>
  handleApi(() => api.delete("/api/notifications"));
export const fetchUsers = () =>
  handleApi(() => api.get("/api/user/users"));
export const createUser = (data) =>
  handleApi(() => api.post("/api/user/add-user", data));

export const updateUser = (id, data) =>
  handleApi(() => api.put(`/api/user/update-user/${id}`, data));

export const toggleUserBlock = (user_id) =>
  handleApi(() => api.patch(`/api/user/toggle-block/${user_id}`));

export const deleteUser = (id) =>
  handleApi(() => api.delete(`/api/user/delete-user/${id}`));
export const updateUserAuth = (id) =>
  handleApi(() => api.delete(`//api/user/permissions/${id}`));

//------------------------------------Holiday Master --------------------------------------------------------
export const fetchHolidays = async (search = "", pageSize = 20) => {
  try {
    const res = await api.get(`/api/holiday?pageSize=${pageSize}&search=${search}`);
    const rawData = res.data.success ? res.data.data : [];
    return rawData.map((item) => ({
      id: item.H_id,
      date: item.H_date ? item.H_date.split("T")[0] : "",
      purpose: item.Purpose,
      remarks: item.Remarks,
      offcode: item.Offcode,
      holiday_type_code: item.HolidayTypeCode || (item.IsRestricted ? "Restricted" : "Festival"),
      is_restricted: item.IsRestricted ? 1 : 0,
    }));
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
};

export const fetchRestrictedHolidays = async (year) => {
  try {
    const res = await api.get(`/api/holiday/restricted-dates${year ? `?year=${year}` : ""}`);
    const rawData = res.data.success ? res.data.data : [];
    return rawData.map((item) => ({
      id: item.H_id,
      date: item.H_date ? item.H_date.split("T")[0] : "",
      purpose: item.Purpose,
      remarks: item.Remarks,
      holiday_type_code: item.HolidayTypeCode || "Restricted",
      is_restricted: 1,
    }));
  } catch (error) {
    console.error("Fetch Restricted Holidays Error:", error);
    return [];
  }
};

export const createHoliday = (data) =>
  handleApi(() => api.post("/api/holiday", data));

export const updateHoliday = (id, data) =>
  handleApi(() => api.put(`/api/holiday/${id}`, data));

export const deleteHoliday = (id) =>
  handleApi(() => api.delete(`/api/holiday/${id}`));

//------------------------------------ User Group Master --------------------------------------------------------
export const fetchUserGroups = () =>
  handleApi(() => api.get("/api/user/groups"));

export const createUserGroup = (data) =>
  handleApi(() => api.post("/api/user/add-group", data));

export const updateUserGroup = (id, data) =>
  handleApi(() => api.put(`/api/user/update-group/${id}`, data));

export const deleteUserGroup = (id) =>
  handleApi(() => api.delete(`/api/user/delete-group/${id}`));

export const fetchUserGroupsByType = (type) =>
  handleApi(() => api.get(`/api/user/groups?type=${type}`));

export const updateModuleVisibility = (id, show_stat) =>
  handleApi(() => api.put(`/api/masmod/${id}`, { show_stat }));

export const sendEventWish = (employeeId, type, years) =>
  handleApi(() => api.post(`/api/employee/actled/${employeeId}/send-wish`, { type, years }));
export const fetchSidebarMenu = async () => {
  try {
    const response = await api.get('/api/masmod',);
    return response.data;
  } catch (error) {
    console.error('Error fetching sidebar menu:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const fetchMasmnuData = async (token) => {
  try {
    const response = await api.get('/api/masmnu');
    return response.data;
  } catch (error) {
    console.error('Error fetching masmnu data:', error.response ? error.response.data : error.message);
    throw error;
  }
};
export const getCompanyList = (params) =>
  handleApi(() =>
    api.get("/api/companymaster", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...params.filters
      }
    })
  );

export const createCompany = async (companyData) => {
  try {
    const response = await api.post(
      "/api/companymaster",
      companyData,
    );

    return response.data;

  } catch (error) {

    console.error(
      "Error creating company:",
      error.response ? error.response.data : error.message
    );
    if (error.response && error.response.data) {
      return error.response.data;
    }

    return {
      success: false,
      message: "Server error"
    };
  }
};
export const updateCompany = async (companyId, companyData) => {
  try {

    const response = await api.put(
      `/api/companymaster/${companyId}`,
      companyData,);

    return response.data;

  } catch (error) {

    console.error(
      "Error updating company:",
      error.response ? error.response.data : error.message
    );

    if (error.response && error.response.data) {
      return error.response.data;
    }

    return {
      success: false,
      message: "Server error"
    };
  }
};

export const deleteCompany = async (companyId) => {
  try {
    const response = await api.delete(`/api/companymaster/${companyId}`,);
    return response.data;
  } catch (error) {
    console.error('Error deleting company:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const fetchMenuMasterList = async (filters = {}) => {
  const response = await api.get("/api/masmnu/list", {
    params: filters,

  });
  return response.data;
};

// export const fetchMenuGroups = async (params = {}) => {
//   const response = await api.get("/api/masmnu/groups", { params });
//   return response.data;
// };

export const createMasmnu = async (data) => {
  const response = await api.post("/api/masmnu", data, {

  });
  return response.data;
};

export const updateMasmnu = async (id, data) => {
  const response = await api.put(`/api/masmnu/${id}`, data, {

  });
  return response.data;
};

export const deleteMasmnu = async (id) => {
  const response = await api.delete(`/api/masmnu/${id}`, {

  });
  return response.data;
};

export const fetchMenuGroupList = () =>
  handleApi(() => api.get("/api/user/groups?type=MU_GRP"));

//------------------------------------ Menu Group (masgrp) --------------------------------------------------------
export const fetchMasgrpList = async (params = {}) => {
  const response = await api.get("/api/masgrp", { params });
  return response.data;
};

export const createMasgrp = async (data) => {
  const response = await api.post("/api/masgrp", data);
  return response.data;
};

export const updateMasgrp = async (id, data) => {
  const response = await api.put(`/api/masgrp/${id}`, data);
  return response.data;
};

export const deleteMasgrp = async (id) => {
  const response = await api.delete(`/api/masgrp/${id}`);
  return response.data;
};

export const saveUserPermissions = (payload) =>
  handleApi(() => api.post("/api/user/permissions", payload));

export const fetchUserPermissions = async (userma_id) => {
  const response = await api.get(
    `/api/user/permissions/${userma_id}`
  );
  return response.data;
};
export const fetchDepartments = () =>
  api.get("/departments").then((res) => res.data);

export const fetchDepartmentPermissions = (user_group) =>
  api
    .get(`/permissions/department/${encodeURIComponent(user_group)}`)
    .then((res) => res.data);

export const saveDepartmentPermissions = (payload) =>
  api.post("/permissions/department", payload).then((res) => res.data);

export const fetchCountries = async () => {
  const response = await api.get('/api/countries');
  return response.data;
};

export const fetchStates = async () => {
  const response = await api.get('/api/states');
  return response.data;
};

//------------------------------------ PAYROLL ATTENDANCE-------------------------------------------------------- 
export const getAttendanceList = (params) =>
  handleApi(() =>
    api.get("/api/payroll/attendance-log", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...params.filters
      }
    })
  );

export const getAttendanceById = (id) =>
  handleApi(() => api.get(`/api/payroll/attendance-log/${id}`));

export const saveAttendanceLog = (data) =>
  handleApi(() => api.post("/api/payroll/attendance-log", data));

export const updateAttendance = (id, data) =>
  handleApi(() => api.put(`/api/payroll/attendance-log/${id}`, data));

export const deleteAttendance = (id) =>
  handleApi(() => api.delete(`/api/payroll/attendance-log/${id}`));

export const getEmployeeByCode = (code) =>
  handleApi(() => api.get(`/api/employee/actled/by-code/${code}`));

export const resolveEmployeeCodes = (codes) =>
  handleApi(() => api.post("/api/payroll/actled/resolve-codes", { codes }));

//------------------------------------Employee Master --------------------------------------------------------

export const saveEmployee = (data) =>
  handleApi(() => api.post("/api/employee/employee", data));

export const getActledList = () =>
  handleApi(() => api.get("/api/employee/actled"));

export const getActledListAll = () =>
  handleApi(() => api.get("/api/employee/actled/all"));

export const createEmployee = async (data) => {
  try {
    const res = await api.post("/api/employee/actled", {
      employeeData: JSON.stringify(data),
    });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.message ||
        "Database error",
    };
  }
};

export const updateEmployee = async (id, data) => {
  try {
    const res = await api.put(`/api/employee/actled/${id}`, {
      employeeData: JSON.stringify(data),
    });
    return res.data;
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message ||
        err.message,
    };
  }
};

export const deleteEmployee = (id) => {
  return api.delete(`/api/employee/actled/${id}`);
};

export const importEmployees = (formData) =>
  handleApi(() => api.post("/api/employee/actled/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }));

// ── Employee Documents ───────────────────────────────────────
export const getEmployeeDocuments = (empId) =>
  handleApi(() => api.get(`/api/employee/actled/${empId}/documents`));

export const uploadEmployeeDocument = (empId, formData) =>
  handleApi(() => api.post(`/api/employee/actled/${empId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }));

export const deleteEmployeeDocument = (empId, docId) =>
  handleApi(() => api.delete(`/api/employee/actled/${empId}/documents/${docId}`));

export const viewEmployeeDocument = (empId, docId) => {
  const token = localStorage.getItem("token");
  return `${config.apiUrl}/api/employee/actled/${empId}/documents/${docId}/view?token=${token}`;
};

export const uploadEmployeePhoto = (empId, formData) =>
  handleApi(() => api.post(`/api/employee/actled/${empId}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }));

export const getEmployeePhotoUrl = (empId) =>
  `${api.defaults.baseURL}/api/employee/actled/${empId}/photo`;

// ──────────────────────────────────────────────────SHIFT MASTER ENDPOINTS ─────────────────────────────────── 

export const fetchShifts = () =>
  handleApi(() => api.get("/api/shiftmaster"));

export const createShift = (data) =>
  handleApi(() => api.post("/api/shiftmaster", data));

export const updateShift = (id, data) =>
  handleApi(() => api.put(`/api/shiftmaster/${id}`, data));

export const deleteShift = (id) =>
  handleApi(() => api.delete(`/api/shiftmaster/${id}`));

export const fetchAttendanceRules = () =>
  handleApi(() => api.get("/api/attendancerules"));

export const createAttendanceRule = (data) =>
  handleApi(() => api.post("/api/attendancerules", data));

export const updateAttendanceRule = (id, data) =>
  handleApi(() => api.put(`/api/attendancerules/${id}`, data));

export const deleteAttendanceRule = (id) =>
  handleApi(() => api.delete(`/api/attendancerules/${id}`));

// ─────────────────────────────────────────── OVER TIME ENTRY ───────────────────────────────────── 

export const fetchOTRules = () =>
  handleApi(() => api.get("/api/overtime-entry"));

export const createOTRule = (data) =>
  handleApi(() => api.post("/api/overtime-entry", data));

export const updateOTRule = (id, data) =>
  handleApi(() => api.put(`/api/overtime-entry/${id}`, data));

export const deleteOTRule = (id) =>
  handleApi(() => api.delete(`/api/overtime-entry/${id}`));

export const fetchGrades = () =>
  handleApi(() => api.get("/api/user/groups?type=GRADE"));
// ───────────────────────────────────────────── SHIFT ALLOCATION ENDPOINTS ────────────────────────────────────── 

export const fetchAllocations = () =>
  handleApi(() => api.get("/api/shiftmaster/shiftallocation"));

export const createAllocation = (data) =>
  handleApi(() => api.post("/api/shiftmaster/shiftallocation", data));

export const updateAllocation = (id, data) =>
  handleApi(() => api.put(`/api/shiftmaster/shiftallocation/${id}`, data));
export const deleteAllocation = (id) =>
  handleApi(() => api.delete(`/api/shiftmaster/shiftallocation/${id}`));

// ────────────────────────────────────────────  EEKOFF MASTER ──────────────────────────────────── 


export const getWeekOff = () =>
  handleApi(() => api.get("/api/weekoff"));

export const createWeekOff = (data) =>
  handleApi(() => api.post("/api/weekoff", data));

export const updateWeekOff = (id, data) =>
  handleApi(() => api.put(`/api/weekoff/${id}`, data));

export const deleteWeekOff = (id) =>
  handleApi(() => api.delete(`/api/weekoff/${id}`));

// ───────────────────────────────────────── ttendance Regularization  ───────────────────────────────────── 


export const getAttendRegular = () =>
  handleApi(() => api.get("/api/attendregular"));

export const createAttendRegular = (data) =>
  handleApi(() => api.post("/api/attendregular", data));

export const updateAttendRegular = (id, data) =>
  handleApi(() => api.put(`/api/attendregular/${id}`, data));

export const deleteAttendRegular = (id) =>
  handleApi(() => api.delete(`/api/attendregular/${id}`));


// ────────────────────────────────────── LEAVE TYPES ──────────────────────────────────────────────────

export const getLeaveTypes = () =>
  handleApi(() => api.get("/api/leavetypes"));

// asOfDate (YYYY-MM-DD) → FY + month-wise balance; excludeRequestId → edit mode mein apna request pending mein na gine
export const getLeaveTypesByEmployee = (employeeId, asOfDate, excludeRequestId) => {
  const params = new URLSearchParams();
  if (asOfDate) params.append("as_of", asOfDate);
  if (excludeRequestId) params.append("exclude_request_id", excludeRequestId);
  return handleApi(() => api.get(`/api/leavetypes/employee/${employeeId}?${params.toString()}`));
};

export const createLeaveType = (data) =>
  handleApi(() => api.post("/api/leavetypes", data));

export const updateLeaveType = (id, data) =>
  handleApi(() => api.put(`/api/leavetypes/${id}`, data));

export const deleteLeaveType = (id) =>
  handleApi(() => api.delete(`/api/leavetypes/${id}`));

// ─────────────────────────────────────  EAVE Balance ──────────────────────────────────────────────────

export const getLeaveBalance = () =>
  handleApi(() => api.get("/api/leavetypes/balance"));

export const createLeaveBalance = (data) =>
  handleApi(() => api.post("/api/leavetypes/balance", data));

// ───────────────────────────────────────── LEAVE Request ──────────────────────────────────────────────────

export const getLeaveRequests = () =>
  handleApi(() => api.get("/api/leaverequest"));

export const createLeaveRequest = (data) =>
  handleApi(() => api.post("/api/leaverequest", data));

export const updateLeaveRequest = (id, data) =>
  handleApi(() => api.put(`/api/leaverequest/${id}`, data));

export const deleteLeaveRequest = (id) =>
  handleApi(() => api.delete(`/api/leaverequest/${id}`));

export const getApprovedLeaves = ({ date, employee_id, month, year }) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (employee_id) params.append("employee_id", employee_id);
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  return handleApi(() => api.get(`/api/leaverequest/approved?${params.toString()}`));
};

// ──────────────────────────────────────── INCOME HEADS ──────────────────────────────────────────────────────────


export const fetchIncomeHeads = () =>
  handleApi(() => api.get("/api/salary-master/income-heads"));

export const createIncomeHead = (data) =>
  handleApi(() => api.post("/api/salary-master/income-heads", data));

export const updateIncomeHead = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/income-heads/${id}`, data));

export const deleteIncomeHead = (id) =>
  handleApi(() => api.delete(`/api/salary-master/income-heads/${id}`));

// ─────────────────────────────────────────── DEDUCTION HEADS ───────────────────────────────────────────────────────


export const fetchDeductionHeads = () =>
  handleApi(() => api.get("/api/salary-master/deduction-heads"));

export const createDeductionHead = (data) =>
  handleApi(() => api.post("/api/salary-master/deduction-heads", data));

export const updateDeductionHead = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/deduction-heads/${id}`, data));

export const deleteDeductionHead = (id) =>
  handleApi(() => api.delete(`/api/salary-master/deduction-heads/${id}`));

// ───────────────────────────────────────── CONTRIBUTION HEADS ───────────────────────────────────────────────────────

export const fetchContributionHeads = () =>
  handleApi(() => api.get("/api/salary-master/contribution-heads"));

export const createContributionHead = (data) =>
  handleApi(() => api.post("/api/salary-master/contribution-heads", data));

export const updateContributionHead = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/contribution-heads/${id}`, data));

export const deleteContributionHead = (id) =>
  handleApi(() => api.delete(`/api/salary-master/contribution-heads/${id}`));


// ───────────────────────────────────────── SALARY TEMPLATE  ────────────────────────────

export const fetchSalaryTemplates = () =>
  handleApi(() => api.get("/api/salary-master/salary-templates"));

export const fetchActiveIncomeHeads = () =>
  handleApi(() => api.get("/api/salary-master/income-heads?status=Active"));

export const fetchActiveDeductionHeads = () =>
  handleApi(() => api.get("/api/salary-master/deduction-heads?status=Active"));

export const fetchActiveContributionHeads = () =>
  handleApi(() => api.get("/api/salary-master/contribution-heads?status=Active"));
// ──────────────────────────────────────── SALARY TEMPLATES ──────────────────────────────────────────────────────

export const createSalaryTemplate = (data) =>
  handleApi(() => api.post("/api/salary-master/salary-templates", data));

export const updateSalaryTemplate = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/salary-templates/${id}`, data));

export const deleteSalaryTemplate = (id) =>
  handleApi(() => api.delete(`/api/salary-master/salary-templates/${id}`));

// ───────────────────────────────────────── FORMULA ENGINE ────────────────────────────────────────────────────────
export const fetchFormulaEngine = () =>
  handleApi(() => api.get("/api/salary-master/formula-engine"));

export const createFormula = (data) =>
  handleApi(() => api.post("/api/salary-master/formula-engine", data));

export const updateFormula = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/formula-engine/${id}`, data));

export const deleteFormula = (id) =>
  handleApi(() => api.delete(`/api/salary-master/formula-engine/${id}`));


// ───────────────────────────────────────── Approval Workflow ────────────────────────────────────────────────────────
export const getApprovalWorkflow = () =>
  handleApi(() => api.get("/api/Approvalflow"));

export const createApprovalWorkflow = (data) =>
  handleApi(() => api.post("/api/Approvalflow", data));

export const updateApprovalWorkflow = (id, data) =>
  handleApi(() => api.put(`/api/Approvalflow/${id}`, data));

export const deleteApprovalWorkflow = (id) =>
  handleApi(() => api.delete(`/api/Approvalflow/${id}`));


// ────────────────────────────────────────── Approval Transaction ──────────────────────────────────────────────────

export const getPendingRequests = (approverId) =>
  handleApi(() => api.get(`/api/ApprovalTransaction/pending/${approverId}`));

export const approvalAction = (data) =>
  handleApi(() => api.post("/api/ApprovalTransaction/action", data));

export const getApprovalTransactions = () =>
  handleApi(() => api.get("/api/ApprovalTransaction"));

export const getAllApprovalTransactions = () =>
  handleApi(() => api.get("/api/ApprovalTransaction"));

export const getTransactionsByRequest = (requestId) =>
  handleApi(() => api.get(`/api/ApprovalTransaction/by-request/${requestId}`));

export const createApprovalTransaction = (data) =>
  handleApi(() => api.post("/api/ApprovalTransaction", data));

export const updateApprovalTransaction = (id, data) =>
  handleApi(() => api.put(`/api/ApprovalTransaction/${id}`, data));

export const deleteApprovalTransaction = (id) =>
  handleApi(() => api.delete(`/api/ApprovalTransaction/${id}`));

// ──────────────────────────────────────── Leave Accrual & Carry Forward ────────────────────────────────────────
export const getLeaveAccruals = () =>
  handleApi(() => api.get("/api/LeaveAccrual"));

export const createLeaveAccrual = (data) =>
  handleApi(() => api.post("/api/LeaveAccrual", data));

export const updateLeaveAccrual = (id, data) =>
  handleApi(() => api.put(`/api/LeaveAccrual/${id}`, data));

export const deleteLeaveAccrual = (id) =>
  handleApi(() => api.delete(`/api/LeaveAccrual/${id}`));

export const bulkSaveAccrual = (data) =>
  handleApi(() => api.post("/api/LeaveAccrual/bulk", data));

export const postAccruals = (data) =>
  handleApi(() => api.post("/api/LeaveAccrual/post", data));

// ────────────────────────────────────────── Leave Policy Master ────────────────────────────────────────────────
export const getLeavePolicies = () =>
  handleApi(() => api.get("/api/leave-policy"));

export const getLeavePolicyById = (id) =>
  handleApi(() => api.get(`/api/leave-policy/${id}`));

export const createLeavePolicy = (data) =>
  handleApi(() => api.post("/api/leave-policy", data));

export const updateLeavePolicy = (id, data) =>
  handleApi(() => api.put(`/api/leave-policy/${id}`, data));

export const deleteLeavePolicy = (id) =>
  handleApi(() => api.delete(`/api/leave-policy/${id}`));

export const previewLeavePolicySchedule = (data) =>
  handleApi(() => api.post("/api/leave-policy/preview", data));

// ────────────────────────────────────────── Leave Encashment ──────────────────────────────────────────────────────
export const getLeaveEncashments = () =>
  handleApi(() => api.get("/api/LeaveEncashment"));

export const createLeaveEncashment = (data) =>
  handleApi(() => api.post("/api/LeaveEncashment", data));

export const updateLeaveEncashment = (id, data) =>
  handleApi(() => api.put(`/api/LeaveEncashment/${id}`, data));

export const deleteLeaveEncashment = (id) =>
  handleApi(() => api.delete(`/api/LeaveEncashment/${id}`));

// ───────────────────────────────────── PF ────────────────────────────────────────────────────
export const fetchPFList = () => handleApi(() => api.get("/api/statutory-master/?type=PF"));
export const createPF = (data) => handleApi(() => api.post("/api/statutory-master/", data));
export const updatePF = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deletePF = (id) => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ───────────────────────────────────── ESI ───────────────────────────────────────────────────
export const fetchESIList = () => handleApi(() => api.get("/api/statutory-master/?type=ESI"));
export const createESI = (data) => handleApi(() => api.post("/api/statutory-master/", data));
export const updateESI = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deleteESI = (id) => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ───────────────────────────────────── PT ────────────────────────────────────────────────────
export const fetchPTList = () => handleApi(() => api.get("/api/statutory-master/?type=PT"));
export const createPT = (data) => handleApi(() => api.post("/api/statutory-master/", data));
export const updatePT = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deletePT = (id) => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ───────────────────────────────────── LWF ───────────────────────────────────────────────────
export const fetchLWFList = () => handleApi(() => api.get("/api/statutory-master/?type=LWF"));
export const createLWF = (data) => handleApi(() => api.post("/api/statutory-master/", data));
export const updateLWF = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deleteLWF = (id) => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ───────────────────────────────────── TDS ───────────────────────────────────────────────────
export const fetchTDSList = () => handleApi(() => api.get("/api/statutory-master/tds"));
export const createTDS = (data) => handleApi(() => api.post("/api/statutory-master/tds", data));
export const updateTDS = (id, data) => handleApi(() => api.put(`/api/statutory-master/tds/${id}`, data));
export const deleteTDS = (id) => handleApi(() => api.delete(`/api/statutory-master/tds/${id}`));


// ───────────────────────────────────── loan-reimbursement ───────────────────────────────────────────────────
export const getLoanReimbursement = () =>
  handleApi(() => api.get("/api/loanReimbursement"));

export const createLoanReimbursement = (data) =>
  handleApi(() => api.post("/api/loanReimbursement", data));

export const updateLoanReimbursement = (id, data) =>
  handleApi(() => api.put(`/api/loanReimbursement/${id}`, data));

export const deleteLoanReimbursement = (id) =>
  handleApi(() => api.delete(`/api/loanReimbursement/${id}`));


// ───────────────────────────────────── asset-master ───────────────────────────────────────────────────

export const getAssetMaster = () =>
  handleApi(() => api.get("/api/assetMaster"));

export const createAssetMaster = (data) =>
  handleApi(() => api.post("/api/assetMaster", data));

export const updateAssetMaster = (id, data) =>
  handleApi(() => api.put(`/api/assetMaster/${id}`, data));

export const deleteAssetMaster = (id) =>
  handleApi(() => api.delete(`/api/assetMaster/${id}`));


// ───────────────────────────────────── createTrainingSkill-master ───────────────────────────────────────────────────

export const getTrainingSkillMaster = () =>
  handleApi(() =>
    api.get("/api/training-skill-master")
  );

export const createTrainingSkillMaster = (data) =>
  handleApi(() =>
    api.post("/api/training-skill-master", data)
  );

export const updateTrainingSkillMaster = (id, data) =>
  handleApi(() =>
    api.put(`/api/training-skill-master/${id}`, data)
  );

export const deleteTrainingSkillMaster = (id) =>
  handleApi(() =>
    api.delete(`/api/training-skill-master/${id}`)
  );
// ───────────────────────────────────── Purchase Order Approval ──────────────────────────────────────────────────

export const fetchApprovals = (status) =>
  handleApi(() => api.get("/api/poa", status !== "All" ? { params: { status } } : {}));

export const fetchApprovalById = (approval_id) =>
  handleApi(() => api.get(`/api/poa/${approval_id}`));

export const submitApproval = (payload) =>
  handleApi(() => api.post("/api/poa/submit", payload));

export const patchApproval = (approval_id, payload) =>
  handleApi(() => api.patch(`/api/poa/${approval_id}/action`, payload));

// ───────────────────────────────────── OT Transactions ─────────────────────────────────────────────────────────

export const getOTTransactions = (params = {}) =>
  handleApi(() => api.get("/api/payroll/ot-transactions", { params }));

export const getOTTransactionById = (id) =>
  handleApi(() => api.get(`/api/payroll/ot-transactions/${id}`));

export const calculateOT = (params) =>
  handleApi(() => api.get("/api/payroll/ot-transactions/calculate", { params }));
// params: { employee_id, ot_date, day_type }

export const saveOTTransaction = (data) =>
  handleApi(() => api.post("/api/payroll/ot-transactions", data));

export const updateOTTransaction = (id, data) =>
  handleApi(() => api.put(`/api/payroll/ot-transactions/${id}`, data));

export const updateOTStatus = (id, payload) =>
  handleApi(() => api.patch(`/api/payroll/ot-transactions/${id}/status`, payload));
// payload: { status: "Approved"|"Rejected"|"Pending", approved_by, remarks }

export const deleteOTTransaction = (id) =>
  handleApi(() => api.delete(`/api/payroll/ot-transactions/${id}`));

// ───────────────────────────────────── Monthly Attendance Report ─────────────────────────────────────────────────────────

export const fetchMonthlyAttendanceSummary = (month, year) =>
  handleApi(() => api.get(`/api/reports/monthly-attendance-summary?month=${month}&year=${year}`));

export const fetchEmployeeAttendanceDetail = (employeeId, month, year) =>
  handleApi(() => api.get(`/api/reports/employee-attendance-detail?employee_id=${employeeId}&month=${month}&year=${year}`));

// ───────────────────────────────────── Attendance Register ─────────────────────────────────────────────────────────

export const fetchAttendanceRegister = (month, year) =>
  handleApi(() => api.get(`/api/reports/attendance-register?month=${month}&year=${year}`));

// ───────────────────────────────────── Salary Structures  ──────────────────────────────────

export const fetchSalaryStructures = () =>
  api.get("/api/salary-master/salary-structures").then(r => r.data);

export const fetchSalaryStructure = (id) =>
  api.get(`/api/salary-master/salary-structures/${id}`).then(r => r.data);

export const fetchActiveStructureByEmployee = (employee_id) =>
  api.get(`/api/salary-master/salary-structures/by-employee/${employee_id}/active`).then(r => r.data);

export const fetchStructureHistory = (employee_id) =>
  api.get(`/api/salary-master/salary-structures/by-employee/${employee_id}/history`).then(r => r.data);

export const createSalaryStructure = (data) =>
  api.post("/api/salary-master/salary-structures", data).then(r => r.data);

export const updateSalaryStructure = (id, data) =>
  api.put(`/api/salary-master/salary-structures/${id}`, data).then(r => r.data);

export const deleteSalaryStructure = (id) =>
  api.delete(`/api/salary-master/salary-structures/${id}`).then(r => r.data);
export const fetchSalaryStructureById = async (id) => {
  const res = await api.get(`/api/salary-master/salary-structures/${id}`);
  return res.data;
};
// ─────────────────────────────────── Salary Transactions ───────────────────────────────────

export const fetchSalaryTransactions = (params = "") =>
  handleApi(() => api.get(`/api/salary-master/salary-transactions${params ? `?${params}` : ""}`));

export const fetchSalaryTransactionById = (id) =>
  handleApi(() => api.get(`/api/salary-master/salary-transactions/${id}`));

export const createSalaryTransaction = (data) =>
  handleApi(() => api.post("/api/salary-master/salary-transactions", data));

export const updateSalaryTransaction = (id, data) =>
  handleApi(() => api.put(`/api/salary-master/salary-transactions/${id}`, data));

export const deleteSalaryTransaction = (id) =>
  handleApi(() => api.delete(`/api/salary-master/salary-transactions/${id}`));

export const fetchPayrollSummary = (emp_id, month_year) =>
  handleApi(() =>
    api.get(`/api/salary-master/salary-transactions/payroll-summary?emp_id=${emp_id}&month_year=${month_year}`)
  );
// ─────────────────────────────────────────── Work Diary API functions ─────────────────────────────────────

export const fetchWorkDiaries = (params = "") =>
  handleApi(() => api.get(`/api/work-diary${params ? `?${params}` : ""}`));

export const createWorkDiary = (data) =>
  handleApi(() => api.post("/api/work-diary", data));

export const updateWorkDiary = (id, data) =>
  handleApi(() => api.put(`/api/work-diary/${id}`, data));

export const deleteWorkDiary = (id) =>
  handleApi(() => api.delete(`/api/work-diary/${id}`));

export const deleteTaskLine = (line_id) =>
  handleApi(() => api.delete(`/api/work-diary/lines/${line_id}`));
export const fetchYesterdayTasks = (empId, date) =>
  handleApi(() => api.get(`/api/work-diary/yesterday/${empId}/${date}`));

export const fetchPendingDiaries = () =>
  handleApi(() => api.get("/api/work-diary/review"));
export const fetchWorkDiaryCategories = () =>
  handleApi(() => api.get('/api/work-diary/categories'));
export const fetchMyTasks = () =>
  handleApi(() => api.get("/api/work-diary/my-tasks"));

export const fetchAssignedByMeTasks = () =>
  handleApi(() => api.get("/api/work-diary/assigned-by-me"));

export const fetchWorkDiaryReport = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return handleApi(() =>
    api.get(`/api/work-diary/report${q ? `?${q}` : ""}`)
  );
};
// ─────────────────────────────────────────── Subtasks ─────────────────────────────────────────────────────
export const fetchSubtasks = (line_id) =>
  handleApi(() => api.get(`/api/work-diary/subtasks/${line_id}`));

export const addSubtask = (data) =>
  // data: { line_id, diary_id, subtask_text, sort_order? }
  handleApi(() => api.post("/api/work-diary/subtasks", data));

export const toggleSubtask = (subtask_id, is_done) =>
  handleApi(() => api.patch(`/api/work-diary/subtasks/${subtask_id}`, { is_done }));
export const updateSubtask = (subtask_id, data) =>
  handleApi(() => api.patch(`/api/work-diary/subtasks/${subtask_id}`, data));
export const deleteSubtask = (subtask_id) =>
  handleApi(() => api.delete(`/api/work-diary/subtasks/${subtask_id}`));
export const fetchWorkDiaryById = (id) =>
  handleApi(() => api.get(`/api/work-diary/${id}`));
export const fetchWorkDiariesByDept = (dept) =>
  handleApi(() => api.get(`/api/work-diary?all=1&include_lines=1&department=${encodeURIComponent(dept)}`));
//                                          ↑ ye add karo
// ─────────────────────────────────────────── Comments ─────────────────────────────────────────────────────
export const fetchComments = (line_id) =>
  handleApi(() => api.get(`/api/work-diary/comments/${line_id}`));

export const addComment = (data) =>
  handleApi(() => api.post("/api/work-diary/comments", data));

export const updateTaskLineStatus = (line_id, status) =>
  handleApi(() => api.patch(`/api/work-diary/lines/${line_id}/status`, { status }));

// ─────────────────────────────────────────── Payroll Monthly ───────────────────────────────────────────
export const getPayrollMonthly = (month_year) =>
  handleApi(() => api.get(`/api/payroll-monthly${month_year ? `?month_year=${month_year}` : ""}`));

export const getPayslipData = (payrollId) =>
  handleApi(() => api.get(`/api/payroll-monthly/${payrollId}/payslip`));

export const calculatePayroll = (data) =>
  handleApi(() => api.post("/api/payroll-monthly/calculate", data));

export const approvePayroll = (data) =>
  handleApi(() => api.post("/api/payroll-monthly/approve", data));

export const bulkUpdatePayrollStatus = (data) =>
  handleApi(() => api.put("/api/payroll-monthly/bulk/status", data));

export const syncAttendanceNow = (month) =>
  handleApi(() => api.post('/api/attendance/sync-now', { month }));

//─────────────────────────────────────────── Dashboard───────────────────────────────────────────
export const fetchDashboardSummary = async () =>
  handleApi(() => api.get("/api/dashboard/summary"));
export const fetchDepartmentAttendance = (month) =>
  handleApi(() => api.get("/api/attendance/department-wise", { params: { month } }));


export const fetchSalesDashboard = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard", { params }));

export const fetchSalesDashboardFilters = () =>
  handleApi(() => api.get("/api/sales-dashboard/filters"));
export const fetchAgentPerformance = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/agent-performance", { params }));

export const fetchAgentTrend = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/agent-trend", { params }));
export const fetchAgentCustomers = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/agent-customers", { params }));
export const fetchOrderDashboard = (params = {}) =>
  handleApi(() => api.get("/api/order-dashboard", { params }));

export const fetchOrderDashboardFilters = () =>
  handleApi(() => api.get("/api/order-dashboard/filters"));

export const fetchOrderDashboardHistory = () =>
  handleApi(() => api.get("/api/order-dashboard/history"));
export const fetchSalesSummary = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/summary", { params }));

export const fetchSalesTrend = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/trend", { params }));

export const fetchSalesKpis = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/kpis", { params }));

export const fetchLeadTime = (params = {}) =>
  handleApi(() => api.get("/api/order-dashboard/lead-time", { params }));
export const fetchReturnsAnalysis = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/returns", { params }));
export const fetchFreeQty = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/free-qty", { params }));
export const fetchDispatchStatus = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/dispatch-status", { params }));
export const fetchInvoiceAging = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/invoice-aging", { params }));
export const fetchReorderDue = (params = {}) =>
  handleApi(() => api.get("/api/sales-dashboard/reorder-due", { params }));

// ─────────────────────────────────────────── Setting ───────────────────────────────────────────
export const getApplSettings = (applName) =>
  handleApi(() => api.get(`/api/settings/${applName}`));

export const saveApplSettings = (applName, values) =>
  handleApi(() => api.post(`/api/settings/${applName}`, values));




export const fetchCompanyMenuVisibility = (com_id) =>
  api.get(`/api/company-menu-visibility/${com_id}`).then((res) => res.data);

export const saveCompanyMenuVisibility = ({ com_id, visibility }) =>
  api
    .post("/api/company-menu-visibility/save", { com_id, visibility })
    .then((res) => res.data);

// ── Recruitment Prefix Setting API ──
export {
  fetchRecruitmentPrefixes,
  getRecruitmentPrefixById,
  createRecruitmentPrefix,
  updateRecruitmentPrefix,
  deleteRecruitmentPrefix,
} from "./recruitmentApi";
export const fetchUserShortcuts = async () => {
  try {
    const response = await api.get("/api/user/shortcuts");
    const payload = response.data?.data ?? response.data;
    const overrides = payload?.overrides;
    return overrides && typeof overrides === "object" && !Array.isArray(overrides)
      ? overrides
      : {};
  } catch (error) {
    console.error(
      "Error fetching shortcuts:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
 
export const saveUserShortcuts = async (overrides) => {
  try {
    const response = await api.put("/api/user/shortcuts", { overrides });
    return response.data;
  } catch (error) {
    console.error(
      "Error saving shortcuts:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
 
export const fetchNavShortcuts = async () => {
  const res = await api.get("/api/nav-shortcuts");
  const list = res.data?.data?.entries;
  return Array.isArray(list) ? list : [];
};

// PUT /api/nav-shortcuts <- full list of entries
export const saveNavShortcuts = async (entries) => {
  const res = await api.put("/api/nav-shortcuts", { entries });
  const list = res.data?.data?.entries;
  return Array.isArray(list) ? list : [];
};

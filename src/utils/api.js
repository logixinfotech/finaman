import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import { handleApi } from "./apiHandler";
import { transformToBackend } from "./employeeMapper";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();

      await Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "You have been logged in from another device.",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#3085d6",
      });

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);


export const authenticateUser = async ({
  com_code,
  user_id,
  user_pass,
  forceLogin = false,
}) => {
  try {
    const response = await api.post("/api/authenticate", {
      com_code,
      user_id,
      user_pass,
      forceLogin,
    });

    const data = response.data;

    if (data.alreadyLoggedIn) {
      const result = await Swal.fire({
        title: "User Already Logged In",
        text: data.message,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Login",
        cancelButtonText: "No",
        confirmButtonColor: "#3085d6",
      });

      if (result.isConfirmed) {
        return await authenticateUser({
          com_code,
          user_id,
          user_pass,
          forceLogin: true,
        });
      } else {
        return { success: false, cancelled: true };
      }
    }

    return data;
  } catch (error) {
    console.error(
      "Auth Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/api/authenticate/logout");
  } catch (error) {
    console.error("Logout API error:", error.message);
  } finally {
    sessionStorage.clear();
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

export const fetchUsers = () =>
  handleApi(() => api.get("/api/user/users"));
export const createUser = (data) =>
  handleApi(() => api.post("/api/user/add-user", data));

export const updateUser = (id, data) =>
  handleApi(() => api.put(`/api/user/update-user/${id}`, data));

export const deleteUser = (id) =>
  handleApi(() => api.delete(`/api/user/delete-user/${id}`));
export const updateUserAuth = (id) =>
  handleApi(() => api.delete(`//api/user/permissions/${id}`));

//------------------------------------Holiday Master --------------------------------------------------------

export const fetchHolidays = async () => {
  try {
    const res = await api.get("/api/holiday");
    const rawData = res.data.success ? res.data.data : [];

    return rawData.map((item) => ({
      id: item.H_id,          // Database H_id -> Frontend id
      date: item.H_date ? item.H_date.split("T")[0] : "",
      purpose: item.Purpose,
      remarks: item.Remarks,
      offcode: item.Offcode,
    }));
  } catch (error) {
    console.error("Fetch Error:", error);
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
        ...params.filters // Spreads company_name, city, etc. directly into params
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
      companyData,

    );

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

export const saveUserPermissions = (payload) =>
  handleApi(() => api.post("/api/user/permissions", payload));

export const fetchUserPermissions = async (userma_id) => {
  const response = await api.get(
    `/api/user/permissions/${userma_id}`
  );
  return response.data;
};
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


//------------------------------------Employee Master --------------------------------------------------------

export const saveEmployee = (data) =>
  handleApi(() => api.post("/api/employee/employee", data));

export const getActledList = () =>
  handleApi(() => api.get("/api/employee/actled"));

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

// ──────────────────────────────────────────────────HIFT MASTER ENDPOINTS ─────────────────────────────────── 

 export const fetchShifts = () =>
  handleApi(() => api.get("/api/shiftmaster"));  

 export const createShift = (data) =>
  handleApi(() => api.post("/api/shiftmaster", data));  

 export const updateShift = (id, data) =>
  handleApi(() => api.put(`/api/shiftmaster/${id}`, data));  

 export const deleteShift = (id) =>
  handleApi(() => api.delete(`/api/shiftmaster/${id}`));  

 // ─────────────────────────────────────────── VER TIME ENTRY ───────────────────────────────────── 

 export const fetchOTRules = () =>
  handleApi(() => api.get("/api/overtime-entry"));

export const createOTRule = (data) =>
  handleApi(() => api.post("/api/overtime-entry", data));

export const updateOTRule = (id, data) =>
  handleApi(() => api.put(`/api/overtime-entry/${id}`, data));

export const deleteOTRule = (id) =>
  handleApi(() => api.delete(`/api/overtime-entry/${id}`));

// ───────────────────────────────────────────── HIFT ALLOCATION ENDPOINTS ────────────────────────────────────── 

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


// ────────────────────────────────────── EAVE TYPES ──────────────────────────────────────────────────
 
export const getLeaveTypes = () => 
  handleApi(() => api.get("/api/leavetypes"));

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

// ───────────────────────────────────────── EAVE Request ──────────────────────────────────────────────────

export const getLeaveRequests     = ()         =>
  handleApi(() => api.get("/api/leaverequest"));

export const createLeaveRequest   = (data)     =>
  handleApi(() => api.post("/api/leaverequest", data));

export const updateLeaveRequest = (id, data) =>
  handleApi(() => api.put(`/api/leaverequest/${id}`, data));

export const deleteLeaveRequest   = (id)       =>
  handleApi(() => api.delete(`/api/leaverequest/${id}`));

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

// ───────────────────────────────────────── SALARY TEMPLATE  ────────────────────────────

export const fetchSalaryTemplates = () =>
  handleApi(() => api.get("/api/salary-master/salary-templates"));

export const fetchActiveIncomeHeads = () =>
  handleApi(() => api.get("/api/salary-master/income-heads?status=Active"));

export const fetchActiveDeductionHeads = () =>
  handleApi(() => api.get("/api/salary-master/deduction-heads?status=Active"));
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
export const getApprovalWorkflow    = ()         => 
  handleApi(() => api.get("/api/Approvalflow"));

export const createApprovalWorkflow = (data)     => 
  handleApi(() => api.post("/api/Approvalflow", data));

export const updateApprovalWorkflow = (id, data) =>
   handleApi(() => api.put(`/api/Approvalflow/${id}`, data));

export const deleteApprovalWorkflow = (id)       => 
  handleApi(() => api.delete(`/api/Approvalflow/${id}`));


// ────────────────────────────────────────── Approval Transaction ──────────────────────────────────────────────────

export const getPendingRequests = (approverId) =>
  handleApi(() => api.get(`/api/ApprovalTransaction/pending/${approverId}`));

export const approvalAction = (data) =>
  handleApi(() => api.post("/api/ApprovalTransaction/action", data));

export const getApprovalTransactions   = ()          =>
  handleApi(() => api.get("/api/ApprovalTransaction"));

export const getTransactionsByRequest  = (requestId) =>
  handleApi(() => api.get(`/api/ApprovalTransaction/by-request/${requestId}`));

export const createApprovalTransaction = (data)      =>
  handleApi(() => api.post("/api/ApprovalTransaction", data));

export const updateApprovalTransaction = (id, data)  =>
  handleApi(() => api.put(`/api/ApprovalTransaction/${id}`, data));

export const deleteApprovalTransaction = (id)        =>
  handleApi(() => api.delete(`/api/ApprovalTransaction/${id}`));

// ──────────────────────────────────────── Leave Accrual & Carry Forward ────────────────────────────────────────
export const getLeaveAccruals               = ()              =>
  handleApi(() => api.get("/api/LeaveAccrual"));

export const createLeaveAccrual             = (data)         =>
  handleApi(() => api.post("/api/LeaveAccrual", data));

export const updateLeaveAccrual             = (id, data)     =>
  handleApi(() => api.put(`/api/LeaveAccrual/${id}`, data));

export const deleteLeaveAccrual             = (id)           =>
  handleApi(() => api.delete(`/api/LeaveAccrual/${id}`));

// ────────────────────────────────────────── Leave Encashment ──────────────────────────────────────────────────────
export const getLeaveEncashments            = ()              =>
  handleApi(() => api.get("/api/LeaveEncashment"));

export const createLeaveEncashment          = (data)         =>
  handleApi(() => api.post("/api/LeaveEncashment", data));

export const updateLeaveEncashment          = (id, data)     =>
  handleApi(() => api.put(`/api/LeaveEncashment/${id}`, data));

export const deleteLeaveEncashment          = (id)           =>
  handleApi(() => api.delete(`/api/LeaveEncashment/${id}`));


// ── PF ────────────────────────────────────────────────────
export const fetchPFList    = ()         => handleApi(() => api.get("/api/statutory-master/?type=PF"));
export const createPF       = (data)     => handleApi(() => api.post("/api/statutory-master/", data));
export const updatePF       = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deletePF       = (id)       => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ── ESI ───────────────────────────────────────────────────
export const fetchESIList   = ()         => handleApi(() => api.get("/api/statutory-master/?type=ESI"));
export const createESI      = (data)     => handleApi(() => api.post("/api/statutory-master/", data));
export const updateESI      = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deleteESI      = (id)       => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ── PT ────────────────────────────────────────────────────
export const fetchPTList    = ()         => handleApi(() => api.get("/api/statutory-master/?type=PT"));
export const createPT       = (data)     => handleApi(() => api.post("/api/statutory-master/", data));
export const updatePT       = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deletePT       = (id)       => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ── LWF ───────────────────────────────────────────────────
export const fetchLWFList   = ()         => handleApi(() => api.get("/api/statutory-master/?type=LWF"));
export const createLWF      = (data)     => handleApi(() => api.post("/api/statutory-master/", data));
export const updateLWF      = (id, data) => handleApi(() => api.put(`/api/statutory-master/${id}`, data));
export const deleteLWF      = (id)       => handleApi(() => api.delete(`/api/statutory-master/${id}`));

// ── TDS ───────────────────────────────────────────────────
export const fetchTDSList   = ()         => handleApi(() => api.get("/api/statutory-master/tds"));
export const createTDS      = (data)     => handleApi(() => api.post("/api/statutory-master/tds", data));
export const updateTDS      = (id, data) => handleApi(() => api.put(`/api/statutory-master/tds/${id}`, data));
export const deleteTDS      = (id)       => handleApi(() => api.delete(`/api/statutory-master/tds/${id}`));
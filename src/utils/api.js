import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import { handleApi } from "./apiHandler";

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
// User Group APIs
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
// ================= PAYROLL ATTENDANCE =================

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

// ---------------------------------------- SHIFT MASTER ENDPOINTS ----------------------------------------------

 export const fetchShifts = () =>
  handleApi(() => api.get("/api/shiftmaster"));  

 export const createShift = (data) =>
  handleApi(() => api.post("/api/shiftmaster", data));  

 export const updateShift = (id, data) =>
  handleApi(() => api.put(`/api/shiftmaster/${id}`, data));  

 export const deleteShift = (id) =>
  handleApi(() => api.delete(`/api/shiftmaster/${id}`));  

 // ---------------------------------------- OVER TIME ENTRY ----------------------------------------------

 export const fetchOTRules = () =>
  handleApi(() => api.get("/api/overtime-entry"));

export const createOTRule = (data) =>
  handleApi(() => api.post("/api/overtime-entry", data));

export const updateOTRule = (id, data) =>
  handleApi(() => api.put(`/api/overtime-entry/${id}`, data));

export const deleteOTRule = (id) =>
  handleApi(() => api.delete(`/api/overtime-entry/${id}`));

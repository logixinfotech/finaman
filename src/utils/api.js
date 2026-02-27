import axios from 'axios';
import config from '../config';

// Create an Axios instance
const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
 
export const authenticateUser = async ({ com_code, user_id, user_pass }) => {
  try {
    const response = await api.post("/api/authenticate", {
      com_code,
      user_id,
      user_pass,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error during authentication:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
export const fetchUserProfile = async () => {
  try {
    const token = sessionStorage.getItem("token");

    const response = await api.get("/api/profile", {
      headers: {
        Authorization: token,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}; 
export const fetchSidebarMenu = async (token) => {
    
    try {
        console.log('Fetching sidebar menu with token:', token);
        const response = await api.get('/api/masmod', {
            headers: {
                Authorization: sessionStorage.getItem("token"), // No Bearer token here
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching sidebar menu:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Fetching masmnu data (additional function for other parts of the app)
export const fetchMasmnuData = async (token) => {
    try {
        console.log('Fetching masmnu data with token:', token);
        const response = await api.get('/api/masmnu', {
            headers: {
                Authorization: token,  
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching masmnu data:', error.response ? error.response.data : error.message);
        throw error;
    }
}; 
export const getCompanyList = async () => {
    try {
        const response = await api.get('/api/companymaster', {
            headers: {
                Authorization: sessionStorage.getItem('token'), // No Bearer token here
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching company list:', error.response ? error.response.data : error.message);
        throw error;
    }
};
 
export const createCompany = async (companyData) => {
    try {
        const response = await api.post('/api/companymaster', companyData, {
            headers: {
                Authorization: sessionStorage.getItem('token'), // No Bearer token here
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating company:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Function to update company details
export const updateCompany = async (companyId, companyData) => {
    try {
        const response = await api.put(`/api/companymaster/${companyId}`, companyData, {
            headers: {
                Authorization: sessionStorage.getItem('token'), // No Bearer token here
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating company:', error.response ? error.response.data : error.message);
        throw error;
    }
};
 
export const deleteCompany = async (companyId) => {
    try {
        const response = await api.delete(`/api/companymaster/${companyId}`, {
            headers: {
                Authorization: sessionStorage.getItem('token'), // No Bearer token here
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting company:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const fetchMenuMasterList = async (filters = {}) => {
  const response = await api.get("/api/masmnu/list", {
    params: filters,
    headers: {
      Authorization: sessionStorage.getItem("token"),
    },
  });
  return response.data;
};
export const createMasmnu = async (data) => {
  const response = await api.post("/api/masmnu", data, {
    headers: {
      Authorization: sessionStorage.getItem("token"),
    },
  });
  return response.data;
};

export const updateMasmnu = async (id, data) => {
  const response = await api.put(`/api/masmnu/${id}`, data, {
    headers: {
      Authorization: sessionStorage.getItem("token"),
    },
  });
  return response.data;
};

export const deleteMasmnu = async (id) => {
  const response = await api.delete(`/api/masmnu/${id}`, {
    headers: {
      Authorization: sessionStorage.getItem("token"),
    },
  });
  return response.data;
}; 
export const createUser = async (userData) => {
  try {
    const response = await api.post("/api/user/add-user", userData, {
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error creating user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
export const updateUser = async (userData) => {
  try {
    const response = await api.post("/api/user/add-user", userData, {
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error creating user:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
export const fetchUsers = async () => {
  const response = await api.get("/api/user/users", {
    headers: {
      Authorization: sessionStorage.getItem("token"),
    },
  });

  return response.data.data; // IMPORTANT
};
export const saveUserPermissions = async (payload) => {
  const token = sessionStorage.getItem("token");

  return await api.post("/api/user/permissions", payload, {
    headers: { Authorization: token },
  });
};

export const fetchUserPermissions = async (userma_id) => {
  const token = sessionStorage.getItem("token");

  const response = await api.get(
    `/api/user/permissions/${userma_id}`,
    {
      headers: { Authorization: token },
    }
  );

  return response.data;
};


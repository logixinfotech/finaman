export const handleApi = async (apiCall) => {
  try {
    const res = await apiCall(); 
    return res.data; 
  } catch (error) {
    console.error("API ERROR:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Connection failed. Please try again.",
    };
  }
};
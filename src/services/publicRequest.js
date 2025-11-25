import axios from "axios";

const publicRequest = axios.create({
  baseURL: "https://njsapi-shubhtalk.epicon.in/api/",
  headers: {
    "Content-Type": "application/json",
    
  },
});

publicRequest.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("verifyOtpToken");
    const role = localStorage.getItem("shubhtalk_role");
const token =
  role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");


    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export const get = async (endPoint, config = {}) => {
  return apiHandler(() => publicRequest.get(endPoint, config));
};

export const post = async (endPoint, data, config = {}) => {
  return apiHandler(() => publicRequest.post(endPoint, data, config));
};

export const put = async (endPoint, id, data, config = {}) => {
  return apiHandler(() => publicRequest.put(`${endPoint}/${id}`, data, config));
};

export const deleteRequest = async (endPoint, id, config = {}) => {
  return apiHandler(() => publicRequest.delete(`${endPoint}/${id}`, config));
};

const apiHandler = async (apiCall) => {
  try {
    const response = await apiCall();
    return {
      status: true,
      statusCode: response.status,
      data: response.data,
      message: response.data?.message || "Success!",
    };
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred. Please try again.";
    return {
      status: false,
      statusCode,
      data: null,
      message,
    };
  }
};

export default publicRequest;

import axios from "axios";
import { Toast } from "../component";
import { getToken } from "../utils/utlis";
import { navigateToLogin } from "../utils/navigationHelper";

let unAuthorizedCount = 0;
const privateRequest = axios.create({
  baseURL: "/main/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

privateRequest.interceptors.request.use(
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

const requestHandler = (request) => {
  const token = getToken() || "";
  const controller = new AbortController();
  if (!token) {
    controller.abort();
  }
  request.headers.Authorization = `Bearer ${token}`;
  return { ...request, signal: controller.signal };
};

const clearToken = () => {
  localStorage.removeItem("token");
};

const responseErrorHandler = (error) => {
  // Allow callers to suppress toast by passing { skipToast: true } in config
  if (error.config?.skipToast) {
    return Promise.reject(error);
  }

  if (error.response) {
    const { status, data, message } = error.response;
    
    // Helper to safely extract error message
    const getErrorMsg = (data, message) => {
      // Check for nested error object with message
      if (data?.error && typeof data.error === 'object' && data.error.message) {
        return String(data.error.message);
      }
      
      const msg = data?.message || data?.error || message || "Some Error Occurred";
      // Ensure it's a string
      if (typeof msg === 'string') return msg;
      if (typeof msg === 'object' && msg !== null) {
        if (msg.message) return String(msg.message);
        if (msg.error) return String(msg.error);
      }
      return "Some Error Occurred";
    };

    switch (status) {
      case 401:
        if (!unAuthorizedCount) {
          // Don't redirect guest users (no token means they're browsing without login)
          const role = localStorage.getItem("shubhtalk_role");
          const hasToken = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          if (!hasToken) break;

          unAuthorizedCount++;
          
          // Get current path for redirect after login
          const currentPath = window.location.pathname + window.location.search;
          
          // Use navigation helper (no page refresh)
          navigateToLogin(currentPath);
          
          setTimeout(() => {
            unAuthorizedCount = 0;
          }, 100);
        }
        break;
      case 400:
        // Check if it's an AI_ERROR or similar structured error
        if (data?.error?.code) {
          Toast.error(getErrorMsg(data, message));
        } else {
          Toast.error(getErrorMsg(data, message) || "Invalid Value/ Bad Request");
        }
        break;
      case 403:
        Toast.error(getErrorMsg(data, message) || "Access Denied/ Forbidden");
        break;
      case 404:
        Toast.error(getErrorMsg(data, message) || "Item doesn't exist");
        break;
      case 405:
        Toast.error(getErrorMsg(data, message) || "Invalid Request");
        break;
      case 422:
        Toast.error(getErrorMsg(data, message) || "Already Exists");
        break;
      case 500:
        // For 500 errors, check if there's a specific error message
        if (data?.error?.message) {
          Toast.error(getErrorMsg(data, message));
        }
        // If no specific message, don't show toast - let service handle it
        break;
      case 504:
        Toast.error(getErrorMsg(data, message) || "Network Error");
        break;
      default:
        // Check if there's a structured error with code
        if (data?.error?.code) {
          Toast.error(getErrorMsg(data, message));
        } else {
          Toast.error(getErrorMsg(data, message));
        }
        break;
    }
  } else if (error?.code === "ERR_CANCELED") {
    return Promise.reject(error);
  } else {
    Toast.error(String(error?.message || "Some Error Occurred"));
  }
  return Promise.reject(error);
};

const errorHandler = (error) => {
  return Promise.reject(error);
};

privateRequest.interceptors.request.use(requestHandler, errorHandler);

privateRequest.interceptors.response.use(
  (response) => response,
  responseErrorHandler
);

export const privateGet = (endPoint, config = {}) => {
  return privateRequest.get(`${endPoint}`, config);
};

export const privatePost = (endPoint, data, config = {}) => {
  return privateRequest.post(endPoint, data, config);
};

export const privatePut = (endPoint, id, data, config = {}) => {
  const url = id ? `${endPoint}/${id}` : endPoint;
  return privateRequest.put(url, data, config);
};

export const privatePatch = (endPoint, id, data, config = {}) => {
  const url = id ? `${endPoint}/${id}` : endPoint;
  return privateRequest.patch(url, data, config);
};

export const privateDelete = (endPoint, id, config = {}) => {
  return privateRequest.delete(`${endPoint}${id ? `/${id}` : ""}`, config);
};

export default privateRequest;

import axios from "axios";
import { Toast } from "../component";
import { getToken } from "../utils/utlis";

let unAuthorizedCount = 0;

const privateRequest = axios.create({
  baseURL: "akdsjfsldf",
});

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
  if (error.response) {
    const { status, data, message } = error.response;

    switch (status) {
      case 401:
        if (!unAuthorizedCount) {
          unAuthorizedCount++;
          clearToken();
          Toast.error("Session expired, please login again!");
          setTimeout(() => {
            unAuthorizedCount = 0;
            window.location.href = "/";
          }, 300);
        }
        break;
      case 400:
        Toast.error(
          data.message || data?.error || message || "Invalid Value/ Bad Request"
        );
        break;
      case 403:
        Toast.error(
          data.message || data?.error || message || "Access Denied/ Forbidden"
        );
        break;
      case 404:
        Toast.error(
          data.message || data?.error || message || "Item doesn't exist"
        );
        break;
      case 405:
        Toast.error(
          data.message || data?.error || message || "Invalid Request"
        );
        break;
      case 422:
        Toast.error(data.message || data?.error || message || "Already Exists");
        break;
      case 504:
        Toast.error(data.message || data?.error || message || "Network Error");
        break;
      default:
        Toast.error(
          data.message || data?.error || message || "Some Error Occurred"
        );
        break;
    }
  } else if (error?.code === "ERR_CANCELED") {
    return Promise.reject(error);
  } else {
    Toast.error(error?.message || "Some Error Occurred");
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

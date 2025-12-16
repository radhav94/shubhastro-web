import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { getToken } from "../utils/utlis";
import { Toast } from "../../component";
import { getToken } from "../../utils/utlis";

let unAuthorizedCount = 0;
const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

// ERROR HANDLER
const handleApiError = (error) => {
  const status = error?.status;
  const data = error?.data;
  const message = data?.message || data?.error || "Some Error Occurred";

  switch (status) {
    case 401:
      if (!unAuthorizedCount) {
        unAuthorizedCount++;

        const role = localStorage.getItem("shubhtalk_role");

        // 🔹 Clear tokens correctly based on role
        if (role === "ASTROLOGER") {
          localStorage.removeItem("shubhtalk_astro_token");
          localStorage.removeItem("shubhtalk_astro_id");
        }

        if (role === "CUSTOMER") {
          localStorage.removeItem("shubhtalk_customer_token");
          localStorage.removeItem("shubhtalk_customer_id");
          localStorage.removeItem("shubhtalk_customer_wallet");
        }

        // 🔹 Clear role (very important)
        localStorage.removeItem("shubhtalk_role");

        Toast.error(message);

        setTimeout(() => {
          unAuthorizedCount = 0;
          window.location.href = "/login";
        }, 300);
      }
      break;

    case 400:
      Toast.error(message || "Invalid Value / Bad Request");
      break;
    case 403:
      Toast.error(message || "Access Denied / Forbidden");
      break;
    case 401:
      Toast.error(message || "Access Denied / Forbidden");
      break;
    case 404:
      Toast.error(message || "Item doesn't exist");
      break;
    case 405:
      Toast.error(message || "Invalid Request");
      break;
    case 422:
      Toast.error(message || "Already Exists");
      break;
    case 504:
      Toast.error("Network Error");
      break;
    default:
      Toast.error(message);
  }
};

// BASE API (NO ENDPOINTS HERE)
export const privateRequestNew = createApi({
  reducerPath: "privateRequestNew",

  baseQuery: async (args, api, extraOptions) => {
    const rawBaseQuery = fetchBaseQuery({
      baseUrl: `${BASE_URL}/api/`,
      prepareHeaders: (headers) => {
        const role = localStorage.getItem("shubhtalk_role");
        const token =
          role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

        headers.set("Content-Type", "application/json");

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
      },
    });

    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
      handleApiError(result.error);
    }

    return result;
  },
  tagTypes: ["Kundlis"], //  Required

  endpoints: () => ({}), // EMPTY — endpoints later inject honge
});

export const localReuqqestApi = createApi({
  reducerPath: "localReuqqestApi",

  baseQuery: async (args, api, extraOptions) => {
    const rawBaseQuery = fetchBaseQuery({
      baseUrl: "http://192.168.12.114:3000/",
      prepareHeaders: (headers) => {
        const role = localStorage.getItem("shubhtalk_role");
        const token =
          role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

        headers.set("Content-Type", "application/json");

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
      },
    });

    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
      handleApiError(result.error);
    }

    return result;
  },
  tagTypes: ["Kundlis"], // ⭐ Required

  endpoints: () => ({}), // EMPTY — endpoints later inject honge
});

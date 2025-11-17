import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { getToken } from "../utils/utlis";
import { Toast } from "../../component";
import { getToken } from "../../utils/utlis";

let unAuthorizedCount = 0;

// ERROR HANDLER
const handleApiError = (error) => {
  const status = error?.status;
  const data = error?.data;
  const message = data?.message || data?.error || "Some Error Occurred";

  switch (status) {
    case 401:
      if (!unAuthorizedCount) {
        unAuthorizedCount++;
        localStorage.removeItem("token");
        localStorage.removeItem("verifyOtpToken");
        Toast.error("Session expired, please login again!");
        setTimeout(() => {
          unAuthorizedCount = 0;
          window.location.href = "/";
        }, 300);
      }
      break;
    case 400:
      Toast.error(message || "Invalid Value / Bad Request");
      break;
    case 403:
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
      baseUrl: "https://njsapi-shubhtalk.epicon.in/api/",
      prepareHeaders: (headers) => {
        const token = localStorage.getItem("verifyOtpToken");
        // console.log("tokeennnnnn", token);

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

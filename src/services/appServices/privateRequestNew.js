import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Toast from "../../component/toast";
import { getToken } from "../../utils/utlis";
import { refreshTokenAndReload } from "../../utils/tokenRefresh";

let unAuthorizedCount = 0;
const BASE_URL = "/main";

// Endpoints that should be accessible without authentication (no login redirect on 401)
const PUBLIC_ENDPOINTS = ["getAstrologerById", "getAstrologers", "getRecommendedAstrologers"];

// Endpoints that should not show toast errors (silent failures)
const SILENT_ENDPOINTS = ["getStaticPageBySlug"];

// ERROR HANDLER
const handleApiError = (error, endpoint) => {
  // Skip toast for silent endpoints
  if (SILENT_ENDPOINTS.includes(endpoint)) return;

  const status = error?.status;
  const data = error?.data;
  const message = data?.message || data?.error || "Some Error Occurred";

  // fetchBaseQuery reports a non-numeric status (e.g. "PARSING_ERROR") when the
  // response body isn't valid JSON, keeping the real HTTP code in originalStatus.
  // Normalize so 401 is detected regardless of the response body format.
  const httpStatus = typeof status === "number" ? status : error?.originalStatus;

  switch (httpStatus) {
    case 401:
      // Skip refresh for public-facing endpoints
      if (PUBLIC_ENDPOINTS.includes(endpoint)) break;
      // Only attempt refresh if user was previously authenticated (token expired/invalid).
      // Don't touch guest users who never had a token.
      const role = localStorage.getItem("shubhtalk_role");
      const hasToken = role === "ASTROLOGER"
        ? localStorage.getItem("shubhtalk_astro_token")
        : localStorage.getItem("shubhtalk_customer_token");
      if (!hasToken) break;
      if (!unAuthorizedCount) {
        unAuthorizedCount++;

        // Token expired/invalid — try to refresh it and reload the page.
        // Falls back to login if the refresh fails (handled inside helper).
        refreshTokenAndReload();

        setTimeout(() => {
          unAuthorizedCount = 0;
        }, 100);
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
      baseUrl: `${BASE_URL}/api/`,
      prepareHeaders: (headers, { endpoint }) => {
        const role = localStorage.getItem("shubhtalk_role");
        let token = null;

        if (role === "ASTROLOGER") {
          token = localStorage.getItem("shubhtalk_astro_token");
        } else if (role === "CUSTOMER") {
          token = localStorage.getItem("shubhtalk_customer_token");
        }

        // ✅ Only set text/plain if not already set by endpoint
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "text/plain");
        }

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
      },
    });

    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error) {
      handleApiError(result.error, api.endpoint);
    }

    return result;
  },
  tagTypes: ["Kundlis", "VirtualAssistant", "Following", "FollowedAstrologers", "JoinedSpaces", "CommunitySpaces", "CommunityLibrary", "CommunitySpaceDetail", "AiHistory"],

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

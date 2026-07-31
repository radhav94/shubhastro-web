import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../utils/security/secureBaseQuery";
import Toast from "../../component/toast";
import { getToken } from "../../utils/utlis";
import { refreshTokenAndReload } from "../../utils/tokenRefresh";
import { navigateToLogin } from "../../utils/navigationHelper";
import { BACKEND_PROXY } from "../../utils/apiConfig";

let unAuthorizedCount = 0;
const BASE_URL = BACKEND_PROXY;

// Endpoints whose error toasts are temporarily silenced at runtime. Used by
// flows that handle certain failures themselves (e.g. the guest login/kundli
// flow, where an existing user's kundli-create can fail harmlessly and is
// recovered by falling back to their existing kundlis).
const toastSilencedEndpoints = new Set();

/**
 * Silence (or restore) the global error toast for a specific RTK Query endpoint.
 * @param {string} endpoint - endpoint name (e.g. "createKundli")
 * @param {boolean} silenced
 */
export const setApiErrorToastSilenced = (endpoint, silenced) => {
  if (silenced) toastSilencedEndpoints.add(endpoint);
  else toastSilencedEndpoints.delete(endpoint);
};

// Endpoints that should be accessible without authentication (no login redirect on 401)
const PUBLIC_ENDPOINTS = ["getAstrologerById", "getAstrologers", "getRecommendedAstrologers"];

// Endpoints that should not show toast errors (silent failures)
// getKundliById: a missing/deleted shared kundli returns 404; the Kundli view
// handles that inline ("Kundli not available"), so suppress the generic toast.
const SILENT_ENDPOINTS = ["getStaticPageBySlug", "getKundliById"];

// ERROR HANDLER
const handleApiError = (error, endpoint) => {
  // Skip toast for silent endpoints
  if (SILENT_ENDPOINTS.includes(endpoint)) return;

  const status = error?.status;
  const data = error?.data;

  // Subscription entitlement blocks are handled by the UI (it opens the plans /
  // extended-plan popup), so don't surface them as generic error toasts.
  const entitlementReason = data?.error?.code || data?.data?.reason || data?.reason;
  const SILENT_ENTITLEMENT_REASONS = [
    "PREMIUM_REQUIRED",
    "EXTENDED_PLAN_REQUIRED",
    "EXTENDED_PLAN_EXHAUSTED",
    // Handled by the UI: it shows a recharge toast and redirects to /recharge.
    "INSUFFICIENT_WALLET_BALANCE",
  ];
  if (entitlementReason && SILENT_ENTITLEMENT_REASONS.includes(entitlementReason)) return;
  // Real message from the server, if any. Used to avoid showing the unhelpful
  // generic "Some Error Occurred" toast when the backend/network gave nothing.
  const serverMessage = data?.message || data?.error;
  const message = serverMessage || "Some Error Occurred";

  // fetchBaseQuery reports a non-numeric status (e.g. "PARSING_ERROR") when the
  // response body isn't valid JSON, keeping the real HTTP code in originalStatus.
  // Normalize so 401 is detected regardless of the response body format.
  const httpStatus = typeof status === "number" ? status : error?.originalStatus;

  switch (httpStatus) {
    case 401: {
      // Skip refresh for public-facing endpoints
      if (PUBLIC_ENDPOINTS.includes(endpoint)) {
        console.warn("[401] skipped — public endpoint:", endpoint);
        break;
      }
      // Handle a single 401 per tick (multiple queries can fail together).
      if (unAuthorizedCount) {
        console.warn("[401] already handling — skipping:", endpoint);
        break;
      }
      unAuthorizedCount++;
      setTimeout(() => {
        unAuthorizedCount = 0;
      }, 100);

      const refreshToken = localStorage.getItem("refreshToken");
      const currentPath = window.location.pathname + window.location.search;

      if (refreshToken) {
        // Try to refresh the session and reload. If the refresh fails, the
        // helper opens the login screen.
        console.warn("[401] calling refreshTokenAndReload()");
        refreshTokenAndReload();
      } else {
        // No refresh token — session is gone (e.g. logged out in another tab).
        // Open the login screen.
        console.warn("[401] no refresh token — opening login screen");
        navigateToLogin(currentPath);
      }
      break;
    }

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
      // Only surface a toast when the server actually sent a message.
      // Suppress the generic "Some Error Occurred" fallback.
      if (serverMessage) Toast.error(serverMessage);
  }
};

// BASE API (NO ENDPOINTS HERE)
export const privateRequestNew = createApi({
  reducerPath: "privateRequestNew",

  baseQuery: async (args, api, extraOptions) => {
    const rawBaseQuery = createSecureBaseQuery({
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

    if (result.error && !toastSilencedEndpoints.has(api.endpoint)) {
      handleApiError(result.error, api.endpoint);
    }

    return result;
  },
  tagTypes: ["Kundlis", "VirtualAssistant", "Following", "FollowedAstrologers", "JoinedSpaces", "CommunitySpaces", "CommunityLibrary", "CommunitySpaceDetail", "AiHistory", "SubscriptionStatus"],

  endpoints: () => ({}), // EMPTY — endpoints later inject honge
});

export const localReuqqestApi = createApi({
  reducerPath: "localReuqqestApi",

  baseQuery: async (args, api, extraOptions) => {
    const rawBaseQuery = createSecureBaseQuery({
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

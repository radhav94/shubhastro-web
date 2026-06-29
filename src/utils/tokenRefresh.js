// Shared token-refresh helper used by API layers when a request returns 401.
//
// Behavior: on a 401 for an authenticated user, call the refresh-token API to
// obtain a fresh access token, persist it, and reload the page so the app
// re-fetches data with the new token. A loop-guard prevents repeated
// refresh/reload cycles when the refresh itself keeps failing.
import axios from "axios";
import { navigateToLogin } from "./navigationHelper";

const REFRESH_URL = "/main/api/users/refreshToken";

// sessionStorage key tracking the last refresh attempt (survives page reload
// within the same tab session). Used to break refresh/reload loops.
const LAST_REFRESH_TS_KEY = "shubhtalk_last_token_refresh";

// If we already attempted a refresh within this window and still got a 401,
// treat the session as truly expired and send the user to login instead of
// reloading again.
const REFRESH_LOOP_WINDOW_MS = 15000;

// Single-flight: ensures concurrent 401s trigger only one refresh request.
let refreshPromise = null;

const getCurrentRole = () => localStorage.getItem("shubhtalk_role");

const persistNewTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    const role = getCurrentRole();
    if (role === "ASTROLOGER") {
      localStorage.setItem("shubhtalk_astro_token", accessToken);
    } else {
      localStorage.setItem("shubhtalk_customer_token", accessToken);
    }
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
};

const redirectToLogin = () => {
  const currentPath = window.location.pathname + window.location.search;
  navigateToLogin(currentPath);
};

/**
 * Attempt to refresh the access token and reload the page.
 *
 * - De-duplicates concurrent invocations (single-flight).
 * - Guards against refresh/reload loops via a timestamp in sessionStorage.
 * - Falls back to the login flow if the refresh request fails.
 *
 * @returns {Promise<void>}
 */
export const refreshTokenAndReload = () => {
  // If a refresh was just attempted (e.g. before the previous reload) and we
  // are getting 401s again, the session can't be recovered — go to login.
  const lastRefresh = Number(sessionStorage.getItem(LAST_REFRESH_TS_KEY) || 0);
  if (lastRefresh && Date.now() - lastRefresh < REFRESH_LOOP_WINDOW_MS) {
    sessionStorage.removeItem(LAST_REFRESH_TS_KEY);
    redirectToLogin();
    return Promise.resolve();
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // The refresh-token endpoint reads the refresh token from the httpOnly
      // cookie set at login (matching the documented call: empty body, no
      // Authorization header). withCredentials ensures that cookie is sent.
      const response = await axios.post(
        REFRESH_URL,
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const payload = response?.data?.data || response?.data || {};
      const newAccessToken = payload.accessToken || payload.token;
      const newRefreshToken = payload.refreshToken;

      if (!newAccessToken) {
        // Backend did not return a usable token — treat as expired session.
        redirectToLogin();
        return;
      }

      persistNewTokens(newAccessToken, newRefreshToken);

      // Mark the attempt so a subsequent immediate 401 won't loop.
      sessionStorage.setItem(LAST_REFRESH_TS_KEY, String(Date.now()));

      window.location.reload();
    } catch {
      // Refresh failed — session is no longer valid.
      redirectToLogin();
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

import { loginSuccess, setEmail } from "../../redux/auth/authSlice";
import { privateRequestNew } from "../../services/appServices/privateRequestNew";
import { clearSelectedKundli } from "../../redux/kundli/kundliSlice";
import { clearGuestKundliProfiles } from "../helper/cookies";

/**
 * Persist a successful CUSTOMER login.
 *
 * This mirrors, key for key, what `OTPScreen.handleContinue` does after
 * `verifyOtp` succeeds — tokens, user snapshot, cache/guest cleanup, redux, and
 * the device-limit handoff. It exists so alternative login methods (Truecaller
 * mobile web, and any future SSO) end up with the exact same session state
 * instead of a near-copy that drifts.
 *
 * It deliberately does NOT navigate: callers decide where to go, because the
 * onboarding wizard advances a step for new users while standalone screens push
 * a route.
 *
 * @param {object} userData - the `data` object from the login response. Must
 *   carry accessToken/refreshToken/_id (same shape as verifyOtp returns).
 * @param {Function} dispatch - redux dispatch
 * @returns {{ isRegistered: boolean, deviceLimitReached: boolean }} so the
 *   caller can branch on navigation without re-reading storage.
 */
export const completeCustomerLogin = (userData, dispatch) => {
  const accessToken = userData?.accessToken;
  const refreshToken = userData?.refreshToken;

  // Role must be set before the tokens: the axios interceptors pick the token
  // to attach based on `shubhtalk_role`, so a request firing in between would
  // otherwise read the astrologer key.
  localStorage.setItem("shubhtalk_role", "CUSTOMER");

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("shubhtalk_customer_token", accessToken);
  localStorage.setItem("shubhtalk_customer_id", userData._id);
  localStorage.setItem("userData", JSON.stringify(userData));

  // Snapshot in the shape `getUserFromStorage()` expects.
  localStorage.setItem(
    "shubhtalk_user",
    JSON.stringify({
      id: userData._id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      place: userData.place,
      role: userData.role,
      languagePreferences: userData.languagePreferences || [],
      accessToken,
      refreshToken,
      email: userData.email || "",
    })
  );

  // Drop the previous session's cached queries and any guest-only selections,
  // otherwise the new user briefly sees the last user's kundli/profile data.
  dispatch(privateRequestNew.util.resetApiState());
  dispatch(clearSelectedKundli());
  localStorage.removeItem("selectedKundliProfile");
  clearGuestKundliProfiles();

  dispatch(
    loginSuccess({
      isRegister: userData?.isRegister,
      isVerified: userData?.isVerified,
      token: accessToken,
    })
  );

  if (userData?.email) dispatch(setEmail(userData.email));

  // Device limit: stored in sessionStorage for an immediate popup and in
  // localStorage so it survives a refresh. DeviceLimitModal reads these.
  const deviceLimitReached = !!(userData.max_device_reached && userData.activeDevices?.length);
  if (deviceLimitReached) {
    const deviceData = JSON.stringify(userData.activeDevices);
    sessionStorage.setItem("shubhtalk_device_limit_reached", deviceData);
    localStorage.setItem("shubhtalk_device_limit_reached", deviceData);
  } else {
    localStorage.removeItem("shubhtalk_device_limit_reached");
    sessionStorage.removeItem("shubhtalk_device_limit_reached");
  }

  return {
    isRegistered: !!userData.isRegister,
    deviceLimitReached: !!userData.max_device_reached,
  };
};

/**
 * Where an already-registered user should land after logging in.
 * Same precedence the OTP screen uses: post-device-logout target, then a saved
 * pre-login target, then the caller's fallback.
 */
export const resolvePostLoginRedirect = (fallback) => {
  const logoutRedirect = sessionStorage.getItem("shubhtalk_redirect_after_logout");
  if (logoutRedirect && logoutRedirect !== "/login") {
    sessionStorage.removeItem("shubhtalk_redirect_after_logout");
    return logoutRedirect;
  }

  const savedRedirect = localStorage.getItem("shubhtalk_redirect_after_login");
  if (savedRedirect && savedRedirect !== "/login") {
    localStorage.removeItem("shubhtalk_redirect_after_login");
    return savedRedirect;
  }

  return fallback;
};

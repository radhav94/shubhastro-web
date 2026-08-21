import publicRequest from "../publicRequest";

/**
 * Truecaller mobile-web login — backend contract.
 *
 * Truecaller posts the user's accessToken to OUR BACKEND (the callback URL
 * registered in the Truecaller developer portal), not to the browser. So the
 * browser's only job after opening the deep link is to ask the backend whether
 * that callback has arrived yet for our `requestId`.
 *
 * Both calls go through `publicRequest` so they use the secure gateway
 * (encryption + base URL) like every other auth call.
 *
 * ── Required backend endpoints ────────────────────────────────────────────────
 *
 * 1) POST /api/users/truecaller/session      (optional but recommended)
 *    Body: { requestId, type: "CUSTOMER", deviceType, deviceInfo, fcmTokens }
 *    Registers the pending request BEFORE the deep link opens, so the callback
 *    can be matched and the device/FCM details are attached to the session that
 *    the callback creates. Without it the backend must accept these fields on
 *    the status call instead.
 *
 * 2) GET /api/users/truecaller/status?requestId=...
 *    Returns one of:
 *      { success: true,  statusCode: 200, status: "pending" }
 *      { success: true,  statusCode: 200, status: "completed", data: <userData> }
 *      { success: false, status: "rejected" | "expired", message: "..." }
 *    where `data` is the SAME shape as the OTP flow's `verifyOtp` response data
 *    (must include accessToken, refreshToken, _id, isRegister, max_device_reached,
 *    activeDevices, ...) so the frontend can reuse the existing login handler.
 *
 * 3) The Truecaller callback endpoint itself (server-to-server, no frontend
 *    involvement). Truecaller POSTs:
 *      { requestId, accessToken, endpoint }            -> consent given
 *      { requestId, status: "flow_invoked" }           -> sheet opened (ack with 2xx)
 *      { requestId, status: "user_rejected" }          -> user dismissed
 *    On consent the backend must GET `${endpoint}` with `Authorization: Bearer
 *    ${accessToken}` to read the profile (phoneNumbers[0], name.first/last,
 *    onlineIdentities.email), then login/register and store the result against
 *    `requestId` for endpoint (2) to return.
 */

/** Register the pending Truecaller request before opening the deep link. */
export const createTruecallerSession = async (data) =>
  publicRequest.post("users/truecaller/session", data);

/** Poll whether Truecaller's callback has completed the login for this request. */
export const getTruecallerStatus = async (requestId, config = {}) =>
  publicRequest.get(`users/truecaller/status?requestId=${encodeURIComponent(requestId)}`, config);

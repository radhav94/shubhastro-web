import privateRequest from "../privateRequest";

/**
 * Resolve the user id expected by the Profile API
 * (e.g. GET /api/Profile/:id).
 *
 * Uses the customer's `_id`, persisted at login as `shubhtalk_customer_id`,
 * with fallbacks to the stored user objects.
 */
export const getProfileId = () => {
  // 1) Primary: `_id` saved at login.
  const customerId = localStorage.getItem("shubhtalk_customer_id");
  if (customerId) return customerId;

  // 2) Fallbacks: the persisted user objects.
  try {
    const user = JSON.parse(localStorage.getItem("shubhtalk_user") || "{}");
    if (user?.id) return user.id;
  } catch {
    /* ignore */
  }

  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (userData?._id) return userData._id;
  } catch {
    /* ignore */
  }

  return null;
};

/**
 * Fetch a customer's profile by id.
 * GET /api/Profile/:id  (proxied through /main/api/Profile/:id)
 *
 * Pass `{ skipToast: true }` to silence the global error toast for
 * background/status-check usage.
 */
export const getProfile = async (id, config = {}) => {
  return await privateRequest.get(`Profile/${id}`, config);
};

/**
 * Determine whether the user is already registered from the Profile API response.
 *
 * NOTE: The exact field name still needs to be confirmed against the live
 * response shape. Until then this checks the common variants and is easy to
 * pin down once we see the actual payload.
 */
export const extractIsRegistered = (profileResponse) => {
  const profile = profileResponse?.data?.data ?? profileResponse?.data ?? {};

  const value =
    profile.isRegister ??
    profile.isRegistered ??
    profile.is_registered ??
    profile.registered;

  return value === true || value === "true" || value === 1;
};

/**
 * Whether the user still has their free first session, per the Profile API.
 *
 * Deliberately TRI-state, and the null case is the important one:
 *
 *   true  -> eligible; show the free-session labels
 *   false -> already used it; show normal rates even while the offer is running
 *   null  -> the API did not send the field at all
 *
 * `null` is kept distinct from `false` so a caller can retry (a later profile
 * read may carry the field) rather than caching a "no" it never received. It
 * grants nothing on its own: only an explicit `true` shows the offer.
 *
 * Accepts either an axios response or an already-unwrapped RTK Query body.
 *
 * @param {Object} profileResponse
 * @returns {boolean|null}
 */
export const extractFirstSessionFree = (profileResponse) => {
  const profile =
    profileResponse?.data?.data ?? profileResponse?.data ?? profileResponse ?? {};

  const value =
    profile.isFirstSessionFree ??
    profile.is_first_session_free ??
    profile.firstSessionFree;

  if (value === undefined || value === null) return null;
  return value === true || value === "true" || value === 1;
};

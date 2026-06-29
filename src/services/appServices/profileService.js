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

/**
 * Guest ID utility for anonymous live stream access.
 * Generates a UUID v4 once, persists it in localStorage.
 * Rotates to a fresh UUID on logout.
 */

const GUEST_ID_KEY = "shubhtalk_guest_id";

/**
 * Get or create the guest ID (UUID v4).
 * Reuses existing ID across sessions until rotated on logout.
 */
export const getGuestId = () => {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
};

/**
 * Rotate guest ID (call on logout).
 * Generates a fresh UUID so the next guest session is a new identity.
 */
export const rotateGuestId = () => {
  const id = crypto.randomUUID();
  localStorage.setItem(GUEST_ID_KEY, id);
  return id;
};

/**
 * Check if current user is a guest (no auth token).
 */
export const isGuestUser = () => {
  return !localStorage.getItem("shubhtalk_customer_token");
};

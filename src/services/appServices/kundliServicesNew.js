import { privateRequestNew } from "./privateRequestNew";
import { getProfile, getProfileId } from "./profileService";
import { trackEvent } from "../../utils/analytics";

/**
 * Clears the local session and sends the user to the login screen.
 * Used when the Profile API reports an invalid/expired token (401).
 */
const clearSessionAndRedirectToLogin = () => {
  try {
    localStorage.clear();
    window.dispatchEvent(new Event("auth-change"));
  } catch {
    /* ignore */
  }
  window.location.replace("/login?skip=welcome");
};

/**
 * Decides what to do for a logged-in user who has no "self" kundli yet.
 *
 * Registration status is taken from the Profile API (the source of truth),
 * NOT from localStorage. Based on the Profile API response:
 *   - 200 (profile exists)            → user is registered → do nothing.
 *   - 404 / NOT_FOUND ("Profile not found") → user is NOT registered → send to
 *                                       the registration (personalize) flow.
 *   - 401 ("Invalid access token")    → session is invalid → log out & go login.
 */
/**
 * Sends the user to the registration (personalize) flow.
 *
 * This is a full page replace that can fire mid-journey — notably right after a
 * guest verifies their OTP, if their profile isn't resolvable yet. Landing on an
 * onboarding form with no explanation, having just submitted the same details,
 * reads as the app losing their progress. Leave a reason behind so the
 * destination can say what happened.
 */
const PERSONALIZE_REASON_KEY = "shubhtalk_personalize_reason";

/*
  Loop protection for the redirect below.

  `checkSelfKundliAndRedirect` runs from `getAllKundlis`'s onQueryStarted, and
  TopHeader issues that query on every page for every logged-in visitor. So this
  is not a one-time gate on a single screen — it is a `window.location.replace`
  that can fire on any route, from a background data fetch, a network round trip
  after the page has already painted and become interactive.

  With no cap, a logged-in visitor whose profile keeps 404ing is thrown off every
  page they open, forever. A Clarity session shows it plainly: homepage → login →
  birth date, time and place entered → back to the homepage → login again →
  again, 62 clicks over 13 minutes, ending back on the homepage with a run of dead
  and rage clicks on the "Generate My Kundli" card. Those clicks are dead because
  the document is being replaced out from under them: the SPA navigation starts
  and the hard replace discards it.

  Two attempts, then stop. A visitor stuck without a profile is better off on a
  working homepage — where "Generate My Kundli" reaches /kundli and Select Profile
  → Add Profile still works — than in a bounce loop. The counter lives in
  sessionStorage (per tab, cleared by the browser) and is reset the moment a
  kundli is found, so this heals itself.
*/
const PERSONALIZE_REDIRECT_KEY = "shubhtalk_personalize_redirects";
const MAX_PERSONALIZE_REDIRECTS = 2;

const getPersonalizeRedirectCount = () => {
  try {
    return Number(sessionStorage.getItem(PERSONALIZE_REDIRECT_KEY)) || 0;
  } catch {
    return 0;
  }
};

const clearPersonalizeRedirectCount = () => {
  try {
    sessionStorage.removeItem(PERSONALIZE_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
};

const redirectToPersonalize = () => {
  const attempts = getPersonalizeRedirectCount();
  if (attempts >= MAX_PERSONALIZE_REDIRECTS) {
    // Already sent them there and they are back without a profile. Redirecting
    // again would just take the page away from them a third time.
    console.warn(
      `[kundli] Skipping personalize redirect after ${attempts} attempts — leaving the visitor on ${window.location.pathname}`
    );
    return;
  }

  try {
    sessionStorage.setItem(PERSONALIZE_REDIRECT_KEY, String(attempts + 1));
    sessionStorage.setItem(
      PERSONALIZE_REASON_KEY,
      "Just one more step — we need to finish setting up your profile before you can chat."
    );
  } catch {
    /* sessionStorage unavailable — the redirect still needs to happen */
  }
  setTimeout(() => window.location.replace("/login?step=personalize"), 0);
};

const checkSelfKundliAndRedirect = async (data) => {
  const profiles = data?.data || [];
  const hasSelf = profiles.length > 0;

  // User already has a self profile — nothing to do.
  if (hasSelf) {
    // Whatever was wrong has resolved, so forget the bounce count. Without this
    // a visitor who legitimately needed one redirect early on would carry the
    // tally for the rest of the tab's life.
    clearPersonalizeRedirectCount();
    return;
  }

  const path = window.location.pathname;
  if (path === "/login" || path === "/register" || path === "/profile/add") return;

  const userId = getProfileId();

  // Without an id we can't verify status via the API — fall back to the
  // registration flow (previous behavior).
  if (userId == null) {
    redirectToPersonalize();
    return;
  }

  try {
    await getProfile(userId, { skipToast: true });
    // 200 OK → a profile exists → the user is already registered.
    // They simply have no kundli yet; don't force them into the signup flow.
    return;
  } catch (error) {
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.error?.code;

    // 401 → invalid/expired session → clear it and send the user to login.
    if (status === 401) {
      clearSessionAndRedirectToLogin();
      return;
    }

    // 404 / NOT_FOUND → no profile → user is not registered → go register.
    if (status === 404 || errorCode === "NOT_FOUND") {
      redirectToPersonalize();
      return;
    }

    // Any other error: don't disrupt the user.
  }
};

export const kundliApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAllKundlis: builder.query({
      query: () => ({ url: "kundlis/all", method: "GET" }),
      providesTags: () => [
        { type: "Kundlis", id: "LIST" },
      ],
      keepUnusedDataFor: 0,
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await checkSelfKundliAndRedirect(data);
        } catch {
          // API error — don't redirect
        }
      },
    }),

    // Fetch a single kundli by id. Works for shared kundlis that don't belong
    // to the current user (e.g. a kundli shared in chat), which the
    // owner-scoped `kundlis/all` list can't resolve.
    getKundliById: builder.query({
      query: (kundliId) => ({
        url: "kundlis/kundli",
        method: "GET",
        params: { kundliId },
      }),
      providesTags: (result, error, kundliId) => [{ type: "Kundlis", id: kundliId }],
    }),

    createKundli: builder.mutation({
      query: (body) => ({
        url: "kundlis/create",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
      async onQueryStarted(body, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          trackEvent("kundli_generated", {
            profile_id: data?.data?._id || null,
            sun_sign: data?.data?.sunSign || null,
            moon_sign: data?.data?.moonSign || null,
            ascendant: data?.data?.ascendant || null,
          });
        } catch { /* don't track failed attempts */ }
      },
    }),

    deleteKundli: builder.mutation({
      query: (id) => ({
        url: "kundlis/delete",
        method: "DELETE",
        body: { kundliId: id },
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
    }),

    editKundli: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `kundlis/editkundli/${id}`,
        method: "PUT",
        body,
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
    }),

    getKundliPdf: builder.query({
      query: ({ kundliId, language }) => ({
        url: `kundlis/kundli-pdf`,
        method: "GET",
        params: { id: kundliId, language: language || "en" },
      }),
    }),
  }),
});

export const {
  useGetAllKundlisQuery,
  useLazyGetAllKundlisQuery,
  useGetKundliByIdQuery,
  useLazyGetKundliByIdQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useEditKundliMutation,
  useGetKundliPdfQuery,
  useLazyGetKundliPdfQuery,
} = kundliApi;

export const useAddKundliMutation = useCreateKundliMutation;

import { privateRequestNew } from "./privateRequestNew";
import { getProfile, getProfileId } from "./profileService";

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
const checkSelfKundliAndRedirect = async (data) => {
  const profiles = data?.data || [];
  const hasSelf = profiles.length > 0;

  // User already has a self profile — nothing to do.
  if (hasSelf) return;

  const path = window.location.pathname;
  if (path === "/login" || path === "/register" || path === "/profile/add") return;

  const userId = getProfileId();

  // Without an id we can't verify status via the API — fall back to the
  // registration flow (previous behavior).
  if (userId == null) {
    setTimeout(() => window.location.replace("/login?step=personalize"), 0);
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
      setTimeout(() => window.location.replace("/login?step=personalize"), 0);
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

    createKundli: builder.mutation({
      query: (body) => ({
        url: "kundlis/create",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
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
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useEditKundliMutation,
  useGetKundliPdfQuery,
  useLazyGetKundliPdfQuery,
} = kundliApi;

export const useAddKundliMutation = useCreateKundliMutation;

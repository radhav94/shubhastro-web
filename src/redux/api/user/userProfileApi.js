import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

/*
 * The customer's own profile — GET /api/Profile/:id.
 *
 * The same endpoint already has an axios wrapper in
 * services/appServices/profileService.js, used once at startup to decide
 * registration status. This RTK Query version exists because the free-session
 * eligibility on the profile is read by the astrologer CARDS, which render ten
 * to twenty at a time: axios would fire one request per card, while RTK Query
 * dedupes them into a single call and caches the result.
 *
 * Registered in SILENT_ENDPOINTS in privateRequestNew — a profile that does not
 * exist yet returns 404, which callers handle by falling back rather than
 * showing the generic "Item doesn't exist" toast.
 */
export const userProfileApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: (id) => ({
        url: `Profile/${id}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
      // Profile data barely changes within a visit; this keeps the offer label
      // from re-fetching as lists mount and unmount.
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetUserProfileQuery } = userProfileApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const userSessionApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    //  GET ASTROLOGER BY ID
    getAllUserSession: builder.query({
      query: () => ({
        url: "sessions/getAllUserSessions",
        method: "GET",
      }),
    }),

    // LOGOUT
    logoutUser: builder.mutation({
      query: ({ deviceType = "web" } = {}) => ({
        url: "users/logout",
        method: "POST",
        body: { deviceType },
      }),
    }),
  }),
  overrideExisting: false,
});

//  EXPORT HOOKS
export const { useGetAllUserSessionQuery, useLogoutUserMutation } = userSessionApi;

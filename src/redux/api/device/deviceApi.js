import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const deviceApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getActiveSessions: builder.query({
      query: () => ({
        url: "users/active-sessions",
        method: "GET",
      }),
      providesTags: ["ActiveSessions"],
    }),

    logoutDevice: builder.mutation({
      query: ({ device_id }) => ({
        url: "users/logout-device",
        method: "POST",
        body: { device_id },
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["ActiveSessions"],
    }),
  }),
});

export const { useGetActiveSessionsQuery, useLogoutDeviceMutation } = deviceApi;

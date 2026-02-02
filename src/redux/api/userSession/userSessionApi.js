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
  }),
  overrideExisting: false,
});

//  EXPORT HOOKS
export const { useGetAllUserSessionQuery } = userSessionApi;

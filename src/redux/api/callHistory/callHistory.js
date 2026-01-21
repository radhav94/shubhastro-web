import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const callHistoryApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getCallHistory: builder.query({
      query: ({ userId, page = 1, limit = 30 }) => ({
        url: "callSessions/callHistory",
        method: "GET",
        params: {
          userId,
          page,
          limit,
        },
      }),
      providesTags: ["CallHistory"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetCallHistoryQuery } = callHistoryApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const callHistoryApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getCallHistory: builder.query({
      query: (userId) => ({
        url: "callSessions/callHistory",
        method: "GET",
        params: {
          userId,
        },
      }),
      providesTags: ["CallHistory"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetCallHistoryQuery } = callHistoryApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const callHistoryApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getCallHistory: builder.query({
      query: ({ userId, page = 1, limit = 30, sortOrder, month, year, filterBy }) => ({
        url: "callSessions/callHistory",
        method: "GET",
        params: {
          userId,
          page,
          limit,
          ...(sortOrder && { sortOrder }),
          ...(month && { month }),
          ...(year && { year }),
          ...(filterBy && { filterBy }),
        },
      }),
      providesTags: ["CallHistory"],
    }),

    getCallRecordings: builder.query({
      query: (astrologerId) => ({
        url: `callSessions/recordings/inbox/${astrologerId}`,
        method: "GET",
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCallHistoryQuery,
  // Lazy variant: lets callers fetch history on demand instead of on mount.
  // AstrologerProfile uses it so a 30-record history request is not on the
  // page-load critical path when its only consumer is a click handler.
  useLazyGetCallHistoryQuery,
  useGetCallRecordingsQuery,
} = callHistoryApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const reportApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getReportReasons: builder.query({
      query: () => "report/reasons",
    }),
    submitReport: builder.mutation({
      query: (body) => ({
        url: "report/submit",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetReportReasonsQuery,
  useSubmitReportMutation,
} = reportApi;

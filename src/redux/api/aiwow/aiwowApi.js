import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const aiwowApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAiWowPageData: builder.query({
      query: () => ({
        url: "homepage/?slug=ai-suites",
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),

    getAiHistory: builder.query({
      query: (kundliId) => ({
        url: `ai-history?kundliId=${kundliId}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),

    getCharges: builder.query({
      query: () => ({
        url: "filters/get-filters/charges",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      keepUnusedDataFor: 300, // cache 5 min — global data, rarely changes
    }),
  }),
});

export const { useGetAiWowPageDataQuery, useGetAiHistoryQuery, useGetChargesQuery } = aiwowApi;

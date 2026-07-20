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
      query: ({ kundliId, page = 1, limit = 10 }) => ({
        url: `ai-history?kundliId=${kundliId}&page=${page}&limit=${limit}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
      providesTags: (result, error, { kundliId }) => [
        { type: "AiHistory", id: kundliId },
        "AiHistory",
      ],
      serializeQueryArgs: ({ queryArgs }) => queryArgs.kundliId,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) return newItems;
        // Deduplicate by _id and featureId when merging paginated results
        const existingIds = new Set((currentCache?.data?.history || []).map((h) => h._id));
        const existingFeatureIds = new Set((currentCache?.data?.history || []).filter((h) => h.featureId).map((h) => h.featureId));
        const uniqueNewItems = (newItems?.data?.history || []).filter(
          (h) => !existingIds.has(h._id) && (!h.featureId || !existingFeatureIds.has(h.featureId))
        );
        return {
          ...newItems,
          data: {
            ...newItems.data,
            history: [...(currentCache?.data?.history || []), ...uniqueNewItems],
          },
        };
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
    }),

    getCharges: builder.query({
      query: () => ({
        url: "filters/get-filters/charges",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      keepUnusedDataFor: 300, // cache 5 min — global data, rarely changes
    }),

    getBusinessPathfinderOptions: builder.query({
      query: () => ({
        url: "wow-suite/business-pathfinder/options",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      keepUnusedDataFor: 300,
    }),

    // Fetch PDF URL for a given history item (handles payment deduction server-side)
    downloadReportPdf: builder.mutation({
      query: ({ historyId, language }) => {
        const params = new URLSearchParams({ historyId });
        if (language) params.append("language", language);
        return {
          url: `ai-history/pdf?${params.toString()}`,
          method: "GET",
          headers: { accept: "application/json" },
        };
      },
      invalidatesTags: ["AiHistory"],
    }),
  }),
});

export const {
  useGetAiWowPageDataQuery,
  useGetAiHistoryQuery,
  useGetChargesQuery,
  useLazyGetChargesQuery,
  useGetBusinessPathfinderOptionsQuery,
  useDownloadReportPdfMutation,
} = aiwowApi;

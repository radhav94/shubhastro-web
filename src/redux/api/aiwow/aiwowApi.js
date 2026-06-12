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
      serializeQueryArgs: ({ queryArgs }) => queryArgs.kundliId,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) return newItems;
        return {
          ...newItems,
          data: {
            ...newItems.data,
            history: [...(currentCache?.data?.history || []), ...(newItems?.data?.history || [])],
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
  }),
});

export const { useGetAiWowPageDataQuery, useGetAiHistoryQuery, useGetChargesQuery, useLazyGetChargesQuery, useGetBusinessPathfinderOptionsQuery } = aiwowApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const lalKitabApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    generateLalKitabTeva: builder.mutation({
      query: (kundliId) => ({
        url: "lal-kitab/generate-teva",
        method: "POST",
        body: { kundliId },
        headers: { "Content-Type": "application/json" },
      }),
    }),
    getLalKitabChart: builder.query({
      query: (lalKitabId) => `lal-kitab/chart/${lalKitabId}`,
    }),
    getLalKitabPlanetDetails: builder.query({
      query: (lalKitabId) => `lal-kitab/planet-details/${lalKitabId}`,
    }),
    getLalKitabDebts: builder.query({
      query: (lalKitabId) => `lal-kitab/debts/${lalKitabId}`,
    }),
  }),
});

export const {
  useGenerateLalKitabTevaMutation,
  useGetLalKitabChartQuery,
  useGetLalKitabPlanetDetailsQuery,
  useGetLalKitabDebtsQuery,
} = lalKitabApi;

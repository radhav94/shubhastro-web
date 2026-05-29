import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const occultApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getOccultDasha: builder.mutation({
      query: (body) => ({
        url: "ocult/ocult-dasha",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    getOccultPdf: builder.mutation({
      query: ({ historyId, featureType = "occult-dosha", kundliId }) => {
        const params = new URLSearchParams({ historyId, featureType });
        if (kundliId) params.append("kundliId", kundliId);
        return {
          url: `ai-history/pdf?${params.toString()}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetOccultDashaMutation, useGetOccultPdfMutation } = occultApi;

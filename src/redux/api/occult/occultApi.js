import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const occultApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getOccultDasha: builder.mutation({
      query: (body) => ({
        url: "ocult/ocult-dasha",
        method: "POST",
        body, // Either { kundliId } or { kundliDetails: {...} }
        headers: { "Content-Type": "application/json" },
      }),
    }),
  }),
});

export const { useGetOccultDashaMutation } = occultApi;

import { baseApi } from "../baseApi/baseApi";

export const panchangApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchAdvancePanchang: builder.query({
      query: ({ payload }) => ({
        url: `advanced_panchang`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useFetchAdvancePanchangQuery } = panchangApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "/main";

export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  endpoints: (builder) => ({
    geoSearch: builder.query({
      query: (city) =>
        `api/astro/v3-json/utilities/geo-search-advanced?city=${encodeURIComponent(
          city.trim()
        )}`,
      transformResponse: (response) => response?.response ?? [],
    }),
  }),
});

export const { useLazyGeoSearchQuery } = geoApi;



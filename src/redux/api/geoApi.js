import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

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
        )}&api_key=e19fcd25-34b1-52eb-9c7b-4270f71cbd87`,
      transformResponse: (response) => response?.response ?? [],
    }),
  }),
});

export const { useLazyGeoSearchQuery } = geoApi;



import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../utils/security/secureBaseQuery";
import { BACKEND_PROXY } from "../../utils/apiConfig";

const BASE_URL = BACKEND_PROXY;

export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: createSecureBaseQuery({
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



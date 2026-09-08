import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/*
  Geo / place search for the birth-place field.

  Now points at the dedicated geo service (njsapi.shubhastro.ai/api/geo/search)
  instead of the old `api/astro/v3-json/utilities/geo-search-advanced` behind the
  secure gateway. The new endpoint answers in plaintext JSON with the SAME shape
  the UI already consumes — `{ response: [{ full_name, coordinates:[lat,lng], tz,
  country, country_name, ... }] }` — so only the transport changes here; the
  consumer (locationSearchVedic.jsx) is untouched.

  A plain fetchBaseQuery (not the encrypted secure base query) because this host
  responds unencrypted and is hit directly.
*/
const GEO_BASE_URL = "https://njsapi.shubhastro.ai/api/geo";

export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: fetchBaseQuery({ baseUrl: GEO_BASE_URL }),
  endpoints: (builder) => ({
    geoSearch: builder.query({
      /*
        `city` is encoded here because this is the thing building the URL. Trim
        BEFORE encoding so a trailing space (easy on a soft keyboard) can't turn
        into "%20" and match nothing, and don't let the caller pre-encode too —
        double-encoding once made every multi-word place ("New Delhi", "Navi
        Mumbai") return zero results.
      */
      query: (city) =>
        `search?city=${encodeURIComponent(String(city ?? "").trim())}`,
      transformResponse: (response) => response?.response ?? [],
    }),
  }),
});

export const { useLazyGeoSearchQuery } = geoApi;

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
      /*
        `city` must arrive RAW — this endpoint owns the encoding because it is the
        thing building the URL. The caller used to pre-encode as well, so a space
        went encodeURIComponent(" ") -> "%20" and then "%20" -> "%2520". The
        server decodes once and reads a literal "%20" inside the name, which
        matches no city, so every multi-word place ("New Delhi", "Navi Mumbai",
        "Rae Bareli") returned zero results.

        Single-word names were unaffected because encodeURIComponent is idempotent
        for them, which is what made this survive: "Delhi" worked, "New Delhi"
        never did.

        trim() also has to happen BEFORE encoding. Trimming afterwards cannot
        remove a trailing space that has already become "%20" — so "Delhi "
        (trivially easy to produce on a soft keyboard) also returned nothing.
      */
      query: (city) =>
        `api/astro/v3-json/utilities/geo-search-advanced?city=${encodeURIComponent(
          String(city ?? "").trim()
        )}`,
      transformResponse: (response) => response?.response ?? [],
    }),
  }),
});

export const { useLazyGeoSearchQuery } = geoApi;



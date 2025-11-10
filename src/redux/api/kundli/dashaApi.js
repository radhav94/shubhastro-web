import { VEDIC_API_KEY, vedicApi } from "../baseApi/vedicApi";

export const dashaApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getMahaDashaPredictions: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dashas/maha-dasha-predictions",
        params: {
          api_key: VEDIC_API_KEY,
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
    getManglikDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/manglik-dosh",
        params: {
          api_key: VEDIC_API_KEY,
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
    getKaalSarpDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/kaalsarp-dosh",
        params: {
          api_key: VEDIC_API_KEY,
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
    getMangalDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/mangal-dosh",
        params: {
          api_key: VEDIC_API_KEY,
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
    getPitraDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/pitra-dosh",
        params: {
          api_key: VEDIC_API_KEY,
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
  }),
});

export const {
  useGetMahaDashaPredictionsQuery,
  useGetManglikDoshQuery,
  useGetKaalSarpDoshQuery,
  useGetMangalDoshQuery,
  useGetPitraDoshQuery,
} = dashaApi;

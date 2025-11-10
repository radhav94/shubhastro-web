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
  }),
});

export const { useGetMahaDashaPredictionsQuery } = dashaApi;

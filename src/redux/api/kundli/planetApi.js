
import { vedicApi } from "../baseApi/vedicApi";


export const planetApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlanetReport: builder.query({
      query: ({ dob, tob, lat, lon, tz, planet, lang = "en" }) => ({
        url: "horoscope/planet-report",
        params: {
          dob,
          tob,
          lat,
          lon,
          tz,
          planet,
          lang,
        },
      }),
    }),

    getGemStoneReport: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "extended-horoscope/gem-suggestion",
        params: {
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),

    getRudrakshaReport: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "extended-horoscope/rudraksh-suggestion",
        params: {
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
     getYogaReport: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "extended-horoscope/yoga-list",
        params: {
          dob,
          tob,
          lat,
          lon,
          tz,
          lang,
        },
      }),
    }),
     getVimshottari: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dashas/maha-dasha-predictions",
        params: {
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
  useGetPlanetReportQuery,
  useGetGemStoneReportQuery,
  useGetRudrakshaReportQuery,
  useGetYogaReportQuery,
  useGetVimshottariQuery
} = planetApi;
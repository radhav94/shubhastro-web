import { vedicApi } from "../baseApi/vedicApi";

const formatDobParam = (dob) => {
  if (!dob || typeof dob !== "string") return dob;
  const parts = dob.split("/");
  if (parts.length !== 3) return dob;
  const [day, month, year] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

export const planetApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlanetReport: builder.query({
      query: ({ dob, tob, lat, lon, tz, planet, lang = "en" }) => ({
        url: "horoscope/planet-report",
        params: {
          dob: formatDobParam(dob),
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
          dob: formatDobParam(dob),
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
          dob: formatDobParam(dob),
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
          dob: formatDobParam(dob),
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
          dob: formatDobParam(dob),
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
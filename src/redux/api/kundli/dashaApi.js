import { vedicApi } from "../baseApi/vedicApi";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const dashaApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getMahaDashaPredictions: builder.query({
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
    getManglikDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/manglik-dosh",
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
    getKaalSarpDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/kaalsarp-dosh",
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
    getMangalDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/mangal-dosh",
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
    getPitraDosh: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "dosha/pitra-dosh",
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
    getSadesati: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "extended-horoscope/current-sade-sati",
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
    getSadeSatiTable: builder.query({
      query: ({ dob, tob, lat, lon, tz, lang = "en" }) => ({
        url: "extended-horoscope/sade-sati-table",
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
    getMatchMaking: builder.query({
      query: ({ formData }) => ({
        url: "matching/ashtakoot",
        params: {
          boy_dob: formatDate(formData.boyData.dob), // DD/MM/YYYY
          boy_tob: formData.boyData.tob, // HH:MM
          boy_lat: formData.boyData.place.lat,
          boy_lon: formData.boyData.place.lng,
          boy_tz: 5.5, // Default timezone
          girl_dob: formatDate(formData.girlData.dob),
          girl_tob: formData.girlData.tob,
          girl_lat: formData.girlData.place.lat,
          girl_lon: formData.girlData.place.lng,
          girl_tz: 5.5,
          lang: "en",
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
  useGetSadesatiQuery,
  useGetSadeSatiTableQuery,
  useGetMatchMakingQuery,
} = dashaApi;

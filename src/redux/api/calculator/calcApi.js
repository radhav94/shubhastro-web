import { calculatorApi } from "../baseApi/calculatorApi";

const api_key = "e19fcd25-34b1-52eb-9c7b-4270f71cbd87";
const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const calcApi = calculatorApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET Atmakaraka and Darakaraka Calculator
    getAtmakaraka: builder.query({
      query: (payload) => ({
        url: "extended-horoscope/jaimini-karakas",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    // GET SunSign
    getSunSign: builder.query({
      query: (payload) => ({
        url: "extended-horoscope/find-sun-sign",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getRisingSign: builder.query({
      query: (payload) => ({
        url: "extended-horoscope/find-ascendant",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getRashiCal: builder.query({
      query: (payload) => ({
        url: "extended-horoscope/find-moon-sign",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getDashaRep: builder.query({
      query: (payload) => ({
        url: "dashas/maha-dasha-predictions",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getMangalDoshaReport: builder.query({
      query: (payload) => ({
        url: "dosha/mangal-dosh",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getSadeSatiReport: builder.query({
      query: (payload) => ({
        url: "extended-horoscope/current-sade-sati",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getKaalSarpReport: builder.query({
      query: (payload) => ({
        url: "dosha/kaalsarp-dosh",
        params: {
          api_key,
          lang: "en",
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getNumerologyReport: builder.query({
      query: (payload) => ({
        url: "prediction/numerology",
        params: {
          api_key,
          name: payload?.name,
          lang: "en",
          date: formatDate(payload?.dob),
        },
      }),
    }),
  }),
});

export const {
  useGetAtmakarakaQuery,
  useGetSunSignQuery,
  useGetRisingSignQuery,
  useGetRashiCalQuery,
  useGetDashaRepQuery,
  useGetMangalDoshaReportQuery,
  useGetSadeSatiReportQuery,
  useGetKaalSarpReportQuery,
  useGetNumerologyReportQuery,
} = calcApi;

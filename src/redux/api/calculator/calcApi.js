import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
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

export const ShubhCalcApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    //Love Calculator
    loveCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/love",
        method: "POST",
        body: {
          name1: payload.name1,
          gender1: payload.gender1,
          name2: payload.name2,
          gender2: payload.gender2,
        },
      }),
    }),

    //flames Calculator
    flamesCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/flames",
        method: "POST",
        body: {
          name1: payload.name1,
          name2: payload.name2,
        },
      }),
    }),

    //friendship Calculator
    friendshipCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/friendship",
        method: "POST",
        body: {
          name1: payload.name1,
          name2: payload.name2,
        },
      }),
    }),

    //Age Calculator
    ageCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/age",
        method: "POST",
        body: {
          dob: payload.dob,
          asOf: payload.asOf,
        },
      }),
    }),

    //Mobile Numerology Calculator
    mobileNumerologyCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/mobile-numerology",
        method: "POST",
        body: {
          dob: payload.dob,
          mobile: payload.mobile,
        },
      }),
    }),

    //Vehicle Numerology Calculator
    vehicleNumerologyCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/vehicle-numerology",
        method: "POST",
        body: {
          dob: payload.dob,
          vehicle: payload.vehicle,
        },
      }),
    }),
  }),
});

export const {
  useLoveCalculatorMutation,
  useFlamesCalculatorMutation,
  useFriendshipCalculatorMutation,
  useAgeCalculatorMutation,
  useMobileNumerologyCalculatorMutation,
  useVehicleNumerologyCalculatorMutation,
} = ShubhCalcApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { calculatorApi } from "../baseApi/calculatorApi";
import { getCurrentLang } from "../../../utils/VedicParams.js/vedicParams";

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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
          dob: formatDate(payload?.dob),
          tob: payload?.tob,
          lat: payload?.lat,
          lon: payload?.lng,
          tz: 5.5,
        },
      }),
    }),
    getDashaPeriods: builder.query({
      query: (payload) => ({
        url: "dashas/maha-dasha",
        params: {
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          lang: getCurrentLang(),
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
          name: payload?.name?.trim().replace(/\s+/g, ""),
          lang: getCurrentLang(),
          date: formatDate(payload?.dob),
        },
      }),
    }),
  }),
});

export const {
  useGetAtmakarakaQuery,
  useGetSunSignQuery,
  useLazyGetSunSignQuery,
  useGetRisingSignQuery,
  useGetRashiCalQuery,
  useGetDashaPeriodsQuery,
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: {
          dob: payload.dob,
          vehicle: payload.vehicle,
        },
      }),
    }),

    //Mulank Calculator
    mulankCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/mulank",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          name: payload.name,
          dob: payload.dob,
        },
      }),
    }),

    //Name Compatibility Calculator
    nameCompatibilityCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/name-compatibility",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          name1: payload.name1,
          name2: payload.name2,
        },
      }),
    }),

    //Lo Shu Grid Calculator
    loShuGridCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/lo-shu-grid",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          dob: payload.dob,
        },
      }),
    }),

    //Lucky Name Numerology Calculator
    luckyNameNumerologyCalculator: builder.mutation({
      query: (payload) => ({
        url: "calculators/lucky-name-numerology",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          name: payload.name,
          dob: payload.dob,
          system: payload.system,
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
  useMulankCalculatorMutation,
  useNameCompatibilityCalculatorMutation,
  useLoShuGridCalculatorMutation,
  useLuckyNameNumerologyCalculatorMutation,
} = ShubhCalcApi;

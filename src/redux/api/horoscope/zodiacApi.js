import { vedicApi } from "../baseApi/vedicApi";
import { getCurrentLang } from "../../../utils/VedicParams.js/vedicParams";

export const zodiacApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchDaily: builder.query({
      query: (zodiac) => ({
        url: "prediction/daily-sun",
        params: {
          zodiac,
          date: new Date().toLocaleDateString("en-GB"),
          split: true,
          type: "big",
          lang: getCurrentLang(),
        },
      }),
    }),
    fetchTomorrow: builder.query({
      query: (zodiac) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          url: "prediction/daily-sun",
          params: {
            zodiac,
            date: tomorrow.toLocaleDateString("en-GB"),
            split: true,
            type: "big",
            lang: getCurrentLang(),
          },
        };
      },
    }),

    // Tomorrow Moon prediction
    fetchTomorrowMoon: builder.query({
      query: (zodiac) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          url: "prediction/daily-moon",
          params: {
            zodiac,
            date: tomorrow.toLocaleDateString("en-GB"),
            show_same: true,
            lang: getCurrentLang(),
          },
        };
      },
    }),

    // Tomorrow Nakshatra prediction
    fetchTomorrowNakshatra: builder.query({
      query: (nakshatra) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          url: "prediction/daily-nakshatra",
          params: {
            nakshatra,
            date: tomorrow.toLocaleDateString("en-GB"),
            lang: getCurrentLang(),
          },
        };
      },
    }),
    fetchWeekly: builder.query({
      query: (zodiac) => ({
        url: "western/weekly-horoscope",
        params: {
          zodiac,
          week: "thisweek",
          split: true,
          type: "big",
          lang: getCurrentLang(),
        },
      }),
    }),
    fetchYearly: builder.query({
      query: (zodiac) => ({
        url: "prediction/yearly",
        params: {
          zodiac,
          year: new Date().getFullYear(),
          show_same: true,
          lang: getCurrentLang(),
        },
      }),
    }),

    fetchPrevios: builder.query({
      query: ({ sign, payload }) => ({
        url: `sun_sign_prediction/daily/previous/${sign}`,
        method: "POST",
        body: payload,
      }),
    }),
    fetchNext: builder.query({
      query: ({ sign, payload }) => ({
        url: `sun_sign_prediction/daily/next/${sign}`,
        method: "POST",
        body: payload,
      }),
    }),
    fetchMonth: builder.query({
      query: ({ sign, payload }) => ({
        url: `horoscope_prediction/monthly/${sign}`,
        method: "POST",
        body: payload,
      }),
    }),

    // Daily Moon prediction
    fetchDailyMoon: builder.query({
      query: (zodiac) => ({
        url: "prediction/daily-moon",
        params: {
          zodiac,
          date: new Date().toLocaleDateString("en-GB"),
          show_same: true,
          lang: getCurrentLang(),
        },
      }),
    }),

    // Daily Sun prediction
    fetchDailySun: builder.query({
      query: (zodiac) => ({
        url: "prediction/daily-sun",
        params: {
          zodiac,
          date: new Date().toLocaleDateString("en-GB"),
          lang: getCurrentLang(),
          split: true,
          type: "big",
        },
      }),
    }),

    // Daily Nakshatra prediction
    fetchDailyNakshatra: builder.query({
      query: (nakshatra) => ({
        url: "prediction/daily-nakshatra",
        params: {
          nakshatra,
          date: new Date().toLocaleDateString("en-GB"),
          lang: getCurrentLang(),
        },
      }),
    }),

    // Weekly Moon prediction
    fetchWeeklyMoon: builder.query({
      query: (zodiac) => ({
        url: "prediction/weekly-moon",
        params: {
          zodiac,
          week: "thisweek",
          show_same: true,
          lang: getCurrentLang(),
        },
      }),
    }),

    // Weekly Sun prediction
    fetchWeeklySun: builder.query({
      query: (zodiac) => ({
        url: "prediction/weekly-sun",
        params: {
          zodiac,
          week: "thisweek",
          show_same: true,
          lang: getCurrentLang(),
        },
      }),
    }),
  }),
});

export const {
  useFetchDailyQuery,
  useFetchTomorrowQuery,
  useFetchTomorrowMoonQuery,
  useFetchTomorrowNakshatraQuery,
  useFetchPreviosQuery,
  useFetchNextQuery,
  useFetchMonthQuery,
  useFetchWeeklyQuery,
  useFetchYearlyQuery,
  useFetchDailyMoonQuery,
  useFetchDailySunQuery,
  useFetchDailyNakshatraQuery,
  useFetchWeeklyMoonQuery,
  useFetchWeeklySunQuery,
} = zodiacApi;

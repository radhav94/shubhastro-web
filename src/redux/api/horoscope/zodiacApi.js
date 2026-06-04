import { vedicApi } from "../baseApi/vedicApi";

export const zodiacApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchDaily: builder.query({
      query: (zodiac) => ({
        url: "western/daily-horoscope",
        params: {
          zodiac,
          date: new Date().toLocaleDateString("en-GB"),
          // date: "06/12/2025",
          split: true,
          type: "big",
          lang: "en",
        },
      }),
    }),
    fetchTomorrow: builder.query({
      query: (zodiac) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          url: "western/daily-horoscope",
          params: {
            zodiac,
            date: tomorrow.toLocaleDateString("en-GB"),
            split: true,
            type: "big",
            lang: "en",
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
          lang: "en",
        },
      }),
    }),
    fetchYearly: builder.query({
      query: (zodiac) => ({
        url: "western/yearly-horoscope",
        params: {
          zodiac,
          year: new Date().getFullYear(),
          lang: "en",
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
          lang: "en",
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
          lang: "en",
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
          lang: "en",
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
          lang: "en",
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
          lang: "en",
        },
      }),
    }),
  }),
});

export const {
  useFetchDailyQuery,
  useFetchTomorrowQuery,
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

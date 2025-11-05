import { horoscopeApi } from "../baseApi/horoscopeBaseApi";

export const zodiacApi = horoscopeApi.injectEndpoints({
  endpoints: (builder) => ({

    fetchDaily: builder.query({
      query: ({ sign,payload}) => ({
        url: `sun_sign_prediction/daily/${sign}`,
        method: "POST",
        body:payload
      }),
    }),
    fetchPrevios: builder.query({
      query: ({ sign,payload}) => ({
        url: `sun_sign_prediction/daily/previous/${sign}`,
        method: "POST",
        body:payload
      }),
    }),
    fetchNext: builder.query({
      query: ({ sign,payload}) => ({
        url: `sun_sign_prediction/daily/next/${sign}`,
        method: "POST",
        body:payload
      }),
    }),
    fetchMonth: builder.query({
      query: ({ sign,payload}) => ({
        url: `horoscope_prediction/monthly/${sign}`,
        method: "POST",
        body:payload
      }),
    }),

  }),
});

export const {
  useFetchDailyQuery,
  useFetchPreviosQuery,
  useFetchNextQuery,
  useFetchMonthQuery
} = zodiacApi;

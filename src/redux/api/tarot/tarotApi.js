import { VEDIC_API_KEY, vedicApi } from "../baseApi/vedicApi";

export const tarotApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getTarotShuffleData: builder.query({
      query: ({ shuffle_type, lang = "en" }) => ({
        url: "tarot/shuffle",
        params: {
          api_key: VEDIC_API_KEY,
          shuffle_type,
          lang,
        },
      }),
    }),
    getTarotDailyData: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/daily",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          lang,
        },
      }),
    }),
  }),
});

export const { useGetTarotShuffleDataQuery, useGetTarotDailyDataQuery } =
  tarotApi;

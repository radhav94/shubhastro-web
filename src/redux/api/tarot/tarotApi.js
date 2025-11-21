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
  }),
});

export const { useGetTarotShuffleDataQuery} = tarotApi;

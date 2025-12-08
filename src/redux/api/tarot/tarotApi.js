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
    getYesNoTarot: builder.query({
      query: ({ card_name, direction, lang = "en" }) => ({
        url: "tarot/yes-no",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          direction,
          lang,
        },
      }),
    }),
    getCareerTarot: builder.query({
      query: ({ card_name, direction, lang = "en" }) => ({
        url: "tarot/career-select",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          direction,
          lang,
        },
      }),
    }),
    getFlirtTarot: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/flirt-reading",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          lang,
        },
      }),
    }),
    getEroticLoveTarot: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/erotic-love",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          lang,
        },
      }),
    }),
    getMadeForEachOther: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/made-for-each-other-or-not",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          lang,
        },
      }),
    }),
    getInDepthLoveTarot: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/in-depth-love",
        params: {
          api_key: VEDIC_API_KEY,
          card_name,
          lang,
        },
      }),
    }),
    getLoveTriangleTarot: builder.query({
      query: ({ card_self, card_lover1, card_lover2, lang = "en" }) => ({
        url: "tarot/love-triangle",
        params: {
          api_key: VEDIC_API_KEY,
          card_self,
          card_lover1,
          card_lover2,
          lang,
        },
      }),
    }),
    getRomanticBreakup: builder.query({
      query: ({ card_cause, card_advise, lang = "en" }) => ({
        url: "tarot/romantic-breakup",
        params: {
          api_key: VEDIC_API_KEY,
          card_cause,
          card_advise,
          lang,
        },
      }),
    }),
    getBusinessBreakup: builder.query({
      query: ({ card_cause, card_advise, lang = "en" }) => ({
        url: "tarot/business-breakup",
        params: {
          api_key: VEDIC_API_KEY,
          card_cause,
          card_advise,
          lang,
        },
      }),
    }),
  }),
});

export const { useGetTarotShuffleDataQuery, useGetTarotDailyDataQuery, useGetYesNoTarotQuery, useGetCareerTarotQuery, useGetFlirtTarotQuery, useGetEroticLoveTarotQuery, useGetMadeForEachOtherQuery, useGetInDepthLoveTarotQuery, useGetLoveTriangleTarotQuery, useGetRomanticBreakupQuery, useGetBusinessBreakupQuery } =
  tarotApi;

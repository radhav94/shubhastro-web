import { vedicApi } from "../baseApi/vedicApi";

export const tarotApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getTarotShuffleData: builder.query({
      query: ({ shuffle_type, lang = "en" }) => ({
        url: "tarot/shuffle",
        params: {
          shuffle_type,
          lang,
        },
      }),
    }),
    getTarotDailyData: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/daily",
        params: { 
          card_name,
          lang,
        },
      }),
    }),
    getYesNoTarot: builder.query({
      query: ({ card_name, direction, lang = "en" }) => ({
        url: "tarot/yes-no",
        params: {
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
          
          card_name,
          lang,
        },
      }),
    }),
    getEroticLoveTarot: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/erotic-love",
        params: {
          
          card_name,
          lang,
        },
      }),
    }),
    getMadeForEachOther: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/made-for-each-other-or-not",
        params: {
          
          card_name,
          lang,
        },
      }),
    }),
    getInDepthLoveTarot: builder.query({
      query: ({ card_name, lang = "en" }) => ({
        url: "tarot/in-depth-love",
        params: {
          
          card_name,
          lang,
        },
      }),
    }),
    getLoveTriangleTarot: builder.query({
      query: ({ card_self, card_lover1, card_lover2, lang = "en" }) => ({
        url: "tarot/love-triangle",
        params: {
          
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
          
          card_cause,
          card_advise,
          lang,
        },
      }),
    }),
    getTarotCardDetails: builder.query({
      query: ({ reading_endpoint, card_name, lang = "en" }) => ({
        url: `tarot/${reading_endpoint}`,
        params: {
          card_name,
          lang,
        },
      }),
    }),
  }),
});

export const { useGetTarotShuffleDataQuery, useGetTarotDailyDataQuery, useGetYesNoTarotQuery, useGetCareerTarotQuery, useGetFlirtTarotQuery, useGetEroticLoveTarotQuery, useGetMadeForEachOtherQuery, useGetInDepthLoveTarotQuery, useGetLoveTriangleTarotQuery, useGetRomanticBreakupQuery, useGetBusinessBreakupQuery, useGetTarotCardDetailsQuery } =
  tarotApi;

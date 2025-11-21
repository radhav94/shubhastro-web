import { VEDIC_API_KEY, vedicApi } from "../baseApi/vedicApi";

export const numerologyApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getNumerologyReport: builder.query({
      query: ({ name, date, lang = "en" }) => ({
        url: "prediction/numerology",
        params: {
          api_key: VEDIC_API_KEY,
          date,
          name,
          lang,
        },
      }),
    }),

    getRadicalNumberDetails: builder.query({
      query: ({ radical_number, lang = "en" }) => ({
        url: "utilities/radical-number-details",
        params: {
          api_key: VEDIC_API_KEY,
          radical_number,
          lang,
        },
      }),
    }),
  }),
});

export const { useGetNumerologyReportQuery,useGetRadicalNumberDetailsQuery} = numerologyApi;

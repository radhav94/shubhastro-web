import { vedicApi } from "../baseApi/vedicApi";

export const numerologyApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getNumerologyReport: builder.query({
      query: ({ name, date, lang = "en" }) => ({
        url: "prediction/numerology",
        params: {
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
          radical_number,
          lang,
        },
      }),
    }),
  }),
});

export const { useGetNumerologyReportQuery,useGetRadicalNumberDetailsQuery} = numerologyApi;

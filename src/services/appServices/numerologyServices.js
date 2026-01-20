import { privateRequestNew } from "./privateRequestNew";

export const numerologyApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET NUMEROLOGY PREDICTION
    getNumerologyPrediction: builder.query({
      query: ({ date, name, lang = "en" }) => ({
        url: `astro/v3-json/prediction/numerology?date=${encodeURIComponent(date)}&name=${encodeURIComponent(name)}&lang=${lang}`,
        method: "GET",
      }),
    }),
  }),
});

// HOOKS
export const {
  useGetNumerologyPredictionQuery,
  useLazyGetNumerologyPredictionQuery,
} = numerologyApi;

import { baseApi } from "../baseApi/baseApi";

export const kundliApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchBirthDetails: builder.query({
      query: ({ payload }) => ({
        url: "birth_details",
        method: "POST",
        body: payload,
      }),
    }),

    getBasicPanchang: builder.query({
      query: ({ payload }) => ({
        url: "basic_panchang",
        method: "POST",
        body: payload,
      }),
    }),

    getAstroDetails: builder.query({
      query: ({ payload }) => ({
        url: "astro_details",
        method: "POST",
        body: payload,
      }),
    }),

    getPlanets: builder.query({
      query: ({ payload }) => ({
        url: "planets",
        method: "POST",
        body: payload,
      }),
    }),

    getKpDetails: builder.query({
      query: ({ payload }) => ({
        url: "kp_planets",
        method: "POST",
        body: payload,
      }),
    }),

    getChart: builder.query({
      query: ({ chartType, payload }) => ({
        url: `horo_chart_image/${chartType}`,
        method: "POST",
        body: payload,
      }),
    }),

    getYoginiDasha: builder.query({
      query: ({ payload }) => ({
        url: "current_yogini_dasha",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useFetchBirthDetailsQuery,
  useGetBasicPanchangQuery,
  useGetAstroDetailsQuery,
  useGetPlanetsQuery,
  useGetKpDetailsQuery,
  useGetChartQuery,
  useGetYoginiDashaQuery,
} = kundliApi;

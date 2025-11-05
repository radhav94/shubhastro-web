import { baseApi } from "../baseApi/baseApi";

export const kundliApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    getBirthDetails: builder.mutation({
      query: (data) => ({
        url: "birth_details",
        method: "POST",
        body: data,
      }),
    }),

    getBasicPanchang: builder.mutation({
      query: (data) => ({
        url: "basic_panchang",
        method: "POST",
        body: data,
      }),
    }),

    getAstroDetails: builder.mutation({
      query: (data) => ({
        url: "astro_details",
        method: "POST",
        body: data,
      }),
    }),

     getPlanets: builder.mutation({
      query: (data) => ({
        url: "planets",
        method: "POST",
        body: data,
      }),
    }),
  
    getKpDetails: builder.mutation({
      query: (data) => ({
        url: "kp_planets",
        method: "POST",
        body: data,
      }),
    }),

    getChart: builder.mutation({
      query: ({ chartType, data }) => ({
        url: `horo_chart_image/${chartType}`,
        method: "POST",
        body: data,
      }),
    }),

    getYoginiDasha: builder.mutation({
      query: ({ data }) => ({
        url: 'current_yogini_dasha',
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetBirthDetailsMutation,
  useGetBasicPanchangMutation,
  useGetAstroDetailsMutation,
  useGetPlanetsMutation,
  useGetKpDetailsMutation,
  useGetChartMutation,
  useGetYoginiDashaMutation
} = kundliApi;

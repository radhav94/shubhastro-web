import { pythonApi } from "../baseApi/pythonApi";

export const ashtakvargaApi = pythonApi.injectEndpoints({
  endpoints: (builder) => ({

    getAshtakvargaChart: builder.mutation({
      query: ({ data }) => ({
        url: 'create-astakvarg-kundali-custom',
        method: "POST",
        body: data,
      }),
    }),

  }),
});

export const {
    useGetAshtakvargaChartMutation
} = ashtakvargaApi;

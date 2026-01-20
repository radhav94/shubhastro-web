import { pythonApi } from "../baseApi/pythonApi";

export const ashtakvargaApi = pythonApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchAshtakvargaChart: builder.query({
      query: ({ payload }) => ({
        url: "create-astakvarg-kundali-custom",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useFetchAshtakvargaChartQuery } = ashtakvargaApi;

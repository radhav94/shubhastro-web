import { privateRequestNew } from "../../../../services/appServices/privateRequestNew";

export const epoojaApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL Epooja
    getAllEPooja: builder.query({
      query: ({ page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page,
          limit,
        });

        return {
          url: `liveDarshan/temple-list?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    // GET Single Epooja
    getSingleEPooja: builder.query({
      query: (ID) => ({
        url: `liveDarshan/${ID}`,
      }),
    }),
  }),
});

export const { useGetAllEPoojaQuery, useGetSingleEPoojaQuery } = epoojaApi;

import { privateRequestNew } from "../../../../services/appServices/privateRequestNew";

export const epoojaApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL Darshan
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

    // GET Single Darshan
    getSingleEPooja: builder.query({
      query: (ID) => ({
        url: `liveDarshan/${ID}`,
      }),
    }),

    // GET ALL Epooja
    getAllOldEPooja: builder.query({
      query: (categoryId = "69328474e62280851507e1ef") => ({
        url: "ePoojas/all",
        params: {
          categoryId,
        },
      }),
    }),

    // GET Single Epooja
    getSingleOldEPooja: builder.query({
      query: (poojaId) => ({
        url: "ePoojas/single",
        params: {
          poojaId,
        },
      }),
    }),
  }),
});

export const {
  useGetAllEPoojaQuery,
  useGetSingleEPoojaQuery,
  useGetAllOldEPoojaQuery,
  useGetSingleOldEPoojaQuery,
} = epoojaApi;

import { privateRequestNew } from "../../../../services/appServices/privateRequestNew";

export const epoojaApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL Epooja
    getAllEPooja: builder.query({
      query: (categoryId = "69328474e62280851507e1ef") => ({
        url: "ePoojas/all",
        params: {
          categoryId,
        },
      }),
    }),

    // GET Single Epooja
    getSingleEPooja: builder.query({
      query: (poojaId) => ({
        url: "ePoojas/single",
        params: {
          poojaId,
        },
      }),
    }),
  }),
});

export const { useGetAllEPoojaQuery, useGetSingleEPoojaQuery } = epoojaApi;

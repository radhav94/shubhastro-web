import { privateRequestNew } from "../../../../services/appServices/privateRequestNew";

export const epoojaApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL Categories
    getAllCategories: builder.query({
      query: ({ page = 1, limit = 6 }) => {
        const params = new URLSearchParams({
          page,
          limit,
        });

        return {
          url: `categories/all?${params.toString()}`,
          method: "GET",
        };
      },
    }),

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
        url: `liveDarshan/single`,
        params: {
          id: ID,
        },
      }),
    }),

    // GET ALL Epooja
 getAllOldEPooja: builder.query({
      query: ({ slug, page = 1, limit = 1 }) => {
        const params = new URLSearchParams({
          slug,
          page,
          limit,
        });

        return {
          url: `ePoojas/all?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    // GET Single Epooja
    getSingleOldEPooja: builder.query({
      query: (slug = "spell") => ({
        url: "ePoojas/single",
        params: {
          slug,
        },
      }),
    }),
  }),
});

export const {
  useGetAllCategoriesQuery,
  useGetAllEPoojaQuery,
  useGetSingleEPoojaQuery,
  useGetAllOldEPoojaQuery,
  useGetSingleOldEPoojaQuery,
} = epoojaApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL KUNDLIS
    getAstrologers: builder.query({
      query: ({ page = 1, limit = 6, specialties }) => {
        const params = new URLSearchParams({
          page,
          limit,
        });

        if (specialties) params.append("specialties", specialties);

        return {
          url: `astrologers/filter?${params.toString()}`,
          method: "GET",
        };
      },
    }),
  }),
});

// HOOKS
export const { useGetAstrologersQuery } = astrologerApi;

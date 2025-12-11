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

    // GET ASTROLOGER BY ID
    getAstrologerById: builder.query({
      query: ({id}) => ({
        url: `astrologers/astrologer?astrologerId=${id}`,
        method: "GET",
      }),
    }),
  }),
});

// HOOKS
export const { useGetAstrologersQuery, useGetAstrologerByIdQuery } = astrologerApi;

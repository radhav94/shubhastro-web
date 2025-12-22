import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ GET ALL ASTROLOGERS
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

    // ✅ GET ASTROLOGER BY ID
    getAstrologerById: builder.query({
      query: ({ id }) => ({
        url: `astrologers/astrologer?astrologerId=${id}`,
        method: "GET",
      }),
    }),

    // ✅ FILTER ASTROLOGERS (FULL FILTER SUPPORT)
    filterAstrologers: builder.query({
      query: ({
        searchText = "",
        selectedSkills = [],
        experties = "",
        selectedSort = "",
        selectedGender = "",
        page = 1,
        limit = 10,
      }) => {
        const params = new URLSearchParams({
          astroName: searchText,
          limit,
          page,
          Eexperties: experties, // ✅ single value
          sorting: selectedSort ? "true" : "false",
          sortByPrice: selectedSort === "Sort By Price" ? "1" : "0",
          sortByRating: selectedSort === "Sort By Rating" ? "1" : "0",
          gender: selectedGender?.toLowerCase() || "",
        });
    
        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          params.append("specialities", selectedSkills.join(",")); // ✅ Face Reading,Kp
        }
    
        return {
          url: `astrologers/filterAstrologers?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    
  }),
  overrideExisting: false,
});

// ✅ EXPORT HOOKS
export const {
  useGetAstrologersQuery,
  useGetAstrologerByIdQuery,
  useLazyFilterAstrologersQuery, // 👈 IMPORTANT
} = astrologerApi;

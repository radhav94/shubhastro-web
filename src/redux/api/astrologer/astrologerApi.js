import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    //  GET ALL ASTROLOGERS
    getAstrologers: builder.query({
      query: ({
        page = 1,
        limit = 6,
        specialties,
        isActiveType = "video,audio",
      }) => {
        const params = new URLSearchParams({
          page,
          limit,
          isActiveType,
        });

        if (specialties) params.append("specialties", specialties);

        return {
          url: `astrologers/filterAstrologers?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    //  GET ASTROLOGER BY ID
    getAstrologerById: builder.query({
      query: ({ id }) => ({
        url: `astrologers/astrologer?astrologerId=${id}`,
        method: "GET",
      }),
    }),

    //  FILTER ASTROLOGERS (FULL FILTER SUPPORT)
    filterAstrologers: builder.query({
      query: ({
        searchText = "",
        selectedSkills = [],
        experties = "",
        selectedSort = "",
        selectedGender = "",
        page = 1,
        limit = 10,
        isActiveType,
      }) => {
        const params = new URLSearchParams({
          astroName: searchText,
          limit,
          page,
          isActiveType,
          Eexperties: experties, //  single value
          sorting: selectedSort ? "true" : "false",
          sortByPrice: selectedSort === "Sort By Price" ? "1" : "0",
          sortByRating: selectedSort === "Sort By Rating" ? "1" : "0",
          gender: selectedGender?.toLowerCase() || "",
        });

        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          params.append("specialities", selectedSkills.join(",")); //  Face Reading,Kp
        }

        return {
          url: `astrologers/filterAstrologers?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    getAllCategories: builder.query({
      query: () => ({
        url: "categories/all",
      }),
    }),

    getRecommendedAstrologers: builder.query({
      query: () => ({
        url: "astrologers/recommendation",
      }),
    }),
  }),
  overrideExisting: false,
});

//  EXPORT HOOKS
export const {
  useGetAstrologersQuery,
  useGetAstrologerByIdQuery,
  useLazyFilterAstrologersQuery,
  useGetRecommendedAstrologersQuery,
} = astrologerApi;

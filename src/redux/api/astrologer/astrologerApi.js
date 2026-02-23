import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    //  GET ALL ASTROLOGERS
    getAstrologers: builder.query({
      query: ({
        page = 1,
        limit = 6,
        specialties,
        isActiveType,
        isActive,
      }) => {
        const params = new URLSearchParams({
          page,
          limit,
        });
    
        // ✅ send only when present
        if (specialties) {
          params.append("specialties", specialties);
        }
    
        if (isActiveType) {
          params.append("isActiveType", isActiveType);
        }
    
        // ✅ send ONLY when true
        if (isActive === true) {
          params.append("isActive", "true");
        }
    
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
        isActive,
      }) => {
        const params = new URLSearchParams({
          astroName: searchText,
          limit,
          page,
          gender: selectedGender || "",
        });

        // ✅ NEW LOGIC: Handle selectedSkills array
        // If selectedSkills array has items, convert to comma-separated string and pass to skills field
        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          params.append("skills", selectedSkills.join(","));
        } 
        // If no selectedSkills but experties is provided, use experties for skills field
        else if (experties) {
          params.append("skills", experties);
        }

        // ✅ OLD LOGIC (COMMENTED OUT - Replaced with new selectedSkills logic above)
        // if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
        //   params.append("specialities", selectedSkills.join(",")); //  Face Reading,Kp
        // }

        // Handle sorting
        if (selectedSort) {
          params.append("sort", selectedSort);
        }

        // ✅ OLD SORTING LOGIC (COMMENTED OUT - Replaced with new sort field above)
        // sorting: selectedSort ? "true" : "false",
        // sortByPrice: selectedSort === "Sort By Price" ? "1" : "0",
        // sortByRating: selectedSort === "Sort By Rating" ? "1" : "0",

        // Handle active status
        // if (isActive === true) {
        //   params.append("isActive", "true");
        // }

        // // Handle active type
        // if (isActiveType) {
        //   params.append("isActiveType", isActiveType);
        // }

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

    getAstrologerFilterCategoryTab: builder.query({
      query: () => ({
        url: "filters/get-filters/skills",
        method: "GET",
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
  useGetAstrologerFilterCategoryTabQuery,
  useGetAstrologerByIdQuery,
  useLazyFilterAstrologersQuery,
  useGetRecommendedAstrologersQuery,
} = astrologerApi;

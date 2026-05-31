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
        url: `astrologers/astrologer?astrologerId=${id}&change=true`,
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
        minPrice,
        maxPrice,
        minRating,
        minExperience,
        language,
      }) => {
        // OLD: isActive was always included in params, sending false/undefined values
        // const params = new URLSearchParams({
        //   astroName: searchText,
        //   limit,
        //   page,
        //   gender: selectedGender || "",
        //   isActive
        // });

        // NEW: Build params without isActive — it will be conditionally appended below
        const params = new URLSearchParams({
          astroName: searchText,
          limit,
          page,
          
        });

        if (selectedGender) {
          params.append("gender", selectedGender.toLowerCase());
        }
        // ✅ NEW LOGIC: Handle selectedSkills array
        // If selectedSkills array has items, convert to comma-separated string and pass to skills field
        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          params.append("skills", selectedSkills.join(","));
        } 
        // If no selectedSkills but experties is provided, use experties for skills field
        // NEW: Exclude "online" from skills — it's a status filter (isActive), not a skill
        else if (experties && experties.toLowerCase() !== "online") {
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

        // OLD: isActive was always included in URLSearchParams constructor above
        // if (isActive === true) {
        //   params.append("isActive", "true");
        // }

        // NEW: Conditionally append isActive ONLY when true (Online filter selected)
        if (isActive === true) {
          params.append("isActive", "true");
        }

        // Handle active type
        if (isActiveType) {
          params.append("isActiveType", isActiveType);
        }

        // Handle price range
        if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
          params.append("minPrice", minPrice);
        }
        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
          params.append("maxPrice", maxPrice);
        }

        // Handle rating
        if (minRating !== undefined && minRating !== null && minRating !== "") {
          params.append("minRating", minRating);
        }

        // Handle experience
        if (minExperience !== undefined && minExperience !== null && minExperience !== "") {
          params.append("minExperience", minExperience);
        }

        // Handle language
        if (language) {
          params.append("language", language);
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

    getAstrologerFilterCategoryTab: builder.query({
      query: () => ({
        url: "filters/get-filters/skills",
        method: "GET",
      }),
    }),

    getRecommendedAstrologers: builder.query({
      query: () => ({
        url: "astrologers/recommendation?limit=12",
      }),
    }),

    getExpertiseFilters: builder.query({
      query: () => ({
        url: "filters/get-filters/expertise",
        method: "GET",
        headers: { accept: "application/json" },
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
  useLazyGetAstrologerByIdQuery,
  useLazyFilterAstrologersQuery,
  useGetRecommendedAstrologersQuery,
  useGetExpertiseFiltersQuery,
} = astrologerApi;

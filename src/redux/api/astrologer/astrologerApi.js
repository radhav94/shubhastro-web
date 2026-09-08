import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { isEncryptedEnvelope } from "../../../utils/security/cryptoClient";

// Builds the listing URL. Extracted so queryFn below and the prefetch-matching
// check share one definition of what "the plain first page" means.
const buildAstrologersUrl = ({
  page = 1,
  limit = 6,
  specialties,
  isActiveType,
  isActive,
}) => {
  const params = new URLSearchParams({ page, limit });

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

  return `astrologers/filterAstrologers?${params.toString()}`;
};

/*
 * Hands back the in-flight request the inline script in index.html started, if
 * and only if it is for exactly the same page this call wants.
 *
 * See that script for the measurements. Short version: every content-bearing
 * element on /astrologers comes from this one endpoint, it never hits the
 * CloudFront cache because the response sets no Cache-Control, and its TTFB
 * ranged 0.48s-4.61s across five consecutive production requests. Without this
 * the request cannot even begin until the entry bundle has executed.
 *
 * Deliberately strict. Any filter at all — a category, the online view, page 2,
 * a different limit — means the prefetched payload is not this page, so it is
 * left alone and the call goes to the network normally. The handle is deleted on
 * first read so a later refetch (after login, or a cache invalidation) always
 * goes to the network rather than replaying a stale list.
 */
const consumeAstrologersPrefetch = (arg) => {
  if (typeof window === "undefined") return null;

  const handle = window.__astrologersPrefetch__;
  if (!handle) return null;

  const { page = 1, limit = 6, specialties, isActiveType, isActive } = arg || {};
  if (specialties || isActiveType || isActive === true) return null;
  if (Number(page) !== handle.page || Number(limit) !== handle.limit) return null;

  delete window.__astrologersPrefetch__;
  return handle.promise;
};

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    //  GET ALL ASTROLOGERS
    getAstrologers: builder.query({
      // queryFn rather than query so the request the inline prefetch already
      // started can be adopted. Everything it does not cover — any filter, a
      // later page, a logged-in visitor, a rejected fetch — falls straight
      // through to the normal baseQuery, so behaviour is unchanged there.
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const prefetched = consumeAstrologersPrefetch(arg);
        if (prefetched) {
          try {
            const body = await prefetched;
            /*
             * The inline fetch is a bare GET, so it carries no `x-sgw-sid` and
             * could not decrypt a secure-gateway envelope. This host answers in
             * plaintext today; discarding a sealed envelope here means that ever
             * changing degrades to one wasted request rather than a broken
             * listing. Same guard as the homepage prefetch.
             */
            if (!isEncryptedEnvelope(body)) return { data: body };
          } catch {
            // Best effort: fall through so the endpoint's own error handling,
            // retries and the isError branch in TalkToAstrologer still apply.
          }
        }

        return baseQuery({ url: buildAstrologersUrl(arg || {}), method: "GET" });
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

    /**
     * Recommended astrologers.
     *
     * Path note: the spec for this feature writes `astrologer/recommendation`
     * (singular), which 404s. The live route is the plural one already used
     * here, verified against dev.
     *
     * @param {Object}  [args]
     * @param {string}  [args.type]     - "chat" | "audio" | "video"
     * @param {boolean} [args.discount] - only astrologers currently discounted
     * @param {number}  [args.page]
     * @param {number}  [args.limit]
     */
    getRecommendedAstrologers: builder.query({
      query: ({ type, discount, page, limit = 12 } = {}) => {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        // Sent only when true: `discount=false` is a different request from
        // "no discount filter", and the backend should not have to guess.
        if (discount) params.set("discount", "true");
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        return { url: `astrologers/recommendation?${params.toString()}` };
      },
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

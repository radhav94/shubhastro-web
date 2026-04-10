import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const followedAstrologersApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getFollowedAstrologers: builder.query({
      query: ({ page = 1, limit = 10, searchTerm = "", sortOrder = "" } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const normalizedSearchTerm = searchTerm.trim();

        if (normalizedSearchTerm) {
          params.set("searchTerm", normalizedSearchTerm);
        }

        if (sortOrder) {
          params.set("sortOrder", sortOrder);
        }

        return {
          url: `follows/following?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["FollowedAstrologers"],
    }),
  }),
});

export const { useGetFollowedAstrologersQuery, useLazyGetFollowedAstrologersQuery } = followedAstrologersApi;

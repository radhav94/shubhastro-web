import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const communityApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getCommunityPageData: builder.query({
      query: () => ({
        url: "homepage/?slug=community",
        method: "GET",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
    }),

    getCommunitySpaces: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `community/spaces?page=${page}&limit=${limit}&includeArchived=false`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => ({
        spaces: response?.data || [],
        pagination: response?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }),
      providesTags: ["CommunitySpaces"],
    }),

    getMyJoinedSpaces: builder.query({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `community/spaces/me/joined?page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => ({
        spaces: response?.data || [],
        pagination: response?.pagination || { page: 1, limit: 50, total: 0, pages: 0 },
      }),
      providesTags: ["JoinedSpaces"],
    }),

    getCommunitySpaceDetail: builder.query({
      query: (slugOrId) => ({
        url: `community/spaces/${slugOrId}`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => response?.data || null,
    }),

    getCommunityLibrary: builder.query({
      query: ({ tab = "all", page = 1, limit = 10, sort = "newest" } = {}) => ({
        url: `community/library?tab=${tab}&page=${page}&limit=${limit}&sort=${sort}`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => ({
        posts: response?.data || [],
        pagination: response?.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
      }),
      providesTags: ["CommunityLibrary"],
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs || {};
        return rest;
      },
      merge: (currentCache, newData) => {
        if (newData.pagination.page === 1) {
          return newData;
        }
        return {
          posts: [...currentCache.posts, ...newData.posts],
          pagination: newData.pagination,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page !== previousArg?.page;
      },
    }),

    getCommunityFeed: builder.query({
      query: ({ page = 1, limit = 10, category, tag, slug, sort } = {}) => {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (category) params.append("category", category);
        if (tag) params.append("tag", tag);
        if (slug) params.append("slug", slug);
        if (sort) params.append("sort", sort);

        return {
          url: `community/feed?${params.toString()}`,
          method: "GET",
          headers: {
            accept: "application/json",
          },
        };
      },
      transformResponse: (response, meta, arg) => ({
        posts: response?.data || [],
        pagination: { ...(response?.pagination || { page: 1, limit: 10, total: 0, pages: 0 }), page: arg.page },
      }),
      // Infinite scroll: treat all page/sort requests for the same slug/filters as one cache entry
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, sort, ...rest } = queryArgs || {};
        return rest;
      },
      // Merge new page results into existing cached posts
      merge: (currentCache, newData, { arg }) => {
        if (!currentCache || arg.page === 1) {
          return newData;
        }
        return {
          posts: [...currentCache.posts, ...newData.posts],
          pagination: newData.pagination,
        };
      },
      // Re-fetch when page or sort changes
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort;
      },
    }),
    joinCommunitySpace: builder.mutation({
      query: (slugOrId) => ({
        url: `community/spaces/${slugOrId}/join`,
        method: "POST",
        headers: {
          accept: "application/json",
        },
      }),
      invalidatesTags: ["JoinedSpaces", "CommunitySpaces"],
    }),

    leaveCommunitySpace: builder.mutation({
      query: (slugOrId) => ({
        url: `community/spaces/${slugOrId}/leave`,
        method: "POST",
        headers: {
          accept: "application/json",
        },
      }),
      invalidatesTags: ["JoinedSpaces", "CommunitySpaces"],
    }),

    createCommunityPost: builder.mutation({
      query: (body) => ({
        url: "community/posts",
        method: "POST",
        body,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["CommunityLibrary"],
    }),

    deleteCommunityPost: builder.mutation({
      query: (postId) => ({
        url: `community/posts/${postId}`,
        method: "DELETE",
        headers: {
          accept: "application/json",
        },
      }),
    }),

    shareCommunityPost: builder.mutation({
      query: (postId) => ({
        url: `community/posts/${postId}/share`,
        method: "POST",
        headers: {
          accept: "application/json",
        },
      }),
    }),

    likeCommunityPost: builder.mutation({
      query: ({ targetId, targetType = "post" }) => ({
        url: "community/like",
        method: "POST",
        body: { targetId, targetType },
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
    }),

    getPostComments: builder.query({
      query: ({ postId, page = 1, limit = 20, sort = "newest" }) => ({
        url: `community/posts/${postId}/comments?page=${page}&limit=${limit}&sort=${sort}`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => ({
        comments: response?.data || [],
        pagination: response?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }),
    }),

    addPostComment: builder.mutation({
      query: ({ postId, body, parentId, isAnonymous = false }) => ({
        url: `community/posts/${postId}/comments`,
        method: "POST",
        body: {
          body,
          ...(parentId && { parentId }),
          isAnonymous,
        },
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
    }),

    getCommunityPost: builder.query({
      query: (postId) => ({
        url: `community/posts/${postId}`,
        method: "GET",
        headers: {
          accept: "application/json",
        },
      }),
      transformResponse: (response) => response?.data || null,
    }),

    updateCommunityPost: builder.mutation({
      query: ({ postId, ...body }) => ({
        url: `community/posts/${postId}`,
        method: "PATCH",
        body,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["CommunityLibrary"],
    }),
  }),
});

export const {
  useGetCommunityPageDataQuery,
  useGetCommunityFeedQuery,
  useGetCommunitySpacesQuery,
  useGetMyJoinedSpacesQuery,
  useGetCommunitySpaceDetailQuery,
  useGetCommunityLibraryQuery,
  useJoinCommunitySpaceMutation,
  useLeaveCommunitySpaceMutation,
  useCreateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useShareCommunityPostMutation,
  useLikeCommunityPostMutation,
  useGetPostCommentsQuery,
  useLazyGetPostCommentsQuery,
  useAddPostCommentMutation,
  useGetCommunityPostQuery,
  useUpdateCommunityPostMutation,
} = communityApi;

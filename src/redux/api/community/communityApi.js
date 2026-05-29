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
      providesTags: (result, error, slugOrId) => [{ type: "CommunitySpaceDetail", id: slugOrId }],
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
        pagination: { ...(response?.pagination || { page: 1, limit: 10, total: 0, pages: 0 }), page: arg.page, sort: arg.sort },
      }),
      // Cache key includes slug + sort (not page) so pagination merges within same sort
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, ...rest } = queryArgs || {};
        return rest;
      },
      // Merge pages for infinite scroll; reset when sort changes or page is 1
      merge: (currentCache, newData, { arg }) => {
        // If no existing cache, or page 1 (fresh load / sort change), replace entirely
        if (!currentCache || arg.page === 1) {
          return newData;
        }
        // Only append if same sort order
        if (currentCache.pagination?.sort !== arg.sort) {
          return newData;
        }
        return {
          posts: [...currentCache.posts, ...newData.posts],
          pagination: newData.pagination,
        };
      },
      // Always refetch when args change (page or sort)
      forceRefetch: () => true,
    }),
    joinCommunitySpace: builder.mutation({
      query: (slugOrId) => ({
        url: `community/spaces/${slugOrId}/join`,
        method: "POST",
        headers: {
          accept: "application/json",
        },
      }),
      invalidatesTags: (result, error, slugOrId) => [
        "JoinedSpaces",
        "CommunitySpaces",
        { type: "CommunitySpaceDetail", id: slugOrId },
      ],
    }),

    leaveCommunitySpace: builder.mutation({
      query: (slugOrId) => ({
        url: `community/spaces/${slugOrId}/leave`,
        method: "POST",
        headers: {
          accept: "application/json",
        },
      }),
      invalidatesTags: (result, error, slugOrId) => [
        "JoinedSpaces",
        "CommunitySpaces",
        { type: "CommunitySpaceDetail", id: slugOrId },
      ],
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
      transformResponse: (response, meta, arg) => ({
        comments: response?.data || [],
        pagination: { ...(response?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }), page: arg.page },
      }),
      serializeQueryArgs: ({ queryArgs }) => {
        const { page, refetchKey, ...rest } = queryArgs || {};
        return rest;
      },
      merge: (currentCache, newData, { arg }) => {
        if (!currentCache || arg.page === 1) {
          return newData;
        }
        // Deduplicate by comment _id
        const existingIds = new Set(currentCache.comments.map((c) => c._id));
        const newComments = newData.comments.filter((c) => !existingIds.has(c._id));
        return {
          comments: [...currentCache.comments, ...newComments],
          pagination: newData.pagination,
        };
      },
      forceRefetch: () => true,
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

    deleteCommunityComment: builder.mutation({
      query: (commentId) => ({
        url: `community/comments/${commentId}`,
        method: "DELETE",
        headers: {
          accept: "application/json",
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
  useDeleteCommunityCommentMutation,
  useGetCommunityPostQuery,
  useUpdateCommunityPostMutation,
} = communityApi;

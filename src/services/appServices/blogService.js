import { privateRequestNew } from "./privateRequestNew";

export const blogApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({

    // ⭐ Get Paginated Blogs
    getBlog: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `blogs/all?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),

    // ⭐ Get Single Blog
    getSingleBlog: builder.query({
      query: (sun_sign) => ({
        url: `blogs/single?blogId=${encodeURIComponent(sun_sign)}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),

    createChatRoom: builder.mutation({
  query: ({ userId, astrologerId }) => ({
    url: "chat/room/create",
    method: "POST",
    body: {
      userId,
      astrologerId,
    },
  }),
  invalidatesTags: ["ChatRoom"],
}),


  }),
});

export const { useGetBlogQuery, useGetSingleBlogQuery } = blogApi;

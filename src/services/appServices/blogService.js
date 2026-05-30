import { privateRequestNew } from "./privateRequestNew";

export const blogApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // Get Blog Page Data from Homepage API
    getBlogPageData: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `homepage/?slug=blogPage&page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          "accept": "application/json",
        },
      }),
      providesTags: ["Blogs"],
    }),

    // Get Paginated Blogs
    getBlog: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `blogs/all?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),

    // Get Single Blog
    getSingleBlog: builder.query({
      query: (slug) => ({
        url: `blogs/single?slug=${encodeURIComponent(slug)}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),

    // Get Related Blogs by tag matching
    getRelatedBlogs: builder.query({
      query: ({ blogId, page = 1, limit = 5 }) => ({
        url: `blogs/related?blogId=${blogId}&page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),
  }),
});

export const { useGetBlogPageDataQuery, useGetBlogQuery, useGetSingleBlogQuery, useGetRelatedBlogsQuery } = blogApi;

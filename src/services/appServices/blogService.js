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
      query: (sun_sign) => ({
        url: `blogs/single?blogId=${encodeURIComponent(sun_sign)}`,
        method: "GET",
      }),
      providesTags: ["Blogs"],
    }),
  }),
});

export const { useGetBlogPageDataQuery, useGetBlogQuery, useGetSingleBlogQuery } = blogApi;

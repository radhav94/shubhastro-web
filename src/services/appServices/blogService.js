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

    // Get Paginated Blogs (optionally filtered by category slug)
    getBlog: builder.query({
      query: ({ page = 1, limit = 10, category = "" } = {}) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (category) params.set("category", category);
        return {
          url: `blogs/all?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Blogs"],
    }),

    // Get Blog Categories
    getBlogCategories: builder.query({
      query: () => ({
        url: `blogs/categories`,
        method: "GET",
      }),
      providesTags: ["BlogCategories"],
    }),

    // Get Single Blog
    getSingleBlog: builder.query({
      query: (slug) => ({
        url: `blogs/${encodeURIComponent(slug)}`,
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

export const { useGetBlogPageDataQuery, useGetBlogQuery, useGetBlogCategoriesQuery, useGetSingleBlogQuery, useGetRelatedBlogsQuery } = blogApi;

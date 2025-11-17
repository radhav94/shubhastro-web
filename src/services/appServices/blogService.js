import { privateRequestNew } from "./privateRequestNew";

export const blogApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getBlog: builder.query({
      query: () => ({
        url: "blogs/all",
        method: "GET",
      }),
      providesTags: ["Kundlis"],
    }),
  }),
});

// ⭐ Correct Hook Export
export const { useGetBlogQuery } = blogApi;

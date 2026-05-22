import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const staticPagesApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getStaticPageBySlug: builder.query({
      query: (slug) => `static-pages?slug=${slug}`,
    }),
  }),
});

export const { useGetStaticPageBySlugQuery } = staticPagesApi;

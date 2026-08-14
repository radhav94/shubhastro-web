import { privateRequestNew } from "./privateRequestNew";

// The slug this endpoint falls back to when called with no argument.
export const DEFAULT_HOME_SLUG = "newcustomerlandingpage";

export const homeApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getHomeDetails: builder.query({
      query: () => ({
        url: "homepage",
        method: "GET",
        params: {
          slug: "customerlandingpage",
        },
      }),
      providesTags: ["Kundlis"],
    }),
    getAiSuites: builder.query({
      query: () => ({
        url: "homepage",
        method: "GET",
        params: { slug: "ai-suites" },
      }),
    }),
    getNewHomeDetails: builder.query({
      query: (slug) => ({
        url: "homepage",
        method: "GET",
        params: { slug: slug || DEFAULT_HOME_SLUG },
      }),
      /*
       * `query` collapses a missing slug to DEFAULT_HOME_SLUG, but RTK Query keys
       * the cache on the raw argument, so calling this with `undefined` and with
       * "newcustomerlandingpage" produced two cache entries for one identical
       * URL — and therefore two 105 KB requests on the homepage. Worse, they ran
       * back to back rather than in parallel (HomeIntroPopup mounts as a child of
       * HomeV2), so the popup banner that is the page's LCP element could not
       * start loading until the second copy finished. Normalising the key here
       * merges those two callers while keeping genuinely different slugs
       * (e.g. "complimentary-service") on their own cache entries.
       */
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${queryArgs || DEFAULT_HOME_SLUG})`,
    }),
  }),
});

export const { useGetHomeDetailsQuery, useGetAiSuitesQuery, useGetNewHomeDetailsQuery } = homeApi;

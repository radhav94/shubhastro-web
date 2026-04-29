import { privateRequestNew } from "./privateRequestNew";

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
      query: () => ({
        url: "homepage",
        method: "GET",
        params: { slug: "newcustomerlandingpage" },
      }),
    }),
  }),
});

export const { useGetHomeDetailsQuery, useGetAiSuitesQuery, useGetNewHomeDetailsQuery } = homeApi;

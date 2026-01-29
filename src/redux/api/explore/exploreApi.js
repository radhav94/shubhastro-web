import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const exploreApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getExplorePageData: builder.query({
      query: () => ({
        url: "homepage/?slug=explore",
        method: "GET",
        headers: {
          "accept": "application/json",
        },
      }),
    }),
  }),
});

export const { useGetExplorePageDataQuery } = exploreApi;

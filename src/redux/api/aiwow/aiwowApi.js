import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const aiwowApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAiWowPageData: builder.query({
      query: () => ({
        url: "homepage/?slug=ai-suites",
        method: "GET",
        headers: {
          "accept": "application/json",
        },
      }),
    }),
  }),
});

export const { useGetAiWowPageDataQuery } = aiwowApi;

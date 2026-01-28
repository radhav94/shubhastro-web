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
  }),
});

// ⭐ Hook Export
export const { useGetHomeDetailsQuery } = homeApi;

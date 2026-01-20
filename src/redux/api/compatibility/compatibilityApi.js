import { vedicApi } from "../baseApi/vedicApi";

export const compatibilityApi = vedicApi.injectEndpoints({
  endpoints: (builder) => ({
    getSimpleCompatibility: builder.query({
      query: ({ sign1, sign2 }) => ({
        url: `western/simple-compatibility`,
        params : {
            p1_sign: sign1,
            p2_sign: sign2,
        }
      }),
    }),
  }),
});

export const {
  useGetSimpleCompatibilityQuery
} = compatibilityApi;

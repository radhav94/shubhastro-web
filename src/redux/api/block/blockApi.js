import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const blockApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    blockUser: builder.mutation({
      query: (body) => ({
        url: "block/block",
        method: "POST",
        body,
      }),
    }),
    unblockUser: builder.mutation({
      query: (body) => ({
        url: "block/unblock",
        method: "POST",
        body,
      }),
    }),
    getBlockList: builder.query({
      query: () => "block/list",
    }),
    checkBlocked: builder.query({
      query: (params) => ({
        url: "block/check",
        params,
      }),
    }),
  }),
});

export const {
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockListQuery,
  useCheckBlockedQuery,
  useLazyCheckBlockedQuery,
} = blockApi;

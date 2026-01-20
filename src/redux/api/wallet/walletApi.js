import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const walletApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query({
      query: () => "wallets/all"
    }),
    getBalance: builder.mutation({
      query: ({ astrologerId, type = "chat" }) => ({
        url: "wallets/preSessionBalanceCheck",
        params: { astrologerId, type }, 
      }),
    }),
  }),
});

// HOOKS
export const { useLazyGetWalletBalanceQuery, useGetBalanceMutation } = walletApi;

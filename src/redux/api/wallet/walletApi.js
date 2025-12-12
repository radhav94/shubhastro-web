import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const walletApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query({
      query: () => "wallets/all"
    }),
  }),
});

// HOOKS
export const { useLazyGetWalletBalanceQuery } = walletApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const subscriptionApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query({
      query: () => ({
        url: "subscription-entitlements/plans",
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),
    getSubscriptionStatus: builder.query({
      query: () => ({
        url: "subscription-entitlements/status",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      providesTags: ["SubscriptionStatus"],
    }),
    purchaseWalletSubscription: builder.mutation({
      query: (body) => ({
        url: "subscription-entitlements/purchase/wallet",
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body,
      }),
      invalidatesTags: ["SubscriptionStatus"],
    }),
    cancelSubscription: builder.mutation({
      query: (body) => ({
        url: "subscription-entitlements/cancel",
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body,
      }),
      invalidatesTags: ["SubscriptionStatus"],
    }),
    checkFeatureAccess: builder.mutation({
      query: (body) => ({
        url: "subscription-entitlements/feature/check",
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body,
      }),
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionStatusQuery,
  usePurchaseWalletSubscriptionMutation,
  useCancelSubscriptionMutation,
  useCheckFeatureAccessMutation,
} = subscriptionApi;

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
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionStatusQuery,
} = subscriptionApi;

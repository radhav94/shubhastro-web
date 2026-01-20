import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const plansApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET ALL KUNDLIS
    getAllPlans: builder.query({
      query: () => ({
        url: "plans/all",
        method: "GET",
      }),
      providesTags: ["plans"], // Add this
    }),
    getPlanById: builder.query({
      query: (planId) => ({
        url: `plans/plan?planId=${planId}`,
        method: "GET",
      }),
      providesTags: ["plans"], // Add this
    }),
  }),
});

// HOOKS
export const { useGetAllPlansQuery, useGetPlanByIdQuery } = plansApi;

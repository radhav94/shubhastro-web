import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

// Direct API base for payment-critical endpoints (bypasses /main proxy)
const DIRECT_API_BASE = import.meta.env.VITE_APP_API_BASE_URL;

const paymentDirectApi = createApi({
  reducerPath: "paymentDirectApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${DIRECT_API_BASE}/api/`,
    prepareHeaders: (headers) => {
      const role = localStorage.getItem("shubhtalk_role");
      let token = null;

      if (role === "ASTROLOGER") {
        token = localStorage.getItem("shubhtalk_astro_token");
      } else if (role === "CUSTOMER") {
        token = localStorage.getItem("shubhtalk_customer_token");
      }

      headers.set("Content-Type", "application/json");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Update order status after payment — calls backend directly
    verifyPayment: builder.mutation({
      query: (payload) => ({
        url: "orders/update",
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

export const paymentApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // Create Razorpay order
    createOrder: builder.mutation({
      query: (payload) => ({
        url: "orders/create",
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
  }),
});

export const { useCreateOrderMutation } = paymentApi;
export const { useVerifyPaymentMutation } = paymentDirectApi;
export { paymentDirectApi };

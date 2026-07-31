import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { BACKEND_PROXY } from "../../../utils/apiConfig";

// Payment-critical endpoints must go through the same-origin secure gateway
// (like every other backend call). Hitting the backend cross-origin here
// triggered a CORS preflight on the custom x-sgw-sid header, which the upstream
// rejects — so orders/update failed before any response was received.
const paymentDirectApi = createApi({
  reducerPath: "paymentDirectApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: `${BACKEND_PROXY}/api/`,
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
    // Update order status after payment — routed via the same-origin gateway
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

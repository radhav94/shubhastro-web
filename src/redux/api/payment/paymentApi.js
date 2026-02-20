import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

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
    
    // Update order status after payment
    verifyPayment: builder.mutation({
      query: (payload) => ({
        url: "orders/update",
        method: "PUT",
        body: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
  }),
});

export const { 
  useCreateOrderMutation, 
  useVerifyPaymentMutation 
} = paymentApi;

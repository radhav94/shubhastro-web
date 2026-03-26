import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const mallOrderApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getMallOrderHistory: builder.query({
      query: ({
        page = 1,
        limit = 10,
        order_status,
        payment_status,
        payment_method,
        from_date,
        to_date,
        sort = "newest",
      }) => {
        const params = { page, limit, sort };
        if (order_status) params.order_status = order_status;
        if (payment_status) params.payment_status = payment_status;
        if (payment_method) params.payment_method = payment_method;
        if (from_date) params.from_date = from_date;
        if (to_date) params.to_date = to_date;

        return {
          url: "mall/orders/history",
          method: "GET",
          params,
        };
      },
      providesTags: ["MallOrders"],
    }),

    getMallOrderDetail: builder.query({
      query: (orderId) => ({
        url: `mall/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (result, error, orderId) => [{ type: "MallOrders", id: orderId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMallOrderHistoryQuery, useGetMallOrderDetailQuery } = mallOrderApi;

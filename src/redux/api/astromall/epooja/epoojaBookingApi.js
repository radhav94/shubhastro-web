import { privateRequestNew } from "../../../../services/appServices/privateRequestNew";

export const epoojaBookingApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // GET Astromall Page Data (tray listing)
    getAstromallPageData: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `mall/homepage?slug=astromallpage&page=${page}&limit=${limit}`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
    }),

    // GET Single Product Detail by ID
    // Note: Backend may return 404 status but with valid data
    getEPoojaDetail: builder.query({
      query: (productId) => ({
        url: `mall/products/${productId}`,
        method: "GET",
        // Treat all responses as successful so RTK doesn't reject on 404
        validateStatus: (response) => response.status === 200 || response.status === 404,
      }),
      // Transform to normalize the response
      transformResponse: (response) => response,
      transformErrorResponse: (response) => ({
        success: false,
        status: false,
        message: response?.data?.message || "Failed to fetch product",
      }),
      keepUnusedDataFor: 0,
    }),

    // GET Pandits/Consultants for a pooja
    getEPoojaPandits: builder.query({
      query: ({ poojaId, page = 1, limit = 10 }) => ({
        url: `ePoojas/pandits`,
        params: { poojaId, page, limit },
      }),
    }),

    // GET Product Reviews
    getProductReviews: builder.query({
      queryFn: async ({ productId, page = 1, limit = 10 }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/product-reviews/product/${productId}?page=${page}&limit=${limit}`, {
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      providesTags: ["productReviews"],
    }),

    // GET user cart
    getCart: builder.query({
      queryFn: async () => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          // If user is not logged in, return empty cart instead of making an unauthorized request
          if (!token) {
            return { data: { success: true, data: { items: [], totalItems: 0, totalPrice: 0 } } };
          }

          const res = await fetch(`${BASE_URL}/api/mall/cart`, {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      providesTags: ["cart"],
    }),

    // Add item to cart
    addToCart: builder.mutation({
      queryFn: async ({ productId, quantity = 1, variantId, skuCode }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          // Require authentication for cart mutations
          if (!token) {
            return { error: { status: 401, data: { message: "Please login to add items to cart" } } };
          }

          const body = { productId, quantity, variantId };
          if (skuCode) body.skuCode = skuCode;

          const res = await fetch(`${BASE_URL}/api/mall/cart`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (json?.success) {
            return { data: json };
          }
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["cart"],
    }),

    // Update cart item quantity — PUT /api/mall/cart/:productId/:variantId
    updateCartItem: builder.mutation({
      queryFn: async ({ productId, variantId, quantity }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          if (!token) {
            return { error: { status: 401, data: { message: "Please login to update cart" } } };
          }

          const res = await fetch(`${BASE_URL}/api/mall/cart/${productId}/${variantId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity }),
          });
          const json = await res.json();
          if (json?.success) {
            return { data: json };
          }
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: (_result, error) => (error ? [] : ["cart"]),
    }),

    // Remove item from cart — DELETE /api/mall/cart/:productId/:variantId
    removeCartItem: builder.mutation({
      queryFn: async ({ productId, variantId }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          if (!token) {
            return { error: { status: 401, data: { message: "Please login to modify cart" } } };
          }

          const res = await fetch(`${BASE_URL}/api/mall/cart/${productId}/${variantId}`, {
            method: "DELETE",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          // Treat 200, 404 (already removed) as success
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["cart"],
    }),

    // Create product review
    createProductReview: builder.mutation({
      queryFn: async ({ productId, rating, title, comment }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/product-reviews`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ productId, rating, title, comment }),
          });
          const json = await res.json();
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["productReviews"],
    }),

    // Update product review
    updateProductReview: builder.mutation({
      queryFn: async ({ reviewId, rating, title, comment }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/product-reviews/${reviewId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ rating, title, comment }),
          });
          const json = await res.json();
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["productReviews"],
    }),

    // Delete product review
    deleteProductReview: builder.mutation({
      queryFn: async ({ reviewId }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/product-reviews/${reviewId}`, {
            method: "DELETE",
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["productReviews"],
    }),

    // ── Address APIs ──

    // GET all addresses
    getAddresses: builder.query({
      queryFn: async () => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/addresses/`, {
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      providesTags: ["addresses"],
    }),

    // Add address
    addAddress: builder.mutation({
      queryFn: async (body) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/addresses/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["addresses"],
    }),

    // Update address
    updateAddress: builder.mutation({
      queryFn: async ({ addressId, ...body }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/addresses/${addressId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["addresses"],
    }),

    // Delete address
    deleteAddress: builder.mutation({
      queryFn: async ({ addressId }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/addresses/${addressId}`, {
            method: "DELETE",
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["addresses"],
    }),

    // GET filtered products
    getProducts: builder.query({
      queryFn: async (params = {}) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const qp = new URLSearchParams();
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") qp.append(k, v);
          });

          const res = await fetch(`${BASE_URL}/api/mall/products?${qp.toString()}`, {
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      providesTags: ["products"],
    }),

    // GET product categories
    getProductCategories: builder.query({
      queryFn: async () => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/product-categories`, {
            headers: {
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const json = await res.json();
          return { data: json };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
    }),

    // Create mall order (before payment — status: pending)
    createMallOrder: builder.mutation({
      queryFn: async (body) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const url = `${BASE_URL}/api/mall/orders`;
          const bodyStr = JSON.stringify(body);

          console.log(
            `[createMallOrder] curl -X 'POST' \\\n  '${url}' \\\n  -H 'accept: application/json' \\\n  -H 'Content-Type: application/json' \\\n  ${token ? `-H 'Authorization: Bearer ${token}' \\\n  ` : ""}-d '${bodyStr}'`
          );

          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: bodyStr,
          });
          const json = await res.json();
          console.log("[createMallOrder] Response:", res.status, json);
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          console.error("[createMallOrder] Error:", err);
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
      invalidatesTags: ["cart"],
    }),

    // Update mall order (after payment success/failure)
    updateMallOrder: builder.mutation({
      queryFn: async ({ orderId, ...body }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const url = `${BASE_URL}/api/mall/orders/${orderId}`;
          const bodyStr = JSON.stringify(body);

          console.log(
            `[updateMallOrder] curl -X 'PUT' \\\n  '${url}' \\\n  -H 'accept: application/json' \\\n  -H 'Content-Type: application/json' \\\n  ${token ? `-H 'Authorization: Bearer ${token}' \\\n  ` : ""}-d '${bodyStr}'`
          );

          const res = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: bodyStr,
          });
          const json = await res.json();
          console.log("[updateMallOrder] Response:", res.status, json);
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          console.error("[updateMallOrder] Error:", err);
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
    }),

    // Book E-Pooja
    bookEPooja: builder.mutation({
      query: (body) => ({
        url: `ePoojas/book`,
        method: "POST",
        body,
      }),
    }),

    // GET Product Suggestions by slug
    getProductSuggestions: builder.query({
      query: (slug) => ({
        url: `mall/product/suggestion/${slug}`,
        method: "GET",
      }),
    }),

    // Validate coupon code
    validateCoupon: builder.mutation({
      queryFn: async ({ code, cart_total }) => {
        try {
          const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
          const role = localStorage.getItem("shubhtalk_role");
          const token = role === "ASTROLOGER"
            ? localStorage.getItem("shubhtalk_astro_token")
            : localStorage.getItem("shubhtalk_customer_token");

          const res = await fetch(`${BASE_URL}/api/mall/coupons/validate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ code, cart_total }),
          });
          const json = await res.json();
          if (json?.success) return { data: json };
          return { error: { status: res.status, data: json } };
        } catch (err) {
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
    }),
  }),
});

export const {
  useGetAstromallPageDataQuery,
  useGetEPoojaDetailQuery,
  useGetEPoojaPanditsQuery,
  useGetProductReviewsQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useCreateProductReviewMutation,
  useUpdateProductReviewMutation,
  useDeleteProductReviewMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useGetProductSuggestionsQuery,
  useCreateMallOrderMutation,
  useUpdateMallOrderMutation,
  useBookEPoojaMutation,
  useValidateCouponMutation,
} = epoojaBookingApi;

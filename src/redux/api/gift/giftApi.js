import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const giftApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAllGifts: builder.query({
      query: () => ({
        url: "gifts/all?limit=100",
      }),
      transformResponse: (response) => {
        // Filter out inactive gifts (status: false) at the API layer
        if (response?.data && Array.isArray(response.data)) {
          response.data = response.data.filter(gift => gift.status === true);
        }
        return response;
      },
      providesTags: ['Gift'],
    }),
    sendGift: builder.mutation({
      query: ({ giftId, astrologerId }) => ({
        url: "gifts/send",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: {giftId, astrologerId}
      }),
    }),
  }),
});

export const { useGetAllGiftsQuery, useSendGiftMutation} = giftApi;

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const giftApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAllGifts: builder.query({
      query: () => ({
        url: "gifts/all",
      }),
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

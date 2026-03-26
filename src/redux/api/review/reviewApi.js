import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const reviewApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    addAstrologerReview: builder.mutation({
      query: ({ astrologerID, rating, review, isAnonymous, roomId }) => ({
        url: "review/addAstrologerReview",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          astrologerID,
          rating,
          review,
          isAnonymous,
          roomId
        },
      }),
      invalidatesTags: (result, error, { astrologerID }) => [
        { type: 'AstrologerReviews', id: astrologerID }
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Dispatch custom event for manual refetch if needed
          window.dispatchEvent(new CustomEvent('reviewSubmitted', { 
            detail: { astrologerID: arg.astrologerID } 
          }));
        } catch {}
      },
    }),
    getAstrologerReviews: builder.query({
      query: ({ astrologerID, page = 1, limit = 10 }) => ({
        url: `review/getAstroReview/${astrologerID}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (result, error, { astrologerID }) => [
        { type: 'AstrologerReviews', id: astrologerID }
      ],
    }),
  }),
});

export const { 
  useAddAstrologerReviewMutation,
  useGetAstrologerReviewsQuery,
  useLazyGetAstrologerReviewsQuery
} = reviewApi;

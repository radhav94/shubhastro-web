import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const reviewApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    addAstrologerReview: builder.mutation({
      query: ({ astrologerID, rating, review, isAnonymous }) => ({
        url: "review/addAstrologerReview",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          astrologerID,
          rating,
          review,
          isAnonymous
        },
      }),
    }),
    getAstrologerReviews: builder.query({
      query: ({ astrologerID, page = 1, limit = 10 }) => ({
        url: `review/getAstroReview/${astrologerID}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),
  }),
});

export const { 
  useAddAstrologerReviewMutation,
  useGetAstrologerReviewsQuery,
  useLazyGetAstrologerReviewsQuery
} = reviewApi;

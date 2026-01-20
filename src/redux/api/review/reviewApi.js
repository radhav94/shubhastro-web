import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const reviewApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    addAstrologerReview: builder.mutation({
      query: ({ astrologerID, rating, review, isAnonymous }) => ({
        url: "review/addAstrologerReview",
        method: "POST",
        body: {
          astrologerID,
          rating,
          review,
          isAnonymous
        },
      }),
    })
  }),
});

export const { useAddAstrologerReviewMutation } = reviewApi;

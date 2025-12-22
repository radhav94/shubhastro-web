import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const reviewApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    addAstrologerReview: builder.mutation({
      query: ({ astrologerId, rating, review, anonymous }) => ({
        url: "review/addAstrologerReview",
        method: "POST",
        body: {
          astrologerId,
          rating,
          review,
          anonymous
        },
      }),
    })
  }),
});

export const { useAddAstrologerReviewMutation } = reviewApi;

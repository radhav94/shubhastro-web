import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { trackEvent } from "../../../utils/analytics";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    // CHECK IF FOLLOWING ASTROLOGER
    checkFollowingStatus: builder.query({
      query: ({ astrologerId }) => ({
        url: `follows/following?astrologerId=${astrologerId}`,
        method: "GET",
      }),
      providesTags: (_, __, { astrologerId }) => [
        { type: 'Following', id: astrologerId }
      ],
    }),

    // FOLLOW ASTROLOGER BY ID
    followAstrologerById: builder.mutation({
      query: ({ astrologerId }) => ({
        url: "follows/follow", 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: { astrologerId },
      }),
      invalidatesTags: (_, __, { astrologerId }) => [
        { type: "Following", id: astrologerId },
        "FollowedAstrologers",
      ],
      async onQueryStarted({ astrologerId }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          trackEvent("astrologer_followed", { astrologer_id: astrologerId });
        } catch { /* don't track failed attempts */ }
      },
    }),

    // UNFOLLOW ASTROLOGER BY ID
    unfollowAstrologerById: builder.mutation({
      query: ({ astrologerId }) => ({
        url: "follows/unfollow", 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: { astrologerId },
      }),
      invalidatesTags: (_, __, { astrologerId }) => [
        { type: "Following", id: astrologerId },
        "FollowedAstrologers",
      ],
      async onQueryStarted({ astrologerId }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          trackEvent("astrologer_unfollowed", { astrologer_id: astrologerId });
        } catch { /* don't track failed attempts */ }
      },
    }),
  }),
});

// HOOKS
export const { 
  useCheckFollowingStatusQuery,
  useFollowAstrologerByIdMutation, 
  useUnfollowAstrologerByIdMutation 
} = astrologerApi;

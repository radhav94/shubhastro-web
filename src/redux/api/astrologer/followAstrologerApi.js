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
      async onQueryStarted({ astrologerId }, { dispatch, queryFulfilled }) {
        // Optimistic update — immediately show "Following" in the UI
        const patchResult = dispatch(
          privateRequestNew.util.updateQueryData(
            'checkFollowingStatus',
            { astrologerId },
            (draft) => {
              if (draft?.data) {
                const existing = draft.data.find((item) => item.astrologerId === astrologerId);
                if (existing) {
                  existing.isFollowing = true;
                } else {
                  draft.data.push({ astrologerId, isFollowing: true });
                }
              }
            }
          )
        );
        try {
          await queryFulfilled;
          trackEvent("astrologer_followed", { astrologer_id: astrologerId });
        } catch {
          // Revert optimistic update on failure
          patchResult.undo();
        }
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
      async onQueryStarted({ astrologerId }, { dispatch, queryFulfilled }) {
        // Optimistic update — immediately show "Follow" in the UI
        const patchResult = dispatch(
          privateRequestNew.util.updateQueryData(
            'checkFollowingStatus',
            { astrologerId },
            (draft) => {
              if (draft?.data) {
                const existing = draft.data.find((item) => item.astrologerId === astrologerId);
                if (existing) {
                  existing.isFollowing = false;
                }
              }
            }
          )
        );
        try {
          await queryFulfilled;
          trackEvent("astrologer_unfollowed", { astrologer_id: astrologerId });
        } catch {
          // Revert optimistic update on failure
          patchResult.undo();
        }
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

import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

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
      ],
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
      ],
    }),
  }),
});

// HOOKS
export const { 
  useCheckFollowingStatusQuery,
  useFollowAstrologerByIdMutation, 
  useUnfollowAstrologerByIdMutation 
} = astrologerApi;

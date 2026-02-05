import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const astrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({

    // FOLLOW ASTROLOGER BY ID
    followAstrologerById: builder.mutation({
      query: ({ astrologerId }) => ({
        url: "follows/follow", 
        method: "POST",
         headers: {
            'Content-Type': 'application/json',            
          },
        body: {
          astrologerId
        },
      }),
    }),

    // UNFOLLOW ASTROLOGER BY ID
    unfollowAstrologerById: builder.mutation({
      query: ({ astrologerId }) => ({
        url: "follows/unfollow", 
        method: "POST",
        headers: {
            'Content-Type': 'application/json',            
          },
        body: {
          astrologerId
        },
      }),
    }),
  }),
});

// HOOKS
export const { useFollowAstrologerByIdMutation, useUnfollowAstrologerByIdMutation } = astrologerApi;

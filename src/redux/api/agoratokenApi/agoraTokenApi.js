import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const agoraToken = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAgoraToken: builder.query({
      query: ({ channelName }) => ({
        url: "callSessions/agoraToken",
        params: {
          channelName,
          // entityId,
        },
      }),
    }),
  }),
});

export const {
  useGetAgoraTokenQuery
} = agoraToken;

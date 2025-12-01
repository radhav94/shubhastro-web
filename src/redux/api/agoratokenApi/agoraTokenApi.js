import { localReuqqestApi } from "../../../services/appServices/privateRequestNew";

export const agoraToken = localReuqqestApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgoraToken: builder.query({
      query: ({ channelName }) => ({
        url: "api/callSessions/agoraToken",
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

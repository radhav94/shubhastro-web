import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const chatHistory = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getUserChatMessages: builder.query({
      query: ({ userId, page = page, limit = limit }) => ({
        url: "chat/messages",
        method: "GET",
        params: {
          userId,
          page,
          limit,
        },
      }),
    }),

    getRoomChatMessages: builder.query({
      query: (roomId) => ({
        url: "chat/messages",
        method: "GET",
        params: {
          roomId,
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserChatMessagesQuery,
  useGetRoomChatMessagesQuery,
} = chatHistory;

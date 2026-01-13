import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const chatHistory = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getUserChatMessages: builder.query({
      query: (userId) => ({
        url: "chat/messages",
        method: "GET",
        params: {
          userId,
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

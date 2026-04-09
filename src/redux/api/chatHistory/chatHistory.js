import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const chatHistory = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getUserChatMessages: builder.query({
      query: ({ userId, page = 1, limit = 12, sortOrder, month, year }) => ({
        url: "chat/messages",
        method: "GET",
        params: {
          userId,
          page,
          limit,
          ...(sortOrder && { sortOrder }),
          ...(month && { month }),
          ...(year && { year }),
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

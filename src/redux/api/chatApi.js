import { privateRequestNew } from "../../services/appServices/privateRequestNew";
// import { vedicApi } from "../baseApi/vedicApi";

export const chatApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    createChatRoom: builder.mutation({
      query: ({ userId, astrologerId }) => ({
        url: "chat/room/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          userId,
          astrologerId,
        },
      }),
    }),

    getChatMessages: builder.query({
      query: ({ astrologerId = null, roomId = null }) => ({
        url: "chat/messages",
        params: { astrologerId, roomId },
      }),
    }),

    getChatHistory: builder.query({
      query: ({ userId }) => ({
        url: `chat/messages/inbox/${userId}`,
      }),
    }),
  }),
});

export const { useGetChatMessagesQuery, useCreateChatRoomMutation ,useGetChatHistoryQuery} = chatApi;

import { localReuqqestApi } from "../../services/appServices/privateRequestNew";
// import { vedicApi } from "../baseApi/vedicApi";

export const chatApi = localReuqqestApi.injectEndpoints({
  endpoints: (builder) => ({


      createChatRoom: builder.mutation({
      query: ({ userId, astrologerId }) => ({
        url: "api/chat/room/create",
        method: "POST",
        body: {
          userId,
          astrologerId,
        },
      }),
    }),

    getChatMessages: builder.query({
      query: ({ astrologerId }) => ({
        url: "api/chat/messages",
        params: { astrologerId },
      }),
    }),
  }),
});

export const { useGetChatMessagesQuery,useCreateChatRoomMutation } = chatApi;

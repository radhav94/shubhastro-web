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
      query: ({ astrologerId = null, roomId = "", page = 1, userId = "" }) => ({
        url: "chat/messages",
        params: { 
          astrologerId, 
          roomId, 
          page,
          userId },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Serialize by astrologerId and roomId only, not page
        return `${endpointName}-${queryArgs.astrologerId}-${queryArgs.roomId}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        // If it's the first page, replace the cache
        if (arg.page === 1) {
          return newItems;
        }
        // Otherwise, merge the new data with existing
        if (currentCache?.data?.chatHistory && newItems?.data?.chatHistory) {
          return {
            ...newItems,
            data: {
              ...newItems.data,
              chatHistory: [
                ...currentCache.data.chatHistory,
                ...newItems.data.chatHistory,
              ],
              pagination: newItems.data.pagination, // Use latest pagination info
            },
          };
        }
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.page !== previousArg?.page;
      },
    }),

    getChatHistory: builder.query({
      query: ({ userId }) => ({
        url: `chat/messages/inbox/${userId}`,
      }),
    }),

    getSuggestedRemedies: builder.query({
      query: ({ astrologerId }) => ({
        url: `chat/messages/remedies/inbox/${astrologerId}`,
      }),
    }),
  }),
});

export const {
  useGetChatMessagesQuery,
  useCreateChatRoomMutation,
  useGetChatHistoryQuery,
  useGetSuggestedRemediesQuery,
} = chatApi;

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
      query: ({ userId, page = 1, limit = 30 }) => ({
        url: `chat/messages/inbox/${userId}`,
        params: { page, limit },
      }),
      serializeQueryArgs: ({ queryArgs }) => queryArgs.userId,
      merge: (currentCache, newData, { arg }) => {
        if (arg.page === 1) return newData;
        const existingIds = new Set((currentCache?.data || []).map((m) => m._id));
        const uniqueNewMessages = (newData?.data || []).filter(
          (m) => !existingIds.has(m._id)
        );
        return {
          ...newData,
          data: [...(currentCache?.data || []), ...uniqueNewMessages],
          pagination: newData?.pagination,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        if (!previousArg) return true;
        return currentArg?.page !== previousArg?.page;
      },
    }),

    // Virtual Assistant - send message
    sendVirtualAssistantMessage: builder.mutation({
      query: ({ astrologerId, type, sender, message, kundliId, kundliName }) => ({
        url: "chat/messages/create",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { astrologerId, type, sender, message, kundliId, kundliName, isAssistant: true },
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
  useSendVirtualAssistantMessageMutation,
  useGetSuggestedRemediesQuery,
} = chatApi;

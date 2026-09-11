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
      query: ({ userId, page = 1, limit = 30, isAssistant = true }) => ({
        url: `chat/messages/inbox/${userId}`,
        // isAssistant=true is required for the Virtual Assistant window: opening
        // the chat (this GET) is what the backend uses to auto-mark the other
        // party's messages delivered + read, which flips the sender's ticks to
        // blue. No separate "mark read" API is needed (guide §1).
        params: { page, limit, isAssistant },
      }),
      // Cache key is just userId so all pages merge into one entry
      serializeQueryArgs: ({ queryArgs }) => queryArgs.userId,
      merge: (currentCache, newData, { arg }) => {
        if (arg.page === 1) return newData;
        // Deduplicate by _id and append older messages
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
      query: ({ astrologerId, type, sender, message, kundliId, kundliName, replyToId, parentType = "chat" }) => ({
        url: "chat/messages/create",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // replyToId is optional (guide §2): only sent when this message is a
        // reply. An invalid/foreign replyToId is safely ignored by the backend.
        // parentType defaults to "chat" per the guide's create payload example.
        body: {
          astrologerId,
          type,
          sender,
          message,
          kundliId,
          kundliName,
          parentType,
          isAssistant: true,
          ...(replyToId ? { replyToId } : {}),
        },
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

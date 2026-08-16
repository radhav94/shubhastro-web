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
      query: ({ roomId, page = 1, limit = 30 }) => ({
        url: "chat/messages",
        method: "GET",
        params: {
          roomId,
          page,
          limit,
        },
      }),
      serializeQueryArgs: ({ queryArgs }) => queryArgs.roomId,
      merge: (currentCache, newData, { arg }) => {
        if (arg.page === 1) return newData;
        const existingHistory = currentCache?.data?.[0]?.chatHistory || [];
        const newHistory = newData?.data?.[0]?.chatHistory || [];
        const existingIds = new Set(existingHistory.map((m) => m._id));
        const uniqueNew = newHistory.filter((m) => !existingIds.has(m._id));
        return {
          ...newData,
          data: [
            {
              ...(newData?.data?.[0] || {}),
              chatHistory: [...uniqueNew, ...existingHistory],
            },
          ],
          pagination: newData?.pagination,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        if (!previousArg) return true;
        return currentArg?.page !== previousArg?.page;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserChatMessagesQuery,
  // Lazy variant — see the note on useLazyGetCallHistoryQuery.
  useLazyGetUserChatMessagesQuery,
  useGetRoomChatMessagesQuery,
} = chatHistory;

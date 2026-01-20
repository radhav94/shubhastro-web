
import { useGetUserChatMessagesQuery } from "../../../../../redux/api/chatHistory/chatHistory";

export const useChat = (userId) => {
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useGetUserChatMessagesQuery(userId, {
    skip: !userId,
  });

  const data =
    apiResponse?.data?.map((room, index) => {
      const lastChat =
        room.chatHistory?.[room.chatHistory.length - 1];

      return {
        id: index + 1,

        // backend does not provide orderId
        orderId: room.roomId?.slice(-6) || "NA",

        // astrologer / opposite user name
        name: room.firstName
          ? `${room.firstName} ${room.lastName || ""}`
          : "Unknown",

        // backend does not provide
        rate: 0,
        deduction: 0,

        // total messages in this chat
        messages: room.chatHistory?.length || 0,

        date: lastChat?.createdAt
          ? new Date(lastChat.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",

        image: "https://i.pravatar.cc/150",

        roomId: room.roomId,
        astrologerId: room.astrologerId,
        lastMessage: room.lastMessage,
      };
    }) || [];

  return {
    data,
    isLoading,
    error,
  };
};
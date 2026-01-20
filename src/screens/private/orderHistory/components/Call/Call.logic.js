
import { useGetCallHistoryQuery } from "../../../../../redux/api/callHistory/callHistory";

export const useCall = (userId) => {
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useGetCallHistoryQuery(userId, {
    skip: !userId,
  });

  const data =
    apiResponse?.data
      ?.filter((item) => item?.type !== "chat")
      ?.map((item, index) => {
        return {
          id: index + 1,

          orderId: item?.callerId?.slice(-6) || "NA",

          name: item?.callerName || item?.receiverName || "Unknown",

          rate: 0,
          duration: 0,
          deduction: item?.duration,

          date: new Date(item?.timestamp).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),

          image: "https://i.pravatar.cc/100",
          status: item?.status || "completed",
        };
      }) || [];

  return {
    data,
    isLoading,
    error,
  };
};

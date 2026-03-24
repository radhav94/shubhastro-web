import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./OrderDetails.module.scss";
import OrderHeader from "./components/OrderDetails/OrderHeader";
import OrderTabs from "./components/OrderDetails/OrderTabs";
import OrderInfoCard from "./components/OrderDetails/OrderInfoCard";
import ChatWindow from "./components/OrderDetails/ChatWindow";
import RemediesTab from "./components/OrderDetails/RemediesTab";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useGetChatHistoryQuery, useGetChatMessagesQuery } from "../../../redux/api/chatApi";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";

const OrderDetails = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Call");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get customer ID from localStorage
  const shubhtalk_customer_id = localStorage.getItem("shubhtalk_customer_id");
  
  // Fetch astrologer details
  const { data: astrologerData, isLoading: isLoadingAstrologer } = useGetAstrologerByIdQuery(
    { id: astrologerId }
    
  );
  
  // Fetch chat messages from API with pagination
  // OLD CODE (commented out for reference):
  // const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatMessagesQuery({
  //   astrologerId: astrologerId,
  //   roomId: "",
  //   page: page,
  //   userId:"69b28da4b5aea2d31737ba1a",
  // });
  
  // NEW CODE (with userId from localStorage):
  // const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatMessagesQuery({
  //   astrologerId: astrologerId,
  //   roomId: "",//"room-3f139701-bd15-4818-94fe-380d412813c1",
  //   page: page,
  //   userId: shubhtalk_customer_id, // Use customer ID from localStorage with fallback
  // });

  const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatHistoryQuery(
    { userId: astrologerId },
    { refetchOnMountOrArgChange: true }
  );

  // OLD CODE: useGetUserChatMessagesQuery (commented out — replaced with useGetChatHistoryQuery above)
  // const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetUserChatMessagesQuery(
  //   astrologerId,
  //   { refetchOnMountOrArgChange: true }
  // );

  // Reset pagination when astrologerId changes
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [astrologerId]);

  // Check if there's more data to load based on API pagination
  React.useEffect(() => {
    if (chatData?.data?.pagination) {
      const { hasNextPage } = chatData.data.pagination;
      setHasMore(hasNextPage);
    }
  }, [chatData]);

  const loadMore = React.useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasMore]);

  // Process chat history - group by room ID
  // OLD CODE: processedData for useGetChatHistoryQuery response (commented out)
  // const processedData = React.useMemo(() => {
  //   if (!chatData?.data) return { chatSessions: [], amount: 0 };
  //   
  //   const chatSessions = chatData.data;
  //   
  //   if (chatSessions.length === 0) {
  //     return { chatSessions: [], amount: 0 };
  //   }
  //   
  //   let totalAmount = 0;
  //   
  //   // Process each session
  //   const processedSessions = chatSessions.map((session) => {
  //     totalAmount += session.amount || 0;
  //     
  //     console.log("session::",session)
  //     const messages =
  //       // session?.map((msg) => (
  //         {
  //         id: session._id,
  //         sender: session.sender, // 'user' or 'astrologer'
  //         message: session.message || session.response,
  //         time: new Date(session.createdAt).toLocaleTimeString("en-IN", {
  //           hour: "numeric",
  //           minute: "2-digit",
  //         }),
  //         status: "read",
  //         type: session.type, // 'message', 'kundli', etc.
  //         createdAt: session.createdAt,
  //       }
  //     // )) || [];
  //     
  //     // Sort messages within the room by time (oldest first)
  //     messages.sort((a, b) => {
  //       const dateA = new Date(a.createdAt);
  //       const dateB = new Date(b.createdAt);
  //       return dateA - dateB;
  //     });
  //     
  //     // Get session date and time from first message
  //     const firstMessage = messages[0];
  //     const sessionDate = firstMessage ? new Date(firstMessage.createdAt) : new Date();
  //     
  //     return {
  //       roomId: session.roomId,
  //       sessionId: session._id,
  //       date: sessionDate.toLocaleDateString("en-US", {
  //         month: "short",
  //         day: "2-digit",
  //         year: "numeric",
  //       }),
  //       time: sessionDate.toLocaleTimeString("en-IN", {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       }),
  //       messages,
  //       amount: session?.amount || 0,
  //     };
  //   });
  //   
  //   // Sort sessions by date (newest first)
  //   processedSessions.sort((a, b) => {
  //     const dateA = new Date(a.messages[0]?.createdAt || 0);
  //     const dateB = new Date(b.messages[0]?.createdAt || 0);
  //     return dateB - dateA;
  //   });
  //   
  //   return { 
  //     chatSessions: processedSessions,
  //     amount: totalAmount,
  //     firstMessageDate: processedSessions[0]?.messages[0]?.createdAt,
  //   };
  // }, [chatData]);

  // NEW CODE: processedData for useGetUserChatMessagesQuery response (flat message list grouped by roomId)
  const processedData = React.useMemo(() => {
    if (!chatData?.data) return { chatSessions: [], amount: 0 };

    const flatMessages = chatData.data;

    if (!Array.isArray(flatMessages) || flatMessages.length === 0) {
      return { chatSessions: [], amount: 0 };
    }

    // Group messages by roomId
    const groupedByRoom = {};
    flatMessages.forEach((msg) => {
      const roomId = msg.roomId || "unknown";
      if (!groupedByRoom[roomId]) {
        groupedByRoom[roomId] = [];
      }
      groupedByRoom[roomId].push(msg);
    });

    let totalAmount = 0;

    // Process each room group into a session
    const processedSessions = Object.entries(groupedByRoom).map(([roomId, roomMessages]) => {
      // Map each flat message to the format ChatWindow expects
      const messages = roomMessages.map((msg) => ({
        id: msg._id,
        sender: msg.sender, // 'user' or 'astrologer'
        message: msg.message || msg.response,
        time: new Date(msg.createdAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "read",
        type: msg.type, // 'message', 'kundli', 'image', etc.
        createdAt: msg.createdAt,
        kundliName: msg?.kundliName,
      }));

      // Sort messages within the room by time (oldest first)
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Get session date and time from first message
      const firstMessage = messages[0];
      const sessionDate = firstMessage ? new Date(firstMessage.createdAt) : new Date();

      // Accumulate amount if present on any message
      const roomAmount = roomMessages.reduce((sum, msg) => sum + (msg.amount || 0), 0);
      totalAmount += roomAmount;

      return {
        roomId,
        sessionId: roomMessages[0]?._id || roomId,
        date: sessionDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        time: sessionDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        messages,
        amount: roomAmount,
      };
    });

    // Sort sessions by date (newest first)
    processedSessions.sort((a, b) => {
      const dateA = new Date(a.messages[0]?.createdAt || 0);
      const dateB = new Date(b.messages[0]?.createdAt || 0);
      return dateB - dateA;
    });

    return {
      chatSessions: processedSessions,
      amount: totalAmount,
      firstMessageDate: processedSessions[0]?.messages[0]?.createdAt,
    };
  }, [chatData]);

  const handleBack = () => {
    navigate(-1);
  };

  // Process astrologer data
  const astrologer = astrologerData?.data;

  // console.log("Remedies::", {
  //   astrologerId: astrologerId,
  //   roomId: "",
  //   page: page,
  //   userId: shubhtalk_customer_id, // Use customer ID from localStorage with fallback
  // })
  const astrologerInfo = astrologer ? {
    name: `${astrologer.firstName || ""} ${astrologer.lastName || ""}`.trim(),
    experience: astrologer.experience ? `${astrologer.experience} Years` : "N/A",
    image: astrologer.profileImage || "https://via.placeholder.com/40",
    isOnline: astrologer.isActive || false,
    astrologer_ID: astrologer.astrologer_ID,
  } : null;

  const renderTabContent = () => {
    // Show loader while initial data is loading
    if (isLoadingMessages || isLoadingAstrologer) {
      return <PrimaryLoader />;
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <p>Failed to load order details</p>
        </div>
      );
    }

    if (!astrologerInfo) {
      return (
        <div className={styles.errorState}>
          <p>Astrologer information not available</p>
        </div>
      );
    }

    switch (activeTab) {
      case "Call":
        // Show loader while Call tab data is loading
        if (isLoadingMessages || isFetching) {
          return <PrimaryLoader />;
        }
        return (
          <OrderInfoCard
            orderId={`#${astrologerId.slice(-4)}`}
            date={processedData.firstMessageDate ? new Date(processedData.firstMessageDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }) : "N/A"}
            time={processedData.chatSessions?.[0]?.messages?.[0]?.time || "N/A"}
            duration="N/A"
            amount={processedData.amount || 0}
            rating={0}
            astrologerID={astrologerInfo.astrologer_ID}
          />
        );
      case "Chat":
        // Show loader while Chat tab data is loading
        if (isLoadingMessages) {
          return <PrimaryLoader />;
        }
        return (
          <ChatWindow
            chatSessions={processedData.chatSessions}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isFetching}
          />
        );
      case "Video":
        // Show loader while Video tab data is loading (if API is added in future)
        if (isLoadingMessages || isFetching) {
          return <PrimaryLoader />;
        }
        return (
          <div className={styles.videoList}>
            <div className={styles.emptyState}>
              <p>No video consultations found</p>
            </div>
          </div>
        );
      case "Remedies":
        return <RemediesTab astrologerId={astrologerId} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.orderDetails}>
      {astrologerInfo && (
        <OrderHeader astrologer={astrologerInfo} onBack={handleBack} />
      )}
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.tabContent}>{renderTabContent()}</div>
    </div>
  );
};

export default OrderDetails;

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./OrderDetails.module.scss";
import OrderHeader from "./components/OrderDetails/OrderHeader";
import OrderTabs from "./components/OrderDetails/OrderTabs";
import OrderInfoCard from "./components/OrderDetails/OrderInfoCard";
import ChatWindow from "./components/OrderDetails/ChatWindow";
import RemediesTab from "./components/OrderDetails/RemediesTab";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useGetChatMessagesQuery } from "../../../redux/api/chatApi";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";

const OrderDetails = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Call");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Fetch astrologer details
  const { data: astrologerData, isLoading: isLoadingAstrologer } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId }
  );
  
  // Fetch chat messages from API with pagination
  const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatMessagesQuery({
    astrologerId: astrologerId,
    roomId: "",
    page: page,
  });

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
  const processedData = React.useMemo(() => {
    if (!chatData?.data?.chatHistory) return { chatSessions: [], amount: 0 };
    
    const chatSessions = chatData.data.chatHistory;
    
    if (chatSessions.length === 0) {
      return { chatSessions: [], amount: 0 };
    }
    
    let totalAmount = 0;
    
    // Process each session
    const processedSessions = chatSessions.map((session) => {
      totalAmount += session.amount || 0;
      
      const messages = session.chatHistory?.map((msg) => ({
        id: msg._id,
        sender: msg.sender, // 'user' or 'astrologer'
        message: msg.message || msg.response,
        time: new Date(msg.createdAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "read",
        type: msg.type, // 'message', 'kundli', etc.
        createdAt: msg.createdAt,
      })) || [];
      
      // Sort messages within the room by time (oldest first)
      messages.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA - dateB;
      });
      
      // Get session date and time from first message
      const firstMessage = messages[0];
      const sessionDate = firstMessage ? new Date(firstMessage.createdAt) : new Date();
      
      return {
        roomId: session.roomId,
        sessionId: session._id,
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
        amount: session.amount || 0,
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
  const astrologerInfo = astrologer ? {
    name: `${astrologer.firstName || ""} ${astrologer.lastName || ""}`.trim(),
    experience: astrologer.experience ? `${astrologer.experience} Years` : "N/A",
    image: astrologer.profileImage || "https://via.placeholder.com/40",
    isOnline: astrologer.isActive || false,
    astrologer_ID: astrologer.astrologer_ID,
  } : null;

  const renderTabContent = () => {
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
        return (
          <ChatWindow
            chatSessions={processedData.chatSessions}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isFetching}
          />
        );
      case "Video":
        return (
          <div className={styles.videoList}>
            <div className={styles.emptyState}>
              <p>No video consultations found</p>
            </div>
          </div>
        );
      case "Remedies":
        return <RemediesTab remedies={[]} />;
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

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./OrderDetails.module.scss";
import OrderHeader from "./components/OrderDetails/OrderHeader";
import OrderTabs from "./components/OrderDetails/OrderTabs";
import OrderInfoCard from "./components/OrderDetails/OrderInfoCard";
import ChatWindow from "./components/OrderDetails/ChatWindow";
import RemediesTab from "./components/OrderDetails/RemediesTab";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useGetChatHistoryQuery } from "../../../redux/api/chatApi";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { useGetCallRecordingsQuery } from "../../../redux/api/callHistory/callHistory";

const OrderDetails = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Call");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data: astrologerData, isLoading: isLoadingAstrologer } = useGetAstrologerByIdQuery(
    { id: astrologerId }
  );

  const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatHistoryQuery(
    { userId: astrologerId },
    { refetchOnMountOrArgChange: true }
  );

  const { data: recordingsData, isLoading: isLoadingRecordings } = useGetCallRecordingsQuery(
    astrologerId,
    { skip: !astrologerId }
  );

  // Split recordings into call (audio) and video
  const { callRecordings, videoRecordings } = React.useMemo(() => {
    const list = recordingsData?.data || [];
    const calls = [];
    const videos = [];
    list.forEach((rec) => {
      if (rec.sessionType === "video") {
        videos.push(rec);
      } else {
        calls.push(rec);
      }
    });
    return { callRecordings: calls, videoRecordings: videos };
  }, [recordingsData]);

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
    if (!chatData?.data) return { chatSessions: [], amount: 0 };

    const flatMessages = chatData.data;

    if (!Array.isArray(flatMessages) || flatMessages.length === 0) {
      return { chatSessions: [], amount: 0 };
    }

    const groupedByRoom = {};
    flatMessages.forEach((msg) => {
      const roomId = msg.roomId || "unknown";
      if (!groupedByRoom[roomId]) {
        groupedByRoom[roomId] = [];
      }
      groupedByRoom[roomId].push(msg);
    });

    let totalAmount = 0;

    const processedSessions = Object.entries(groupedByRoom).map(([roomId, roomMessages]) => {
      const messages = roomMessages.map((msg) => ({
        id: msg._id,
        sender: msg.sender,
        message: msg.message || msg.response,
        time: new Date(msg.createdAt).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "read",
        type: msg.type,
        createdAt: msg.createdAt,
        kundliName: msg?.kundliName,
        kundliId: msg?.kundliId,
      }));

      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const firstMessage = messages[0];
      const sessionDate = firstMessage ? new Date(firstMessage.createdAt) : new Date();

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

  const astrologer = astrologerData?.data;

  const astrologerInfo = astrologer ? {
    name: `${astrologer.firstName || ""} ${astrologer.lastName || ""}`.trim(),
    experience: astrologer.experience ? `${astrologer.experience} Years` : "N/A",
    image: astrologer.profileImage || "https://via.placeholder.com/40",
    isOnline: astrologer.isActive || false,
    astrologer_ID: astrologer.astrologer_ID,
  } : null;

  // Helper to format recording data for OrderInfoCard
  const formatRecordingDate = (createdAt) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRecordingTime = (createdAt) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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
        if (isLoadingRecordings) {
          return <PrimaryLoader />;
        }
        if (callRecordings.length === 0) {
          return (
            <div className={styles.emptyState}>
              <p>No call recordings found</p>
            </div>
          );
        }
        return (
          <div className={styles.recordingsList}>
            {callRecordings.map((rec) => (
              <OrderInfoCard
                key={rec.sessionId}
                orderId={rec.orderId || rec.sessionId}
                date={formatRecordingDate(rec.sessionDate)}
                time={formatRecordingTime(rec.sessionDate)}
                duration={rec.duration}
                amount={rec.amount || 0}
                recordingUrl={rec.recordingUrl}
                type="audio"
              />
            ))}
          </div>
        );
      case "Chat":
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
        if (isLoadingRecordings) {
          return <PrimaryLoader />;
        }
        if (videoRecordings.length === 0) {
          return (
            <div className={styles.emptyState}>
              <p>No video consultations found</p>
            </div>
          );
        }
        return (
          <div className={styles.recordingsList}>
            {videoRecordings.map((rec) => (
              <OrderInfoCard
                key={rec.sessionId}
                date={formatRecordingDate(rec.sessionDate)}
                time={formatRecordingTime(rec.sessionDate)}
                duration={rec.duration}
                amount={rec.amount || 0}
                recordingUrl={rec.recordingUrl}
                type="video"
                astrologerName={astrologerInfo.name}
                astrologerImage={astrologerInfo.image}
              />
            ))}
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

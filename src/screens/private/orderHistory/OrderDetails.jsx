import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "./OrderDetails.module.scss";
import OrderHeader from "./components/OrderDetails/OrderHeader";
import OrderTabs from "./components/OrderDetails/OrderTabs";
import OrderInfoCard from "./components/OrderDetails/OrderInfoCard";
import ChatWindow from "./components/OrderDetails/ChatWindow";
import RemediesTab from "./components/OrderDetails/RemediesTab";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { Toast } from "../../../component";
import { useGetChatHistoryQuery, useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { useGetCallRecordingsQuery } from "../../../redux/api/callHistory/callHistory";
import useAstrologerLiveStatus from "../../../hooks/useAstrologerLiveStatus";
import ConnectAstrologerPopup from "../v2/components/ui/ConnectAstrologerPopup";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";
import RechargeModal from "../../../component/recharge-modal/RechargeModal";
import { useChat } from "../../../context/ChatContext";
import { useCall } from "../../../context/CallContext";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { getAstrologerDisplayName } from "../../../utils/helper/string.utils";
import { getAstrologerImageUrl } from "../../../utils/appImages";

const OrderDetails = () => {
  const { astrologerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("shubhtalk_customer_id");
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === "Video" ? "Call" : (location.state?.tab || "Call")
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [connectionType, setConnectionType] = useState(null);
  const [chatRoomIdLocal, setChatRoomIdLocal] = useState(null);
  const [callRoomIdLocal, setCallRoomIdLocal] = useState(null);

  const { handleChatStart, handleCallStart, openModal: hookOpenModal, setOpenModal: hookSetOpenModal, selectedAstrologer: hookSelectedAstrologer, lastConnectionType: hookLastConnectionType, lastIsEmergency: hookLastIsEmergency, hasKundli } = useAstrologerConnect();
  const { setWaitingList, resetChatFlow, setActiveChatRoomId, setActiveChat, setChatSeconds, waitingList: chatWaiting } = useChat();
  const { setWaitingList: setCallWaitingList, resetCallFlow, setActiveCallRoomId, setActiveCall, setOpenReview, setReviewData, waitingList: callWaiting } = useCall();
  const { cancelAllExcept, removePendingConnection, removePendingByAstrologer, cancelAll, assignRoomId } = useWaitingQueue();
  const [createChatRoom] = useCreateChatRoomMutation();
  const activeAstroRef = useRef(null);

  const isWaiting = !!(chatWaiting || callWaiting);
  const waitingRoomId = chatRoomIdLocal || callRoomIdLocal;

  const {
    data: astrologerData,
    isLoading: isLoadingAstrologer,
    refetch: refetchAstrologer,
  } = useGetAstrologerByIdQuery(
    { id: astrologerId }
  );

  // Live status for this astrologer (real-time). Used to disable "Consult Again".
  const { isLive: isAstrologerLive } = useAstrologerLiveStatus(
    astrologerId,
    astrologerData?.data?.astrologerLiveStatus
  );

  const { data: chatData, isLoading: isLoadingMessages, error, isFetching } = useGetChatHistoryQuery(
    { userId: astrologerId, page },
    { refetchOnMountOrArgChange: true }
  );

  const { data: recordingsData, isLoading: isLoadingRecordings, refetch: refetchRecordings } = useGetCallRecordingsQuery(
    astrologerId,
    { skip: !astrologerId }
  );

  // Refetch recordings when a review is submitted
  useEffect(() => {
    const handleReviewSubmitted = () => {
      refetchRecordings();
    };
    window.addEventListener("reviewSubmitted", handleReviewSubmitted);
    return () => window.removeEventListener("reviewSubmitted", handleReviewSubmitted);
  }, [refetchRecordings]);

  // All recordings (audio + video) shown together in the Call tab
  const allRecordings = React.useMemo(() => {
    return recordingsData?.data || [];
  }, [recordingsData]);

  // NOTE: Previously split into separate audio/video lists. Kept for reference.
  // const { callRecordings, videoRecordings } = React.useMemo(() => {
  //   const list = recordingsData?.data || [];
  //   const calls = [];
  //   const videos = [];
  //   list.forEach((rec) => {
  //     if (rec.sessionType === "video") {
  //       videos.push(rec);
  //     } else {
  //       calls.push(rec);
  //     }
  //   });
  //   return { callRecordings: calls, videoRecordings: videos };
  // }, [recordingsData]);

  // Reset pagination when astrologerId changes
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [astrologerId]);

  // Check if there's more data to load based on API pagination
  React.useEffect(() => {
    if (chatData?.pagination) {
      setHasMore(chatData.pagination.hasNextPage === true);
    } else if (chatData && !isFetching) {
      // If no pagination info and not fetching, assume no more data
      setHasMore(false);
    }
  }, [chatData, isFetching]);

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
          hour12: true,
        }),
        // Use the real per-message status the server now returns (sent /
        // delivered / read) instead of hardcoding "read". Falls back to "read"
        // for legacy messages persisted before status tracking existed, so an
        // old transcript still shows the settled double-blue tick it always did.
        status: msg.status || "read",
        deliveredAt: msg.deliveredAt,
        readAt: msg.readAt,
        // Quoted-reply snapshot (guide §2). Rendered as a preview above the
        // bubble; normalized by ChatWindow so text/image/kundli/gift all label
        // correctly.
        replyTo: msg.replyTo || null,
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
          hour12: true,
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

  // Socket listeners for connect flow (same as Profile.jsx)
  useEffect(() => {
    if (!userId) return;

    const handleChatRoom = (data) => {
      setChatRoomIdLocal(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      setCallRoomIdLocal(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setConnectionType(data?.type || "audio");
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5);
    };

    const handleChatAccepted = async ({ roomId, astrologerId: astroId, userId: uid, ...data }) => {
      setWaitingList(false);
      removePendingConnection(roomId);
      const astro = data?.astrologer || activeAstroRef.current || astrologerData?.data || {};
      try {
        if (!roomId) throw new Error("Room ID missing");
        setActiveChat({
          roomId, chatRoomId: roomId,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true, userId: uid, astrologerId: astroId,
          astrologerName: getAstrologerDisplayName(astro),
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);
        navigate(`/chat-to-astrologer/${astroId}`, {
          state: { userId: uid, astrologerId: astroId, fullName: getAstrologerDisplayName(astro), roomId, isUserSide: true, experience: astro?.experience, profileImgUrl: astro?.profileImgUrl },
        });
      } catch (e) {
        Toast.error("Failed to start chat");
      }
    };

    const handleCallAccepted = async ({ roomId, token, channelName, type, remainingTime, ...rest }) => {
      resetCallFlow();
      removePendingConnection(roomId);
      const astro = rest?.astrologer || activeAstroRef.current || astrologerData?.data || {};
      try {
        if (!astro?._id) { Toast.error("Astrologer data missing"); return; }
        const res = await createChatRoom({ userId, astrologerId: astro._id });
        const chatRoomId = res?.data?.data;
        setActiveCall({
          roomId, channelName, chatRoomId, agoraToken: token,
          callerName: getAstrologerDisplayName(astro),
          isUserSide: true, callType: type, userId, astrologerId: astro._id,
          astrologerID: astro?.astrologer_ID, remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
          profileImgUrl: astro?.profileImgUrl,
        });
      } catch (error) {
        Toast.error("Failed to start call");
      }
    };

    const handleRejected = (data) => {
      // Extract roomId and astrologerId — can be at top level or inside sessionData
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }
      Toast.error("Astrologer has rejected the request");
      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    // Server-side rejections (astrologer went offline mid-request, session limit,
    // and so on) arrive on the generic "error" event, not chat:rejected. Without
    // this listener the waiting state stayed up with nothing to explain it — the
    // request looked like it was still connecting forever. AstrologerProfile and
    // Profile both handle it; this screen did not.
    const handleSocketError = (err) => {
      Toast.error(err?.message || "Connection error");
      resetChatFlow();
      resetCallFlow();
      cancelAll();
      setConnectionType(null);
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("error", handleSocketError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("error", handleSocketError);
    };
  }, [userId, astrologerData]);

  const resetWaitingState = useCallback(() => {
    if (connectionType === "chat" && chatRoomIdLocal) {
      voiceSocket.emit("chat:cancel", { roomId: chatRoomIdLocal });
    } else if (callRoomIdLocal) {
      voiceSocket.emit("call:cancel", { roomId: callRoomIdLocal });
    }
    setWaitingList(false);
    setCallWaitingList(false);
    setChatRoomIdLocal(null);
    setCallRoomIdLocal(null);
    setConnectionType(null);
    resetChatFlow();
    resetCallFlow();
  }, [chatRoomIdLocal, callRoomIdLocal, connectionType]);

  const handleBack = () => {
    // If user came from the profile/order history page, navigate back with tab state preserved
    const fromProfile = location.state?.from === "profile" || document.referrer.includes("/profile");
    if (fromProfile || window.history.length <= 2) {
      navigate("/profile", { state: { activeTab: "Order History" } });
    } else {
      navigate(-1);
    }
  };

  const astrologer = astrologerData?.data;

  const astrologerInfo = astrologer ? {
    name: getAstrologerDisplayName(astrologer),
    experience: astrologer.experience ? `${astrologer.experience} Years` : "N/A",
    // OrderInfoCard renders this at 90px (75px under 640px), so ask for the
    // `medium` (250x312) derivative instead of `profileImgUrl`, which points at
    // the unresized original. `astrologer` here is the full object from
    // useGetAstrologerByIdQuery, so the derivatives are genuinely available.
    //
    // Replaces a `profileImgUrl || profileImgUrl` duplicate and a
    // via.placeholder.com fallback — the helper ends on the bundled gendered
    // default, so there's no third-party request when an astrologer has no image.
    image: getAstrologerImageUrl(astrologer, "small"),
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

  const handleConsultAgain = () => {
    if (!astrologer?.isActive && astrologer?.isEmergencyAvailable) {
      setShowEmergencyModal(true);
    } else {
      setIsConnectPopupOpen(true);
    }
  };

  const handleRateConsultation = (roomId) => {
    if (!astrologer) return;

    setReviewData({
      astrologerID: astrologer.astrologer_ID || astrologer._id,
      fullName: getAstrologerDisplayName(astrologer),
      // FeedbackModal renders the avatar at 44px
      profileImage: getAstrologerImageUrl(astrologer, "small"),
      roomId,
    });
    setOpenReview(true);
  };

  const renderTabContent = () => {
    if (isLoadingMessages || isLoadingAstrologer) {
      return <PrimaryLoader fullscreen={false} message="Loading your consultation…" />;
    }

    /*
      These two states used to be a bare sentence each. Combined with the header
      only rendering when `astrologerInfo` exists (see the JSX below), that left
      the screen with no back button and no action of any kind — the only way out
      was the OS back gesture, which is what "quick back clicks" on this route
      look like. The header is now always present, and both states offer a retry.
    */
    if (error) {
      return (
        <div className={styles.errorState}>
          <p>Failed to load order details</p>
          <button type="button" className={styles.stateRetryBtn} onClick={refetchAstrologer}>
            Try again
          </button>
        </div>
      );
    }

    if (!astrologerInfo) {
      return (
        <div className={styles.errorState}>
          <p>Astrologer information not available</p>
          <button type="button" className={styles.stateRetryBtn} onClick={refetchAstrologer}>
            Try again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "Call":
        if (isLoadingRecordings) {
          return <PrimaryLoader />;
        }
        if (allRecordings.length === 0) {
          return (
            <div className={styles.emptyState}>
              <p>No call recordings found</p>
            </div>
          );
        }
        return (
          <div className={styles.recordingsList}>
            {allRecordings.map((rec) => (
              <OrderInfoCard
                key={rec.sessionId}
                orderId={rec.orderId || rec.sessionId}
                date={formatRecordingDate(rec.sessionDate)}
                time={formatRecordingTime(rec.sessionDate)}
                duration={rec.duration}
                amount={rec.amount || 0}
                recordingUrl={rec.recordingUrl}
                type={rec.sessionType === "video" ? "video" : "audio"}
                astrologerName={astrologerInfo.name}
                astrologerImage={astrologerInfo.image}
                astrologerGender={astrologer?.gender}
                initialRating={rec.rating ?? null}
                roomId={rec.roomId || rec.sessionId}
                onRateConsultation={handleRateConsultation}
                onConsultAgain={handleConsultAgain}
                isLive={isAstrologerLive}
              />
            ))}
          </div>
        );
      case "Chat":
        if (isLoadingMessages) {
          return <PrimaryLoader />;
        }
        return (
          <>
            {/*
              Readings frequently open with "without birth details I can only
              give general guidance". The transcript is read-only, so that line
              was the only thing on screen about it and readers click the message
              itself trying to act on it — session recordings show minutes of
              repeat clicks on exactly that text. `hasKundli` was already being
              read from useAstrologerConnect here and never used; this is what it
              was for.
            */}
            {!hasKundli && (
              <div className={styles.birthDetailsPrompt} role="status">
                <p className={styles.birthDetailsPromptText}>
                  Readings stay general until we have your birth details. Add them
                  once and every future consultation is personalised.
                </p>
                <button
                  type="button"
                  className={styles.birthDetailsPromptBtn}
                  onClick={() => navigate("/kundli")}
                >
                  Add birth details
                </button>
              </div>
            )}
            <ChatWindow
              chatSessions={processedData.chatSessions}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={isFetching}
            />
          </>
        );
      case "Remedies":
        return <RemediesTab astrologerId={astrologerId} />;
      // NOTE: Video tab removed — video sessions now render inside "Call" tab.
      // case "Video":
      //   if (isLoadingRecordings) {
      //     return <PrimaryLoader />;
      //   }
      //   if (videoRecordings.length === 0) {
      //     return (
      //       <div className={styles.emptyState}>
      //         <p>No video consultations found</p>
      //       </div>
      //     );
      //   }
      //   return (
      //     <div className={styles.recordingsList}>
      //       {videoRecordings.map((rec) => (
      //         <OrderInfoCard
      //           key={rec.sessionId}
      //           date={formatRecordingDate(rec.sessionDate)}
      //           time={formatRecordingTime(rec.sessionDate)}
      //           duration={rec.duration}
      //           amount={rec.amount || 0}
      //           recordingUrl={rec.recordingUrl}
      //           type="video"
      //           astrologerName={astrologerInfo.name}
      //           astrologerImage={astrologerInfo.image}
      //           initialRating={rec.rating ?? null}
      //           roomId={rec.roomId || rec.sessionId}
      //           onRateConsultation={handleRateConsultation}
      //           onConsultAgain={handleConsultAgain}
      //           isLive={isAstrologerLive}
      //         />
      //       ))}
      //     </div>
      //   );
      default:
        return null;
    }
  };

  return (
    <div className={styles.orderDetails}>
      {/*
        Always rendered, so the back button exists from the first paint.

        This was `{astrologerInfo && <OrderHeader …/>}`, and astrologerInfo is
        null while the astrologer request is in flight — which is every visit to
        this route — and also in both failure states. So the first thing a visitor
        saw here was a loader and a tab strip with nothing to go back with.
        OrderHeader reads only `name`, `image`, `experience` and `isOnline`, so a
        placeholder renders the same chrome without inventing any detail.
      */}
      <OrderHeader
        astrologer={astrologerInfo || { name: "Consultation", experience: "" }}
        onBack={handleBack}
      />
      <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.tabContent}>{renderTabContent()}</div>

      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={() => setIsConnectPopupOpen(false)}
        astrologer={astrologer}
        // The popup passes `isEmergency` as the last argument; forward it, or an
        // emergency session opened from here is started as a normal one and the
        // hook's offline guard rejects it. The hook's chat signature is
        // (astro, checkBalance, isEmergency).
        onChatStart={async (astro, isEmergency = false) => {
          activeAstroRef.current = astro;
          setIsConnectPopupOpen(false);
          const result = await handleChatStart(astro, true, isEmergency);
          if (result?.emergencyAvailable) {
            setShowEmergencyModal(true);
          }
          return result;
        }}
        onCallStart={async (astro, type, isEmergency = false) => {
          activeAstroRef.current = astro;
          setIsConnectPopupOpen(false);
          const result = await handleCallStart(astro, type, isEmergency);
          if (result?.emergencyAvailable) {
            setShowEmergencyModal(true);
          }
          return result;
        }}
        onEmergencyAvailable={() => {
          setIsConnectPopupOpen(false);
          setShowEmergencyModal(true);
        }}
      />

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={astrologer}
        onChatNow={(astro) => {
          setShowEmergencyModal(false);
          activeAstroRef.current = astro;
          handleChatStart(astro, true, true);
        }}
        onCallNow={(astro) => {
          setShowEmergencyModal(false);
          activeAstroRef.current = astro;
          handleCallStart(astro, "audio", true);
        }}
        onVideoNow={(astro) => {
          setShowEmergencyModal(false);
          activeAstroRef.current = astro;
          handleCallStart(astro, "video", true);
        }}
      />

      {/* Recharge Modal for insufficient balance */}
      <RechargeModal
        isOpen={hookOpenModal.recharge}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={hookSelectedAstrologer}
      />
    </div>
  );
};

export default OrderDetails;

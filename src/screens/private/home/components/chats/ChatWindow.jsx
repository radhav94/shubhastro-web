import { useLayoutEffect, useMemo, useState } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { useInactivityTimer } from "../../../../../utils/hooks/useInactivityTimer";
import InactivityModal from "../../../../../component/UI/modal/inActivity/InactivityModal";
import { useCall } from "../../../../../context/CallContext";
import { useRef } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatFooter from "./ChatFooter";
import FloatingActions from "./FloatingActions";
import useChatSocket from "./useChatSocket";
import Feedback from "./Feedback";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
import { Toast } from "../../../../../component";
import dayjs from "dayjs";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

// Import SVG icons
import CallIcon from "../../../../../assets/chat/Call.svg";
import VideocamIcon from "../../../../../assets/chat/Videocam.svg";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");
const MIN_CHAT_SECONDS = 60;

import { useGetS3SignedUrlMutation } from "../../../../../redux/api/s3SignedApi";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import { PATH } from "../../../../../utils/routes/Paths";
import ProfileListingModal from "../../../../../component/UI/Profile/ProfileListingModal";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import GiftModal from "../../../../../component/call/GiftModal";
import { ProfileManager } from "../../../../../component/UI/Profile";

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    userId,
    astrologerId,
    roomId,
    fullName,
    isUserSide,
    kundliId,
    astrologerName,
    refreshKey,
    astroID,
    experience
  } = state || {};

  const { activeCall } = useCall();
  const [openFeedback, setOpenFeedback] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileManagerModal, setShowProfileManagerModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Check if there's an active video call
  const isVideoCallActive = activeCall && activeCall.callType === "video";

  // Get wallet balance
  const { balance, refreshWallet } = useWalletBalance();

  // Fetch kundli profiles
  const { data: profilesData } = useGetAllKundlisQuery();
  const profiles = profilesData?.data || [];

  // Listen for wallet balance updates
  useLayoutEffect(() => {
    const handleBalanceUpdate = () => {
      refreshWallet();
    };

    window.addEventListener("walletBalanceUpdated", handleBalanceUpdate);
    return () => window.removeEventListener("walletBalanceUpdated", handleBalanceUpdate);
  }, [refreshWallet]);

  const {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    sendTyping,
    chatSeconds,
    isMessageDisabled,
    remainingTime,
    handleChatEndedFromServer
  } = useChat({
    userId,
    astrologerId,
    roomId,
    isUserSide,
    kundliId,
    setOpenFeedback,
    astrologerName,
    refreshKey,
  });

  const [message, setMessage] = useState("");

  const {
    waitingPopup: localWaitingPopup,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall
  } = useChatSocket({
    userId,
    astrologerId,
    fullName,
    kundliId,
    roomId,
    isUserSide,
  });

  // Use global waiting list from CallContext
  const { waitingList: globalWaitingList } = useCall();
  const waitingPopup = localWaitingPopup || globalWaitingList;

  const { data } = useGetChatHistoryQuery(
    { userId: astrologerId },
    { refetchOnMountOrArgChange: true }
  );
  const history = data?.data || [];

  const finalMsgs = useMemo(() => {
    const historyMsgs = history.map((item) => {
      // Parse gift messages from history (detect by type === "gift")
      let messageText = item.message || "";
      let giftData = null;
      
      if (item.type === "gift") {
        try {
          const parsed = JSON.parse(messageText);
          messageText = parsed.text;
          giftData = parsed.giftData;
        } catch (e) {
          console.error("Failed to parse gift message from history:", e);
        }
      }
      
      return {
        text: messageText,
        type: item?.type,
        isSender: isUserSide
          ? item.sender === "user"
          : item.sender === "astrologer",
        time: new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        dateTime: item.createdAt,
        giftData: giftData,
      };
    });


    const socket = messages.map((msg, idx) => ({
      id: `socket-${idx}-${msg.time}`,
      text: msg.text,
      isSender: msg.sender,
      time: msg.time,
      type: msg?.type,
      date: msg.date || formatDate(new Date()),
      dateTime: msg.dateTime || new Date().toISOString(),
      giftData: msg?.giftData, // Include gift data from socket messages
    }));


    return [...historyMsgs, ...socket].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [history, messages, isUserSide]);

  const { isInactive, resetTimer } = useInactivityTimer(120000);

  const handleDisconnect = () => {
    try {
      voiceSocket.emit("chat:end", { roomId, endedBy: "CUSTOMER" });
    } catch (error) {
      handleChatEndedFromServer();
      console.log('chat end error', error)
    }
  };

  const handleChatEnd = () => {
    if (remainingTime * 60 - chatSeconds < MIN_CHAT_SECONDS) {
      Toast.error("Chat cannot be ended before 1 minute");
      return false;
    }
    handleDisconnect();
    return true;
  };

  const handleSend = (kundli = null) => {
    if (kundli?._id) {
      const baseUrl = window.location.origin;

      const kundliLink = `${baseUrl}/kundli/${kundli._id}`;
      isUserSide ? sendMessage(kundliLink, 'kundli') : astroReply(kundliLink);

      setMessage("");
      return;
    }

    if (!message.trim()) return;
    isUserSide ? sendMessage(message) : astroReply(message);
    setMessage("");
  };

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    // ALWAYS keep latest message visible
    container.scrollTop = container.scrollHeight;
  }, [finalMsgs.length, isTyping]);

  const user = getUserFromStorage();
  const [addAstrologerReview, { isLoading }] = useAddAstrologerReviewMutation();
  const handleReviewSubmit = async ({ rating, review, anonymous }) => {
    try {
      const isAnonymous = anonymous;
      const res = await addAstrologerReview({
        astrologerID: astroID,
        rating,
        review,
        isAnonymous,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message);
        handleDisconnect();
      } else {
        Toast.error(res.message);
      }

      setOpenFeedback(false);
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  };

  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const sendVoiceMessage = async (blob = null, duration) => {
    const signedUrl = await getS3SignedUrl({
      fileType: blob.type,
    }).unwrap();
    const audioUrl = signedUrl.uploadUrl.split("?")[0];
    const uploadUrl = signedUrl.uploadUrl;
    await uploadFileToS3(uploadUrl, blob);
    // const jsonString = JSON.stringify({
    //   type: "voice",
    //   audioUrl,
    //   duration,
    // });
    const attachType = getAttachType(blob.type);
    sendMessage(audioUrl, attachType);
    setMessage("");
  };

  const sendFiles = async (blob, meta) => {
    const signedUrl = await getS3SignedUrl({
      fileType: blob.type,
    }).unwrap();

    const uploadUrl = signedUrl.uploadUrl;
    const fileUrl = uploadUrl.split("?")[0];

    await uploadFileToS3(uploadUrl, blob);

    //don't remove this below commented code//
    // const jsonString = JSON.stringify({
    //   type: "file",
    //   fileUrl,
    //   fileName: meta.name,
    //   fileType: blob.type,
    //   fileSize: meta.size,
    // });

    const attachType = getAttachType(blob.type);
    sendMessage(fileUrl, attachType);
    setMessage("");
    console.log("FILE UPLOADED URL:", fileUrl);
  };

  const uploadFileToS3 = async (uploadUrl, blob) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type,
      },
    });

    if (!res.ok) {
      throw new Error("S3 upload failed");
    }

    return "success";
  };

  const getAttachType = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'attachment';
    }
  };

  // Floating action handlers
  const handleSwitchProfile = () => {
    setShowProfileManagerModal(true);
  };

  const handleSparkles = () => {
    navigate(PATH.privateRoutes.AI_WOW.path);
  };

  const handleGift = () => {
    setShowGiftModal(true);
  };

  const handleRecharge = () => {
    navigate('/recharge');
  };

  const handleSelectProfile = (profile) => {
    // Send the selected kundli profile
    handleSend(profile);
    setShowProfileModal(false);
  };

  const handleProfileManagerStartCall = (selectedProfile) => {
    // Send the selected kundli profile
    handleSend(selectedProfile);
    setShowProfileManagerModal(false);
  };

  // Auto-end chat when timer reaches 0
  useLayoutEffect(() => {
    if (chatSeconds === 0 && remainingTime > 0) {
      // Timer has reached 0, automatically end the chat
      handleDisconnect();
    }
  }, [chatSeconds, remainingTime]);

  return (
    <>
      <div className={styles.chatPage}>
        <div className={styles.chatWindow}>
          <ChatHeader
            fullName={fullName}
            isTyping={isTyping}
            onBack={() => navigate(-1)}
            onAudioCall={handleAudioCall}
            onVideoCall={handleVideoCall}
            disabled={!!activeCall}
            walletBalance={balance || 0}
            experience={experience}
            remainingTime={chatSeconds > 0 ? chatSeconds : 0}
            onRecharge={handleRecharge}
            isVideoCallActive={isVideoCallActive}
            onChatEnd={handleChatEnd}
          />

          {/* Call Buttons Below Header */}
          <div className={styles.callButtonsContainer}>
            <button
              className={styles.voiceCallButton}
              onClick={handleAudioCall}
              disabled={!!activeCall}
            >
              <img src={CallIcon} alt="Voice Call" width="20" height="20" />
              Voice Call
            </button>

            <span className={styles.dividerLine}></span>
            
            <button
              className={styles.videoCallButton}
              onClick={handleVideoCall}
              disabled={!!activeCall}
            >
              <img src={VideocamIcon} alt="Video Call" width="20" height="20" />
              Video Call
            </button>
          </div>

          <div className={styles.messagesContainer}>
            <ChatMessages
              messages={finalMsgs}
              isTyping={isTyping}
              error={error}
              messagesRef={messagesRef}
            />

            <FloatingActions
              onShuffle={handleSwitchProfile}
              onSparkles={handleSparkles}
              onGift={handleGift}
            />
          </div>

          {(!isMessageDisabled || isVideoCallActive) && (
            <ChatInput
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                sendTyping();
              }}
              onSend={handleSend}
              isMessageDisabled={isMessageDisabled && !isVideoCallActive}
              onChatEnd={handleChatEnd}
              setOpen={setOpenFeedback}
              sendVoiceMessage={sendVoiceMessage}
              sendFiles={sendFiles}
            />
          )}

          {/* {!isVideoCallActive && (
            <ChatFooter 
              remainingTime={chatSeconds > 0 ? chatSeconds : 0}
              onRecharge={handleRecharge}
            />
          )} */}

          {/* {waitingPopup && (
            <WaitingPopup open={waitingPopup} onCancel={handleCancelCall} />
          )} */}

          {!isMessageDisabled && <InactivityModal
            isOpen={isInactive}
            onDisconnect={handleChatEnd}
            onContinue={resetTimer}
          />}

          <Feedback
            open={openFeedback}
            onClose={() => setOpenFeedback(false)}
            handleSubmit={handleReviewSubmit}
            ratedUserName={fullName}
            reviewerName={user?.firstName || "User"}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Render modal outside overflow containers */}
      {/* <ProfileListingModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profiles={profiles}
        selectedProfileId={kundliId}
        onSelectProfile={handleSelectProfile}
        title="Select Kundli Profile"
        showAddButton={false}
        showDeleteButton={false}
      /> */}

      <ProfileManager
        isOpen={showProfileManagerModal}
        onClose={() => setShowProfileManagerModal(false)}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile"
        callModeBtnTitle="Continue"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Gift Modal */}
      <GiftModal
        isOpen={showGiftModal}
        onClose={() => {
          setShowGiftModal(false);
          // Refresh wallet balance when modal closes
          refreshWallet();
        }}
        astrologerId={astrologerId}
        astrologerName={fullName}
        roomId={roomId}
        userId={userId}
      />
    </>
  );
};

export default ChatWindow;

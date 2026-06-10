import { useLayoutEffect, useMemo, useState, useRef, useEffect } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { useInactivityTimer } from "../../../../../utils/hooks/useInactivityTimer";
import InactivityModal from "../../../../../component/UI/modal/inActivity/InactivityModal";
import { useCall } from "../../../../../context/CallContext";

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
import SwitchWaitingPopup from "../../../../../component/UI/switchWaiting/SwitchWaitingPopup";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import { PATH } from "../../../../../utils/routes/Paths";
import ProfileListingModal from "../../../../../component/UI/Profile/ProfileListingModal";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import GiftModal from "../../../../../component/call/GiftModal";
import { ProfileManager } from "../../../../../component/UI/Profile";
import { useChat as useChatContext } from "../../../../../context/ChatContext";
import RechargeModal from "../../../../../component/recharge-modal/RechargeModal";

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
    experience,
    profileImgUrl: stateProfileImgUrl,
    gender: stateGender
  } = state || {};
  // console.log('kundliId in chat', kundliId)

  const { activeCall, isCallMinimized, reviewData } = useCall();
  const [openFeedback, setOpenFeedback] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileManagerModal, setShowProfileManagerModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const { activeChat, isReconnecting } = useChatContext();

  // Resolve profileImgUrl: prefer route state, fallback to activeChat context or query param
  const profileImgUrl = stateProfileImgUrl || activeChat?.profileImgUrl || (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("profileImgUrl") || "";
    } catch { return ""; }
  })();

  // Check if there's an active call (audio or video)
  const isVideoCallActive = activeCall && activeCall.callType === "video" && !isCallMinimized;
  const isAudioCallActive = activeCall && activeCall.callType === "audio";
  const isCallActive = !!activeCall;
  const isChatActive = activeChat && activeChat.roomId;

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
    handleTextChange,
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
    fullName,
    refreshKey,
  });

  const [message, setMessage] = useState("");

  const {
    waitingPopup: localWaitingPopup,
    switchType,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall,
  } = useChatSocket({
    userId,
    astrologerId,
    fullName,
    kundliId,
    roomId,
    isUserSide,
    astroID,
    experience,
    profileImgUrl,
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
          hour12: true,
        }).toUpperCase(),
        dateTime: item.createdAt,
        giftData: giftData,
        kundliName: item?.kundliName,
        suggestedProducts: item?.suggestedProducts,
        kundliId: item?.kundliId,
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
      kundliName: msg?.kundliName,
      suggestedProducts: msg?.suggestedProducts,
      kundliId: msg?.kundliId,
    }));


    return [...historyMsgs, ...socket].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [history, messages, isUserSide]);

  const { isInactive, resetTimer } = useInactivityTimer(120000, !!activeCall);

  const handleDisconnect = () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      voiceSocket.emit("chat:end", { roomId, endedBy: "CUSTOMER" });
      
      // Refresh wallet balance after chat ends
      refreshWallet();
      window.dispatchEvent(new Event("walletBalanceUpdated"));
    } catch (error) {
      handleChatEndedFromServer();
      console.log('chat end error', error)
    }
  };

  const handleChatEnd = () => {
    if (isEnding) return false;
    
    // Check if a call/video call is active — prevent ending chat
    if (isCallActive) {
      const callType = activeCall?.callType === "video" ? "Video Call" : "Voice Call";
      Toast.error(`${callType} is active. Please end the ${callType} first before ending the chat.`);
      return false;
    }
    
    // Primary: use wall-clock time from session start (persisted in localStorage)
    const chatStartTime = localStorage.getItem("shubhtalk_chat_start_time");
    const wallClockElapsed = chatStartTime 
      ? Math.floor((Date.now() - Number(chatStartTime)) / 1000)
      : 0;
    
    // Secondary: calculate from timer if wall-clock not available
    const initialRemainingMinutes = activeChat?.remainingTime || remainingTime || 0;
    const totalSessionSeconds = initialRemainingMinutes * 60;
    const timerBasedElapsed = totalSessionSeconds > 0 ? totalSessionSeconds - chatSeconds : 0;
    
    // Use wall-clock as primary (more reliable), fall back to timer-based
    const effectiveElapsed = wallClockElapsed > 0 ? wallClockElapsed : timerBasedElapsed;

    // Show confirmation popup instead of ending directly
    setShowEndChatConfirm(true);
    return false;
  };

  const confirmEndChat = () => {
    setShowEndChatConfirm(false);
    handleDisconnect();
  };

  const handleSend = (kundli = null) => {
    if (kundli?._id) {
      isUserSide ? sendMessage(kundli._id, 'kundli', kundli?._id) : astroReply(kundli._id);

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
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    try {
      // Use astroID from location state, fall back to activeCall or reviewData
      const reviewAstrologerID = astroID || activeCall?.astrologerID || activeCall?.astrologerId || reviewData?.astrologerID || reviewData?.astrologer_ID;
      
      if (!reviewAstrologerID) {
        Toast.error("Something went wrong. Please try again.");
        setOpenFeedback(false);
        return;
      }

      const res = await addAstrologerReview({
        astrologerID: reviewAstrologerID,
        rating,
        review,
        isAnonymous,
        roomId,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message || "Review submitted successfully");
        if (isChatActive && !isMessageDisabled) {
          handleDisconnect();
        }
      } else {
        Toast.error("Something went wrong. Please try again.");
      }

      setOpenFeedback(false);
    } catch (error) {
      console.error("Failed to submit review", error);
      Toast.error("Something went wrong. Please try again.");
      setOpenFeedback(false);
    }
  };

  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const sendVoiceMessage = async (blob = null, duration) => {
    // Upload in background — don't block the chat UI
    (async () => {
      try {
        // Request .m4a URL from S3 — use audio/x-m4a so backend generates .m4a extension
        const signedUrl = await getS3SignedUrl({
          fileType: "audio/x-m4a",
        }).unwrap();
        const audioUrl = signedUrl.uploadUrl.split("?")[0];
        const uploadUrl = signedUrl.uploadUrl;
        // Re-wrap blob with matching MIME type so S3 Content-Type header matches the signed URL
        const m4aBlob = new Blob([blob], { type: "audio/x-m4a" });
        await uploadFileToS3(uploadUrl, m4aBlob);
        sendMessage(audioUrl, "audio");
      } catch (err) {
        console.error("Voice upload failed:", err);
        Toast.error("Failed to send voice message");
      }
    })();
    setMessage("");
  };

  const sendFiles = async (blob, meta) => {
    // Extract file extension from original name for proper S3 key
    const ext = meta?.name?.split('.').pop();
    const fileType = ext && ext !== meta?.name ? `application/${ext}` : blob.type;
    
    const signedUrl = await getS3SignedUrl({
      fileType,
    }).unwrap();

    const uploadUrl = signedUrl.uploadUrl;
    const fileUrl = uploadUrl.split("?")[0];

    await uploadFileToS3(uploadUrl, blob);

    const attachType = getAttachType(blob.type);
    // Send as JSON with fileName so display can show proper name and icon
    const messagePayload = attachType === "image" || attachType === "video" || attachType === "audio"
      ? fileUrl
      : JSON.stringify({ url: fileUrl, fileName: meta?.name || `file.${ext}` });
    sendMessage(messagePayload, attachType);
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
    setIsRechargeModalOpen(true);
  };

  const handleRechargeSuccess = (paymentData) => {
    console.log('Payment successful in chat:');
    // Wallet balance is already refreshed by the modal
    refreshWallet();
  };

  const handleSelectProfile = (profile) => {
    // Send the selected kundli profile
    handleSend(profile);
    setShowProfileModal(false);
  };

  const handleProfileManagerStartCall = (selectedProfile) => {
    console.log('selectedProfile :>> ', selectedProfile);
    // Send the selected kundli profile
    handleSend(selectedProfile);
    setShowProfileManagerModal(false);
  };

  // Redirect to home when chat ends or voice/video call ends while on chat window
  const prevActiveCallRef = useRef(activeCall);
  const prevChatActiveRef = useRef(isChatActive);
  const prevFeedbackRef = useRef(openFeedback);
  useEffect(() => {
    const hadCall = prevActiveCallRef.current;
    const hadChat = prevChatActiveRef.current;
    const hadFeedback = prevFeedbackRef.current;
    prevActiveCallRef.current = activeCall;
    prevChatActiveRef.current = isChatActive;
    prevFeedbackRef.current = openFeedback;

    // Don't redirect while feedback modal is open
    if (openFeedback) return;

    // Feedback just closed and no active session → redirect home
    if (hadFeedback && !openFeedback && !isChatActive && !activeCall) {
      navigate(PATH.privateRoutes.HOME.path, { replace: true });
      return;
    }

    // Chat was active and just ended → redirect home
    if (hadChat && !isChatActive && !activeCall) {
      navigate(PATH.privateRoutes.HOME.path, { replace: true });
      return;
    }

    // Voice/video call was active and just ended, no active chat → redirect home
    if (hadCall && !activeCall && !isChatActive) {
      navigate(PATH.privateRoutes.HOME.path, { replace: true });
    }
  }, [activeCall, isChatActive, openFeedback, navigate]);

  // Auto-end chat when timer reaches 0
  useLayoutEffect(() => {
    if (chatSeconds === 0 && remainingTime > 0) {
      // Timer has reached 0, automatically end the chat
      handleDisconnect();
    }
  }, [chatSeconds, remainingTime]);

  return (
    <>
      <SwitchWaitingPopup
        isVisible={localWaitingPopup}
        switchType={switchType || "audio"}
        onCancel={handleCancelCall}
      />
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
            isChatActive={isChatActive}
            isEnding={isEnding || waitingPopup}
            profileImgUrl={profileImgUrl}
            gender={stateGender || activeChat?.gender}
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
              astrologerName={astrologerName || fullName}
              customerName={user?.firstName}
            />

            <FloatingActions
              onShuffle={handleSwitchProfile}
              onSparkles={handleSparkles}
              onGift={handleGift}
            />
          </div>

          {(!isMessageDisabled || isCallActive) && (
            <ChatInput
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTextChange();
              }}
              onSend={handleSend}
              isMessageDisabled={isMessageDisabled && !isCallActive}
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
            profileImgUrl={profileImgUrl || reviewData?.profileImage || reviewData?.profileImgUrl}
            loading={isLoading}
          />

          {isReconnecting && (
            <div className={styles.reconnectOverlay}>
              <div className={styles.reconnectModal}>
                <div className={styles.reconnectSpinner}>
                  <svg viewBox="0 0 50 50" className={styles.spinnerSvg}>
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="url(#reconnectGradientChat)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="80, 200"
                      className={styles.spinnerCircle}
                    />
                    <defs>
                      <linearGradient id="reconnectGradientChat" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F75801" />
                        <stop offset="100%" stopColor="#D43400" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h3 className={styles.reconnectTitle}>Connection lost...</h3>
                <p className={styles.reconnectText}>
                  Please wait while we restore your chat connection...
                </p>
              </div>
            </div>
          )}
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

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onSuccess={handleRechargeSuccess}
        title="Recharge to Continue Chat"
      />

      {/* End Chat Confirmation Modal */}
      {showEndChatConfirm && (
        <div className={styles.endChatConfirmOverlay} onClick={() => setShowEndChatConfirm(false)}>
          <div className={styles.endChatConfirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.endChatConfirmTitle}>End Chat?</h3>
            <p className={styles.endChatConfirmText}>
              Are you sure you want to end this chat session with {fullName || "the astrologer"}?
            </p>
            <div className={styles.endChatConfirmActions}>
              <button className={styles.endChatBtnCancel} onClick={() => setShowEndChatConfirm(false)}>
                Continue Chat
              </button>
              <button className={styles.endChatBtnConfirm} onClick={confirmEndChat}>
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow;

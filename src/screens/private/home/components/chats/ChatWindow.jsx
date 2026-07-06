import { useLayoutEffect, useMemo, useState, useRef, useEffect, useCallback } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { trackEvent } from "../../../../../utils/analytics";
import { Toast } from "../../../../../component";
import dayjs from "dayjs";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

// Import SVG icons
import CallIcon from "../../../../../assets/chat/Call.svg";
import VideocamIcon from "../../../../../assets/chat/Videocam.svg";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");
const MIN_CHAT_SECONDS = 0;

import { useGetS3SignedUrlMutation } from "../../../../../redux/api/s3SignedApi";
import { useGetAstrologerByIdQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import SwitchWaitingPopup from "../../../../../component/UI/switchWaiting/SwitchWaitingPopup";
import { useWalletBalance } from "../../../wallet/useWalletBalance";
import { PATH } from "../../../../../utils/routes/Paths";
import ProfileListingModal from "../../../../../component/UI/Profile/ProfileListingModal";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import GiftModal from "../../../../../component/call/GiftModal";
import { ProfileManager } from "../../../../../component/UI/Profile";
import { useChat as useChatContext } from "../../../../../context/ChatContext";
import RechargeModal from "../../../../../component/recharge-modal/RechargeModal";
import useAstrologerAvailability from "../../../../../utils/hooks/useAstrologerAvailability";

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const chatPageRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id: urlAstrologerId } = useParams();
  const {
    userId,
    astrologerId: stateAstrologerId,
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
  const astrologerId = stateAstrologerId || urlAstrologerId;
  // console.log('kundliId in chat', kundliId)

  const { activeCall, isCallMinimized, reviewData } = useCall();
  const [openFeedback, setOpenFeedback] = useState(false);

  // Astrologer availability (chat/call/video) for the connected session.
  // Used to hide the Voice/Video buttons when the astrologer disabled them.
  const astroAvailability = useAstrologerAvailability(astrologerId, {
    enabled: !!isUserSide,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileManagerModal, setShowProfileManagerModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const { activeChat, isReconnecting } = useChatContext();

  // Capture astrologerID (numeric) for review submission - persists after activeChat is cleared
  const lastAstrologerIDRef = useRef(astroID || null);
  useEffect(() => {
    if (activeChat?.astrologerID) {
      lastAstrologerIDRef.current = activeChat.astrologerID;
    }
  }, [activeChat?.astrologerID]);

  // Fetch astrologer profile to get the correct/up-to-date avatar
  const { data: astrologerProfileData } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId }
  );

  // Resolve profileImgUrl: prefer fresh API data; only use fallbacks while API is loading
  const profileImgUrl = astrologerProfileData
    ? (astrologerProfileData?.data?.profileImgUrl || "")
    : (stateProfileImgUrl || activeChat?.profileImgUrl || (() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get("profileImgUrl") || "";
        } catch { return ""; }
      })());

  // Resolve gender from fetched data
  const gender = astrologerProfileData?.data?.gender || stateGender || activeChat?.gender;

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

  // iOS/Android keyboard fix: resize chatPage based on viewport changes
  useEffect(() => {
    if (!chatPageRef.current) return;

    // Only apply on mobile (touch devices)
    const isMobile = window.innerWidth <= 1180;
    if (!isMobile) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Use visualViewport API — iOS ignores interactive-widget meta,
      // so visualViewport.height reflects the visible area above the keyboard
      const viewport = window.visualViewport;
      if (!viewport) return;

      const onResize = () => {
        if (!chatPageRef.current) return;
        const currentHeight = viewport.height;
        const fullHeight = window.screen.height;
        const keyboardOpen = currentHeight < fullHeight * 0.75;

        if (keyboardOpen) {
          chatPageRef.current.style.height = `${currentHeight}px`;
          chatPageRef.current.style.bottom = 'auto';
        } else {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      viewport.addEventListener('resize', onResize);
      viewport.addEventListener('scroll', onResize);

      return () => {
        viewport.removeEventListener('resize', onResize);
        viewport.removeEventListener('scroll', onResize);
        if (chatPageRef.current) {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
      };
    } else if (isAndroid) {
      // Android with resizes-content: the window itself resizes when keyboard opens.
      // position:fixed elements relative to layout viewport get pushed up correctly,
      // but we need to update height to match the new window size.
      const onResize = () => {
        if (!chatPageRef.current) return;
        const newHeight = window.innerHeight;
        // On Android with resizes-content, innerHeight shrinks when keyboard opens
        chatPageRef.current.style.height = `${newHeight - 53}px`; // subtract top header
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      // Set initial
      onResize();

      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        if (chatPageRef.current) {
          chatPageRef.current.style.height = '';
          chatPageRef.current.style.bottom = '0';
        }
      };
    }
  }, []);

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

  // Only show waiting popup if it's a local switch request from this chat,
  // not a global waiting list from other pending connections
  const waitingPopup = localWaitingPopup;

  const [historyPage, setHistoryPage] = useState(1);
  const isLoadingMoreRef = useRef(false);
  const prevScrollHeightRef = useRef(null);

  const { data, isFetching: isHistoryFetching } = useGetChatHistoryQuery(
    { userId: astrologerId, page: historyPage },
    { refetchOnMountOrArgChange: true }
  );
  const history = data?.data || [];
  const pagination = data?.pagination || {};
  const hasMoreHistory = pagination.hasNextPage ?? (historyPage < (pagination.totalPages || 1));

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

  // Load older messages when scrolling to top
  const handleMessagesScroll = useCallback(() => {
    if (!messagesRef.current || isLoadingMoreRef.current || isHistoryFetching || !hasMoreHistory) return;
    if (messagesRef.current.scrollTop < 80) {
      isLoadingMoreRef.current = true;
      prevScrollHeightRef.current = messagesRef.current.scrollHeight;
      setHistoryPage((prev) => prev + 1);
    }
  }, [isHistoryFetching, hasMoreHistory]);

  // Restore scroll position after older messages are prepended
  useLayoutEffect(() => {
    if (!isLoadingMoreRef.current || !prevScrollHeightRef.current) return;
    if (isHistoryFetching) return;

    const container = messagesRef.current;
    if (container) {
      const newScrollTop = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = newScrollTop;
      prevScrollHeightRef.current = null;
      isLoadingMoreRef.current = false;
    }
  }, [history, isHistoryFetching]);

  // Auto-scroll to bottom ONLY for new real-time messages or typing indicator
  const prevSocketCountRef = useRef(messages.length);
  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    // Only scroll to bottom if socket messages count actually increased
    if (messages.length > prevSocketCountRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    prevSocketCountRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom when typing indicator appears
  useLayoutEffect(() => {
    if (!isTyping) return;
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [isTyping]);

  // On initial mount / first history load, scroll to bottom once
  const initialScrollDoneRef = useRef(false);
  useLayoutEffect(() => {
    if (initialScrollDoneRef.current) return;
    if (history.length > 0 && !isHistoryFetching) {
      const container = messagesRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        initialScrollDoneRef.current = true;
      }
    }
  }, [history, isHistoryFetching]);

  const { isInactive, resetTimer } = useInactivityTimer(120000, !!activeCall);

  const handleDisconnect = () => {
    if (isEnding) return;
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
    if (isUserSide) {
      trackEvent("session_message_sent", { astrologer_id: astroID || activeChat?.astrologerId, session_id: activeChat?.roomId });
    }
    setMessage("");
  };

  const user = getUserFromStorage();
  const [addAstrologerReview, { isLoading }] = useAddAstrologerReviewMutation();
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    try {
      // Use astroID from location state, fall back to captured ref, activeChat, activeCall, or reviewData
      const reviewAstrologerID = astroID || lastAstrologerIDRef.current || activeChat?.astrologerID || activeCall?.astrologerID || activeCall?.astrologerId || reviewData?.astrologerID || reviewData?.astrologer_ID;
      
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
  const sendVoiceMessage = async (blob = null, duration, mimeType) => {
    // Upload in background — don't block the chat UI
    (async () => {
      try {
        // Label the upload by the actual recorded format. Recording as mp4 but
        // uploading as .x-m4a (the old behaviour) breaks playback on iOS when
        // the device actually recorded webm.
        const recordedType = mimeType || blob?.type || "audio/mp4";
        const isM4a = recordedType.includes("mp4");
        const fileType = isM4a ? "audio/x-m4a" : "audio/webm";

        const signedUrl = await getS3SignedUrl({ fileType }).unwrap();
        const audioUrl = signedUrl.uploadUrl.split("?")[0];
        const uploadUrl = signedUrl.uploadUrl;
        // Re-label the blob so the S3 Content-Type matches the signed file type
        // (bytes are unchanged).
        const uploadBlob = new Blob([blob], { type: fileType });
        await uploadFileToS3(uploadUrl, uploadBlob);
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
  const openFeedbackRef = useRef(openFeedback);
  openFeedbackRef.current = openFeedback;
  useEffect(() => {
    const hadCall = prevActiveCallRef.current;
    const hadChat = prevChatActiveRef.current;
    const hadFeedback = prevFeedbackRef.current;
    prevActiveCallRef.current = activeCall;
    prevChatActiveRef.current = isChatActive;
    prevFeedbackRef.current = openFeedback;

    // Don't redirect while feedback modal is open
    if (openFeedback) return;

    // Feedback just closed and no active session → redirect to astrologers list
    if (hadFeedback && !openFeedback && !isChatActive && !activeCall) {
      navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
      return;
    }

    // Chat was active and just ended → redirect to astrologers list
    // Use a short delay to allow feedback modal state to settle (e.g. report-triggered end)
    if (hadChat && !isChatActive && !activeCall) {
      const timer = setTimeout(() => {
        if (!openFeedbackRef.current) {
          navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    // Voice/video call was active and just ended, no active chat → redirect to astrologers list
    if (hadCall && !activeCall && !isChatActive) {
      navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, { replace: true });
    }
  }, [activeCall, isChatActive, openFeedback, navigate]);

  // Auto-end chat when timer reaches 0
  // Use a ref to track if timer was ever started (to avoid ending on initial mount/refresh)
  const timerStartedRef = useRef(false);
  useLayoutEffect(() => {
    if (chatSeconds > 0) {
      timerStartedRef.current = true;
    }
    if (chatSeconds === 0 && remainingTime > 0 && timerStartedRef.current) {
      // Timer has counted down to 0, automatically end the chat
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
      <div className={styles.chatPage} ref={chatPageRef}>
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
            gender={gender}
          />

          {/* Call Buttons Below Header */}
          {(astroAvailability.call || astroAvailability.video) && (
            <div className={styles.callButtonsContainer}>
              {astroAvailability.call && (
                <button
                  className={styles.voiceCallButton}
                  onClick={handleAudioCall}
                  disabled={!!activeCall}
                >
                  <img src={CallIcon} alt="Voice Call" width="20" height="20" />
                  Voice Call
                </button>
              )}

              {astroAvailability.call && astroAvailability.video && (
                <span className={styles.dividerLine}></span>
              )}

              {astroAvailability.video && (
                <button
                  className={styles.videoCallButton}
                  onClick={handleVideoCall}
                  disabled={!!activeCall}
                >
                  <img src={VideocamIcon} alt="Video Call" width="20" height="20" />
                  Video Call
                </button>
              )}
            </div>
          )}

          <div className={styles.messagesContainer}>
            <ChatMessages
              messages={finalMsgs}
              isTyping={isTyping}
              error={error}
              messagesRef={messagesRef}
              astrologerName={astrologerName || fullName}
              customerName={user?.firstName}
              onScroll={handleMessagesScroll}
              isLoadingMore={isHistoryFetching && historyPage > 1}
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
            profileImgUrl={profileImgUrl}
            loading={isLoading}
            gender={gender}
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

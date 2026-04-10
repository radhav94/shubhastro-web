import { useState, useRef, useEffect } from "react";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import "./styles/videoBox.scss";
import { useLiveViewLogic } from "./useLiveViewLogic";
import GiftPopup from "./GiftPopup";
import CallRequestPopup from "./CallRequestPopup";
import SharePopup from "./SharePopup";
import { useReelScroll } from "./useReelScroll";

import { useNavigate } from "react-router-dom";

import { useGetAllGiftsQuery } from "../../../../../redux/api/gift/giftApi";
import { useLiveList } from "../../../../../context/LiveListContext";
import { useCall } from "../../../../../context/CallContext";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import WaitingModal from "../../../../../component/UI/modal/waitingModal/WaitingModal";
import Toast from "../../../../../component/toast";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { PATH } from "../../../../../utils/routes/Paths";

import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";
import { AppImages } from "../../../../../utils/appImages";
import {
  useCheckFollowingStatusQuery,
  useFollowAstrologerByIdMutation,
  useUnfollowAstrologerByIdMutation,
} from "../../../../../redux/api/astrologer/followAstrologerApi";
import { useGetAstrologerByIdQuery } from "../../../../../redux/api/astrologer/astrologerApi";

const FixedLayer = ({ children }) => {
  return createPortal(children, document.body);
};

const LiveView = (props) => {
  console.log("propssssss", props);
  const {
    ROLE,
    isConnected,
    localMicrophoneTrack,
    localCameraTrack,
    remoteUsers,
    micOn,
    setMic,
    cameraOn,
    setCamera,
    setCalling,
    messages,
    chatInput,
    setChatInput,
    participantCount,
    hostLeft,
    astrologer,
    handleLeave,
    roomReady,
    liveStartedAt,
    isHostMuted,
  } = props;

  const [showGifts, setShowGifts] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [pendingCallType, setPendingCallType] = useState("audio");
  const [roomEnded, setRoomEnded] = useState(false);
  const [wasRoomReady, setWasRoomReady] = useState(false);
  const [connectingTimedOut, setConnectingTimedOut] = useState(false);
  const [liveDuration, setLiveDuration] = useState("00:00");

  // Reset ended state when switching to a new channel
  // Use a counter to invalidate stale roomReady changes from old channels
  const [channelGeneration, setChannelGeneration] = useState(0);
  const channelGenRef = useRef(0);

  useEffect(() => {
    if (!props.channel) return;
    setRoomEnded(false);
    setWasRoomReady(false);
    setConnectingTimedOut(false);
    setLiveDuration("00:00");
    const gen = channelGenRef.current + 1;
    channelGenRef.current = gen;
    setChannelGeneration(gen);
  }, [props.channel]);

  // If no remote users appear within 10s of connecting, show "waiting" instead of "connecting"
  useEffect(() => {
    if (remoteUsers?.length > 0 || hostLeft || roomEnded) {
      setConnectingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setConnectingTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [remoteUsers?.length, hostLeft, roomEnded, props.channel]);

  // Live duration timer — ticks every second while stream is active
  // Use startedAt from REST API (api/users/live-users)
  const effectiveStartedAt = astrologer?.startedAt ? Number(astrologer.startedAt) : null;

  useEffect(() => {
    if (!effectiveStartedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - effectiveStartedAt) / 1000);
      const hrs = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      const pad = (n) => String(n).padStart(2, "0");
      if (hrs > 0) {
        setLiveDuration(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      } else {
        setLiveDuration(`${pad(mins)}:${pad(secs)}`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [effectiveStartedAt]);

  const { 
    activeCall, 
    setLastRequestedAstro, 
    setActiveCall, 
    setCallSeconds,
    callSeconds,
    resetCallFlow, 
    setActiveCallRoomId,
    setLastSelectedKundli,
    setLastCallType,
    isCallMinimized,
    setIsCallMinimized,
  } = useCall();

  // Auto-minimize call if user is on live stream (handles page refresh)
  useEffect(() => {
    if (activeCall) {
      setIsCallMinimized(true);
    }
  }, [activeCall, setIsCallMinimized]);
  
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = localStorage.getItem("shubhtalk_customer_token");

  // Ensure voiceSocket is connected for call features
  useEffect(() => {
    if (!userIdLocal || !token) return;
    if (!voiceSocket.connected) {
      voiceSocket.io.opts.query = {
        userId: userIdLocal,
        role: "CUSTOMER",
      };
      voiceSocket.connect();
    }
  }, [userIdLocal, token]);

  const [callRoomId, setCallRoomId] = useState(null);
  const [callWaitingList, setCallWaitingList] = useState(null);
  const astrologerRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  
  const [createChatRoom] = useCreateChatRoomMutation();
  const [getBalance] = useGetBalanceMutation();

  // Follow/unfollow astrologer
  const astrologerId = astrologer?._id || astrologer?.astrologerId;

  // Check if the active call belongs to the current live stream astrologer
  const isCallForCurrentAstrologer = activeCall && isCallMinimized && activeCall.astrologerId === astrologerId;

  // Fetch full astrologer details (profile pic, call rates)
  const { data: astrologerFullData } = useGetAstrologerByIdQuery(
    { id: astrologerId },
    { skip: !astrologerId }
  );
  const fullAstro = astrologerFullData?.data;

  const { data: followingData } = useCheckFollowingStatusQuery(
    { astrologerId },
    { skip: !astrologerId }
  );
  const isFollowing = followingData?.data?.some(
    (item) => item.astrologerId === astrologerId && item.isFollowing === true
  ) || false;
  const [followAstrologer, { isLoading: followLoading }] = useFollowAstrologerByIdMutation();
  const [unfollowAstrologer, { isLoading: unfollowLoading }] = useUnfollowAstrologerByIdMutation();

  const handleFollow = async () => {
    if (!astrologerId) return;
    try {
      if (!isFollowing) {
        await followAstrologer({ astrologerId }).unwrap();
        Toast.success(`You are now following ${astrologer?.astrologerName || "this astrologer"}`);
      } else {
        await unfollowAstrologer({ astrologerId }).unwrap();
        Toast.success(`Unfollowed ${astrologer?.astrologerName || "this astrologer"}`);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      Toast.error("Something went wrong");
    }
  };

  // Fetch user's kundli profiles for validation
  const { data: kundliData } = useGetAllKundlisQuery(undefined, {
    skip: !token || !userIdLocal,
  });
  const profiles = kundliData?.data || [];

  // Normalize socket messages (message → text, userType → role, userName → sender)
  const normalizedMessages = messages
    ?.map((m) => {
      // Handle gift messages
      if (m.type === "gift") {
        let giftData = null;
        let giftText = "";
        const senderName = m.sender || m.userName || "Someone";
        
        // Parse gift data from message
        if (typeof m.message === "string") {
          try {
            const parsed = JSON.parse(m.message);
            giftText = parsed.text || "";
            giftData = parsed.giftData;
          } catch {
            giftText = m.message;
          }
        } else if (typeof m.message === "object") {
          giftData = m.message?.giftData || m.message;
          giftText = m.message?.text || "";
        }

        return {
          ...m,
          text: giftText || `${senderName} sent a gift`,
          role: m.role || m.userType,
          sender: senderName,
          isGift: true,
          giftData: giftData,
        };
      }
      // Handle system messages (join/leave)
      if (m.type === "system") {
        return {
          ...m,
          role: "system",
          sender: null,
          isSystem: true,
        };
      }
      return {
        ...m,
        text: m.text || (typeof m.message === "string" ? m.message : m.message?.text || ""),
        role: m.role || m.userType,
        sender: m.sender || m.userName,
      };
    }) || [];
  const displayMessages = normalizedMessages;

  const liveListCtx = useLiveList();
  const reelRef = useRef(null);
  const navigate = useNavigate();

  useReelScroll({
    enabled: !!liveListCtx && ROLE !== "host",
    containerRef: reelRef,
    onNext: liveListCtx?.goNextLive,
    onPrev: liveListCtx?.goPrevLive,
  });

  console.log("liveListCtx", JSON.stringify(liveListCtx));

  const hostData = {
    name: "Anaisha",
    image: "/host-profile.jpg",
    rate: 32,
  };

  const { data: giftList } = useGetAllGiftsQuery();

  useEffect(() => {
    if (!hostLeft || ROLE === "host") return;

    // Close popups when astrologer ends the live
    setShowGifts(false);
    setShowCallPopup(false);
  }, [hostLeft, ROLE]);

  // Track when socket room ends / starts
  // Use channelGeneration to ignore stale roomReady=false from old channels
  // that arrive after we've already switched to a new channel.
  const roomReadyGenRef = useRef(0);

  useEffect(() => {
    if (roomReady === true) {
      roomReadyGenRef.current = channelGeneration;
      setWasRoomReady(true);
      setRoomEnded(false);
    } else if (roomReady === false && wasRoomReady && ROLE !== "host") {
      // Only mark as ended if this roomReady=false belongs to the current channel
      if (roomReadyGenRef.current === channelGeneration) {
        setRoomEnded(true);
        setShowGifts(false);
        setShowCallPopup(false);
      }
    }
  }, [roomReady, ROLE, wasRoomReady, channelGeneration]);

  // Track previous message count
  useEffect(() => {
    prevMessageCountRef.current = displayMessages.length;
  }, [displayMessages.length]);

  const messagesOverlayRef = useRef(null);

  // Auto-scroll inline messages overlay when new messages arrive
  useEffect(() => {
    if (messagesOverlayRef.current) {
      messagesOverlayRef.current.scrollTop = messagesOverlayRef.current.scrollHeight;
    }
  }, [displayMessages.length]);

  const isHost = ROLE === "host";
  const isAstrologerLive = remoteUsers?.length > 0 && !hostLeft && !roomEnded;
  const viewerCount = participantCount || (remoteUsers?.length || 0) + 1;

  const {
    messagesEndRef,
    showSharePopup,
    setShowSharePopup,
    shareUrl,
    handleSend,
    handleCopyLink,
    shareToWhatsapp,
    shareToGmail,
  } = useLiveViewLogic(props);

  const handleCloseLive = async () => {
    if (isHost) {
      setCalling(false);
    } else {
      clearViewerSession();
      await handleLeave?.();
      navigate(PATH.privateRoutes.HOME.path);
    }
  };

  // Handle call initiation - uses real call flow (same as homepage astrologer listing)
  const handleDirectVoiceCall = async () => {
    // 1. Check login
    if (!token || !userIdLocal) {
      Toast.error("Please login to continue");
      navigate(PATH.publicRoutes.LOGIN.path);
      return;
    }

    // 2. Check kundli profile exists
    if (!profiles || profiles.length === 0) {
      Toast.error("Please create your Kundli before starting a call.");
      navigate(PATH.privateRoutes.PROFILE.path, { state: { requiresCreation: true } });
      return;
    }

    // 3. Check not already on a call
    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    // 4. Check astrologer info available
    // Note: astrologer object from LiveListContext uses astrologerId, not _id
    const astrologerId = astrologer?._id || astrologer?.astrologerId;
    if (!astrologerId) {
      Toast.error("Astrologer information not available");
      return;
    }

    try {
      // 5. Check wallet balance only — astrologer is already live, no need to check availability
      const result = await getBalance({ astrologerId, type: "call" });

      if (result?.data?.data?.status === false) {
        Toast.error("Insufficient balance. Please recharge.");
        return;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      Toast.error("Failed to check wallet balance");
      return;
    }

    // 6. Select kundli (self first, then first profile)
    const selfKundli = profiles.find(
      (p) => p.relation?.toLowerCase() === "self"
    );
    const selectedKundli = selfKundli || profiles[0];
    if (selectedKundli) {
      setLastSelectedKundli(selectedKundli);
    }

    // 7. Store astrologer info and emit call:initiate via socket
    setLastRequestedAstro(astrologer);
    setLastCallType("audio");
    setPendingCallType("audio");
    astrologerRef.current = astrologer;
    localStorage.setItem("selectedAstroId", astrologerId);

    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId,
      type: "audio",
    });

    setShowWaitingModal(true);
    Toast.success("Voice call request sent");
  };

  // Handle call initiation from popup (with choice)
  const handleCallRequest = (type) => {
    if (!token) {
      Toast.error("Please login to make a call");
      navigate("/login");
      return;
    }

    if (!userIdLocal) {
      Toast.error("User not found");
      return;
    }

    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    // Note: astrologer object from LiveListContext uses astrologerId, not _id
    const astrologerId = astrologer?._id || astrologer?.astrologerId;
    if (!astrologerId) {
      Toast.error("Astrologer information not available");
      return;
    }

    // Store astrologer info in context and ref
    setLastRequestedAstro(astrologer);
    setPendingCallType(type);
    astrologerRef.current = astrologer;

    // Show waiting modal
    setShowWaitingModal(true);

    // Emit socket event to initiate call
    voiceSocket.emit("call:initiate", {
      userId: userIdLocal,
      astrologerId,
      type, // "audio" | "video"
    });

    setShowCallPopup(false);
    Toast.success(`${type === "audio" ? "Voice" : "Video"} call request sent`);
  };

  // Reset call state
  const resetCallState = () => {
    // Clear the timeout if it exists
    if (astrologerRef.current?.timeoutId) {
      clearTimeout(astrologerRef.current.timeoutId);
    }
    
    setShowWaitingModal(false);
    setCallRoomId(null);
    astrologerRef.current = null;
    
    Toast.info("Call request cancelled");
  };

  // Format call seconds to mm:ss or hh:mm:ss
  const formatCallTime = (seconds) => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // End active call from minimized view
  const handleEndActiveCall = () => {
    if (activeCall?.roomId) {
      voiceSocket.emit("call:end", {
        roomId: activeCall.roomId,
        endedBy: "CUSTOMER",
      });
    }
    setActiveCall(null);
    setIsCallMinimized(false);
    setCallSeconds(0);
    resetCallFlow();
  };

  // Socket event handlers
  useEffect(() => {
    if (!userIdLocal) return;

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setShowWaitingModal(true);
    };

    const handleCallAccepted = async ({ roomId, token: agoraToken, type, remainingTime, isSwitch }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        setShowWaitingModal(false);
        resetCallFlow();
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        setShowWaitingModal(false);
        resetCallFlow();
        return;
      }
      
      // Regular call acceptance
      setShowWaitingModal(false);
      resetCallFlow();
      const astro = astrologerRef.current;
      
      if (!astro) {
        Toast.error("Astrologer information not available");
        return;
      }

      try {
        // Create chat room for the call
        // Note: astro object may have _id or astrologerId depending on source
        const astroId = astro._id || astro.astrologerId;
        const res = await createChatRoom({
          userId: userIdLocal,
          astrologerId: astroId,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error("Failed to create chat room");

        // Set active call in context - this will trigger VideoCall or VoiceCall component
        // Auto-minimize since user is on live stream
        setActiveCall({
          roomId,
          chatRoomId,
          agoraToken,
          callerName: astro.astrologerName || astro.firstName || "Astrologer",
          isUserSide: true,
          callType: type, // "audio" or "video"
          userId: userIdLocal,
          astrologerId: astroId,
          astrologerID: astro?.astrologer_ID,
          remainingTime
        });
        setIsCallMinimized(true);
        
        setCallSeconds(Number(remainingTime) * 60);
        Toast.success(`${type === "video" ? "Video" : "Voice"} call started`);
      } catch (error) {
        console.error("Call acceptance error:", error);
        Toast.error("Failed to start call");
      }
    };

    const handleCallRejected = (data) => {
      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        // Don't reset anything - the current call should continue
        return;
      }
      
      // Regular call rejection - end everything
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected"
          ? "Astrologer has rejected the call request"
          : "Call rejected";
      Toast.error(errorMsg);
      resetCallState();
    };

    const handleCallEnded = () => {
      setActiveCall(null);
      resetCallState();
    };

    // Register socket listeners
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:ended", handleCallEnded);

    return () => {
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("call:ended", handleCallEnded);
    };
  }, [userIdLocal, setActiveCall, setCallSeconds, resetCallFlow, setActiveCallRoomId, createChatRoom]);

  // Hide LiveView when there's an active call that is NOT minimized
  // Show LiveView when call is minimized so user can watch live stream
  if (activeCall && !isCallMinimized) {
    return null;
  }

  console.log("🔍 LiveView render state:", {
    isHost,
    remoteUsersCount: remoteUsers?.length,
    hostLeft,
    roomEnded,
    roomReady,
    wasRoomReady,
    channel: props.channel,
  });

  return (
    <FixedLayer>
      <div className="video-box">
        <div className="reel-scroll-root" ref={reelRef}>
          {/* Header with Tabs */}
          <div className="live-header">
            <button className="live-back-button" onClick={handleCloseLive}>
              <ChevronLeft size={24} />
            </button>
            <span className="live-header-title">Live Readings</span>
          </div>

          {/* Follow Button - only show when astrologer is live */}
          {!isHost && isAstrologerLive && (
            <div className="follow-bar">
              <button
                className={`follow-btn ${isFollowing ? "following" : ""}`}
                onClick={handleFollow}
                disabled={followLoading || unfollowLoading}
              >
                {followLoading || unfollowLoading
                  ? "..."
                  : isFollowing
                  ? "Following"
                  : "+ Follow"}
              </button>
            </div>
          )}

          {/* Astrologer Info Bar - only show when astrologer is live */}
          {isAstrologerLive && (
          <div className="top-bar">
            <div className="host-info">
              {fullAstro?.profileImgUrl ? (
                <img className="host-avatar-img" src={fullAstro.profileImgUrl} alt={astrologer?.astrologerName || "Astrologer"} />
              ) : (
                <div className="host-avatar">🕉️</div>
              )}
              <div className="host-text">
                <div className="host-name host-name-truncate">
                  {astrologer?.astrologerName || "Astrologer"}
                </div>
                <div className="host-duration">
                  {isCallForCurrentAstrologer
                    ? `Call ${formatCallTime(callSeconds)}`
                    : `Live ${liveDuration}`
                  }
                </div>
              </div>
              {/* Minimized call pill - right after name */}
              {isCallForCurrentAstrologer && (
                <div className="live-call-pill">
                  <span className="live-call-pill-avatar">
                    {(activeCall.callerName || "A").split(" ").map(w => w.charAt(0).toUpperCase()).join("").slice(0, 2)}
                  </span>
                  <button
                    className="live-call-pill-end"
                    onClick={handleEndActiveCall}
                    aria-label="End call"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85a.993.993 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* <div className="live-status">
              <div className="live-badge">LIVE</div>
              <div className="viewer-pill">
                <span className="viewer-dot" />
                <span className="viewer-count">{viewerCount} watching</span>
                {liveListCtx && (
                  <span className="viewer-count">
                    | Live {liveListCtx.currentIndex + 1} /{" "}
                    {liveListCtx.lives.length}
                  </span>
                )}
              </div>
            </div> */}
          </div>
          )}

          {/* LIVE INDEX INDICATOR */}
          {!isHost && liveListCtx && <div className="live-counter"></div>}

          {/* Video */}
          <div className="reel-container">
            {/* HOST VIDEO */}
            {isHost && isConnected && (
              <LocalUser
                audioTrack={localMicrophoneTrack}
                videoTrack={localCameraTrack}
                cameraOn={cameraOn}
                micOn={micOn}
              />
            )}

            {/* AUDIENCE VIDEO — only show when room hasn't ended */}
            {!isHost &&
              remoteUsers.length > 0 && !roomEnded &&
              remoteUsers.map((user) => (
                <RemoteUser key={user.uid} user={user} />
              ))}

            {/* MUTE BANNER — show when astrologer mutes audio */}
            {!isHost && isHostMuted && remoteUsers.length > 0 && !roomEnded && (
              <div style={{
                position: "absolute",
                top: 180,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(33, 33, 33, 0.44)",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 20,
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Astrologer is on mute
              </div>
            )}

            {/* CONNECTING — Agora joining or waiting for remote media */}
            {!isHost && remoteUsers.length === 0 && !hostLeft && !roomEnded && (
              <div className="waiting-text">
                {!props.channel || connectingTimedOut
                  ? '🔮 Waiting for astrologer to start streaming…'
                  : '🔮 Connecting to live stream…'}
              </div>
            )}

            {/* ENDED — astrologer has left or room ended */}
            {!isHost && (hostLeft || roomEnded) && remoteUsers.length === 0 && (
              <div className="waiting-text">
                🔮 Waiting for astrologer to go live…
              </div>
            )}
          </div>

          {/* HOST CONTROLS */}
          {isHost && isConnected && (
            <div className="control-panel">
              <button onClick={() => setMic((v) => !v)}>
                {micOn ? "🎙️ Mute" : "🎤 Unmute"}
              </button>
              <button onClick={() => setCamera((v) => !v)}>
                {cameraOn ? "📷 Hide" : "📸 Show"}
              </button>
            </div>
          )}

          {/* CHAT - only show when astrologer is live */}
          {isAstrologerLive && (
          <div className="chat-panel">
            {/* Inline Messages Overlay */}
            <div className="inline-messages-overlay" ref={messagesOverlayRef}>
              {displayMessages.map((m, index) => {
                // System messages (join) — show first letter like regular messages
                if (m.isSystem) {
                  const name = m.text?.split(" ")?.[0] || "U";
                  return (
                    <div key={m.id || index} className="inline-message" style={{ opacity: 0.7 }}>
                      <span className="inline-initial">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div className="inline-message-body">
                        <span className="inline-text" style={{ fontStyle: "italic", fontSize: 12 }}>{m.text}</span>
                      </div>
                    </div>
                  );
                }
                // Gift messages — orange gradient style
                if (m.isGift) {
                  const gd = m.giftData;
                  return (
                    <div key={m.id || index} className="inline-message inline-gift-message">
                      <span className="inline-initial" style={{ background: "linear-gradient(135deg, #f75801, #d43400)" }}>
                        {(m.sender || "G").charAt(0).toUpperCase()}
                      </span>
                      <div className="gift-card-bubble">
                        {gd?.giftImg && <img src={gd.giftImg} alt={gd?.giftName} className="gift-card-img" />}
                        <div className="gift-card-info">
                          <span className="gift-card-sender">{m.sender}</span>
                          <span className="gift-card-label">sent {gd?.giftName || "a gift"}</span>
                        </div>
                        {gd?.price && <span className="gift-card-price">₹{gd.price}</span>}
                      </div>
                    </div>
                  );
                }
                // Regular messages
                return (
                  <div key={m.id || index} className={`inline-message ${m.role === "host" ? "inline-host-message" : ""}`}>
                    <span className="inline-initial">
                      {(m.sender || (m.role === "host" ? "A" : "U")).charAt(0).toUpperCase()}
                    </span>
                    <div className="inline-message-body">
                      {m.sender && (
                        <span className="inline-sender">{m.sender}</span>
                      )}
                      <span className="inline-text">{m.text}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-row">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="send-icon-btn"
                  onClick={(e) => handleSend(e)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              
              {!isHost && (
                <button 
                  className="call-price-btn"
                  onClick={handleDirectVoiceCall}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>₹{fullAstro?.price?.audioRate?.amount || astrologer?.audioCallRate || 0}/ min</span>
                </button>
              )}
            </div>
          </div>
          )}

          <GiftPopup
            show={showGifts}
            onClose={() => setShowGifts(false)}
            giftList={giftList?.data}
            astrologerId={astrologer?._id || astrologer?.astrologerId}
            astrologerName={astrologer?.firstName || astrologer?.name}
            socketRef={props.socketRef}
            roomId={props.channel}
            userId={userIdLocal}
            userName={(() => {
              const u = getUserFromStorage();
              const first = u?.firstName || "";
              const last = u?.lastName || "";
              if (first && last && first.toLowerCase() !== last.toLowerCase()) return `${first} ${last}`;
              return first || "User";
            })()}
          />
          <SharePopup
            show={showSharePopup}
            onClose={() => setShowSharePopup(false)}
            url={shareUrl}
            shareToWhatsapp={shareToWhatsapp}
            shareToGmail={shareToGmail}
            handleCopyLink={handleCopyLink}
          />

          <CallRequestPopup
            show={showCallPopup}
            onClose={() => setShowCallPopup(false)}
            onJoinAudio={() => handleCallRequest("audio")}
            onJoinVideo={() => handleCallRequest("video")}
            host={hostData}
            astrologer={astrologer}
            waitingList={callWaitingList}
          />

          {/* Waiting Modal */}
          {showWaitingModal && (
            <WaitingModal
              callRoomId={callRoomId}
              resetCallState={resetCallState}
              connectionType={pendingCallType}
            />
          )}

          {/* NEW BOTTOM ACTION BAR - only show when astrologer is live */}
          {isAstrologerLive && (
          <div className="right-action-bar">
            {/* Timer / Stopwatch - commented out, using host-info bar timer instead */}
            {/* <button className="icon-btn">
              <div className="icon-circle">
                <img src={AppImages.LiveIcon} alt="Timer" width="28" height="28" />
              </div>
              <span className="icon-label">{liveDuration}</span>
            </button> */}

            {/* Viewers */}
            <div className="icon-btn viewer-icon-btn" style={{ cursor: "default" }}>
              <div className="icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <span className="icon-label">{viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}</span>
            </div>

            {/* Send Gift */}
            {!isHost && (
              <button className="icon-btn" onClick={() => setShowGifts(true)}>
                <div className="icon-circle">
                  <img src={AppImages.LiveGift} alt="Send gift" width="28" height="28" />
                </div>
                <span className="icon-label">Send gift</span>
              </button>
            )}

            {/* Share (curved reply arrow) */}
            <button className="icon-btn" onClick={() => setShowSharePopup(true)}>
              <div className="icon-circle">
                <img src={AppImages.LiveShare} alt="Share" width="28" height="28" />
              </div>
              {/* <span className="icon-label">{viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}</span> */}
            </button>

            {/* End Live - Only for hosts */}
            {isHost && (
              <button
                className="icon-btn end-live"
                onClick={() => setCalling(false)}
              >
                <div className="icon-circle">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </FixedLayer>
  );
};

export default LiveView;

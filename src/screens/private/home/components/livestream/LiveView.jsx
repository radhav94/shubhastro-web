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
import Toast from "../../../../../component/toast";
import { useCreateChatRoomMutation } from "../../../../../redux/api/chatApi";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";
import { useGetAllKundlisQuery } from "../../../../../services/appServices/kundliServicesNew";
import { PATH } from "../../../../../utils/routes/Paths";

import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";

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
  } = props;

  const [showGifts, setShowGifts] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [showChatModal, setShowChatModal] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);

  const { 
    activeCall, 
    setLastRequestedAstro, 
    setActiveCall, 
    setCallSeconds, 
    resetCallFlow, 
    setActiveCallRoomId,
    setLastSelectedKundli,
    setLastCallType,
    isCallMinimized
  } = useCall();
  
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");
  const token = localStorage.getItem("shubhtalk_customer_token");
  const [callRoomId, setCallRoomId] = useState(null);
  const [callWaitingList, setCallWaitingList] = useState(null);
  const astrologerRef = useRef(null);
  
  const [createChatRoom] = useCreateChatRoomMutation();
  const [getBalance] = useGetBalanceMutation();

  // Fetch user's kundli profiles for validation
  const { data: kundliData } = useGetAllKundlisQuery(undefined, {
    skip: !token || !userIdLocal,
  });
  const profiles = kundliData?.data || [];

  // Normalize socket messages (message → text, userType → role, userName → sender)
  const normalizedMessages = messages?.map((m) => ({
    ...m,
    text: m.text || m.message,
    role: m.role || m.userType,
    sender: m.sender || m.userName,
  })) || [];
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

    // Close chat modal when astrologer ends the live
    setShowChatModal(false);
    setShowGifts(false);
    setShowCallPopup(false);
  }, [hostLeft, ROLE]);

  // Also close popups when the socket room ends (roomReady → false)
  useEffect(() => {
    if (roomReady === false && ROLE !== "host") {
      setShowChatModal(false);
      setShowGifts(false);
      setShowCallPopup(false);
    }
  }, [roomReady, ROLE]);

  const isHost = ROLE === "host";
  const viewerCount = participantCount || (remoteUsers?.length || 0) + 1;

  const {
    messagesEndRef,
    showSharePopup,
    setShowSharePopup,
    handleSend,
    handleCopyLink,
    shareToWhatsapp,
    shareToGmail,
  } = useLiveViewLogic(props);

  const handleCloseLive = () => {
    if (isHost) {
      setCalling(false);
    } else {
      // Intentional leave — clear saved session so refresh doesn't reconnect
      clearViewerSession();
      handleLeave?.();
      navigate(-1);
    }
  };

  const handleDailyInsightsClick = () => {
    navigate("/live-landing");
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
      // 5. Check wallet balance & astrologer availability
      const result = await getBalance({ astrologerId, type: "call" });

      if (result?.data?.data?.status === false) {
        Toast.error("Insufficient balance. Please recharge.");
        return;
      }

      const availability = result?.data?.data?.availability;
      const isActive = availability?.isActive === true;
      const isActiveForAudio = Array.isArray(availability?.isActiveType)
        ? availability.isActiveType.includes("audio")
        : false;

      if (!isActive || !isActiveForAudio) {
        Toast.error("Astrologer is not available for voice call");
        return;
      }
    } catch (error) {
      console.error("Error checking balance/availability:", error);
      Toast.error("Failed to check astrologer availability");
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

  return (
    <FixedLayer>
      <div className="video-box">
        <div className="reel-scroll-root" ref={reelRef}>
          {/* Header with Tabs */}
          <div className="live-header">
            <button className="live-back-button" onClick={handleCloseLive}>
              <ChevronLeft size={24} />
            </button>

            <div className="live-tabs">
              <button
                className={`live-tab ${activeTab === "daily" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("daily");
                  handleDailyInsightsClick();
                }}
              >
                Daily Insights
              </button>
              <button
                className={`live-tab ${activeTab === "live" ? "active" : ""}`}
                onClick={() => setActiveTab("live")}
              >
                Live Readings
              </button>
            </div>
          </div>

          {/* Astrologer Info Bar */}
          <div className="top-bar">
            <div className="host-info">
              <div className="host-avatar">🕉️</div>
              <div>
                <div className="host-name">
                  {astrologer?.astrologerName || "Astrologer"}
                </div>
                <div className="host-subtitle">Shubhtalk • Verified</div>
              </div>
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

            {/* AUDIENCE VIDEO */}
            {!isHost &&
              remoteUsers.length > 0 &&
              remoteUsers.map((user) => (
                <RemoteUser key={user.uid} user={user} />
              ))}

            {/* WAITING (never joined yet) */}
            {!isHost && remoteUsers.length === 0 && !hostLeft && (
              <div className="waiting-wrapper">
                <div className="waiting-text">
                  🔮 Waiting for astrologer to go live…
                </div>
              </div>
            )}

            {/* ENDED — no other astrologers online */}
            {!isHost && hostLeft && (
              <div className="waiting-wrapper ended">
                <div className="waiting-text">
                  🔮 Waiting for astrologer to go live…
                </div>
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

          {/* CHAT */}
          <div className="chat-panel">
            {/* Chat Input */}
            <div className="chat-input-row">
              <div className="input-wrapper" onClick={() => setShowChatModal(true)}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onFocus={() => setShowChatModal(true)}
                  readOnly
                />
                <button type="button" className="send-icon-btn">
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
                  <span>₹{astrologer?.audioCallRate || 20}/ min</span>
                </button>
              )}
            </div>
          </div>

          {/* Chat Modal */}
          {showChatModal && (
            <div className="chat-modal-overlay" onClick={() => setShowChatModal(false)}>
              <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-handle"></div>
                
                <div className="chat-modal-messages">
                  {displayMessages.length === 0 && (
                    <div className="chat-empty-state">
                      <span>💬</span>
                      <p>No messages yet. Be the first to say something!</p>
                    </div>
                  )}
                  {displayMessages.map((m, index) => (
                    <div key={m.id || index} className={`chat-modal-message ${m.role === "host" ? "host-message" : ""}`}>
                      <div className="message-avatar">
                        <div className="avatar-circle">
                          {m.role === "host" ? "🕉️" : "👤"}
                        </div>
                      </div>
                      <div className="message-content">
                        {m.sender && (
                          <span className="message-sender">{m.sender}</span>
                        )}
                        <p className="message-text">{m.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-modal-input">
                  <input
                    type="text"
                    placeholder="Share your thoughts..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="modal-send-btn"
                    onClick={(e) => {
                      handleSend(e);
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          <GiftPopup
            show={showGifts}
            onClose={() => setShowGifts(false)}
            giftList={giftList?.data}
          />
          <SharePopup
            show={showSharePopup}
            onClose={() => setShowSharePopup(false)}
            url={window.location.href}
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
          {/* {showWaitingModal && (
            <WaitingModal
              callRoomId={callRoomId}
              resetCallState={resetCallState}
              connectionType="video"
            />
          )} */}

          {/* NEW BOTTOM ACTION BAR */}
          <div className="right-action-bar">
            {/* Timer */}
            {/* <button className="icon-btn" onClick={() => setShowCallPopup(true)}>
              <div className="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8"/>
                  <path d="M12 9v4l2 2"/>
                  <path d="M8 4h8"/>
                </svg>
              </div>
              <span className="icon-label">20m</span>
            </button> */}

            {/* Viewers */}
            <button className="icon-btn">
              <div className="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <span className="icon-label">{viewerCount > 1000 ? `${(viewerCount/1000).toFixed(1)}k` : viewerCount}</span>
            </button>

            {/* Send Gift */}
            {!isHost && (
              <button className="icon-btn" onClick={() => setShowGifts(true)}>
                <div className="icon-circle">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12"/>
                    <rect x="2" y="7" width="20" height="5"/>
                    <line x1="12" y1="22" x2="12" y2="7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                  </svg>
                </div>
                <span className="icon-label">Send gift</span>
              </button>
            )}

            {/* Share */}
            <button className="icon-btn" onClick={() => setShowSharePopup(true)}>
              <div className="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12c0-1.2 0-1.8.2-2.3.2-.5.6-.9 1.1-1.1.5-.2 1.1-.2 2.3-.2h10.8c1.2 0 1.8 0 2.3.2.5.2.9.6 1.1 1.1.2.5.2 1.1.2 2.3v6c0 1.2 0 1.8-.2 2.3-.2.5-.6.9-1.1 1.1-.5.2-1.1.2-2.3.2H6.6c-1.2 0-1.8 0-2.3-.2-.5-.2-.9-.6-1.1-1.1C3 19.8 3 19.2 3 18v-6z"/>
                  <path d="M7 8.5V7c0-1.9 0-2.8.4-3.5.3-.6.9-1.1 1.5-1.4C9.6 2 10.5 2 12.4 2h.2c1.9 0 2.8 0 3.5.4.6.3 1.1.9 1.4 1.5.4.7.4 1.6.4 3.5v1.5"/>
                </svg>
              </div>
              <span className="icon-label">Share</span>
            </button>

            {/* Call Button - Only for non-hosts
            {!isHost && (
              <button className="icon-btn" onClick={() => setShowCallPopup(true)}>
                <div className="icon-circle">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
              </button>
            )} */}

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
        </div>
      </div>
    </FixedLayer>
  );
};

export default LiveView;

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

import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";

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
    hostLeft,
    astrologer,
  } = props;

  const [showGifts, setShowGifts] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [showChatModal, setShowChatModal] = useState(false);

  // Sample messages for display
  const sampleMessages = [
    {
      id: 1,
      text: "I can totally relate to this. This phase is bringing so many internal changes.",
      role: "user",
      likes: 30
    },
    {
      id: 2,
      text: "This is the time to understand everything, to connect with yourself. Life is showing new colors.",
      role: "user",
      likes: 25
    },
    {
      id: 3,
      text: "Every challenge has a lesson, during this period we are seeing ourselves in a new light.",
      role: "user",
      likes: 42
    },
    {
      id: 4,
      text: "I can totally relate to this. This phase is bringing so many internal changes.",
      role: "user",
      likes: 30
    }
  ];

  // Combine real messages with sample messages
  const displayMessages = messages && messages.length > 0 ? messages : sampleMessages;

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

    const t = setTimeout(() => {
      liveListCtx?.goNextLive();
    }, 2000);

    return () => clearTimeout(t);
  }, [hostLeft, ROLE, liveListCtx]);

  const isHost = ROLE === "host";
  const viewerCount = (remoteUsers?.length || 0) + 1;

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
      navigate(-1);
    }
  };

  const handleDailyInsightsClick = () => {
    navigate("/live-landing");
  };

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

            <div className="live-status">
              <div className="live-badge">LIVE</div>
              <div className="viewer-pill">
                <span className="viewer-dot" />
                <span className="viewer-count">{viewerCount} watching</span>
                {liveListCtx && (
                  <span className="viewer-count">
                    {" "}
                    | Live {liveListCtx.currentIndex + 1} /{" "}
                    {liveListCtx.lives.length}
                  </span>
                )}
              </div>
            </div>
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

            {/* ENDED (this is your screenshot fix) */}
            {!isHost && hostLeft && (
              <div className="waiting-wrapper ended">
                <div className="waiting-text">
                  ⛔ Astrologer has ended the live
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
                <button className="call-price-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
                  </svg>
                  <span>₹20/ min</span>
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
                  {displayMessages.map((m, index) => (
                    <div key={m.id || index} className="chat-modal-message">
                      <div className="message-avatar">
                        <img 
                          src={m.avatar || (m.role === "host" ? astrologer?.profileImage : "/default-avatar.jpg")} 
                          alt="avatar"
                          className="avatar-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="avatar-circle" style={{ display: 'none' }}>
                          {m.role === "host" ? "🕉️" : "👤"}
                        </div>
                      </div>
                      <div className="message-content">
                        <p className="message-text">{m.text}</p>
                      </div>
                      <div className="message-like">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span className="like-count">{m.likes || 30}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-modal-input">
                  <div className="modal-input-avatar">
                    <img 
                      src="/default-avatar.jpg" 
                      alt="Your avatar"
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="avatar-circle" style={{ display: 'none' }}>👤</div>
                  </div>
                  <input
                    type="text"
                    placeholder="Share your thoughts..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend(e);
                        setShowChatModal(false);
                      }
                    }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="modal-send-btn"
                    onClick={(e) => {
                      handleSend(e);
                      setShowChatModal(false);
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
            onJoin={() => {
              setShowCallPopup(false);
              alert("Private Call starting soon...");
            }}
            host={hostData}
          />

          {/* NEW BOTTOM ACTION BAR */}
          <div className="right-action-bar">
            {/* Timer */}
            <button className="icon-btn" onClick={() => setShowCallPopup(true)}>
              <div className="icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8"/>
                  <path d="M12 9v4l2 2"/>
                  <path d="M8 4h8"/>
                </svg>
              </div>
              <span className="icon-label">20m</span>
            </button>

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

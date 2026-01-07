import React, { useState, useRef, useEffect } from "react";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import "./styles/videoBox.scss";
import { useLiveViewLogic } from "./useLiveViewLogic";
import GiftPopup from "./GiftPopup";
import CallRequestPopup from "./CallRequestPopup";
import SharePopup from "./SharePopup";
import { useReelScroll } from "./useReelScroll";

import { useNavigate } from "react-router-dom";

import { Toast } from "../../../../../component";
import { useGetAllGiftsQuery } from "../../../../../redux/api/gift/giftApi";
import { useLiveList } from "../../../../../context/LiveListContext";

import { createPortal } from "react-dom";

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

  const liveListCtx = useLiveList();
  const reelRef = useRef(null);

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

  const { data: giftList, isLoading } = useGetAllGiftsQuery();

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

  const handleGiftSent = () => {
    Toast.success("Gift Sent!");
    setShowGifts(false);
  };

  return (
    <FixedLayer>
      <div className="video-box">
        <div className="reel-scroll-root" ref={reelRef}>
          {/* TOP BAR */}
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
                <span className="viewer-count">
                  {" "}
                  | Live {liveListCtx.currentIndex + 1} /{" "}
                  {liveListCtx.lives.length}
                </span>
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
            <div className="chat-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-message ${m.isSelf ? "self" : ""}`}
                >
                  <b>{m.role === "host" ? "Astrologer" : "User"}:</b> {m.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-row" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
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
            <button
              className="icon-btn"
              onClick={() => setShowSharePopup(true)}
            >
              📤
            </button>

            <button className="icon-btn" onClick={() => setShowCallPopup(true)}>
              📞
            </button>

            {!isHost && (
              <button className="icon-btn" onClick={() => setShowGifts(true)}>
                🎁
              </button>
            )}

            {isHost && (
              <button
                className="icon-btn end-live"
                onClick={() => setCalling(false)}
              >
                ✖
              </button>
            )}
          </div>
        </div>
      </div>
    </FixedLayer>
  );
};

export default LiveView;

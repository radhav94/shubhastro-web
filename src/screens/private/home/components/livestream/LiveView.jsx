import React, { useState } from "react";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import "./styles/videoBox.scss";
import { useLiveViewLogic } from "./useLiveViewLogic";
import GiftPopup from "./GiftPopup";
import CallRequestPopup from "./CallRequestPopup";
import SharePopup from "./SharePopup";
import { Toast } from "../../../../../component";

const LiveView = (props) => {
  const [showGifts, setShowGifts] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [coins, setCoins] = useState(106);
  const [showCallPopup, setShowCallPopup] = useState(false);

  const hostData = {
    name: "Anaisha",
    image: "/host-profile.jpg",
    rate: 32,
  };



  

  const giftList = [
    { id: 1, name: "Flowers", price: 15, icon: "/gifts/flowers.png" },
    { id: 2, name: "Pooja Thali", price: 21, icon: "/gifts/pooja.png" },
    { id: 3, name: "Heart", price: 21, icon: "/gifts/heart.png" },
    { id: 4, name: "Chocolates", price: 51, icon: "/gifts/choco.png" },
    { id: 5, name: "Sweets", price: 101, icon: "/gifts/sweets.png" },
    { id: 6, name: "Magician", price: 101, icon: "/gifts/magic.png" },
    { id: 7, name: "Shivling", price: 251, icon: "/gifts/shiv.png" },
    { id: 8, name: "Crown", price: 501, icon: "/gifts/crown.png" },
    { id: 9, name: "Dakshina", price: 2100, icon: "/gifts/dakshina.png" },
    { id: 10, name: "Ganesha", price: 5100, icon: "/gifts/ganesha.png" },
  ];

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
  } = props;

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
    shareToFacebook,
    shareToPinterest,
  } = useLiveViewLogic(props);

  return (
    <div className="video-box">
      {/* TOP BAR */}
      <div className="top-bar">
        <div className="host-info">
          <div className="host-avatar">🕉️</div>
          <div>
            <div className="host-name">Astrologer Live</div>
            <div className="host-subtitle">Shubhtalk • Verified</div>
          </div>
        </div>

        <div className="live-status">
          <div className="live-badge">LIVE</div>
          <div className="viewer-pill">
            <span className="viewer-dot" />
            <span className="viewer-count">{viewerCount} watching</span>
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="reel-container">
        {isHost && isConnected && (
          <LocalUser
            audioTrack={localMicrophoneTrack}
            videoTrack={localCameraTrack}
            cameraOn={cameraOn}
            micOn={micOn}
          />
        )}

        {!isHost &&
          remoteUsers.map((user) => <RemoteUser key={user.uid} user={user} />)}

        {!isHost && remoteUsers.length === 0 && (
          <div className="waiting-text">Waiting for astrologer…</div>
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
        giftList={giftList}
        coins={coins}
        selectedGift={selectedGift}
        setSelectedGift={setSelectedGift}
        onSend={() => {
          Toast.success("Gift Sent!");
          setShowGifts(false);
        }}
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
        <button className="icon-btn" onClick={() => setShowSharePopup(true)}>
          📤
        </button>

        <button className="icon-btn" onClick={() => setShowCallPopup(true)}>
          📞
        </button>

        <button className="icon-btn" onClick={() => setShowGifts(true)}>
          🎁
        </button>

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
  );
};

export default LiveView;

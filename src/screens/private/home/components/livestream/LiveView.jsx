// src/components/LiveStreaming/LiveView.jsx
import React, { useEffect, useRef } from "react";
import { LocalUser, RemoteUser } from "agora-rtc-react";
import "./styles/videoBox.scss";

const LiveView = ({
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
  sendChatMessage,
}) => {
  const isHost = ROLE === "host";
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    sendChatMessage();
  };

  return (
    <div className="video-box">
      <div className="live-badge">LIVE</div>

      {/* HOST VIDEO */}
      {isHost && isConnected && localCameraTrack && (
        <LocalUser
          audioTrack={localMicrophoneTrack}
          videoTrack={localCameraTrack}
          cameraOn={cameraOn}
          micOn={micOn}
          playAudio={false}
          style={{ width: "100%", height: "100%" }}
        >
          <span className="user-label">You (Astrologer)</span>
        </LocalUser>
      )}

      {/* AUDIENCE VIDEO */}
      {!isHost && remoteUsers.length > 0 && (
        <>
          {remoteUsers.map((user) => (
            <RemoteUser
              key={user.uid}
              user={user}
              style={{ width: "100%", height: "100%" }}
            >
              <span className="user-label">Astrologer #{user.uid}</span>
            </RemoteUser>
          ))}
        </>
      )}

      {!isHost && remoteUsers.length === 0 && (
        <div className="waiting-text">Waiting for host…</div>
      )}

      {/* HOST CONTROLS */}
      {isHost && isConnected && (
        <div className="control-panel">
          <button onClick={() => setMic((v) => !v)}>
            {micOn ? "🎙️ Mute" : "🎤 Unmute"}
          </button>
          <button onClick={() => setCamera((v) => !v)}>
            {cameraOn ? "📷 Hide" : "📸 Show"}
          </button>
          <button className="end-btn" onClick={() => setCalling(false)}>
            End Live ❌
          </button>
        </div>
      )}

      {/* 💬 CHAT OVERLAY */}
      <div className="chat-panel">
        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message ${
                m.role === "host" ? "host-msg" : "audience-msg"
              } ${m.isSelf ? "self" : ""}`}
            >
              <span className="sender">
                {m.role === "host" ? "Astrologer" : "User"}:
              </span>
              <span className="text">{m.text}</span>
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
    </div>
  );
};

export default LiveView;


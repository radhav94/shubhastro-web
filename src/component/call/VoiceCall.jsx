// AgoraVoiceCalling.jsx
import React, { useState, useEffect } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useLocation } from "react-router-dom";
import {
  IoMic,
  IoMicOff,
  IoCall,
  IoCallOutline,
  IoPerson,
} from "react-icons/io5";
import "./AgoraVoicePremiumUI.scss";
import useVoiceCall from "./useVoiceCall";

// import useVoiceCall from "../../hooks/useVoiceCall"; // 👈 path adjust karna

export const AgoraVoiceCalling = () => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  return (
    <AgoraRTCProvider client={client}>
      <WhatsAppStyleCall />
    </AgoraRTCProvider>
  );
};

const WhatsAppStyleCall = () => {
  const [micOn, setMicOn] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const { state } = useLocation();
  const { userId, astrologerId, roomId, isUserSide } = state || {};

  // Agora essentials
  const [appId] = useState("5630460abdc141e3b2f8d9597752bd7d");

  // 🔔 Call signaling & token/channel from socket
  const {
    isCalling,
    callStatus,
    token,
    channelName,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useVoiceCall({ userId, astrologerId, roomId, isUserSide });

  const isConnected = useIsConnected();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const remoteUsers = useRemoteUsers();

  // Agora join — only when we have channel + token and isCalling true
  const shouldJoin = isCalling && !!channelName && !!token;

  useJoin(
    {
      appid: appId,
      channel: channelName || "",
      token: token || null,
    },
    shouldJoin
  );

  usePublish([localMicrophoneTrack]);

  // Call timer
  useEffect(() => {
    let intervalId;

    if (isConnected && isCalling) {
      intervalId = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, isCalling]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    endCall();
  };

  const callStatusText = (() => {
    if (!isCalling && callStatus === "idle") return "Ready to start call";
    if (callStatus === "calling") return "Calling… Waiting for astrologer";
    if (callStatus === "ringing") return "Incoming call…";
    if (callStatus === "onCall") return "On call";
    if (callStatus === "busy") return "Astrologer is busy";
    if (callStatus === "rejected") return "Call rejected";
    if (callStatus === "ended") return "Call ended";
    return callStatus;
  })();

  return (
    <div className="call-page">
      <div className="call-overlay" />

      <div className="call-card">
        {/* Header */}
        <div className="call-header">
          <span className="call-header-label">Voice Call</span>
          <span className="call-header-channel">
            {channelName || "Channel"}
          </span>
        </div>

        {/* Avatar & status */}
        <div className="call-main">
          <div className="avatar">
            <div className="avatar-ring" />
            <div className="avatar-inner">
              <IoPerson className="avatar-icon" />
            </div>
          </div>

          <div className="call-info">
            <div className="call-name">SubhTalk User</div>
            <div className="call-status">{callStatusText}</div>

            {isConnected && isCalling && (
              <div className="call-timer">{formatTime(seconds)}</div>
            )}
          </div>

          {isConnected && (
            <div className="remote-info">
              {remoteUsers.length === 0 ? (
                <span className="remote-text">
                  Waiting for other person…
                </span>
              ) : (
                remoteUsers.map((user) => (
                  <span key={user.uid} className="remote-text">
                    In Call with: <strong>{user.uid}</strong>
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        {/* When NOT connected to Agora yet */}
        {!isConnected && (
          <div className="connect-form">
            {isUserSide ? (
              <button
                className="connect-btn"
                disabled={!appId}
                onClick={startCall}
              >
                <IoCallOutline className="btn-icon-left" />
                Start Voice Call
              </button>
            ) : (
              <>
                {callStatus === "ringing" ? (
                  <div className="incoming-actions">
                    <button
                      className="connect-btn"
                      onClick={acceptCall}
                    >
                      Accept
                    </button>
                    <button
                      className="connect-btn danger"
                      onClick={rejectCall}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="waiting-text">
                    Waiting for incoming call…
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Controls */}
        {isConnected && isCalling && (
          <div className="controls">
            {/* Mic toggle */}
            <button
              className={`control-btn ${
                micOn ? "control-btn--primary" : "control-btn--danger"
              }`}
              onClick={() => setMicOn((m) => !m)}
            >
              {micOn ? <IoMic /> : <IoMicOff />}
            </button>

            <button className="control-btn control-btn--secondary" disabled>
              <IoCall />
            </button>

            {/* End call */}
            <button
              className="control-btn control-btn--danger"
              onClick={handleEndCall}
            >
              <IoCallOffIcon />
            </button>
          </div>
        )}

        {/* Agora audio handling (hidden UI) */}
        <div style={{ display: "none" }}>
          <LocalUser
            audioTrack={localMicrophoneTrack}
            micOn={micOn}
            playAudio={false}
          >
            <span>You</span>
          </LocalUser>

          {remoteUsers.map((user) => (
            <RemoteUser key={user.uid} user={user} playAudio={true}>
              <span>{user.uid}</span>
            </RemoteUser>
          ))}
        </div>
      </div>
    </div>
  );
};

// Small helper so we don't import another icon lib for Call Off
const IoCallOffIcon = () => (
  <span style={{ display: "inline-flex", transform: "rotate(135deg)" }}>
    <IoCall />
  </span>
);

export default AgoraVoiceCalling;

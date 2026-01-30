import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  IoMic,
  IoMicOff,
  IoArrowBack,
  IoSwapHorizontal,
  IoSparkles,
  IoGift,
  IoVolumeHigh,
  IoAttach,
  IoTime,
  IoCallSharp,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { PATH } from "../../utils/routes/Paths";
import GiftModal from "./GiftModal";

// Import SVG icons from chat assets
import VideocamIcon from "../../assets/chat/Videocam.svg";
import CallIcon from "../../assets/chat/Call.svg";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const AgoraVoiceCalling = ({ callData }) => {
  const { activeCall, setActiveCall, callSeconds, setCallSeconds, startTimer, stopTimer } = useCall();
  const navigate = useNavigate();

  if (!activeCall || activeCall.callType !== "audio") return null;

  const { roomId, agoraToken, callerName, isUserSide } = callData;

  /* ================= REFS ================= */
  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cleanupRef = useRef(false);
  const videoTrackRef = useRef(null);
  const remoteUserRef = useRef(null);

  /* ================= STATE ================= */
  const [micOn, setMicOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isVideo, setIsVideo] = useState(false);
  const [isRemoteVideo, setIsRemoteVideo] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;

    const startCall = async () => {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }

        if (mediaType === "video") {
          remoteUserRef.current = user;
          setIsRemoteVideo(true);
          const container = document.getElementById("remote-video");
          if (container) {
            user.videoTrack?.play(container);
          }
        }

      });

      client.on("user-unpublished", async (user, mediaType) => {
        if (mediaType === "video") {
          user.videoTrack?.stop();
          setIsRemoteVideo(false)
        }
      });

      client.on("user-left", endCall);

      await client.join(APP_ID, roomId, agoraToken, null);

      micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([micTrackRef.current]);
      // videoTrackRef.current = await AgoraRTC.createCameraVideoTrack();

      setJoined(true);
      setCallState("connected");
      
      // Set initial call seconds and start the countdown timer
      const seconds = Number(activeCall.remainingTime) * 60;
      setCallSeconds(seconds);
      
      // Start the timer for local countdown (server syncs every minute via activity events)
      startTimer();
    };

    startCall();

    return () => cleanup();
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= MIC TOGGLE ================= */
  useEffect(() => {
    micTrackRef.current?.setEnabled(micOn);
  }, [micOn]);

  /* ================= CLEANUP ================= */
  const cleanup = async () => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;

    try {
      await micTrackRef.current?.stop();
      await micTrackRef.current?.close();
      await videoTrackRef.current?.stop();
      await videoTrackRef.current?.close();
      await clientRef.current?.leave();
    } catch (e) {
      console.warn("Voice cleanup error:", e);
    } finally {
      micTrackRef.current = null;
      clientRef.current = null;
      setActiveCall(null);
      stopTimer();
    }
  };

  /* ================= END CALL ================= */
  const endCall = async () => {
    voiceSocket.emit("call_end", {
      roomId,
      endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
    });
    await cleanup();
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    voiceSocket.on("call_ended", endCall);
    voiceSocket.on("force_call_end", endCall);
    voiceSocket.on("disconnect", endCall);

    return () => {
      voiceSocket.off("call_ended", endCall);
      voiceSocket.off("force_call_end", endCall);
      voiceSocket.off("disconnect", endCall);
    };
  }, []);

  /* ================= DRAG ================= */
  const dragOffset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: x - position.x, y: y - position.y };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  const toggleCamera = async () => {
    const client = clientRef.current;

    if (!client) return;

    // TURN OFF VIDEO
    if (isVideo) {
      if (videoTrackRef.current) {
        await client.unpublish(videoTrackRef.current);
        videoTrackRef.current.stop();
        videoTrackRef.current.close();
        videoTrackRef.current = null;
      }

      setIsVideo(false);
      return;
    }

    // TURN ON VIDEO
    videoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
    await client.publish(videoTrackRef.current);

    // videoTrackRef.current.play("local-video");
    setIsVideo(true);
  };

  useEffect(() => {
    if (isVideo && videoTrackRef.current) {
      videoTrackRef.current.play("local-video");
    }
  }, [isVideo]);

  // Re-attach video when maximizing
  useEffect(() => {
    if (!isMinimized && isVideo && videoTrackRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        videoTrackRef.current.play("local-video");
      }, 100);
    }
  }, [isMinimized, isVideo]);

  // Re-attach remote video when maximizing
  useEffect(() => {
    if (!isMinimized && isRemoteVideo && remoteUserRef.current) {
      setTimeout(() => {
        const container = document.getElementById("remote-video");
        if (container && remoteUserRef.current.videoTrack) {
          remoteUserRef.current.videoTrack.play(container);
        }
      }, 100);
    }
  }, [isMinimized, isRemoteVideo]);

  /* ================= UI ================= */
  return (
    <>
      {/* MINI VIEW */}
      {isMinimized && (
        <div
          className={styles.miniCall}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className={styles.miniHeader}>
            <span>
              {callerName} • {joined ? formatTime(callSeconds) : "Calling…"}
              {isVideo && " • 📹"}
            </span>
            <button onClick={() => setIsMinimized(false)}>⤢</button>
          </div>

          <div className={styles.miniControls}>
            <button onClick={() => setMicOn((m) => !m)}>
              {micOn ? <IoMic size={18} /> : <IoMicOff size={18} />}
            </button>

            <button className={styles.endBtnMini} onClick={endCall}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* FULL VIEW */}
      {!isMinimized && (
        <div className={styles.fullscreenWrapper}>
          {/* Remote Video (if enabled) */}
          <div
            id="remote-video"
            className={styles.remoteVideo}
            style={{ display: isRemoteVideo ? "block" : "none" }}
          />

          {/* Local Video (if enabled) */}
          {isVideo && (
            <div id="local-video" className={styles.localVideo} />
          )}

          {/* Header */}
          <div className={styles.header}>
            <button
              className={styles.backBtn}
              onClick={() => setIsMinimized(true)}
            >
              <IoArrowBack size={24} />
            </button>
            
            <div className={styles.astrologerInfo}>
              <h3 className={styles.astrologerName}>{callerName}</h3>
              <p className={styles.astrologerExp}>Exp. 20 Years</p>
            </div>

            <div className={styles.walletBadge}>
              <span className={styles.walletIcon}>💰</span>
              <span className={styles.walletAmount}>₹20</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.actionBtn}>
              <IoAttach size={16} />
              <span>Attach File</span>
            </button>
            <button className={styles.actionBtn}>
              <IoSparkles size={16} />
              <span>Suggested Remedy</span>
            </button>
            <button className={styles.actionBtn}>
              <IoTime size={16} />
              <span>View History</span>
            </button>
          </div>

          {/* Voice Center (Avatar & Timer) */}
          {!isRemoteVideo && (
            <div className={styles.voiceCenter}>
              <div className={styles.avatarContainer}>
                <img
                  className={styles.avatar}
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="avatar"
                />
              </div>
              <div className={styles.callTimer}>
                {joined ? formatTime(callSeconds) : "Connecting…"}
              </div>
            </div>
          )}

          {/* Floating Sparkle Button */}
          <button 
            className={styles.floatingSparkleBtn}
            onClick={() => {
              setIsMinimized(true);
              navigate(PATH.privateRoutes.AI_WOW.path);
            }}
            aria-label="AI Wow"
          >
            <IoSparkles size={32} />
          </button>

          {/* Bottom Controls */}
          <div className={styles.bottomControls}>
            {/* Control Buttons Grid */}
            <div className={styles.controlGrid}>
              <div className={styles.controlItem}>
                <button className={styles.controlBtn}>
                  <IoSwapHorizontal size={24} />
                </button>
                <span className={styles.controlLabel}>Switch Profile</span>
              </div>

              <div className={styles.controlItem}>
                <button 
                  className={styles.controlBtn}
                  onClick={toggleCamera}
                >
                  <img 
                    src={isVideo ? CallIcon : VideocamIcon} 
                    alt={isVideo ? "audio" : "video"} 
                    className={styles.videoIcon}
                  />
                </button>
                <span className={styles.controlLabel}>
                  {isVideo ? "Audio Call" : "Video Call"}
                </span>
              </div>

              <div className={styles.controlItem}>
                <button
                  className={styles.controlBtn}
                  onClick={() => setIsGiftModalOpen(true)}
                >
                  <IoGift size={24} />
                </button>
                <span className={styles.controlLabel}>Send Gift</span>
              </div>

              <div className={styles.controlItem}>
                <button
                  className={`${styles.controlBtn} ${!micOn ? styles.muted : ''}`}
                  onClick={() => setMicOn((m) => !m)}
                >
                  {micOn ? <IoMic size={24} /> : <IoMicOff size={24} />}
                </button>
                <span className={styles.controlLabel}>
                  {micOn ? "Unmute Audio" : "Mute Audio"}
                </span>
              </div>

              <div className={styles.controlItem}>
                <button
                  className={`${styles.controlBtn} ${styles.endCallBtn}`}
                  onClick={endCall}
                >
                  <IoCallSharp size={24} />
                </button>
                <span className={styles.controlLabel}>End Call</span>
              </div>

              <div className={styles.controlItem}>
                <button className={styles.controlBtn}>
                  <IoVolumeHigh size={24} />
                </button>
                <span className={styles.controlLabel}>Speaker</span>
              </div>
            </div>

            {/* Timer and Recharge */}
            <div className={styles.bottomBar}>
              <div className={styles.callTimerBottom}>
                Call Ends in <span className={styles.timerRed}>{formatTime(callSeconds)}</span>
              </div>
              <button className={styles.rechargeBtn}>Recharge Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        astrologerId={activeCall?.astrologerId}
        astrologerName={callerName}
      />
    </>
  );
};

export default AgoraVoiceCalling;

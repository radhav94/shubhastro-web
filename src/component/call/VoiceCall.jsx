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
  IoVolumeMute,
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
import { useWalletBalance } from "../../screens/private/wallet/useWalletBalance";

// Import SVG icons from chat assets
import VideocamIcon from "../../assets/chat/Videocam.svg";
import CallIcon from "../../assets/chat/Call.svg";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const AgoraVoiceCalling = ({ callData }) => {
  const { activeCall, setActiveCall, callSeconds, setCallSeconds, startTimer, stopTimer } = useCall();
  const navigate = useNavigate();

  if (!activeCall || activeCall.callType !== "audio") return null;

  const { roomId, agoraToken, callerName, isUserSide, experience } = callData;

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
  const [speakerOn, setSpeakerOn] = useState(true);

  /* ================= WALLET BALANCE ================= */
  const { balance, isFetching } = useWalletBalance();

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;

    const startCall = async () => {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.setVolume(speakerOn ? 100 : 0);
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

  /* ================= SPEAKER TOGGLE ================= */
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Update volume for all remote users
    client.remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(speakerOn ? 100 : 0);
      }
    });
  }, [speakerOn]);

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
              <p className={styles.astrologerExp}> {experience} Years</p>
            </div>

            <div className={styles.groupBtns}>
              <button className={styles.chateM}>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M15 0H1.66667C0.75 0 0.00833333 0.75 0.00833333 1.66667L0 16.6667L3.33333 13.3333H15C15.9167 13.3333 16.6667 12.5833 16.6667 11.6667V1.66667C16.6667 0.75 15.9167 0 15 0ZM4.16667 5.83333H12.5C12.9583 5.83333 13.3333 6.20833 13.3333 6.66667C13.3333 7.125 12.9583 7.5 12.5 7.5H4.16667C3.70833 7.5 3.33333 7.125 3.33333 6.66667C3.33333 6.20833 3.70833 5.83333 4.16667 5.83333ZM9.16667 10H4.16667C3.70833 10 3.33333 9.625 3.33333 9.16667C3.33333 8.70833 3.70833 8.33333 4.16667 8.33333H9.16667C9.625 8.33333 10 8.70833 10 9.16667C10 9.625 9.625 10 9.16667 10ZM12.5 5H4.16667C3.70833 5 3.33333 4.625 3.33333 4.16667C3.33333 3.70833 3.70833 3.33333 4.16667 3.33333H12.5C12.9583 3.33333 13.3333 3.70833 13.3333 4.16667C13.3333 4.625 12.9583 5 12.5 5Z" fill="url(#paint0_linear_8989_297)"/>
                  <defs>
                    <linearGradient id="paint0_linear_8989_297" x1="0" y1="8.33333" x2="16.6667" y2="8.33333" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#F75801"/>
                      <stop offset="1" stop-color="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
                Chat
              </button>

              <button className={styles.chateM}>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="11" viewBox="0 0 17 11" fill="none">
                  <path d="M12.8333 4.125V0.916667C12.8333 0.4125 12.4208 0 11.9167 0H0.916667C0.4125 0 0 0.4125 0 0.916667V10.0833C0 10.5875 0.4125 11 0.916667 11H11.9167C12.4208 11 12.8333 10.5875 12.8333 10.0833V6.875L14.9325 8.97417C15.51 9.55167 16.5 9.13917 16.5 8.32333V2.6675C16.5 1.85167 15.51 1.43917 14.9325 2.01667L12.8333 4.125Z" fill="url(#paint0_linear_8989_303)"/>
                  <defs>
                    <linearGradient id="paint0_linear_8989_303" x1="0" y1="5.5" x2="16.5" y2="5.5" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#F75801"/>
                      <stop offset="1" stop-color="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
                Video
              </button>

              <span class={styles.dividerLine}></span>
            </div>

            <div className={styles.groupBtnsRight}>
              <div class={styles.callTimerBottom}>Call Ends in <span class={styles.timerRed}>147928:07</span></div>

              <button className={styles.chateEnd}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <g clip-path="url(#clip0_8989_310)">
                    <path d="M7.11979 8.87333C7.79636 9.5505 8.56101 10.1335 9.39313 10.6067L10.2398 9.76C10.4211 9.58076 10.6499 9.45723 10.8992 9.40406C11.1485 9.35089 11.4078 9.3703 11.6465 9.46C12.2513 9.6857 12.8797 9.84225 13.5198 9.92667C13.8402 9.97195 14.1331 10.1322 14.3441 10.3775C14.5551 10.6228 14.6696 10.9365 14.6665 11.26V13.26C14.6672 13.4457 14.6292 13.6294 14.5548 13.7996C14.4804 13.9697 14.3713 14.1224 14.2345 14.2479C14.0977 14.3734 13.9362 14.469 13.7603 14.5285C13.5844 14.588 13.398 14.61 13.2131 14.5933C11.1617 14.3704 9.19113 13.6694 7.45979 12.5467C6.65664 12.0367 5.91214 11.4398 5.23979 10.7667M3.45979 8.54C2.33703 6.80867 1.63603 4.83811 1.41313 2.78667C1.39647 2.60231 1.41838 2.41651 1.47746 2.24108C1.53654 2.06566 1.63151 1.90446 1.7563 1.76775C1.8811 1.63103 2.033 1.5218 2.20232 1.44701C2.37164 1.37222 2.55469 1.33351 2.73979 1.33333H4.73979C5.06333 1.33015 5.37699 1.44472 5.6223 1.65569C5.86761 1.86666 6.02784 2.15963 6.07313 2.48C6.15754 3.12004 6.31409 3.74848 6.53979 4.35333C6.62949 4.59195 6.6489 4.85127 6.59573 5.10059C6.54256 5.3499 6.41903 5.57874 6.23979 5.76L5.39313 6.60667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14.6668 1.33333L1.3335 14.6667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_8989_310">
                      <rect width="16" height="16" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                End
              </button>

              <span class={styles.dividerLine}></span>

              <button className={styles.rechargeButton}>
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5 0C2.23858 0 0 2.23858 0 5V28.3333C0 31.0948 2.23858 33.3333 5 33.3333H28.3333C31.0948 33.3333 33.3333 31.0948 33.3333 28.3333V11.6667C33.3333 9.48964 31.942 7.63757 30 6.95118V5C30 2.23858 27.7614 0 25 0H5ZM5 3.33333C4.07953 3.33333 3.33333 4.07953 3.33333 5C3.33333 5.92048 4.07953 6.66667 5 6.66667H26.6667V5C26.6667 4.07953 25.9205 3.33333 25 3.33333H5ZM25 16.6667C23.1591 16.6667 21.6667 18.1591 21.6667 20C21.6667 21.841 23.1591 23.3333 25 23.3333H28.3333C29.2538 23.3333 30 22.5871 30 21.6667V18.3333C30 17.4129 29.2538 16.6667 28.3333 16.6667H25Z" fill="url(#paint0_linear_9010_318)"/>
                  <defs>
                    <linearGradient id="paint0_linear_9010_318" x1="0" y1="16.6667" x2="33.3333" y2="16.6667" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#F75801"/>
                      <stop offset="1" stop-color="#D43400"/>
                    </linearGradient>
                  </defs>
                </svg>
              </button>

              {/* <div className={styles.walletBadge}>
                <span className={styles.walletIcon}>💰</span>
                <span className={styles.walletAmount}>
                  {isFetching ? "..." : balance !== null ? `₹${balance}` : "₹0"}
                </span>
              </div> */}

            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.actionBtn}>
              {/* <IoAttach size={16} /> */}
              <span>Attach File</span>
            </button>
            <button className={styles.actionBtn}>
              {/* <IoSparkles size={16} /> */}
              <span>Suggested Remedy</span>
            </button>
            <button className={styles.actionBtn}>
              {/* <IoTime size={16} /> */}
              <span>View History</span>
            </button>
          </div>

          {/* Voice Center (Avatar & Timer) */}
          {!isRemoteVideo && (
            <div className={styles.voiceCenter}>
              <div className={styles.voiceCenterWrap}>
                <div className={styles.avatarContainer}>
                  <span className={styles.onlineCircle}></span>
                  <img
                    className={styles.avatar}
                    src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    alt="avatar"
                  />
                </div>
                <h1 className={styles.callerNameTitle}>Dr. Anjali Sharma</h1>
                <span className={styles.totalTime}>45:00</span>
              </div>

              <button className={styles.rechargeNowBtn}>Recharge Now
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="15" viewBox="0 0 8 15" fill="none">
                  <path d="M0.75 13.95L6.18333 8.51667C6.825 7.875 6.825 6.825 6.18333 6.18333L0.75 0.75" stroke="#FEFEFE" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div className={styles.callTimer}>
                {joined ? formatTime(callSeconds) : "Connecting…"}
              </div>
            </div>
          )}

          {/* Floating Sparkle Button */}
          {/* <button 
            className={styles.floatingSparkleBtn}
            onClick={() => {
              setIsMinimized(true);
              navigate(PATH.privateRoutes.AI_WOW.path);
            }}
            aria-label="AI Wow"
          >
            <IoSparkles size={32} />
          </button> */}

          {/* Bottom Controls */}
          <div className={styles.bottomControls}>
            <div className={styles.controlGrid}>
              {/* <div className={styles.controlItem}>
                <button className={styles.controlBtn}>
                  <IoSwapHorizontal size={24} />
                </button>
                <span className={styles.controlLabel}>Switch Profile</span>
              </div> */}

              {/* <div className={styles.controlItem}>
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
              </div> */}

              <div className={`${styles.controlItem} ${styles.giftWrapMain}`}>
                <button
                  className={`${styles.controlBtn} ${styles.sendGiftBg}`}
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
                <button 
                  className={`${styles.controlBtn} ${!speakerOn ? styles.muted : ''}`}
                  onClick={() => setSpeakerOn((s) => !s)}
                >
                  {speakerOn ? <IoVolumeHigh size={24} /> : <IoVolumeMute size={24} />}
                </button>
                <span className={styles.controlLabel}>
                  {speakerOn ? "Speaker On" : "Speaker Off"}
                </span>
              </div>
            </div>

            {/* <div className={styles.bottomBar}>
              <div className={styles.callTimerBottom}>
                Call Ends in <span className={styles.timerRed}>{formatTime(callSeconds)}</span>
              </div>
              <button className={styles.rechargeBtn}>Recharge Now</button>
            </div> */}
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

import { useEffect, useRef, useState, useMemo } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoArrowBack,
  IoCamera,
  IoGift,
  IoSwapHorizontal,
  IoSparkles,
  IoAttach,
  IoTime,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./VideoCalling.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import VideoCallChat from "./VideoCallChat";
import GiftModal from "./GiftModal";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const VideoCalling = ({ callData }) => {
  const { activeCall, setActiveCall, lastRequestedAstro, setOpenReview, setReviewData, callSeconds, setCallSeconds, startTimer, stopTimer } = useCall();
  const navigate = useNavigate();

  if (!activeCall || activeCall.callType !== "video") return null;

  const { roomId, agoraToken, isUserSide, callerName } = callData;

  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const camTrackRef = useRef(null);

  const localVideoFullRef = useRef(null);
  const [isLocalBig, setIsLocalBig] = useState(false);

  const localVideoMiniRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanupRef = useRef(false);
  const endCallRef = useRef(false);

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat panel state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  /* ================= LOCAL VIDEO ================= */
  const playLocalVideo = (container) => {
    if (!camTrackRef.current || !container) return;

    try {
      console.log("🛑 [playLocalVideo] Stopping camera track");
      camTrackRef.current.stop(); // 🔥 IMPORTANT
    } catch (e) {
      console.error("❌ [playLocalVideo] Error stopping track:", e);
    }

    console.log("🧹 [playLocalVideo] Clearing container");
    container.innerHTML = "";
    
    console.log("▶️ [playLocalVideo] Playing camera track");
    camTrackRef.current.play(container);
  };


  /* ================= REMOTE VIDEO SAFE PLAY ================= */
  // const safePlayRemoteVideo = (track) => {
  //   if (!remoteVideoRef.current || !track) return;

  //   remoteVideoRef.current.innerHTML = "";
  //   const div = document.createElement("div");
  //   div.style.width = "100%";
  //   div.style.height = "100%";
  //   remoteVideoRef.current.appendChild(div);

  //   setTimeout(() => {
  //     try {
  //       track.play(div);
  //     } catch (e) {
  //       console.warn("Retry remote video play");
  //       setTimeout(() => track.play(div), 300);
  //     }
  //   }, 150);
  // };

  const safePlayRemoteVideo = (track) => {
    console.log("🌐 [safePlayRemoteVideo] Called", { 
      hasTrack: !!track, 
      isLocalBig 
    });
    
    if (!track) {
      console.warn("⚠️ [safePlayRemoteVideo] No track provided");
      return;
    }

    const container = isLocalBig
      ? localVideoFullRef.current
      : remoteVideoRef.current;

    console.log("📦 [safePlayRemoteVideo] Container selected", { 
      isLocalBig, 
      hasContainer: !!container 
    });

    if (!container) {
      console.warn("⚠️ [safePlayRemoteVideo] No container available");
      return;
    }

    try {
      console.log("🛑 [safePlayRemoteVideo] Stopping remote track");
      track.stop(); // 🔥 VERY IMPORTANT
    } catch (e) {
      console.error("❌ [safePlayRemoteVideo] Error stopping track:", e);
    }

    console.log("🧹 [safePlayRemoteVideo] Clearing container");
    container.innerHTML = "";

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    container.appendChild(div);

    setTimeout(() => {
      try {
        console.log("▶️ [safePlayRemoteVideo] Playing remote track");
        track.play(div);
      } catch (err) {
        console.warn("⚠️ [safePlayRemoteVideo] Retry remote video play", err);
        setTimeout(() => {
          console.log("🔄 [safePlayRemoteVideo] Second attempt to play");
          track.play(div);
        }, 300);
      }
    }, 100);
  };


  /* ================= RESUME REMOTE AUDIO ================= */
  const resumeRemoteTracks = () => {
    console.log("🔊 [resumeRemoteTracks] Called");
    
    if (!clientRef.current) {
      console.warn("⚠️ [resumeRemoteTracks] No client available");
      return;
    }

    console.log("👥 [resumeRemoteTracks] Remote users count:", clientRef.current.remoteUsers.length);
    
    clientRef.current.remoteUsers.forEach((user, index) => {
      console.log(`👤 [resumeRemoteTracks] Processing user ${index}:`, {
        hasAudio: !!user.audioTrack,
        hasVideo: !!user.videoTrack
      });
      
      if (user.audioTrack) {
        console.log(`🔊 [resumeRemoteTracks] Playing audio for user ${index}`);
        user.audioTrack.play();
      }
      if (user.videoTrack && remoteVideoRef.current) {
        console.log(`📹 [resumeRemoteTracks] Playing video for user ${index}`);
        safePlayRemoteVideo(user.videoTrack);
      }
    });
  };

  const resumeRemoteAudio = resumeRemoteTracks;

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;
    endCallRef.current = false;

    const start = async () => {
      try {
        console.log("🔧 [START CALL] Initializing call");
        
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video" && user.videoTrack) {
            safePlayRemoteVideo(user.videoTrack);
          }

          if (mediaType === "audio" && user.audioTrack) {
            // ✅ REQUIRED FOR CROSS DEVICE
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          console.log("📢 [user-unpublished] Event fired", { userId: user.uid, mediaType });
          if (remoteVideoRef.current) {
            console.log("🧹 [user-unpublished] Clearing remote video");
            // remoteVideoRef.current.innerHTML = "";
          }
        });

        client.on("user-left", safeEndCall);

        await client.join(APP_ID, roomId, agoraToken, null);

        micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        camTrackRef.current = await AgoraRTC.createCameraVideoTrack();

        await client.publish([micTrackRef.current, camTrackRef.current]);

        setJoined(true);
        const seconds = Number(activeCall.remainingTime) * 60;
        setCallSeconds(seconds);
        startTimer();
      } catch (err) {
        console.error("CALL START ERROR", err);
        safeEndCall();
      }
    };

    start();
    return () => {
      console.log("🧹 [START CALL] useEffect cleanup");
      cleanup();
    };
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= LOCAL VIDEO ================= */


  useEffect(() => {
    if (!joined) return;

    if (isMinimized) {
      playLocalVideo(localVideoMiniRef.current);
    } else if (isLocalBig) {
      playLocalVideo(remoteVideoRef.current); // local goes big
    } else {
      playLocalVideo(localVideoFullRef.current); // local stays small
    }
  }, [joined, isMinimized, isLocalBig]);

  useEffect(() => {
    if (!clientRef.current) return;
    resumeRemoteTracks();
  }, [isLocalBig]);


  useEffect(() => {
    if (micTrackRef.current) {
      micTrackRef.current.setEnabled(micOn);
    } else {
      console.warn("⚠️ [MIC STATE] No mic track available");
    }
    resumeRemoteAudio();
  }, [micOn]);

  useEffect(() => {
    if (camTrackRef.current) {
      camTrackRef.current.setEnabled(cameraOn);
    } else {
      console.warn("⚠️ [CAMERA STATE] No camera track available");
    }
  }, [cameraOn]);

  /* ================= REMOTE VIDEO SAFETY REPLAY ================= */
  useEffect(() => {
    if (!joined || !clientRef.current) {
      console.log("⚠️ [REMOTE VIDEO SAFETY] Not ready, skipping");
      return;
    }

    clientRef.current.remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        safePlayRemoteVideo(user.videoTrack);
      }
    });
  }, [joined]);

  /* ================= CLEANUP ================= */
  const cleanup = async () => {
    console.log("🧹 [CLEANUP] Called", { alreadyCleaning: cleanupRef.current });
    
    if (cleanupRef.current) {
      console.log("⚠️ [CLEANUP] Already cleaning up, skipping");
      return;
    }
    cleanupRef.current = true;

    try {
      
      if (micTrackRef.current) {
        micTrackRef.current.stop();
        micTrackRef.current.close();
      }
      
      if (camTrackRef.current) {
        camTrackRef.current.stop();
        camTrackRef.current.close();
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    } catch (e) {
      console.error("❌ [CLEANUP] Error during cleanup:", e);
    } finally {

      micTrackRef.current = null;
      camTrackRef.current = null;
      clientRef.current = null;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = "";
      }

      setJoined(false);
      setActiveCall(null);
      stopTimer();
    }
  };

  /* ================= SAFE END CALL ================= */
  const safeEndCall = async () => {
    if (endCallRef.current) return;
    endCallRef.current = true;

    setReviewData({
      astrologerID: activeCall.astrologerID,
      fullName: activeCall.callerName,
    });

    voiceSocket.emit("call:end", {
      roomId,
      endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
    });

    setOpenReview(true);
    await cleanup();
  };

  /* ================= SOCKET ================= */
  useEffect(() => {
    voiceSocket.on("call:ended", safeEndCall);
    voiceSocket.on("force_call_end", safeEndCall);
    voiceSocket.on("disconnect", safeEndCall);

    return () => {
      voiceSocket.off("call:ended", safeEndCall);
      voiceSocket.off("force_call_end", safeEndCall);
      voiceSocket.off("disconnect", safeEndCall);
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

  /* ================= CHAT ================= */
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const openChatWithMinimize = () => {
    setIsMinimized(true);
    setTimeout(() => {
      if (isUserSide) {
        navigate(`/chat-with-astrologers/${activeCall.astrologerId}`, {
          state: {
            roomId: activeCall.chatRoomId,
            userId: activeCall.userId,
            astrologerId: activeCall.astrologerId,
            kundliId: activeCall.kundliId,
            fullName: activeCall.callerName,
            isUserSide: true,
          },
        });
      }
    }, 50);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  // Memoize chat data to prevent unnecessary re-renders
  const astrologerName = lastRequestedAstro?.firstName + " " + lastRequestedAstro?.lastName;
  const chatData = useMemo(() => ({
    userId: activeCall.userId,
    astrologerId: activeCall.astrologerId,
    chatRoomId: activeCall.roomId,
    kundliId: activeCall.kundliId,
    isUserSide: activeCall.isUserSide,
    astrologerName: astrologerName
  }), [activeCall.userId, activeCall.astrologerId, activeCall.chatRoomId, activeCall.kundliId, activeCall.isUserSide, astrologerName]);

  return (
    <>
      {/* MINI VIEW */}
      <div
        className={styles.floatingMini}
        style={{
          top: position.y,
          left: position.x,
          display: isMinimized ? "block" : "none",
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className={styles.miniHeader}>
          <span>
            {callerName || "Video Call"} • {formatTime(callSeconds)}
          </span>
          <button onClick={() => setIsMinimized(false)}>⤢</button>
        </div>

        <div className={styles.miniVideo}>
          <div
            ref={localVideoMiniRef}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div className={styles.miniControls}>
          <button onClick={() => setMicOn((p) => !p)}>
            {micOn ? <IoMic size={18} /> : <IoMicOff size={18} />}
          </button>
          <button onClick={() => setCameraOn((p) => !p)}>
            {cameraOn ? <IoVideocam size={18} /> : <IoVideocamOff size={18} />}
          </button>
          <button className={styles.endBtnMini} onClick={safeEndCall}>
            ✕
          </button>
        </div>
      </div>

      {/* FULL VIEW */}
      <div
        className={styles.videoContainer}
        style={{ visibility: isMinimized ? "hidden" : "visible" }}
      >
        {!joined ? (
          <div className={styles.waitingText}>Connecting…</div>
        ) : (
          <>
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

            {/* Video Area */}
            <div className={styles.videoWrapper}>
              <div ref={remoteVideoRef} className={styles.remoteVideoArea} />

              {/* Local Video Preview (PIP) */}
              <div
                className={styles.localVideoPreview}
                onClick={() => setIsLocalBig((p) => !p)}
              >
                <div
                  ref={localVideoFullRef}
                  style={{ width: "100%", height: "100%", cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={styles.bottomControls}>
              {/* Control Buttons Grid */}
              <div className={styles.controlGrid}>
                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => setIsLocalBig((p) => !p)}
                  >
                    <IoSwapHorizontal size={24} />
                  </button>
                  <span className={styles.controlLabel}>Switch Profile</span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={toggleChat}
                  >
                    <IoSparkles size={24} />
                  </button>
                  <span className={styles.controlLabel}>AI Wow</span>
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
                    onClick={() => setMicOn((p) => !p)}
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
                    onClick={safeEndCall}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19.23 15.26L16.69 14.97C16.08 14.9 15.48 15.11 15.05 15.54L13.21 17.38C10.38 15.94 8.06004 13.63 6.62004 10.79L8.47004 8.94001C8.90004 8.51001 9.11004 7.91001 9.04004 7.30001L8.75004 4.78001C8.63004 3.77001 7.78004 3.01001 6.76004 3.01001H5.03004C3.90004 3.01001 2.96004 3.95001 3.03004 5.08001C3.56004 13.62 10.39 20.44 18.92 20.97C20.05 21.04 20.99 20.1 20.99 18.97V17.24C21 16.23 20.24 15.38 19.23 15.26Z" fill="currentColor"/>
                    </svg>
                  </button>
                  <span className={styles.controlLabel}>End Call</span>
                </div>

                <div className={styles.controlItem}>
                  <button
                    className={styles.controlBtn}
                    onClick={() => setCameraOn((p) => !p)}
                  >
                    {cameraOn ? <IoCamera size={24} /> : <IoVideocamOff size={24} />}
                  </button>
                  <span className={styles.controlLabel}>Switch Camera</span>
                </div>
              </div>

              {/* Timer and Recharge */}
              <div className={styles.bottomBar}>
                <div className={styles.callTimer}>
                  Call Ends in <span className={styles.timerRed}>{formatTime(callSeconds)}</span>
                </div>
                <button className={styles.rechargeBtn}>Recharge Now</button>
              </div>
            </div>
          </>
        )}

        {/* Chat Panel */}
        <VideoCallChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          videoCallData={chatData}
        />

        {/* Gift Modal */}
        <GiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          astrologerId={activeCall?.astrologerId}
          astrologerName={callerName}
        />
      </div>
    </>
  );
};

export default VideoCalling;
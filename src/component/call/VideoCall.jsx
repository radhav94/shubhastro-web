import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoArrowBack,
  IoChatbubbleEllipses,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./VideoCalling.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const VideoCalling = ({ callData }) => {
  const { activeCall, setActiveCall } = useCall();
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

  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  /* ================= LOCAL VIDEO ================= */
 const playLocalVideo = (container) => {
  if (!camTrackRef.current || !container) return;

  try {
    camTrackRef.current.stop(); // 🔥 IMPORTANT
  } catch (e) {}

  container.innerHTML = "";
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
  if (!track) return;

  const container = isLocalBig
    ? localVideoFullRef.current
    : remoteVideoRef.current;

  if (!container) return;

  try {
    track.stop(); // 🔥 VERY IMPORTANT
  } catch (e) {}

  container.innerHTML = "";

  const div = document.createElement("div");
  div.style.width = "100%";
  div.style.height = "100%";
  container.appendChild(div);

  setTimeout(() => {
    try {
      track.play(div);
    } catch (err) {
      console.warn("Remote play retry");
      setTimeout(() => track.play(div), 300);
    }
  }, 100);
};


  /* ================= RESUME REMOTE AUDIO ================= */
  const resumeRemoteTracks = () => {
    if (!clientRef.current) return;

    clientRef.current.remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        user.audioTrack.play();
      }
      if (user.videoTrack && remoteVideoRef.current) {
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

        client.on("user-unpublished", () => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = "";
          }
        });

        client.on("user-left", safeEndCall);

        await client.join(APP_ID, roomId, agoraToken, null);

        micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        camTrackRef.current = await AgoraRTC.createCameraVideoTrack();

        await client.publish([micTrackRef.current, camTrackRef.current]);

        setJoined(true);

        timerRef.current = setInterval(() => {
          setCallSeconds((p) => p + 1);
        }, 1000);
      } catch (err) {
        console.error("CALL START ERROR", err);
        safeEndCall();
      }
    };

    start();
    return () => cleanup();
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
    micTrackRef.current?.setEnabled(micOn);
    resumeRemoteAudio();
  }, [micOn]);

  useEffect(() => {
    camTrackRef.current?.setEnabled(cameraOn);
  }, [cameraOn]);

  /* ================= REMOTE VIDEO SAFETY REPLAY ================= */
  useEffect(() => {
    if (!joined || !clientRef.current) return;

    clientRef.current.remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        safePlayRemoteVideo(user.videoTrack);
      }
    });
  }, [joined]);

  /* ================= CLEANUP ================= */
  const cleanup = async () => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;

    try {
      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      camTrackRef.current?.stop();
      camTrackRef.current?.close();

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      micTrackRef.current = null;
      camTrackRef.current = null;
      clientRef.current = null;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = "";
      }

      setJoined(false);
      setCallSeconds(0);
      setActiveCall(null);
    }
  };

  /* ================= SAFE END CALL ================= */
  const safeEndCall = async () => {
    if (endCallRef.current) return;
    endCallRef.current = true;

    voiceSocket.emit("call:end", {
      roomId,
      endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
    });

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
        onClick={resumeRemoteAudio}
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
          <button onClick={() => setMicOn((p) => !p)}>🎙️</button>
          <button onClick={() => setCameraOn((p) => !p)}>📷</button>
          <button className={styles.endBtnMini} onClick={safeEndCall}>
            📞
          </button>
        </div>
      </div>

      {/* FULL VIEW */}
      <div
        className={styles.videoContainer}
        style={{ visibility: isMinimized ? "hidden" : "visible" }}
        onClick={resumeRemoteTracks}
      >
        <button
          className={styles.minimizeBtn}
          onClick={() => setIsMinimized(true)}
        >
          <IoArrowBack size={20} />
        </button>

        {!joined ? (
          <div className={styles.waitingText}>Connecting…</div>
        ) : (
          <div className={styles.videoWrapper}>
            <div ref={remoteVideoRef} className={styles.remoteVideoArea} />

            <div
              className={styles.localVideoPreview}
              onClick={() => setIsLocalBig((p) => !p)}
            >
              <div
                ref={localVideoFullRef}
                style={{ width: "100%", height: "100%", cursor: "pointer" }}
              />
            </div>

            <div className={styles.controls}>
              <div className={styles.callInfo}>
                <span className={styles.callerName}>{callerName}</span>
                <span className={styles.callTimer}>
                  ⏱️ {formatTime(callSeconds)}
                </span>
              </div>

              <div className={styles.controlButtons}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setMicOn((p) => !p)}
                >
                  {micOn ? <IoMic size={22} /> : <IoMicOff size={22} />}
                </button>

                <button
                  className={styles.iconBtn}
                  onClick={() => setCameraOn((p) => !p)}
                >
                  {cameraOn ? (
                    <IoVideocam size={22} />
                  ) : (
                    <IoVideocamOff size={22} />
                  )}
                </button>

                <button
                  className={`${styles.iconBtn} ${styles.endBtn}`}
                  onClick={safeEndCall}
                >
                  End
                </button>

                <button
                  className={styles.iconBtn}
                  onClick={openChatWithMinimize}
                >
                  <IoChatbubbleEllipses size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideoCalling;
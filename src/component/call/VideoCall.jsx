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
import { PATH } from "../../utils/routes/Paths";

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
  const localVideoMiniRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const cleanupRef = useRef(false);

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  /* ================= START CALL ================= */
  useEffect(() => {
    cleanupRef.current = false;

    const start = async () => {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "audio") user.audioTrack?.play();

        if (mediaType === "video" && remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = "";
          const div = document.createElement("div");
          div.style.width = "100%";
          div.style.height = "100%";
          remoteVideoRef.current.appendChild(div);
          user.videoTrack.play(div);
        }
      });

      client.on("user-unpublished", () => {
        if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = "";
      });

      client.on("user-left", endCall);

      await client.join(APP_ID, roomId, agoraToken, null);

      micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      camTrackRef.current = await AgoraRTC.createCameraVideoTrack();

      await client.publish([micTrackRef.current, camTrackRef.current]);

      requestAnimationFrame(() => {
        if (localVideoFullRef.current) {
          camTrackRef.current.play(localVideoFullRef.current);
        }
      });

      setJoined(true);
    };

    start();
    return () => cleanup();
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= TOGGLES ================= */
  useEffect(() => {
    micTrackRef.current?.setEnabled(micOn);
  }, [micOn]);

  useEffect(() => {
    camTrackRef.current?.setEnabled(cameraOn);
  }, [cameraOn]);

  /* ================= SWITCH SELF PREVIEW ================= */
  useEffect(() => {
    if (!camTrackRef.current) return;

    if (isMinimized && localVideoMiniRef.current) {
      camTrackRef.current.play(localVideoMiniRef.current);
    }

    if (!isMinimized && localVideoFullRef.current) {
      camTrackRef.current.play(localVideoFullRef.current);
    }
  }, [isMinimized]);

  /* ================= CLEANUP ================= */
 const cleanup = async () => {
  if (cleanupRef.current) return;
  cleanupRef.current = true;

  try {
    await micTrackRef.current?.stop();
    await micTrackRef.current?.close();

    await camTrackRef.current?.stop();
    await camTrackRef.current?.close();

    await clientRef.current?.leave();
  } catch (e) {
    console.warn(e);
  } finally {
    micTrackRef.current = null;
    camTrackRef.current = null;
    clientRef.current = null;

    setJoined(false);
    setActiveCall(null);
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

  /* ================= CHAT + MINIMIZE ================= */
  const openChatWithMinimize = () => {
    setIsMinimized(true);

    setTimeout(() => {
      if (isUserSide) {
        navigate(`/talk-to-astrologers/${activeCall.astrologerId}`, {
          state: {
            roomId: activeCall.chatRoomId,
            userId: activeCall.userId,
            astrologerId: activeCall.astrologerId,
            kundliId: activeCall.kundliId,
            fullName: activeCall.callerName,
            isUserSide: true,
          },
        });
      } else {
        navigate(PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path);
      }
    }, 50);
  };

  /* ================= UI ================= */
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
          <span>{callerName || "Video Call"}</span>
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
          <button className={styles.endBtnMini} onClick={endCall}>
            📞
          </button>
        </div>
      </div>

      {/* FULL SCREEN */}
      <div
        className={styles.videoContainer}
        style={{
          visibility: isMinimized ? "hidden" : "visible",
          pointerEvents: isMinimized ? "none" : "auto",
        }}
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

            <div className={styles.localVideoPreview}>
              <div
                ref={localVideoFullRef}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div className={styles.controls}>
              <button onClick={() => setMicOn((p) => !p)}>
                {micOn ? <IoMic /> : <IoMicOff />}
              </button>
              <button onClick={() => setCameraOn((p) => !p)}>
                {cameraOn ? <IoVideocam /> : <IoVideocamOff />}
              </button>
              <button className={styles.endBtn} onClick={endCall}>
                End
              </button>
              <button onClick={openChatWithMinimize}>
                <IoChatbubbleEllipses />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideoCalling;

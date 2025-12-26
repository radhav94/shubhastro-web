import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  IoMic,
  IoMicOff,
  IoArrowBack,
  IoChatbubbleEllipses,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { PATH } from "../../utils/routes/Paths";

const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";

const AgoraVoiceCalling = ({ callData }) => {
  const { activeCall, setActiveCall } = useCall();
  const navigate = useNavigate();

  if (!activeCall || activeCall.callType !== "audio") return null;

  const { roomId, agoraToken, callerName, isUserSide } = callData;

  /* ================= REFS ================= */
  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cleanupRef = useRef(false);

  /* ================= STATE ================= */
  const [micOn, setMicOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [callState, setCallState] = useState("connecting");
  const [timer, setTimer] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

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
      });

      client.on("user-left", endCall);

      await client.join(APP_ID, roomId, agoraToken, null);

      micTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([micTrackRef.current]);

      setJoined(true);
      setCallState("connected");
    };

    startCall();

    return () => cleanup();
    // eslint-disable-next-line
  }, [roomId]);

  /* ================= MIC TOGGLE ================= */
  useEffect(() => {
    micTrackRef.current?.setEnabled(micOn);
  }, [micOn]);

  /* ================= TIMER ================= */
  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  /* ================= CLEANUP ================= */
  const cleanup = async () => {
    if (cleanupRef.current) return;
    cleanupRef.current = true;

    try {
      await micTrackRef.current?.stop();
      await micTrackRef.current?.close();
      await clientRef.current?.leave();
    } catch (e) {
      console.warn("Voice cleanup error:", e);
    } finally {
      micTrackRef.current = null;
      clientRef.current = null;
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

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  /* ================= UI ================= */
  return (
    <>
      {/* MINI VIEW */}
      {isMinimized && (
        <div
          className={styles.premiumMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className={styles.miniInfo}>
            <p className={styles.miniName}>{callerName}</p>
            <span className={styles.miniStatus}>
              {joined ? formatTime(timer) : "Calling…"}
            </span>
          </div>

          <div className={styles.miniControls}>
            <button onClick={() => setMicOn((m) => !m)}>
              {micOn ? <IoMic /> : <IoMicOff />}
            </button>

            <button className={styles.endBtn} onClick={endCall}>
              End
            </button>

            <button onClick={() => setIsMinimized(false)}>⤢</button>
          </div>
        </div>
      )}

      {/* FULL VIEW */}
      {!isMinimized && (
        <div className={styles.fullscreenWrapper}>
          <button
            className={styles.minimizeBtn}
            onClick={() => setIsMinimized(true)}
          >
            <IoArrowBack size={20} />
          </button>

          <div className={styles.callingContainer}>
            <h2>{callerName}</h2>

            <p className={styles.status}>
              {joined ? `Connected • ${formatTime(timer)}` : "Connecting…"}
            </p>

            <div className={styles.controls}>
              <button onClick={() => setMicOn((m) => !m)}>
                {micOn ? <IoMic size={28} /> : <IoMicOff size={28} />}
              </button>

              <button className={styles.endBtn} onClick={endCall}>
                End
              </button>

              <button
                onClick={() => {
                  setIsMinimized(true);
                  isUserSide
                    ? navigate(
                        `/talk-to-astrologers/${activeCall.astrologerId}`,
                        {
                          state: {
                            roomId: activeCall.chatRoomId,
                            userId: activeCall.userId,
                            astrologerId: activeCall.astrologerId,
                            kundliId: activeCall.kundliId,
                            fullName: activeCall.callerName,
                            isUserSide: true,
                          },
                        }
                      )
                    : navigate(
                        PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path
                      );
                }}
              >
                <IoChatbubbleEllipses size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgoraVoiceCalling;

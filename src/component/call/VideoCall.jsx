import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import {
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoArrowBack,
  IoChatbubbleEllipses,
} from "react-icons/io5";

import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import styles from "./VideoCalling.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";

export const VideoCalling = ({ callData }) => {
  const [clientKey, setClientKey] = useState(0);

  // 🔥 FORCE NEW AGORA CLIENT PER ROOM (MAIN FIX)
  useEffect(() => {
    setClientKey((k) => k + 1);
  }, [callData.roomId]);

  return (
    <AgoraRTCProvider
      key={clientKey}
      client={AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })}
    >
      <Basics callData={callData} />
    </AgoraRTCProvider>
  );
};

const Basics = ({ callData }) => {
  const client = useRTCClient();
  const { activeCall, setActiveCall } = useCall();
  const navigate = useNavigate();

  const { roomId, agoraToken, isUserSide, callerName } = callData;

  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  const cleanupDoneRef = useRef(false);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();

  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  /* 🔥 FORCE LEAVE OLD CHANNEL BEFORE JOIN */
  useEffect(() => {
    cleanupDoneRef.current = false;

    const safeLeave = async () => {
      if (client.connectionState === "CONNECTED") {
        await client.leave();
      }
    };

    safeLeave();
  }, [roomId]);

  /* JOIN CHANNEL */
  const { isConnected } = useJoin(
    {
      appid: appId,
      channel: roomId,
      token: agoraToken,
    },
    Boolean(roomId && agoraToken)
  );

  useEffect(() => {
  if (client.connectionState === "CONNECTED") {
    setHasJoinedOnce(true);
  }
}, [client.connectionState]);


  /* TRACK JOIN STATE */
  useEffect(() => {
    if (isConnected) setHasJoinedOnce(true);
  }, [isConnected]);

  /* SINGLE SOURCE OF PUBLISH */
  usePublish([
    ...(localMicrophoneTrack ? [localMicrophoneTrack] : []),
    ...(localCameraTrack ? [localCameraTrack] : []),
  ]);

  /* SYNC MIC / CAMERA */
  useEffect(() => {
    localMicrophoneTrack?.setEnabled(micOn);
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => {
    localCameraTrack?.setEnabled(cameraOn);
  }, [cameraOn, localCameraTrack]);

  /* CLEANUP */
  const cleanupCall = async () => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    try {
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();

      localCameraTrack?.stop();
      localCameraTrack?.close();

      if (client.connectionState !== "DISCONNECTED") {
        await client.leave();
      }
    } catch (e) {
      console.warn("Cleanup error:", e);
    } finally {
      setActiveCall(null);
    }
  };

  /* SOCKET EVENTS */
  useEffect(() => {
    const end = async () => cleanupCall();

    voiceSocket.on("call_ended", end);
    voiceSocket.on("force_call_end", end);
    voiceSocket.on("disconnect", end);

    return () => {
      voiceSocket.off("call_ended", end);
      voiceSocket.off("force_call_end", end);
      voiceSocket.off("disconnect", end);
    };
  }, []);

  /* REMOTE USER LEFT */
  useEffect(() => {
    const onRemoteLeave = async () => cleanupCall();
    client.on("user-left", onRemoteLeave);
    return () => client.off("user-left", onRemoteLeave);
  }, []);

  /* END CALL */
  const endCall = async () => {
    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";
    voiceSocket.emit("call_end", { roomId, endedBy });
    await cleanupCall();
  };

  /* DRAG LOGIC (UNCHANGED) */
  const dragOffset = useRef({ x: 0, y: 0 });

  const startDrag = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setPosition({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y,
    });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  return (
    <>
      {/* MINI WINDOW */}
      {isMinimized && (
        <div
          className={styles.floatingMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className={styles.miniHeader}>
            <span className={styles.miniTitle}>
              {callerName || "Video Call"}
            </span>

            <button
              className={styles.expandBtn}
              onClick={() => setIsMinimized(false)}
            >
              ⤢
            </button>
          </div>

          <div className={styles.miniVideo}>
            {remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} playVideo playAudio />
            ) : (
              <div className={styles.miniWaiting}>Connecting…</div>
            )}
          </div>

          <div className={styles.miniControls}>
            <button
              className={`${styles.iconBtn} ${!micOn ? styles.activeRed : ""}`}
              onClick={() => setMic((p) => !p)}
            >
              {micOn ? "🎙️" : "🔇"}
            </button>

            <button
              className={`${styles.iconBtn} ${
                !cameraOn ? styles.activeRed : ""
              }`}
              onClick={() => setCamera((p) => !p)}
            >
              {cameraOn ? "📷" : "🚫"}
            </button>

            <button
              className={`${styles.iconBtn} ${styles.endBtnMini}`}
              onClick={endCall}
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN */}
      {!isMinimized && (
        <div className={styles.videoContainer}>
          <button
            className={styles.minimizeBtn}
            onClick={() => setIsMinimized(true)}
          >
            <IoArrowBack size={20} />
          </button>

          {!hasJoinedOnce ? (
            <div className={styles.joinContainer}>
              <div className={styles.waitingText}>
                Connecting to video call…
              </div>
            </div>
          ) : (
            <div className={styles.videoWrapper}>
              <div className={styles.remoteVideoArea}>
                {remoteUsers.length > 0 ? (
                  remoteUsers.map((user) => (
                    <RemoteUser
                      key={user.uid}
                      user={user}
                      playVideo
                      playAudio
                    />
                  ))
                ) : (
                  <div className={styles.waitingText}>
                    Waiting for remote user…
                  </div>
                )}
              </div>

              {cameraOn && (
                <div className={styles.localVideoPreview}>
                  <LocalUser
                    key={roomId} // 🔥 FORCE REMOUNT
                    audioTrack={localMicrophoneTrack}
                    videoTrack={localCameraTrack}
                    micOn={micOn}
                    cameraOn={cameraOn}
                    playVideo
                  />
                </div>
              )}

              <div className={styles.controls}>
                <button
                  onClick={() => setMic((p) => !p)}
                  className={styles.controlBtn}
                >
                  {micOn ? <IoMic size={20} /> : <IoMicOff size={20} />}
                </button>

                <button
                  onClick={() => setCamera((p) => !p)}
                  className={styles.controlBtn}
                >
                  {cameraOn ? (
                    <IoVideocam size={20} />
                  ) : (
                    <IoVideocamOff size={20} />
                  )}
                </button>

                <button className={styles.endBtn} onClick={endCall}>
                  End
                </button>

                <button
                  className={styles.chatBtn}
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
          )}
        </div>
      )}
    </>
  );
};

export default VideoCalling;

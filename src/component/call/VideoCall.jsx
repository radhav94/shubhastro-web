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

// import { useCall } from "../../context/CallContext";

export const VideoCalling = ({ callData }) => {
  const client = useRTCClient(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );

  return (
    <AgoraRTCProvider client={client}>
      <Basics client={client} callData={callData} />
    </AgoraRTCProvider>
  );
};

const Basics = ({ client, callData }) => {
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
  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  // Join channel
  const { isConnected } = useJoin(
    { appid: appId, channel: roomId, token: agoraToken },
    true
  );

  const remoteUsers = useRemoteUsers();

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
      console.warn("Cleanup safe error:", e);
    } finally {
      setActiveCall(null);
    }
  };

  // Sync mic/camera
  useEffect(() => {
    localMicrophoneTrack?.setEnabled(micOn);
    localCameraTrack?.setEnabled(cameraOn);
  }, [micOn, cameraOn]);

  // Publish tracks
  usePublish([
    ...(localMicrophoneTrack && micOn ? [localMicrophoneTrack] : []),
    ...(localCameraTrack && cameraOn ? [localCameraTrack] : []),
  ]);

  // Remote user left → end call
  useEffect(() => {
    if (isConnected) setHasJoinedOnce(true);
  }, [isConnected]);

  useEffect(() => {
    const onCallEnded = async () => {
      await cleanupCall();
    };

    const onSocketDisconnect = async () => {
      await cleanupCall();
    };

    voiceSocket.on("call_ended", onCallEnded);
    voiceSocket.on("disconnect", onSocketDisconnect);

    return () => {
      voiceSocket.off("call_ended", onCallEnded);
      voiceSocket.off("disconnect", onSocketDisconnect);
    };
  }, []);

  useEffect(() => {
    const onRemoteLeave = async () => {
      await cleanupCall();
    };

    client.on("user-left", onRemoteLeave);
    return () => client.off("user-left", onRemoteLeave);
  }, []);

  // End call manually
  const endCall = async () => {
    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

    voiceSocket.emit("call_end", {
      roomId,
      endedBy,
    });

    await cleanupCall();
  };

    const dragOffset = useRef({ x: 0, y: 0 });



  const startDrag = (e) => {
    e.preventDefault(); // ⭐ REQUIRED FOR MOBILE

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
    e.preventDefault(); // ⭐ mobile scroll stop

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
      {isMinimized && (
        <div
          className={styles.floatingMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}

        >
          {/* Header */}
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

          {/* Video */}
          <div className={styles.miniVideo}>
            {remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} playVideo playAudio />
            ) : (
              <div className={styles.miniWaiting}>Connecting…</div>
            )}
          </div>

          {/* Controls */}
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

      {/* ▼ FULL SCREEN WINDOW ▼ */}
      {!isMinimized && (
        <div className={styles.videoContainer}>
          <button
            className={styles.minimizeBtn}
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize"
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
                      playAudio
                      playVideo
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
                    key={isMinimized ? "mini" : "full"} // ⭐ IMPORTANT
                    audioTrack={localMicrophoneTrack}
                    videoTrack={localCameraTrack}
                    micOn={micOn}
                    cameraOn={cameraOn}
                    playAudio={false}
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
                    if (isUserSide) {
                      setIsMinimized(true);

                      navigate(
                        `/talk-to-astrologers/${activeCall.astrologerId}`,
                        {
                          state: {
                            roomId: activeCall.chatRoomId, // SAME CHAT
                            userId: activeCall.userId,
                            astrologerId: activeCall.astrologerId,
                            kundliId: activeCall.kundliId,
                            fullName: activeCall.callerName,
                            isUserSide: true,
                          },
                        }
                      );
                    } else {
                      setIsMinimized(true);
                      navigate(
                        PATH.privateRoutes.ASTROLOGER_CHAT_USER_LIST.path
                      );
                    }
                  }}
                  aria-label="Open Chat"
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

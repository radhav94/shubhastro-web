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
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState, useEffect } from "react";
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

  // ⭐ callData comes from global context
  const { roomId, agoraToken, isUserSide, callerName, callType } = callData;

  // States
  const [calling, setCalling] = useState(true);
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false);

  const [position, setPosition] = useState({ x: 20, y: 20 });

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  // Join channel
  const { isConnected } = useJoin(
    { appid: appId, channel: roomId, token: agoraToken },
    calling
  );

  const remoteUsers = useRemoteUsers();

  // Sync mic/camera
  useEffect(() => {
    if (localMicrophoneTrack) localMicrophoneTrack.setEnabled(micOn);
    if (localCameraTrack) localCameraTrack.setEnabled(cameraOn);
  }, [micOn, cameraOn, localMicrophoneTrack, localCameraTrack]);

  // Publish tracks
  usePublish([
    ...(localMicrophoneTrack && micOn ? [localMicrophoneTrack] : []),
    ...(localCameraTrack && cameraOn ? [localCameraTrack] : []),
  ]);

  // Remote user left → end call
  useEffect(() => {
    const handleRemoteLeave = () => {
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();
      localCameraTrack?.stop();
      localCameraTrack?.close();

      client.leave().then(() => {
        setActiveCall(null); // remove UI globally
      });
    };

    client.on("user-left", handleRemoteLeave);
    return () => client.off("user-left", handleRemoteLeave);
  }, [client, localMicrophoneTrack, localCameraTrack]);

  useEffect(() => {
    if (isConnected) {
      setHasJoinedOnce(true);
    }
  }, [isConnected]);

  useEffect(() => {
  const handleSocketDisconnect = () => {
    if (!roomId) return;

    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

    voiceSocket.emit("call_end", {
      roomId,
      endedBy,
    });

    setActiveCall(null);
  };

  voiceSocket.on("disconnect", handleSocketDisconnect);

  return () => {
    voiceSocket.off("disconnect", handleSocketDisconnect);
  };
}, [roomId, isUserSide]);
useEffect(() => {
  const handleCallEnded = () => {
    localMicrophoneTrack?.stop();
    localMicrophoneTrack?.close();
    localCameraTrack?.stop();
    localCameraTrack?.close();

    client.leave().finally(() => {
      setActiveCall(null);
    });
  };

  voiceSocket.on("call_ended", handleCallEnded);

  return () => {
    voiceSocket.off("call_ended", handleCallEnded);
  };
}, []);



  // End call manually
  const endCall = async () => {
    try {
      const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

      voiceSocket.emit("call_end", { roomId, endedBy });

      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();
      localCameraTrack?.stop();
      localCameraTrack?.close();

      await client.leave();

      setActiveCall(null); // global cleanup
    } catch (err) {
      console.error("Error ending call:", err);
    }
  };

  let dragOffset = { x: 0, y: 0 };

  const startDrag = (e) => {
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const onDrag = (e) => {
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  return (
    <>
      {isMinimized && (
        <div
          className={styles.floatingMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
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
          >
            Minimize
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
                <button onClick={() => setMic((p) => !p)}>
                  {micOn ? "🎙️" : "🔇"}
                </button>

                <button onClick={() => setCamera((p) => !p)}>
                  {cameraOn ? "📷" : "🚫"}
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
                >
                  💬
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

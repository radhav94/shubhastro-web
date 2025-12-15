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

  console.log("callData-----",callData)
  const { setActiveCall } = useCall();

  // ⭐ callData comes from global context
  const { roomId, agoraToken, isUserSide, callerName, callType } = callData;

  // States
  const [calling, setCalling] = useState(true);
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

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

  // =============== MINI WINDOW LOGIC ==================
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

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

  // ======================= UI ==============================

  return (
    <>
      {/* ▼ MINI WINDOW ▼ */}
      {isMinimized && (
        <div
          className={styles.floatingMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
        >
          <div className={styles.miniHeader}>
            <span>{callerName || "Video Call"}</span>
            <button onClick={() => setIsMinimized(false)}>🔼</button>
          </div>

          <div className={styles.miniVideo}>
            {remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} playVideo playAudio />
            ) : (
              <div style={{ color: "#fff", padding: 10, fontSize: 12 }}>
                Waiting…
              </div>
            )}
          </div>

          <button className={styles.miniEnd} onClick={endCall}>
            End Call
          </button>
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

          {!isConnected ? (
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
                  {micOn ? "Mute Mic" : "Unmute Mic"}
                </button>

                <button onClick={() => setCamera((p) => !p)}>
                  {cameraOn ? "Stop Camera" : "Start Camera"}
                </button>

                <button className={styles.endBtn} onClick={endCall}>
                  End
                </button>

                <button
                  className={styles.chatBtn}
                  onClick={() => {
                    setIsMinimized(true);

                    navigate(`/talk-to-astrologers/${callData.astrologerId}`, {
                      state: {
                        userId: callData.userId,
                        astrologerId: callData.astrologerId,
                        fullName: callData.callerName,
                        roomId: callData.roomId,
                        kundliId: callData.kundliId,
                        isUserSide: true,
                      },
                    });
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

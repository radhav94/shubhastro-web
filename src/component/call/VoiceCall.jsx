import {
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";

import { useState, useEffect } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { IoMic, IoMicOff, IoCall } from "react-icons/io5";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useCall } from "../../context/CallContext";

export const AgoraVoiceCalling = ({ callData }) => {
  const client = useRTCClient(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );

  return (
    <AgoraRTCProvider client={client}>
      <CallingUI client={client} callData={callData} />
    </AgoraRTCProvider>
  );
};

const CallingUI = ({ client, callData }) => {
  const { setActiveCall } = useCall();

  const { roomId, callerName, agoraToken, isUserSide } = callData;

  const [calling] = useState(true);
  const [micOn, setMic] = useState(true);

  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();

  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

  // JOIN CALL
  useJoin(
    {
      appid: appId,
      channel: roomId,
      token: agoraToken,
    },
    calling
  );

  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

  // CALL STATUS
  const [callState, setCallState] = useState("connecting");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    if (remoteUsers.length > 0) setCallState("connected");
    else setCallState("waiting");
  }, [isConnected, remoteUsers.length]);

  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }

    return () => clearInterval(interval);
  }, [callState]);

  // REMOTE USER LEFT
  useEffect(() => {
    const handleRemoteLeave = () => {
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();

      client.leave().then(() => setActiveCall(null));
    };

    client.on("user-left", handleRemoteLeave);
    return () => client.off("user-left", handleRemoteLeave);
  }, [client, localMicrophoneTrack]);

  // BACKEND CALL ENDED
  useEffect(() => {
    const handleBackendCallEnded = () => {
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();

      client.leave().then(() => setActiveCall(null));
    };

    voiceSocket.on("call_ended", handleBackendCallEnded);
    return () => voiceSocket.off("call_ended", handleBackendCallEnded);
  }, []);

  // END CALL
  const endCall = () => {
    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

    voiceSocket.emit("call_end", { roomId, endedBy });

    localMicrophoneTrack?.stop();
    localMicrophoneTrack?.close();

    client.leave().then(() => {
      setActiveCall(null);
    });
  };

  const formatTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;

  // -----------------------------------------------
  // ⭐ MINIMIZE FEATURE + DRAGGABLE MINI WINDOW
  // -----------------------------------------------

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

  // -----------------------------------------------
  // ⭐ UI RETURNS
  // -----------------------------------------------

  return (
    <>
      {/* ⭐ MINI FLOATING WINDOW */}
      {isMinimized && (
        <div
          className={styles.floatingMini}
          style={{ top: position.y, left: position.x }}
          onMouseDown={startDrag}
        >
          <div className={styles.miniHeader}>
            <span>{callerName}</span>
            <button onClick={() => setIsMinimized(false)}>🔼</button>
          </div>

          <div className={styles.miniBody}>
            <p style={{ fontSize: "12px", color: "#fff" }}>
              {callState === "connected"
                ? `Connected • ${formatTime(timer)}`
                : "Calling..."}
            </p>
          </div>

          <button className={styles.miniEndBtn} onClick={endCall}>
            End
          </button>
        </div>
      )}

      {/* ⭐ FULL SCREEN CALL UI */}
      {!isMinimized && (
        <div className={styles.fullscreenWrapper}>
          <button className={styles.minimizeBtn} onClick={() => setIsMinimized(true)}>
            Minimize
          </button>

          <div className={styles.callingContainer}>
            <img
              className={styles.avatar}
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="User"
            />

            <h2 className={styles.name}>{callerName}</h2>

            <p className={styles.status}>
              {callState === "connecting" && "Connecting…"}
              {callState === "waiting" && `Waiting for ${callerName}…`}
              {callState === "connected" &&
                `Connected • ${formatTime(timer)}`}
            </p>

            {remoteUsers.map((user) => (
              <RemoteUser key={user.uid} user={user} playAudio={true} />
            ))}

            <div className={styles.controls}>
              <button className={styles.controlBtn} onClick={() => setMic((m) => !m)}>
                {micOn ? <IoMic size={28} /> : <IoMicOff size={28} />}
              </button>

              <button className={styles.endCallBtn} onClick={endCall}>
                <IoCall size={32} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgoraVoiceCalling;

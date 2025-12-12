import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { IoMic, IoMicOff, IoCall } from "react-icons/io5";
import styles from "./VoiceCall.module.scss";
import { voiceSocket } from "../../services/voiceSocketServices";

export const AgoraVoiceCalling = () => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  return (
    <AgoraRTCProvider client={client}>
      <CallingUI client={client} />
    </AgoraRTCProvider>
  );
};

const CallingUI = ({ client }) => {
  // ✅ AUTO START CALL
  const [calling, setCalling] = useState(true);
  const [micOn, setMic] = useState(true);

  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const location = useLocation();
  const navigate = useNavigate();

  const callerName = location.state?.callerName || "Unknown";
  const roomID = location.state?.roomId || "123456";
  const agoraToken = location?.state?.agoraToken || "";
  const isUserSide = location.state?.isUserSide;

  const appId = "5630460abdc141e3b2f8d9597752bd7d";
  const channel = roomID;

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

  // ✅ JOIN AUTOMATICALLY
  useJoin(
    {
      appid: appId,
      channel,
      token: agoraToken || null,
    },
    calling
  );

  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const [callState, setCallState] = useState("connecting");
  const [timer, setTimer] = useState(0);

  // ✅ CALL STATE HANDLING
  useEffect(() => {
    if (calling && isConnected) {
      if (remoteUsers.length > 0) setCallState("connected");
      else setCallState("waiting");
    }
  }, [calling, isConnected, remoteUsers.length]);

  // ✅ TIMER
  useEffect(() => {
    let interval = null;
    if (callState === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => interval && clearInterval(interval);
  }, [callState]);

  // ✅ CLEAN SOCKET LISTENERS
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up socket listeners on Call Screen unmount...");
      voiceSocket.removeAllListeners();
    };
  }, []);

  // ✅ REMOTE USER LEAVE HANDLER
  useEffect(() => {
    const handleRemoteLeave = () => {
      console.log("🚨 Remote user has left the call!");

      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }

      client.leave().then(() => {
        console.log("👋 Left the Agora room");
        navigate(-1);
      });
    };

    client.on("user-left", handleRemoteLeave);

    return () => {
      client.off("user-left", handleRemoteLeave);
    };
  }, [client, localMicrophoneTrack, navigate]);


  useEffect(() => {
  const handleBackendCallEnded = () => {
    console.log("📩 Received call_ended from backend");

    if (localMicrophoneTrack) {
      localMicrophoneTrack.stop();
      localMicrophoneTrack.close();
    }

    client.leave().then(() => {
      console.log("👋 Left Agora due to backend call_ended");
      navigate(-1); // Auto close call screen
    });

    if (voiceSocket.connected) {
      voiceSocket.disconnect();
    }
  };

  voiceSocket.on("call_ended", handleBackendCallEnded);

  return () => {
    voiceSocket.off("call_ended", handleBackendCallEnded);
  };
}, [client, localMicrophoneTrack, navigate]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ END CALL (UNCHANGED)
  const endCall = () => {
    const endedBy = isUserSide ? "CUSTOMER" : "ASTROLOGER";

    voiceSocket.emit("call_end", { roomId: roomID, endedBy });

    if (voiceSocket.connected) {
      voiceSocket.disconnect();
    }

    if (localMicrophoneTrack) {
      localMicrophoneTrack.stop();
      localMicrophoneTrack.close();
    }

    client.leave().then(() => {
      console.log("Call End:", endedBy);
      navigate(-1);
    });
  };

  return (
    <div className={styles.callScreen}>
      <div className={styles.callingContainer}>
        <img
          className={styles.avatar}
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          alt="Astrologer"
        />

        <h2 className={styles.name}>{callerName}</h2>

        <p className={styles.status}>
          {callState === "connecting" && "Connecting…"}
          {callState === "waiting" && `Waiting for ${callerName} to join…`}
          {callState === "connected" && `Connected • ${formatTime(timer)}`}
        </p>

        {/* Remote Audio */}
        {remoteUsers.map((user) => (
          <RemoteUser key={user.uid} user={user} playAudio={true} />
        ))}

        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${styles.micBtn}`}
            onClick={() => setMic((m) => !m)}
          >
            {micOn ? <IoMic size={28} /> : <IoMicOff size={28} />}
          </button>

          <button
            className={`${styles.controlBtn} ${styles.endCallBtn}`}
            onClick={endCall}
          >
            <IoCall size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgoraVoiceCalling;

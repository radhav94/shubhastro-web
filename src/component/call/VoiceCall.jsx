import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useLocation,useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { IoMic, IoMicOff, IoCall } from "react-icons/io5";
import {useGetAgoraTokenQuery} from "../../redux/api/agoratokenApi/agoraTokenApi"

import styles from "./VoiceCall.module.scss";

export const AgoraVoiceCalling = () => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  return (
    <AgoraRTCProvider client={client}>
      <CallingUI client={client} />
    </AgoraRTCProvider>
  );
};

const CallingUI = ({ client }) => {
  const [calling, setCalling] = useState(false);
  const [micOn, setMic] = useState(true);

  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const location = useLocation();
  const navigate = useNavigate();


  // const {roomId,callerName}=state
  
  const callerName = location.state?.callerName || "Unknown";
  const roomID = location.state?.roomId || "123456";

  const { data, isLoading, error } = useGetAgoraTokenQuery({
  channelName:roomID,
  // entityId:callerName,
});

const tokendData=data?.data;
console.log("tokenData",tokendData);

  const appId = "5630460abdc141e3b2f8d9597752bd7d";
  const channel = roomID;
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

useJoin(
  tokendData && calling && !isLoading && !error
    ? { appid: appId, channel, token: tokendData }
    : undefined,
  calling
);
  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const [callState, setCallState] = useState("idle");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (calling && isConnected) {
      if (remoteUsers.length > 0) setCallState("connected");
      else setCallState("waiting");
    }
  }, [calling, isConnected, remoteUsers.length]);

  useEffect(() => {
    let interval = null;
    if (callState === "connected") {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => interval && clearInterval(interval);
  }, [callState]);

  useEffect(() => {
  const handleRemoteLeave = () => {
    console.log("🚨 Remote user has left the call!");

    // Stop and release local track
    if (localMicrophoneTrack) {
      localMicrophoneTrack.stop();
      localMicrophoneTrack.close();
    }

    // Leave Agora channel
    client.leave().then(() => {
      console.log("👋 Left the Agora room");
      navigate(-1); // redirect
    });
  };

  client.on("user-left", handleRemoteLeave);

  return () => {
    client.off("user-left", handleRemoteLeave);
  };
}, [client, localMicrophoneTrack, navigate]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startCall = () => {
    setCalling(true);
    setCallState("connecting");
  };

 const endCall = () => {
  if (localMicrophoneTrack) {
    localMicrophoneTrack.stop();
    localMicrophoneTrack.close();
  }

  client.leave().then(() => {
    console.log("Call Ended Locally");
    navigate(-1);
  });
};


  return (
    <div className={styles.callScreen}>
      {!calling ? (
        <div className={styles.startContainer}>
          <img
            className={styles.avatar}
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="Astrologer"
          />

          <h2 className={styles.name}>{callerName}</h2>

          <p className={styles.status}>Tap to start voice call</p>

          <button className={styles.callBtn} onClick={startCall}>
            <IoCall size={32} />
          </button>
        </div>
      ) : (
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

          {/* Render remote audio */}
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

            <button className={`${styles.controlBtn} ${styles.endCallBtn}`} onClick={endCall}>
              <IoCall size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgoraVoiceCalling;


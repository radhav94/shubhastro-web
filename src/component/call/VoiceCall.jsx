// import {
//   LocalUser,
//   RemoteUser,
//   useJoin,
//   useLocalMicrophoneTrack,
//   usePublish,
//   useRemoteUsers,
// } from "agora-rtc-react";
// import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
// import { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { IoMic, IoMicOff, IoCall } from "react-icons/io5";
// // import styles from "./AgoraVoicePremiumUI.scss";
// import styles from "./VoiceCall.module.scss"

// export const AgoraVoiceCalling = () => {
//   const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

//   return (
//     <AgoraRTCProvider client={client}>
//       <CallingUI />
//     </AgoraRTCProvider>
//   );
// };

// const CallingUI = () => {
//   const navigate = useNavigate();
//   const { roomId } = useParams(); // ⭐ Dynamic from URL (for reference/logs)

//   // 👉 Agora completely static for now
//   const APP_ID = "b7bd8229702e4ec3b0938ea15f23a39c";
//   const CHANNEL = "shubhtalkcallnew"; // ⭐ Static channel for both user & astro
//   const TOKEN ="007eJxTYIi1zE256JxQ8GP1t0tFq3h3Rrb5c4rP3+ehvsJ+/oupkXcUGJLMk1IsjIwszQ2MUk1Sk42TDCyNLVITDU3TjIwTjS2Trc10MhsCGRm6VtxlZWSAQBBfgKE4ozQpoyQxJzs5MScnL7WcgQEA9J0kZw==";
//   const UID = 0;


//   const [calling, setCalling] = useState(true); // Screen open ⇒ call ON
//   const [micOn, setMic] = useState(true);
//   const [callState, setCallState] = useState("connecting");
//   const [timer, setTimer] = useState(0);

//   const remoteUsers = useRemoteUsers();
//   const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

//   // ⭐ Join Agora with static config
//   useJoin(
//     {
//       appid: APP_ID,
//       channel: CHANNEL,
//       token: TOKEN,
//       uid: UID,
//     },
//     calling // join while calling = true
//   );

//   // ⭐ Publish local mic
//   usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

//   // 🔁 Call state + timer
//   if (calling) {
//     if (remoteUsers.length > 0 && callState !== "connected") {
//       setCallState("connected");
//     } else if (remoteUsers.length === 0 && callState === "connecting") {
//       setCallState("waiting");
//     }
//   }

//   // Simple timer (optional)
//   if (callState === "connected" && timer === 0) {
//     const interval = setInterval(() => {
//       setTimer((t) => t + 1);
//     }, 1000);
//     // rough cleanup when component unmounts
//     window.onbeforeunload = () => clearInterval(interval);
//   }

//   const formatTime = (sec) => {
//     const m = String(Math.floor(sec / 60)).padStart(2, "0");
//     const s = String(sec % 60).padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   const endCall = () => {
//     setCalling(false);
//     // yahan future mein socket.emit("end-call", { roomId }) kari sakte ho
//     navigate(-1);
//   };

//   return (
//     <div className={styles.callScreen}>
//       <div className={styles.callingContainer}>
//         <img
//           className={styles.avatar}
//           src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
//           alt="Astrologer"
//         />

//         <h2 className={styles.name}>Astrologer</h2>

//         <p className={styles.status}>
//           {callState === "connecting" && "Connecting…"}
//           {callState === "waiting" && "Waiting for other side to join…"}
//           {callState === "connected" && `Connected • ${formatTime(timer)}`}
//         </p>

//         {/* Remote audio (other side) */}
//         {remoteUsers.map((user) => (
//           <RemoteUser key={user.uid} user={user} playAudio={true} />
//         ))}

//         <div className={styles.controls}>
//           <button
//             className={`${styles.controlBtn} ${styles.micBtn}`}
//             onClick={() => setMic((m) => !m)}
//           >
//             {micOn ? <IoMic size={28} /> : <IoMicOff size={28} />}
//           </button>

//           <button
//             className={`${styles.controlBtn} ${styles.endCallBtn}`}
//             onClick={endCall}
//           >
//             <IoCall size={32} />
//           </button>
//         </div>

//         <div className={styles.debugInfo}>
//           <span>RoomId (socket): {roomId}</span>
//           <span>Channel (Agora): {CHANNEL}</span>
//         </div>

//         {/* Local mic (no playback) */}
//         <LocalUser audioTrack={localMicrophoneTrack} playAudio={false} />
//       </div>
//     </div>
//   );
// };

// export default AgoraVoiceCalling;


import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { IoMic, IoMicOff, IoCall } from "react-icons/io5";
import styles from "./VoiceCall.module.scss";

export const AgoraVoiceCalling = () => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  return (
    <AgoraRTCProvider client={client}>
      <CallingUI />
    </AgoraRTCProvider>
  );
};

const CallingUI = () => {
  const [calling, setCalling] = useState(false);
  const [micOn, setMic] = useState(true);

  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const location = useLocation();
  const callerName = location.state?.callerName || "Unknown";


  const appId = "b7bd8229702e4ec3b0938ea15f23a39c";
  const channel = "shubhtalkcallnew";
  const token ="007eJxTYIi1zE256JxQ8GP1t0tFq3h3Rrb5c4rP3+ehvsJ+/oupkXcUGJLMk1IsjIwszQ2MUk1Sk42TDCyNLVITDU3TjIwTjS2Trc10MhsCGRm6VtxlZWSAQBBfgKE4ozQpoyQxJzs5MScnL7WcgQEA9J0kZw==";
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

  useJoin({ appid: appId, channel, token }, calling);
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
    setCalling(false);
    setCallState("ended");
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


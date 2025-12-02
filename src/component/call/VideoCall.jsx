// import {
//   LocalUser,
//   RemoteUser,
//   useIsConnected,
//   useJoin,
//   useLocalMicrophoneTrack,
//   useLocalCameraTrack,
//   usePublish,
//   useRemoteUsers,
// } from "agora-rtc-react";
// import { useState, useMemo, useEffect } from "react";
// import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
// import styles from "./VideoCalling.module.scss";

// const VideoCalling = () => {
//   const client = useMemo(
//     () => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
//     []
//   );

//   return (
//     <AgoraRTCProvider client={client}>
//       <CallUI />
//     </AgoraRTCProvider>
//   );
// };

// const CallUI = () => {
//   const [calling, setCalling] = useState(true);
//   const isConnected = useIsConnected();
//   const [micOn, setMic] = useState(true);
//   const [cameraOn, setCamera] = useState(true);

//   const appId = "908a7debb18d43ed8d74bed54c5e6b29";
//   const channel = "subhtalknew"; // For now static
//   const token = "007eJxTYJD4Y5EQ4+DU1sVx4eRMNa6Dnz93HPLdnWt/+f8x6VmW37wUGCwNLBLNU1KTkgwtUkyMU1MsUsxNklJTTE2STVPNkowsr21Vy2wIZGR499yClZEBAkF8bobi0qSMksSc7LzUcgYGAKx7JJU=";
//   const uid = Math.floor(Math.random() * 100000);

//   const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
//   const { localCameraTrack } = useLocalCameraTrack(cameraOn);
//   const remoteUsers = useRemoteUsers();

//   useJoin({ appid: appId, channel: channel, token, uid }, calling);
//   usePublish([localMicrophoneTrack, localCameraTrack]);

//   return (
//     <div className={styles.wrapper}>
//       {isConnected && (
//         <>
//           <div className={styles.remoteVideoWrapper}>
//             {remoteUsers.length > 0 ? (
//               remoteUsers.map((user) => (
//                 <RemoteUser
//                   key={user.uid}
//                   user={user}
//                   playVideo
//                   playAudio
//                   className={styles.remoteVideo}
//                 />
//               ))
//             ) : (
//               <div className={styles.waitingText}>Waiting for remote user...</div>
//             )}
//           </div>

//           <div className={styles.localVideoWrapper}>
//             <LocalUser
//               audioTrack={localMicrophoneTrack}
//               videoTrack={localCameraTrack}
//               micOn={micOn}
//               cameraOn={cameraOn}
//               playVideo
//               className={styles.localVideo}
//             />
//           </div>

//           <div className={styles.controls}>
//             <button
//               className={`${styles.btn} ${!micOn ? styles.off : ""}`}
//               onClick={() => setMic((prev) => !prev)}
//             >
//               🎤
//             </button>

//             <button
//               className={`${styles.btn} ${!cameraOn ? styles.off : ""}`}
//               onClick={() => setCamera((prev) => !prev)}
//             >
//               📷
//             </button>

//             <button
//               className={styles.btnEnd}
//               onClick={() => setCalling(false)}
//             >
//               🔴
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default VideoCalling;



import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useLocation, useNavigate } from "react-router-dom";
import { IoMicOffOutline, IoMicOutline, IoVideocamOffOutline, IoVideocamOutline, IoCall } from "react-icons/io5";
import styles from "./VideoCalling.module.scss";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const VideoCall = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { channelName, token, uid, userId, astrologerId, isUserSide, callerName } = state;

  const localRef = useRef(null);
  const remoteRef = useRef(null);

  const [localTracks, setLocalTracks] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  /** 🚀 Join video call */
  useEffect(() => {
    const joinVideoCall = async () => {
      try {
        await client.join(
          "b7bd8229702e4ec3b0938ea15f23a39c",
          "testing",
          "007eJxTYDhg+3WajmmeaqPx+nObrn/awxWskXY8a4bjIpM2XY7epTsUGJLMk1IsjIwszQ2MUk1Sk42TDCyNLVITDU3TjIwTjS2TF3zUzWwIZGTYnfSUiZEBAkF8doaS1OKSzLx0BgYAsqUhKw==",
          uid
        );

        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalTracks(tracks);

        tracks[1].play(localRef.current);
        await client.publish(tracks);
        console.log("Call Joined:", channelName);
      } catch (err) {
        console.error("Agora Join Error:", err);
      }
    };

    joinVideoCall();

    /** Remote user published */
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        user.videoTrack.play(remoteRef.current);
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    return () => {
      client.off("user-published");
    };
  }, [channelName, token, uid]);

  /** 🔇 Toggle Mic */
  const toggleMic = async () => {
    if (!localTracks) return;
    const newState = !micEnabled;
    await localTracks[0].setEnabled(newState);
    setMicEnabled(newState);
  };

  /** 🎥 Toggle Camera */
  const toggleCam = async () => {
    if (!localTracks) return;
    const newState = !camEnabled;
    await localTracks[1].setEnabled(newState);
    setCamEnabled(newState);
  };

  /** 📞 End Call */
  const handleEndCall = async () => {
    if (localTracks) {
      localTracks[0].close();
      localTracks[1].close();
    }

    await client.leave();

    navigate(-1); // return to chat or previous screen
  };

  return (
    <div className={styles.videoWrapper}>
      <div className={styles.topBar}>
        <span className={styles.callerName}>
          {callerName || "Video Call"}
        </span>
      </div>

      {/* REMOTE VIEW */}
      <div className={styles.remoteVideo} ref={remoteRef}></div>

      {/* LOCAL VIEW SMALL PREVIEW */}
      <div className={styles.localVideo} ref={localRef}></div>

      {/* CONTROLS */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${micEnabled ? "" : styles.off}`}
          onClick={toggleMic}
        >
          {micEnabled ? <IoMicOutline /> : <IoMicOffOutline />}
        </button>

        <button
          className={`${styles.controlBtn} ${camEnabled ? "" : styles.off}`}
          onClick={toggleCam}
        >
          {camEnabled ? <IoVideocamOutline /> : <IoVideocamOffOutline />}
        </button>

        <button className={`${styles.controlBtn} ${styles.endBtn}`} onClick={handleEndCall}>
          <IoCall />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;


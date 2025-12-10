// import {
//   LocalUser,
//   RemoteUser,
//   useJoin,
//   useLocalMicrophoneTrack,
//   useLocalCameraTrack,
//   usePublish,
//   useRemoteUsers,
//   useRTCClient,
// } from "agora-rtc-react";
// import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
// import { useState, useEffect } from "react";
// import styles from "./VideoCalling.module.scss";
// import { useLocation,useNavigate } from "react-router-dom";



// export const VideoCalling = () => {
//   const client = useRTCClient(
//     AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
//   );

//   return (
//     <AgoraRTCProvider client={client}>
//       <Basics />
//     </AgoraRTCProvider>
//   );
// };

// const Basics = ({ client }) => {
//   const [calling, setCalling] = useState(false);
//   const [micOn, setMic] = useState(true);
//   const [cameraOn, setCamera] = useState(true);
//   const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
//   const { localCameraTrack } = useLocalCameraTrack(cameraOn);
//   const location = useLocation();
//    const callerName = location.state?.callerName || "Unknown";
//   const roomID = location.state?.roomId || "123456";
//   const agoraToken=location?.state?.agoraToken  || "";

//   console.log("agoratoken",agoraToken)
//   const isUserSide = location.state?.isUserSide;



//   const appId = "5630460abdc141e3b2f8d9597752bd7d";

//   const { isConnected } = useJoin(
//     { appid: appId, channel: roomID, token: agoraToken || null },
//     calling
//   );

//   const remoteUsers = useRemoteUsers();

//   // 🔥 Sync track enabled state with button toggles
//   useEffect(() => {
//     if (localMicrophoneTrack) {
//       localMicrophoneTrack.setEnabled(micOn);
//     }
//     if (localCameraTrack) {
//       localCameraTrack.setEnabled(cameraOn);
//     }
//   }, [micOn, cameraOn, localMicrophoneTrack, localCameraTrack]);

//   // 🔥 Republish only enabled tracks
//   usePublish([
//     ...(localMicrophoneTrack && micOn ? [localMicrophoneTrack] : []),
//     ...(localCameraTrack && cameraOn ? [localCameraTrack] : []),
//   ]);

//   return (
//     <div className={styles.videoContainer}>
//       {!isConnected ? (
//         <div className={styles.joinContainer}>
//           {/* <input
//             placeholder="App ID"
//             value={appId}
//             onChange={(e) => setAppId(e.target.value)}
//           />
//           <input
//             placeholder="Channel"
//             value={channel}
//             onChange={(e) => setChannel(e.target.value)}
//           />
//           <input
//             placeholder="Token (optional)"
//             value={token || ""}
//             onChange={(e) => setToken(e.target.value)}
//           /> */}
//           <button
//             className={styles.joinBtn}
//             disabled={!appId || !roomID}
//             onClick={() => setCalling(true)}
//           >
//             Join Call
//           </button>
//         </div>
//       ) : (
//         <div className={styles.videoWrapper}>
//           {/* Remote Video */}
//           <div className={styles.remoteVideoArea}>
//             {remoteUsers.length > 0 ? (
//               remoteUsers.map((user) => (
//                 <RemoteUser
//                   key={user.uid}
//                   user={user}
//                   playAudio={true}
//                   playVideo={true}
//                   className={styles.remoteUserVideo}
//                 />
//               ))
//             ) : (
//               <div className={styles.waitingText}>Waiting for remote user…</div>
//             )}
//           </div>

//           {/* Local Preview */}
//           {cameraOn && (
//             <div className={styles.localVideoPreview}>
//               <LocalUser
//                 audioTrack={localMicrophoneTrack}
//                 videoTrack={localCameraTrack}
//                 micOn={micOn}
//                 cameraOn={cameraOn}
//                 playAudio={false}
//                 playVideo={true}
//                 className={styles.localUserVideo}
//               />
//             </div>
//           )}

//           {/* Controls */}
//           <div className={styles.controls}>
//             <button
//               className={styles.controlBtn}
//               onClick={() => setMic((prev) => !prev)}
//             >
//               {micOn ? "Mute Mic" : "Unmute Mic"}
//             </button>

//             <button
//               className={styles.controlBtn}
//               onClick={() => setCamera((prev) => !prev)}
//             >
//               {cameraOn ? "Stop Camera" : "Start Camera"}
//             </button>

//             <button
//               className={styles.endBtn}
//               onClick={() => setCalling(false)}
//             >
//               End
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VideoCalling;




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
import { useLocation, useNavigate } from "react-router-dom";
import { voiceSocket } from "../../services/voiceSocketServices";
// import { voiceSocket } from "../../../../../services/voiceSocketServices";

export const VideoCalling = () => {
  const client = useRTCClient(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );

  return (
    <AgoraRTCProvider client={client}>
      <Basics client={client} />
    </AgoraRTCProvider>
  );
};

const Basics = ({ client }) => {
  // ✅ auto join
  const [calling, setCalling] = useState(true);
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  const location = useLocation();
  const navigate = useNavigate();

  const roomID = location.state?.roomId || "123456";
  const agoraToken = location.state?.agoraToken || "";
  const isUserSide = location.state?.isUserSide;

  const appId = "5630460abdc141e3b2f8d9597752bd7d";

  const { isConnected } = useJoin(
    { appid: appId, channel: roomID, token: agoraToken || null },
    calling
  );

  const remoteUsers = useRemoteUsers();

  // ✅ mic / camera sync
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(micOn);
    }
    if (localCameraTrack) {
      localCameraTrack.setEnabled(cameraOn);
    }
  }, [micOn, cameraOn, localMicrophoneTrack, localCameraTrack]);

  // ✅ publish only enabled tracks
  usePublish([
    ...(localMicrophoneTrack && micOn ? [localMicrophoneTrack] : []),
    ...(localCameraTrack && cameraOn ? [localCameraTrack] : []),
  ]);

  // ✅ END CALL
  const endCall = async () => {
    try {
      voiceSocket.emit("call_end", {
        roomId: roomID,
        endedBy: isUserSide ? "CUSTOMER" : "ASTROLOGER",
      });

      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }

      if (localCameraTrack) {
        localCameraTrack.stop();
        localCameraTrack.close();
      }

      await client.leave();
      voiceSocket.disconnect();

      setCalling(false);
      navigate(-1);
    } catch (err) {
      console.error("End call error:", err);
    }
  };

  return (
    <div className={styles.videoContainer}>
      {!isConnected ? (
        <div className={styles.joinContainer}>
          <div className={styles.waitingText}>
            Connecting to video call…
          </div>
        </div>
      ) : (
        <div className={styles.videoWrapper}>
          {/* Remote */}
          <div className={styles.remoteVideoArea}>
            {remoteUsers.length > 0 ? (
              remoteUsers.map((user) => (
                <RemoteUser
                  key={user.uid}
                  user={user}
                  playAudio
                  playVideo
                  className={styles.remoteUserVideo}
                />
              ))
            ) : (
              <div className={styles.waitingText}>
                Waiting for remote user…
              </div>
            )}
          </div>

          {/* Local */}
          {cameraOn && (
            <div className={styles.localVideoPreview}>
              <LocalUser
                audioTrack={localMicrophoneTrack}
                videoTrack={localCameraTrack}
                micOn={micOn}
                cameraOn={cameraOn}
                playAudio={false}
                playVideo
                className={styles.localUserVideo}
              />
            </div>
          )}

          {/* Controls */}
          <div className={styles.controls}>
            <button
              className={styles.controlBtn}
              onClick={() => setMic((p) => !p)}
            >
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>

            <button
              className={styles.controlBtn}
              onClick={() => setCamera((p) => !p)}
            >
              {cameraOn ? "Stop Camera" : "Start Camera"}
            </button>

            <button className={styles.endBtn} onClick={endCall}>
              End
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCalling;






import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useState, useMemo, useEffect } from "react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import styles from "./VideoCalling.module.scss";

const VideoCalling = () => {
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
    []
  );

  return (
    <AgoraRTCProvider client={client}>
      <CallUI />
    </AgoraRTCProvider>
  );
};

const CallUI = () => {
  const [calling, setCalling] = useState(true);
  const isConnected = useIsConnected();
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  const appId = "908a7debb18d43ed8d74bed54c5e6b29";
  const channel = "subhtalknew"; // For now static
  const token = "007eJxTYJD4Y5EQ4+DU1sVx4eRMNa6Dnz93HPLdnWt/+f8x6VmW37wUGCwNLBLNU1KTkgwtUkyMU1MsUsxNklJTTE2STVPNkowsr21Vy2wIZGR499yClZEBAkF8bobi0qSMksSc7LzUcgYGAKx7JJU=";
  const uid = Math.floor(Math.random() * 100000);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: appId, channel: channel, token, uid }, calling);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  return (
    <div className={styles.wrapper}>
      {isConnected && (
        <>
          <div className={styles.remoteVideoWrapper}>
            {remoteUsers.length > 0 ? (
              remoteUsers.map((user) => (
                <RemoteUser
                  key={user.uid}
                  user={user}
                  playVideo
                  playAudio
                  className={styles.remoteVideo}
                />
              ))
            ) : (
              <div className={styles.waitingText}>Waiting for remote user...</div>
            )}
          </div>

          <div className={styles.localVideoWrapper}>
            <LocalUser
              audioTrack={localMicrophoneTrack}
              videoTrack={localCameraTrack}
              micOn={micOn}
              cameraOn={cameraOn}
              playVideo
              className={styles.localVideo}
            />
          </div>

          <div className={styles.controls}>
            <button
              className={`${styles.btn} ${!micOn ? styles.off : ""}`}
              onClick={() => setMic((prev) => !prev)}
            >
              🎤
            </button>

            <button
              className={`${styles.btn} ${!cameraOn ? styles.off : ""}`}
              onClick={() => setCamera((prev) => !prev)}
            >
              📷
            </button>

            <button
              className={styles.btnEnd}
              onClick={() => setCalling(false)}
            >
              🔴
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoCalling;

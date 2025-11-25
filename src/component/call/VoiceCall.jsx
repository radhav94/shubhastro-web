import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import styles from "./VoiceCall.module.scss";

const appId = "8baeefa5d806470b917d6836513bf852";
const channelName = "shubhtalk";

const AgoraVideo = () => {
  const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  const uid = null;

  useEffect(() => {
    async function start() {
      await client.join(appId, channelName, null, uid);

      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      const cam = await AgoraRTC.createCameraVideoTrack();

      setLocalAudioTrack(mic);
      setLocalVideoTrack(cam);

      await client.publish([mic, cam]);

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        setRemoteUsers((prev) => [...prev, user]);
      });

      client.on("user-unpublished", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    }

    start();

    return () => {
      client.leave();
      localAudioTrack?.close();
      localVideoTrack?.close();
    };
  }, []);

  return (
    <div className={styles.videoWrapper}>
      {/* Remote Video */}
      <div className={styles.remoteVideo}>
        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div
              key={user.uid}
              ref={(el) => el && user.videoTrack?.play(el)}
              className={styles.remoteBox}
            ></div>
          ))
        ) : (
          <div className={styles.emptyRemote}>Waiting for remote user...</div>
        )}
      </div>

      {/* Local Video */}
      <div className={styles.localVideo}>
        <div
          ref={(el) => el && localVideoTrack?.play(el)}
          className={styles.localBox}
        ></div>
      </div>

      {/* End Call */}
      <button
        className={styles.endCall}
        onClick={async () => {
          await client.leave();
          localAudioTrack?.close();
          localVideoTrack?.close();
          window.history.back();
        }}
      >
        End Call
      </button>
    </div>
  );
};

export default AgoraVideo;

import React, { useState } from "react";
import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useAgoraToken } from "../../agora/useAgoraToken";
import styles from "./VoiceCall.module.scss";

const VoiceCall = ({ channelName, uid, userType = "user", callerName = "Astrologer" }) => {
  const [callActive, setCallActive] = useState(false);
  const [agoraData, setAgoraData] = useState({});
  const { getToken, loading } = useAgoraToken();

  const isJoined = useJoin(
    {
      appid: agoraData.appId,
      channel: channelName,
      token: agoraData.token,
      uid,
    },
    callActive
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  usePublish([localMicrophoneTrack]);
  const remoteUsers = useRemoteUsers();

  const startCall = async () => {
    const data = await getToken({ channelName, uid });
    if (!data) return alert("Token fetch failed!");

    setAgoraData(data);
    setCallActive(true);
  };

  const endCall = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {userType === "astrologer" ? "Astrologer Voice Call" : "User Voice Call"}
          </h2>
          <span className={styles.channelBadge}>Channel: {channelName}</span>
        </div>

        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarPulse}></div>
          <div className={styles.avatar}></div>
        </div>

        <h3 className={styles.callerName}>{callerName}</h3>
        <p className={styles.status}>
          {callActive ? (isJoined ? "Connected" : "Connecting...") : "Ready to start call"}
        </p>

        {/* Buttons */}
        <div className={styles.actions}>
          {!callActive ? (
            <button
              className={styles.joinBtn}
              onClick={startCall}
              disabled={loading}
            >
              {loading ? "Getting Token..." : "Join Call"}
            </button>
          ) : (
            <button className={styles.endBtn} onClick={endCall}>
              End Call
            </button>
          )}
        </div>

        {/* In-call section */}
        {callActive && (
          <div className={styles.callBody}>
            <h4>Local User</h4>
            {localMicrophoneTrack && <LocalUser audioTrack={localMicrophoneTrack} />}

            <h4>Remote Users</h4>
            {remoteUsers.length === 0 && <p>No remote users yet...</p>}
            {remoteUsers.map((u) => (
              <div key={u.uid} className={styles.remoteUserBox}>
                <span>User {u.uid}</span>
                <RemoteUser user={u} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCall;

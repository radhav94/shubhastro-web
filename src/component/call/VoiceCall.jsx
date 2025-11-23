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
// import { useAgoraToken } from "../../agora/useAgoraToken";

const VoiceCall = ({ channelName, uid, userType }) => {
  const [callActive, setCallActive] = useState(false);
  const [agoraData, setAgoraData] = useState({});
  const { getToken, loading } = useAgoraToken();

  // Agora hooks
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

      console.log("AGORA DATA:", data);


    if (!data) return alert("Token fetch failed!");

    setAgoraData(data);
    setCallActive(true);
  };

  const endCall = () => {
    window.location.reload();  
  };

  return (
    <div style={{ padding: 20, border: "1px solid #ddd" }}>
      <h3>{userType === "astrologer" ? "Astrologer Call" : "User Call"}</h3>

      {!callActive && (
        <button onClick={startCall} disabled={loading}>
          {loading ? "Getting Token..." : "Join Call"}
        </button>
      )}

      {callActive && (
        <>
          <p>Status: {isJoined ? "Connected" : "Connecting..."}</p>

          <button onClick={endCall}>End Call</button>

          <h4>Local User</h4>
          {localMicrophoneTrack && <LocalUser audioTrack={localMicrophoneTrack} />}

          <h4>Remote Users</h4>
          {remoteUsers.map((user) => (
            <RemoteUser key={user.uid} user={user} />
          ))}
        </>
      )}
    </div>
  );
};

export default VoiceCall;

import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers
} from "agora-rtc-react";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const AgoraVoiceCalling = () => {
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  return (
    <AgoraRTCProvider client={client}>
      <CallUI />
    </AgoraRTCProvider>
  );
};

const CallUI = () => {
  const navigate = useNavigate();
  
  const APP_ID = "908a7debb18d43ed8d74bed54c5e6b29";
  const CHANNEL = "newtestshubtalk";
  const TOKEN =
    "007eJxTYBjxPks/OedYOHopxUWCzg007eJxTYNAvPqnisFT43Q/ZlI3KwU0mVmJhOm92ueddUn2xZ+Vhpg0KDJYGFonmKalJSYYWKSbGqSkWKeYmSakppibJpqlmSUaWpzh0MhsCGRmi3v9nYmSAQBCfnyEvtbwktbikOKM0qSQxJ5uBAQCQyyQgWkFYYrEm7xwFy0Gz4czpNaHSlbFhsDRgmAR4Kk0zNTYzSTJLMk8zSDM3SUzI1NVgzMU40NzZKMU8yMTI6WLRmZGSiaGBgYEAmR5KSmlKYkpOYk5iZGJpkGNgAABS7Bho=";
  const UID = Math.floor(Math.random() * 100000);

  const [micOn, setMicOn] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const remoteUsers = useRemoteUsers();

  // ⭐ Direct Join
  useJoin(
    {
      appid: APP_ID,
      channel: CHANNEL,
      token: TOKEN,
      uid: UID,
    },
    true
  );

  // ⭐ Publish mic track
  usePublish(
    localMicrophoneTrack
      ? [localMicrophoneTrack]
      : []
  );

  const endCall = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: 30, textAlign: "center" }}>
      <h2>Voice Call Static Mode</h2>
      <h4>Channel: {CHANNEL}</h4>

      {/* Remote audio users */}
      {remoteUsers.map(user => (
        <RemoteUser key={user.uid} user={user} playAudio={true} />
      ))}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setMicOn(m => !m)}>
          {micOn ? "Mute Mic" : "Unmute Mic"}
        </button>

        <button
          onClick={endCall}
          style={{ marginLeft: 10, color: "red" }}
        >
          End Call
        </button>
      </div>

      <LocalUser audioTrack={localMicrophoneTrack} playAudio={false} />
    </div>
  );
};

export default AgoraVoiceCalling;

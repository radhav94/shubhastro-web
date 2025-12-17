// src/components/LiveStreaming/useLiveStreaming.js
import { useEffect, useState } from "react";
import {
  useJoin,
  usePublish,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  useIsConnected,
  useRemoteUsers,
} from "agora-rtc-react";

const APP_ID = "b7bd8229702e4ec3b0938ea15f23a39c";
const CHANNEL_NAME = "testchannel";
const TEMP_TOKEN =
  ":007eJxTYEi3qZBa/n3lsSOt91w+82xcmPqf7dW7yvuXHn8Iu5KzemmnAkOSeVKKhZGRpbmBUapJarJxkoGlsUVqoqFpmpFxorFl8vcCp8yGQEaGwmmejIwMEAjiczOUpBaXJGck5uWl5jAwAACT9SZa";
export const useLiveStreaming = (client, ROLE) => {
  const [calling, setCalling] = useState(true);
  const isConnected = useIsConnected();
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  useEffect(() => {
    if (client) {
      client.setClientRole(ROLE);
      console.log("🔹 ROLE set on client =>", ROLE);
    }
  }, [client, ROLE]);

  useJoin(
    {
      appid: APP_ID,
      channel: CHANNEL_NAME,
      token: TEMP_TOKEN,
      role: ROLE,
    },
    calling
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(
    micOn && ROLE === "host"
  );
  const { localCameraTrack } = useLocalCameraTrack(
    cameraOn && ROLE === "host"
  );
  const remoteUsers = useRemoteUsers();

  const shouldPublish =
    isConnected && ROLE === "host" && localCameraTrack && localMicrophoneTrack;

  usePublish(
    shouldPublish ? [localMicrophoneTrack, localCameraTrack] : []
  );

  return {
    calling,
    setCalling,
    isConnected,
    micOn,
    setMic,
    cameraOn,
    setCamera,
    localMicrophoneTrack,
    localCameraTrack,
    remoteUsers,
  };
};

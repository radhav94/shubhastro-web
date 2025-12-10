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
const CHANNEL_NAME = "testnewchannellive";
const TEMP_TOKEN =
  "007eJxTYJjQsi1z4eQ9E5+v4Zj59dXLuC3zazlVnW6/j3HudjLauM1SgSHJPCnFwsjI0tzAKNUkNdk4ycDS2CI10dA0zcg40dgy+bytZWZDICND/kVXZkYGCATxhRhKUotL8lLLkzMS8/JSc3Iyy1IZGADtwCbY";
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

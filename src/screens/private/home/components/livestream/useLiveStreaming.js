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

import { getViewerToken } from "../../../../../services/appServices/authService";

// const APP_ID = "5630460abdc141e3b2f8d9597752bd7d";
const APP_ID = "c76e3d30a3b6483689dac88ca9f94381";

export const useLiveStreaming = (client, ROLE, channel) => {
  const [calling, setCalling] = useState(true);
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [hostLeft, setHostLeft] = useState(false);


  const isConnected = useIsConnected();
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  console.log("channellll:", channel);

  // 🔹 Set Agora SDK role (frontend role)
  useEffect(() => {
    if (client) {
      client.setClientRole(ROLE); // "host" | "audience"
    }
  }, [client, ROLE]);

  // 🔥 Channel switch handler
  useEffect(() => {
    if (!channel) return;

    setCalling(false);
    const t = setTimeout(() => setCalling(true), 100);
    return () => clearTimeout(t);
  }, [channel]);

  // 🔐 Fetch viewer token + uid (backend role = subscriber)
  useEffect(() => {
    if (!channel) return;

    const fetchToken = async () => {
      try {
        if (ROLE === "audience") {
          const res = await getViewerToken(channel);

          const viewerToken = res?.data?.data?.token;
          const viewerUid = res?.data?.data?.uid;
          const backendRole = res?.data?.data?.role; // "subscriber"

          console.log("Backend Role:", backendRole);
          console.log("Viewer Token:", viewerToken);
          console.log("Viewer UID:", viewerUid);

          setToken(viewerToken);
          setUid(viewerUid);
        } else {
          // Host flow (token later add kar sakte ho)
          setToken(null);
          setUid(null);
        }
      } catch (err) {
        console.error("Failed to get viewer token", err);
      }
    };

    fetchToken();
  }, [channel, ROLE]);

  useEffect(() => {
  if (!client || ROLE !== "audience") return;

  const handleUserLeft = (user) => {
    console.log("Host left channel:", user.uid);
    setHostLeft(true);
  };

  const handleUserPublished = () => {
    // host came back or new host joined
    setHostLeft(false);
  };

  client.on("user-left", handleUserLeft);
  client.on("user-published", handleUserPublished);

  return () => {
    client.off("user-left", handleUserLeft);
    client.off("user-published", handleUserPublished);
  };
}, [client, ROLE, channel]);

useEffect(() => {
  setHostLeft(false);
}, [channel]);



  // 🔗 Join Agora channel
  useJoin(
    {
      appid: APP_ID,
      channel,
      token: ROLE === "audience" ? token : null,
      uid: ROLE === "audience" ? uid : null,
      role: ROLE, // audience → subscriber | host → publisher
    },
    calling && !!channel && (ROLE === "host" || (!!token && !!uid))
  );

  // 🎙️ Local tracks (host only)
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(
    micOn && ROLE === "host"
  );
  const { localCameraTrack } = useLocalCameraTrack(
    cameraOn && ROLE === "host"
  );

  const remoteUsers = useRemoteUsers();

  // 📡 Publish tracks (host only)
  usePublish(
    isConnected && ROLE === "host" && localMicrophoneTrack && localCameraTrack
      ? [localMicrophoneTrack, localCameraTrack]
      : []
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
    uid, 
    hostLeft
  };
};

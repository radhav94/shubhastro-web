// src/components/LiveStreaming/useLiveStreaming.js
import { useEffect, useState, useCallback } from "react";
import {
  useJoin,
  usePublish,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  useIsConnected,
  useRemoteUsers,
} from "agora-rtc-react";

import {
  getViewerToken,
  getReconnectToken,
  refreshAgoraToken,
} from "../../../../../services/appServices/authService";
import {
  saveViewerSession,
  restoreViewerSession,
  clearViewerSession,
} from "../../../../../utils/liveSessionStorage";

const APP_ID = "c76e3d30a3b6483689dac88ca9f94381";

export const useLiveStreaming = (client, ROLE, channel) => {
  const [calling, setCalling] = useState(true);
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [hostLeft, setHostLeft] = useState(false);
  const [isReconnect, setIsReconnect] = useState(false);

  const isConnected = useIsConnected();
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  console.log("channellll:", channel);

  // Set Agora SDK role (frontend role)
  useEffect(() => {
    if (client) {
      client.setClientRole(ROLE); // "host" | "audience"
    }
  }, [client, ROLE]);

  // Channel switch handler
  useEffect(() => {
    if (!channel) return;

    setCalling(false);
    const t = setTimeout(() => setCalling(true), 100);
    return () => clearTimeout(t);
  }, [channel]);

  // Fetch viewer token — reconnect from sessionStorage or fresh join
  useEffect(() => {
    if (!channel) return;

    const fetchToken = async () => {
      try {
        if (ROLE === "audience") {
          // Check sessionStorage for an existing session on this channel
          const saved = restoreViewerSession();

          if (saved?.token && saved?.channel === channel) {
            console.log("Reconnecting to stream with saved session:", saved.channel);
            setToken(saved.token);
            setUid(saved.uid);
            setIsReconnect(true);

            // Try to get a fresh token for the existing channel (handles expiry)
            try {
              const res = await getReconnectToken(channel);
              const data = res?.data?.data;
              if (data?.token) {
                setToken(data.token);
                setUid(data.uid ?? saved.uid);
                saveViewerSession({
                  token: data.token,
                  channel,
                  uid: data.uid ?? saved.uid,
                  chatRoomId: saved.chatRoomId,
                  astrologer: saved.astrologer,
                });
              }
            } catch (reconnectErr) {
              // If reconnect-token endpoint fails (stream ended, 404, etc.)
              // fall back to the saved token — Agora join will fail gracefully
              // or try a fresh join
              console.warn("Reconnect token failed, trying fresh join:", reconnectErr);
              try {
                const res = await getViewerToken(channel);
                const data = res?.data?.data;
                if (data?.token) {
                  setToken(data.token);
                  setUid(data.uid);
                  setIsReconnect(false);
                  saveViewerSession({
                    token: data.token,
                    channel,
                    uid: data.uid,
                    astrologer: saved.astrologer,
                  });
                }
              } catch (freshErr) {
                console.error("Fresh token also failed — stream may have ended", freshErr);
                clearViewerSession();
              }
            }
            return;
          }

          // Fresh join — no saved session for this channel
          const res = await getViewerToken(channel);
          const viewerToken = res?.data?.data?.token;
          const viewerUid = res?.data?.data?.uid;
          const backendRole = res?.data?.data?.role;

          console.log("Backend Role:", backendRole);
          console.log("Viewer Token:", viewerToken);
          console.log("Viewer UID:", viewerUid);

          setToken(viewerToken);
          setUid(viewerUid);
          setIsReconnect(false);

          // Persist session for reconnect on refresh
          saveViewerSession({
            token: viewerToken,
            channel,
            uid: viewerUid,
          });
        } else {
          // Host flow
          setToken(null);
          setUid(null);
        }
      } catch (err) {
        console.error("Failed to get viewer token", err);
      }
    };

    fetchToken();
  }, [channel, ROLE]);

  // Agora token renewal — handle expiry during long streams
  useEffect(() => {
    if (!client || ROLE !== "audience") return;

    const handleTokenWillExpire = async () => {
      console.log("Agora token will expire soon, refreshing...");
      try {
        const res = await refreshAgoraToken(channel, uid);
        const newToken = res?.data?.data?.token;
        if (newToken) {
          await client.renewToken(newToken);
          // Update saved session with new token
          const saved = restoreViewerSession();
          if (saved) {
            saveViewerSession({ ...saved, token: newToken });
          }
          console.log("Agora token renewed successfully");
        }
      } catch (err) {
        console.error("Failed to refresh Agora token", err);
      }
    };

    const handleTokenDidExpire = async () => {
      console.log("Agora token expired, refreshing...");
      try {
        const res = await refreshAgoraToken(channel, uid);
        const newToken = res?.data?.data?.token;
        if (newToken) {
          await client.renewToken(newToken);
          const saved = restoreViewerSession();
          if (saved) {
            saveViewerSession({ ...saved, token: newToken });
          }
        }
      } catch (err) {
        console.error("Failed to refresh expired Agora token", err);
        clearViewerSession();
      }
    };

    client.on("token-privilege-will-expire", handleTokenWillExpire);
    client.on("token-privilege-did-expire", handleTokenDidExpire);

    return () => {
      client.off("token-privilege-will-expire", handleTokenWillExpire);
      client.off("token-privilege-did-expire", handleTokenDidExpire);
    };
  }, [client, ROLE, channel, uid]);

  // Track host left / returned
  useEffect(() => {
    if (!client || ROLE !== "audience") return;

    const handleUserLeft = (user) => {
      console.log("Host left channel:", user.uid);
      setHostLeft(true);
    };

    const handleUserPublished = () => {
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

  // Join Agora channel
  useJoin(
    {
      appid: APP_ID,
      channel,
      token: ROLE === "audience" ? token : null,
      uid: ROLE === "audience" ? uid : null,
      role: ROLE,
    },
    calling && !!channel && (ROLE === "host" || (!!token && !!uid))
  );

  // Local tracks (host only)
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(
    micOn && ROLE === "host"
  );
  const { localCameraTrack } = useLocalCameraTrack(
    cameraOn && ROLE === "host"
  );

  const remoteUsers = useRemoteUsers();

  // Publish tracks (host only)
  usePublish(
    isConnected && ROLE === "host" && localMicrophoneTrack && localCameraTrack
      ? [localMicrophoneTrack, localCameraTrack]
      : []
  );

  // Clear session on intentional leave
  const handleLeave = useCallback(() => {
    clearViewerSession();
    setCalling(false);
  }, []);

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
    hostLeft,
    isReconnect,
    handleLeave,
  };
};

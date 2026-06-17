// src/components/LiveStreaming/useLiveStreaming.js
import { useEffect, useState, useCallback, useRef } from "react";
import {
  usePublish,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  useRemoteUsers,
} from "agora-rtc-react";

import { LIVE_STREAM_ENCODER_CONFIG, AUDIO_ENCODER_CONFIG } from "../../../../../agora/agoraConfig";
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

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

export const useLiveStreaming = (client, ROLE, channel, rejoinKey = 0, { onChannelNotFound } = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [hostLeft, setHostLeft] = useState(false);
  const [isReconnect, setIsReconnect] = useState(false);
  const [calling, setCalling] = useState(true);
  const [uid, setUid] = useState(null);
  // When true, skip Agora leave on unmount (e.g. pending call waiting)
  const skipCleanupRef = useRef(false);

  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  const joinedChannelRef = useRef(null);

  // Set Agora SDK role
  useEffect(() => {
    if (client) {
      client.setClientRole(ROLE);
    }
  }, [client, ROLE]);

  // Helper: leave Agora channel safely
  const leaveChannel = useCallback(async () => {
    try {
      if (client && client.connectionState !== "DISCONNECTED") {
        await client.leave();
        console.log("Agora: left channel cleanly");
      }
    } catch (err) {
      console.warn("Agora: leave error (non-critical):", err.message);
    }
    joinedChannelRef.current = null;
    setIsConnected(false);
  }, [client]);

  // Main effect: leave → fetch token → join (with UID_CONFLICT retry)
  useEffect(() => {
    if (!channel || !client || ROLE !== "audience") return;

    let cancelled = false;

    const joinChannel = async () => {
      // 1. Reset UI state
      setHostLeft(false);
      setIsConnected(false);

      // If this is a forced rejoin (same roomId restarted), clear old session
      // so we get a fresh viewer token instead of trying reconnect
      if (rejoinKey > 0) {
        clearViewerSession();
      }

      // 2. Leave any previous channel
      await leaveChannel();
      if (cancelled) return;

      // 3. Fetch token and join with retry on UID_CONFLICT
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (cancelled) return;

        try {
          // Decide token strategy
          let tokenData = null;
          const saved = restoreViewerSession();
          const isRefresh = attempt === 0 && saved?.token && saved?.channel === channel;

          if (isRefresh) {
            // Try reconnect token first (page refresh scenario)
            try {
              const res = await getReconnectToken(channel);
              tokenData = res?.data?.data;
              if (tokenData?.token) {
                setIsReconnect(true);
                saveViewerSession({
                  token: tokenData.token,
                  channel,
                  uid: tokenData.uid ?? saved.uid,
                  chatRoomId: saved.chatRoomId,
                  astrologer: saved.astrologer,
                });
              }
            } catch {
              console.warn("Reconnect token failed, using fresh token");
              tokenData = null;
            }
          }

          // Fresh token (first visit, or reconnect failed, or retry)
          if (!tokenData?.token) {
            clearViewerSession();
            try {
              const res = await getViewerToken(channel);
              // Check for "channel not found or stream ended" response
              if (res?.data?.success === false) {
                console.warn("Channel not found or stream ended:", channel);
                if (!cancelled) onChannelNotFound?.(channel);
                return;
              }
              tokenData = res?.data?.data;
              if (tokenData?.token) {
                setIsReconnect(false);
                saveViewerSession({
                  token: tokenData.token,
                  channel,
                  uid: tokenData.uid,
                });
              }
            } catch (tokenErr) {
              // Handle 404 or network error from viewer token API
              const status = tokenErr?.response?.status;
              const msg = tokenErr?.response?.data?.message || "";
              if (status === 404 || msg.includes("channel not found") || msg.includes("stream ended")) {
                console.warn("Channel not found (404):", channel);
                if (!cancelled) onChannelNotFound?.(channel);
                return;
              }
              throw tokenErr; // re-throw other errors for the outer catch
            }
          }

          if (cancelled) return;

          if (!tokenData?.token) {
            console.warn("No viewer token — stream may not be active");
            return;
          }

          // 4. Actually join the Agora channel
          const joinUid = await client.join(
            APP_ID,
            channel,
            tokenData.token,
            tokenData.uid ?? null
          );

          if (cancelled) {
            // We joined but the effect was cancelled — leave immediately
            await leaveChannel();
            return;
          }

          // Success
          joinedChannelRef.current = channel;
          setUid(joinUid);
          setIsConnected(true);
          console.log("Agora: joined channel", channel, "as UID", joinUid);
          return; // exit retry loop

        } catch (err) {
          const isUidConflict = err?.code === "UID_CONFLICT" ||
            err?.message?.includes("UID_CONFLICT");

          if (attempt < MAX_RETRIES - 1) {
            // Any join failure — a UID_CONFLICT, or (commonly after a page
            // reload) a stale/invalid reconnect token — should fall back to a
            // FRESH viewer token. Clearing the saved session makes the next
            // attempt skip the reconnect-token branch and call getViewerToken,
            // which is the path that reliably connects.
            console.warn(
              `Agora join failed on attempt ${attempt + 1} (${isUidConflict ? "UID_CONFLICT" : err?.message || err}); clearing session and retrying with a fresh token in ${RETRY_DELAY}ms...`
            );
            clearViewerSession();
            // Leave again in case partial join happened
            await leaveChannel();
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
          } else {
            console.error("Agora join failed:", err.message || err);
            return;
          }
        }
      }
    };

    joinChannel();

    return () => {
      cancelled = true;
      // Leave on cleanup (channel change or unmount) — unless skipCleanup is set
      if (!skipCleanupRef.current) {
        leaveChannel();
      }
    };
  }, [channel, client, ROLE, leaveChannel, rejoinKey]);

  // Token renewal for long streams
  useEffect(() => {
    if (!client || ROLE !== "audience" || !isConnected) return;

    const handleTokenWillExpire = async () => {
      console.log("Agora token will expire soon, refreshing...");
      try {
        const res = await refreshAgoraToken(channel, uid);
        const newToken = res?.data?.data?.token;
        if (newToken) {
          await client.renewToken(newToken);
          const saved = restoreViewerSession();
          if (saved) saveViewerSession({ ...saved, token: newToken });
          console.log("Agora token renewed");
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
          if (saved) saveViewerSession({ ...saved, token: newToken });
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
  }, [client, ROLE, channel, uid, isConnected]);

  // Track host left / returned
  useEffect(() => {
    if (!client || ROLE !== "audience") return;

    const handleUserLeft = (user) => {
      // Only process if we're still in the same channel (avoid stale events from old channel)
      if (!joinedChannelRef.current || joinedChannelRef.current !== channel) return;
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

  // Local tracks (host only) — with low-bandwidth encoding config
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn && ROLE === "host", {
    encoderConfig: {
      sampleRate: AUDIO_ENCODER_CONFIG.sampleRate,
      stereo: AUDIO_ENCODER_CONFIG.stereo,
      bitrate: AUDIO_ENCODER_CONFIG.bitrate,
    },
  });
  const { localCameraTrack } = useLocalCameraTrack(cameraOn && ROLE === "host", {
    encoderConfig: {
      width: LIVE_STREAM_ENCODER_CONFIG.width,
      height: LIVE_STREAM_ENCODER_CONFIG.height,
      frameRate: LIVE_STREAM_ENCODER_CONFIG.frameRate,
      bitrateMin: LIVE_STREAM_ENCODER_CONFIG.bitrateMin,
      bitrateMax: LIVE_STREAM_ENCODER_CONFIG.bitrateMax,
    },
  });

  const remoteUsers = useRemoteUsers();

  // Detect if host (first remote user) has muted their audio
  const isHostMuted = remoteUsers.length > 0 && !remoteUsers[0].hasAudio;

  // Publish tracks (host only)
  usePublish(
    isConnected && ROLE === "host" && localMicrophoneTrack && localCameraTrack
      ? [localMicrophoneTrack, localCameraTrack]
      : []
  );

  // Intentional leave (back button)
  const handleLeave = useCallback(async () => {
    clearViewerSession();
    setCalling(false);
    await leaveChannel();
  }, [leaveChannel]);

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
    isHostMuted,
    handleLeave,
    skipCleanupRef,
  };
};

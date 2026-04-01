// src/components/LiveStreaming/InteractiveLiveStreaming.jsx
import React, { lazy, useMemo, useEffect } from "react";
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
const LiveStreamingContainer = lazy(() => import("./LiveStreamingContainer"));

const InteractiveLiveStreaming = () => {
  // Create a fresh client per mount so there's no stale Agora state
  // from a previous navigation. The old client gets garbage-collected.
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "live", codec: "vp8" }),
    []
  );

  // Ensure the client leaves on unmount (navigation away)
  useEffect(() => {
    return () => {
      if (client && client.connectionState !== "DISCONNECTED") {
        client.leave().catch(() => {});
      }
    };
  }, [client]);

  return (
    <AgoraRTCProvider client={client}>
      <LiveStreamingContainer client={client} />
    </AgoraRTCProvider>
  );
};

export default InteractiveLiveStreaming;

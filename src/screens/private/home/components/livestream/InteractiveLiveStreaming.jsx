// src/components/LiveStreaming/InteractiveLiveStreaming.jsx
import React, { lazy } from "react";
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
const LiveStreamingContainer = lazy(() => import("./LiveStreamingContainer"));

const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

const InteractiveLiveStreaming = () => {
  return (
    <AgoraRTCProvider client={client}>
      <LiveStreamingContainer client={client} />
    </AgoraRTCProvider>
  );
};

export default InteractiveLiveStreaming;

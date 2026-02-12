// src/components/LiveStreaming/InteractiveLiveStreaming.jsx
import React from "react";
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
const LiveStreamingContainer = lazt(() => import("./LiveStreamingContainer"));

const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

const InteractiveLiveStreaming = () => {
  return (
    <AgoraRTCProvider client={client}>
      <LiveStreamingContainer client={client} />
    </AgoraRTCProvider>
  );
};

export default InteractiveLiveStreaming;

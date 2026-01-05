// src/components/LiveStreaming/LiveStreamingContainer.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useLiveStreaming } from "./useLiveStreaming";
import { useLiveChat } from "./useLiveChat";
import LiveView from "./LiveView";
import StartLivePopup from "./StartLivePopup";
// imports
import { useSwipeReel } from "./useSwipeReel";
import "./styles/live.scss";
import { useLiveList } from "../../../../../context/LiveListContext";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
   const liveList = useLiveList();
   const direction = liveList?.direction || "up";

  const channel = liveList?.getCurrentChannel();
  const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
    ? "host"
    : "audience";

  // 🟢 Hooks always called FIRST ✔
  const live = useLiveStreaming(client, ROLE,channel);
  const chat = useLiveChat(ROLE);


    const swipeHandlers = useSwipeReel({
    enabled: ROLE !== "host",
    onNext: liveList?.goNextLive,
    onPrev: liveList?.goPrevLive,
  });

  const { calling, setCalling } = live;

  // 🟢 UI return is the condition, NOT hook call ✔
  if (ROLE === "host" && !calling) {
    return <StartLivePopup onStart={() => setCalling(true)} />;
  }

  return (
    <div className="live-container" {...swipeHandlers}>


    <div
      key={channel}
      className={`live-slide-wrapper ${direction}`}
    >
      <LiveView
        channel={channel}
        ROLE={ROLE}
        {...live}
        {...chat}
      />
    </div>
  </div>
);

};

export default LiveStreamingContainer;



// src/components/LiveStreaming/LiveStreamingContainer.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useLiveStreaming } from "./useLiveStreaming";
import { useLiveChat } from "./useLiveChat";
import LiveView from "./LiveView";
import StartLivePopup from "./StartLivePopup";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

// imports
import { useSwipeReel } from "./useSwipeReel";
import "./styles/live.scss";
import { useLiveList } from "../../../../../context/LiveListContext";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
   const liveList = useLiveList();
   const currentLive = liveList?.getCurrentLive();

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
      key={`${liveList.currentIndex}-${direction}`}
      className={`live-slide-wrapper ${direction}`}
    >
      <div className="slide-placeholder" />
    </div>

    {/* FIXED VIDEO (PORTALED INSIDE LiveView) */}
    <LiveView channel={channel} ROLE={ROLE} {...live} {...chat} 
      astrologer={currentLive}
/>

    {/* 🔥 LIVE NAVIGATION CONTROLS */}
    {ROLE !== "host" && liveList && (
      <div className="live-nav-controls">
        <button
          className="nav-btn"
          onClick={liveList.goPrevLive}
          aria-label="Previous live"
        >
          <FiChevronUp size={22} />
        </button>

        <button
          className="nav-btn"
          onClick={liveList.goNextLive}
          aria-label="Next live"
        >
          <FiChevronDown size={22} />
        </button>
      </div>
    )}
  </div>
);


};

export default LiveStreamingContainer;



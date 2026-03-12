// src/components/LiveStreaming/LiveStreamingContainer.jsx
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLiveStreaming } from "./useLiveStreaming";
import { useLiveChat } from "./useLiveChat";
import LiveView from "./LiveView";
import StartLivePopup from "./StartLivePopup";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

import { useSwipeReel } from "./useSwipeReel";
import "./styles/live.scss";
import { useLiveList } from "../../../../../context/LiveListContext";
import {
  clearViewerSession,
  restoreViewerSession,
  saveViewerSession,
} from "../../../../../utils/liveSessionStorage";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const liveList = useLiveList();
  console.log("liveList", liveList);
  const currentLive = liveList?.getCurrentLive();

  const direction = liveList?.direction || "up";

  const channel = liveList?.getCurrentChannel();
  const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
    ? "host"
    : "audience";

  const live = useLiveStreaming(client, ROLE, channel);

  // Persist astrologer info in sessionStorage so refresh can restore it
  useEffect(() => {
    if (!channel || !currentLive || ROLE !== "audience") return;
    const saved = restoreViewerSession();
    if (saved?.channel === channel) {
      // Update astrologer info in existing session
      saveViewerSession({
        ...saved,
        astrologer: {
          _id: currentLive.astrologerId,
          firstName: currentLive.astrologerName?.split(" ")[0] || "",
          lastName: currentLive.astrologerName?.split(" ").slice(1).join(" ") || "",
          rating: currentLive.rating,
          expertise: currentLive.expertise,
        },
      });
    }
  }, [channel, currentLive, ROLE]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id") || "";
  const userNameLocal = localStorage.getItem("shubhtalk_customer_name") || "User";

  // Ref to hold retryJoinRoom — breaks circular dep between handleAstrologerStatus and chat
  const retryJoinRef = useRef(null);

  const handleAstrologerStatus = useCallback((data) => {
    const { status, roomId, hostId, hostName } = data;

    if (status === "ended") {
      liveList?.removeLive(roomId);
    }

    if (status === "started") {
      liveList?.addLive({
        channel: roomId,
        astrologerId: hostId,
        astrologerName: hostName || "",
      });
      setTimeout(() => {
        liveList?.switchToChannel(roomId);
        // Retry joining the chat room with the specific roomId
        retryJoinRef.current?.(roomId);
      }, 300);
    }
  }, [liveList]);

  // Handle stream ended (room not found, room ended, host disconnected)
  const handleStreamEnded = useCallback(({ reason }) => {
    console.log("Stream ended, reason:", reason);
    clearViewerSession();

    // If there are other lives, move to next; otherwise navigate away
    if (liveList && liveList.lives.length > 1) {
      liveList.removeLive(channel);
    } else {
      navigate("/live", { replace: true });
    }
  }, [liveList, channel, navigate]);

  // Broadcast: new live session started (from any astrologer)
  const handleSessionStarted = useCallback((data) => {
    const { roomId, hostId, hostName } = data;
    liveList?.addLive({
      channel: roomId,
      astrologerId: hostId,
      astrologerName: hostName || "",
    });
  }, [liveList]);

  // Broadcast: a live session ended (from any astrologer)
  const handleSessionEnded = useCallback((data) => {
    const { roomId } = data;
    liveList?.removeLive(roomId);
  }, [liveList]);

  const chat = useLiveChat({
    roomId: channel,
    userId: userIdLocal,
    userName: userNameLocal,
    onAstrologerStatus: handleAstrologerStatus,
    onStreamEnded: handleStreamEnded,
    onSessionStarted: handleSessionStarted,
    onSessionEnded: handleSessionEnded,
  });

  // When astrologer goes live and the channel matches, retry joining the chat room
  useEffect(() => {
    if (!channel || !chat.isConnected || chat.roomReady) return;
    chat.retryJoinRoom();
  }, [channel, chat.isConnected, chat.roomReady]);

  // Keep ref in sync so handleAstrologerStatus can call it
  useEffect(() => {
    retryJoinRef.current = chat.retryJoinRoom;
  }, [chat.retryJoinRoom]);


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
      key={`${liveList?.currentIndex || 0}-${direction}`}
      className={`live-slide-wrapper ${direction}`}
    >
      <div className="slide-placeholder" />
    </div>

    {/* FIXED VIDEO (PORTALED INSIDE LiveView) */}
    <LiveView channel={channel} ROLE={ROLE} {...live} {...chat} 
      astrologer={currentLive}
/>

    {/* 🔥 LIVE NAVIGATION CONTROLS */}
    {ROLE !== "host" && liveList && liveList.lives.length > 1 && (
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



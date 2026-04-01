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
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";

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
          imageUrl: currentLive.imageUrl,
          audioCallRate: currentLive.audioCallRate,
          videoCallRate: currentLive.videoCallRate,
        },
      });
    }
  }, [channel, currentLive, ROLE]);

  const userIdLocal = localStorage.getItem("shubhtalk_customer_id") || "";
  const userNameLocal = localStorage.getItem("shubhtalk_customer_name") || "User";

  // Ref to hold retryJoinRoom — breaks circular dep between handleAstrologerStatus and chat
  const retryJoinRef = useRef(null);

  // Keep live state in a ref so the callback always reads fresh values
  const liveRef = useRef(live);
  useEffect(() => { liveRef.current = live; }, [live]);

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

      // Only auto-switch if user has no active stream (host left / waiting screen)
      // If user is watching a live stream, don't interrupt — just highlight the arrow
      const currentLiveState = liveRef.current;
      if (currentLiveState.hostLeft || !currentLiveState.remoteUsers?.length) {
        setTimeout(() => {
          liveList?.switchToChannel(roomId);
          retryJoinRef.current?.(roomId);
        }, 300);
      }
    }
  }, [liveList]);

  // Handle stream ended (room not found, room ended, host disconnected)
  const handleStreamEnded = useCallback(({ reason, roomId: endedRoomId }) => {
    console.log("Stream ended, reason:", reason, "roomId:", endedRoomId);
    clearViewerSession();

    const targetRoom = endedRoomId || channel;

    // If we already switched to a different channel (e.g. astrologer_status
    // triggered a channel switch before room_ended arrived), skip removal —
    // the ended room was likely already removed by handleAstrologerStatus.
    if (targetRoom && targetRoom !== channel) {
      console.log("Stream ended for a room we already left, ignoring:", targetRoom);
      return;
    }

    // If there are other lives, remove the ended one; otherwise navigate away
    if (liveList && liveList.lives.length > 1) {
      liveList.removeLive(targetRoom);
    } else if (liveList && liveList.lives.length <= 1) {
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

  // Room not found — re-fetch live list and switch to an active astrologer
  const handleRoomNotFound = useCallback(async (staleRoomId) => {
    console.log("Room not found, re-checking live list...", staleRoomId);
    try {
      const res = await getAstrologerLiveList();
      const data = res.data?.data || [];

      // Dedupe
      const map = {};
      data.forEach((item) => {
        if (!map[item.channel] || map[item.channel].lastActive < item.lastActive) {
          map[item.channel] = item;
        }
      });
      const freshLives = Object.values(map);

      if (freshLives.length > 0) {
        // Remove the stale channel and add fresh ones
        if (staleRoomId) liveList?.removeLive(staleRoomId);

        freshLives.forEach((l) => {
          liveList?.addLive({
            channel: l.channel,
            astrologerId: l.astrologer?._id,
            astrologerName: `${l.astrologer?.firstName || ""} ${l.astrologer?.lastName || ""}`.trim(),
            rating: l.astrologer?.rating,
            expertise: l.astrologer?.expertise,
            imageUrl: l.astrologer?.profileImgUrl,
            audioCallRate: l.astrologer?.price?.audioRate?.amount,
            videoCallRate: l.astrologer?.price?.videoCallRate?.amount,
          });
        });

        // Switch to the first available live
        const firstLive = freshLives[0];
        liveList?.switchToChannel(firstLive.channel);
        retryJoinRef.current?.(firstLive.channel);
      } else {
        // No one is live — navigate to live landing
        clearViewerSession();
        navigate("/live", { replace: true });
      }
    } catch (err) {
      console.error("Failed to re-check live list:", err);
      clearViewerSession();
      navigate("/live", { replace: true });
    }
  }, [liveList, navigate]);

  const chat = useLiveChat({
    roomId: channel,
    userId: userIdLocal,
    userName: userNameLocal,
    onAstrologerStatus: handleAstrologerStatus,
    onStreamEnded: handleStreamEnded,
    onSessionStarted: handleSessionStarted,
    onSessionEnded: handleSessionEnded,
    onRoomNotFound: handleRoomNotFound,
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
          className={`nav-btn${liveList.hasNewLive ? " nav-btn-highlight" : ""}`}
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



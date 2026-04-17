// src/components/LiveStreaming/LiveStreamingContainer.jsx
import { useCallback, useEffect, useRef, useState } from "react";
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
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { useCall } from "../../../../../context/CallContext";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCall } = useCall();
  const liveList = useLiveList();
  console.log("liveList", liveList);
  const currentLive = liveList?.getCurrentLive();

  const direction = liveList?.direction || "up";

  const channel = liveList?.getCurrentChannel();
  const rejoinKey = liveList?.rejoinKey || 0;
  const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
    ? "host"
    : "audience";

  // Keyboard arrow navigation (ArrowUp = prev, ArrowDown = next)
  useEffect(() => {
    if (ROLE === "host" || !liveList || liveList.lives.length <= 1 || activeCall) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        liveList.goPrevLive?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        liveList.goNextLive?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ROLE, liveList]);

  // When viewer token returns "channel not found", silently remove and go next
  const handleChannelNotFound = useCallback((deadChannel) => {
    if (liveList) {
      liveList.removeLive(deadChannel);
      // Clear the channelId from URL so it doesn't retry the dead channel
      if (window.location.pathname.includes(deadChannel)) {
        navigate("/live", { replace: true });
      }
    }
  }, [liveList, navigate]);

  const live = useLiveStreaming(client, ROLE, channel, rejoinKey, {
    onChannelNotFound: handleChannelNotFound,
  });

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
  const storedUser = getUserFromStorage();
  const userNameLocal = (() => {
    const first = storedUser?.firstName || "";
    const last = storedUser?.lastName || "";
    if (first && last && first.toLowerCase() !== last.toLowerCase()) return `${first} ${last}`;
    return first || "User";
  })();

  // Ref to hold retryJoinRoom — breaks circular dep between handleAstrologerStatus and chat
  const retryJoinRef = useRef(null);

  // Keep live state in a ref so the callback always reads fresh values
  const liveRef = useRef(live);
  useEffect(() => { liveRef.current = live; }, [live]);

  // Private call state — tracks when the current astrologer is on a private call
  const [privateCallInfo, setPrivateCallInfo] = useState({ isOnPrivateCall: false, privateCallType: null });

  // Reset private call state when switching channels
  useEffect(() => {
    if (!currentLive) return;
    setPrivateCallInfo({
      isOnPrivateCall: !!currentLive.isOnPrivateCall,
      privateCallType: currentLive.privateCallType || null,
    });
  }, [currentLive?.channel]);

  const handleAstrologerStatus = useCallback((data) => {
    const { status, roomId, hostId, hostName, privateCallType } = data;

    if (status === "ended") {
      liveList?.removeLive(roomId);
    }

    if (status === "started") {
      liveList?.addLive({
        channel: roomId,
        astrologerId: hostId,
        astrologerName: hostName || "",
        startedAt: Date.now(),
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

    if (status === "on_private_call") {
      console.log("[LiveContainer] 📞 Setting privateCallInfo: on_private_call, type:", privateCallType);
      setPrivateCallInfo({ isOnPrivateCall: true, privateCallType: privateCallType || null });
    }

    if (status === "private_call_ended") {
      console.log("[LiveContainer] 📞 Setting privateCallInfo: private_call_ended");
      setPrivateCallInfo({ isOnPrivateCall: false, privateCallType: null });
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

    // If there are other lives, remove the ended one
    if (liveList) {
      liveList.removeLive(targetRoom);
    }
  }, [liveList, channel, navigate]);

  // Broadcast: new live session started (from any astrologer)
  const handleSessionStarted = useCallback((data) => {
    const { roomId, hostId, hostName } = data;
    liveList?.addLive({
      channel: roomId,
      astrologerId: hostId,
      astrologerName: hostName || "",
      startedAt: Date.now(),
    });
  }, [liveList]);

  // Broadcast: a live session ended (from any astrologer)
  const handleSessionEnded = useCallback((data) => {
    const { roomId } = data;
    liveList?.removeLive(roomId);
  }, [liveList]);

  // Track rooms that returned ROOM_NOT_FOUND to prevent retry loops
  const roomNotFoundRef = useRef(new Set());

  // Room not found on chat socket — don't disrupt Agora stream.
  // The chat room may not exist yet on the server while Agora video works fine.
  // Just log it and let the retry effect handle reconnection when the room appears.
  const handleRoomNotFound = useCallback((staleRoomId) => {
    console.log("Chat room not found (non-critical):", staleRoomId);
    roomNotFoundRef.current.add(staleRoomId);
  }, []);

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
  // Don't retry if the room was already reported as not found
  useEffect(() => {
    if (!channel || !chat.isConnected || chat.roomReady) return;
    if (roomNotFoundRef.current.has(channel)) return;
    chat.retryJoinRoom();
  }, [channel, chat.isConnected, chat.roomReady]);

  // Keep ref in sync so handleAstrologerStatus can call it
  useEffect(() => {
    retryJoinRef.current = chat.retryJoinRoom;
  }, [chat.retryJoinRoom]);


    const swipeHandlers = useSwipeReel({
    enabled: ROLE !== "host" && !activeCall,
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
      privateCallInfo={privateCallInfo}
/>

    {/* 🔥 LIVE NAVIGATION CONTROLS */}
    {ROLE !== "host" && liveList && liveList.lives.length > 1 && !activeCall && (
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



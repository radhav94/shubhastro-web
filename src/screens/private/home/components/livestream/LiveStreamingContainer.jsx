// src/components/LiveStreaming/LiveStreamingContainer.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { getAstrologerDefaultImage } from "../../../../../utils/appImages";
import { useCall } from "../../../../../context/CallContext";
import { toast as rht } from "react-hot-toast";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCall, waitingList } = useCall();
  const isCallBusy = !!activeCall;
  const liveList = useLiveList();
  const giftPopupOpenRef = useRef(false);
  const [liveListRefreshKey, setLiveListRefreshKey] = useState(0);
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
    if (ROLE === "host" || !liveList || liveList.lives.length <= 1 || isCallBusy) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (giftPopupOpenRef.current) return;
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
          // Preserve the username so name rendering stays userName-first.
          // `astrologerName` is already the resolved display name, so use it as
          // the fallback rather than splitting it into first/last.
          userName: currentLive.userName || currentLive.astrologerName || "",
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

  // Keep channel in a ref so handleAstrologerStatus always reads the current channel
  const channelRef = useRef(channel);
  useEffect(() => { channelRef.current = channel; }, [channel]);

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

  // Session ended modal state
  const [endedInfo, setEndedInfo] = useState(null);
  const endedTimerRef = useRef(null);

  const dismissEnded = useCallback(() => {
    const rid = endedInfo?.roomId;
    setEndedInfo(null);
    if (endedTimerRef.current) { clearTimeout(endedTimerRef.current); endedTimerRef.current = null; }
    if (rid) { liveList?.removeLive(rid); setLiveListRefreshKey((k) => k + 1); }
  }, [endedInfo, liveList]);

  // Cleanup on unmount — clear timer and reset modal state
  useEffect(() => {
    return () => {
      if (endedTimerRef.current) { clearTimeout(endedTimerRef.current); endedTimerRef.current = null; }
      setEndedInfo(null);
    };
  }, []);

  const handleAstrologerStatus = (data) => {
    const { status, roomId, hostId, hostName, profileImage, privateCallType, gender } = data;

    console.log("handleAstrologerStatus::",data)

    if (status === "ended") {
      const wasWatchingThis = roomId && roomId === channelRef.current;

      if (wasWatchingThis) {
        // Show modal first, defer removeLive until modal closes/auto-dismisses
        // Use profileImage from socket event, fallback to currentLive's imageUrl
        const currentLiveEntry = liveList?.getCurrentLive();
        const resolvedImage = profileImage || currentLiveEntry?.imageUrl || null;
        // Prefer the locally resolved display name (userName-first) over the
        // socket payload's hostName, which carries the astrologer's real
        // first + last name.
        const resolvedHostName = currentLiveEntry?.astrologerName || hostName;
        setEndedInfo({ hostName: resolvedHostName, profileImage: resolvedImage, gender, roomId });
        if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
        endedTimerRef.current = setTimeout(() => {
          setEndedInfo((prev) => {
            if (prev?.roomId) { liveList?.removeLive(prev.roomId); setLiveListRefreshKey((k) => k + 1); }
            return null;
          });
        }, 2000);
      } else {
        // Not watching this stream — just remove silently
        liveList?.removeLive(roomId);
        setLiveListRefreshKey((k) => k + 1);
      }
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

    // Only update private call state if the event is for the current astrologer
    const currentAstrologerId = liveList?.getCurrentLive()?.astrologerId;
    if (status === "on_private_call") {
      if (!hostId || hostId === currentAstrologerId) {
        console.log("[LiveContainer] 📞 Setting privateCallInfo: on_private_call, type:", privateCallType);
        setPrivateCallInfo({ isOnPrivateCall: true, privateCallType: privateCallType || null });
      }
    }

    if (status === "private_call_ended") {
      if (!hostId || hostId === currentAstrologerId) {
        console.log("[LiveContainer] 📞 Setting privateCallInfo: private_call_ended");
        setPrivateCallInfo({ isOnPrivateCall: false, privateCallType: null });
      }
    }
  };

  // Handle stream ended (room not found, room ended, host disconnected)
  const handleStreamEnded = useCallback(({ reason, roomId: endedRoomId }) => {
    console.log("Stream ended, reason:", reason, "roomId:", endedRoomId);
    clearViewerSession();

    const targetRoom = endedRoomId || channelRef.current;

    if (targetRoom && targetRoom !== channelRef.current) {
      console.log("Stream ended for a room we already left, ignoring:", targetRoom);
      return;
    }

    // If endedInfo is already showing (from handleAstrologerStatus), don't overwrite it
    setEndedInfo((prev) => {
      if (prev) return prev;
      const currentAstro = liveList?.getCurrentLive();
      return {
        hostName: currentAstro?.astrologerName || "Astrologer",
        profileImage: currentAstro?.imageUrl || null,
        gender: currentAstro?.gender || null,
        roomId: targetRoom,
      };
    });
    if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
    endedTimerRef.current = setTimeout(() => {
      setEndedInfo((prev) => {
        if (prev?.roomId && liveList) { liveList.removeLive(prev.roomId); setLiveListRefreshKey((k) => k + 1); }
        return null;
      });
    }, 5000);
  }, [liveList, channel]);

  // Broadcast: new live session started (from any astrologer)
  const handleSessionStarted = useCallback((data) => {
    const { roomId, hostId, hostName } = data;
    liveList?.addLive({
      channel: roomId,
      astrologerId: hostId,
      astrologerName: hostName || "",
      startedAt: Date.now(),
    });
    setLiveListRefreshKey((k) => k + 1);
  }, [liveList]);

  // Broadcast: a live session ended (from any astrologer)
  const handleSessionEnded = useCallback((data) => {
    const { roomId } = data;
    // Don't remove if user is currently watching this — handleStreamEnded will show modal first
    if (roomId && roomId === channelRef.current) return;
    liveList?.removeLive(roomId);
    setLiveListRefreshKey((k) => k + 1);
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
  // NOTE: The initial join is handled inside useLiveChat's room effect.
  // This retry only kicks in if the room isn't ready after a delay (server
  // may not have created the room yet when the user joins Agora first).
  useEffect(() => {
    if (!channel || !chat.isConnected || chat.roomReady) return;
    if (roomNotFoundRef.current.has(channel)) return;

    // Only retry after a delay — the initial join inside useLiveChat handles
    // the first attempt. Firing immediately here causes a double join_room emit.
    const retryTimer = setTimeout(() => {
      if (!chat.roomReady) {
        chat.retryJoinRoom(channel);
      }
    }, 3000);

    return () => clearTimeout(retryTimer);
  }, [channel, chat.isConnected, chat.roomReady]);

  // Keep ref in sync so handleAstrologerStatus can call it
  useEffect(() => {
    retryJoinRef.current = chat.retryJoinRoom;
  }, [chat.retryJoinRoom]);


    const swipeHandlers = useSwipeReel({
    enabled: ROLE !== "host" && !isCallBusy,
    onNext: liveList?.goNextLive,
    onPrev: liveList?.goPrevLive,
    disabledRef: giftPopupOpenRef,
  });

  const { calling, setCalling } = live;

  // 🟢 UI return is the condition, NOT hook call ✔
  if (ROLE === "host" && !calling) {
    return <StartLivePopup onStart={() => setCalling(true)} />;
  }

  return (
  <div className="live-container" {...(isCallBusy ? {} : swipeHandlers)} style={isCallBusy ? { touchAction: "none", overflowY: "hidden" } : undefined}>
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
      giftPopupOpenRef={giftPopupOpenRef}
      liveListRefreshKey={liveListRefreshKey}
/>

    {/* 🔥 LIVE NAVIGATION CONTROLS */}
    {ROLE !== "host" && liveList && liveList.lives.length > 1 && !isCallBusy && (
      <div className="live-nav-controls">
        <button
          className="nav-btn"
          onClick={() => { if (!giftPopupOpenRef.current) liveList.goPrevLive(); }}
          aria-label="Previous live"
        >
          <FiChevronUp size={22} />
        </button>

        <button
          className={`nav-btn${liveList.hasNewLive ? " nav-btn-highlight" : ""}`}
          onClick={() => { if (!giftPopupOpenRef.current) liveList.goNextLive(); }}
          aria-label="Next live"
        >
          <FiChevronDown size={22} />
        </button>
      </div>
    )}

    {/* Session Ended Modal — portaled to body for guaranteed centering */}
    {endedInfo && createPortal(
      <div onClick={dismissEnded} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 340, width: "85vw", textAlign: "center", position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <button onClick={dismissEnded} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999", lineHeight: 1 }}>✕</button>
          {endedInfo.profileImage ? (
            <img src={endedInfo.profileImage} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #f75801", margin: "0 auto 14px", display: "block" }} />
          ) : (
            <img src={getAstrologerDefaultImage(endedInfo.gender)} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #f75801", margin: "0 auto 14px", display: "block" }} />
          )}
          <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px" }}>{endedInfo.hostName || "Astrologer"} has left</h3>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 18px" }}>The live session has ended</p>
          <button onClick={dismissEnded} style={{ background: "linear-gradient(90deg, #F75801, #D43400)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>OK</button>
        </div>
      </div>,
      document.body
    )}
  </div>
);


};

export default LiveStreamingContainer;



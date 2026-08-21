import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";
import Toast from "../../../../../component/toast";
import { SOCKET_URL, SOCKET_PATH } from "../../../../../utils/apiConfig";

export const useLiveChat = ({ roomId, userId, userName, onAstrologerStatus, onStreamEnded, onSessionStarted, onSessionEnded, onRoomNotFound, onBlocked, onUserBlocked, onReportSubmitted }) => {
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  // Grace period refs for room_ended → session_started race condition
  const pendingEndRoomRef = useRef(null);
  const pendingEndTimerRef = useRef(null);

  // Keep callback refs in sync so socket listeners always call the latest version
  const onStreamEndedRef = useRef(onStreamEnded);
  const onAstrologerStatusRef = useRef(onAstrologerStatus);
  const onSessionStartedRef = useRef(onSessionStarted);
  const onSessionEndedRef = useRef(onSessionEnded);
  const onRoomNotFoundRef = useRef(onRoomNotFound);
  const onBlockedRef = useRef(onBlocked);
  const onUserBlockedRef = useRef(onUserBlocked);
  const onReportSubmittedRef = useRef(onReportSubmitted);
  useEffect(() => { onStreamEndedRef.current = onStreamEnded; }, [onStreamEnded]);
  useEffect(() => { onAstrologerStatusRef.current = onAstrologerStatus; }, [onAstrologerStatus]);
  useEffect(() => { onSessionStartedRef.current = onSessionStarted; }, [onSessionStarted]);
  useEffect(() => { onSessionEndedRef.current = onSessionEnded; }, [onSessionEnded]);
  useEffect(() => { onRoomNotFoundRef.current = onRoomNotFound; }, [onRoomNotFound]);
  useEffect(() => { onBlockedRef.current = onBlocked; }, [onBlocked]);
  useEffect(() => { onUserBlockedRef.current = onUserBlocked; }, [onUserBlocked]);
  useEffect(() => { onReportSubmittedRef.current = onReportSubmitted; }, [onReportSubmitted]);
  const [roomReady, setRoomReady] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  // When true, skip socket disconnect on unmount (pending call waiting)
  const skipChatCleanupRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [liveStartedAt, setLiveStartedAt] = useState(null);
  const [isOnPrivateCall, setIsOnPrivateCall] = useState(false);

  // 1. Socket connection — stays alive independent of roomId
  useEffect(() => {
    if (!userId) {
      console.warn("LiveChat → Skipped: missing userId");
      return;
    }

    console.log("LiveChat → Connecting via proxy");

    const token = localStorage.getItem("shubhtalk_customer_token");
    const authPayload = token
      ? { token }
      : { userId, role: "GUEST" };

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      path: SOCKET_PATH,
      query: { role: token ? "CUSTOMER" : "GUEST", userId },
      auth: authPayload,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("LiveChat → Connected, socketId:", socket.id);
      setIsConnected(true);

      // Auto-join current room on connect/reconnect
      if (currentRoomRef.current) {
        console.log("LiveChat → Auto-rejoining room:", currentRoomRef.current);
        socket.emit("live:join_room", {
          roomId: currentRoomRef.current,
          userType: "audience",
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("LiveChat → Disconnected, reason:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("LiveChat → Connection error:", err.message);
    });

    socket.on("live:joined", (data) => {
      console.log("LiveChat → Joined room:", data);
      setParticipantCount(data.participantCount);
      // Capture when the live session started (from server or fallback to now)
      if (data.startedAt) {
        setLiveStartedAt(new Date(data.startedAt).getTime());
      } else {
        setLiveStartedAt((prev) => prev || Date.now());
      }
      setRoomReady(true);
    });

    socket.on("live:recent_messages", (data) => {
      console.log("LiveChat → Recent messages loaded:", data.messages?.length || 0);
      setMessages(data.messages || []);
    });

    socket.on("live:message", (msg) => {
      console.log("LiveChat → Message received:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("live:user_joined", (data) => {
      setParticipantCount(data.participantCount);
      setMessages((prev) => [...prev, {
        id: `join_${Date.now()}_${data.userId}`,
        type: "system",
        text: `${data.userName || "Someone"} joined`,
        timestamp: new Date().toISOString(),
      }]);
    });

    socket.on("live:user_left", (data) => {
      setParticipantCount(data.participantCount);
    });

    // Broadcast: a new live session started somewhere
    socket.on("live:session_started", (data) => {
      console.log("LiveChat → Session started broadcast:", data);
      // If this room was pending end (within 2s grace), cancel the end and reconnect
      if (data?.roomId && data.roomId === pendingEndRoomRef.current) {
        console.log("LiveChat → Session restarted within grace period, canceling end & reconnecting:", data.roomId);
        clearTimeout(pendingEndTimerRef.current);
        pendingEndRoomRef.current = null;
        pendingEndTimerRef.current = null;
        // Reconnect to the room directly
        const targetRoom = data.roomId;
        setMessages([]);
        setRoomReady(false);
        currentRoomRef.current = targetRoom;
        socket.emit("live:join_room", {
          roomId: targetRoom,
          userId,
          userName,
          userType: "audience",
        });
        return;
      }
      onSessionStartedRef.current?.(data);
    });

    // Broadcast: a live session ended somewhere
    socket.on("live:session_ended", (data) => {
      console.log("LiveChat → Session ended broadcast:", data);
      onSessionEndedRef.current?.(data);
    });

    socket.on("live:room_ended", (data) => {
      console.log("LiveChat → Room ended:", data);
      const endedRoom = data?.roomId;
      // Only process if the ended room is the one we're currently in
      if (!endedRoom || endedRoom === currentRoomRef.current) {
        // Add 2s grace period — if session_started fires for same room, cancel the end
        pendingEndRoomRef.current = endedRoom;
        pendingEndTimerRef.current = setTimeout(() => {
          pendingEndRoomRef.current = null;
          pendingEndTimerRef.current = null;
          // Only clear if we're still in the same room (not already switched)
          if (currentRoomRef.current === endedRoom || currentRoomRef.current === null) {
            setRoomReady(false);
            setMessages([]);
            setParticipantCount(0);
            setLiveStartedAt(null);
            currentRoomRef.current = null;
            clearViewerSession();
            onStreamEndedRef.current?.({ reason: data?.reason || "ended", endedAt: data?.endedAt, roomId: endedRoom });
          }
        }, 2000);
      } else {
        onStreamEndedRef.current?.({ reason: data?.reason || "ended", endedAt: data?.endedAt, roomId: endedRoom });
      }
    });

    socket.on("live:error", (data) => {
      console.warn("LiveChat → Error:", data.message);
      if (data.code === "ROOM_NOT_FOUND") {
        setRoomReady(false);
        currentRoomRef.current = null;
        onRoomNotFoundRef.current?.(roomId);
      } else if (data.code === "ROOM_ENDED") {
        const endedRoom = data?.roomId;
        if (!endedRoom || endedRoom === currentRoomRef.current) {
          setRoomReady(false);
          setMessages([]);
          setParticipantCount(0);
          setLiveStartedAt(null);
          currentRoomRef.current = null;
          clearViewerSession();
        }
        onStreamEndedRef.current?.({ reason: data.code, roomId: endedRoom });
      } else if (data.code === "CONTENT_BLOCKED") {
        Toast.error(data.message || "Message contains inappropriate content");
      } else if (data.code === "RATE_LIMITED") {
        Toast.error(data.message || "You're chatting too fast. Please wait a moment.");
      } else if (data.code === "BLOCKED") {
        // User is blocked from this live session
        setIsBlocked(true);
        Toast.error(data.message || "You are blocked from this live session");
      }
    });

    // Guest tried a restricted action — prompt login
    socket.on("live:auth_required", (data) => {
      console.log("LiveChat → Auth required:", data);
      Toast.error(data.message || "Please login to perform this action");
    });

    // Block events
    socket.on("live:blocked", (data) => {
      console.log("LiveChat → Blocked from live:", data);
      setIsBlocked(true);
      setRoomReady(false);
      setMessages([]);
      setParticipantCount(0);
      currentRoomRef.current = null;
      clearViewerSession();
      onBlockedRef.current?.(data);
    });

    socket.on("live:user_blocked", (data) => {
      console.log("LiveChat → User blocked confirmation:", data);
      onUserBlockedRef.current?.(data);
    });

    // Report events
    socket.on("live:report_submitted", (data) => {
      console.log("LiveChat → Report submitted:", data);
      onReportSubmittedRef.current?.(data);
    });

    // Private call status — attached directly to socket instance, no timing issues
    // Only update if the event is for the astrologer in the current room
    socket.on("live:astrologer_status", (data) => {
      const eventHostId = data?.hostId;
      const eventRoomId = data?.roomId;
      const isCurrentRoom = !eventRoomId || eventRoomId === currentRoomRef.current;
      if (data?.status === "on_private_call" && isCurrentRoom) {
        console.log("LiveChat → Private call started for current host");
        setIsOnPrivateCall(true);
        window.dispatchEvent(new CustomEvent("live:private_call_status", { detail: { isOnPrivateCall: true, hostId: eventHostId } }));
      } else if (data?.status === "private_call_ended" && isCurrentRoom) {
        console.log("LiveChat → Private call ended for current host");
        setIsOnPrivateCall(false);
        window.dispatchEvent(new CustomEvent("live:private_call_status", { detail: { isOnPrivateCall: false, hostId: eventHostId } }));
      }
    });

    return () => {
      if (skipChatCleanupRef.current) {
        console.log("LiveChat → Skipping cleanup (pending call)");
        return;
      }
      // Clear pending end timer
      if (pendingEndTimerRef.current) {
        clearTimeout(pendingEndTimerRef.current);
        pendingEndTimerRef.current = null;
        pendingEndRoomRef.current = null;
      }
      // Leave current room before disconnecting
      if (currentRoomRef.current) {
        socket.emit("live:leave_room", {
          roomId: currentRoomRef.current,
          userId,
          userName,
        });
      }
      socket.disconnect();
      socketRef.current = null;
      currentRoomRef.current = null;
      console.log("LiveChat → Cleanup done");
    };
  }, [userId, userName]);

  // 2. Astrologer status listener — separate effect so onAstrologerStatus updates don't reconnect socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (data) => {
      console.log("LiveChat → Astrologer status:", data);
      onAstrologerStatusRef.current?.(data);
    };

    socket.on("live:astrologer_status", handler);
    return () => socket.off("live:astrologer_status", handler);
  }, []);

  // 3. Room join/leave — reacts to roomId changes without reconnecting socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!roomId || !socket) return;

    const joinRoom = () => {
      // Leave previous room
      if (currentRoomRef.current && currentRoomRef.current !== roomId) {
        console.log("LiveChat → Leaving room:", currentRoomRef.current);
        socket.emit("live:leave_room", {
          roomId: currentRoomRef.current,
        });
      }

      // Join new room
      console.log("LiveChat → Joining room:", roomId);
      setMessages([]);
      setRoomReady(false);
      currentRoomRef.current = roomId;

      socket.emit("live:join_room", {
        roomId,
        userType: "audience",
      });
    };

    // Join immediately if already connected, otherwise wait for connect
    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
      if (skipChatCleanupRef.current) return;
      if (currentRoomRef.current === roomId && socket.connected) {
        socket.emit("live:leave_room", { roomId, userId, userName });
        currentRoomRef.current = null;
      }
    };
  }, [roomId, userId, userName]);

  // Retry joining the current room (e.g. after astrologer goes live)
  const retryJoinRoom = useCallback((overrideRoomId) => {
    const socket = socketRef.current;
    const targetRoom = overrideRoomId || roomId;
    if (!targetRoom || !socket?.connected) return;

    console.log("LiveChat → Retrying join for room:", targetRoom);
    setMessages([]);
    setRoomReady(false);
    currentRoomRef.current = targetRoom;

    socket.emit("live:join_room", {
      roomId: targetRoom,
      userId,
      userName,
      userType: "audience",
    });
  }, [roomId, userId, userName]);

  /*
    Every failure path here used to `return` after a single console.warn. The
    typed text stays in the box (it is only cleared after a successful emit), so
    from the viewer's side the send arrow simply did nothing — they retype, press
    again, and give up. A console warning is invisible on the phone or desktop of
    the person it concerns.

    Each reason now says so out loud, and the function reports success back to
    the caller. `isBlocked` is checked too: it was tracked and returned by this
    hook but consumed nowhere, so a blocked viewer saw a perfectly normal chat
    box and their messages were dropped server-side forever.
  */
  const sendChatMessage = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) {
      // No toast: the empty box is its own explanation.
      return false;
    }
    if (isBlocked) {
      Toast.error("You can't send messages in this live session.");
      return false;
    }
    if (!socketRef.current?.connected) {
      Toast.error("You're offline. Your message is still here — try again once you reconnect.");
      return false;
    }
    if (!currentRoomRef.current) {
      Toast.error("Still joining the live session. Give it a moment and send again.");
      return false;
    }

    const payload = {
      roomId: currentRoomRef.current,
      message: msg,
      type: "message",
    };
    console.log("LiveChat → Sending message:", payload);
    socketRef.current.emit("live:send_message", payload);

    // Only cleared on success, so a failed send never costs the user their text.
    setChatInput("");
    return true;
  }, [chatInput, userId, userName, isBlocked]);

  // Block a viewer (host only)
  const blockUser = useCallback((targetUserId, reason) => {
    if (!socketRef.current?.connected || !currentRoomRef.current) return;
    socketRef.current.emit("live:block_user", {
      roomId: currentRoomRef.current,
      userId: targetUserId,
      reason: reason || "",
    });
  }, []);

  // Report a user or host during live
  const reportUser = useCallback(({ targetUserId, targetAstrologerId, reasonId, description }) => {
    if (!socketRef.current?.connected || !currentRoomRef.current) return;
    socketRef.current.emit("live:report_user", {
      roomId: currentRoomRef.current,
      ...(targetUserId && { userId: targetUserId }),
      ...(targetAstrologerId && { astrologerId: targetAstrologerId }),
      reasonId,
      description: description || "",
    });
  }, []);

  return {
    messages,
    chatInput,
    setChatInput,
    sendChatMessage,
    participantCount,
    isConnected,
    roomReady,
    retryJoinRoom,
    liveStartedAt,
    socketRef,
    skipChatCleanupRef,
    isOnPrivateCall,
    blockUser,
    reportUser,
    isBlocked,
  };
};

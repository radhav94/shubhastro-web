import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";

const SOCKET_URL = import.meta.env.VITE_APP_API_BASE_URL;

export const useLiveChat = ({ roomId, userId, userName, onAstrologerStatus, onStreamEnded, onSessionStarted, onSessionEnded, onRoomNotFound }) => {
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  const [roomReady, setRoomReady] = useState(false);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // 1. Socket connection — stays alive independent of roomId
  useEffect(() => {
    if (!userId) {
      console.warn("LiveChat → Skipped: missing userId");
      return;
    }

    console.log("LiveChat → Connecting to", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      query: { role: "CUSTOMER", userId },
      auth: { role: "CUSTOMER", userId },
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
          userId,
          userName,
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
    });

    socket.on("live:user_left", (data) => {
      setParticipantCount(data.participantCount);
    });

    // Broadcast: a new live session started somewhere
    socket.on("live:session_started", (data) => {
      console.log("LiveChat → Session started broadcast:", data);
      onSessionStarted?.(data);
    });

    // Broadcast: a live session ended somewhere
    socket.on("live:session_ended", (data) => {
      console.log("LiveChat → Session ended broadcast:", data);
      onSessionEnded?.(data);
    });

    socket.on("live:room_ended", (data) => {
      console.log("LiveChat → Room ended:", data);
      const endedRoom = data?.roomId;
      // Only clear state if the ended room is the one we're currently in.
      // If we already switched to another room (e.g. via astrologer_status),
      // don't nuke the new room's connection.
      if (!endedRoom || endedRoom === currentRoomRef.current) {
        setRoomReady(false);
        setMessages([]);
        setParticipantCount(0);
        currentRoomRef.current = null;
        clearViewerSession();
      }
      onStreamEnded?.({ reason: data?.reason || "ended", endedAt: data?.endedAt, roomId: endedRoom });
    });

    socket.on("live:error", (data) => {
      console.warn("LiveChat → Error:", data.message);
      if (data.code === "ROOM_NOT_FOUND") {
        // Room doesn't exist yet — astrologer hasn't created it.
        // Notify container to re-check live list from API.
        setRoomReady(false);
        currentRoomRef.current = null;
        onRoomNotFound?.(roomId);
      } else if (data.code === "ROOM_ENDED") {
        const endedRoom = data?.roomId;
        if (!endedRoom || endedRoom === currentRoomRef.current) {
          setRoomReady(false);
          setMessages([]);
          setParticipantCount(0);
          currentRoomRef.current = null;
          clearViewerSession();
        }
        onStreamEnded?.({ reason: data.code, roomId: endedRoom });
      }
    });

    return () => {
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
      onAstrologerStatus?.(data);
    };

    socket.on("live:astrologer_status", handler);
    return () => socket.off("live:astrologer_status", handler);
  }, [onAstrologerStatus]);

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
          userId,
          userName,
        });
      }

      // Join new room
      console.log("LiveChat → Joining room:", roomId);
      setMessages([]);
      setRoomReady(false);
      currentRoomRef.current = roomId;

      socket.emit("live:join_room", {
        roomId,
        userId,
        userName,
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

  const sendChatMessage = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) {
      console.warn("LiveChat → Send skipped: empty message");
      return;
    }
    if (!socketRef.current?.connected) {
      console.warn("LiveChat → Send skipped: socket not connected");
      return;
    }
    if (!currentRoomRef.current) {
      console.warn("LiveChat → Send skipped: not in a room");
      return;
    }

    const payload = {
      roomId: currentRoomRef.current,
      userId,
      userName,
      message: msg,
      userType: "audience",
    };
    console.log("LiveChat → Sending message:", payload);
    socketRef.current.emit("live:send_message", payload);

    setChatInput("");
  }, [chatInput, userId, userName]);

  return {
    messages,
    chatInput,
    setChatInput,
    sendChatMessage,
    participantCount,
    isConnected,
    roomReady,
    retryJoinRoom,
  };
};

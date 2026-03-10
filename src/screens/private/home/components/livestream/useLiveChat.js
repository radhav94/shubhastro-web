import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { clearViewerSession } from "../../../../../utils/liveSessionStorage";

const SOCKET_URL = import.meta.env.VITE_APP_API_BASE_URL;

export const useLiveChat = ({ roomId, userId, userName, onAstrologerStatus, onStreamEnded }) => {
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);

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

    socket.on("live:room_ended", (data) => {
      console.log("LiveChat → Session ended:", data);
      clearViewerSession();
      onStreamEnded?.({ reason: data?.reason || "ended" });
    });

    socket.on("live:error", (data) => {
      console.error("LiveChat → Error:", data.message);
      if (data.code === "ROOM_NOT_FOUND" || data.code === "ROOM_ENDED") {
        clearViewerSession();
        onStreamEnded?.({ reason: data.code });
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
  };
};

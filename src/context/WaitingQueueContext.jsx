import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { voiceSocket } from "../services/voiceSocketServices";
import { useCall } from "./CallContext";
import { useChat } from "./ChatContext";

const WaitingQueueContext = createContext();

// LocalStorage key for persistence
const QUEUE_STORAGE_KEY = "shubhtalk_waiting_queue";
const QUEUE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

/**
 * Each pending connection in the queue:
 * {
 *   id: string,           // unique id (roomId from server)
 *   astrologer: object,   // astrologer data { _id, firstName, lastName, profileImage, ... }
 *   type: "chat" | "audio" | "video",
 *   roomId: string,
 *   waitingTime: number,  // approx minutes
 *   timestamp: number,    // Date.now() when added
 *   isEmergency: boolean,
 *   status: "ringing" | "waiting" | "astrologer_accepted" | "on_hold" | "on-going" | null,
 *   sessionId: string,    // session ID from server
 * }
 */

export const WaitingQueueProvider = ({ children }) => {
  const [pendingConnections, setPendingConnections] = useState(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const now = Date.now();
      // Filter out expired entries
      return parsed.filter((c) => now - c.timestamp < QUEUE_MAX_AGE);
    } catch {
      return [];
    }
  });

  const pendingConnectionsRef = useRef(pendingConnections);
  pendingConnectionsRef.current = pendingConnections;

  const persist = useCallback((connections) => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(connections));
    } catch { /* ignore */ }
  }, []);

  const addPendingConnection = useCallback((connection) => {
    setPendingConnections((prev) => {
      // Don't add duplicate by astrologer+type
      const exists = prev.some(
        (c) => c.astrologer?._id === connection.astrologer?._id && c.type === connection.type
      );
      if (exists) return prev;
      const next = [...prev, { ...connection, timestamp: Date.now() }];
      persist(next);
      return next;
    });
  }, [persist]);

  // Update a pending connection (e.g., when roomId arrives from server)
  const updatePendingConnection = useCallback((astrologerId, type, updates) => {
    setPendingConnections((prev) => {
      const next = prev.map((c) => {
        if (c.astrologer?._id === astrologerId && c.type === type) {
          return { ...c, ...updates };
        }
        return c;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  // Assign roomId to a pending connection that doesn't have one yet
  const assignRoomId = useCallback((roomId, type, waitingTime) => {
    setPendingConnections((prev) => {
      // Find the first pending connection of this type without a roomId
      const idx = prev.findIndex((c) => {
        const cType = c.type === "chat" ? "chat" : c.type;
        const matchType = type === "chat" ? "chat" : type;
        return cType === matchType && !c.roomId;
      });
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], roomId, id: roomId, waitingTime: waitingTime || next[idx].waitingTime };
      persist(next);
      return next;
    });
  }, [persist]);

  const removePendingConnection = useCallback((roomId) => {
    setPendingConnections((prev) => {
      const next = prev.filter((c) => c.roomId !== roomId);
      persist(next);
      return next;
    });
  }, [persist]);

  const removePendingByAstrologer = useCallback((astrologerId) => {
    setPendingConnections((prev) => {
      const next = prev.filter((c) => c.astrologer?._id !== astrologerId);
      persist(next);
      return next;
    });
  }, [persist]);

  // Cancel and remove a specific pending connection
  const cancelPendingConnection = useCallback((roomId, type, astrologerId) => {
    if (roomId) {
      const conn = pendingConnectionsRef.current.find((c) => c.roomId === roomId);
      if (conn?.status === "on_hold") {
        const eventName = type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
        voiceSocket.emit(eventName, { roomId });
      } else if (conn?.status === "astrologer_accepted") {
        const eventName = type === "chat" ? "chat:user_reject" : "call:user_reject";
        voiceSocket.emit(eventName, { roomId });
      } else {
        const eventName = type === "chat" ? "chat:cancel" : "call:cancel";
        voiceSocket.emit(eventName, { roomId, canceledBy: "CUSTOMER" });
      }
      removePendingConnection(roomId);
    } else if (astrologerId) {
      removePendingByAstrologer(astrologerId);
    }
  }, [removePendingConnection, removePendingByAstrologer]);

  // Cancel ALL pending connections except the accepted one
  const cancelAllExcept = useCallback((acceptedRoomId) => {
    const current = pendingConnectionsRef.current;
    current.forEach((c) => {
      if (c.roomId && c.roomId !== acceptedRoomId) {
        if (c.status === "on_hold") {
          const eventName = c.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else if (c.status === "astrologer_accepted") {
          const eventName = c.type === "chat" ? "chat:user_reject" : "call:user_reject";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else {
          const eventName = c.type === "chat" ? "chat:cancel" : "call:cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId, canceledBy: "CUSTOMER" });
        }
      }
    });
    setPendingConnections([]);
    persist([]);
    localStorage.removeItem("waitingState");
  }, [persist]);

  // Cancel all pending connections
  const cancelAll = useCallback(() => {
    const current = pendingConnectionsRef.current;
    current.forEach((c) => {
      if (c.roomId) {
        if (c.status === "on_hold") {
          const eventName = c.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else if (c.status === "astrologer_accepted") {
          const eventName = c.type === "chat" ? "chat:user_reject" : "call:user_reject";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else {
          const eventName = c.type === "chat" ? "chat:cancel" : "call:cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId, canceledBy: "CUSTOMER" });
        }
      }
    });
    setPendingConnections([]);
    persist([]);
    localStorage.removeItem("waitingState");
  }, [persist]);

  // Check if a specific astrologer+type is already in the queue
  const isInQueue = useCallback((astrologerId, type) => {
    return pendingConnectionsRef.current.some(
      (c) => c.astrologer?._id === astrologerId && c.type === type
    );
  }, []);

  // Update status of a pending connection by roomId
  const updateStatusByRoomId = useCallback((roomId, status, extraData = {}) => {
    setPendingConnections((prev) => {
      const next = prev.map((c) => {
        if (c.roomId === roomId) {
          return { ...c, status, ...extraData };
        }
        return c;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  // Get a pending connection by roomId
  const getConnectionByRoomId = useCallback((roomId) => {
    return pendingConnectionsRef.current.find((c) => c.roomId === roomId) || null;
  }, []);

  // Get a pending connection by astrologerId
  const getConnectionByAstrologerId = useCallback((astrologerId) => {
    return pendingConnectionsRef.current.find((c) => c.astrologer?._id === astrologerId) || null;
  }, []);

  const hasAnyPending = pendingConnections.length > 0;

  /* ================= GLOBAL TWO-WAY ACCEPT LISTENERS ================= */
  // These run at app level so events are handled regardless of which page the user is on
  const { setCallApprovalData, callApprovalData } = useCall();
  const { setChatApprovalData, chatApprovalData } = useChat();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  useEffect(() => {
    if (!userIdLocal) return;

    const handleCallAstrologerAccepted = (data) => {
      console.log("[GlobalTwoWay] 📥 call:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;
      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });
      setCallApprovalData({ roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency });
    };

    const handleChatAstrologerAccepted = (data) => {
      console.log("[GlobalTwoWay] 📥 chat:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;
      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });
      setChatApprovalData({ roomId, sessionId, astrologerId, astrologerDetail, type: type || "chat", isEmergency });
    };

    const handleCallOnHold = (data) => {
      console.log("[GlobalTwoWay] ⏸️ call:on_hold", JSON.stringify(data));
      const { roomId } = data;
      if (callApprovalData?.roomId === roomId) setCallApprovalData(null);
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
    };

    const handleChatOnHold = (data) => {
      console.log("[GlobalTwoWay] ⏸️ chat:on_hold", JSON.stringify(data));
      const { roomId } = data;
      if (chatApprovalData?.roomId === roomId) setChatApprovalData(null);
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
    };

    const handleCallUnavailable = (data) => {
      const { roomId } = data;
      if (roomId) removePendingConnection(roomId);
      if (callApprovalData?.roomId === roomId) setCallApprovalData(null);
    };

    const handleChatUnavailable = (data) => {
      const { roomId } = data;
      if (roomId) removePendingConnection(roomId);
      if (chatApprovalData?.roomId === roomId) setChatApprovalData(null);
    };

    const handleCanceled = (data) => {
      const canceledRoomId = data?.roomId || data?.sessionData?.roomId;
      if (canceledRoomId) {
        removePendingConnection(canceledRoomId);
        if (callApprovalData?.roomId === canceledRoomId) setCallApprovalData(null);
        if (chatApprovalData?.roomId === canceledRoomId) setChatApprovalData(null);
      }
    };

    const handleRejected = (data) => {
      if (data?.switchRejected) return;
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
        if (callApprovalData?.roomId === rejectedRoomId) setCallApprovalData(null);
        if (chatApprovalData?.roomId === rejectedRoomId) setChatApprovalData(null);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }
    };

    const handleActivity = (data) => {
      if (data?.status === "ringing" && data?.roomId) {
        updateStatusByRoomId(data.roomId, "ringing");
        return;
      }

      // Dynamic wait time update — propagate new fields to pending connection
      if (data?.waitingTime !== undefined || data?.position !== undefined) {
        setPendingConnections((prev) => {
          let updated;
          // If roomId is present, update that specific entry
          if (data.roomId) {
            updated = prev.map((c) =>
              c.roomId === data.roomId
                ? { ...c, waitingTime: data.waitingTime, minWait: data.minWait, maxWait: data.maxWait, confidence: data.confidence, position: data.position }
                : c
            );
          } else {
            // No roomId — update all waiting entries (broadcast scenario)
            updated = prev.map((c) => {
              if (["ringing", "astrologer_accepted", "on_hold", "on-going"].includes(c.status)) return c;
              return { ...c, waitingTime: data.waitingTime, minWait: data.minWait, maxWait: data.maxWait, confidence: data.confidence, position: data.position };
            });
          }
          persist(updated);
          return updated;
        });
      }
    };

    // session:active_list — server sends all active sessions on connect/reconnect
    const handleActiveList = (data) => {
      console.log("[GlobalTwoWay] 📋 session:active_list", JSON.stringify(data));
      const sessions = data?.sessions || [];
      if (!sessions.length) return;

      // Sync pending connections with server state
      setPendingConnections((prev) => {
        const now = Date.now();
        const merged = [...prev];

        sessions.forEach((session) => {
          const { roomId, status, type, astrologerId } = session;
          // Skip on-going sessions — those are handled by CallContext/ChatContext reconnect
          if (status === "on-going") return;

          const existingIdx = merged.findIndex((c) => c.roomId === roomId);
          if (existingIdx !== -1) {
            // Update status of existing entry
            merged[existingIdx] = { ...merged[existingIdx], status };
          } else {
            // Add new entry from server
            const astro = typeof astrologerId === "object" ? astrologerId : { _id: astrologerId };
            merged.push({
              id: roomId,
              astrologer: astro,
              type: type || "chat",
              roomId,
              waitingTime: 5,
              timestamp: now,
              isEmergency: session.isEmergency || false,
              status: status || "ringing",
              sessionId: session.sessionId || session._id,
            });
          }
        });

        persist(merged);
        return merged;
      });

      // If any session is astrologer_accepted, set approval data
      sessions.forEach((session) => {
        if (session.status === "astrologer_accepted") {
          const astro = typeof session.astrologerId === "object" ? session.astrologerId : null;
          const ringData = {
            roomId: session.roomId,
            sessionId: session.sessionId || session._id,
            astrologerId: astro?._id || session.astrologerId,
            astrologerDetail: astro,
            type: session.type,
            isEmergency: session.isEmergency || false,
          };
          if (session.type === "chat") {
            setChatApprovalData(ringData);
          } else {
            setCallApprovalData(ringData);
          }
        }
      });
    };

    voiceSocket.on("call:astrologer_accepted", handleCallAstrologerAccepted);
    voiceSocket.on("chat:astrologer_accepted", handleChatAstrologerAccepted);
    voiceSocket.on("call:on_hold", handleCallOnHold);
    voiceSocket.on("chat:on_hold", handleChatOnHold);
    voiceSocket.on("call:ring_timeout", handleCallOnHold);
    voiceSocket.on("chat:ring_timeout", handleChatOnHold);
    voiceSocket.on("call:unavailable", handleCallUnavailable);
    voiceSocket.on("chat:unavailable", handleChatUnavailable);
    voiceSocket.on("call:canceled", handleCanceled);
    voiceSocket.on("chat:canceled", handleCanceled);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("session:active_list", handleActiveList);

    return () => {
      voiceSocket.off("call:astrologer_accepted", handleCallAstrologerAccepted);
      voiceSocket.off("chat:astrologer_accepted", handleChatAstrologerAccepted);
      voiceSocket.off("call:on_hold", handleCallOnHold);
      voiceSocket.off("chat:on_hold", handleChatOnHold);
      voiceSocket.off("call:ring_timeout", handleCallOnHold);
      voiceSocket.off("chat:ring_timeout", handleChatOnHold);
      voiceSocket.off("call:unavailable", handleCallUnavailable);
      voiceSocket.off("chat:unavailable", handleChatUnavailable);
      voiceSocket.off("call:canceled", handleCanceled);
      voiceSocket.off("chat:canceled", handleCanceled);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("session:active_list", handleActiveList);
    };
  }, [userIdLocal]);

  return (
    <WaitingQueueContext.Provider
      value={{
        pendingConnections,
        addPendingConnection,
        updatePendingConnection,
        assignRoomId,
        removePendingConnection,
        removePendingByAstrologer,
        cancelPendingConnection,
        cancelAllExcept,
        cancelAll,
        isInQueue,
        hasAnyPending,
        updateStatusByRoomId,
        getConnectionByRoomId,
        getConnectionByAstrologerId,
      }}
    >
      {children}
    </WaitingQueueContext.Provider>
  );
};

export const useWaitingQueue = () => {
  const context = useContext(WaitingQueueContext);
  if (!context) {
    throw new Error("useWaitingQueue must be used within a WaitingQueueProvider");
  }
  return context;
};

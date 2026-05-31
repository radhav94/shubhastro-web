import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useChat } from "../../../../context/ChatContext";
import { useCall } from "../../../../context/CallContext";
import { useWaitingQueue } from "../../../../context/WaitingQueueContext";
import { Toast } from "../../../../component";
import { isPanditAIChatActive, isPanditAIEvent } from "../../../../component/panditAI/usePanditAI";

export const useAstrologerConnection = (externalAstroRef = null, selectedKundli) => {
  const navigate = useNavigate();
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [localSelectedProfile, setLocalSelectedProfile] = useState(selectedKundli);

  // Note: activeAstroRef kept for backward compat with callers using setSelectedAstrologer,
  // but accepted handlers now use astrologer data from the socket event payload directly.
  const activeAstroRef = useRef(null);
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  const {
    waitingList: WaitingList,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setActiveChat,
    setChatSeconds,
  } = useChat();

  const {
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    resetCallFlow,
    setActiveCallRoomId,
    setActiveCall,
    activeCall,
    pendingLiveCall,
  } = useCall();

  const {
    pendingConnections,
    assignRoomId,
    removePendingConnection,
    removePendingByAstrologer,
    cancelAllExcept,
    cancelAll,
  } = useWaitingQueue();

  const pendingLiveCallRef = useRef(null);
  useEffect(() => { pendingLiveCallRef.current = pendingLiveCall; }, [pendingLiveCall]);

  // Keep a ref of pendingConnections for use in socket handlers
  const pendingConnectionsRef = useRef(pendingConnections);
  useEffect(() => { pendingConnectionsRef.current = pendingConnections; }, [pendingConnections]);

  // Restore waiting state from localStorage on mount
  useEffect(() => {
    const savedWaitingState = localStorage.getItem("waitingState");
    if (savedWaitingState) {
      try {
        const { roomId, type, timestamp } = JSON.parse(savedWaitingState);
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        if (now - timestamp < maxAge) {
          setConnectionType(type);
          if (type === "chat") {
            setChatRoomId(roomId);
            setWaitingList(2);
          } else {
            setCallRoomId(roomId);
            setCallWaitingList(5);
          }

          if (!voiceSocket.connected && userIdLocal) {
            voiceSocket.io.opts.query = {
              userId: userIdLocal,
              role: "CUSTOMER",
            };
            voiceSocket.connect();
          }
        } else {
          localStorage.removeItem("waitingState");
        }
      } catch (error) {
        console.error("Error restoring waiting state:", error);
        localStorage.removeItem("waitingState");
      }
    }
  }, [userIdLocal, setWaitingList, setCallWaitingList]);

  useEffect(() => {
    setLocalSelectedProfile(selectedKundli)
  }, [selectedKundli])

  // Socket event handlers
  useEffect(() => {
    if (!userIdLocal) return;

    const handleChatRoom = (data) => {
      // Skip Pandit AI — handled by PanditAIBubble
      if (isPanditAIChatActive() || isPanditAIEvent(data)) return;

      console.log("[NormalFlow] 📥 chat:room received — server created chat room");
      console.log("[NormalFlow]   → roomId:", data?.roomId);
      console.log("[NormalFlow]   → waitingTime:", data?.waitingTime);
      console.log("[NormalFlow]   → full data:", JSON.stringify(data));
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");

      // Assign roomId to the pending queue entry
      assignRoomId(data?.roomId, "chat", data?.waitingTime || 2);

      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: "chat",
          timestamp: Date.now(),
        })
      );
      console.log("[NormalFlow] ✅ Chat waiting state set, waitingTime:", data?.waitingTime || 2);
    };

    const handleCallRoom = (data) => {
      console.log("[NormalFlow] 📥 call:room received — server created call room");
      console.log("[NormalFlow]   → roomId:", data?.roomId);
      console.log("[NormalFlow]   → type:", data?.type);
      console.log("[NormalFlow]   → waitingTime:", data?.waitingTime);
      console.log("[NormalFlow]   → full data:", JSON.stringify(data));
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setConnectionType(data?.type || "audio");

      // Assign roomId to the pending queue entry
      assignRoomId(data?.roomId, data?.type || "audio", data?.waitingTime || 5);

      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: data?.type || "audio",
          timestamp: Date.now(),
        })
      );
      console.log("[NormalFlow] ✅ Call waiting state set, waitingTime:", data?.waitingTime || 5);
    };

    const handleChatAccepted = async ({
      roomId,
      astrologerId,
      userId,
      ...data
    }) => {
      // Skip Pandit AI — handled by PanditAIBubble
      if (isPanditAIChatActive() || isPanditAIEvent({ roomId, astrologerId, userId, ...data })) return;

      console.log("[NormalFlow] ✅ chat:accepted received — astrologer accepted chat");
      console.log("[NormalFlow]   → roomId:", roomId);
      console.log("[NormalFlow]   → astrologerId:", astrologerId);
      console.log("[NormalFlow]   → remainingTime:", data?.remainingTime);
      setWaitingList(false);
      localStorage.removeItem("waitingState");

      // Cancel all other pending connections — this one was accepted
      removePendingConnection(roomId);

      // Use astrologer data from event payload directly
      const astro = data?.astrologer || {};
      const kundliId = localSelectedProfile;
      console.log("[NormalFlow]   → astro from payload:", astro?._id, astro?.firstName);
      console.log("[NormalFlow]   → kundliId:", kundliId);

      try {
        if (!roomId) throw new Error("Room ID missing");

        const astroName = `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim();

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: astroName || "Astrologer",
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: astro?.firstName || "",
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);
        console.log("[NormalFlow] ✅ activeChat set, navigating to chat page");

        navigate(`/chat-to-astrologer/${astrologerId}`, {
          state: {
            userId: userIdLocal,
            astrologerId,
            fullName: astroName,
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: astro?.firstName || "",
            astroID: astro?.astrologer_ID,
            experience: astro?.experience,
          },
        });
      } catch (e) {
        console.error("[NormalFlow] ❌ Chat accepted error:", e);
        Toast.error("Failed to start chat");
      }
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      channelName,
      type,
      remainingTime,
      astrologerId,
      isSwitch,
      ...rest
    }) => {
      // If there's a pending live call, let CallContext handle it
      if (pendingLiveCallRef.current) {
        console.log("[NormalFlow] ⏭️ Skipping — pending live call exists, CallContext will handle");
        return;
      }
      console.log("[NormalFlow] ✅ call:accepted received");
      console.log("[NormalFlow]   → roomId:", roomId);
      console.log("[NormalFlow]   → type:", type);
      console.log("[NormalFlow]   → remainingTime:", remainingTime);
      console.log("[NormalFlow]   → astrologerId:", astrologerId);
      console.log("[NormalFlow]   → isSwitch:", isSwitch);

      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("[NormalFlow] 🔄 Video upgrade accepted — CallContext will handle the switch");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("[NormalFlow] 🔄 Audio downgrade accepted — CallContext will handle the switch");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      localStorage.removeItem("waitingState");

      // Cancel all other pending connections — this one was accepted
      removePendingConnection(roomId);

      // Use astrologer data from event payload directly
      const astro = rest?.astrologer || {};
      const kundliId = localSelectedProfile;
      console.log("[NormalFlow]   → astro from payload:", astro?._id, astro?.firstName);
      console.log("[NormalFlow]   → kundliId:", kundliId);

      try {
        // Use astrologerId from socket response as primary, fallback to astro._id
        const astroId = astrologerId || astro?._id;
        
        if (!astroId) {
          console.error("[NormalFlow] ❌ Astrologer ID missing");
          Toast.error("Astrologer ID missing");
          return;
        }

        const astroName = `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim();

        const callPayload = {
          roomId,
          channelName,
          agoraToken: token,
          callerName: astroName || "Astrologer",
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astroId,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
          experience: astro?.experience,
          isEmergency: rest?.isEmergency || false,
        };
        console.log("[NormalFlow] 📦 Setting activeCall:", JSON.stringify({ ...callPayload, agoraToken: "[redacted]" }));
        setActiveCall(callPayload);
        
        console.log("[NormalFlow] ✅ Active call set successfully — VoiceCall/VideoCall component should render");
      } catch (error) {
        console.error("[NormalFlow] ❌ Call accepted error:", error);
        Toast.error(error.message || "Failed to start call");
      }
    };

    const handleRejected = (data) => {
      console.log("[NormalFlow] ❌ call:rejected / chat:rejected received");
      console.log("[NormalFlow]   → switchRejected:", data?.switchRejected);
      console.log("[NormalFlow]   → type:", data?.type);

      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("[NormalFlow] 🔄 Call switch rejected — current call continues");
        return;
      }

      // Extract roomId and astrologerId — can be at top level or inside sessionData
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      console.log("[NormalFlow]   → rejectedRoomId:", rejectedRoomId);
      console.log("[NormalFlow]   → rejectedAstrologerId:", rejectedAstrologerId);

      // Remove from the queue by roomId first, fallback to astrologerId
      if (rejectedRoomId) {
        removePendingConnection(rejectedRoomId);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }

      // Check if there are still other pending connections
      const remaining = pendingConnectionsRef.current.filter(
        (c) => c.roomId !== rejectedRoomId && c.astrologer?._id !== rejectedAstrologerId
      );

      if (remaining.length > 0) {
        // Still have other pending connections — just show a toast for this one
        const label = data?.type === "chat" ? "chat" : "call";
        Toast.error(`Astrologer rejected the ${label} request`);
        console.log("[NormalFlow] 📋 Still have", remaining.length, "pending connections");
      } else {
        // No more pending connections — full reset
        const errorMsg =
          data?.sessionData?.sessionEndReason === "rejected" &&
          data?.type === "chat"
            ? "Astrologer has rejected the chat request"
            : "Astrologer has rejected the call request";
        Toast.error(errorMsg);

        localStorage.removeItem("waitingState");
        resetChatFlow();
        resetCallFlow();
        setConnectionType(null);
      }
    };

    const handleSocketError = (err) => {
      console.log("[NormalFlow] ⚠️ Socket error event received");
      console.log("[NormalFlow]   → message:", err?.message);
      Toast.error(err?.message || "Connection error");
      localStorage.removeItem("waitingState");
      resetChatFlow();
      resetCallFlow();
      cancelAll();
      setConnectionType(null);
    };

    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("error", handleSocketError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("error", handleSocketError);
    };
  }, [
    userIdLocal,
    navigate,
    resetChatFlow,
    resetCallFlow,
    setWaitingList,
    setCallWaitingList,
    setActiveChatRoomId,
    setActiveCallRoomId,
    localSelectedProfile,
    setActiveChat,
    setChatSeconds,
    setActiveCall,
    assignRoomId,
    removePendingConnection,
    removePendingByAstrologer,
    cancelAllExcept,
    cancelAll,
  ]);

  const resetCallState = () => {
    if (connectionType === "chat" && chatRoomId) {
      voiceSocket.emit("chat:cancel", { roomId: chatRoomId });
    } else if (
      (connectionType === "audio" || connectionType === "video") &&
      callRoomId
    ) {
      voiceSocket.emit("call:cancel", { roomId: callRoomId });
    }

    setWaitingList(false);
    setCallWaitingList(false);
    setCallRoomId(null);
    setChatRoomId(null);
    setConnectionType(null);
    localStorage.removeItem("waitingState");
    resetChatFlow();
    resetCallFlow();
    cancelAll();
  };

  const setSelectedAstrologer = (astrologer) => {
    activeAstroRef.current = astrologer;
  };

  return {
    WaitingList,
    callWaitingList,
    connectionType,
    localSelectedProfile,
    setLocalSelectedProfile,
    resetCallState,
    setSelectedAstrologer,
  };
};

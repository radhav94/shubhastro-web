import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useChat } from "../../../../context/ChatContext";
import { useCall } from "../../../../context/CallContext";
import { Toast } from "../../../../component";

export const useAstrologerConnection = (externalAstroRef = null, selectedKundli) => {
  const navigate = useNavigate();
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [localSelectedProfile, setLocalSelectedProfile] = useState(selectedKundli);

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
  } = useCall();


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
      console.log("[NormalFlow] 📥 chat:room received — server created chat room");
      console.log("[NormalFlow]   → roomId:", data?.roomId);
      console.log("[NormalFlow]   → waitingTime:", data?.waitingTime);
      console.log("[NormalFlow]   → full data:", JSON.stringify(data));
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");

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
      console.log("[NormalFlow] ✅ chat:accepted received — astrologer accepted chat");
      console.log("[NormalFlow]   → roomId:", roomId);
      console.log("[NormalFlow]   → astrologerId:", astrologerId);
      console.log("[NormalFlow]   → remainingTime:", data?.remainingTime);
      console.log("[NormalFlow]   → full data:", JSON.stringify({ roomId, astrologerId, userId, ...data }));
      setWaitingList(false);
      localStorage.removeItem("waitingState");

      // Use external ref if provided, otherwise use local ref
      const astro = externalAstroRef?.current || activeAstroRef.current;
      const kundliId = localSelectedProfile;
      console.log("[NormalFlow]   → astro from ref:", astro?._id, astro?.firstName);
      console.log("[NormalFlow]   → kundliId:", kundliId);

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
          isEmergency: data?.isEmergency || false,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);
        console.log("[NormalFlow] ✅ activeChat set, navigating to chat page");

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userIdLocal,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
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
      type,
      remainingTime,
      astrologerId,
      isSwitch,
      ...rest
    }) => {
      console.log("[NormalFlow] ✅ call:accepted received");
      console.log("[NormalFlow]   → roomId:", roomId);
      console.log("[NormalFlow]   → type:", type);
      console.log("[NormalFlow]   → remainingTime:", remainingTime);
      console.log("[NormalFlow]   → astrologerId:", astrologerId);
      console.log("[NormalFlow]   → isSwitch:", isSwitch);
      console.log("[NormalFlow]   → agoraToken:", token ? "present (" + token.substring(0, 20) + "...)" : "MISSING");
      console.log("[NormalFlow]   → full data:", JSON.stringify({ roomId, token: token ? "[redacted]" : null, type, remainingTime, astrologerId, isSwitch, ...rest }));

      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("[NormalFlow] 🔄 Video upgrade accepted — CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("[NormalFlow] 🔄 Audio downgrade accepted — CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();
      localStorage.removeItem("waitingState");

      // Use external ref if provided, otherwise use local ref
      const astro = externalAstroRef?.current || activeAstroRef.current;

      const kundliId = localSelectedProfile;
      console.log("[NormalFlow]   → astro from ref:",astro, astro?._id, astro?.firstName);
      console.log("[NormalFlow]   → kundliId:", kundliId);

      try {
        if (!astro) {
          console.error("[NormalFlow] ❌ Astrologer data missing in ref");
          Toast.error("Astrologer data missing");
          return;
        }

        // Use astrologerId from socket response as primary, fallback to astro._id
        const astroId = astrologerId || astro._id;
        
        if (!astroId) {
          console.error("[NormalFlow] ❌ Astrologer ID missing");
          Toast.error("Astrologer ID missing");
          return;
        }

        const callPayload = {
          roomId,
          agoraToken: token,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astroId,
          kundliId,
          astrologerID: astro?.astrologerID,
          remainingTime,
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
      console.log("[NormalFlow]   → sessionEndReason:", data?.sessionData?.sessionEndReason);
      console.log("[NormalFlow]   → message:", data?.message);
      console.log("[NormalFlow]   → full data:", JSON.stringify(data));

      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("[NormalFlow] 🔄 Call switch rejected — current call continues");
        // Don't reset anything - the current call should continue
        return;
      }
      
      // Regular call rejection - end everything
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected" &&
        data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      console.log("[NormalFlow] 🛑 Showing error:", errorMsg);
      Toast.error(errorMsg);

      localStorage.removeItem("waitingState");
      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    const handleSocketError = (err) => {
      console.log("[NormalFlow] ⚠️ Socket error event received");
      console.log("[NormalFlow]   → message:", err?.message);
      console.log("[NormalFlow]   → full data:", JSON.stringify(err));
      Toast.error(err?.message || "Connection error");
      localStorage.removeItem("waitingState");
      resetChatFlow();
      resetCallFlow();
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

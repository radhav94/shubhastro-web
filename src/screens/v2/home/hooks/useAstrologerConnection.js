import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { useChat } from "../../../../context/ChatContext";
import { useCall } from "../../../../context/CallContext";
import { Toast } from "../../../../component";

export const useAstrologerConnection = (externalAstroRef = null) => {
  const navigate = useNavigate();
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [localSelectedProfile, setLocalSelectedProfile] = useState(null);

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

  // Socket event handlers
  useEffect(() => {
    if (!userIdLocal) return;

    const handleChatRoom = (data) => {
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
    };

    const handleCallRoom = (data) => {
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
    };

    const handleChatAccepted = async ({
      roomId,
      astrologerId,
      userId,
      ...data
    }) => {
      setWaitingList(false);
      localStorage.removeItem("waitingState");

      // Use external ref if provided, otherwise use local ref
      const astro = externalAstroRef?.current || activeAstroRef.current;
      const kundliId = localSelectedProfile?._id;

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: astro?.firstName || "",
          isUserSide: true,
          userId: userIdLocal,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userIdLocal,
            astrologerId,
            fullName: astro?.firstName || "",
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
          },
        });
      } catch (e) {
        console.error("Chat accepted error:", e);
        Toast.error("Failed to start chat");
      }
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      type,
      remainingTime,
      astrologerId,
      ...rest
    }) => {
      resetCallFlow();
      localStorage.removeItem("waitingState");

      // Use external ref if provided, otherwise use local ref
      const astro = externalAstroRef?.current || activeAstroRef.current;
      const kundliId = localSelectedProfile?._id;

      console.log("🔍 Call Accepted - Full Socket Data:", {
        roomId,
        token,
        type,
        remainingTime,
        astrologerId,
        ...rest
      });
      console.log("External Ref:", externalAstroRef?.current);
      console.log("Astro from ref:", astro);

      try {
        if (!astro) {
          console.error("❌ Astrologer data missing in ref");
          Toast.error("Astrologer data missing");
          return;
        }

        // Use astrologerId from socket response as primary, fallback to astro._id
        const astroId = astrologerId || astro._id;
        
        if (!astroId) {
          console.error("❌ Astrologer ID missing");
          Toast.error("Astrologer ID missing");
          return;
        }


        setActiveCall({
          roomId,
          agoraToken: token,
          callerName: astro?.firstName || "",
          isUserSide: true,
          callType: type,
          userId: userIdLocal,
          astrologerId: astroId,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
        });
        
        console.log("✅ Active call set successfully");
      } catch (error) {
        console.error("Call accepted error:", error);
        Toast.error(error.message || "Failed to start call");
      }
    };

    const handleRejected = (data) => {
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
    };

    const handleSocketError = (err) => {
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

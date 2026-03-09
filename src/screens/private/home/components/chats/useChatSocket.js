import { useEffect, useState } from "react";
import { Toast } from "../../../../../component";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { useChat } from "../../../../../context/ChatContext";

const useChatSocket = ({
  userId,
  astrologerId,
  fullName,
  kundliId,
  roomId: chatRoomId,
  isUserSide,
  astroID,
}) => {
  const { 
    activeCall, 
    setActiveCall, 
    setWaitingList: setGlobalWaitingList,
    setActiveCallRoomId,
    resetCallFlow 
  } = useCall();

  const {
    stopTimer,
    setActiveChat,
  } = useChat();

  const [waitingPopup, setWaitingPopup] = useState(false);
  const [callRoomId, setCallRoomId] = useState(null);

  const connectSocket = () => {
    if (voiceSocket.connected) {
      voiceSocket.disconnect();
    }

    voiceSocket.io.opts.query = {
      userId,
      astrologerId,
      role: "CUSTOMER",
    };

    voiceSocket.connect();
  };

  const handleAudioCall = () => {
    console.log("🎵 Audio Call Clicked", { userId, astrologerId, kundliId, activeCall, chatRoomId });

    console.log("🎵 Emitting call:initiate for audio with isSwitch and roomId");
    voiceSocket.emit("call:initiate", {
      userId,
      astrologerId,
      type: "audio",
      isSwitch: true,
      roomId: chatRoomId,
    });
  };

  const handleVideoCall = () => {
    console.log("📹 Video Call Clicked", { userId, astrologerId, kundliId, activeCall, chatRoomId });

    console.log("📹 Emitting call:initiate for video with isSwitch and roomId");
    voiceSocket.emit("call:initiate", {
      userId,
      astrologerId,
      type: "video",
      isSwitch: true,
      roomId: chatRoomId,
    });
  };

  useEffect(() => {
    if (!isUserSide) return;

    const handleCallRoom = (data) => {
      console.log("📞 call:room event received", data);
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setWaitingPopup(true);
      setGlobalWaitingList(data?.waitingTime || 5);
    };

    const handleCallAccepted = ({ roomId, token, type, remainingTime, isSwitch }) => {
      
      // If this is a switch from audio to video AND there's an active audio call, let CallContext handle it
      if (isSwitch && type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch");
        setWaitingPopup(false);
        setGlobalWaitingList(null);
        setCallRoomId(null);
        return;
      }
      
      // Regular call acceptance (including direct video calls from chat)
      setActiveCall({
        roomId,
        chatRoomId,
        agoraToken: token,
        callerName: fullName,
        isUserSide: true,
        callType: type,
        userId,
        astrologerId,
        astrologerID: astroID,
        kundliId,
        remainingTime,
      });

      setWaitingPopup(false);
      setGlobalWaitingList(null);
      setCallRoomId(null);
    };

    const handleCallRejected = (data) => {
      console.log("❌ call:rejected event received", data);
      
      // Check if this is a video switch rejection during an active audio call
      if (data?.switchRejected && data?.type === "audio") {
        console.log("🔄 Video switch rejected - audio call continues");
        Toast.info(data?.message || "Video call request rejected. Continuing with audio call.");
        // Don't reset anything - the audio call should continue
        return;
      }
      
      // Regular call rejection - end everything
      const errorMsg = data?.sessionData?.sessionEndReason === "rejected"
        ? "Astrologer has rejected the call request"
        : "Call request was rejected";
      Toast.error(errorMsg);
      setWaitingPopup(false);
      setGlobalWaitingList(null);
      setCallRoomId(null);
      resetCallFlow();
    };

    const handleCallEnded = () => {
      console.log("🔚 call:ended event received");
      setWaitingPopup(false);
      setGlobalWaitingList(null);
      setCallRoomId(null);
    };

    const handleSocketError = (err) => {
      console.log("⚠️ SOCKET ERROR:", err);
      
      if (err?.message === "Call has already ended") {
        // Soft reset only
        setWaitingPopup(false);
        setGlobalWaitingList(null);
        setCallRoomId(null);
        return;
      }

      Toast.error(err?.message || "Connection error");
      setWaitingPopup(false);
      setGlobalWaitingList(null);
      setCallRoomId(null);
    };

    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("call:rejected", handleCallRejected);
    voiceSocket.on("call:ended", handleCallEnded);
    voiceSocket.on("error", handleSocketError);

    return () => {
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("call:rejected", handleCallRejected);
      voiceSocket.off("call:ended", handleCallEnded);
      voiceSocket.off("error", handleSocketError);
    };
  }, [
    isUserSide,
    chatRoomId,
    fullName,
    userId,
    astrologerId,
    kundliId,
    astroID,
    activeCall,
    setActiveCall,
    setGlobalWaitingList,
    setActiveCallRoomId,
    resetCallFlow,
    setActiveChat,
    stopTimer,
  ]);

  const handleCancelCall = () => {
    if (!callRoomId) return;

    voiceSocket.emit("call:cancel", {
      roomId: callRoomId,
      canceledBy: "CUSTOMER",
    });

    setWaitingPopup(false);
    setGlobalWaitingList(null);
    setCallRoomId(null);
    resetCallFlow();
  };

  return {
    waitingPopup,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall,
  };
};

export default useChatSocket;

import { useEffect, useState } from "react";
import { Toast } from "../../../../../component";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";
import { useChat } from "../../../../../context/ChatContext";
import { useGetBalanceMutation } from "../../../../../redux/api/wallet/walletApi";

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
  const [getBalance] = useGetBalanceMutation();

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

  const handleAudioCall = async () => {
    console.log("🎵 Audio Call Clicked", { userId, astrologerId, kundliId, activeCall, chatRoomId });

    try {
      const result = await getBalance({ astrologerId, type: "audio" });
      const balanceData = result?.data?.data || {};

      if (balanceData?.status === false) {
        Toast.error(result?.data?.data?.message || "Insufficient balance for audio call");
        return;
      }

      const isActive = balanceData?.isActive === true || balanceData?.availability?.isActive === true;
      const activeTypes = balanceData?.isActiveType || balanceData?.availability?.isActiveType;
      const isActiveForCall = Array.isArray(activeTypes)
        ? activeTypes.includes("audio")
        : balanceData?.isActiveForCall === true;

      if (!isActive || !isActiveForCall) {
        Toast.error("Astrologer is not available for voice call");
        return;
      }
    } catch (error) {
      console.error("Balance check failed for audio call:", error);
      Toast.error("Failed to check availability");
      return;
    }

    console.log("🎵 Emitting call:initiate for audio with isSwitch and roomId");
    voiceSocket.emit("call:initiate", {
      userId,
      astrologerId,
      type: "audio",
      isSwitch: true,
      roomId: chatRoomId,
    });
  };

  const handleVideoCall = async () => {
    console.log("📹 Video Call Clicked", { userId, astrologerId, kundliId, activeCall, chatRoomId });

    try {
      const result = await getBalance({ astrologerId, type: "video" });
      const balanceData = result?.data?.data || {};

      if (balanceData?.status === false) {
        Toast.error(result?.data?.data?.message || "Insufficient balance for video call");
        return;
      }

      const isActive = balanceData?.isActive === true || balanceData?.availability?.isActive === true;
      const activeTypes = balanceData?.isActiveType || balanceData?.availability?.isActiveType;
      const isActiveForVideo = Array.isArray(activeTypes)
        ? activeTypes.includes("video")
        : balanceData?.isActiveForVideo === true;

      if (!isActive || !isActiveForVideo) {
        Toast.error("Astrologer is not available for video call");
        return;
      }
    } catch (error) {
      console.error("Balance check failed for video call:", error);
      Toast.error("Failed to check availability");
      return;
    }

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
      
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        setWaitingPopup(false);
        setGlobalWaitingList(null);
        setCallRoomId(null);
        return;
      }
      
      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
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
      
      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        Toast.info(data?.message || "Call switch request rejected. Continuing current call.");
        // Don't reset anything - the current call should continue
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

      if (err?.message === "Chat has already ended") {
        // Chat is over — clear chat state so the window closes
        Toast.error("Chat has already ended");
        stopTimer();
        setActiveChat(null);
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

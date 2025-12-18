import { useEffect, useState } from "react";
import { Toast } from "../../../../../component";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { useCall } from "../../../../../context/CallContext";

const useChatSocket = ({
  userId,
  astrologerId,
  fullName,
  kundliId,
  roomId: chatRoomId, 
  isUserSide,
}) => {
  const { activeCall, setActiveCall } = useCall();

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
    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    connectSocket();

    voiceSocket.emit("create_call_room", {
      userId,
      astrologerId,
      type: "audio",
    });
  };

  const handleVideoCall = () => {
    if (activeCall) {
      Toast.error("You are already on a call");
      return;
    }

    connectSocket();

    voiceSocket.emit("create_call_room", {
      userId,
      astrologerId,
      type: "video",
    });
  };

  useEffect(() => {
    if (!isUserSide) return;

    const handleReturnRoom = ({ roomId,status}) => {

        console.log("statussssssss",status);
      setCallRoomId(roomId); 
      setWaitingPopup(true);
    };

    const handleCallAccepted = ({ roomId, token, type }) => {
      setActiveCall({
        roomId,           
        chatRoomId,        
        agoraToken: token,
        callerName: fullName,
        isUserSide: true,
        callType: type,
        userId,
        astrologerId,
        kundliId,
      });

      setWaitingPopup(false);
      setCallRoomId(null); 
    };

    const handleCallRejected = (data) => {
      Toast.error(
        data?.sessionData?.sessionEndReason || "Call Rejected"
      );
      setWaitingPopup(false);
      setCallRoomId(null);
    };

    const handleCallEnded = () => {
      setWaitingPopup(false);
      setCallRoomId(null);
    };

    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("call_ended", handleCallEnded);
    };
  }, [
    isUserSide,
    chatRoomId,
    fullName,
    userId,
    astrologerId,
    kundliId,
    setActiveCall,
  ]);

  const handleCancelCall = () => {
    if (!callRoomId) return;

    voiceSocket.emit("cancel_call", {
      roomId: callRoomId,
    });

    setWaitingPopup(false);
    setCallRoomId(null);
  };

  return {
    waitingPopup,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall,
  };
};

export default useChatSocket;

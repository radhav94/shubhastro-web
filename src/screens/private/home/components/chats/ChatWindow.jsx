import React, { useEffect, useMemo, useState } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "../../../../../component";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { useInactivityTimer } from "../../../../../utils/hooks/useInactivityTimer";
import InactivityModal from "../../../../../component/UI/modal/inActivity/InactivityModal";
import { useCall } from "../../../../../context/CallContext";
import { useRef } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import WaitingPopup from "./WaitingPopup";
import useChatSocket from "./useChatSocket";

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } = state;

  const { activeCall } = useCall();

  const { messages, error, isTyping, sendMessage, astroReply, sendTyping } =
    useChat({ userId, astrologerId, roomId, isUserSide, kundliId });

  const [message, setMessage] = useState("");

  const {
    waitingPopup,
    handleAudioCall,
    handleVideoCall,
    handleCancelCall,
  } = useChatSocket({
    userId,
    astrologerId,
    fullName,
    kundliId,
    roomId,
    isUserSide,
  });

  const { data } = useGetChatHistoryQuery({ roomId });
  const history = data?.data?.[0]?.chatHistory || [];

  const finalMsgs = useMemo(() => {
    const historyMsgs = history.map((item) => ({
      text: item.message || item.response,
      isSender: isUserSide
        ? item.senderType === "user"
        : item.senderType === "astrologer",
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return [...historyMsgs, ...messages];
  }, [history, messages, isUserSide]);

  const { isInactive, resetTimer } = useInactivityTimer(120000);
  const handleDisconnect = () => navigate(-1);

  const handleSend = () => {
    if (!message.trim()) return;
    isUserSide ? sendMessage(message) : astroReply(message);
    setMessage("");
  };

  return (
    <div className={styles.chatWindow}>
      <ChatHeader
        fullName={fullName}
        isTyping={isTyping}
        onBack={() => navigate(-1)}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        disabled={!!activeCall}
      />

      <ChatMessages messages={finalMsgs} isTyping={isTyping} error={error} />

      <ChatInput
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          sendTyping();
        }}
        onSend={handleSend}
      />

      <WaitingPopup
        open={waitingPopup}
        onCancel={handleCancelCall}
      />

      <InactivityModal
        isOpen={isInactive}
        onDisconnect={handleDisconnect}
        onContinue={resetTimer}
      />
    </div>
  );
};

export default ChatWindow;

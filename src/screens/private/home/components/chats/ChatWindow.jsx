import { useLayoutEffect, useMemo, useState } from "react";
import styles from "./ChatWindow.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
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
import Feedback from "./Feedback";
import { getUserFromStorage } from "../../../../../utils/authStorage";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
import { Toast } from "../../../../../component";

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } =
    state;

  const { activeCall } = useCall();

  const { messages, error, isTyping, sendMessage, astroReply, sendTyping, chatSeconds } =
    useChat({ userId, astrologerId, roomId, isUserSide, kundliId });

  const [message, setMessage] = useState("");

  const { waitingPopup, handleAudioCall, handleVideoCall, handleCancelCall } =
    useChatSocket({
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

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    // ALWAYS keep latest message visible
    container.scrollTop = container.scrollHeight;
  }, [finalMsgs.length, isTyping]);

  const user = getUserFromStorage();
  const [openFeedback, setOpenFeedback] = useState(false);
  const [addAstrologerReview, { isLoading }] = useAddAstrologerReviewMutation();
  const handleReviewSubmit = async ({ rating, review, anonymous }) => {
    try {
      const res = await addAstrologerReview({
        astrologerId,
        rating,
        review,
        anonymous,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message);
        handleDisconnect();
      } else {
        Toast.error(res.message)
      }

      setOpenFeedback(false);
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  }
  
  const formatChatTime = (secs) => {
    const minutes = String(Math.floor(secs / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatWindow}>
        <ChatHeader
          fullName={fullName}
          isTyping={isTyping}
          onBack={() => navigate(-1)}
          onAudioCall={handleAudioCall}
          onVideoCall={handleVideoCall}
          disabled={!!activeCall}
          chatDuration={formatChatTime(chatSeconds)}
        />

        <ChatMessages
          messages={finalMsgs}
          isTyping={isTyping}
          error={error}
          messagesRef={messagesRef}
        />

        <ChatInput
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            sendTyping();
          }}
          onSend={handleSend}
          setOpen={setOpenFeedback}
        />

        <WaitingPopup open={waitingPopup} onCancel={handleCancelCall} />

        <InactivityModal
          isOpen={isInactive}
          onDisconnect={handleDisconnect}
          onContinue={resetTimer}
        />

        <Feedback
          open={openFeedback}
          onClose={() => setOpenFeedback(false)}
          handleSubmit={handleReviewSubmit}
          ratedUserName={fullName}
          reviewerName={user?.firstName || "User"}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatWindow;

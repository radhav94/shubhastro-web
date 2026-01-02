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
import dayjs from "dayjs";
import { voiceSocket } from "../../../../../services/voiceSocketServices";

const formatDate = (date) => dayjs(date).format("DD MMMM YYYY");
const MIN_CHAT_SECONDS = 60;

import { useGetS3SignedUrlMutation } from "../../../../../redux/api/s3SignedApi"

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId, astrologerName, refreshKey, astroID } =
    state || {};

  const { activeCall } = useCall();
  const [openFeedback, setOpenFeedback] = useState(false);

  const {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    sendTyping,
    chatSeconds,
    isMessageDisabled,
  } = useChat({ userId, astrologerId, roomId, isUserSide, kundliId, setOpenFeedback, astrologerName, refreshKey });

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

  const { data } = useGetChatHistoryQuery({ userId : astrologerId }, {refetchOnMountOrArgChange : true});
  const history = data?.data || [];

  const finalMsgs = useMemo(() => {
    const historyMsgs = history.map((item) => ({
      text: item.message || "",
      isSender: isUserSide
        ? item.sender === "user"
        : item.sender === "astrologer",
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateTime: item.createdAt,
    }));


    const socket = messages.map((msg, idx) => ({
      id: `socket-${idx}-${msg.time}`,
      text: msg.text,
      isSender: msg.sender,
      time: msg.time,
      date: msg.date || formatDate(new Date()),
      dateTime: msg.dateTime || new Date().toISOString(),
    }));

    return [...historyMsgs, ...socket].sort(
    (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [history, messages, isUserSide]);

  const { isInactive, resetTimer } = useInactivityTimer(120000);

  const handleChatEnd = () => {
    if (chatSeconds < MIN_CHAT_SECONDS) {
        Toast.error("Chat cannot be ended before 1 minute");
        return;
      }
    voiceSocket.emit("chat:end", {roomId, endedBy : "CUSTOMER"})
  };

  const handleDisconnect = () => {
    handleChatEnd();
    navigate(-1)
  };

  const handleSend = (kundli = null) => {
    if (kundli?._id) {
      const baseUrl = window.location.origin;

      const kundliLink = `${baseUrl}/kundli/${kundli._id}`;
      isUserSide ? sendMessage(kundliLink) : astroReply(kundliLink);

      setMessage("");
      return;
    }

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
  const [addAstrologerReview, { isLoading }] = useAddAstrologerReviewMutation();
  const handleReviewSubmit = async ({ rating, review, anonymous }) => {
    try {
      const isAnonymous = anonymous;
      const res = await addAstrologerReview({
        astrologerID: astroID,
        rating,
        review,
        isAnonymous,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message);
        handleDisconnect();
      } else {
        Toast.error(res.message);
      }

      setOpenFeedback(false);
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  };

  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const sendVoiceMessage = async (blob = null, duration) => {
    const signedUrl = await getS3SignedUrl({
      fileType: blob.type,
    }).unwrap();
    const audioUrl = (signedUrl.uploadUrl).split("?")[0];
    const uploadUrl = signedUrl.uploadUrl;
    await uploadAudioToS3(uploadUrl, blob);
    const jsonString = JSON.stringify({
      type: "voice",
      audioUrl,
      duration,
    });
    sendMessage(jsonString)
    setMessage("");
  };

  const uploadAudioToS3 = async (uploadUrl, blob) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type,
      },
    });
    
    if (!res.ok) {
      throw new Error("S3 upload failed");
    }

    return "success";
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
          isMessageDisabled={isMessageDisabled}
          onChatEnd={handleChatEnd}
          setOpen={setOpenFeedback}
          sendVoiceMessage={sendVoiceMessage}
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

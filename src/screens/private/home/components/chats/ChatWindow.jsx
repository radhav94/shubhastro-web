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
import { useGetS3SignedUrlMutation } from "../../../../../redux/api/s3SignedApi"

const ChatWindow = () => {
  const messagesRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } =
    state;

  const { activeCall } = useCall();

  const {
    messages,
    error,
    isTyping,
    sendMessage,
    astroReply,
    sendTyping,
    chatSeconds,
  } = useChat({ userId, astrologerId, roomId, isUserSide, kundliId });

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
        Toast.error(res.message);
      }

      setOpenFeedback(false);
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  };

  const formatChatTime = (secs) => {
    const minutes = String(Math.floor(secs / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const sendVoiceMessage = async (blob = null, duration) => {
    // const formData = new FormData();
    // formData.append("file", blob);
    const { uploadUrl } = await getS3SignedUrl({
      fileType: blob.type,
    }).unwrap();
    console.log("UploadUrl", uploadUrl);
    const audioUrl = uploadUrl.split("?")[0];
    // const uploadUrl = "https://shubhastroassets.s3.ap-south-1.amazonaws.com/uploads/1766572860978-b5df851f-fb81-4d7c-bd6a-99fa834934ab.webm?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6IY35XCAFJDY7WMB%2F20251224%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20251224T104100Z&X-Amz-Expires=60000&X-Amz-Signature=a96d8d051b6253e930b402f1d9a52d0fabf4d0778838f81a1190e8f5d140b435&X-Amz-SignedHeaders=host&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=PutObject";
    const res = await uploadAudioToS3(uploadUrl, blob);
    console.log("Result", res);
    // const url = "https://shubhastroassets.s3.ap-south-1.amazonaws.com/uploads/1766572860978-b5df851f-fb81-4d7c-bd6a-99fa834934ab.webm";
    // console.log("audioUrl", audioUrl);
    return;
    // const url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    const jsonString = JSON.stringify({
      type: "voice",
      audioUrl,
      duration,
    });
    sendMessage(jsonString)
    setMessage("");
  };

  const uploadAudioToS3 = async (uploadUrl, blob) => {
    console.log("type", blob.type)
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": blob.type, // VERY IMPORTANT
      },
    });

    if (!res.ok) {
      throw new Error("S3 upload failed");
    }

    // remove query params → permanent file URL
    return uploadUrl.split("?")[0];
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

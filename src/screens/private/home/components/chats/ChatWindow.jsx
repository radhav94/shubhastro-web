import React, { useEffect, useState, useMemo } from "react";
import styles from "./ChatWindow.module.scss";
import {
  IoArrowBack,
  IoSend,
  IoCallOutline,
  IoVideocamOutline,
  IoAttach,
} from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryText, Toast } from "../../../../../component";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import InactivityModal from "../../../../../component/UI/modal/inActivity/InactivityModal";
import { useInactivityTimer } from "../../../../../utils/hooks/useInactivityTimer";

const ChatWindow = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } =
    state;

  const { messages, error, isTyping, sendMessage, astroReply, sendTyping } =
    useChat({
      userId,
      astrologerId,
      roomId,
      isUserSide,
      kundliId,
    });

  const [message, setMessage] = useState("");
  const [callRoomId, setCallRoomId] = useState(null);

  const [waitingPopup, setWaitingPopup] = useState(false);

  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const { isInactive, resetTimer } = useInactivityTimer(
    120000,
    showInactivityModal
  );

  useEffect(() => {
    if (isInactive) {
      setShowInactivityModal(true); // Show modal
    }
  }, [isInactive]);

  const handleDisconnect = () => {
    setShowInactivityModal(false);
    navigate(-1); // go back
  };

  const handleContinue = () => {
    setShowInactivityModal(false);
    resetTimer();
  };

  const { data } = useGetChatHistoryQuery({ roomId });
  const messageOff = data?.data?.[0]?.chatHistory || [];

  const finalMsgs = useMemo(() => {
    const formattedHistory = messageOff.map((item) => ({
      text: item.message || item.response,
      isSender: isUserSide
        ? item.senderType === "user"
        : item.senderType === "astrologer",
      time: new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    const formattedSocket = messages.map((msg) => ({
      text: msg.text,
      isSender: msg.isSender,
      time: msg.time,
    }));

    return [...formattedHistory, ...formattedSocket];
  }, [messageOff, messages, isUserSide]);

  // Common socket connect function for both calls
  const commonSocketConnect = () => {
    if (voiceSocket.connected) voiceSocket.disconnect();
    voiceSocket.io.opts.query = { userId, astrologerId, role: "CUSTOMER" };
    voiceSocket.connect();
  };

  const handleCallClick = () => {
    commonSocketConnect();
    voiceSocket.emit("create_call_room", {
      userId,
      astrologerId,
      type: "audio",
    });
  };

  const handleVideoCall = () => {
    commonSocketConnect();
    voiceSocket.emit("create_call_room", {
      userId,
      astrologerId,
      type: "video",
    });
  };

  // Single socket listener for both audio + video
  useEffect(() => {
    if (!isUserSide) return;

    const handleReturnRoom = ({ roomId }) => {
      setCallRoomId(roomId);
      setWaitingPopup(true);
    };

    const handleCallAccepted = ({ roomId, token, type }) => {
      const route =
        type === "video"
          ? `/talk-to-astrologers/video-call/${roomId}`
          : `/talk-to-astrologers/voice-call/${roomId}`;

      navigate(route, {
        state: {
          roomId,
          agoraToken: token,
          callerName: fullName,
          isUserSide: true,
          callType: type,
        },
      });

      setWaitingPopup(false);
    };

    const handleCallRejected = (data) => {
      Toast.error(data?.sessionData?.sessionEndReason || "Call Rejected!");
      setWaitingPopup(false);
      voiceSocket.disconnect();
    };

    const handleSocketError = (err) => {
      Toast.error(err?.message || "Connection Error!");
      setWaitingPopup(false);
    };

    const handleCallEnded = () => {
      voiceSocket.disconnect();
      setWaitingPopup(false);
    };

    voiceSocket.on("return_call_room", handleReturnRoom);
    voiceSocket.on("call_accepted", handleCallAccepted);
    voiceSocket.on("call_rejected", handleCallRejected);
    voiceSocket.on("error", handleSocketError);
    voiceSocket.on("call_ended", handleCallEnded);

    return () => {
      voiceSocket.off("return_call_room", handleReturnRoom);
      voiceSocket.off("call_accepted", handleCallAccepted);
      voiceSocket.off("call_rejected", handleCallRejected);
      voiceSocket.off("error", handleSocketError);
      voiceSocket.off("call_ended", handleCallEnded);
    };
  }, [userId, astrologerId, fullName, navigate, isUserSide]);

  const handleSend = () => {
    if (!message.trim()) return;
    isUserSide ? sendMessage(message) : astroReply(message);
    setMessage("");
  };

  const handleCancelCall = () => {
    if (!callRoomId) return;

    voiceSocket.emit("cancel_call", { roomId: callRoomId });

    setWaitingPopup(false);
    setCallRoomId(null); // ✅ REQUIRED
  };

  return (
    <div className={styles.chatWindow}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <IoArrowBack
            className={styles.backIcon}
            onClick={() => navigate(-1)}
          />

          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            className={styles.headerAvatar}
            alt="User"
          />

          <div className={styles.userInfo}>
            <PrimaryText size_16 isSemiBold>
              {fullName || "Chat User"}
            </PrimaryText>
            <span className={styles.statusText}>
              {isTyping ? "Typing..." : "Online"}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <IoCallOutline
            className={styles.callIcon}
            onClick={handleCallClick}
          />
          <IoVideocamOutline
            className={styles.videoIcon}
            onClick={handleVideoCall}
          />
        </div>
      </div>

      {error && <div className={styles.errorBox}>⚠️ {error}</div>}

      {/* Messages */}
      <div className={styles.messages}>
        {finalMsgs.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgBubble} ${
              msg.isSender ? styles.senderBubble : styles.receiverBubble
            }`}
          >
            <div className={styles.bubbleContent}>
              <PrimaryText size={14} color={msg.isSender ? "#fff" : "#111"}>
                {msg.text}
              </PrimaryText>
            </div>

            <span className={styles.msgTime}>{msg.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.msgBubble} ${styles.receiverBubble}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Waiting Popup */}
      {waitingPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <PrimaryText size_18 isSemiBold>
              ⏳ Waiting for astrologer to accept your call…
            </PrimaryText>

            <PrimaryText size_14 color="#777">
              Please stay on this screen
            </PrimaryText>

            <div className={styles.modalButtons}>
              <button
                className={styles.rejectBtn}
                disabled={!callRoomId}
                onClick={handleCancelCall}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputBox}>
        <button className={styles.attachButton}>
          <IoAttach size={20} />
        </button>

        <input
          className={styles.inputField}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            sendTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message..."
        />

        <button className={styles.sendButton} onClick={handleSend}>
          <IoSend size={20} />
        </button>
      </div>
      <InactivityModal
        isOpen={isInactive}
        onDisconnect={handleDisconnect}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default ChatWindow;

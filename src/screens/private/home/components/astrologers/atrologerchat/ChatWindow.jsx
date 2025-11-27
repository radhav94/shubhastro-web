import React, { useEffect, useState, useMemo } from "react";
import styles from "./ChatWindow.module.scss";
import {   IoArrowBack,
  IoSend,
  IoCallOutline,
  IoVideocamOutline,
  IoEllipsisVertical,
  IoAttach, } from "react-icons/io5";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "../useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../../redux/api/chatApi";

const ChatWindow = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } = state;

  // SOCKET HOOK
  const {
    messages,       // live socket messages
    error,
    isTyping,
    sendMessage,
    astroReply,
    sendTyping,
  } = useChat({
    userId,
    astrologerId,
    roomId,
    isUserSide,
    kundliId,
  });

  const [message, setMessage] = useState("");

  // API HISTORY
  const { data, isLoading } = useGetChatHistoryQuery({ roomId });
  const messageOff = data?.data?.[0]?.chatHistory || [];

  // FINAL MERGED ARRAY
  // const [finalMsgs, setFinalMsgs] = useState([]);


  const finalMsgs = useMemo(() => {
  if (!messageOff) return [];

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

  // COMBINE DB HISTORY + SOCKET LIVE MESSAGES
  // useEffect(() => {
  //   if (!messageOff) return;

  //   // Correct sender logic depending on isUserSide
  //   const formattedHistory = messageOff.map((item) => ({
  //     text: item.message || item.response,

  //     // FIXED SENDER LOGIC
  //     isSender: isUserSide
  //       ? item.senderType === "user"             // user side → user right
  //       : item.senderType === "astrologer",      // astro side → astro right

  //     time: new Date(item.createdAt).toLocaleTimeString([], {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     }),
  //   }));

  //   const formattedSocket = messages.map((msg) => ({
  //     text: msg.text,
  //     isSender: msg.isSender,
  //     time: msg.time,
  //   }));

  //   // Merge both
  //   setFinalMsgs([...formattedHistory, ...formattedSocket]);
  // }, [messageOff, messages]);


  // SEND
  const handleSend = () => {
    if (!message.trim()) return;
    isUserSide ? sendMessage(message) : astroReply(message);
    setMessage("");
  };

  return (
  <div className={styles.chatWindow}>
  {/* HEADER */}
  <div className={styles.header}>
    <div className={styles.headerLeft}>
      <IoArrowBack className={styles.backIcon} onClick={() => navigate(-1)} />

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

  
  </div>

  {/* ERROR */}
  {error && <div className={styles.errorBox}>⚠️ {error}</div>}

  {/* MESSAGE LIST */}
  <div className={styles.messages}>
    {finalMsgs.map((msg, i) => (
      <div
        key={i}
        className={`${styles.msgBubble} ${
          msg.isSender ? styles.senderBubble : styles.receiverBubble
        }`}
      >
        <div className={styles.bubbleContent}>
          <PrimaryText
            size={14}
            color={msg.isSender ? "#fff" : "#111"}
            className={styles.messageText}
          >
            {msg.text}
          </PrimaryText>

          {/* read-status style like Instagram: Sent / Delivered / Seen */}
          {msg.isSender && msg.status && (
            <span className={styles.msgStatus}>
              {msg.status === "seen"
                ? "Seen"
                : msg.status === "delivered"
                ? "Delivered"
                : "Sent"}
            </span>
          )}
        </div>

        {/* time — right side inside bubble */}
        <span className={styles.msgTime}>{msg.time}</span>
      </div>
    ))}

    {/* Typing indicator bubble */}
    {isTyping && (
      <div className={`${styles.msgBubble} ${styles.receiverBubble}`}>
        <div className={styles.typingIndicator}>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
        </div>
      </div>
    )}
  </div>

  {/* INPUT */}
  <div className={styles.inputBox}>
    <button className={styles.attachButton}>
      <IoAttach size={20} />
    </button>

    <input
      value={message}
      onChange={(e) => {
        setMessage(e.target.value);
        sendTyping();
      }}
      placeholder="Write a message..."
    />

    <button className={styles.sendButton} onClick={handleSend}>
      <IoSend size={20} />
    </button>
  </div>
</div>


  );
};

export default ChatWindow;

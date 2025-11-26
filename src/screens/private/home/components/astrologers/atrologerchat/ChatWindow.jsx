import React, { useEffect, useState } from "react";
import styles from "./ChatWindow.module.scss";
import { IoArrowBack, IoSend } from "react-icons/io5";
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
  const [finalMsgs, setFinalMsgs] = useState([]);

  // COMBINE DB HISTORY + SOCKET LIVE MESSAGES
  useEffect(() => {
    if (!messageOff) return;

    // Correct sender logic depending on isUserSide
    const formattedHistory = messageOff.map((item) => ({
      text: item.message || item.response,

      // FIXED SENDER LOGIC
      isSender: isUserSide
        ? item.senderType === "user"             // user side → user right
        : item.senderType === "astrologer",      // astro side → astro right

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

    // Merge both
    setFinalMsgs([...formattedHistory, ...formattedSocket]);
  }, [messageOff, messages]);


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
        <IoArrowBack className={styles.backIcon} onClick={() => navigate(-1)} />

        <img
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          className={styles.headerAvatar}
          alt="User"
        />

        <div>
          <PrimaryText size_16 isSemiBold>
            {fullName || "Chat User"}
          </PrimaryText>

          <PrimaryText size_12 color="#7ed891">
            {isTyping ? "Typing..." : "Online"}
          </PrimaryText>
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
            <PrimaryText size={14} color={msg.isSender ? "#fff" : "#222"}>
              {msg.text}
            </PrimaryText>
            <span className={styles.msgTime}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className={styles.inputBox}>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            sendTyping();
          }}
          placeholder="Write your message..."
        />
        <button onClick={handleSend}>
          <IoSend size={22} color="#fff" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

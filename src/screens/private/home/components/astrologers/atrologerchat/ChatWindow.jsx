import React, { useEffect, useState } from "react";
import styles from "./ChatWindow.module.scss";
import { IoArrowBack, IoSend } from "react-icons/io5";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "../useChatWindow";

const ChatWindow = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { userId, astrologerId, roomId, fullName, isUserSide, kundliId } = state;

  const {
    messages,
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
  const [localMsgs, setLocalMsgs] = useState([]);

  useEffect(() => {
    setLocalMsgs(messages);
  }, [messages]);

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

          {/* Online + Typing */}
          <PrimaryText size_12 color="#7ed891">
            {isTyping ? "Typing..." : "Online"}
          </PrimaryText>
        </div>
      </div>

      {/* ERROR BOX */}
      {error && <div className={styles.errorBox}>⚠️ {error}</div>}

      {/* MESSAGE LIST */}
      <div className={styles.messages}>
        {localMsgs.map((msg, i) => (
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

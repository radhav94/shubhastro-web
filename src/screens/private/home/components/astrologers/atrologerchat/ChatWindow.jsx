import React, { useState } from "react";
import styles from "./ChatWindow.module.scss";
import { IoArrowBack, IoSend } from "react-icons/io5";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "../useChatWindow";

const ChatWindow = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  console.log("📦 Incoming state:", state);

  // ⭐ Required data passed from navigate()
  const { userId, astrologerId, roomId, fullName } = state;

  // ⭐ Initialize chat logic
  const { messages, sendMessage, astroReply, appendLocalMessage } = useChat({
    userId,
    astrologerId,
    roomId,
  });

  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;

    // USER → sends msg
    if (userId && astrologerId) {
      sendMessage(message);
      appendLocalMessage({ sender: "user", text: message });
    }
    // ASTRO → replies
    else {
      astroReply(message);
      appendLocalMessage({ sender: "astro", text: message });
    }

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
            Online
          </PrimaryText>
        </div>
      </div>

      {/* MESSAGES */}
      {/* <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgBubble} ${
              msg.sender === "astro" ? styles.astroMsg : styles.userMsg
            }`}
          >
            <PrimaryText
              size_14
              color={msg.sender === "astro" ? "#222" : "#fff"}
            >
              {msg.text}
            </PrimaryText>
          </div>
        ))}
      </div> */}
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.msgBubble} ${
              msg.isSender ? styles.userMsg : styles.astroMsg
            }`}
          >
            <PrimaryText size_14 color={msg.isSender ? "#fff" : "#222"}>
              {msg.text}
            </PrimaryText>

            <span className={styles.msgTime}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* INPUT BOX */}
      <div className={styles.inputBox}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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

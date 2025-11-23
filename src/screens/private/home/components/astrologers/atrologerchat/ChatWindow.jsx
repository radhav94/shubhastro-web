import React, { useState, useEffect } from "react";
import styles from "./ChatWindow.module.scss";
import { IoArrowBack, IoSend } from "react-icons/io5";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import useChat from "../useChat";

const ChatWindow = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  console.log("stateeeee",state);

  const user = state?.user;  // ⭐ Now user will ALWAYS come
  if (!user) return <div>User not found</div>;

  const astrologerId = "692012fe836eaeb7310db199";
  const userId = user._id;

  const { messages, sendMessage, fetchRoom, appendLocalMessage } = useChat({
    astrologerId,
    userId,
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRoom();
  }, []);

  useEffect(() => {
    appendLocalMessage({
      sender: "astro",
      text: `Hello ${user.firstName} ${user.lastName}, how may I help you today? 😊`,
    });
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
    appendLocalMessage({ sender: "user", text: message });
    setMessage("");
  };

  return (
    <div className={styles.chatWindow}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <IoArrowBack className={styles.backIcon} onClick={() => navigate(-1)} />

        <img
          src={user.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          className={styles.headerAvatar}
          alt="User"
        />

        <div>
          <PrimaryText size_16 isSemiBold>
            {user.firstName} {user.lastName}
          </PrimaryText>
          <PrimaryText size_12 color="#7ed891">Online</PrimaryText>
        </div>
      </div>

      {/* MESSAGES */}
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.msgBubble} ${
              msg.sender === "astro" ? styles.astroMsg : styles.userMsg
            }`}
          >
            <PrimaryText
              color={msg.sender === "astro" ? "#2d2d2d" : "#fff"}
              size_14
            >
              {msg.text}
            </PrimaryText>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className={styles.inputBox}>
        <input
          type="text"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button onClick={handleSend}>
          <IoSend size={22} color="#fff" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

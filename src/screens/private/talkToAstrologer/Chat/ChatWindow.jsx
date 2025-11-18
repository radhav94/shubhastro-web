import React, { useEffect, useState, useRef } from "react";
// import { socket } from "../../../../socket/socket";
import { AppImages } from "../../../../utils/appImages";
import { useLocation } from "react-router-dom";
import styles from "./ChatWindow.module.scss";

const ChatWindow = () => {
  const location = useLocation();
  const { firstName, lastName, imageUrl, isAccountActive } =
    location?.state?.data || {};
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // socket.connect();

    // socket.on("chat message", (msg) => {
    //   setMessages((prev) => [...prev, msg]);
    // });

    return () => {
      //   socket.off("chat message");
      //   socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msgData = {
      id: Date.now().toString(),
      text: message.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    // socket.emit("chat message", msgData);
    setMessages((prev) => [...prev, msgData]);
    setMessage("");
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img
            // src={`https://images.astroyogi.com/english/astrologer/profileimage/${data?.imageUrl}`}
            src={imageUrl}
            alt={firstName}
            className={styles.avatar}
          />
          <span
            className={`${styles.statusDot} ${
              isAccountActive === true
                ? styles.online
                : data.status === false
                ? styles.offline
                : styles.busy
            }`}
          />
        </div>
        <div className={styles.headerInfo}>
          <h4>
            {firstName} {lastName}
          </h4>
          {/* <p>Chat has ended.</p> */}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className={styles.messagesArea}
        style={{
          backgroundImage: `url(${AppImages.ChatBg})`,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.isOwn ? styles.own : styles.other
            }`}
          >
            <p className={styles.text}>{msg.text}</p>
            <span className={styles.time}>{msg.time}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className={styles.inputArea} onSubmit={handleSendMessage}>
        <input
          className={styles.input}
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className={styles.sendButton} type="submit">
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

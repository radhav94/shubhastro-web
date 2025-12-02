import React, { useEffect, useState, useMemo } from "react";
import styles from "./ChatWindow.module.scss";
import {
  IoArrowBack,
  IoSend,
  IoCallOutline,
  IoVideocamOutline,
  IoEllipsisVertical,
  IoAttach,
} from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { PrimaryText } from "../../../../../component";
import useChat from "./useChatWindow";
import { useGetChatHistoryQuery } from "../../../../../redux/api/chatApi";
import { voiceSocket } from "../../../../../services/voiceSocketServices";




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

  console.log("istypeinnnggg", isTyping);
  const { data, isLoading } = useGetChatHistoryQuery({ roomId });
  const messageOff = data?.data?.[0]?.chatHistory || [];

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


   const handleCallClick = () => {
    // socket.emit("call_start", { astrologerId: astrologerId });
    voiceSocket.emit("create_call_room", {
    userId,
    astrologerId,
  });
  };

useEffect(() => {
  if (!isUserSide) return;

  voiceSocket.on("return_call_room", ({ roomId }) => {
    console.log("roomiD",roomId)
    voiceSocket.emit("notify_incoming_call", {
      roomId,
      to: astrologerId,
      from: userId   // ⭐ Add this line
    });
  });

  voiceSocket.on("call_accepted", ({ roomId }) => {
navigate(`/talk-to-astrologers/voice-call/${roomId}`, {
  state: {
    roomId,
    callerName: fullName, // 🌟 astrologer ka naam user chat me hota hai
    isUserSide: true
  }
});
  });

  return () => {
    voiceSocket.off("return_call_room");
    voiceSocket.off("call_accepted");
  };
}, [isUserSide]);




const handleVideoCall = () => {
  voiceSocket.emit("create-video-call-room", {
    userId,
    astrologerId
  });
};


// Listen for room create
useEffect(() => {
  const handleRoomReturn = ({ channelName }) => {
    console.log("Room Created:", channelName);

    // 👉 wait for astrologer to accept
    voiceSocket.on("video-call-accepted", ({ channelName }) => {
      console.log("Astrologer Accepted Call!");
      
      navigate(`/talk-to-astrologers/video-call/${channelName}`, {
        state: { channelName, isUserSide: true }
      });
    });
  };

  voiceSocket.on("return-video-call-room", handleRoomReturn);

  return () => {
    voiceSocket.off("return-video-call-room", handleRoomReturn);
    voiceSocket.off("video-call-accepted");
  };
}, [navigate]);


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

  {/* Right Side Icons */}
  <div className={styles.headerRight}>
    <IoCallOutline className={styles.callIcon} onClick={handleCallClick}/>
    <IoVideocamOutline
            className={styles.videoIcon}
            onClick={handleVideoCall}
          />
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
          className={styles.inputField}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            sendTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
    </div>
  );
};

export default ChatWindow;

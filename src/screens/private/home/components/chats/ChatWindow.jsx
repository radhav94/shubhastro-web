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
  const [waitingPopup, setWaitingPopup] = useState(false);

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



  // const handleCallClick = () => {
  //   if (!voiceSocket.connected) {
  //     voiceSocket.io.opts.query = {
  //       userId,
  //       astrologerId,
  //       role: "CUSTOMER",
  //     };

  //     voiceSocket.connect();
  //   }

  //   voiceSocket.emit("create_call_room", {
  //     userId,
  //     astrologerId,
  //   });
  // };

  const handleCallClick = () => {
  if (voiceSocket.connected) voiceSocket.disconnect();

  voiceSocket.io.opts.query = { userId, astrologerId, role: "CUSTOMER" };
  voiceSocket.connect();

  voiceSocket.emit("create_call_room", { userId, astrologerId });
};


 
useEffect(() => {
  if (!isUserSide) return;

  const handleReturnRoom = (data) => {
    console.log("rommid111111",data);

    setWaitingPopup(true);
  };

  const handleCallAccepted = ({ roomId,token }) => {

    console.log("rommid22222",roomId);
    navigate(`/talk-to-astrologers/voice-call/${roomId}`, {
      state: {
        roomId,
        agoraToken: token,
        callerName: fullName,
        isUserSide: true,
      },
    });

    setWaitingPopup(false);
  };

  const handleCallRejected = (data) => {
    console.log("test the reject")
    Toast.error(data?.sessionData?.sessionEndReason)
    setWaitingPopup(false); 
    voiceSocket.disconnect();
  };

  const handleSocketError = (err) => {
    Toast.error(err?.message)

    setWaitingPopup(false);
  };

  const handleCallEnded = (err) => {
    console.log("disconnect");
    voiceSocket.disconnect();

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


  
  const handleVideoCall = () => {
    voiceSocket.emit("create-video-call-room", {
      userId,
      astrologerId,
    });
  };

  useEffect(() => {
    const handleRoomReturn = ({ channelName }) => {
      voiceSocket.on("video-call-accepted", () => {
        navigate(`/talk-to-astrologers/video-call/${channelName}`, {
          state: { channelName, isUserSide: true },
        });
      });
    };

    voiceSocket.on("return-video-call-room", handleRoomReturn);

    return () => {
      voiceSocket.off("return-video-call-room", handleRoomReturn);
      voiceSocket.off("video-call-accepted");
    };
  }, [navigate]);

  const handleSend = () => {
    if (!message.trim()) return;
    isUserSide ? sendMessage(message) : astroReply(message);
    setMessage("");
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

      {/* Waiting Popup — OUTSIDE messages */}
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
                onClick={() => {
                  setWaitingPopup(false);
                  voiceSocket.emit("cancel_call", { astrologerId });
                }}
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
    </div>
  );
};

export default ChatWindow;

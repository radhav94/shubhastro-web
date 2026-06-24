import { useMatch, useNavigate } from "react-router-dom";
import { useChat } from "../../../../../context/ChatContext";
import { useWaitingQueue } from "../../../../../context/WaitingQueueContext";
import { FooterApproval } from "./FooterApproval";
import { FooterMissedApproval } from "./FooterMissedApproval";
import { useEffect } from "react";
import { voiceSocket } from "../../../../../services/voiceSocketServices";
import { PANDIT_AI_ID } from "../../../../../component/panditAI/usePanditAI";
import styles from "./StickyChatFooter.module.scss";

const StickyChatFooter = () => {
  const {
    waitingList,
    chatApproval,
    activeChat,
    missedApproval,
    resetChatFlow,
    setChatApproval,
    setMissedApproval,
    activeChatRoomId,
    chatSeconds,
  } = useChat();
  const { hasAnyPending } = useWaitingQueue();
  const navigate = useNavigate();

  const onTalkDetailPage = useMatch("/chat-to-astrologer/:id");

  useEffect(() => {
    if (!chatApproval) return;

    const timer = setTimeout(() => {
      voiceSocket.emit("chat:cancel", {
        roomId: activeChatRoomId,
        canceledBy: "SYSTEM",
      });

      setChatApproval(false);
      resetChatFlow();
      setMissedApproval(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [chatApproval]);

  // Hide only on detail page
  if (onTalkDetailPage) return null;

  if (activeChat?.astrologerId === PANDIT_AI_ID) return null;

  // When the queue is active, hide ONLY the waiting state from this footer.
  if (hasAnyPending && waitingList && !chatApproval && !activeChat && !missedApproval) return null;

  if (!chatApproval && !activeChat && !missedApproval) return null;

  const formatTime = (sec) => {
    const totalSec = Math.max(0, Math.floor(Number(sec) || 0));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {chatApproval && <FooterApproval />}
      {missedApproval && <FooterMissedApproval />}

      {activeChat && (
        <div className={styles.chatCard}>
          <div className={styles.iconWrapper}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className={styles.info}>
            <p className={styles.name}>{activeChat.callerName || activeChat.astrologerName || "Astrologer"}</p>
            <p className={styles.meta}>
              <span className={styles.liveDot} />
              Chat ongoing • {formatTime(chatSeconds)}
            </p>
          </div>
          <button
            className={styles.openBtn}
            onClick={() =>
              navigate(`/chat-to-astrologer/${activeChat.astrologerId}`, {
                state: {
                  userId: activeChat.userId,
                  astrologerId: activeChat.astrologerId,
                  fullName: activeChat.callerName,
                  roomId: activeChat.roomId,
                  isUserSide: true,
                  kundliId: activeChat.kundliId,
                  astrologerName: activeChat?.astrologerName,
                  refreshKey: Math.floor(Math.random() * 100) + 1,
                  profileImgUrl: activeChat?.profileImgUrl,
                  experience: activeChat?.experience,
                },
              })
            }
          >
            Open
          </button>
        </div>
      )}
    </div>
  );
};

export default StickyChatFooter;

import { useState } from "react";
import { X, ChevronUp, ChevronDown, Phone, MessageSquare, Video } from "lucide-react";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useCall } from "../../../context/CallContext";
import { useChat } from "../../../context/ChatContext";
import styles from "./StickyWaitingQueue.module.scss";

const typeIcon = {
  chat: <MessageSquare size={14} />,
  audio: <Phone size={14} />,
  video: <Video size={14} />,
};

const typeLabel = {
  chat: "Chat",
  audio: "Call",
  video: "Video",
};

const StickyWaitingQueue = () => {
  const { pendingConnections, cancelPendingConnection, cancelAll } = useWaitingQueue();
  const { callApproval, missedApproval: callMissed, activeCall, setWaitingList: setCallWaitingList, resetCallFlow } = useCall();
  const { chatApproval, missedApproval: chatMissed, activeChat, setWaitingList, resetChatFlow } = useChat();
  const [expanded, setExpanded] = useState(false);

  // Don't render if no pending connections
  if (pendingConnections.length === 0) return null;

  // Hide when approval/missed/active states are showing in the sticky footers
  if (callApproval || chatApproval || callMissed || chatMissed) return null;

  // Hide when there's an active call or chat (the session is live)
  if (activeCall || activeChat) return null;

  const count = pendingConnections.length;

  const handleCancelAll = () => {
    cancelAll();
    // Also reset the old waiting states so old sticky footers don't appear
    setWaitingList(false);
    setCallWaitingList(false);
    resetChatFlow();
    resetCallFlow();
  };

  const handleCancelOne = (conn) => {
    cancelPendingConnection(conn.roomId, conn.type);
    // If this was the last one, also reset old waiting states
    if (pendingConnections.length <= 1) {
      setWaitingList(false);
      setCallWaitingList(false);
      resetChatFlow();
      resetCallFlow();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header bar - always visible */}
      <div className={styles.header} onClick={() => setExpanded((e) => !e)}>
        <div className={styles.headerLeft}>
          <span className={styles.pulse} />
          <span className={styles.headerText}>
            Waiting for {count} astrologer{count > 1 ? "s" : ""}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.cancelAllBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCancelAll();
            }}
          >
            Cancel All
          </button>
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {/* Expanded list */}
      {expanded && (
        <div className={styles.list}>
          {pendingConnections.map((conn) => {
            const name = conn.astrologer?.firstName || "Astrologer";
            return (
              <div key={conn.roomId || conn.astrologer?._id} className={styles.item}>
                <div className={styles.itemIcon}>
                  {typeIcon[conn.type] || typeIcon.audio}
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{name}</p>
                  <p className={styles.itemMeta}>
                    {typeLabel[conn.type] || "Call"} · ~{conn.waitingTime || 5} min
                  </p>
                </div>
                <button
                  className={styles.itemCancel}
                  onClick={() => handleCancelOne(conn)}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StickyWaitingQueue;

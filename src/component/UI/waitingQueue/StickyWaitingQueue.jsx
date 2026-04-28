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
  const { callApproval, missedApproval: callMissed, activeCall } = useCall();
  const { chatApproval, missedApproval: chatMissed, activeChat } = useChat();
  const [expanded, setExpanded] = useState(false);

  // Don't render if no pending connections
  if (pendingConnections.length === 0) return null;

  // Hide when approval/missed/active states are showing in the sticky footers
  // Those take priority over the queue display
  if (callApproval || chatApproval || callMissed || chatMissed) return null;

  // Hide when there's an active call or chat (the session is live)
  if (activeCall || activeChat) return null;

  const count = pendingConnections.length;

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
              cancelAll();
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
                  onClick={() => cancelPendingConnection(conn.roomId, conn.type)}
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

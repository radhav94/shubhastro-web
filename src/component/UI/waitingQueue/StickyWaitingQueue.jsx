import { useState, useEffect } from "react";
import { X, ChevronUp, ChevronDown, Phone, MessageSquare, Video } from "lucide-react";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useCall } from "../../../context/CallContext";
import { useChat } from "../../../context/ChatContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
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

const statusLabel = {
  ringing: "Ringing…",
  waiting: "Waiting…",
  astrologer_accepted: "Astrologer accepted",
  on_hold: "",
};

const StickyWaitingQueue = () => {
  const { pendingConnections, cancelPendingConnection, cancelAll, removePendingConnection, addPendingConnection } = useWaitingQueue();
  const { callApproval, missedApproval: callMissed, activeCall, setWaitingList: setCallWaitingList, resetCallFlow, setCallApprovalData } = useCall();
  const { chatApproval, missedApproval: chatMissed, activeChat, setWaitingList, resetChatFlow, setChatApprovalData } = useChat();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when any connection is in astrologer_accepted state
  const hasAccepted = pendingConnections.some((c) => c.status === "astrologer_accepted");
  useEffect(() => {
    if (hasAccepted) setExpanded(true);
  }, [hasAccepted]);

  // Don't render if no pending connections
  if (pendingConnections.length === 0) return null;

  // Hide when approval/missed/active states are showing in the sticky footers
  if (callApproval || chatApproval || callMissed || chatMissed) return null;

  // Hide when there's an active call or chat (the session is live)
  if (activeCall || activeChat) return null;

  const count = pendingConnections.length;

  const handleCancelAll = () => {
    cancelAll();
    setWaitingList(false);
    setCallWaitingList(false);
    resetChatFlow();
    resetCallFlow();
  };

  const handleCancelOne = (conn) => {
    cancelPendingConnection(conn.roomId, conn.type, conn.astrologer?._id);
  };

  // User accepts the astrologer's accepted call/chat
  const handleAccept = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:user_accept" : "call:user_accept";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
  };

  // User unholds — cancel old session and re-initiate to same astrologer
  const handleUnhold = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    // Remove old on-hold connection, then add a fresh pending entry
    // so the new call:room / chat:room from server has a queue entry to match
    removePendingConnection(conn.roomId);
    addPendingConnection({
      id: `${conn.astrologer?._id}-${conn.type}-${Date.now()}`,
      astrologer: conn.astrologer,
      type: conn.type,
      roomId: null, // new roomId will come from server
      waitingTime: conn.waitingTime || 5,
      isEmergency: conn.isEmergency || false,
      status: "ringing",
    });
  };

  // User cancels on-hold session
  const handleHoldCancel = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    removePendingConnection(conn.roomId);
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
            const status = conn.status || "waiting";
            const isAccepted = status === "astrologer_accepted";
            const isOnHold = status === "on_hold";

            return (
              <div key={conn.roomId || conn.astrologer?._id} className={`${styles.item} ${isAccepted ? styles.itemAccepted : ""} ${isOnHold ? styles.itemOnHold : ""}`}>
                <div className={styles.itemIcon}>
                  {typeIcon[conn.type] || typeIcon.audio}
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{name}</p>
                  {(statusLabel[status] || (!isOnHold && `${typeLabel[conn.type] || "Call"} · ~${conn.waitingTime || 5} min`)) && (
                    <p className={styles.itemMeta}>
                      {statusLabel[status] || `${typeLabel[conn.type] || "Call"} · ~${conn.waitingTime || 5} min`}
                    </p>
                  )}
                </div>
                <div className={styles.itemActions}>
                  {isAccepted && (
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleAccept(conn)}
                      aria-label="Accept"
                    >
                      Accept
                    </button>
                  )}
                  {isOnHold && (
                    <button
                      className={styles.unholdBtn}
                      onClick={() => handleUnhold(conn)}
                      aria-label="Reconnect"
                    >
                      On Hold
                    </button>
                  )}
                  <button
                    className={styles.itemCancel}
                    onClick={() => {
                      if (isAccepted) {
                        // Astrologer accepted — reject the ring
                        const eventName = conn.type === "chat" ? "chat:user_reject" : "call:user_reject";
                        voiceSocket.emit(eventName, { roomId: conn.roomId });
                        removePendingConnection(conn.roomId);
                      } else if (isOnHold) {
                        handleHoldCancel(conn);
                      } else {
                        handleCancelOne(conn);
                      }
                    }}
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StickyWaitingQueue;

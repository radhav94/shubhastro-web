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
  astrologer_accepted: "Astrologer accepted",
  on_hold: "",
};

/**
 * Format dynamic wait time for display based on confidence level.
 */
function formatWaitDisplay(conn) {
  const { waitingTime, minWait, maxWait, confidence, position } = conn;
  const type = typeLabel[conn.type] || "Call";

  if (waitingTime === undefined && !position) {
    return "Waiting…";
  }

  const safeWait = Math.max(1, waitingTime || 1);
  const safeMin = Math.max(1, minWait || safeWait);
  const safeMax = Math.max(safeMin, maxWait || safeWait);

  let timeStr;
  if (confidence === "high") {
    timeStr = `~${safeWait} min`;
  } else {
    timeStr = `~${safeMin}-${safeMax} min`;
  }

  return `Waiting time: ${timeStr}`;
}

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
    if (!conn.roomId) {
      console.warn("[StickyWaitingQueue] handleAccept — no roomId!", conn);
      return;
    }
    const eventName = conn.type === "chat" ? "chat:user_accept" : "call:user_accept";
    console.log("[StickyWaitingQueue] Emitting", eventName, "roomId:", conn.roomId, "socket connected:", voiceSocket.connected);
    voiceSocket.emit(eventName, { roomId: conn.roomId });

    // Notify live stream view to switch to the accepted astrologer's channel
    window.dispatchEvent(new CustomEvent("waitlist:accepted", {
      detail: { astrologerId: conn.astrologer?._id, roomId: conn.roomId, type: conn.type }
    }));
  };

  // User unholds — emit unhold event, remove old session, re-initiate call/chat
  const handleUnhold = (conn) => {
    if (!conn.roomId) return;
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (!userId) return;

    // 1. Emit unhold event to notify server
    const unholdEvent = conn.type === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(unholdEvent, { roomId: conn.roomId });

    // 2. Remove old on-hold connection
    removePendingConnection(conn.roomId);

    // 3. Re-initiate the call/chat (same as normal flow)
    const initiateEvent = conn.type === "chat" ? "chat:initiate" : "call:initiate";
    const payload = {
      userId,
      astrologerId: conn.astrologer?._id,
      type: conn.type,
      ...(conn.isEmergency && { isEmergency: true }),
      fromLive: false,
    };
    voiceSocket.emit(initiateEvent, payload);

    // 4. Add fresh pending entry (roomId will come from server via call:room/chat:room)
    addPendingConnection({
      id: `${conn.astrologer?._id}-${conn.type}-${Date.now()}`,
      astrologer: conn.astrologer,
      type: conn.type,
      roomId: null,
      waitingTime: conn.type === "chat" ? 2 : 5,
      isEmergency: conn.isEmergency || false,
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
            const name = `${conn.astrologer?.firstName || conn.astrologer?.astrologerName || ""} ${conn.astrologer?.lastName || ""}`.trim() || "Astrologer";
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
                  {(statusLabel[status] || true) && (
                    <p className={styles.itemMeta}>
                      {statusLabel[status] || formatWaitDisplay(conn)}
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
                      Unhold
                    </button>
                  )}
                  {!isAccepted && (
                    <button
                      className={styles.itemCancel}
                      onClick={() => {
                        if (isOnHold) {
                          handleHoldCancel(conn);
                        } else {
                          handleCancelOne(conn);
                        }
                      }}
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  )}
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

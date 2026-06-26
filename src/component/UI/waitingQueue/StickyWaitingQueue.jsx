import { useState, useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useCall } from "../../../context/CallContext";
import { useChat } from "../../../context/ChatContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
import styles from "./StickyWaitingQueue.module.scss";

/**
 * Format wait time display.
 */
function formatWaitDisplay(conn) {
  const { waitingTime, minWait, maxWait, confidence, position } = conn;

  if (waitingTime === undefined && !position) return null;

  const safeWait = Math.max(1, waitingTime || 1);
  const safeMin = Math.max(1, minWait || safeWait);
  const safeMax = Math.max(safeMin, maxWait || safeWait);

  let timeStr;
  if (confidence === "high") {
    timeStr = `~ ${safeWait}min`;
  } else {
    timeStr = `~ ${safeMin}-${safeMax}min`;
  }

  const posStr = position ? `#${position} in queue` : "";
  if (posStr && timeStr) return `${posStr} • ${timeStr}`;
  return posStr || timeStr;
}

const StickyWaitingQueue = () => {
  const navigate = useNavigate();
  const { pendingConnections, cancelPendingConnection, cancelAll, removePendingConnection, addPendingConnection } = useWaitingQueue();
  const { callApproval, missedApproval: callMissed, activeCall, setWaitingList: setCallWaitingList, resetCallFlow } = useCall();
  const { chatApproval, missedApproval: chatMissed, activeChat, setWaitingList, resetChatFlow } = useChat();
  const [expanded, setExpanded] = useState(true);
  const listRef = useRef(null);

  // Auto-expand when any connection is in astrologer_accepted state
  const hasAccepted = pendingConnections.some((c) => c.status === "astrologer_accepted");
  useEffect(() => {
    if (hasAccepted) setExpanded(true);
  }, [hasAccepted]);

  // Scroll list to bottom when new connection is added
  useEffect(() => {
    if (listRef.current && expanded) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [pendingConnections.length, expanded]);

  if (pendingConnections.length === 0) return null;
  if (callApproval || chatApproval || callMissed || chatMissed) return null;
  if (activeCall || activeChat) return null;

  // Hide waiting queue when rendered inside an iframe (e.g. kundli view from chat)
  if (window.self !== window.top) return null;

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

  const handleAccept = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:user_accept" : "call:user_accept";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    window.dispatchEvent(new CustomEvent("waitlist:accepted", {
      detail: { astrologerId: conn.astrologer?._id, roomId: conn.roomId, type: conn.type }
    }));
  };

  const handleUnhold = (conn) => {
    if (!conn.roomId) return;
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (!userId) return;
    const unholdEvent = conn.type === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(unholdEvent, { roomId: conn.roomId });
    removePendingConnection(conn.roomId);
    const initiateEvent = conn.type === "chat" ? "chat:initiate" : "call:initiate";
    const initiatePayload = {
      userId,
      astrologerId: conn.astrologer?._id,
      type: conn.type,
      isLive: !!conn.fromLive,
      ...(conn.fromLive && conn.liveChannelId && {
        liveRoomDetails: {
          roomId: conn.liveChannelId,
          hostId: conn.astrologer?._id,
          hostName: conn.astrologer?.firstName || conn.astrologer?.astrologerName || "",
          channel: conn.liveChannelId,
        },
      }),
    };
    voiceSocket.emit(initiateEvent, initiatePayload);
    addPendingConnection({
      id: `${conn.astrologer?._id}-${conn.type}-${Date.now()}`,
      astrologer: conn.astrologer,
      type: conn.type,
      roomId: null,
      waitingTime: conn.type === "chat" ? 2 : 5,
      isEmergency: conn.isEmergency || false,
      fromLive: conn.fromLive || false,
      liveChannelId: conn.liveChannelId || null,
    });
  };

  const handleHoldCancel = (conn) => {
    if (!conn.roomId) return;
    const eventName = conn.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    removePendingConnection(conn.roomId);
  };

  const getProfileImage = (conn) => {
    return conn.astrologer?.profileImage || conn.astrologer?.profilePicUrl || null;
  };

  return (
    <div className={styles.container}>
      {/* Toggle arrow on top of the modal (reflects open/close state) */}
      <button
        className={styles.toggleArrow}
        aria-label={expanded ? "Collapse list" : "Expand list"}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
      </button>

      {/* Header pill */}
      <div className={styles.header} onClick={() => setExpanded((e) => !e)}>
        <span className={styles.headerText}>
          Waiting for {count} astrologer{count > 1 ? "s" : ""}
        </span>
        <button
          className={styles.cancelAllBtn}
          onClick={(e) => { e.stopPropagation(); handleCancelAll(); }}
        >
          Cancel All
        </button>
      </div>

      {/* Card list */}
      {expanded && (
        <div className={styles.list} ref={listRef}>
            {pendingConnections.map((conn) => {
              const name = `${conn.astrologer?.firstName || conn.astrologer?.astrologerName || ""} ${conn.astrologer?.lastName || ""}`.trim() || "Astrologer";
              const status = conn.status || "waiting";
              const isAccepted = status === "astrologer_accepted";
              const isOnHold = status === "on_hold";
              const profileImg = getProfileImage(conn);

              return (
                <div key={conn.roomId || conn.astrologer?._id} className={`${styles.item} ${isAccepted ? styles.itemAccepted : ""} ${isOnHold ? styles.itemOnHold : ""}`}>
                  <div className={styles.itemAvatar}>
                    {profileImg ? (
                      <img src={profileImg} alt={name} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                    ) : null}
                    <span style={profileImg ? { display: "none" } : {}}>{name.charAt(0).toUpperCase()}</span>
                  </div>

                  <div className={styles.itemInfo}>
                    <p
                      className={`${styles.itemName} ${conn.fromLive ? styles.itemNameClickable : ""}`}
                      onClick={() => {
                        if (conn.fromLive && conn.liveChannelId) {
                          navigate(`/live/${conn.liveChannelId}`);
                        }
                      }}
                    >
                      {name}
                    </p>
                    <p className={styles.itemType}>
                      {conn.type === "chat" ? "Chat" : conn.type === "video" ? "Video Call" : "Audio Call"}
                    </p>
                    <p className={styles.itemMeta}>
                      {isAccepted && <span className={styles.metaGreen}>Accepted</span>}
                      {isOnHold && <span className={styles.metaRed}>Missed Call</span>}
                      {status === "ringing" && <span className={styles.metaGreen}>{conn.type === "chat" ? "Connecting..." : "Ringing..."}</span>}
                      {!isAccepted && !isOnHold && status !== "ringing" && (formatWaitDisplay(conn) || "Waiting…")}
                    </p>
                  </div>

                  <div className={styles.itemActions}>
                    {/* Waiting state — Cancel */}
                    {!isAccepted && !isOnHold && status !== "ringing" && (
                      <button className={styles.cancelBtn} onClick={() => handleCancelOne(conn)}>
                        Cancel
                      </button>
                    )}

                    {/* Ringing — Cancel */}
                    {status === "ringing" && !isAccepted && (
                      <button className={styles.cancelBtn} onClick={() => handleCancelOne(conn)}>
                        Cancel
                      </button>
                    )}

                    {/* On hold / Missed — Rejoin + Cancel */}
                    {isOnHold && (
                      <>
                        <button className={styles.rejoinBtn} onClick={() => handleUnhold(conn)}>
                          <RotateCcw size={12} /> Rejoin
                        </button>
                        <button className={styles.cancelBtn} onClick={() => handleHoldCancel(conn)}>
                          <X size={12} /> Cancel
                        </button>
                      </>
                    )}

                    {/* Accepted — Join Call/Chat */}
                    {isAccepted && (
                      <button className={styles.joinCallBtn} onClick={() => handleAccept(conn)}>
                        {conn.type === "chat" ? "Join Chat" : "Join Call"}
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

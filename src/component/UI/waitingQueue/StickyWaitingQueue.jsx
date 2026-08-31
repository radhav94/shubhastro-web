import { useState, useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWaitingQueue } from "../../../context/WaitingQueueContext";
import { useCall } from "../../../context/CallContext";
import { useChat } from "../../../context/ChatContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { stopIncomingSound } from "../../../utils/incomingSound";
import toast from "../../toast";
import { getAstrologerDisplayName } from "../../../utils/helper/string.utils";
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

  /*
    Per-row "not ready yet" note, keyed by the row's own identity.

    This was a `toast.info()`, which is the one kind of answer that does not
    count. A toast renders in a portal at the edge of the viewport, is gone in
    seconds, and mutates nothing inside the row that was tapped — so Clarity
    still records the tap as a dead click, and a second tap sets the identical
    toast text, which React renders as no change at all. Clarity caught this
    surface directly: a mobile visitor from Instagram sat on "Waiting for
    astrologer" at 07:31, tried both the chat and the call controls, and
    withdrew both shortly after.

    It also mattered for the user, not just the metric: the buttons are on the
    right edge of a bottom-anchored card, and the toast fires somewhere else
    entirely, so on a phone the response to a tap appeared nowhere near the
    thumb that made it.

    `seq` increments on every call and is used as the note's React key, so
    tapping the same not-ready button twice remounts the paragraph and replays
    its animation instead of resolving to an identical no-op render.

    Declared up here, above the early returns below, so the hook order is
    unconditional.
  */
  const [notReadyNote, setNotReadyNote] = useState(null);
  const noteSeqRef = useRef(0);

  const rowKeyOf = (conn) => conn.roomId || conn.astrologer?._id;

  /*
    Drop the note as soon as the row it belongs to can actually act, so a stale
    "still connecting" line cannot sit under a button that now works. Keyed on the
    joined roomId list rather than the array identity: the context replaces
    pendingConnections on every status tick, and re-running on that would clear
    the note before it had been read.
  */
  const readyRowKeys = pendingConnections
    .filter((c) => c.roomId)
    .map((c) => c.roomId)
    .join(",");
  useEffect(() => {
    if (!notReadyNote) return;
    const row = pendingConnections.find((c) => rowKeyOf(c) === notReadyNote.key);
    if (!row || row.roomId) setNotReadyNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyRowKeys]);

  if (pendingConnections.length === 0) return null;
  if (callApproval || chatApproval || callMissed || chatMissed) return null;
  if (activeCall || activeChat) return null;

  // Hide waiting queue when rendered inside an iframe (e.g. kundli view from chat)
  if (window.self !== window.top) return null;

  const count = pendingConnections.length;

  const handleCancelAll = () => {
    stopIncomingSound();
    cancelAll();
    setWaitingList(false);
    setCallWaitingList(false);
    resetChatFlow();
    resetCallFlow();
  };

  const handleCancelOne = (conn) => {
    stopIncomingSound();
    cancelPendingConnection(conn.roomId, conn.type, conn.astrologer?._id);
  };

  // Queue entries are created with `roomId: null` and only receive one when the
  // server emits chat:room / call:room. Every action below needs that roomId, so
  // until it lands the buttons used to be silent no-ops — the user taps Cancel
  // or Join during the "connecting…" window and nothing happens at all.
  const isReady = (conn) => Boolean(conn.roomId);

  const notReady = (conn) => {
    noteSeqRef.current += 1;
    setNotReadyNote({ key: rowKeyOf(conn), seq: noteSeqRef.current });
  };

  const handleAccept = (conn) => {
    if (!isReady(conn)) return notReady(conn);
    stopIncomingSound();
    const eventName = conn.type === "chat" ? "chat:user_accept" : "call:user_accept";
    voiceSocket.emit(eventName, { roomId: conn.roomId });
    window.dispatchEvent(new CustomEvent("waitlist:accepted", {
      detail: { astrologerId: conn.astrologer?._id, roomId: conn.roomId, type: conn.type }
    }));
  };

  const handleUnhold = (conn) => {
    if (!isReady(conn)) return notReady(conn);
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (!userId) {
      toast.error("Your session expired. Please log in again to rejoin.");
      return;
    }
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
          hostName: getAstrologerDisplayName(conn.astrologer) || conn.astrologer?.astrologerName || "",
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
    if (!isReady(conn)) return notReady(conn);
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
              // userName-first (falls back to firstName + lastName inside the helper),
              // then the flattened astrologerName some payloads carry.
              const name = getAstrologerDisplayName(conn.astrologer) || conn.astrologer?.astrologerName || "Astrologer";
              const status = conn.status || "waiting";
              const isAccepted = status === "astrologer_accepted";
              const isOnHold = status === "on_hold";
              // Cancel was tapped before the server had assigned a roomId, so the
              // withdrawal is queued until the room event lands (see
              // WaitingQueueContext.assignRoomId). Report that instead of showing
              // Cancel again on a request that is already being withdrawn.
              const isCancelling = !!conn.cancelRequested && !conn.roomId;
              const profileImg = getProfileImage(conn);
              // Accept / rejoin / hold-cancel all need the server-assigned roomId.
              const ready = isReady(conn);

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
                      {isCancelling && <span className={styles.metaRed}>Cancelling…</span>}
                      {!isCancelling && isAccepted && <span className={styles.metaGreen}>Accepted</span>}
                      {!isCancelling && isOnHold && <span className={styles.metaRed}>Missed Call</span>}
                      {!isCancelling && status === "ringing" && <span className={styles.metaGreen}>{conn.type === "chat" ? "Connecting..." : "Ringing..."}</span>}
                      {!isCancelling && !isAccepted && !isOnHold && status !== "ringing" && (formatWaitDisplay(conn) || "Waiting…")}
                    </p>
                    {/*
                      Inside the row, directly under the wait line and beside the
                      button that was tapped — see notReady. role="status" so it
                      is announced without stealing focus; keyed on seq so a
                      repeat tap remounts it rather than rendering nothing new.
                    */}
                    {notReadyNote?.key === rowKeyOf(conn) && (
                      <p
                        key={notReadyNote.seq}
                        className={styles.itemNotReadyNote}
                        role="status"
                      >
                        Still connecting to {name} — one moment.
                      </p>
                    )}
                  </div>

                  <div className={styles.itemActions}>
                    {/*
                      Withdrawal already in flight. No control is offered rather
                      than a dead or aria-disabled Cancel, because there is
                      genuinely nothing left for the user to do — the meta line
                      beside this says "Cancelling…".
                    */}
                    {/* Waiting state — Cancel */}
                    {!isCancelling && !isAccepted && !isOnHold && status !== "ringing" && (
                      <button className={styles.cancelBtn} onClick={() => handleCancelOne(conn)}>
                        Cancel
                      </button>
                    )}

                    {/* Ringing — Cancel */}
                    {!isCancelling && status === "ringing" && !isAccepted && (
                      <button className={styles.cancelBtn} onClick={() => handleCancelOne(conn)}>
                        Cancel
                      </button>
                    )}

                    {/* On hold / Missed — Rejoin + Cancel */}
                    {!isCancelling && isOnHold && (
                      <>
                        <button
                          className={`${styles.rejoinBtn} ${!ready ? styles.notReady : ""}`.trim()}
                          onClick={() => handleUnhold(conn)}
                          aria-disabled={!ready}
                        >
                          <RotateCcw size={12} /> Rejoin
                        </button>
                        <button
                          className={`${styles.cancelBtn} ${!ready ? styles.notReady : ""}`.trim()}
                          onClick={() => handleHoldCancel(conn)}
                          aria-disabled={!ready}
                        >
                          <X size={12} /> Cancel
                        </button>
                      </>
                    )}

                    {/* Accepted — Join Call/Chat */}
                    {!isCancelling && isAccepted && (
                      <button
                        className={`${styles.joinCallBtn} ${!ready ? styles.notReady : ""}`.trim()}
                        onClick={() => handleAccept(conn)}
                        aria-disabled={!ready}
                      >
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

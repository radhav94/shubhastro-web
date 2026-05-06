import { useState, useEffect, useRef } from "react";
import { voiceSocket } from "../../../../services/voiceSocketServices";
import { getUserFromStorage } from "../../../../utils/authStorage";
import styles from "./WaitlistModal.module.scss";

const WaitlistModal = ({ show, callRoomId, resetCallState, onClose, onShow, connectionType, waitTime, onUnhold }) => {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("waiting"); // "waiting" | "astrologer_accepted" | "on_hold"
  const [approvalData, setApprovalData] = useState(null);
  const [timerKey, setTimerKey] = useState(0); // bump to restart timer
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const user = getUserFromStorage();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You";
  const initials = fullName.split(" ").map(w => w.charAt(0).toUpperCase()).join("").slice(0, 2);

  // Listen for status change events
  useEffect(() => {
    const handleCallAstrologerAccepted = (data) => {
      console.log("[WaitlistModal] 📥 call:astrologer_accepted", JSON.stringify(data));
      if (data?.roomId === callRoomId || !callRoomId) {
        setStatus("astrologer_accepted");
        setApprovalData({ ...data, type: data.type || connectionType || "audio" });
        if (onShow) onShow();
      }
    };

    const handleChatAstrologerAccepted = (data) => {
      console.log("[WaitlistModal] 📥 chat:astrologer_accepted", JSON.stringify(data));
      if (data?.roomId === callRoomId || !callRoomId) {
        setStatus("astrologer_accepted");
        setApprovalData({ ...data, type: data.type || "chat" });
        if (onShow) onShow();
      }
    };

    const handleOnHold = (data) => {
      if (data?.roomId === callRoomId || data?.roomId === approvalData?.roomId) {
        setStatus("on_hold");
        setApprovalData((prev) => prev ? { ...prev, ...data } : data);
      }
    };

    voiceSocket.on("call:astrologer_accepted", handleCallAstrologerAccepted);
    voiceSocket.on("chat:astrologer_accepted", handleChatAstrologerAccepted);
    voiceSocket.on("call:on_hold", handleOnHold);
    voiceSocket.on("chat:on_hold", handleOnHold);

    return () => {
      voiceSocket.off("call:astrologer_accepted", handleCallAstrologerAccepted);
      voiceSocket.off("chat:astrologer_accepted", handleChatAstrologerAccepted);
      voiceSocket.off("call:on_hold", handleOnHold);
      voiceSocket.off("chat:on_hold", handleOnHold);
    };
  }, [callRoomId, connectionType, approvalData?.roomId, onShow]);

  // Timer — depends on callRoomId and timerKey (bumped on unhold to restart)
  useEffect(() => {
    if (!callRoomId) {
      startTimeRef.current = null;
      setElapsed(0);
      setStatus("waiting");
      setApprovalData(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    // Start fresh timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [callRoomId, timerKey]);

  useEffect(() => {
    if (!show) {
      setApprovalData(null);
      setStatus("waiting");
    }
  }, [show]);

  if (!show) return null;

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  const handleCancel = () => {
    if (callRoomId) {
      if (status === "on_hold") {
        const event = connectionType === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
        voiceSocket.emit(event, { roomId: callRoomId });
      } else if (status === "astrologer_accepted") {
        const event = (approvalData?.type || connectionType) === "chat" ? "chat:user_reject" : "call:user_reject";
        voiceSocket.emit(event, { roomId: callRoomId });
      } else {
        const event = connectionType === "chat" ? "chat:cancel" : "call:cancel";
        voiceSocket.emit(event, { roomId: callRoomId, canceledBy: "CUSTOMER" });
      }
    }
    resetCallState();
  };

  const handleUserAccept = () => {
    const roomId = approvalData?.roomId || callRoomId;
    if (!roomId) return;
    const event = (approvalData?.type || connectionType) === "chat" ? "chat:user_accept" : "call:user_accept";
    voiceSocket.emit(event, { roomId });
  };

  const handleUnhold = () => {
    const roomId = approvalData?.roomId || callRoomId;
    if (!roomId) return;
    const event = connectionType === "chat" ? "chat:unhold" : "call:unhold";
    voiceSocket.emit(event, { roomId });
    setStatus("waiting");
    // Bump timerKey to trigger useEffect and restart timer
    setTimerKey((k) => k + 1);
    // Notify parent to clear pending connection from queue
    if (onUnhold) onUnhold(roomId);
  };

  const estimatedWait = waitTime || (connectionType === "chat" ? 2 : 5);
  const astrologerName = approvalData?.astrologerDetail?.firstName || approvalData?.astrologerDetail?.astrologerName || "Astrologer";

  // Status-based description
  const getDescription = () => {
    if (status === "astrologer_accepted") return `${astrologerName} is ready to connect with you.`;
    if (status === "on_hold") return "You are on hold. You can unhold or cancel.";
    return "You are in the waitlist. Please wait while the astrologer connects with you.";
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Waitlist</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>

        <p className={styles.description}>{getDescription()}</p>

        {/* User row with actions based on status */}
        <div className={styles.userRow}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{fullName}</span>
              {status !== "waiting" && (
                <span className={styles.statusTag}>
                  {status === "astrologer_accepted" ? "Accepting..." : "On Hold"}
                </span>
              )}
            </div>
          </div>

          {/* Right side: timer or action buttons */}
          {status === "waiting" && (
            <div className={styles.timer}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{mins}m {secs}s</span>
            </div>
          )}

          {status === "astrologer_accepted" && (
            <div className={styles.actionBtns}>
              <button className={styles.acceptBtn} onClick={handleUserAccept}>Accept</button>
              <button className={styles.rejectBtn} onClick={handleCancel}>Reject</button>
            </div>
          )}

          {status === "on_hold" && (
            <div className={styles.actionBtns}>
              <button className={styles.unholdBtn} onClick={handleUnhold}>Unhold</button>
              <button className={styles.rejectBtn} onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {status === "waiting" && (
          <>
            <div className={styles.waitTimeRow}>
              <span className={styles.waitLabel}>Wait Time :</span>
              <span className={styles.waitValue}>~{estimatedWait} min</span>
            </div>
            <button className={styles.joinBtn} onClick={handleCancel}>
              Cancel Waitlist
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;

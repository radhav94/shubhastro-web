import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { WaitingQueueContext } from "./waitingQueueContextInstance";
import { voiceSocket, clearChatSession } from "../services/voiceSocketServices";
import { useCall } from "./CallContext";
import { useChat } from "./ChatContext";
import { PANDIT_AI_ID } from "../component/panditAI/usePanditAI";
import { Toast } from "../component";
import { trackEvent } from "../utils/analytics";

import { startIncomingSound, stopIncomingSound } from "../utils/incomingSound";
import { claimRoom, releaseRoom } from "../utils/tabSession";
import { GUEST_AUTO_ACCEPT_KEY, GUEST_FANOUT_RESOLVED_KEY, GUEST_FANOUT_RESOLVED_WINDOW_MS } from "../screens/public/guestChat/guestChatConstants";
import { getAstrologerDisplayName } from "../utils/helper/string.utils";

// LocalStorage key for persistence
const QUEUE_STORAGE_KEY = "shubhtalk_waiting_queue";
const QUEUE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

/*
 * How long a cancel-before-roomId entry is kept waiting for its room event.
 *
 * A request is created with `roomId: null` and only gets one when the server
 * emits chat:room / call:room. Cancelling inside that window has nothing to
 * address the withdrawal to, so the entry is flagged and held until the roomId
 * arrives (see markDeferredCancel / assignRoomId). If the room never arrives
 * there is nothing to cancel against, so the entry is swept rather than left
 * showing "Cancelling…" for the rest of the session.
 *
 * Comfortably longer than a normal room round trip, short enough that a dropped
 * socket doesn't leave a stuck card on screen.
 */
const CANCEL_ROOM_WAIT_MS = 15000;

/*
 * Flags every entry that cannot be withdrawn yet, and drops the rest.
 *
 * Used by all three cancel paths. Returning a new list rather than mutating so
 * callers stay pure state updaters.
 */
const markDeferredCancel = (list, keep = () => false) =>
  list
    .filter((c) => !c.roomId || keep(c))
    .map((c) =>
      c.roomId ? c : { ...c, status: "cancelling", cancelRequested: true }
    );

// Returns true when a guest fan-out has just been resolved (i.e. one astrologer
// already accepted and won) and we're still within the straggler window. Late
// acceptances from the other fanned-out astrologers should be auto-rejected.
// The flag is self-expiring: once the window elapses it's cleared so it can
// never affect an unrelated, later session.
const isGuestFanoutResolved = () => {
  const raw = sessionStorage.getItem(GUEST_FANOUT_RESOLVED_KEY);
  if (!raw) return false;
  const resolvedAt = Number(raw);
  if (!resolvedAt || Date.now() - resolvedAt >= GUEST_FANOUT_RESOLVED_WINDOW_MS) {
    sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);
    return false;
  }
  return true;
};

// Drops the guest auto-accept handshake and any fan-out "resolved" marker. Called
// when the pending queue is torn down by a user cancel so that a later, unrelated
// request (e.g. a normal logged-in request) is never auto-accepted.
const clearGuestFanoutFlags = () => {
  sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
  sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);
};

/**
 * Each pending connection in the queue:
 * {
 *   id: string,           // unique id (roomId from server)
 *   astrologer: object,   // astrologer data { _id, firstName, lastName, profileImage, ... }
 *   type: "chat" | "audio" | "video",
 *   roomId: string,
 *   waitingTime: number,  // approx minutes
 *   timestamp: number,    // Date.now() when added
 *   isEmergency: boolean,
 *   status: "ringing" | "waiting" | "astrologer_accepted" | "on_hold" | "on-going" | null,
 *   sessionId: string,    // session ID from server
 * }
 */

export const WaitingQueueProvider = ({ children }) => {
  const [pendingConnections, setPendingConnections] = useState(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const now = Date.now();
      // Filter out expired entries
      return parsed.filter((c) => now - c.timestamp < QUEUE_MAX_AGE);
    } catch {
      return [];
    }
  });

  const pendingConnectionsRef = useRef(pendingConnections);
  pendingConnectionsRef.current = pendingConnections;

  /*
   * Rooms whose deferred cancel has already been emitted.
   *
   * The same chat:room / call:room event is handled by both a page-level
   * listener and the global one in this provider, so assignRoomId can be called
   * twice for one room inside a single tick. pendingConnectionsRef only updates
   * on render, so both calls would see the same flagged entry and both emit.
   * This set is written synchronously, which makes the withdrawal exactly-once
   * regardless of render timing.
   */
  const deferredCancelSentRef = useRef(new Set());

  const persist = useCallback((connections) => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(connections));
    } catch { /* ignore */ }
  }, []);

  const addPendingConnection = useCallback((connection) => {
    setPendingConnections((prev) => {
      // Don't add duplicate by astrologer+type
      const exists = prev.some(
        (c) => c.astrologer?._id === connection.astrologer?._id && c.type === connection.type
      );
      if (exists) return prev;
      const next = [...prev, { ...connection, timestamp: Date.now() }];
      persist(next);
      return next;
    });
  }, [persist]);

  // Queue is no longer limited
  const isQueueFull = useCallback(() => false, []);

  // Update a pending connection (e.g., when roomId arrives from server)
  const updatePendingConnection = useCallback((astrologerId, type, updates) => {
    setPendingConnections((prev) => {
      const next = prev.map((c) => {
        if (c.astrologer?._id === astrologerId && c.type === type) {
          return { ...c, ...updates };
        }
        return c;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  // Assign roomId to a pending connection that doesn't have one yet.
  // Sets status to "ringing" by default when room is assigned (server created the room).
  //
  // The same room event is handled by multiple listeners (page-level + this global
  // provider), so this MUST be idempotent — otherwise a second call would assign an
  // already-used roomId to a different pending entry. That previously caused two
  // fanned-out entries to share a roomId, so cancelling one cancelled the other.
  // When the room event identifies the astrologer (astrologerId), we match the exact
  // pending entry; otherwise we fall back to the first pending of this type.
  const assignRoomId = useCallback((roomId, type, waitingTime, status = "ringing", astrologerId = null) => {
    const norm = (t) => (t === "chat" ? "chat" : t);
    const matchIn = (list) => {
      let idx = -1;
      // Prefer the exact astrologer when the room event identifies it.
      if (astrologerId) {
        idx = list.findIndex(
          (c) => c.astrologer?._id === astrologerId && norm(c.type) === norm(type) && !c.roomId
        );
      }
      /*
       * Fallback: first pending connection of this type without a roomId.
       *
       * Most call sites omit astrologerId, so this is the common path, and it has
       * to prefer a request the user still wants over one they withdrew. Matching
       * a withdrawn entry first would spend the incoming room on a cancel and
       * leave the live request holding `roomId: null` forever — no room, no
       * ringing, no way to cancel it either.
       */
      if (idx === -1) {
        idx = list.findIndex(
          (c) => norm(c.type) === norm(type) && !c.roomId && !c.cancelRequested
        );
      }
      // Only withdrawn entries left: this room belongs to one of them, so let the
      // deferred cancel below claim it.
      if (idx === -1) {
        idx = list.findIndex((c) => norm(c.type) === norm(type) && !c.roomId);
      }
      return idx;
    };

    /*
     * The user cancelled this request before the server had assigned it a
     * roomId, so the withdrawal could not be addressed to anything at the time.
     * The roomId has just arrived — send it now, and don't put the entry back on
     * screen as a live request.
     *
     * Checked here rather than inside the state updater because emitting a
     * socket event is a side effect, and because the updater can be re-run.
     */
    const current = pendingConnectionsRef.current;
    const pendingIdx = matchIn(current);
    const target = pendingIdx === -1 ? null : current[pendingIdx];

    if (target?.cancelRequested && roomId && !deferredCancelSentRef.current.has(roomId)) {
      deferredCancelSentRef.current.add(roomId);
      const eventName = norm(type) === "chat" ? "chat:cancel" : "call:cancel";
      voiceSocket.emit(eventName, { roomId, canceledBy: "CUSTOMER" });
      releaseRoom(roomId);
      setPendingConnections((prev) => {
        const next = prev.filter((c) => c.id !== target.id);
        if (next.length === prev.length) return prev;
        persist(next);
        if (next.length === 0) clearGuestFanoutFlags();
        return next;
      });
      return;
    }

    setPendingConnections((prev) => {
      // Idempotent: this room is already assigned — don't assign it again.
      if (prev.some((c) => c.roomId === roomId)) return prev;

      const idx = matchIn(prev);
      if (idx === -1) return prev;
      // Re-checked against the live list: a cancel can land between the read
      // above and this updater running.
      if (prev[idx].cancelRequested) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], roomId, id: roomId, waitingTime: waitingTime || next[idx].waitingTime, status };
      persist(next);
      return next;
    });
  }, [persist]);

  const removePendingConnection = useCallback((roomId) => {
    setPendingConnections((prev) => {
      const next = prev.filter((c) => c.roomId !== roomId);
      persist(next);
      return next;
    });
  }, [persist]);

  const removePendingByAstrologer = useCallback((astrologerId) => {
    setPendingConnections((prev) => {
      const next = prev.filter((c) => c.astrologer?._id !== astrologerId);
      persist(next);
      return next;
    });
  }, [persist]);

  /*
   * Safety net for a deferred cancel whose room event never arrives (socket drop,
   * server error). Without this the entry would sit on screen reading
   * "Cancelling…" indefinitely, which is a worse outcome than the silent removal
   * this whole mechanism replaced.
   */
  const scheduleDeferredCancelSweep = useCallback(() => {
    setTimeout(() => {
      setPendingConnections((prev) => {
        const next = prev.filter((c) => !(c.cancelRequested && !c.roomId));
        if (next.length === prev.length) return prev;
        persist(next);
        if (next.length === 0) clearGuestFanoutFlags();
        return next;
      });
    }, CANCEL_ROOM_WAIT_MS);
  }, [persist]);

  // Cancel and remove a specific pending connection
  const cancelPendingConnection = useCallback((roomId, type, astrologerId) => {
    if (roomId) {
      const conn = pendingConnectionsRef.current.find((c) => c.roomId === roomId);
      if (conn?.status === "on_hold") {
        const eventName = type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
        voiceSocket.emit(eventName, { roomId });
      } else if (conn?.status === "astrologer_accepted") {
        const eventName = type === "chat" ? "chat:user_reject" : "call:user_reject";
        voiceSocket.emit(eventName, { roomId });
      } else {
        const eventName = type === "chat" ? "chat:cancel" : "call:cancel";
        voiceSocket.emit(eventName, { roomId, canceledBy: "CUSTOMER" });
      }
      removePendingConnection(roomId);
      // If that was the last pending request, drop the guest auto-accept handshake
      // so a subsequent fresh request isn't auto-accepted.
      const remaining = pendingConnectionsRef.current.filter((c) => c.roomId !== roomId);
      if (remaining.length === 0) clearGuestFanoutFlags();
    } else if (astrologerId) {
      /*
       * No roomId yet, so there is nothing to address a withdrawal to.
       *
       * This branch used to call removePendingByAstrologer and stop there: the
       * card vanished but no cancel event was ever emitted, so the request stayed
       * live on the server. The astrologer then accepted it, chat:astrologer_accepted
       * came back, and the ring modal opened — with the looping ringtone — for a
       * chat the user had already withdrawn. And because the entry was gone,
       * isInQueue returned false, so tapping Chat again created a *second*
       * server-side request for the same astrologer, which is exactly the
       * duplicate isInQueue exists to prevent. That is the
       * initiate/cancel/initiate loop that shows up in session recordings.
       *
       * Hold the entry and flag it instead. assignRoomId emits the real cancel
       * the moment the roomId lands, and until then the flag keeps isInQueue
       * truthful so a re-tap is rejected rather than duplicated.
       */
      setPendingConnections((prev) => {
        const next = prev.map((c) =>
          c.astrologer?._id === astrologerId && !c.roomId && (!type || c.type === type)
            ? { ...c, status: "cancelling", cancelRequested: true }
            : c
        );
        persist(next);
        return next;
      });
      scheduleDeferredCancelSweep();
    }
  }, [removePendingConnection, persist, scheduleDeferredCancelSweep]);

  // Cancel ALL pending connections except the accepted one
  const cancelAllExcept = useCallback((acceptedRoomId) => {
    const current = pendingConnectionsRef.current;
    current.forEach((c) => {
      if (c.roomId && c.roomId !== acceptedRoomId) {
        if (c.status === "on_hold") {
          const eventName = c.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else if (c.status === "astrologer_accepted") {
          const eventName = c.type === "chat" ? "chat:user_reject" : "call:user_reject";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else {
          const eventName = c.type === "chat" ? "chat:cancel" : "call:cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId, canceledBy: "CUSTOMER" });
        }
      }
    });
    // Entries still without a roomId could not be withdrawn above, so keep them
    // flagged for assignRoomId rather than dropping them and leaking a live
    // server-side request — same reason as cancelPendingConnection.
    const next = markDeferredCancel(current, (c) => c.roomId === acceptedRoomId);
    setPendingConnections(next);
    persist(next);
    if (next.some((c) => c.cancelRequested)) scheduleDeferredCancelSweep();
  }, [persist, scheduleDeferredCancelSweep]);

  // Cancel all pending connections
  const cancelAll = useCallback(() => {
    const current = pendingConnectionsRef.current;
    current.forEach((c) => {
      if (c.roomId) {
        if (c.status === "on_hold") {
          const eventName = c.type === "chat" ? "chat:hold_cancel" : "call:hold_cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else if (c.status === "astrologer_accepted") {
          const eventName = c.type === "chat" ? "chat:user_reject" : "call:user_reject";
          voiceSocket.emit(eventName, { roomId: c.roomId });
        } else {
          const eventName = c.type === "chat" ? "chat:cancel" : "call:cancel";
          voiceSocket.emit(eventName, { roomId: c.roomId, canceledBy: "CUSTOMER" });
        }
      }
    });
    // Same as cancelAllExcept: anything without a roomId yet is held flagged so
    // assignRoomId can withdraw it for real.
    const next = markDeferredCancel(current);
    setPendingConnections(next);
    persist(next);
    if (next.length === 0) {
      // Everything withdrawn — drop the guest auto-accept handshake.
      clearGuestFanoutFlags();
    } else {
      scheduleDeferredCancelSweep();
    }
  }, [persist, scheduleDeferredCancelSweep]);

  // Check if a specific astrologer+type is already in the queue
  const isInQueue = useCallback((astrologerId, type) => {
    return pendingConnectionsRef.current.some(
      (c) => c.astrologer?._id === astrologerId && c.type === type
    );
  }, []);

  // Update status of a pending connection by roomId
  const updateStatusByRoomId = useCallback((roomId, status, extraData = {}) => {
    console.log("[WaitingQueue] 🔄 updateStatusByRoomId:", roomId, "→", status);
    setPendingConnections((prev) => {
      const matched = prev.find((c) => c.roomId === roomId);
      console.log("[WaitingQueue]   matched:", !!matched, "stored roomIds:", prev.map(c => c.roomId));
      const next = prev.map((c) => {
        if (c.roomId === roomId) {
          return { ...c, status, ...extraData };
        }
        return c;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  // Get a pending connection by roomId
  const getConnectionByRoomId = useCallback((roomId) => {
    return pendingConnectionsRef.current.find((c) => c.roomId === roomId) || null;
  }, []);

  // Get a pending connection by astrologerId
  const getConnectionByAstrologerId = useCallback((astrologerId) => {
    return pendingConnectionsRef.current.find((c) => c.astrologer?._id === astrologerId) || null;
  }, []);

  /*
   * True when the user has already withdrawn this request but the cancel is still
   * queued because the roomId had not arrived yet (see cancelPendingConnection).
   *
   * assignRoomId normally sends the withdrawal the instant the room event lands,
   * but the astrologer can accept in the same breath — the acceptance carries a
   * roomId and can be processed before, or instead of, the room event. Without
   * this check that acceptance rings for a chat the user already cancelled.
   *
   * Matches on astrologerId as well as roomId because the flagged entry may still
   * be holding `roomId: null`.
   */
  const isWithdrawn = useCallback((roomId, astrologerId, type) => {
    return pendingConnectionsRef.current.some(
      (c) =>
        c.cancelRequested &&
        ((roomId && c.roomId === roomId) ||
          (astrologerId && c.astrologer?._id === astrologerId && (!type || c.type === type)))
    );
  }, []);

  const hasAnyPending = pendingConnections.length > 0;

  /* ================= GLOBAL TWO-WAY ACCEPT LISTENERS ================= */
  // These run at app level so events are handled regardless of which page the user is on
  const { setCallApprovalData, callApprovalData, activeCall, setActiveCall, resetCallFlow, setCallSeconds } = useCall();
  const { setChatApprovalData, chatApprovalData, activeChat, setActiveChat, setChatSeconds, setWaitingList: setChatWaitingList, stopTimer: stopChatTimer } = useChat();
  const userIdLocal = localStorage.getItem("shubhtalk_customer_id");

  /*
    Live mirrors of the approval state, for the socket handlers below.

    Those handlers are registered in an effect keyed on [userIdLocal], so they
    are created once and close over the *first* render's `callApprovalData` /
    `chatApprovalData` — both `null`. Every guard of the shape

        if (callApprovalData?.roomId === roomId) setCallApprovalData(null);

    therefore evaluated `null?.roomId === roomId` → false, and never cleared the
    approval state. on_hold, ring_timeout, unavailable, canceled and rejected all
    called stopIncomingSound() directly so the ring went quiet, but the state
    behind it stayed set. Any later ring then flipped that state and re-ran the
    effect below, restarting a looping sound with no live "stop" path — a
    ringtone with no call on screen.

    Reading through refs makes the guards evaluate against the current value
    without re-registering the socket listeners on every approval change.
  */
  const callApprovalRef = useRef(null);
  const chatApprovalRef = useRef(null);
  useEffect(() => { callApprovalRef.current = callApprovalData; }, [callApprovalData]);
  useEffect(() => { chatApprovalRef.current = chatApprovalData; }, [chatApprovalData]);

  // Ring sound: loop while an astrologer has accepted and the user is being
  // asked to join (approval data is set), and stop the moment that state is
  // cleared — i.e. when the user joins, cancels, or rejects, or the ring ends
  // (on_hold / unavailable / timeout / accepted all clear the approval data).
  useEffect(() => {
    if (callApprovalData || chatApprovalData) {
      startIncomingSound();
    } else {
      stopIncomingSound();
    }
  }, [callApprovalData, chatApprovalData]);

  // Always stop the sound if the provider unmounts.
  useEffect(() => stopIncomingSound, []);

  useEffect(() => {
    if (!userIdLocal) return;

    const handleCallAstrologerAccepted = (data) => {
      console.log("[GlobalTwoWay] 📥 call:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;
      // Only ring in the tab that initiated this request. The event is broadcast
      // to every tab the user has open, so tabs that didn't start the request
      // (and have no accept/reject UI) must ignore it.
      if (!claimRoom(roomId, type || "audio")) {
        console.log("[GlobalTwoWay] ⏭️ Ignoring call:astrologer_accepted — not this tab's request", roomId);
        return;
      }
      // Already withdrawn by the user, cancel still queued for want of a roomId.
      // Reject rather than ring for a call they cancelled.
      if (roomId && isWithdrawn(roomId, astrologerId, type || "audio")) {
        console.log("[GlobalTwoWay] 🚫 User already cancelled — rejecting late call acceptance", roomId);
        stopIncomingSound();
        voiceSocket.emit("call:user_reject", { roomId });
        releaseRoom(roomId);
        removePendingByAstrologer(astrologerId);
        return;
      }

      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });

      // Guest fan-out straggler: another fanned-out astrologer already accepted
      // first, so withdraw this late acceptance instead of showing a ring popup.
      if (isGuestFanoutResolved() && roomId) {
        console.log("[GlobalTwoWay] 🚫 Guest fan-out already resolved — rejecting straggler call", roomId);
        stopIncomingSound();
        voiceSocket.emit("call:user_reject", { roomId });
        removePendingConnection(roomId);
        return;
      }

      // Guest call/video flow: auto-accept on the user's behalf (no accept popup).
      const guestAutoAcceptCall = sessionStorage.getItem(GUEST_AUTO_ACCEPT_KEY);
      if (guestAutoAcceptCall && roomId) {
        console.log("[GlobalTwoWay] 🤖 Guest auto-accept — emitting call:user_accept", roomId);
        stopIncomingSound();
        voiceSocket.emit("call:user_accept", { roomId });
        sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
        // First-accept-wins: mark resolved and withdraw all other fan-out requests.
        sessionStorage.setItem(GUEST_FANOUT_RESOLVED_KEY, String(Date.now()));
        cancelAllExcept(roomId);
        return;
      }

      setCallApprovalData({ roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency });
    };

    const handleChatAstrologerAccepted = (data) => {
      console.log("[GlobalTwoWay] 📥 chat:astrologer_accepted", JSON.stringify(data));
      const { roomId, sessionId, astrologerId, astrologerDetail, type, isEmergency } = data;
      if (!claimRoom(roomId, "chat")) {
        console.log("[GlobalTwoWay] ⏭️ Ignoring chat:astrologer_accepted — not this tab's request", roomId);
        return;
      }
      // Already withdrawn by the user, cancel still queued for want of a roomId.
      // Reject rather than ring for a chat they cancelled.
      if (roomId && isWithdrawn(roomId, astrologerId, "chat")) {
        console.log("[GlobalTwoWay] 🚫 User already cancelled — rejecting late chat acceptance", roomId);
        stopIncomingSound();
        voiceSocket.emit("chat:user_reject", { roomId });
        releaseRoom(roomId);
        removePendingByAstrologer(astrologerId);
        return;
      }

      if (roomId) updateStatusByRoomId(roomId, "astrologer_accepted", { sessionId });

      // Guest fan-out straggler: another fanned-out astrologer already accepted
      // first, so withdraw this late acceptance instead of showing a ring popup.
      if (isGuestFanoutResolved() && roomId) {
        console.log("[GlobalTwoWay] 🚫 Guest fan-out already resolved — rejecting straggler chat", roomId);
        stopIncomingSound();
        voiceSocket.emit("chat:user_reject", { roomId });
        removePendingConnection(roomId);
        return;
      }

      // Guest chat flow: auto-accept on the user's behalf (no accept popup).
      const guestAutoAccept = sessionStorage.getItem(GUEST_AUTO_ACCEPT_KEY);
      if (guestAutoAccept && roomId) {
        console.log("[GlobalTwoWay] 🤖 Guest auto-accept — emitting chat:user_accept", roomId);
        stopIncomingSound();
        voiceSocket.emit("chat:user_accept", { roomId });
        sessionStorage.removeItem(GUEST_AUTO_ACCEPT_KEY);
        // First-accept-wins: mark resolved and withdraw all other fan-out requests.
        sessionStorage.setItem(GUEST_FANOUT_RESOLVED_KEY, String(Date.now()));
        cancelAllExcept(roomId);
        return;
      }

      setChatApprovalData({ roomId, sessionId, astrologerId, astrologerDetail, type: type || "chat", isEmergency });
    };

    const handleCallOnHold = (data) => {
      console.log("[GlobalTwoWay] ⏸️ call:on_hold", JSON.stringify(data));
      // Ring expired / put on hold — stop the ring sound immediately.
      stopIncomingSound();
      const { roomId } = data;
      if (roomId) releaseRoom(roomId);
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
    };

    const handleChatOnHold = (data) => {
      console.log("[GlobalTwoWay] ⏸️ chat:on_hold", JSON.stringify(data));
      // Ring expired / put on hold — stop the ring sound immediately.
      stopIncomingSound();
      const { roomId } = data;
      if (roomId) releaseRoom(roomId);
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
      if (roomId) updateStatusByRoomId(roomId, "on_hold");
    };

    const handleCallUnavailable = (data) => {
      stopIncomingSound();
      const { roomId } = data;
      if (roomId) releaseRoom(roomId);
      if (roomId) removePendingConnection(roomId);
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
    };

    const handleChatUnavailable = (data) => {
      stopIncomingSound();
      const { roomId } = data;
      if (roomId) releaseRoom(roomId);
      if (roomId) removePendingConnection(roomId);
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
    };

    const handleCanceled = (data) => {
      stopIncomingSound();
      const canceledRoomId = data?.roomId || data?.sessionData?.roomId;
      if (canceledRoomId) {
        releaseRoom(canceledRoomId);
        removePendingConnection(canceledRoomId);
        if (callApprovalRef.current?.roomId === canceledRoomId) setCallApprovalData(null);
        if (chatApprovalRef.current?.roomId === canceledRoomId) setChatApprovalData(null);
      }
    };

    const handleRejected = (data) => {
      if (data?.switchRejected) return;
      stopIncomingSound();
      const rejectedRoomId = data?.roomId || data?.sessionData?.roomId;
      const rejectedAstrologerId = data?.astrologerId || data?.sessionData?.astrologerId;
      trackEvent("session_request_rejected", { astrologer_id: rejectedAstrologerId, channel: data?.type || "chat" });
      if (rejectedRoomId) {
        releaseRoom(rejectedRoomId);
        removePendingConnection(rejectedRoomId);
        if (callApprovalRef.current?.roomId === rejectedRoomId) setCallApprovalData(null);
        if (chatApprovalRef.current?.roomId === rejectedRoomId) setChatApprovalData(null);
      } else if (rejectedAstrologerId) {
        removePendingByAstrologer(rejectedAstrologerId);
      }

      // Show toast so user knows the request was rejected
      // Use setTimeout to avoid conflicting with page-level toast handlers
      setTimeout(() => {
        const label = data?.type === "chat" ? "chat" : "call";
        Toast.error(`Astrologer rejected the ${label} request`);
      }, 50);
    };

    const handleActivity = (data) => {
      if (data?.status === "ringing" && data?.roomId) {
        updateStatusByRoomId(data.roomId, "ringing");
        return;
      }

      // Dynamic wait time update — propagate new fields to pending connection
      if (data?.waitingTime !== undefined || data?.position !== undefined) {
        setPendingConnections((prev) => {
          let updated;
          // If roomId is present, update that specific entry
          if (data.roomId) {
            updated = prev.map((c) =>
              c.roomId === data.roomId
                ? { ...c, waitingTime: data.waitingTime, minWait: data.minWait, maxWait: data.maxWait, confidence: data.confidence, position: data.position }
                : c
            );
          } else {
            // No roomId — update all waiting entries (broadcast scenario)
            updated = prev.map((c) => {
              if (["ringing", "astrologer_accepted", "on_hold", "on-going"].includes(c.status)) return c;
              return { ...c, waitingTime: data.waitingTime, minWait: data.minWait, maxWait: data.maxWait, confidence: data.confidence, position: data.position };
            });
          }
          persist(updated);
          return updated;
        });
      }
    };

    // session:active_list — server sends all active sessions on connect/reconnect
    // This is the primary APP KILL & RESTORE mechanism per the integration guide.
    // On socket connect, server sends all active sessions for this user.
    // The server list is the source of truth — REPLACE local pending connections entirely.
    // Frontend restores UI based on each session's status:
    //   - ringing → show "Calling astrologer..." UI (via pendingConnections)
    //   - waiting → show "In queue, position X" UI (via pendingConnections)
    //   - astrologer_accepted → show "Accept/Reject" UI (via approval data)
    //   - on_hold → show "Unhold / Cancel" banner (via pendingConnections)
    //   - on-going → rejoin call/chat (via call:reconnect / chat:reconnect)
    const handleActiveList = (data) => {
      console.log("[GlobalTwoWay] 📋 session:active_list", JSON.stringify(data));
      const sessions = data?.sessions || [];

      // Replace pending connections with server state (non on-going sessions)
      const now = Date.now();
      const newConnections = [];

      sessions.forEach((session) => {
        const { roomId, status, type, astrologerId } = session;
        // on-going sessions are handled separately below via reconnect
        if (status === "on-going") return;

        const astro = typeof astrologerId === "object" ? astrologerId : { _id: astrologerId };
        newConnections.push({
          id: roomId,
          astrologer: astro,
          type: type || "chat",
          roomId,
          waitingTime: 5,
          timestamp: now,
          isEmergency: session.isEmergency || false,
          status: status || "ringing",
          sessionId: session.sessionId || session._id,
          // Preserve live stream origin info for UI (clickable name → navigate to live)
          fromLive: session.isLive || false,
          liveChannelId: session.liveRoomDetails?.channel || session.liveRoomDetails?.roomId || null,
        });
      });

      setPendingConnections(newConnections);
      persist(newConnections);

      // If any session is astrologer_accepted, set approval data
      sessions.forEach((session) => {
        if (session.status === "astrologer_accepted") {
          const astro = typeof session.astrologerId === "object" ? session.astrologerId : null;
          const ringData = {
            roomId: session.roomId,
            sessionId: session.sessionId || session._id,
            astrologerId: astro?._id || session.astrologerId,
            astrologerDetail: astro,
            type: session.type,
            isEmergency: session.isEmergency || false,
          };
          if (session.type === "chat") {
            setChatApprovalData(ringData);
          } else {
            setCallApprovalData(ringData);
          }
        }
      });

      // Handle on-going sessions — trigger reconnect if no active call/chat in context.
      // This covers the true "app kill" scenario where localStorage may have expired
      // but the server still has an active session within the 60s grace period.
      sessions.forEach((session) => {
        if (session.status !== "on-going") return;

        const { roomId, type, astrologerId, agoraToken, channelName, billedMinutes, user } = session;
        const astro = typeof astrologerId === "object" ? astrologerId : { _id: astrologerId };
        const astroId = astro?._id || astrologerId;
        const astroName = user?.astro
          ? getAstrologerDisplayName(user.astro)
          : getAstrologerDisplayName(astro);

        if (type === "chat") {
          // Only reconnect if ChatContext doesn't already have an active chat
          if (!activeChat?.roomId) {
            console.log("[GlobalTwoWay] 🔄 Restoring on-going chat session:", roomId);

            // Set active chat so ChatContext can handle the reconnected response
            setActiveChat({
              roomId,
              chatRoomId: roomId,
              callerName: astroName || "Astrologer",
              isUserSide: true,
              userId: userIdLocal,
              astrologerId: astroId,
              astrologerName: getAstrologerDisplayName(astro),
              astrologerImage: astro?.profileImgUrl || user?.astro?.profileImgUrl || null,
              remainingTime: billedMinutes || 0,
              callType: "chat",
            });

            voiceSocket.emit("chat:reconnect", {
              roomId,
              userId: userIdLocal,
              astrologerId: astroId,
              callType: "chat",
            });
          }
        } else {
          // audio or video — only reconnect if CallContext doesn't already have an active call
          if (!activeCall?.roomId) {
            console.log("[GlobalTwoWay] 🔄 Restoring on-going call session:", roomId);

            // Set active call so VoiceCall/VideoCall component renders
            setActiveCall({
              roomId,
              channelName: channelName || roomId,
              agoraToken: agoraToken || null,
              callerName: astroName || "Astrologer",
              isUserSide: true,
              callType: type || "audio",
              userId: userIdLocal,
              astrologerId: astroId,
              remainingTime: billedMinutes || 0,
              isEmergency: session.isEmergency || false,
              profileImgUrl: astro?.profileImgUrl || user?.astro?.profileImgUrl || null,
              origin: session.isLive ? "live" : undefined,
              liveChannel: session.liveRoomDetails?.channel || session.liveRoomDetails?.roomId || null,
            });

            voiceSocket.emit("call:reconnect", {
              roomId,
              userId: userIdLocal,
              astrologerId: astroId,
              callType: type || "audio",
            });
          }
        }
      });
    };

    // session:canceled — server auto-cancels sessions (e.g., live stream ended)
    const handleSessionCanceled = (data) => {
      console.log("[GlobalTwoWay] 🚫 session:canceled", JSON.stringify(data));
      const { roomId } = data || {};
      if (!roomId) return;

      // Remove from pending connections
      removePendingConnection(roomId);

      // Clear approval data if it matches
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
    };

    // session:dismissed — multi-device sync: another device already handled this session
    const handleSessionDismissed = (data) => {
      const { roomId, acceptedSocketId, reason, action } = data || {};
      if (!roomId) return;

      // If this socket triggered the action, ignore (already handled locally)
      if (acceptedSocketId && acceptedSocketId === voiceSocket.id) return;

      console.log("[GlobalTwoWay] 🔇 session:dismissed", reason, action, roomId);

      // Remove from pending connections
      removePendingConnection(roomId);

      // Clear approval popups if they match this roomId
      if (callApprovalRef.current?.roomId === roomId) setCallApprovalData(null);
      if (chatApprovalRef.current?.roomId === roomId) setChatApprovalData(null);
    };

    /* ================= GLOBAL CHAT:ENDED HANDLER ================= */
    // Ensures chat is cleaned up regardless of which page the user is on
    const handleGlobalChatEnded = (data) => {
      // Skip Pandit AI events
      if (data?.astrologerId === PANDIT_AI_ID) return;

      const endedRoomId = data?.roomId || data?.sessionData?.roomId;
      console.log("[GlobalEnded] 🔚 chat:ended — roomId:", endedRoomId, "endedBy:", data?.endedBy);

      // Skip SYSTEM ends — let page-level handler deal with reconnect logic
      if (data?.endedBy === "SYSTEM") return;

      // Remove from pending connections if still there
      if (endedRoomId) removePendingConnection(endedRoomId);

      // Clear approval data if it matches
      if (chatApprovalRef.current?.roomId === endedRoomId) setChatApprovalData(null);

      // Always clear active chat, stop timer, and clean up session
      // The server is authoritative — if it says chat ended, it ended
      setActiveChat(null);
      stopChatTimer();
      setChatSeconds(0);
      clearChatSession();
      localStorage.removeItem("shubhtalk_chat_start_time");

      // Show toast notification
      Toast.success("Chat ended.");

      const endReason = data?.endReason || data?.sessionData?.sessionEndReason;
      if (endReason === "low-balance" || endReason === "insufficient-balance") {
        trackEvent("session_auto_ended_low_balance", { astrologer_id: data?.astrologerId, session_id: endedRoomId });
      } else {
        trackEvent("session_ended_completely", { astrologer_id: data?.astrologerId, session_id: endedRoomId });
      }

      // Refresh wallet balance after chat ends
      window.dispatchEvent(new Event("walletBalanceUpdated"));

      // Dispatch event so page-level components can show feedback modal, disable input, etc.
      window.dispatchEvent(new CustomEvent("global:chat:ended", { detail: data }));
    };

    /* ================= GLOBAL CHAT/CALL ACCEPTED HANDLERS ================= */
    // These ensure the user is notified and navigated regardless of which page they're on.
    // Page-level handlers (TalkToAstrologer, useAstrologerConnection) may also fire,
    // but they use navigate() which is a no-op if we've already navigated via window.location.
    // We use a small delay to let page-level handlers run first if they exist.

    const handleGlobalChatAccepted = ({ roomId, astrologerId, userId, ...data }) => {
      // Skip Pandit AI events
      if (astrologerId === PANDIT_AI_ID) return;

      console.log("[GlobalAccepted] ✅ chat:accepted — roomId:", roomId, "astrologerId:", astrologerId);

      // A session has started — the guest fan-out is fully resolved.
      sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);

      // Clear approval data and remove from pending queue
      setChatApprovalData(null);
      releaseRoom(roomId);
      removePendingConnection(roomId);

      // Build astrologer info from event payload
      const astro = data?.astrologer || {};
      const astroName = getAstrologerDisplayName(astro);

      // Set active chat in context so ChatWindow can pick it up
      setActiveChat({
        roomId,
        chatRoomId: roomId,
        callerName: astroName || "Astrologer",
        isUserSide: true,
        userId: userIdLocal,
        astrologerId,
        astrologerName: getAstrologerDisplayName(astro),
        astrologerID: astro?.astrologer_ID,
        remainingTime: data?.remainingTime,
        isEmergency: data?.isEmergency || false,
        profileImgUrl: astro?.profileImgUrl,
        experience: astro?.experience,
      });
      setChatSeconds(Number(data?.remainingTime || 0) * 60);
      setChatWaitingList(false);

      // Navigate to chat page — use setTimeout to let any page-level handler run first
      setTimeout(() => {
        const isAlreadyOnChat = window.location.pathname.includes("/chat-to-astrologer");
        if (!isAlreadyOnChat && astrologerId) {
          console.log("[GlobalAccepted] 🚀 Navigating to chat page for astrologer:", astrologerId);
          // Pass profileImgUrl as query param so ChatWindow can pick it up
          const imgParam = astro?.profileImgUrl ? `?profileImgUrl=${encodeURIComponent(astro.profileImgUrl)}` : "";
          window.location.href = `/chat-to-astrologer/${astrologerId}${imgParam}`;
        }
      }, 100);
    };

    const handleGlobalCallAccepted = ({ roomId, token, channelName, type, remainingTime, astrologerId, isSwitch, ...rest }) => {
      console.log("[GlobalAccepted] ✅ call:accepted — roomId:", roomId, "type:", type);

      // Skip if this is a call upgrade/downgrade — CallContext handles those
      // (activeCall exists and type is switching between audio/video)
      // We read from the ref-synced state via the closure
      if (type === "video" && activeCall?.callType === "audio") {
        console.log("[GlobalAccepted] ⏭️ Video upgrade — CallContext handles this");
        return;
      }
      if (type === "audio" && activeCall?.callType === "video") {
        console.log("[GlobalAccepted] ⏭️ Audio downgrade — CallContext handles this");
        return;
      }

      // A session has started — the guest fan-out is fully resolved.
      sessionStorage.removeItem(GUEST_FANOUT_RESOLVED_KEY);

      // Look up pending connection BEFORE removing it — to preserve live origin info
      const connData = getConnectionByRoomId(roomId);

      // Clear approval data and remove from pending queue
      setCallApprovalData(null);
      releaseRoom(roomId);
      removePendingConnection(roomId);
      resetCallFlow();

      // Build astrologer info from event payload
      const astro = rest?.astrologer || {};
      const astroName = getAstrologerDisplayName(astro);
      const agoraChannel = channelName || roomId;

      // Determine if this call originated from a live stream
      const isFromLive = connData?.fromLive || connData?.origin === "live" || false;
      const liveChannel = connData?.liveChannelId || connData?.liveChannel || null;

      // Set active call in context — VoiceCall/VideoCall component renders globally
      setActiveCall({
        roomId,
        channelName: agoraChannel,
        agoraToken: token,
        callerName: astroName || "Astrologer",
        isUserSide: true,
        callType: type,
        userId: userIdLocal,
        astrologerId: astrologerId || astro?._id,
        astrologerID: astro?.astrologer_ID,
        remainingTime,
        experience: astro?.experience,
        isEmergency: rest?.isEmergency || false,
        profileImgUrl: astro?.profileImgUrl,
        ...(isFromLive && { origin: "live", liveChannel }),
      });
      setCallSeconds(Number(remainingTime || 0) * 60);
    };

    // Global call:room / chat:room — assign roomId and set status to "ringing"
    const handleGlobalCallRoom = (data) => {
      if (data?.roomId) {
        assignRoomId(data.roomId, data?.type || "audio", data?.waitingTime || 5, data?.status || "ringing", data?.recieverDetail?._id || data?.astrologerId);
      }
    };

    const handleGlobalChatRoom = (data) => {
      if (data?.roomId) {
        assignRoomId(data.roomId, "chat", data?.waitingTime || 2, data?.status || "ringing", data?.recieverDetail?._id || data?.astrologerId);
      }
    };

    voiceSocket.on("call:astrologer_accepted", handleCallAstrologerAccepted);
    voiceSocket.on("chat:astrologer_accepted", handleChatAstrologerAccepted);
    voiceSocket.on("call:on_hold", handleCallOnHold);
    voiceSocket.on("chat:on_hold", handleChatOnHold);
    voiceSocket.on("call:ring_timeout", handleCallOnHold);
    voiceSocket.on("chat:ring_timeout", handleChatOnHold);
    voiceSocket.on("call:unavailable", handleCallUnavailable);
    voiceSocket.on("chat:unavailable", handleChatUnavailable);
    voiceSocket.on("call:canceled", handleCanceled);
    voiceSocket.on("chat:canceled", handleCanceled);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("call:room", handleGlobalCallRoom);
    voiceSocket.on("chat:room", handleGlobalChatRoom);
    voiceSocket.on("session:active_list", handleActiveList);
    voiceSocket.on("session:canceled", handleSessionCanceled);
    voiceSocket.on("session:dismissed", handleSessionDismissed);
    voiceSocket.on("chat:accepted", handleGlobalChatAccepted);
    voiceSocket.on("call:accepted", handleGlobalCallAccepted);
    voiceSocket.on("chat:ended", handleGlobalChatEnded);

    // 409 — Astrologer is starting a live session, remove failed pending connection
    const handleInitiationError = (err) => {
      if (err?.statusCode === 409) {
        Toast.error(err?.message || "Astrologer is unavailable right now. Please try again shortly.");
        // Remove the most recently added pending connection (no roomId yet — failed before call:room/chat:room)
        const current = pendingConnectionsRef.current;
        const lastPending = current[current.length - 1];
        if (lastPending && !lastPending.roomId) {
          removePendingByAstrologer(lastPending.astrologer?._id);
        }
      }
    };
    voiceSocket.on("error", handleInitiationError);

    return () => {
      voiceSocket.off("call:astrologer_accepted", handleCallAstrologerAccepted);
      voiceSocket.off("chat:astrologer_accepted", handleChatAstrologerAccepted);
      voiceSocket.off("call:on_hold", handleCallOnHold);
      voiceSocket.off("chat:on_hold", handleChatOnHold);
      voiceSocket.off("call:ring_timeout", handleCallOnHold);
      voiceSocket.off("chat:ring_timeout", handleChatOnHold);
      voiceSocket.off("call:unavailable", handleCallUnavailable);
      voiceSocket.off("chat:unavailable", handleChatUnavailable);
      voiceSocket.off("call:canceled", handleCanceled);
      voiceSocket.off("chat:canceled", handleCanceled);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("call:room", handleGlobalCallRoom);
      voiceSocket.off("chat:room", handleGlobalChatRoom);
      voiceSocket.off("session:active_list", handleActiveList);
      voiceSocket.off("session:canceled", handleSessionCanceled);
      voiceSocket.off("session:dismissed", handleSessionDismissed);
      voiceSocket.off("chat:accepted", handleGlobalChatAccepted);
      voiceSocket.off("call:accepted", handleGlobalCallAccepted);
      voiceSocket.off("chat:ended", handleGlobalChatEnded);
      voiceSocket.off("error", handleInitiationError);
    };
  }, [userIdLocal]);

  return (
    <WaitingQueueContext.Provider
      value={{
        pendingConnections,
        addPendingConnection,
        updatePendingConnection,
        assignRoomId,
        removePendingConnection,
        removePendingByAstrologer,
        cancelPendingConnection,
        cancelAllExcept,
        cancelAll,
        isInQueue,
        isQueueFull,
        hasAnyPending,
        updateStatusByRoomId,
        getConnectionByRoomId,
        getConnectionByAstrologerId,
      }}
    >
      {children}
    </WaitingQueueContext.Provider>
  );
};

export const useWaitingQueue = () => {
  const context = useContext(WaitingQueueContext);
  if (!context) {
    throw new Error("useWaitingQueue must be used within a WaitingQueueProvider");
  }
  return context;
};

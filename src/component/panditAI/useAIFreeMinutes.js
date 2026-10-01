import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useLazyGetWalletBalanceQuery } from "../../redux/api/wallet/walletApi";
import { trackEvent } from "../../utils/analytics";
import { isForeignToPanditAI, panditAIOwnsError } from "./usePanditAI";

/**
 * Hook that manages the AI free-minutes state machine.
 * Handles activity ticks, insufficient-balance warnings, free-window renewal,
 * and reconnect state restoration.
 */
export default function useAIFreeMinutes({ isOpen, roomId }) {
  // Session billing state
  const [isFreePeriod, setIsFreePeriod] = useState(false);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(null);
  const [freeMinutesUsed, setFreeMinutesUsed] = useState(0);
  const [freeMinutesAllocated, setFreeMinutesAllocated] = useState(10);
  const [walletBalance, setWalletBalance] = useState(null);
  const [ratePerMinute, setRatePerMinute] = useState(null);
  const [remainingPaidTime, setRemainingPaidTime] = useState(null);
  const [dayKeyIST, setDayKeyIST] = useState(null);

  // Recharge banner state
  const [showRechargeBanner, setShowRechargeBanner] = useState(false);
  const [rechargeBannerMessage, setRechargeBannerMessage] = useState(null);
  const [minutesUntilPaid, setMinutesUntilPaid] = useState(null);
  const [minBalanceRequired, setMinBalanceRequired] = useState(null);

  // Session ended due to low balance
  const [sessionEndedLowBalance, setSessionEndedLowBalance] = useState(false);

  // Free window renewed toast
  const [freeWindowRenewed, setFreeWindowRenewed] = useState(false);

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // Fire the free→paid transition analytics only once per session.
  const paidStartedRef = useRef(false);

  // Fetch wallet balance on open
  const [getWalletBalance] = useLazyGetWalletBalanceQuery();

  useEffect(() => {
    if (!isOpen) return;
    // Guests (no logged-in customer) have no wallet. Calling the authenticated
    // wallet-balance endpoint would 401 and trigger the global login redirect,
    // kicking the guest out of the inline registration form. Skip it until they
    // finish registering.
    if (!localStorage.getItem("shubhtalk_customer_id")) return;
    getWalletBalance().then((res) => {
      if (res?.data?.data !== undefined && !isNaN(res.data.data)) {
        setWalletBalance(Number(res.data.data));
      }
    });
  }, [isOpen, getWalletBalance]);

  // No local countdown — just display what the backend sends via activity events

  // Latest wallet/rate for deriving a paid timer when an event omits one.
  const walletBalanceRef = useRef(walletBalance);
  walletBalanceRef.current = walletBalance;
  const ratePerMinuteRef = useRef(ratePerMinute);
  ratePerMinuteRef.current = ratePerMinute;

  // Socket event handlers
  useEffect(() => {
    if (!isOpen) return;

    /*
      Put the session in the paid state (SHB-2116): free badge off, paid badge
      (balance, ₹/min, remaining time) on. Used when a session starts or resumes
      with no free minutes left.

      The paid badge needs a remaining time. If the event carries none, derive it
      from wallet ÷ rate (whole minutes, in seconds — the same unit as the
      backend's `remainingTime`). If even that is impossible, keep the zero free
      count so the header still says "Free time used" rather than going blank
      (see the badge notes in PanditAIBubble) until the first `activity` tick.
    */
    const applyPaidState = (data, fmr) => {
      setIsFreePeriod(false);
      const rawBalance =
        data?.walletBalance !== undefined && data?.walletBalance !== null
          ? data.walletBalance
          : walletBalanceRef.current;
      // Unknown balance (null) must not read as ₹0 and show a 00:00 timer.
      const balance = rawBalance === null || rawBalance === undefined ? NaN : Number(rawBalance);
      const rate = Number(
        data?.ratePerMinute || data?.astrologer?.price?.chatRate?.amount || ratePerMinuteRef.current
      );
      let remaining = data?.remainingTime;
      if ((remaining === undefined || remaining === null) && rate > 0 && Number.isFinite(balance)) {
        remaining = Math.max(0, Math.floor(balance / rate)) * 60;
        setRemainingPaidTime(remaining);
      }
      if (remaining !== undefined && remaining !== null) {
        setFreeMinutesRemaining(null);
      } else {
        setFreeMinutesRemaining(fmr !== undefined && fmr !== null ? fmr : null);
      }
    };

    const handleChatAccepted = (data) => {
      if (data?.astrologerId !== "6928390dc00d56953b586c04") return;
      // Clear previous session's recharge state
      setShowRechargeBanner(false);
      setSessionEndedLowBalance(false);
      setRechargeBannerMessage(null);
      // Free chat starts at 5 minutes (backend sends `freeMinutesRemaining`).
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      const freeMin = fmr !== undefined && fmr !== null ? fmr : 5;
      if (data.freeMinutesUsedToday !== undefined) setFreeMinutesUsed(data.freeMinutesUsedToday);
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
      // Extract ratePerMinute from astrologer pricing if not directly provided
      if (!data.ratePerMinute && data.astrologer?.price?.chatRate?.amount) {
        setRatePerMinute(data.astrologer.price.chatRate.amount);
      }
      if (data.remainingTime !== undefined) {
        setRemainingPaidTime(data.remainingTime);
      }

      /*
        SHB-2116 — a NEW chat after today's free minutes are used up.

        chat:accepted reports `freeMinutesRemaining: 0` for such a user. That
        used to be stored as-is, and the header's free badge renders 0 as "Free
        time used" while the paid badge (balance · ₹/min · timer) requires
        freeMinutesRemaining == null. So a new paid chat opened on "Free time
        used" and stayed there until the first `activity` tick, which is what
        flips freeMinutesRemaining to null. A page refresh "fixed" it, presumably
        because the chat:reconnect payload carries no free count for a paid
        session (inferred from the reported behaviour, not seen on the wire).

        A session that STARTS with zero free minutes is a paid session from its
        first second, so put it in the paid state straight away. Users who still
        have free minutes (fmr > 0) are untouched.
      */
      if (freeMin > 0) {
        setFreeMinutesRemaining(freeMin);
        setIsFreePeriod(true);
      } else {
        applyPaidState(data, freeMin);
      }
    };

    const handleActivity = (data) => {
      // Only process if this is for our room or is an AI session event.
      // `activity` is also the astrologer chat/call billing tick; applying it
      // here flipped Pandit AI to "paid" with the astrologer session's wallet
      // and remaining time.
      if (isForeignToPanditAI(data, roomIdRef.current)) return;

      // Free vs paid is decided purely by presence of `freeMinutesRemaining`.
      // Present  -> still in the 5-minute free window (counts down 4→3→2→1).
      // Absent   -> free window used up; paid wallet billing has started.
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      if (fmr !== undefined && fmr !== null) {
        setFreeMinutesRemaining(fmr);
        setIsFreePeriod(fmr > 0);
        // In the free window there is no paid countdown to show.
        setRemainingPaidTime(null);
      } else {
        setIsFreePeriod(false);
        setFreeMinutesRemaining(null);
        if (data.remainingTime !== undefined) setRemainingPaidTime(data.remainingTime);
        if (!paidStartedRef.current) {
          paidStartedRef.current = true;
          trackEvent("ai_pandit_free_quota_exhausted", { mode: "text", minutes_used: data.freeMinutesUsedToday });
          trackEvent("ai_pandit_paid_session_started", { mode: "text", rate_per_min: data.ratePerMinute });
        }
      }

      if (data.freeMinutesUsedToday !== null && data.freeMinutesUsedToday !== undefined) {
        setFreeMinutesUsed(data.freeMinutesUsedToday);
      }
      if (data.freeMinutesAllocated !== null && data.freeMinutesAllocated !== undefined) {
        setFreeMinutesAllocated(data.freeMinutesAllocated);
      }
      if (data.dayKeyIST) {
        setDayKeyIST(data.dayKeyIST);
      }
      if (data.walletBalance !== undefined) {
        setWalletBalance(data.walletBalance);
      }
      if (data.ratePerMinute !== undefined) {
        setRatePerMinute(data.ratePerMinute);
      }

      // Auto-dismiss recharge banner if wallet is now sufficient
      if (showRechargeBanner && data.walletBalance >= data.ratePerMinute * 5) {
        setShowRechargeBanner(false);
        setMinutesUntilPaid(null);
        setMinBalanceRequired(null);
        // Also lift the session-ended lock. An `activity` tick means the backend
        // is billing this room again, so the session is demonstrably alive — and
        // leaving the flag set keeps the composer hidden in PanditAIBubble, which
        // is what stranded Clarity session cxqsp4 after it recharged.
        //
        // Whether the backend still emits `activity` after ending a chat for low
        // balance is NOT verified from this repo; if it does not, this branch
        // simply never runs and the explicit "New chat" button in the banner is
        // the route back. Clearing it here costs nothing either way.
        setSessionEndedLowBalance(false);
      }
    };

    const handleInsufficientBalance = (data) => {
      if (isForeignToPanditAI(data, roomIdRef.current)) return;

      setShowRechargeBanner(true);
      // Prefer the backend-provided message; fall back to a default.
      setRechargeBannerMessage(data.message || "Recharge to keep chatting");
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
      const minReq = data.minRequired ?? data.minBalanceRequired;
      if (minReq !== undefined) {
        setMinBalanceRequired(minReq);
      }
      if (data.minutesUntilPaid !== undefined) {
        setMinutesUntilPaid(data.minutesUntilPaid);
      }
      if (data.remainingTime !== undefined) {
        setRemainingPaidTime(data.remainingTime);
      }
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      if (fmr !== undefined && fmr !== null) {
        setFreeMinutesRemaining(fmr);
      }
    };

    // Low-balance "warning" (paid mode) — show the alert without ending the
    // session. Backend sends e.g. "Low balance alert! Remaining time: 1 min."
    const handleWarning = (data) => {
      if (isForeignToPanditAI(data, roomIdRef.current)) return;
      if (data?.message) {
        setShowRechargeBanner(true);
        setRechargeBannerMessage(data.message);
      }
    };

    const handleChatEnded = (data) => {
      if (isForeignToPanditAI(data, roomIdRef.current)) return;

      setRemainingPaidTime(null);
      setFreeMinutesRemaining(null);

      if (data?.endReason === "low-balance") {
        setSessionEndedLowBalance(true);
        setShowRechargeBanner(true);
        setRechargeBannerMessage("Chat ended due to low balance. Recharge to continue.");
      }
    };

    const handleFreeWindowRenewed = (data) => {
      if (isForeignToPanditAI(data, roomIdRef.current)) return;

      setFreeWindowRenewed(true);
      setIsFreePeriod(true);
      setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      setDayKeyIST(data.dayKeyIST);
      // Auto-dismiss the toast after 4 seconds
      setTimeout(() => setFreeWindowRenewed(false), 4000);
    };

    const handleReconnected = (data) => {
      if (isForeignToPanditAI(data, roomIdRef.current)) return;

      // Full state refresh from reconnect
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      if (data.freeMinutesUsedToday !== undefined) setFreeMinutesUsed(data.freeMinutesUsedToday);
      if (data.freeMinutesAllocated !== undefined) setFreeMinutesAllocated(data.freeMinutesAllocated);
      if (data.dayKeyIST) setDayKeyIST(data.dayKeyIST);
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
      if (data.remainingTime !== undefined) setRemainingPaidTime(data.remainingTime);
      // Extract ratePerMinute from astrologer pricing if not directly provided
      if (!data.ratePerMinute && data.astrologer?.price?.chatRate?.amount) {
        setRatePerMinute(data.astrologer.price.chatRate.amount);
      }
      if (fmr !== undefined && fmr !== null && fmr > 0) {
        setFreeMinutesRemaining(fmr);
        setIsFreePeriod(true);
      } else {
        // Absent or 0 -> paid. Same normalisation as chat:accepted (SHB-2116),
        // so a reconnect and a fresh chat land on the same header.
        applyPaidState(data, fmr);
      }
    };

    const handleError = (data) => {
      // Only Pandit AI's own errors — an insufficient-balance error about the
      // astrologer chat/call must not end this session's composer.
      if (!panditAIOwnsError(data, roomIdRef.current)) return;
      if (data?.message?.toLowerCase().includes("insufficient balance")) {
        setShowRechargeBanner(true);
        setSessionEndedLowBalance(true);
        setRechargeBannerMessage(data.message);
      }
    };

    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("activity", handleActivity);
    // New backend event name (snake_case) + legacy name kept for safety.
    voiceSocket.on("insufficient_balance", handleInsufficientBalance);
    voiceSocket.on("chat:insufficient-balance", handleInsufficientBalance);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("chat:free-window-renewed", handleFreeWindowRenewed);
    voiceSocket.on("chat:reconnected", handleReconnected);
    voiceSocket.on("error", handleError);
    // Paid-mode low-balance alert.
    voiceSocket.on("warning", handleWarning);

    return () => {
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("insufficient_balance", handleInsufficientBalance);
      voiceSocket.off("chat:insufficient-balance", handleInsufficientBalance);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("chat:free-window-renewed", handleFreeWindowRenewed);
      voiceSocket.off("chat:reconnected", handleReconnected);
      voiceSocket.off("error", handleError);
      voiceSocket.off("warning", handleWarning);
    };
  }, [isOpen, showRechargeBanner]);

  // Reset state when chat closes
  const resetFreeMinutesState = useCallback(() => {
    setShowRechargeBanner(false);
    setSessionEndedLowBalance(false);
    setFreeWindowRenewed(false);
    setMinutesUntilPaid(null);
    setMinBalanceRequired(null);
    setRemainingPaidTime(null);
    setFreeMinutesRemaining(null);
    setIsFreePeriod(false);
    paidStartedRef.current = false;
  }, []);

  // Auto-reset when popup closes
  useEffect(() => {
    if (!isOpen) {
      resetFreeMinutesState();
    }
  }, [isOpen, resetFreeMinutesState]);

  // Dismiss the recharge banner (user manually closes it)
  const dismissRechargeBanner = useCallback(() => {
    setShowRechargeBanner(false);
  }, []);

  return {
    // Free-period state
    isFreePeriod,
    freeMinutesRemaining,
    freeMinutesUsed,
    freeMinutesAllocated,
    dayKeyIST,

    // Paid-period state
    remainingPaidTime,
    walletBalance,
    ratePerMinute,

    // Recharge banner
    showRechargeBanner,
    rechargeBannerMessage,
    minutesUntilPaid,
    minBalanceRequired,
    dismissRechargeBanner,

    // Session end
    sessionEndedLowBalance,

    // Free window renewed
    freeWindowRenewed,

    // Reset
    resetFreeMinutesState,
  };
}

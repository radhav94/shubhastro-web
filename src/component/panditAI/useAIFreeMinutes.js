import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useLazyGetWalletBalanceQuery } from "../../redux/api/wallet/walletApi";

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

  // Fetch wallet balance on open
  const [getWalletBalance] = useLazyGetWalletBalanceQuery();

  useEffect(() => {
    if (!isOpen) return;
    getWalletBalance().then((res) => {
      if (res?.data?.data !== undefined && !isNaN(res.data.data)) {
        setWalletBalance(Number(res.data.data));
      }
    });
  }, [isOpen, getWalletBalance]);

  // No local countdown — just display what the backend sends via activity events

  // Socket event handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleChatAccepted = (data) => {
      if (data?.astrologerId !== "6928390dc00d56953b586c04") return;
      // Clear previous session's recharge state
      setShowRechargeBanner(false);
      setSessionEndedLowBalance(false);
      setRechargeBannerMessage(null);
      // Free chat starts at 5 minutes (backend sends `freeMinutesRemaining`).
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      const freeMin = fmr !== undefined && fmr !== null ? fmr : 5;
      setFreeMinutesRemaining(freeMin);
      setIsFreePeriod(freeMin > 0);
      if (data.freeMinutesUsedToday !== undefined) setFreeMinutesUsed(data.freeMinutesUsedToday);
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
      if (data.remainingTime !== undefined) {
        setRemainingPaidTime(data.remainingTime);
      }
      // Extract ratePerMinute from astrologer pricing if not directly provided
      if (!data.ratePerMinute && data.astrologer?.price?.chatRate?.amount) {
        setRatePerMinute(data.astrologer.price.chatRate.amount);
      }
    };

    const handleActivity = (data) => {
      // Only process if this is for our room or is an AI session event
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

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
      }
    };

    const handleInsufficientBalance = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

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
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;
      if (data?.message) {
        setShowRechargeBanner(true);
        setRechargeBannerMessage(data.message);
      }
    };

    const handleChatEnded = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      setRemainingPaidTime(null);
      setFreeMinutesRemaining(null);

      if (data?.endReason === "low-balance") {
        setSessionEndedLowBalance(true);
        setShowRechargeBanner(true);
        setRechargeBannerMessage("Chat ended due to low balance. Recharge to continue.");
      }
    };

    const handleFreeWindowRenewed = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      setFreeWindowRenewed(true);
      setIsFreePeriod(true);
      setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      setDayKeyIST(data.dayKeyIST);
      // Auto-dismiss the toast after 4 seconds
      setTimeout(() => setFreeWindowRenewed(false), 4000);
    };

    const handleReconnected = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      // Full state refresh from reconnect
      const fmr = data.freeMinutesRemaining ?? data.freeMinutesRemainingToday;
      if (fmr !== undefined && fmr !== null) {
        setFreeMinutesRemaining(fmr);
        setIsFreePeriod(fmr > 0);
      } else {
        setIsFreePeriod(false);
        setFreeMinutesRemaining(null);
      }
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
    };

    const handleError = (data) => {
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
